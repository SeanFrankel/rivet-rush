"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const Yard = require("../match");
function drill(kit = "runner") {
  const m = Yard.createTraining(kit);
  m.units = [m.player];
  m.player.x = 1000;
  return m;
}
function move(m, k, n = 1) {
  for (let i = 0; i < n; i++) Yard.stepSeats(m, { 0: k });
}
function apex(kit, release) {
  const m = drill(kit);
  move(m, { jump: true });
  let top = m.player.y;
  for (let i = 1; i < 60; i++) {
    move(m, { jumpRelease: i === release });
    top = Math.min(top, m.player.y);
  }
  return Yard.floor - top;
}
test("a tap clears low fire and a held jump has room above the first ledge", () => {
  for (const kit of ["runner", "warden"]) {
    const short = apex(kit, 2),
      full = apex(kit, 99);
    assert.ok(short > 20 && short < 45);
    assert.ok(full > 82 && full - short > 45);
  }
});
test("a jump cancels an evasive dash into a steerable leap and consumes the dash", () => {
  for (const kit of ["runner", "warden"]) {
    const m = drill(kit),
      p = m.player;
    move(m, { right: true, dash: true });
    move(m, { right: true, jump: true });
    assert.ok(p.vy < 0 && p.vx > p.speed * 1.6 && p.dashLeft === 0 && p.dash > 0);
    const x = p.x;
    move(m, { right: true }, 12);
    assert.ok(p.x - x > p.speed * 0.26);
    const beforeTurn = p.x;
    move(m, { left: true });
    assert.ok(p.x < beforeTurn - 1, "a deliberate air reversal moves on the next tick");
  }
});
test("sliding lowers the hitbox, carries a jump, and requires a fresh press for another slide", () => {
  const m = drill(),
    p = m.player;
  move(m, { right: true }, 18);
  move(m, { right: true, down: true });
  assert.equal(Yard.height(p), 21);
  assert.ok(p.vx > p.speed);
  move(m, { right: true, down: true, jump: true });
  assert.equal(Yard.height(p), 34);
  assert.ok(p.vx > p.speed && p.vy < 0);
  move(m, { right: true, down: true }, 65);
  assert.equal(p.slideLeft, 0);
});
test("a jump just before landing fires after landing; walking off an edge briefly preserves the ground jump", () => {
  const m = drill(),
    p = m.player;
  p.y = 344;
  p.vy = 115;
  p.grounded = false;
  p.jumps = 2;
  move(m, { jump: true });
  assert.equal(p.grounded, true);
  move(m, {});
  assert.ok(p.vy < 0 && p.jumps === 1);
  const edge = drill().player;
  Object.assign(p, edge, { x: 505, y: 275, vx: 205, grounded: true });
  move(m, { right: true }, 3);
  move(m, { right: true, jump: true });
  assert.equal(p.jumps, 1);
});
test("a deliberate fast-fall and platform drop give control of the lower route", () => {
  const m = drill(),
    p = m.player;
  p.x = 680;
  p.y = 208;
  move(m, { down: true });
  assert.ok(p.y > 208);
  move(m, { down: true }, 30);
  assert.equal(p.y, Yard.floor);
});
