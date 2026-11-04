"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Yard = require("../match");
const wire = require("../protocol");
const idle = { 0: {}, 1: {}, 2: {}, 3: {} };
function ticks(m, n, orders = idle) {
  for (let i = 0; i < n; i++) Yard.stepSeats(m, orders);
}
function arena(teamSize = 1, kits = {}) {
  const m = Yard.create({ teamSize, kits });
  m.units = m.units.filter((u) => u.kind === "pilot");
  m.nextWave = 1000;
  return m;
}
const pilots = (m) => m.units.filter((u) => u.kind === "pilot").sort((a, b) => a.seat - b.seat);

test("a clean dash can pass a rivet; a damaging lunge gives up that protection", () => {
  function exchange(attack) {
    const m = arena(),
      [p, rival] = pilots(m);
    p.x = 600;
    rival.x = 640;
    m.shots.push({
      id: ++m.serial,
      source: rival.id,
      team: 1,
      x: 610,
      y: 328,
      vx: 0,
      vy: 0,
      damage: 12,
      left: 90,
    });
    Yard.stepSeats(m, { 0: { dash: true, fire: attack }, 1: {} });
    return { p, rival, m };
  }
  const safe = exchange(false),
    commit = exchange(true);
  assert.equal(safe.p.hp, safe.p.max);
  assert.equal(commit.p.hp, commit.p.max - 12);
  assert.equal(commit.rival.hp, commit.rival.max - 25);
  ticks(commit.m, 10);
  assert.equal(commit.rival.hp, commit.rival.max - 25);
});
test("air pulse commits to a descent and only strikes on landing", () => {
  const m = arena(),
    [p, rival] = pilots(m);
  p.x = rival.x = 850;
  p.y = 235;
  p.grounded = false;
  p.jumps = 2;
  Yard.stepSeats(m, { 0: { pulse: true }, 1: {} });
  assert.equal(rival.hp, rival.max);
  assert.equal(p.slamming, true);
  ticks(m, 30);
  assert.equal(rival.hp, rival.max - 44);
  assert.equal(p.slamsLanded, 1);
  assert.equal(p.grounded, true);
  assert.equal(p.slamming, false);
});
test("warden covers nearby allies, and unused barrier expires", () => {
  const m = arena(2, { 0: "warden" }),
    [warden, enemy, ally, far] = pilots(m);
  warden.x = 600;
  ally.x = 650;
  enemy.x = 680;
  far.x = 900;
  Yard.stepSeats(m, { ...idle, 0: { pulse: true } });
  assert.equal(warden.barrier, 32);
  assert.equal(ally.barrier, 32);
  assert.equal(enemy.barrier, 0);
  m.shots.push({
    id: ++m.serial,
    source: enemy.id,
    team: 1,
    x: ally.x,
    y: 328,
    vx: 0,
    vy: 0,
    damage: 12,
    left: 60,
  });
  ticks(m, 1);
  assert.equal(ally.barrier, 20);
  assert.equal(ally.hp, ally.max);
  ticks(m, 146);
  assert.equal(ally.barrier, 0);
  assert.equal(warden.pulse > 0, true);
});
test("farm rewards share the bounty, credit the last hit, and permit a delayed steal", () => {
  const m = Yard.create({ teamSize: 2 }),
    [p, rival, ally] = pilots(m);
  const crawler = m.units.find((u) => u.team === 1 && u.kind === "crawler");
  m.units = [p, rival, ally, crawler];
  m.nextWave = 1000;
  p.x = 500;
  ally.x = 200;
  rival.x = 644;
  crawler.x = 620;
  crawler.hp = 1;
  m.shots.push({
    id: ++m.serial,
    source: p.id,
    team: 0,
    x: 620,
    y: 334,
    vx: 0,
    vy: 0,
    damage: 10,
    left: 80,
  });
  ticks(m, 1);
  assert.deepEqual([p.scrap, ally.scrap, rival.scrap, p.lastHits], [4, 2, 0, 1]);
  assert.equal(m.drops.length, 1);
  ticks(m, 50);
  assert.equal(rival.scrap, 0);
  ticks(m, 15);
  assert.equal(rival.scrap, 2);
  assert.equal(m.drops.length, 0);
});
test("crew purchases are independent and the health mod survives a respawn", () => {
  const m = arena(2),
    [p, , ally] = pilots(m);
  p.scrap = 12;
  ally.scrap = 12;
  Yard.stepSeats(m, { ...idle, 0: { drive: true }, 2: { buy: true } });
  assert.equal(p.max, 168);
  assert.equal(p.damage, 10);
  assert.equal(ally.damage, 18);
  assert.equal(ally.max, 190);
  assert.equal(ally.scrap, 0);
  p.hp = 0;
  p.respawn = 0.02;
  ticks(m, 3);
  assert.equal(p.hp, 168);
  assert.equal(p.driveRank, 1);
});
test("a reactor rejects a backdoor until its defending sentry falls", () => {
  const m = Yard.create(),
    [p] = pilots(m);
  const core = m.units.find((u) => u.kind === "reactor" && u.team === 1);
  const tower = m.units.find((u) => u.kind === "sentry" && u.team === 1);
  m.units = [p, tower, core];
  const shoot = (u) => {
    m.shots.push({
      id: ++m.serial,
      source: p.id,
      team: 0,
      x: u.x,
      y: u.y - 12,
      vx: 0,
      vy: 0,
      damage: 20,
      left: 60,
    });
    ticks(m, 1);
  };
  shoot(core);
  assert.equal(core.hp, core.max);
  tower.hp = 1;
  shoot(tower);
  assert.equal(core.shielded, false);
  shoot(core);
  assert.equal(core.hp, core.max - 20);
});
test("simultaneous lethal abilities trade and both pilots earn a KO", () => {
  const m = arena(),
    [a, b] = pilots(m);
  a.x = 800;
  b.x = 830;
  a.hp = b.hp = 20;
  Yard.stepSeats(m, { 0: { pulse: true }, 1: { pulse: true } });
  assert.deepEqual([a.hp, b.hp, a.kills, b.kills], [0, 0, 1, 1]);
});
test("a mirrored 2v2 bot match stays even and has a bounded finish", () => {
  const m = Yard.create({ teamSize: 2 });
  for (let t = 0; t <= 25200 && m.winner === null; t++) {
    Yard.stepSeats(m, {});
    if (t % 120 === 0) {
      const [a, b, c, d] = pilots(m);
      assert.ok(
        Math.abs(a.x + b.x - Yard.width) < 0.1 && Math.abs(c.x + d.x - Yard.width) < 0.1,
        "mirror at tick " + t,
      );
      assert.ok(Math.abs(a.hp - b.hp) < 0.01 && Math.abs(c.hp - d.hp) < 0.01);
    }
  }
  assert.equal(m.winner, 2);
});
test("wire snapshot preserves a selected pilot and enough state to predict an air dash", () => {
  const m = Yard.create({ teamSize: 2, kits: { 1: "warden" } });
  const authority = pilots(m)[1];
  authority.y = 250;
  authority.grounded = false;
  authority.jumps = 1;
  const packet = JSON.parse(JSON.stringify(wire.pack(m)));
  const view = Yard.follow(wire.unpack(packet, Yard.stats, Yard.kits), 1);
  const input = { jump: true, dash: true, left: true };
  Yard.predictPilot(view, view.player, input);
  Yard.stepSeats(m, { ...idle, 1: input });
  assert.equal(view.player.kit, "warden");
  assert.equal(view.player.x, authority.x);
  assert.equal(view.player.y, authority.y);
  assert.equal(view.player.dash, authority.dash);
});
test("either crew can fight the neutral keeper, claim the cell and escort the reward", () => {
  for (const team of [0, 1]) {
    const m = Yard.create({ teamSize: 2 });
    m.units = m.units.filter((u) => u.kind === "sentry" || u.kind === "reactor" || u.seat === team);
    m.neutralAt = 0;
    m.nextWave = 1000;
    for (let i = 0; i < 1200 && !m.contracts[team]; i++) Yard.stepSeats(m, {});
    assert.equal(m.contracts[team], 1);
    assert.equal(m.convoy[team], true);
    assert.ok(m.neutralAt > m.time);
    m.nextWave = 0;
    Yard.stepSeats(m, {});
    assert.equal(m.units.filter((u) => u.kind === "breaker" && u.team === team).length, 1);
    assert.equal(m.units.filter((u) => u.kind === "breaker" && u.team !== team).length, 0);
    assert.equal(m.convoy[team], false);
  }
});
test("meltdown cannot award a win on passive damage; a final enemy hit must take the reactor", () => {
  const m = Yard.create();
  m.units = m.units.filter((u) => u.kind === "reactor");
  m.tick = 60 * 300 - 1;
  m.time = m.tick / 60;
  m.nextWave = 999;
  const enemy = m.units.find((u) => u.team === 1);
  enemy.hp = 1;
  ticks(m, 180);
  assert.equal(enemy.hp, 1);
  assert.equal(enemy.shielded, false);
  assert.equal(m.winner, null);
  m.shots.push({
    id: ++m.serial,
    source: 0,
    team: 0,
    x: enemy.x - 20,
    y: enemy.y - 12,
    vx: 600,
    vy: 0,
    damage: 7,
    left: 40,
  });
  ticks(m, 1);
  assert.equal(m.winner, 0);
  assert.equal(m.endReason, "reactor");
});
test("an overtime Breaker earns one base shot and defenders can prevent the launch", () => {
  function setup() {
    const m = Yard.create();
    m.tick = 18000;
    m.time = 300;
    m.nextWave = 0;
    Yard.stepSeats(m, idle);
    const unit = m.units.find((u) => u.kind === "breaker" && u.team === 0);
    const core = m.units.find((u) => u.kind === "reactor" && u.team === 1);
    m.units = [unit, core];
    unit.x = Yard.width / 2 + 65;
    m.nextWave = 900;
    return { m, unit, core };
  }
  const siege = setup();
  ticks(siege.m, 5);
  assert.ok(siege.unit.mortarCharge > 1);
  ticks(siege.m, 180);
  assert.ok(siege.core.hp < 480);
  assert.ok(siege.unit.mortarSpent);
  const defended = setup();
  ticks(defended.m, 5);
  defended.unit.hp = 0;
  ticks(defended.m, 180);
  assert.ok(defended.core.hp > 510);
  assert.equal(defended.m.mortars.length, 0);
});
