"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomBytes, timingSafeEqual } = require("node:crypto");
const { performance, createHistogram } = require("node:perf_hooks");
const { WebSocketServer, WebSocket } = require("ws");
const Yard = require("../match");
const wire = require("../protocol");
const Replay = require("../replay");
const build = require("../package.json").version;

const root = path.resolve(__dirname, "..");
const staticFiles = new Map([
  ["/", ["index.html", "text/html"]],
  ["/index.html", ["index.html", "text/html"]],
  ...["match.js", "protocol.js", "replay.js", "online.js", "yard.js", "sound.js"].map((name) => [
    "/" + name,
    [name, "text/javascript"],
  ]),
  ["/arena.css", ["arena.css", "text/css"]],
  ...["arc-runner.jpg", "kiln-yard.jpg"].map((name) => [
    "/assets/" + name,
    ["assets/" + name, "image/jpeg"],
  ]),
]);
const token = (bytes) => randomBytes(bytes).toString("base64url");
const seatLimit = 4;
const tickMs = 1000 / 60;
const reservationMs = 60000;
const equalSecret = (a, b) =>
  typeof a === "string" &&
  a.length === b.length &&
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));

function createHost(options = {}) {
  const rooms = new Map();
  const peers = new Set();
  const capacity = options.capacity ?? 4;
  const emit = options.onEvent ?? (() => {});
  // Serve the same client revision for the lifetime of this server process.
  const assets = new Map(
    [...staticFiles].map(([url, [name, mime]]) => [
      url,
      { mime, data: fs.readFileSync(path.join(root, name)) },
    ]),
  );
  let draining = false;
  let nextTick = performance.now();
  const metrics = {
    matches: 0,
    finished: 0,
    steps: 0,
    droppedTicks: 0,
    worstTickMs: 0,
    rejected: 0,
  };
  const tickCost = createHistogram();

  const server = http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      return res.end();
    }
    const pathname = req.url.split("?")[0];
    if (pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      return res.end(
        JSON.stringify({
          ok: true,
          rooms: rooms.size,
          capacity,
          draining,
          build,
          protocol: wire.version,
          playing: [...rooms.values()].filter((room) => room.phase === "play").length,
          completed: metrics.finished,
          droppedCatchups: metrics.droppedTicks,
          tickP95ms: tickCost.percentile(95) / 1e6,
          tickP99ms: tickCost.percentile(99) / 1e6,
        }),
      );
    }
    const file = assets.get(pathname);
    if (!file) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      "Content-Type": file.mime,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "default-src 'self'; connect-src 'self' ws: wss:; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'",
    });
    res.end(req.method === "HEAD" ? undefined : file.data);
  });
  const sockets = new WebSocketServer({
    noServer: true,
    maxPayload: 2048,
    perMessageDeflate: false,
  });
  server.on("upgrade", (req, socket, head) => {
    const origin = req.headers.origin;
    let validOrigin = true;
    if (origin) {
      try {
        validOrigin = new URL(origin).host === req.headers.host;
      } catch {
        validOrigin = false;
      }
    }
    if (req.url !== "/arena" || !validOrigin || peers.size >= capacity * 8 + 4) {
      socket.destroy();
      return;
    }
    sockets.handleUpgrade(req, socket, head, (ws) => sockets.emit("connection", ws));
  });

  function sendText(ws, data) {
    if (ws?.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > 512 * 1024) {
      ws.close(1013, "Slow connection");
      return;
    }
    ws.send(data);
  }
  function send(ws, packet) {
    sendText(ws, JSON.stringify(packet));
  }
  function reject(ws, message) {
    metrics.rejected++;
    send(ws, { type: "error", message });
  }
  function broadcast(room, msg) {
    const data = JSON.stringify(msg);
    for (const s of room.seats) if (s?.ws) sendText(s.ws, data);
  }
  function lobby(room) {
    broadcast(room, {
      type: "lobby",
      room: room.id,
      phase: room.phase,
      host: room.host,
      seats: room.seats.map((s) => (s ? { online: !!s.ws, ready: s.ready, kit: s.kit } : null)),
    });
  }
  function settleHost(room) {
    if (!room.seats[room.host]?.ws) room.host = room.seats.findIndex((s) => s?.ws);
  }
  function clearSeat(room, seat, reserve) {
    const s = room.seats[seat];
    if (!s) return;
    if (s.ws) {
      s.ws.room = null;
      s.ws.seat = -1;
    }
    s.ws = null;
    s.mask = 0;
    s.presses = [];
    s.ready = false;
    if (reserve) s.until = Date.now() + reservationMs;
    else room.seats[seat] = null;
    settleHost(room);
    if (!room.seats.some(Boolean)) rooms.delete(room.id);
    else lobby(room);
  }
  function bind(ws, room, index, saved, preferredKit) {
    const selected = typeof preferredKit === "string" && Object.hasOwn(Yard.kits, preferredKit);
    const s = saved || {
      secret: token(24),
      ready: false,
      kit: selected ? preferredKit : index < 2 ? "runner" : "warden",
    };
    Object.assign(s, {
      ws,
      until: 0,
      mask: 0,
      presses: [],
      seq: -1,
      applied: -1,
      lastInput: Date.now(),
    });
    room.seats[index] = s;
    ws.room = room;
    ws.seat = index;
    settleHost(room);
    send(ws, { type: "seat", room: room.id, seat: index, secret: s.secret, version: wire.version });
    lobby(room);
    if (room.game) snapshot(room, ws);
  }
  function snapshot(room, ws) {
    const packet = {
      type: "state",
      matchId: room.matchId,
      phase: room.phase,
      ack: room.seats.map((s) => s?.applied ?? -1),
      game: wire.pack(room.game),
    };
    if (ws) send(ws, packet);
    else broadcast(room, packet);
  }
  function begin(room) {
    room.game = Yard.create({ teamSize: 2, kits: room.seats.map((s) => s?.kit) });
    room.recorder = Replay.recorder(room.game);
    room.matchId = token(8);
    room.phase = "play";
    metrics.matches++;
    for (const s of room.seats)
      if (s) {
        s.mask = 0;
        s.presses = [];
        s.applied = -1;
        s.replaySent = false;
      }
    emit({
      event: "match_started",
      match: room.matchId,
      humans: room.seats.filter((s) => s?.ws).length,
    });
    lobby(room);
    snapshot(room);
  }
  function command(ws, msg) {
    if (!msg || typeof msg !== "object" || Array.isArray(msg)) return reject(ws, "Invalid message");
    const room = ws.room;
    if (!room) {
      if (msg.version !== wire.version) return reject(ws, "Version mismatch. Refresh the game.");
      if (msg.type === "create") {
        if (draining || rooms.size >= capacity) return reject(ws, "Yard is full. Try again later.");
        const fresh = {
          id: token(12),
          phase: "lobby",
          host: 0,
          seats: Array(4).fill(null),
          game: null,
          matchId: null,
        };
        rooms.set(fresh.id, fresh);
        bind(ws, fresh, 0, null, msg.kit);
        return;
      }
      if (msg.type !== "join") return reject(ws, "Create or join a room first.");
      const target = rooms.get(msg.room);
      if (!target) return reject(ws, "Room closed. Ask for a new invite.");
      if (msg.secret !== undefined) {
        const slot = target.seats.findIndex((s) => s && equalSecret(msg.secret, s.secret));
        const saved = target.seats[slot];
        if (!saved || (!saved.ws && Date.now() >= saved.until))
          return reject(ws, "Seat reservation expired.");
        if (saved.ws) {
          const previous = saved.ws;
          previous.room = null;
          previous.seat = -1;
          previous.close(4001, "Seat moved");
        }
        bind(ws, target, slot, saved);
        return;
      }
      if (target.phase !== "lobby") return reject(ws, "Match in progress. Join at the next lobby.");
      const slot = target.seats.findIndex((s) => !s);
      if (slot === -1) return reject(ws, "This room is full.");
      bind(ws, target, slot, null, msg.kit);
      return;
    }

    const s = room.seats[ws.seat];
    switch (msg.type) {
      case "leave":
        clearSeat(room, ws.seat, false);
        send(ws, { type: "left" });
        return;
      case "seat": {
        if (
          room.phase !== "lobby" ||
          !Number.isInteger(msg.slot) ||
          msg.slot < 0 ||
          msg.slot >= seatLimit ||
          room.seats[msg.slot]
        )
          return reject(ws, "Choose an empty lobby seat.");
        room.seats[ws.seat] = null;
        room.seats[msg.slot] = s;
        if (room.host === ws.seat) room.host = msg.slot;
        ws.seat = msg.slot;
        s.ready = false;
        send(ws, {
          type: "seat",
          seat: ws.seat,
          room: room.id,
          secret: s.secret,
          version: wire.version,
        });
        lobby(room);
        return;
      }
      case "ready":
        if (room.phase !== "lobby") return reject(ws, "Wait for the lobby.");
        s.ready = msg.ready === true;
        lobby(room);
        return;
      case "kit":
        if (
          room.phase !== "lobby" ||
          typeof msg.kit !== "string" ||
          !Object.hasOwn(Yard.kits, msg.kit)
        )
          return reject(ws, "Choose an available pilot in the lobby.");
        s.kit = msg.kit;
        s.ready = false;
        lobby(room);
        return;
      case "start":
        if (draining)
          return reject(ws, "The yard is restarting. Open a new room after the restart.");
        if (
          room.host !== ws.seat ||
          room.phase !== "lobby" ||
          !room.seats.every((p) => !p || (p.ws && p.ready))
        )
          return reject(ws, "The host can deploy once every pilot is ready.");
        begin(room);
        return;
      case "rematch":
        if (room.phase !== "end" || room.host !== ws.seat)
          return reject(ws, "Wait for the host to reopen the room.");
        room.phase = "lobby";
        room.game = null;
        room.recorder = null;
        for (const p of room.seats) if (p) p.ready = false;
        lobby(room);
        return;
      case "replay":
        if (room.phase !== "end" || s.replaySent) return;
        s.replaySent = true;
        send(ws, {
          type: "replay",
          matchId: room.matchId,
          record: room.recorder.export(room.game),
        });
        return;
      case "input":
        if (room.phase !== "play" || msg.matchId !== room.matchId) return;
        if (
          !Number.isSafeInteger(msg.seq) ||
          msg.seq <= s.seq ||
          !Number.isInteger(msg.mask) ||
          msg.mask < 0 ||
          msg.mask > wire.maxMask
        )
          return;
        s.seq = msg.seq;
        s.mask = msg.mask & ~wire.edgeMask;
        s.aim = Number.isInteger(msg.aim) && msg.aim >= 0 && msg.aim < 256 ? msg.aim : null;
        if (msg.mask & wire.edgeMask) {
          if (s.presses.length >= 8) {
            ws.close(1008, "Too many queued actions");
            return;
          }
          s.presses.push({ seq: s.seq, mask: msg.mask, aim: s.aim });
        }
        s.lastInput = Date.now();
        return;
      default:
        return reject(ws, "Unknown room action.");
    }
  }
  sockets.on("connection", (ws) => {
    peers.add(ws);
    ws.alive = true;
    ws.seat = -1;
    ws.connectedAt = Date.now();
    let count = 0,
      since = Date.now();
    ws.on("pong", () => {
      ws.alive = true;
    });
    ws.on("error", () => ws.terminate());
    ws.on("message", (data, binary) => {
      if (Date.now() - since >= 1000) {
        count = 0;
        since = Date.now();
      }
      if (++count > 100 || binary) {
        ws.close(1008, "Input limit");
        return;
      }
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        ws.close(1007, "Invalid message");
        return;
      }
      command(ws, msg);
    });
    ws.on("close", () => {
      peers.delete(ws);
      if (ws.room) clearSeat(ws.room, ws.seat, true);
    });
  });

  function advanceRooms() {
    const start = performance.now(),
      now = Date.now();
    for (const room of rooms.values()) {
      for (const [i, s] of room.seats.entries())
        if (s && !s.ws && now >= s.until) clearSeat(room, i, false);
      if (room.phase !== "play" || !room.seats.some((s) => s?.ws)) continue;
      const inputs = {};
      for (const [i, s] of room.seats.entries()) {
        if (!s?.ws) continue;
        const fresh = now - s.lastInput < 650;
        if (!fresh) s.presses.length = 0;
        const press = s.presses.shift();
        inputs[i] = wire.decode(fresh ? (press?.mask ?? s.mask) : 0);
        inputs[i].aim = press ? press.aim : s.aim;
        s.applied = press?.seq ?? s.seq;
      }
      room.recorder.capture(room.game.tick, inputs);
      Yard.stepSeats(room.game, inputs);
      if (room.game.winner !== null) {
        room.phase = "end";
        metrics.finished++;
        emit({
          event: "match_finished",
          match: room.matchId,
          winner: room.game.winner,
          ticks: room.game.tick,
        });
        lobby(room);
      }
      if (room.phase === "end" || room.game.tick % 3 === 0) snapshot(room);
    }
    const ms = performance.now() - start;
    metrics.steps++;
    metrics.worstTickMs = Math.max(metrics.worstTickMs, ms);
    if (rooms.size) tickCost.record(Math.max(1, Math.round(ms * 1e6)));
  }
  const timer = setInterval(() => {
    let count = 0;
    while (performance.now() >= nextTick && count < 6) {
      advanceRooms();
      nextTick += tickMs;
      count++;
    }
    if (performance.now() - nextTick >= 100) {
      metrics.droppedTicks++;
      nextTick = performance.now();
    }
  }, 5);
  const heartbeat = setInterval(() => {
    for (const ws of peers) {
      if (!ws.alive || (!ws.room && Date.now() - ws.connectedAt > 30000)) {
        ws.terminate();
        continue;
      }
      ws.alive = false;
      ws.ping();
    }
  }, 15000);
  return {
    server,
    metrics,
    rooms,
    tickCost,
    setDraining(value) {
      draining = value;
    },
    close() {
      clearInterval(timer);
      clearInterval(heartbeat);
      for (const ws of peers) ws.terminate();
      sockets.close();
      return new Promise((resolve) => server.close(resolve));
    },
  };
}

if (require.main === module) {
  const host = createHost({ onEvent: (event) => console.log(JSON.stringify({ build, ...event })) });
  const port = Number(process.env.PORT || 8080);
  host.server.listen(port, process.env.BIND_ADDRESS || "127.0.0.1", () => {
    console.log("Rivet Rush listening on", host.server.address());
  });
  function drain() {
    host.setDraining(true);
    const until = Date.now() + 30000;
    const check = setInterval(() => {
      if (Date.now() >= until || ![...host.rooms.values()].some((r) => r.phase === "play")) {
        clearInterval(check);
        host.close();
      }
    }, 250);
  }
  process.once("SIGTERM", drain);
  process.once("SIGINT", drain);
}
module.exports = { createHost };
