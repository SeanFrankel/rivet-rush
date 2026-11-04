"use strict";
// Shared, deterministic execution of the roster's declarative ability operations.
const RivetAbilities = (() => {
  function create(api) {
    const { heroes, effect, note, middle, distance, width, floor } = api;
    const cooldown = (u, slot) => slot ? u.cooldowns[slot - 1] : u.pulse;
    const setCooldown = (u, slot, value) => { if (slot) u.cooldowns[slot - 1] = value; else u.pulse = value; };
    function aim(m, u, k) {
      if (Number.isInteger(k.aim) && k.aim >= 0 && k.aim < 256) return k.aim * Math.PI / 128;
      const target = m.units.filter((v) => v.hp > 0 && v.team !== u.team &&
        (v.x - u.x) * u.dir >= -8 && distance(u, v) < 420)
        .sort((a, b) => distance(u, a) - distance(u, b))[0];
      return target ? Math.atan2(middle(target) - middle(u), target.x - u.x) : u.dir > 0 ? 0 : Math.PI;
    }
    function move(u, op) {
      u.dashLeft = op.duration || 0;
      u.dashDir = (Math.sign(op.vx) || 1) * u.dir;
      u.skillDash = true;
      u.skillEvade = !!op.evade;
      u.skillDashSpeed = Math.abs(op.vx || 0);
      u.skillDashVy = op.vy ?? null;
      u.skillDashDamage = op.contactDamage ? op.contactDamage + 4 * u.coilRank * (op.coilScale ?? 1) : 0;
      u.skillDashForce = op.force || 180;
      u.skillDashLift = op.lift || 90;
      u.lunge = op.contactDamage > 0;
      u.struck = [];
      u.vx = (op.vx || 0) * u.dir;
      if (op.vy !== undefined) {
        u.vy = op.vy; u.grounded = false; u.jumps = Math.max(1, u.jumps); u.canShortHop = false;
      }
      u.slideLeft = 0;
    }
    function tryCast(m, u, k, actions) {
      const keys = ["pulse", "skill2", "skill3", "ultimate"];
      for (let slot = 0; slot < 4; slot++) {
        if (!k[keys[slot]]) continue;
        const skill = heroes.skills[u.kit][slot];
        if (slot === 1 && u.anchor) {
          if (Math.hypot(u.x - u.anchor.x, u.y - u.anchor.y) > u.anchor.maxDistance) {
            note(u, "Anchor out of range"); return;
          }
          effect(m, "boost", u, 35, .25);
          u.x = u.anchor.x; u.y = u.anchor.y; u.vx = 0; u.vy = 0;
          u.grounded = false; u.dashLeft = 0; u.anchor = null;
          effect(m, "boost", u, 35, .25); note(u, "Anchor return"); return;
        }
        if (cooldown(u, slot) > 0 || u.dashLeft > 0) continue;
        setCooldown(u, slot, Math.max(.5, skill.cooldown - .2 * u.coilRank));
        u.castMask |= 1 << slot;
        u.spawnGuard = 0;
        const operations = heroes.cast(u.kit, slot, { grounded: u.grounded });
        for (const op of operations) {
          if (op.kind === "core") {
            if (u.grounded) actions.push({ type: "pulse", u });
            else { u.slamming = true; u.windup = .15; u.vy = 0; effect(m, "prime", u, 25, .15); }
          } else if (op.kind === "move") {
            move(u, op); effect(m, u.lunge ? "lunge" : "dash", u, 42, .25);
          } else if (op.kind === "resetDash") u.dash = op.amount === undefined ? 0 : Math.max(0, u.dash - op.amount);
          else if (op.kind === "anchor") {
            u.anchor = { x: u.x, y: u.y, left: op.duration, maxDistance: op.maxDistance };
          } else actions.push({ type: "hero", u, op, angle: k.skillAim ?? aim(m, u, k), x: u.x, y: middle(u), dir: u.dir });
        }
        note(u, skill.name);
        return;
      }
    }
    function zone(m, action, op) {
      m.zones.push({ id: ++m.serial, source: action.u.id, team: action.u.team,
        x: Math.max(20, Math.min(width - 20, action.x + (op.offsetX || 0) * action.dir)),
        y: Math.max(30, Math.min(floor, action.y + (op.offsetY || 0))),
        radius: op.radius, left: op.duration ?? .05, delay: op.delay || 0,
        pulses: op.once || op.kind === "blast" ? 1 : Math.max(1, Math.ceil((op.duration ?? .05) / (op.interval || .3))),
        interval: op.interval || .3, next: 0, damage: (op.damage || 0) + (op.damage ? 4 * action.u.coilRank * (op.coilScale ?? 1) : 0),
        shield: op.shield || 0, heal: op.heal || 0, slow: op.slow || 1, pull: op.pull || 0,
        force: op.force || 0, lift: op.lift || 0, once: op.once || op.kind === "blast", trigger: !!op.trigger });
    }
    function resolve(m, action, hits) {
      const { u, op, angle } = action;
      if (op.kind === "zone" || op.kind === "blast") { zone(m, action, op); return; }
      if (op.kind === "guard") {
        for (const ally of m.units) {
          if (!ally.hp || ally.team !== u.team || !ally.speed || distance(u, ally) > op.radius) continue;
          if (op.heal) ally.hp = Math.min(ally.max, ally.hp + op.heal);
          if (op.shield) {
            const strength = op.shield + 5 * u.coilRank;
            u.shieldGiven += Math.max(0, strength - ally.barrier);
            ally.barrier = Math.max(ally.barrier, strength); ally.barrierTime = Math.max(ally.barrierTime, op.duration || 2.4);
          }
          if (op.dashRefund && ally.kind === "pilot") ally.dash = Math.max(0, ally.dash - op.dashRefund);
        }
        effect(m, "rally", u, op.radius, .35); return;
      }
      if (op.kind === "projectile") {
        if (op.delay > 0) {
          m.delayed.push({ left: op.delay, action: { ...action, op: { ...op, delay: 0 } } });
          effect(m, "prime", u, 28, op.delay); return;
        }
        const count = op.count || 1;
        for (let i = 0; i < count; i++) {
          const heading = angle + (op.angleOffset || 0) + (i - (count - 1) / 2) * (op.spread || 0);
          m.shots.push({ id: ++m.serial, source: u.id, team: u.team, x: u.x, y: middle(u),
            vx: Math.cos(heading) * op.speed, vy: Math.sin(heading) * op.speed,
            damage: op.damage + 4 * u.coilRank * (op.coilScale ?? 1), left: op.range, upperShot: u.y <= 230, originY: u.y,
            force: op.force || 0, lift: op.lift || 0, pull: !!op.pull,
            pierce: op.pierce || 0, hitIds: [], ability: true });
        }
      }
    }
    function step(m, dt, hits) {
      for (const delayed of m.delayed) {
        delayed.left -= dt;
        if (delayed.left <= 0 && delayed.action.u.hp > 0) resolve(m, delayed.action, hits);
      }
      m.delayed = m.delayed.filter((d) => d.left > 0);
      for (const z of m.zones) {
        if (z.delay > 0) { z.delay = Math.max(0, z.delay - dt); continue; }
        z.left -= dt; z.next -= dt;
        if (z.next > 0 || z.pulses <= 0) continue;
        const source = m.units.find((u) => u.id === z.source);
        const inside = m.units.filter((u) => u.hp > 0 && Math.hypot(u.x - z.x, middle(u) - z.y) <= z.radius);
        if (z.trigger && !inside.some((u) => u.team !== z.team)) continue;
        for (const target of inside) {
          if (target.kind === "keeper" && z.y > target.y + 64) continue;
          if (target.team === z.team) {
            if (target.speed && z.heal) target.hp = Math.min(target.max, target.hp + z.heal);
            if (target.speed && z.shield) {
              if (source) source.shieldGiven += Math.max(0, z.shield - target.barrier);
              target.barrier = Math.max(target.barrier, z.shield); target.barrierTime = Math.max(target.barrierTime, .6);
            }
          } else {
            if (z.slow < 1 && target.speed && !target.spawnGuard) { target.slow = z.slow; target.slowTime = .45; }
            const dir = Math.sign(z.pull ? z.x - target.x : target.x - z.x) || 1;
            hits.push({ target, source, damage: z.damage, dir, force: z.pull || z.force, lift: z.lift });
          }
        }
        z.next += z.interval; z.pulses--;
        if (z.once) { z.left = 0; effect(m, "pulse", { x: z.x, y: z.y, team: z.team, dir: 1, kind: "pilot" }, z.radius, .25, z.y); }
      }
      m.zones = m.zones.filter((z) => z.left > 0);
    }
    function melee(m, u, hits, angle) {
      if (u.cd > 0) return;
      u.cd = u.rate;
      const a = angle ?? (u.dir > 0 ? 0 : Math.PI);
      for (const target of m.units) {
        if (!target.hp || target.team === u.team || distance(u, target) > u.range) continue;
        if (target.kind === "keeper" && u.y > target.y + 81) continue;
        const dx = target.x - u.x, dy = middle(target) - middle(u), d = Math.hypot(dx, dy) || 1;
        if ((dx * Math.cos(a) + dy * Math.sin(a)) / d < .15) continue;
        hits.push({ target, source: u, damage: u.damage });
      }
      effect(m, "slash", u, u.range, .16);
    }
    return { tryCast, resolve, step, melee, cooldown, aim };
  }
  return { create };
})();
if (typeof module !== "undefined") module.exports = RivetAbilities;
