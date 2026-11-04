"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const Heroes = require("../heroes");

test("six complete kits provide four distinct active skills beyond their basic attacks", () => {
  assert.equal(Heroes.order.length, 6);
  assert.deepEqual(new Set(Heroes.order), new Set(Object.keys(Heroes.skills)));
  const ids = new Set();
  for (const id of Heroes.order) {
    const profile = Heroes.profiles[id], skills = Heroes.skills[id];
    assert.equal(skills.length, 4);
    for (const key of ["max", "speed", "range", "damage", "rate", "jumpSpeed", "burstSpeed", "recharge", "lungeDamage"])
      assert.ok(Number.isFinite(profile[key]) && profile[key] > 0, id + " " + key);
    assert.ok(skills.some((skill) => skill.intent === "mobility" || skill.intent === "defense"));
    for (const [slot, skill] of skills.entries()) {
      assert.ok(skill.name && skill.description && skill.counterplay);
      assert.ok(skill.cooldown > 0 && Number.isFinite(skill.cooldown));
      if (slot === 3) assert.ok(skill.cooldown >= 18 && skill.cooldown <= 24);
      assert.ok(!ids.has(skill.id), "unique skill identity " + skill.id);
      ids.add(skill.id);
      assert.ok(Heroes.cast(id, slot).length > 0);
    }
  }
  assert.equal(ids.size, 24);
});

test("melee kits have actual close basic attacks and their own ways to approach", () => {
  const melee = Heroes.order.filter((id) => Heroes.profiles[id].attackType === "melee");
  const ranged = Heroes.order.filter((id) => Heroes.profiles[id].attackType === "ranged");
  assert.deepEqual(melee, ["warden", "rook", "echo"]);
  assert.deepEqual(ranged, ["runner", "vesper", "fuse"]);
  assert.ok(melee.every((id) => Heroes.profiles[id].range <= 84));
  assert.ok(ranged.every((id) => Heroes.profiles[id].range >= 235));
  assert.ok(Heroes.cast("warden", 1).some((a) => a.kind === "guard"));
  assert.ok(Heroes.cast("rook", 0).some((a) => a.kind === "projectile" && a.pull));
  assert.ok(Heroes.cast("echo", 1).some((a) => a.kind === "anchor"));
});

test("ability operations satisfy the engine contract without hidden shared state", () => {
  const allowed = new Set(["core", "blast", "projectile", "move", "zone", "guard", "resetDash", "anchor"]);
  for (const id of Heroes.order) for (let slot = 0; slot < 4; slot++) {
    const first = Heroes.cast(id, slot), second = Heroes.cast(id, slot);
    assert.deepEqual(first, second);
    assert.notEqual(first, second);
    for (const [index, action] of first.entries()) {
      assert.notEqual(action, second[index]);
      assert.ok(allowed.has(action.kind), action.kind);
      for (const [key, value] of Object.entries(action))
        if (typeof value === "number") assert.ok(Number.isFinite(value), id + " " + key);
      if (action.kind === "projectile") {
        assert.ok(Number.isInteger(action.count) && action.count >= 1 && action.count <= 7);
        assert.ok(action.speed > 0 && action.range > 0 && action.damage > 0);
      }
      if (action.kind === "move") {
        assert.ok(action.duration > 0 && action.duration <= 0.3);
        assert.ok(action.vy === undefined || action.vy < 0, "launch velocities are upward");
      }
      if (action.kind === "zone") assert.ok(action.duration > 0 && action.interval > 0);
      if (action.kind === "blast") assert.ok(action.radius > 0 && action.damage > 0);
      action.owner = 99;
      action.damage = 999;
      assert.equal(second[index].owner, undefined);
    }
    assert.deepEqual(Heroes.cast(id, slot), second);
  }
  assert.ok(Object.isFrozen(Heroes.profiles.runner));
  assert.ok(Object.isFrozen(Heroes.skills.runner[0].actions));
});

test("signature abilities preserve their escape and counterplay contracts", () => {
  const anchor = Heroes.cast("echo", 1);
  assert.deepEqual(anchor, [{ kind: "anchor", duration: 7, maxDistance: 420 }]);
  assert.equal(Heroes.skills.echo[1].recast, "anchor");
  assert.ok(!anchor.some((a) => a.heal || a.kind === "resetDash"));
  const mine = Heroes.cast("fuse", 2)[0];
  assert.ok(mine.trigger && mine.once && mine.delay >= 0.5);
  assert.ok(mine.duration <= 5, "route denial expires");
  const lance = Heroes.cast("vesper", 2)[0];
  assert.equal(lance.pierce, 1);
  assert.ok(lance.delay >= 0.25, "a long-range piercing hit has a warning window");
  const well = Heroes.cast("rook", 3)[0];
  assert.ok(well.delay >= 0.4 && well.pull > 0 && well.slow > 0.5);
  const line = Heroes.cast("warden", 3);
  assert.ok(line.some((a) => a.kind === "zone" && a.heal && a.shield));
  assert.ok(!line.some((a) => a.invulnerable), "support does not promise invulnerability");
});

test("coil damage is one budget per cast instead of multiplying across pellets and pulses", () => {
  for (const id of Heroes.order) for (let slot = 0; slot < 4; slot++) {
    const actions = Heroes.cast(id, slot);
    const damage = actions.filter((a) => a.damage > 0 || a.contactDamage > 0);
    if (!damage.length) continue;
    const total = damage.reduce((sum, a) => {
      const instances = a.kind === "projectile" ? a.count || 1
        : a.kind === "zone" && !a.once ? Math.max(1, Math.ceil(a.duration / a.interval)) : 1;
      return sum + a.coilScale * instances;
    }, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, id + " slot " + slot + " scaling budget");
  }
});

test("invalid hero or slot inputs do not produce ability operations", () => {
  for (const id of ["missing", "constructor", "__proto__", null, {}])
    assert.deepEqual(Heroes.cast(id, 0), []);
  for (const slot of [-1, 4, 0.5, NaN, "0", "prototype"])
    assert.deepEqual(Heroes.cast("runner", slot), []);
  assert.deepEqual(Heroes.cast("runner", 0, null), [{ kind: "core" }]);
});
