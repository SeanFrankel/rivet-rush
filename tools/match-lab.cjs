"use strict";
// Reproducible play policies. Results are balance diagnostics, never player opinions.
const Yard = require("../match");
function commands(m, p, style) {
  const direction = p.team === 0 ? 1 : -1;
  const objective =
    m.units.find((u) => u.team !== p.team && u.kind === "sentry" && u.hp > 0) ||
    m.units.find((u) => u.team !== p.team && u.kind === "reactor");
  const foes = m.units.filter((u) => u.team === 1 - p.team && u.hp > 0);
  const enemy = foes.sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0] || objective;
  const dx = enemy.x - p.x,
    dy = enemy.y - Yard.height(enemy) / 2 - (p.y - Yard.height(p) / 2);
  const target = style === "siege" && Math.abs(objective.x - p.x) < p.range ? objective : enemy;
  const angle = Math.atan2(
    target.y - Yard.height(target) / 2 - (p.y - Yard.height(p) / 2),
    target.x - p.x,
  );
  let goal = enemy.x - direction * 205;
  const frontline = m.units
    .filter((u) => u.team === p.team && (u.kind === "crawler" || u.kind === "breaker") && u.hp > 0)
    .sort((a, b) => direction * (b.x - a.x))[0];
  if (style === "escort" && frontline) goal = frontline.x - direction * 29;
  if (style === "siege") goal = objective.x - direction * 182;
  if (style === "dive") goal = enemy.x - direction * 60;
  const move = Math.abs(goal - p.x) > 5 ? Math.sign(goal - p.x) : 0;
  const buy = Yard.upgradeCost(p) > 0 && p.scrap >= Yard.upgradeCost(p);
  const build =
    style === "dive"
      ? ["coil", "drive", "coil", "buy", "coil", "drive"]
      : ["buy", "drive", "buy", "coil", "buy", "drive"];
  const sentry = foes.find((u) => u.kind === "sentry");
  const warning = sentry?.aim && Math.abs(sentry.aim.x - p.x) < 30 && sentry.aim.remaining < 0.24;
  const jump = p.grounded && (warning || (style === "dive" && Math.abs(dx) < 110 && p.pulse <= 0));
  return {
    left: move < 0,
    right: move > 0,
    aim: (Math.round((angle * 128) / Math.PI) + 256) % 256,
    fire: true,
    jump,
    pulse: Math.hypot(dx, dy) < 100 && p.pulse <= 0 && !jump,
    dash: style === "dive" && move === Math.sign(dx) && Math.abs(dx) > 80 && Math.abs(dx) < 165,
    ...(buy ? { [build[p.rank]]: true } : {}),
  };
}
function run(style, teamSize, seat, kit = "runner") {
  const m = Yard.create({ teamSize, kits: { [seat]: kit } });
  const p = m.units.find((u) => u.seat === seat);
  while (m.winner === null && m.tick <= 25200) Yard.stepSeats(m, { [seat]: commands(m, p, style) });
  return {
    style,
    teamSize,
    seat,
    kit,
    winner: m.winner,
    seconds: +m.time.toFixed(1),
    deaths: p.deaths,
    kills: p.kills,
    lastHits: p.lastHits,
    rank: p.rank,
    siege: Math.round(p.objectiveDamage),
    contracts: m.contracts.join("/"),
  };
}
if (require.main === module) {
  const rows = [];
  for (const teamSize of [1, 2])
    for (const seat of [0, 1])
      for (const style of ["escort", "poke", "siege", "dive"])
        rows.push(run(style, teamSize, seat));
  console.table(rows);
}
module.exports = { run, commands };
