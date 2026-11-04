"use strict";
// Real elapsed reservation expiry plus a browser recovering from a lost server.
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { once } = require("node:events"),
  { setTimeout: wait } = require("node:timers/promises");
const { WebSocket } = require("ws"),
  { chromium } = require("playwright");
const { createHost } = require("../server/host"),
  wire = require("../protocol");
async function main() {
  let host = createHost(),
    browser;
  const peers = [],
    errors = [];
  host.server.listen(0, "127.0.0.1");
  await once(host.server, "listening");
  const port = host.server.address().port,
    url = "http://127.0.0.1:" + port;
  async function connect(message) {
    const ws = new WebSocket("ws://127.0.0.1:" + port + "/arena"),
      messages = [];
    peers.push(ws);
    ws.on("error", () => {});
    ws.on("message", (raw) => messages.push(JSON.parse(raw)));
    await once(ws, "open");
    ws.send(JSON.stringify({ ...message, version: wire.version }));
    async function take(type, check = () => true) {
      const until = Date.now() + 5000;
      while (Date.now() < until) {
        const index = messages.findIndex((m) => m.type === type && check(m));
        if (index >= 0) return messages.splice(index, 1)[0];
        await wait(20);
      }
      throw Error("No " + type + " response");
    }
    return { ws, take, messages, send: (m) => ws.send(JSON.stringify(m)) };
  }
  try {
    const owner = await connect({ type: "create" }),
      seat = await owner.take("seat");
    const guest = await connect({ type: "join", room: seat.room });
    await guest.take("seat");
    owner.send({ type: "ready", ready: true });
    guest.send({ type: "ready", ready: true });
    await owner.take("lobby", (m) => m.seats[1]?.ready);
    owner.send({ type: "start" });
    await owner.take("state");
    const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
    browser = await chromium.launch({
      executablePath: process.env.RIVET_BROWSER || (fs.existsSync(edge) ? edge : undefined),
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page.getByRole("button", { name: "Private room" }).click();
    await page.getByRole("button", { name: "Ready up" }).click();
    await page.getByRole("button", { name: "Deploy crew" }).click();
    await page.waitForFunction(() => room.phase === "play");
    const browserMatch = await page.evaluate(() => room.matchId);
    owner.ws.close();
    await once(owner.ws, "close");
    const lostAt = Date.now();
    await guest.take("lobby", (m) => m.host === 1 && !m.seats[0].online);
    console.log(JSON.stringify({ phase: "reservation", realSeconds: 0, hostMigrated: true }));
    await wait(35000);
    assert.ok(host.rooms.get(seat.room).seats[0], "seat remains reserved at 35 seconds");
    console.log(JSON.stringify({ phase: "reservation", realSeconds: 35, reserved: true }));
    await wait(30000);
    assert.equal(host.rooms.get(seat.room).seats[0], null, "reservation expires after 60 seconds");
    const expired = await connect({ type: "join", room: seat.room, secret: seat.secret });
    assert.match((await expired.take("error")).message, /expired/);
    const elapsed = (Date.now() - lostAt) / 1000;
    await host.close();
    await wait(3000); // Give the real browser time to enter its reconnect state.
    host = createHost();
    host.server.listen(port, "127.0.0.1");
    await once(host.server, "listening");
    await page.waitForFunction(
      () => document.getElementById("message").textContent.includes("Room closed"),
      null,
      { timeout: 15000 },
    );
    await page.screenshot({ path: ".tmp/server-recovery.png" });
    await page.getByRole("button", { name: "Private room", exact: true }).click();
    await page.getByRole("button", { name: "Ready up" }).click();
    await page.getByRole("button", { name: "Deploy crew" }).click();
    await page.waitForFunction((id) => room.phase === "play" && room.matchId !== id, browserMatch);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify(
        {
          realReservationSeconds: elapsed,
          expiredTokenRejected: true,
          browserExplainedLostRoom: true,
          freshRoomAfterRestart: true,
          errors,
        },
        null,
        2,
      ),
    );
  } finally {
    for (const ws of peers) ws.terminate();
    await browser?.close();
    await host.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
