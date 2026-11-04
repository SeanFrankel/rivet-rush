"use strict";
// Exercise actual sockets and the fixed-rate server in real time. No artificial fast-forward.
const { performance, monitorEventLoopDelay } = require("node:perf_hooks");
const { createHost } = require("../server/host");
const { WebSocket } = require("ws");
const wire = require("../protocol");
const Yard = require("../match");
const { fork } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const duration = Number(process.argv[2] || 60);
const roomCount = Number(process.argv[3] || 4);
if (!(duration > 0 && roomCount >= 1 && roomCount <= 4 && Number.isInteger(roomCount))) {
  throw Error("Use node tools/soak.cjs <minutes> <rooms 1–4>");
}
const isolated = process.argv[4] === "isolated";
const child = isolated
  ? fork(path.join(__dirname, "soak-host.cjs"), [], {
      stdio: ["ignore", "inherit", "inherit", "ipc"],
    })
  : null;
let hostSample = null;
if (child)
  child.on("message", (sample) => {
    hostSample = sample;
  });
const host = isolated ? null : createHost(),
  pilots = [],
  groups = [];
const delay = monitorEventLoopDelay({ resolution: 10 });
const start = performance.now();
let bytes = 0,
  packets = 0,
  ended = 0,
  errors = 0,
  maxRss = 0;
let closing = false;
let warmHostMiB = null,
  peakHostMiB = 0;
function connect(url, group, index) {
  const ws = new WebSocket(url);
  const p = { ws, seat: index, room: null, matchId: null, seq: 0 };
  pilots.push(p);
  const send = (obj) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  };
  ws.on("open", () =>
    send(
      index
        ? { type: "join", version: wire.version, room: group.room }
        : { type: "create", version: wire.version },
    ),
  );
  ws.on("message", (data) => {
    bytes += data.length;
    packets++;
    const msg = JSON.parse(data);
    if (msg.type === "error") {
      errors++;
      console.error("Rejected", msg.message);
    }
    if (msg.type === "seat") {
      group.room = msg.room;
      p.room = msg.room;
      p.seat = msg.seat;
      if (index < 3) connect(url, group, index + 1);
    }
    if (msg.type === "lobby" && msg.phase === "lobby") {
      p.matchId = null;
      if (!msg.seats[p.seat]?.ready && !p.readySent) {
        p.readySent = true;
        send({ type: "ready", ready: true });
      }
      if (index === 0 && msg.seats.every((s) => s?.ready) && !group.startSent) {
        group.startSent = true;
        send({ type: "start" });
      }
    }
    if (msg.type === "state") {
      p.matchId = msg.matchId;
      if (msg.phase === "end") {
        p.readySent = false;
        if (index === 0 && group.lastEnd !== msg.matchId) {
          group.lastEnd = msg.matchId;
          group.startSent = false;
          ended++;
          send({ type: "rematch" });
        }
        return;
      }
      const game = wire.unpack(msg.game, Yard.stats, Yard.kits);
      const u = game.units.find((unit) => unit.kind === "pilot" && unit.seat === p.seat);
      const rivals = game.units.filter((unit) => unit.team !== u.team && unit.hp > 0);
      const target = rivals.sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
      const dx = target ? target.x - u.x : u.dir * 400;
      const active = group.attackTeam === u.team;
      const move = active && (Math.abs(dx) > 140 || Math.sign(dx) !== u.dir);
      send({
        type: "input",
        matchId: p.matchId,
        seq: ++p.seq,
        mask: wire.encode({
          right: move && dx > 0,
          left: move && dx < 0,
          fire: active,
          jump: active && msg.game.tick % 111 === 0,
          dash: active && msg.game.tick % 129 === 0,
          pulse: active && Math.abs(dx) < 110,
          buy: active && u.scrap >= 12 && u.rank < 3,
        }),
      });
    }
  });
  ws.on("error", (error) => {
    if (!closing) {
      errors++;
      console.error(error.message);
    }
  });
  ws.on("close", () => {
    if (!closing) {
      errors++;
      console.error("Unexpected disconnect");
    }
  });
}
function report() {
  const rss = process.memoryUsage().rss / 1048576;
  maxRss = Math.max(maxRss, rss);
  if (hostSample) {
    peakHostMiB = Math.max(peakHostMiB, hostSample.rssMiB);
    if (warmHostMiB === null && performance.now() - start >= 60000) warmHostMiB = hostSample.rssMiB;
  }
  console.log(
    JSON.stringify({
      minutes: +((performance.now() - start) / 60000).toFixed(2),
      clients: pilots.filter((p) => p.ws.readyState === WebSocket.OPEN).length,
      rooms: hostSample?.rooms ?? host.rooms.size,
      matches: (hostSample?.metrics ?? host.metrics).matches,
      finished: ended,
      packets,
      MiB: +(bytes / 1048576).toFixed(1),
      rssMiB: +rss.toFixed(1),
      peakSampleMiB: +maxRss.toFixed(1),
      loopP95ms: +(delay.percentile(95) / 1e6).toFixed(1),
      droppedCatchups: (hostSample?.metrics ?? host.metrics).droppedTicks,
      tickP95ms: +(hostSample?.tickP95ms ?? host.tickCost.percentile(95) / 1e6).toFixed(3),
      tickP99ms: +(hostSample?.tickP99ms ?? host.tickCost.percentile(99) / 1e6).toFixed(3),
      ...(isolated
        ? {
            hostRssMiB: +hostSample.rssMiB.toFixed(1),
            warmHostMiB,
            peakHostMiB: +peakHostMiB.toFixed(1),
            separateHost: true,
          }
        : {}),
      errors,
    }),
  );
}
async function run() {
  let port;
  if (isolated) {
    if (!hostSample) await once(child, "message");
    port = hostSample.port;
  } else {
    host.server.listen(0, "127.0.0.1");
    await once(host.server, "listening");
    port = host.server.address().port;
  }
  const url = "ws://127.0.0.1:" + port + "/arena";
  delay.enable();
  for (let i = 0; i < roomCount; i++) {
    const group = { room: null, attackTeam: i % 2 };
    groups.push(group);
    connect(url, group, 0);
  }
  const timer = setInterval(report, 60000);
  setTimeout(async () => {
    clearInterval(timer);
    report();
    closing = true;
    delay.disable();
    for (const p of pilots) {
      if (p.ws.readyState === WebSocket.OPEN) p.ws.send(JSON.stringify({ type: "leave" }));
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
    for (const p of pilots) p.ws.terminate();
    if (isolated) {
      child.send("sample");
      await once(child, "message");
      console.log(
        JSON.stringify({
          cleanup: true,
          rooms: hostSample.rooms,
          hostRssMiB: +hostSample.rssMiB.toFixed(1),
          warmHostMiB,
          memoryRatio: warmHostMiB ? +(hostSample.rssMiB / warmHostMiB).toFixed(3) : null,
        }),
      );
      child.send("close");
      await once(child, "exit");
    } else await host.close();
    if (errors || ended < roomCount || (hostSample?.metrics ?? host.metrics).finished !== ended)
      process.exitCode = 1;
  }, duration * 60000);
}
run().catch((error) => {
  console.error(error);
  child?.kill();
  host?.close();
  process.exitCode = 1;
});
