"use strict";
// Shared wire vocabulary. Held movement survives ticks. Edge actions are consumed once.
const RivetWire = (() => {
  const version = 8;
  const held = ["left", "right", "fire", "down"];
  const edges = [
    "jump",
    "dash",
    "pulse",
    "buy",
    "drive",
    "crane",
    "coil",
    "fireTap",
    "jumpRelease",
    "skill2",
    "skill3",
    "ultimate",
  ];
  const actions = [...held, ...edges];
  function encode(input) {
    return actions.reduce((mask, action, i) => mask | (input[action] ? 1 << i : 0), 0);
  }
  function decode(mask) {
    return Object.fromEntries(actions.map((action, i) => [action, Boolean(mask & (1 << i))]));
  }
  const edgeMask = ((1 << edges.length) - 1) << held.length;
  const maxMask = (1 << actions.length) - 1;
  // Keep schemas beside the encoder and decoder. The authoritative simulation
  // retains full precision. Clients receive hundredths of a pixel or second.
  const kinds = ["pilot", "crawler", "breaker", "sentry", "reactor", "keeper"];
  const common = ["id", "team", "x", "y", "hp", "dir", "cd", "flash", "barrier", "slow", "slowTime"];
  const pilotFields = [
    "seat",
    "kit",
    "max",
    "damage",
    "vy",
    "knock",
    "jumps",
    "dash",
    "dashLeft",
    "dashDir",
    "pulse",
    "windup",
    "recovery",
    "respawn",
    "scrap",
    "rank",
    "driveRank",
    "kills",
    "deaths",
    "damageDealt",
    "jumpBuffer",
    "coyote",
    "dropTime",
    "dropY",
    "notice",
    "lastHits",
    "farmScrap",
    "objectiveDamage",
    "shieldGiven",
    "coilRank",
    "spawnGuard",
    "downedBy",
    "vx",
    "slideLeft",
    "slideCooldown",
    "recap",
    "cooldowns",
    "anchor",
    "skillDashSpeed",
    "skillDashVy",
    "skillDashDamage",
    "skillDashForce",
    "skillDashLift",
    "castMask",
  ];
  const flags = [
    "grounded",
    "moving",
    "lunge",
    "slamming",
    "repairing",
    "canShortHop",
    "slideLatched",
    "skillDash",
    "skillEvade",
  ];
  const shotFields = ["id", "source", "team", "x", "y", "vx", "vy", "siege", "ability"];
  const effectFields = ["id", "kind", "team", "dir", "x", "y", "size", "duration", "life"];
  const dropFields = ["id", "team", "x", "y", "amount", "life", "type"];
  const mortarFields = ["id", "team", "x", "y", "target", "left"];
  function values(obj, fields) {
    return fields.map((key) =>
      typeof obj[key] === "number" ? Math.round(obj[key] * 100) / 100 : obj[key],
    );
  }
  function assign(obj, fields, row, offset = 0) {
    for (let i = 0; i < fields.length; i++) obj[fields[i]] = row[offset + i];
    return obj;
  }
  function pack(m) {
    const units = m.units.map((u) => {
      const row = [kinds.indexOf(u.kind), ...values(u, common)];
      if (u.kind === "pilot") {
        row.push(
          ...values(u, pilotFields),
          flags.reduce((bits, key, i) => bits | (u[key] ? 1 << i : 0), 0),
        );
        if (u.notice > 0) row.push(u.note);
      }
      if (u.kind === "sentry" && u.aim) row.push(...values(u.aim, ["x", "y", "remaining"]));
      if (u.kind === "reactor") row.push(u.shielded ? 1 : 0);
      if (u.kind === "keeper") row.push(Math.round(u.charge * 100) / 100);
      if (u.kind === "breaker" && u.mortarCharge > 0)
        row.push(Math.round(u.mortarCharge * 100) / 100);
      return row;
    });
    return {
      tick: m.tick,
      wave: m.wave,
      bridge: Math.round(m.bridge * 100) / 100,
      winner: m.winner,
      endReason: m.endReason,
      units,
      contracts: m.contracts,
      neutralAt: m.neutralAt,
      announcementUntil: m.announcementUntil,
      announcement: m.time < m.announcementUntil ? m.announcement : "",
      shots: m.shots.map((s) => values(s, shotFields)),
      fx: m.fx.map((f) => values(f, effectFields)),
      drops: m.drops.map((d) => values(d, dropFields)),
      mortars: m.mortars.map((s) => values(s, mortarFields)),
      zones: m.zones.map((z) => ({ id: z.id, source: z.source, team: z.team, x: z.x, y: z.y,
        radius: z.radius, left: z.left, delay: z.delay, heal: z.heal, shield: z.shield, trigger: z.trigger })),
    };
  }
  function unpack(packet, stats, kits) {
    const units = packet.units.map((row) => {
      const kind = kinds[row[0]],
        u = assign({ kind, ...stats[kind] }, common, row, 1);
      const next = common.length + 1;
      if (kind === "pilot") {
        assign(u, pilotFields, row, next);
        const profile = kits[u.kit];
        u.speed = profile.speed;
        u.range = profile.range;
        u.rate = profile.rate;
        const bits = row[next + pilotFields.length];
        for (let i = 0; i < flags.length; i++) u[flags[i]] = Boolean(bits & (1 << i));
        u.note = row[next + pilotFields.length + 1] || "";
        u.struck = [];
      }
      if (kind === "sentry" && row.length > next)
        u.aim = assign({}, ["x", "y", "remaining"], row, next);
      if (kind === "reactor") u.shielded = !!row[next];
      if (kind === "keeper") u.charge = row[next];
      if (kind === "breaker") u.mortarCharge = row[next] || 0;
      return u;
    });
    return {
      ...packet,
      time: packet.tick / 60,
      units,
      shots: packet.shots.map((row) => assign({}, shotFields, row)),
      fx: packet.fx.map((row) => assign({}, effectFields, row)),
      drops: packet.drops.map((row) => assign({}, dropFields, row)),
      mortars: packet.mortars.map((row) => assign({}, mortarFields, row)),
    };
  }
  return {
    version,
    held,
    edges,
    encode,
    decode,
    edgeMask,
    maxMask,
    pack,
    unpack,
  };
})();
if (typeof module !== "undefined") module.exports = RivetWire;
