"use strict";
// Measure a real browser against a same-origin relay with controllable message delay.
// The ordered stall models a stalled stream, not operating-system packet loss.
const http = require("node:http");
const fs = require("node:fs");
const { once } = require("node:events");
const { setTimeout: sleep } = require("node:timers/promises");
const { performance } = require("node:perf_hooks");
const { WebSocket, WebSocketServer } = require("ws");
const { chromium } = require("playwright");
const { createHost } = require("../server/host");
const duration = Number(process.argv[2] || 10);
if (!(duration > 0 && duration <= 120))
  throw Error("Minutes must be greater than zero and at most 120");
const localEdge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const executablePath =
  process.env.RIVET_BROWSER || (fs.existsSync(localEdge) ? localEdge : undefined);
async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}
async function relay(port, profile) {
  const server = http.createServer((req, res) => {
    const upstream = http.get({ hostname: "127.0.0.1", port, path: req.url }, (up) => {
      res.writeHead(up.statusCode, up.headers);
      up.pipe(res);
    });
    upstream.on("error", () => {
      res.writeHead(502);
      res.end();
    });
  });
  const wss = new WebSocketServer({ server, path: "/arena", perMessageDeflate: false });
  const pairs = new Set();
  wss.on("connection", (down) => {
    const up = new WebSocket("ws://127.0.0.1:" + port + "/arena");
    const pending = new Set();
    const pair = { down, up };
    pairs.add(pair);
    function pipe(a, b, seed) {
      let last = 0,
        count = 0;
      a.on("message", (data) => {
        count++;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const jitter = ((seed / 4294967296) * 2 - 1) * profile.jitter;
        const stall = profile.stall && count % 100 === 0 ? 90 : 0;
        const now = performance.now();
        last = Math.max(last, now + profile.rtt / 2 + jitter + stall);
        const timer = setTimeout(
          () => {
            pending.delete(timer);
            if (b.readyState === WebSocket.OPEN) b.send(data, { binary: false });
          },
          Math.max(0, last - now),
        );
        pending.add(timer);
      });
    }
    pipe(down, up, 123);
    pipe(up, down, 456);
    function stop() {
      for (const timer of pending) clearTimeout(timer);
      pending.clear();
      pairs.delete(pair);
      up.terminate();
      down.terminate();
    }
    down.on("close", stop);
    up.on("close", stop);
    up.on("error", () => {});
    down.on("error", () => {});
  });
  const listenPort = await listen(server);
  return {
    url: "http://127.0.0.1:" + listenPort,
    async close() {
      for (const p of pairs) {
        p.down.terminate();
        p.up.terminate();
      }
      wss.close();
      await new Promise((r) => server.close(r));
    },
  };
}
const pct = (list, p) =>
  list.length
    ? +list
        .slice()
        .sort((a, b) => a - b)
        [Math.floor((list.length - 1) * p)].toFixed(2)
    : null;

async function profileRun(browser, targetPort, profile) {
  const link = await relay(targetPort, profile),
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(link.url);
    await page.getByRole("button", { name: "Private room" }).click();
    await page.getByRole("button", { name: "Ready up" }).click();
    await page.getByRole("button", { name: "Deploy crew" }).click();
    await page.waitForFunction(
      () => typeof room !== "undefined" && room.phase === "play" && mode === "play",
    );
    await page.evaluate(() => {
      window.lab = {
        corrections: [],
        frames: [],
        inputLatency: [],
        freeInputLatency: [],
        timedOut: 0,
        lastAt: 0,
        lastTick: -1,
        lastMatch: null,
        measure: null,
      };
      // For each deliberate change of horizontal direction, sample time from DOM
      // keyboard input to the first displayed displacement in that direction.
      window.addEventListener("keydown", (e) => {
        if (
          (e.code === "KeyA" || e.code === "KeyD") &&
          !e.repeat &&
          mode === "play" &&
          match.player.hp > 0
        ) {
          lab.measure = {
            t: performance.now(),
            x: match.player.x,
            dir: e.code === "KeyA" ? -1 : 1,
            id: room.matchId,
            free: match.player.dashLeft<=0 && !match.player.slamming && match.player.recovery<=0 &&
              Math.abs(match.player.knock)<15 && match.player.x>45 && match.player.x<Yard.width-45,
          };
        }
      });
      function sample(now) {
        if (mode === "play" && room.state) {
          if (lab.lastAt) lab.frames.push(now - lab.lastAt);
          lab.lastAt = now;
          if (room.state.tick !== lab.lastTick || room.matchId !== lab.lastMatch) {
            if (room.lastCorrection !== null) lab.corrections.push(room.lastCorrection);
            lab.lastTick = room.state.tick;
            lab.lastMatch = room.matchId;
          }
          const q = lab.measure;
          if (q && q.id === room.matchId && match.player.hp) {
            if ((match.player.x - q.x) * q.dir > 1) {
              lab.inputLatency.push(now - q.t);
              if(q.free)lab.freeInputLatency.push(now-q.t);
              lab.measure = null;
            } else if (now - q.t > 400) {lab.timedOut++;lab.measure=null;}
          } else lab.measure = null;
        } else lab.lastAt = 0;
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    const end = Date.now() + duration * 60000;
    let batches = 0,
      finished = 0,
      lastId = "";
    while (Date.now() < end) {
      const state = await page.evaluate(() => ({
        phase: room.phase,
        id: room.matchId,
        mode,
        alive: match.player.hp > 0,
      }));
      if (state.phase === "end") {
        if (lastId !== state.id) {
          finished++;
          lastId = state.id;
        }
        await page.getByRole("button", { name: "Back to room" }).click();
        await page.getByRole("button", { name: "Ready up" }).click();
        await page.getByRole("button", { name: "Deploy crew" }).click();
      } else if (state.phase === "play" && state.mode === "play") {
        const key = batches % 4 === 3 ? "a" : "d";
        await page.keyboard.up(key === "a" ? "d" : "a");
        await page.keyboard.up(key);
        await page.keyboard.down(key);
        await page.keyboard.down("j");
        if (batches % 5 === 0) await page.keyboard.press("w");
        if (batches % 7 === 0) await page.keyboard.press("Shift");
        if (batches % 3 === 0) await page.keyboard.press("k");
        if (batches % 4 === 0)
          await page.keyboard.press(["1", "2", "3"][Math.floor(batches / 4) % 3]);
      }
      batches++;
      await sleep(650);
    }
    const data = await page.evaluate(() => lab);
    return {
      profile: profile.name,
      minutes: duration,
      finished,
      inputs: data.inputLatency.length,
      inputToMotionP95ms: pct(data.inputLatency, 0.95),
      freeInputP95ms:pct(data.freeInputLatency,.95),freeInputs:data.freeInputLatency.length,
      noDisplacementWithin400ms:data.timedOut,
      samples: data.corrections.length,
      correctionP95px: pct(data.corrections, 0.95),
      frameP95ms: pct(data.frames, 0.95),
      errors,
    };
  } finally {
    await context.close();
    await link.close();
  }
}
(async () => {
  const host = createHost();
  const port = await listen(host.server);
  const browser = await chromium.launch({
    executablePath,
    args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding"],
  });
  try {
    const profiles = [
      { name: "40ms RTT", rtt: 40, jitter: 0, stall: false },
      { name: "150ms RTT + jitter + ordered stalls", rtt: 150, jitter: 15, stall: true },
    ];
    const results = await Promise.all(profiles.map((p) => profileRun(browser, port, p)));
    console.log(JSON.stringify(results, null, 2));
    if (results.some((r) => r.errors.length || r.inputs === 0 || r.samples === 0))
      process.exitCode = 1;
  } finally {
    await browser.close();
    await host.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
