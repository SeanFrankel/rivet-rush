"use strict";
// A completely browser-driven match, including a real replay download and rematch.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { once } = require("node:events"),
  { setTimeout: wait } = require("node:timers/promises");
const { chromium } = require("playwright");
const { createHost } = require("../server/host");
const Replay = require("../replay");
const installedEdge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
async function main() {
  const host = createHost();
  host.server.listen(0, "127.0.0.1");
  await once(host.server, "listening");
  const url = "http://127.0.0.1:" + host.server.address().port;
  const browser = await chromium.launch({
    executablePath:
      process.env.RIVET_BROWSER || (fs.existsSync(installedEdge) ? installedEdge : undefined),
    args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding"],
  });
  const pages = [],
    errors = [];
  try {
    const fileDir = path.resolve(".tmp/friends-drill");
    fs.mkdirSync(fileDir, { recursive: true });
    for (let i = 0; i < 4; i++) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        acceptDownloads: true,
      });
      const page = await context.newPage();
      pages.push(page);
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(i ? pages[0].url() : url);
      if (!i) await page.getByRole("button", { name: "Private room" }).click();
      await page.getByRole("heading", { name: "Crew quarters" }).waitFor();
    }
    for (const [i, page] of pages.entries()) {
      await page.getByRole("button", { name: i < 2 ? /Arc Runner/ : /Kiln Warden/ }).click();
      await page.getByRole("button", { name: "Ready up" }).click();
    }
    await pages[0].getByRole("button", { name: "Deploy crew" }).click();
    await Promise.all(
      pages.map((p) => p.waitForFunction(() => mode === "play" && room.phase === "play")),
    );
    const start = Date.now();
    const firstID = await pages[0].evaluate(() => room.matchId);
    let turn = 0;
    while (Date.now() - start < 420000) {
      if (await pages[0].evaluate(() => mode === "end")) break;
      await Promise.all(
        pages.map(async (page, i) => {
          if (i % 2 === 1) {
            // Both defenders hold the base while Torch actively escorts its wave.
            await page.keyboard.down("j");
            if (turn % 8 === 0) await page.keyboard.press("k");
            return;
          }
          const order = await page.evaluate(() => {
            const p = match.player;
            const tower = match.units.find(
              (u) => u.kind === "sentry" && u.team !== p.team && u.hp > 0,
            );
            const core = match.units.find((u) => u.kind === "reactor" && u.team !== p.team);
            const focus = tower || core;
            return {
              run: p.x < focus.x - p.range + 27,
              pulse: match.units.some((u) => u.hp && u.team === 1 && Math.abs(u.x - p.x) < 105),
              rank: p.rank,
              canBuy: Yard.upgradeCost(p) > 0 && p.scrap >= Yard.upgradeCost(p),
            };
          });
          if (order.run) await page.keyboard.down("d");
          else await page.keyboard.up("d");
          await page.keyboard.down("j");
          if (order.pulse || (i === 2 && turn % 12 === 0)) await page.keyboard.press("k");
          if (order.canBuy) await page.keyboard.press(["1", "3", "2", "1", "3", "1"][order.rank]);
        }),
      );
      turn++;
      await wait(300);
    }
    await Promise.all(
      pages.map((p) => p.waitForFunction(() => mode === "end", null, { timeout: 6000 })),
    );
    const outcomes = await Promise.all(
      pages.map((p) =>
        p.evaluate(() => ({ winner: match.winner, tick: match.tick, id: room.matchId })),
      ),
    );
    assert.ok(
      outcomes.every(
        (o) => o.winner === outcomes[0].winner && o.tick === outcomes[0].tick && o.id === firstID,
      ),
    );
    const pending = pages[0].waitForEvent("download");
    await pages[0].getByRole("button", { name: "Save match replay" }).click();
    const download = await pending,
      file = path.join(fileDir, "match.json");
    await download.saveAs(file);
    const source = JSON.parse(fs.readFileSync(file, "utf8")),
      replay = Replay.load(source);
    while (replay.advance()) {}
    assert.equal(replay.verified(), true);
    await pages[0].getByRole("button", { name: "Back to room" }).click();
    for (const p of pages) await p.getByRole("button", { name: "Ready up" }).click();
    await pages[0].getByRole("button", { name: "Deploy crew" }).click();
    await Promise.all(
      pages.map((p) => p.waitForFunction((id) => mode === "play" && room.matchId !== id, firstID)),
    );
    assert.ok(
      (await Promise.all(pages.map((p) => p.evaluate(() => match.player.rank)))).every(
        (rank) => rank === 0,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify(
        {
          browsers: 4,
          elapsedSeconds: (Date.now() - start) / 1000,
          first: outcomes[0],
          replay: source.signature,
          replayed: true,
          freshRematch: true,
          bytes: fs.statSync(file).size,
          errors,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
    await host.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
