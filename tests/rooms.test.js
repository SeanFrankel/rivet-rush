"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { setTimeout: wait } = require("node:timers/promises");
const { WebSocket } = require("ws");
const { createHost } = require("../server/host");
const wire = require("../protocol");
const Yard = require("../match");

async function fixture(t, options = {}) {
  const host = createHost(options);
  host.server.listen(0, "127.0.0.1");
  await once(host.server, "listening");
  const port = host.server.address().port;
  t.after(() => host.close());
  async function client() {
    const ws = new WebSocket("ws://127.0.0.1:" + port + "/arena");
    ws.on("error", () => {});
    const messages = [];
    ws.on("message", (data) => messages.push(JSON.parse(data)));
    await once(ws, "open");
    return {
      ws,
      messages,
      send(msg) {
        ws.send(JSON.stringify(msg));
      },
      async take(type, check = () => true) {
        const end = Date.now() + 2800;
        while (Date.now() < end) {
          const i = messages.findIndex((msg) => msg.type === type && check(msg));
          if (i >= 0) return messages.splice(i, 1)[0];
          await wait(5);
        }
        throw Error("Timed out waiting for " + type);
      },
    };
  }
  async function create() {
    const c = await client();
    c.send({ type: "create", version: wire.version });
    return { c, seat: await c.take("seat") };
  }
  async function join(id, secret) {
    const c = await client();
    c.send({ type: "join", version: wire.version, room: id, secret });
    return c;
  }
  return { host, port, client, create, join };
}

test("team signals are bounded, rate limited and isolated from enemies and other rooms", async (t) => {
  const f = await fixture(t),
    { c, seat } = await f.create();
  const enemy = await f.join(seat.room);
  await enemy.take("seat");
  const ally = await f.join(seat.room);
  await ally.take("seat");
  const other = await f.create();
  for (const p of [c, enemy, ally]) p.send({ type: "ready", ready: true });
  await c.take("lobby", (m) => m.seats.filter(Boolean).every((s) => s.ready));
  c.send({ type: "start" });
  const state = await c.take("state");
  const signal = {
    type: "signal",
    matchId: state.matchId,
    kind: "rally",
    x: 890,
    y: 149,
    seat: 1,
  };
  c.send({ ...signal, x: -50 });
  c.send({ ...signal, matchId: "old" });
  c.send({ ...signal, kind: "arbitrary text" });
  c.send(signal);
  const received = await ally.take("signal");
  assert.equal(received.seat, 0);
  assert.equal(received.x, 890);
  await c.take("signal");
  c.send({ ...signal, kind: "retreat" });
  await wait(100);
  assert.equal(ally.messages.filter((m) => m.type === "signal").length, 0);
  assert.equal(enemy.messages.filter((m) => m.type === "signal").length, 0);
  assert.equal(other.c.messages.filter((m) => m.type === "signal").length, 0);
  // Reconnect cannot bypass the cooldown kept on the reserved seat.
  c.ws.close();
  await once(c.ws, "close");
  const back = await f.join(seat.room, seat.secret);
  await back.take("seat");
  back.send(signal);
  await wait(100);
  assert.equal(ally.messages.filter((m) => m.type === "signal").length, 0);
});

test("the private room enforces capacity, build compatibility, readiness and kit ownership", async (t) => {
  const f = await fixture(t, { capacity: 1 });
  const { c, seat } = await f.create();
  const guest = await f.join(seat.room);
  await guest.take("seat");
  assert.ok(guest.messages.every((m) => !JSON.stringify(m).includes(seat.secret)));
  guest.send({ type: "start" });
  await guest.take("error");
  c.send({ type: "kit", kit: { toString: null } });
  await c.take("error");
  c.send({ type: "kit", kit: "warden" });
  await c.take("lobby", (m) => m.seats[0].kit === "warden");
  const extra = await f.client();
  extra.send({ type: "create", version: 0 });
  assert.match((await extra.take("error")).message, /Version/);
  extra.send({ type: "create", version: wire.version });
  assert.match((await extra.take("error")).message, /full/);
  c.send({ type: "ready", ready: true });
  c.send({ type: "start" });
  await c.take("error");
  guest.send({ type: "ready", ready: true });
  await c.take("lobby", (m) => m.seats[1]?.ready);
  c.send({ type: "start" });
  const state = await c.take("state");
  assert.equal(
    wire.unpack(state.game, Yard.stats, Yard.kits).units.find((u) => u.seat === 0).kit,
    "warden",
  );
  assert.equal(f.host.rooms.size, 1);
});
test("duplicate inputs buy once; client position and other-seat claims have no authority", async (t) => {
  const f = await fixture(t),
    { c, seat } = await f.create();
  c.send({ type: "ready", ready: true });
  c.send({ type: "start" });
  const state = await c.take("state");
  const runtime = f.host.rooms.get(seat.room),
    p = runtime.game.player;
  p.scrap = 60;
  const input = {
    type: "input",
    matchId: state.matchId,
    seq: 3,
    seat: 1,
    x: 1700,
    currency: 999,
    mask: wire.encode({ buy: true }),
  };
  c.send(input);
  c.send(input);
  c.send({ ...input, seq: 4, matchId: "previous-match" });
  await c.take("state", (m) => m.ack[0] === 3);
  assert.equal(p.scrap, 48);
  assert.equal(p.rank, 1);
  assert.equal(p.x, 165);
  assert.equal(runtime.game.units.find((u) => u.seat === 1).rank, 0);
  c.send({ ...input, seq: 5, mask: wire.encode({ jump: true }) });
  c.send({ ...input, seq: 6, mask: wire.encode({ jump: true }) });
  await c.take("state", (m) => m.ack[0] === 6);
  assert.equal(p.jumps, 2, "two distinct jump presses survive a network burst");
});
test("a disconnect migrates host, authorizes only the reserved seat, and preserves live state", async (t) => {
  const f = await fixture(t),
    { c, seat } = await f.create();
  const guest = await f.join(seat.room),
    second = await guest.take("seat");
  c.send({ type: "ready", ready: true });
  guest.send({ type: "ready", ready: true });
  await c.take("lobby", (m) => m.seats[1]?.ready);
  c.send({ type: "start" });
  const first = await c.take("state");
  c.ws.terminate();
  await guest.take("lobby", (m) => m.host === second.seat && !m.seats[0].online);
  const thief = await f.join(seat.room, "not-a-token");
  await thief.take("error");
  const restored = await f.join(seat.room, seat.secret);
  assert.equal((await restored.take("seat")).seat, seat.seat);
  const after = await restored.take("state");
  assert.equal(after.matchId, first.matchId);
  restored.ws.terminate();
  await guest.take("lobby", (m) => !m.seats[0].online);
  f.host.rooms.get(seat.room).seats[0].until = Date.now() - 1;
  const expired = await f.join(seat.room, seat.secret);
  await expired.take("error");
  const health = await (await fetch("http://127.0.0.1:" + f.port + "/health")).json();
  assert.equal(health.playing, 1);
});
test("a rematch creates a clean world and rejects commands from the finished match", async (t) => {
  const f = await fixture(t),
    { c, seat } = await f.create();
  c.send({ type: "ready", ready: true });
  c.send({ type: "start" });
  const first = await c.take("state");
  const room = f.host.rooms.get(seat.room);
  room.game.units.find((u) => u.kind === "reactor" && u.team === 1).hp = 0;
  await c.take("state", (m) => m.phase === "end");
  c.send({ type: "rematch" });
  await c.take("lobby", (m) => m.phase === "lobby" && !m.seats[0].ready);
  c.send({ type: "ready", ready: true });
  c.send({ type: "start" });
  const next = await c.take("state", (m) => m.matchId !== first.matchId);
  assert.notEqual(next.matchId, first.matchId);
  assert.equal(room.game.wave, 1);
  assert.equal(room.game.player.rank, 0);
  c.send({
    type: "input",
    seq: 55,
    matchId: first.matchId,
    mask: wire.encode({ right: true }),
  });
  await c.take("state", (m) => m.matchId === next.matchId && m.game.tick > 4);
  assert.equal(room.game.player.x, 165);
});
test("malformed or oversized traffic in a second room cannot stop the first room", async (t) => {
  const f = await fixture(t),
    a = await f.create(),
    b = await f.create();
  a.c.send({ type: "ready", ready: true });
  a.c.send({ type: "start" });
  const state = await a.c.take("state");
  b.c.ws.send("{");
  await once(b.c.ws, "close");
  const bad = await f.client();
  bad.ws.send("X".repeat(2100));
  await once(bad.ws, "close");
  await a.c.take("state", (m) => m.matchId === state.matchId && m.game.tick > 5);
  assert.equal((await fetch("http://127.0.0.1:" + f.port + "/server/host.js")).status, 404);
});
test("fifty create/leave cycles release their rooms and all four seats", async (t) => {
  const f = await fixture(t);
  for (let i = 0; i < 50; i++) {
    const { c } = await f.create();
    c.send({ type: "leave" });
    await c.take("left");
    c.ws.close();
    await once(c.ws, "close");
    assert.equal(f.host.rooms.size, 0);
  }
});
