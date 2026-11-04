"use strict";
const { test, expect } = require("@playwright/test");

async function doubleJumpAndDash(page) {
  await page.waitForFunction(() => mode === "play" && match.tick > 1);
  await page.keyboard.down("w");
  await page.waitForFunction(() => match.player.jumps === 1);
  await page.keyboard.up("w");
  await page.keyboard.down("w");
  await page.waitForFunction(() => match.player.jumps === 2);
  await page.keyboard.up("w");
  await page.keyboard.press("Shift");
}

test("deploy, launch an air dash and pause through the browser controls", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Training deck" }).click();
  await doubleJumpAndDash(page);
  await expect.poll(() => page.evaluate(() => lesson)).toBe(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Shift paused" })).toBeVisible();
  const frozen = await page.evaluate(() => match.tick);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => match.tick)).toBe(frozen);
  await page.getByRole("button", { name: "Resume fight" }).click();
  await expect.poll(() => page.evaluate(() => match.tick)).toBeGreaterThan(frozen);
  expect(errors).toEqual([]);
});

test("four private seats deploy, reconnect and leave through the real lobby", async ({
  browser,
}) => {
  const contexts = [],
    pages = [],
    errors = [];
  try {
    for (let i = 0; i < 4; i++) {
      const context = await browser.newContext();
      contexts.push(context);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      pages.push(page);
    }
    const [host, guest] = pages;
    await host.goto("http://127.0.0.1:8189");
    await host.getByRole("button", { name: "Private room" }).click();
    await expect(host.getByRole("heading", { name: "Crew quarters" })).toBeVisible();
    const invite = host.url();
    for (const p of pages.slice(1)) {
      await p.goto(invite);
      await expect(p.getByRole("button", { name: "Ready up" })).toBeVisible();
    }
    await guest.getByRole("button", { name: /Kiln Warden/ }).click();
    await expect(guest.getByRole("button", { name: /Kiln Warden/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    for (const p of pages) await p.getByRole("button", { name: "Ready up" }).click();
    await host.getByRole("button", { name: "Deploy crew" }).click();
    for (const p of pages) await expect(p.locator("#connection")).toHaveText("LIVE · PRIVATE");
    await host.keyboard.press("g");
    await expect(pages[2].locator("#teamSignal")).toHaveText("Teammate: rally here");
    await expect(guest.locator("#teamSignal")).toHaveText("");
    await expect(host.locator("#teamSignal")).toHaveText("You: rally here");
    await host.keyboard.press("h");
    await expect(host.locator("#teamSignal")).toHaveText("You: rally here");
    await host.getByRole("button", { name: "Field menu" }).click();
    const reportReady = host.waitForEvent("download");
    await host.getByRole("button", { name: "Save playtest report" }).click();
    const reportDownload = await reportReady;
    const reportText = require("node:fs").readFileSync(await reportDownload.path(), "utf8");
    const report = JSON.parse(reportText);
    expect(report.format).toBe("rivet-playtest");
    expect(report.pilots).toHaveLength(4);
    expect(report.host.revision).toMatch(/^[a-f0-9]{16}$/);
    const secrets = await host.evaluate(() => [room.secret, room.room, location.href]);
    for (const secret of secrets) expect(reportText).not.toContain(secret);
    await host.getByRole("button", { name: "Resume fight" }).click();
    const original = await guest.evaluate(() => ({
      seat: room.seat,
      id: room.matchId,
      x: match.player.x,
    }));
    expect(await guest.evaluate(() => match.player.kit)).toBe("warden");
    await guest.keyboard.down("a");
    await guest.waitForTimeout(270);
    await guest.keyboard.up("a");
    await expect
      .poll(() => guest.evaluate(() => room.state.units.find((u) => u.seat === room.seat).x))
      .toBeLessThan(original.x - 10);
    await guest.reload();
    await expect(guest.locator("#connection")).toHaveText("LIVE · PRIVATE");
    const again = await guest.evaluate(() => ({
      seat: room.seat,
      id: room.matchId,
    }));
    expect(again).toEqual({ seat: original.seat, id: original.id });
    await guest.getByRole("button", { name: "Field menu" }).click();
    await guest.getByRole("button", { name: "Return to title" }).click();
    await expect(guest.getByRole("heading", { name: "The Kiln Yard" })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    for (const context of contexts) await context.close();
  }
});

test("mod choices expose tiers, affordability and actual purchase effects", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await page.getByRole("button", { name: "Play skirmish" }).click();
  await expect(page.locator("#driveMod")).toBeDisabled();
  await expect(page.locator("#fieldTip")).toContainText("FIRST WAVE");
  const controlsBottom = await page
    .locator(".quick-keys")
    .evaluate((node) => node.getBoundingClientRect().bottom);
  expect(controlsBottom).toBeLessThanOrEqual(720);
  await page.evaluate(() => {
    match.player.scrap = 12;
  });
  await expect(page.locator("#driveMod")).toBeEnabled();
  await expect(page.locator("#buildHint")).toContainText("MOD READY");
  await page.locator("#driveMod").click();
  await expect(page.locator("#driveMod")).toContainText("1/3");
  expect(await page.evaluate(() => match.player.max)).toBe(168);
  await expect(page.locator("#driveMod")).toBeDisabled();
  await expect(page.locator("#buildHint")).toContainText("20 more scrap");
  await page.keyboard.press("g");
  await expect(page.locator("#teamSignal")).toContainText("rally here");
  await page.screenshot({ path: ".tmp/teamplay-hud.png" });
  await page.getByRole("button", { name: "Tips on" }).click();
  await expect(page.locator("#fieldTip")).toBeHidden();
  await page.reload();
  await expect(page.getByRole("button", { name: "Tips off" })).toBeVisible();
});

test("a sentry death displays a recent damage recap before respawning", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play skirmish" }).click();
  // Controlled setup; the ordinary sentry acquires, warns, fires and kills.
  await page.evaluate(() => {
    match.player.x = 1295;
    match.player.hp = 12;
  });
  await page.waitForFunction(() => match.player.hp === 0);
  expect(await page.evaluate(() => match.player.downedBy)).toBe("sentry");
  expect(await page.evaluate(() => match.player.recap)).toEqual([["sentry", 12]]);
  await page.screenshot({ path: ".tmp/death-recap.png" });
  await page.waitForFunction(() => match.player.hp > 0);
  expect(await page.evaluate(() => match.player.recap)).toEqual([]);
});

test("the Warden can complete all three training drills using normal inputs", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Kiln Warden/ }).click();
  await page.getByRole("button", { name: "Training deck" }).click();
  await doubleJumpAndDash(page);
  await expect.poll(() => page.evaluate(() => lesson)).toBe(1);
  // Drop below any upper deck before lining up the practice target.
  await page.keyboard.down("s");
  await expect.poll(() => page.evaluate(() => match.player.y)).toBe(345);
  await page.keyboard.up("s");
  async function approach(targetGap) {
    const gap = () => page.evaluate(() => match.units.find((u) => u.seat === 1).x - match.player.x);
    const direction = (await gap()) > targetGap ? "d" : "a";
    await page.keyboard.down(direction);
    try {
      await page.waitForFunction(
        ([gap, forward]) => {
          const d = match.units.find((u) => u.seat === 1).x - match.player.x;
          return forward ? d <= gap : d >= gap;
        },
        [targetGap, direction === "d"],
      );
    } finally {
      await page.keyboard.up(direction);
    }
  }
  await approach(75);
  await expect.poll(() => page.evaluate(() => match.player.dash)).toBe(0);
  await page.keyboard.down("j");
  await page.keyboard.press("Shift");
  await page.keyboard.up("j");
  await expect.poll(() => page.evaluate(() => lesson)).toBe(2);
  await page.waitForTimeout(500);
  await approach(32);
  await page.keyboard.press("w");
  await page.waitForTimeout(130);
  await page.keyboard.press("k");
  await expect.poll(() => page.evaluate(() => lesson)).toBe(3);
  await expect(page.locator("#pilotName")).toHaveText("KILN WARDEN");
});
test("a saved input trace plays back, switches camera seat, and verifies its result", async ({
  page,
}) => {
  const Yard = require("../../match"),
    Replay = require("../../replay");
  const match = Yard.create({ teamSize: 2 }),
    capture = Replay.recorder(match);
  for (let i = 0; i < 240; i++) {
    const input = { 0: { right: i < 80, fire: true, dash: i === 20 } };
    capture.capture(match.tick, input);
    Yard.stepSeats(match, input);
  }
  const record = capture.export(match);
  await page.goto("/");
  await page.locator("#replayFile").setInputFiles({
    name: "match.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(record)),
  });
  await expect(page.locator("#connection")).toHaveText("REPLAY");
  await page.getByRole("button", { name: "Follow next pilot" }).click();
  expect(await page.evaluate(() => match.player.seat)).toBe(1);
  await page.getByRole("button", { name: "Playback · 1×" }).click();
  await expect(page.getByRole("heading", { name: "Replay complete" })).toBeVisible();
});
test("the movement course can be finished on the real map and restarted", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Movement run" }).click();
  // Land on each staging deck before leaving it. The crossing can be opened
  // from gate two, giving a stable approach to the central vault platform.
  for (const [stage, [x, y]] of [
    [416, 275],
    [690, 208],
    [890, 149],
    [1090, 208],
    [1364, 275],
    [1605, 345],
  ].entries()) {
    await page.keyboard.down("d");
    await page.waitForFunction((x) => mode === "trial-end" || match.player.x >= x - 13, x);
    await page.keyboard.up("d");
    if (stage < 5) {
      for (let jump = 0; jump < 2; jump++) {
        if (await page.evaluate((y) => match.player.y <= y + 1, y)) break;
        await page.keyboard.down("w");
        await page.waitForFunction(() => match.player.vy < -35);
        await page.waitForFunction((y) => match.player.y <= y || match.player.vy >= -35, y);
        await page.keyboard.up("w");
        if (await page.evaluate((y) => match.player.y <= y + 1, y)) break;
      }
      await page.waitForFunction(
        (y) => match.player.grounded && Math.abs(match.player.y - y) < 1,
        y,
      );
      if (stage === 1) {
        await page.keyboard.press("e");
        await page.waitForFunction(() => match.bridge > 0);
      }
    } else {
      await page.waitForFunction((stage) => trial.gate > stage, stage);
    }
  }
  await expect(page.getByRole("heading", { name: "Run complete" })).toBeVisible();
  await page.getByRole("button", { name: "Race again" }).click();
  expect(await page.evaluate(() => [trial.gate, trial.start])).toEqual([0, null]);
});
