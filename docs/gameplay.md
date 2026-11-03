# How a Kiln Yard match works

**Implemented:** offline browser skirmish, including the first sentry counterplay experiment. Distances below are simulation pixels. Times are match seconds. [Simulation](../match.js) · [inputs and presentation](../yard.js) · [controls](../README.md).

## From one shot to a whole match

| Timescale | What happens now | Decision to watch |
| --- | --- | --- |
| A volley | Turn toward a target and hold fire. Each projectile keeps its launch direction. Units can intercept enemy shots. | Keep a crawler between you and a sentry, double-jump over a volley, or close to pulse several targets? |
| A wave | Each crew fields three crawlers at deploy and every 12 seconds. They advance on the floor and stop to shoot nearby enemies. | Walk with the wave for cover or give up the front line to climb above it? |
| A push | Enemy deaths fund stronger rivets. Sentries and reactors keep damage between pushes. A fallen pilot misses five seconds and must travel back. | Spend scrap as soon as possible, then choose where to turn that damage into ground. There is currently one upgrade path. |
| A match | Destroying a reactor ends the match. Play Again resets units, damage, waves, progression and timers. | Can you describe which push turned the game and what you would try in a rematch? |

## Combat reference

| Unit | HP | Move speed (px/s) | Target range | Rivet damage | Seconds between shots |
| --- | ---: | ---: | ---: | ---: | ---: |
| Pilot | 135 | 155 | 235 | 10 base | 0.26 |
| Crawler | 48 | 46 | 142 | 7 | 0.95 |
| Sentry | 320 | 0 | 238 | 12 | 0.82 |
| Reactor | 540 | 0 | 120 | 8 | 1.10 |

The player aims at the nearest living enemy ahead within range, measured between unit centers. With no target, the pilot fires horizontally. Rivets travel at 600 px/s with a travel budget of range plus 24 px. A hit consumes the shot. Platforms do not block fire. Autonomous units select the nearest enemy in any direction; when none is in range, mobile units walk toward the opposing base. The opposing pilot uses the same base gun but stays on the floor and never buys, pulses or operates the crane.

Both sentries lock a point when they acquire a target. A dashed sightline appears for 0.42 seconds before the shot. The sentry keeps that firing line even if the target jumps or dies. A pilot may jump after the lock or let a crawler intercept the rivet. The warning is part of the firing cycle shown above.

Shock pulse deals 36 damage to all living enemies within a 128 px center-to-center radius, including structures. It resolves immediately and recharges in four seconds. A pilot respawns at full HP and keeps gun upgrades. Structures stay destroyed. The reactor is vulnerable even while its sentry stands.

## Kiln Yard and the crane

The arena spans 1,780 px. Torch starts on the left, Cinder on the right. Reactors stand 65 px from either edge, sentries 365 px in, and pilots spawn 165 px in. The two lower ledges sit 70 px above the floor; the two upper ledges sit another 67 px higher. Jump through a ledge from below and land on it while descending. The second jump resets upward speed. Landing restores both jumps.

From Torch, climb the first lower platform, double-jump toward the upper platform, then press E by the crane at x=715. Activation fills the 270 px gap between upper decks for ten seconds. Pressing E there again refreshes the timer. The switch is on Torch's side. Crossing time costs lane presence, and the bot currently cannot contest the switch or use the bridge. Whether the route repays that cost is an open playtest question.

## Economy and resets

Any enemy crawler, pilot or sentry death grants the human crew 2, 8 or 15 scrap respectively, regardless of who landed the last hit. Reactors pay zero. Buy anywhere while alive for 12 scrap. Each of three purchases adds 4 rivet damage (10 → 14 → 18 → 22). Pulse damage stays fixed. No persistent unlocks carry into a rematch.

Escape or loss of window focus pauses local simulation, including cooldowns and waves. Resume continues the same match. Online pause policy, team spending and contested crane rules are future design decisions.
