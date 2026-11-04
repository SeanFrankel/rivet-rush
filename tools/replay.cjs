"use strict";
const fs = require("node:fs");
const Replay = require("../replay");
const source = process.argv[2];
try {
  if (!source) throw Error("Usage: node tools/replay.cjs <downloaded-match.json>");
  if (fs.statSync(source).size > 4 * 1024 * 1024)
    throw Error("Replay exceeds the file size limit.");
  const playback = Replay.load(JSON.parse(fs.readFileSync(source, "utf8")));
  while (playback.advance()) {}
  const game = playback.game,
    verified = playback.verified();
  console.log(
    JSON.stringify(
      {
        verified,
        tick: game.tick,
        seconds: +game.time.toFixed(2),
        winner: game.winner,
        signature: Replay.signature(game),
        crews: game.units
          .filter((u) => u.kind === "pilot")
          .map((p) => ({
            seat: p.seat,
            kit: p.kit,
            kills: p.kills,
            deaths: p.deaths,
            lastHits: p.lastHits,
            rig: p.rank,
            objectiveDamage: Math.round(p.objectiveDamage),
          })),
      },
      null,
      2,
    ),
  );
  if (!verified) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
