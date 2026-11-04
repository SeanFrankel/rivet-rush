"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Yard = require("../match");
const Heroes = require("../heroes");
const wire = require("../protocol");
const keys = ["pulse", "skill2", "skill3", "ultimate"];
function arena(kit, teamSize = 1) {
  const m = Yard.create({ kits: { 0: kit }, teamSize });
  m.training = true;
  m.units = m.units.filter((u) => u.kind === "pilot");
  const p = m.player;
  p.x = 600; p.dir = 1;
  for (const u of m.units) { u.spawnGuard = 0; if (u !== p) u.x = 1100; }
  return m;
}
function tick(m, input = {}, n = 1) {
  for (let i = 0; i < n; i++) Yard.stepSeats(m, { 0: input, 1: {}, 2: {}, 3: {} });
}
test("all 24 abilities execute in the shared simulation and spend their own cooldown", () => {
  for (const id of Heroes.order) for (let slot = 0; slot < 4; slot++) {
    const m = arena(id), p = m.player;
    tick(m, { [keys[slot]]: true });
    assert.ok(Yard.skillCooldown(p, slot) > Heroes.skills[id][slot].cooldown - .1, `${id}/${slot}`);
    assert.ok(m.fx.length || m.shots.length || m.zones.length || m.delayed.length || p.anchor,
      `${id}/${slot} has an observable effect`);
    const cooldown = Yard.skillCooldown(p, slot);
    tick(m, { [keys[slot]]: true });
    assert.ok(Yard.skillCooldown(p, slot) < cooldown, `${id}/${slot} cannot freely recast`);
    tick(m, {}, 60);
    for (const u of m.units) assert.ok([u.x, u.y, u.hp, u.vx, u.vy].every(Number.isFinite));
  }
});
test("three melee basics cleave in reach without projectiles while ranged basics launch shots", () => {
  for (const id of Heroes.order) {
    const m = arena(id), p = m.player, enemy = m.units.find((u) => u.team === 1);
    enemy.x = p.x + 45;
    const hp = enemy.hp;
    tick(m, { fire: true, aim: 0 });
    if (Heroes.profiles[id].attackType === "melee") {
      assert.equal(m.shots.length, 0, id);
      assert.ok(enemy.hp < hp, id);
      const far = arena(id), target = far.units.find((u) => u.team === 1);
      target.x = far.player.x + far.player.range + 15;
      tick(far, { fire: true, aim: 0 });
      assert.equal(target.hp, target.max, `${id} cannot hit beyond melee reach`);
    } else assert.ok(m.shots.length > 0, `${id} fires a projectile`);
  }
});
test("anchor return keeps spent health and cooldowns and enforces its leash", () => {
  const m = arena("echo"), p = m.player;
  tick(m, { skill2: true });
  const origin = p.anchor.x;
  p.x = origin + 421;
  tick(m, { skill2: true });
  assert.ok(p.anchor, "out-of-range attempt keeps anchor");
  assert.ok(p.x > origin + 400);
  p.x = origin + 180; p.hp -= 30; p.cooldowns[1] = 5;
  tick(m, { skill2: true });
  assert.equal(p.anchor, null);
  assert.equal(p.x, origin);
  assert.equal(p.hp, p.max - 30);
  assert.ok(p.cooldowns[0] > 10 && p.cooldowns[1] > 4.9);
});
test("Warden rally repairs and shields a nearby ally without helping an enemy", () => {
  const m = arena("warden", 2), p = m.player;
  const ally = m.units.find((u) => u.team === 0 && u !== p);
  const enemy = m.units.find((u) => u.team === 1);
  ally.x = p.x + 60; enemy.x = p.x + 90;
  ally.hp -= 40; enemy.hp -= 40; ally.dash = 2;
  tick(m, { skill3: true });
  assert.equal(ally.hp, ally.max - 22);
  assert.ok(ally.barrier >= 16);
  assert.ok(ally.dash < 1.3);
  assert.equal(enemy.hp, enemy.max - 40);
  assert.equal(enemy.barrier, 0);
});
test("Fuse charge waits through arming then an NPC can consume it exactly once", () => {
  const m = arena("fuse"), p = m.player;
  const source = Yard.create().units.find((u) => u.kind === "crawler" && u.team === 1);
  const npc = { ...source, id: 9999, x: p.x + 100, speed: 0, hp: 200, max: 200, cd: 100 };
  m.units.push(npc);
  tick(m, { skill3: true });
  assert.equal(npc.hp, 200);
  tick(m, {}, 20);
  assert.equal(npc.hp, 200, "warning cannot damage");
  tick(m, {}, 20);
  assert.equal(npc.hp, 168);
  assert.equal(m.zones.length, 0, "trigger removes charge");
  tick(m, {}, 30);
  assert.equal(npc.hp, 168, "no repeated trap hit");
});
test("death does not refund a long ultimate cooldown or preserve a return anchor", () => {
  const m = arena("echo"), p = m.player;
  tick(m, { skill2: true });
  tick(m, { ultimate: true });
  p.hp = 0; p.respawn = 1;
  tick(m, {}, 61);
  assert.equal(p.hp, p.max);
  assert.equal(p.anchor, null);
  assert.ok(p.cooldowns[2] > 18, "ultimate remains spent after respawn");
});
test("Gravity Well gives a warning, six pulses and one total Coils damage bonus", () => {
  const m = arena("rook"), p = m.player;
  const enemy = m.units.find((u) => u.team === 1);
  p.coilRank = 1; enemy.x = p.x + 105;
  const initial = enemy.hp;
  tick(m, { ultimate: true });
  tick(m, {}, 15);
  assert.equal(enemy.hp, initial, "marked well has not armed");
  tick(m, {}, 180);
  assert.ok(Math.abs(initial - enemy.hp - 46) < 1e-8, "6 × 7 base damage plus 4 Coils");
});
test("Hold the Line does not shorten its stronger opening barrier to a field pulse", () => {
  const m = arena("warden"), p = m.player;
  tick(m, { ultimate: true });
  assert.equal(p.barrier, 28);
  assert.ok(p.barrierTime > 2.3);
  tick(m, {}, 40);
  assert.equal(p.barrier, 28, "opening barrier survives beyond the pulse's short duration");
});
test("Arc Surge splits one Coils bonus across its volley and damaging dash", () => {
  const m = arena("runner"), p = m.player;
  p.coilRank = 1;
  tick(m, { ultimate: true, aim: 0 });
  assert.equal(m.shots.length, 3);
  const bonus = m.shots.reduce((sum, s) => sum + s.damage - 14, 0) + p.skillDashDamage - 20;
  assert.ok(Math.abs(bonus - 4) < 1e-8);
});
test("Rook hook pulls a pilot toward its source instead of pushing it away", () => {
  const m = arena("rook"), p = m.player;
  const enemy = m.units.find((u) => u.team === 1);
  enemy.x = p.x + 180;
  tick(m, { pulse: true, aim: 0 });
  tick(m, {}, 20);
  assert.equal(enemy.hp, enemy.max - 18);
  assert.ok(enemy.knock < 0 && enemy.x < p.x + 180);
});
test("Echo ultimate evades projectiles during its crossing but Shear Step does not", () => {
  function exchange(key) {
    const m = arena("echo"), p = m.player;
    tick(m, { [key]: true });
    m.shots.push({ id: ++m.serial, source: m.units.find((u) => u.team === 1).id,
      team: 1, x: p.x + 12, y: p.y - 17, vx: 0, vy: 0, damage: 20, left: 60 });
    tick(m);
    return p.max - p.hp;
  }
  assert.equal(exchange("ultimate"), 0);
  assert.equal(exchange("skill3"), 20);
});
test("simultaneous airborne Return Fire aims from one shared starting state", () => {
  const m = arena("runner"), p = m.player;
  const enemy = m.units.find((u) => u.team === 1);
  p.x = 700; enemy.x = Yard.width - 700;
  p.y = enemy.y = 300; p.vy = enemy.vy = 100;
  p.grounded = enemy.grounded = false;
  p.dir = 1; enemy.dir = -1;
  Yard.stepSeats(m, { 0: { skill3: true }, 1: { skill3: true } });
  const a = m.shots.filter((s) => s.team === 0).sort((a,b) => a.vy - b.vy);
  const b = m.shots.filter((s) => s.team === 1).sort((a,b) => a.vy - b.vy);
  assert.equal(a.length, 3); assert.equal(b.length, 3);
  for (let i = 0; i < a.length; i++) {
    assert.ok(Math.abs(a[i].vx + b[i].vx) < 1e-8, "mirrored horizontal velocity");
    assert.ok(Math.abs(a[i].vy - b[i].vy) < 1e-8, "equal vertical velocity");
  }
});
test("every ability's pilot movement and cooldowns predict from a wire snapshot", () => {
  for (const kit of Heroes.order) for (let slot = 0; slot < 4; slot++) {
    const m = arena(kit), p = m.player;
    const view = Yard.follow(wire.unpack(JSON.parse(JSON.stringify(wire.pack(m))), Yard.stats, Yard.kits), 0);
    const input = { [keys[slot]]: true, aim: 0 };
    Yard.predictPilot(view, view.player, input);
    tick(m, input);
    for (const field of ["x", "y", "vx", "vy", "dashLeft", "pulse"]) {
      assert.equal(view.player[field], p[field], `${kit}/${slot}/${field}`);
    }
    assert.deepEqual(view.player.cooldowns, p.cooldowns, `${kit}/${slot} cooldowns`);
    assert.deepEqual(view.player.anchor, p.anchor, `${kit}/${slot} anchor`);
  }
});
