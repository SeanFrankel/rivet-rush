"use strict";
// Run only against a host you operate. Creates one temporary four-seat room.
const { WebSocket } = require("ws"),
  { once } = require("node:events");
const { setTimeout: wait } = require("node:timers/promises");
const assert = require("node:assert/strict"),
  wire = require("../protocol"),
  Yard = require("../match"),
  Replay = require("../replay");
async function smoke(address, options = {}) {
  const base = new URL(address),
    socketURL = new URL("/arena", base);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password)
    throw Error("Use an HTTP(S) host URL without credentials");
  socketURL.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  const health = async () => {
    const response = await fetch(new URL("/health", base), {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200, "health request");
    return response.json();
  };
  const before = await health();
  assert.equal(before.protocol, wire.version, "Use the same client build as staging");
  assert.equal(before.rules, Replay.rules, "Use the same replay rules as staging");
  assert.equal(before.draining, false, "Host is draining");
  assert.ok(before.rooms < before.capacity, "Host has no room for a smoke test");
  const clients = [],
    errors = [];
  const start = Date.now();
  let roomID,
    matchID,
    reconnectMs = null,
    disconnected = false,
    readyForRematch = false;
  function send(p, message) {
    if (p.ws.readyState === WebSocket.OPEN) p.ws.send(JSON.stringify(message));
  }
  async function until(check, timeout = 10000, description = "room response") {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (errors.length) throw Error(errors[0]);
      const value = check();
      if (value) return value;
      await wait(25);
    }
    throw Error("Timed out waiting for " + description);
  }
  async function connect(p, secret) {
    p.ws = new WebSocket(socketURL, { origin: base.origin });
    p.ws.on("error", (error) => errors.push(error.message));
    p.ws.on("message", (raw) => {
      const msg = JSON.parse(raw);
      if (msg.type === "error") errors.push(msg.message);
      if (msg.type === "seat") {
        p.secret = msg.secret;
        p.seat = msg.seat;
        p.seated = true;
        roomID = msg.room;
      }
      if (msg.type === "lobby") {
        p.lobby = msg;
        if (msg.phase === "lobby" && !p.readySent) {
          p.readySent = true;
          send(p, { type: "ready", ready: true });
        }
      }
      if (msg.type === "replay") p.replay = msg.record;
      if (msg.type !== "state") return;
      p.state = msg;
      if (msg.phase === "end") {
        p.result = {
          match: msg.matchId,
          winner: msg.game.winner,
          tick: msg.game.tick,
        };
        return;
      }
      if (readyForRematch) return;
      const game = wire.unpack(msg.game, Yard.stats, Yard.kits);
      const u = game.units.find((u) => u.seat === p.seat),
        active = u.team === 0;
      const target = game.units
        .filter((u) => u.hp && u.team === 1 && u.kind !== "keeper")
        .sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
      const dx = target ? target.x - u.x : 0;
      send(p, {
        type: "input",
        matchId: msg.matchId,
        seq: ++p.seq,
        mask: wire.encode({
          right: active && dx > u.range - 30,
          left: active && dx < 0,
          fire: active,
          pulse: active && Math.abs(dx) < 110,
          buy: active && u.rank - u.driveRank - u.coilRank < 3,
          coil: active && u.rank - u.driveRank - u.coilRank >= 3,
        }),
      });
    });
    await once(p.ws, "open");
    send(
      p,
      roomID
        ? { type: "join", room: roomID, secret, version: wire.version }
        : { type: "create", version: wire.version },
    );
    await until(() => p.seated, 10000, "seat");
  }
  try {
    for (let i = 0; i < 4; i++) {
      const p = { seq: 0 };
      clients.push(p);
      await connect(p);
    }
    await until(() => clients[0].lobby?.seats.every((p) => p?.ready), 10000, "ready crew");
    send(clients[0], { type: "start" });
    await until(() => clients.every((p) => p.state?.phase === "play"));
    matchID = clients[0].state.matchId;
    if (options.reconnect !== false) {
      const p = clients[2],
        secret = p.secret;
      p.ws.close();
      await once(p.ws, "close");
      p.seated = false;
      p.state = null;
      await wait(10000);
      const reconnectAt = Date.now();
      await connect(p, secret);
      await until(() => p.state?.matchId === matchID, 5000, "reserved pilot recovery");
      reconnectMs = Date.now() - reconnectAt;
      disconnected = true;
      assert.equal(p.seat, 2);
    }
    await until(() => clients.every((p) => p.result), 430000, "completed match");
    for (const p of clients) assert.deepEqual(p.result, clients[0].result);
    send(clients[0], { type: "replay" });
    const record = await until(() => clients[0].replay);
    const replay = Replay.load(record);
    while (replay.advance()) {}
    assert.equal(replay.verified(), true, "authoritative input replay");
    readyForRematch = true;
    for (const p of clients) {
      p.readySent = false;
      p.lobby = null;
    }
    send(clients[0], { type: "rematch" });
    await until(
      () => clients[0].lobby?.phase === "lobby" && clients[0].lobby.seats.every((s) => s?.ready),
    );
    send(clients[0], { type: "start" });
    await until(() =>
      clients.every((p) => p.state?.phase === "play" && p.state.matchId !== matchID),
    );
    for (const p of clients) {
      const state = wire.unpack(p.state.game, Yard.stats, Yard.kits);
      assert.ok(state.units.filter((u) => u.kind === "pilot").every((u) => u.rank === 0));
    }
    return {
      build: before.build,
      revision: before.revision,
      artifact: before.artifact,
      protocol: before.protocol,
      rules: before.rules,
      elapsedSeconds: (Date.now() - start) / 1000,
      clients: 4,
      disconnectedFor10s: disconnected,
      reconnectMs,
      result: clients[0].result,
      replayVerified: true,
      replaySignature: record.signature,
      freshRematch: true,
      errors,
    };
  } finally {
    for (const p of clients) send(p, { type: "leave" });
    await wait(200);
    for (const p of clients) p.ws?.terminate();
  }
}
if (require.main === module)
  smoke(process.argv[2] || "http://127.0.0.1:8080")
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
module.exports = { smoke };
