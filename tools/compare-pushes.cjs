// Run from the repo root. Optionally compare an older match.js on disk.
const path = require("node:path");
const Yard = require(path.resolve(process.argv[2] || "match.js"));
const policies = [
  ["Idle", {}],
  ["Walk", { walk: true }],
  ["Walk and fire", { walk: true, fire: true }],
  ["Add purchases", { walk: true, fire: true, buy: true }],
  ["Add pulse", { walk: true, fire: true, buy: true, pulse: true }],
];
for (const [name, policy] of policies) {
  const match = Yard.create();
  let deaths = 0;
  for (let tick = 0; tick < 36000 && match.winner === null; tick++) {
    const hp = match.player.hp;
    Yard.step(match, { ...policy, right: policy.walk && match.player.x < 1600 }, 1 / 60);
    if (hp > 0 && match.player.hp === 0) deaths++;
  }
  const winner = ["Torch", "Cinder"][match.winner] || "Unresolved";
  console.log(name, winner, match.time.toFixed(1) + "s", deaths + " deaths");
}
