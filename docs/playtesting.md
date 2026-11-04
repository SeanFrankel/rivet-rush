# Does the fight make you want another round?

**Guiding principle.** A good Kiln Yard fight leaves you with a specific idea for the next wave. You should be able to point to the opening you saw, the risk you took and something the other pilot could have done. Keep that test in every feature pitch, playtest and release decision. Also ask whether crossing the yard is enjoyable before a shot is fired. The MOBA decisions are when to farm, when to rotate, who to protect and how to turn a won fight into damage on the enemy base.

## What we learned from related games

| Developer evidence | Rivet Rush hypothesis | Experiment and failure signal |
| --- | --- | --- |
| Ronimo describes an early Awesomenauts where overlapping fighters made melee exchanges unreadable. Adding combos and parries still left players trading hits in a pile. [Joost van Dongen, development retrospective](https://joostdevblog.blogspot.com/2013/04/from-melee-to-ranged-most-difficult.html) | Strong movement and visible projectile paths can make spacing matter even to someone learning one gun. | Record a crowded wave. Ask each pilot to point out what hit them and show a dodge on the next wave. Rework targeting or feedback if standing still and holding fire feels equally effective. |
| Riot distinguishes an immediate response to a threat from a strategic response before the fight, and ties stronger effects to stronger opportunities to answer. [Riot, Champion Counterplay](https://www.leagueoflegends.com/en-gb/news/dev/quick-gameplay-thoughts-may-14/) | A sentry volley can reward hiding behind crawlers now; an enemy climbing for the bridge can invite a lane push over the next few seconds. | Ask the losing pilot what response was available. If players understand the threat only after dying, try an earlier cue. If they see it but have no viable response, adjust timing or geometry. |
| Riot's clarity work prioritizes the most consequential event in a busy scene and matches effects to actual hit areas. [Riot, Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/) | A new pilot should read incoming sentry fire and the pulse boundary amid crawler fire. | Replay a busy encounter at normal speed. Ask which threat mattered most and where safety began. Compare recognition before and after a single cue change. |

These developer accounts motivate experiments. They supply no evidence about how our players feel.

## What the prototype already reveals

At revision `3e1a27a`, deterministic 60 Hz trials produced the following outcomes. The input policy walks right until x=1600 each time it spawns. Purchases and pulses are requested every tick when enabled. No policy jumps. One run per policy is sufficient to reproduce this deterministic scenario.

| Input policy | Winner / match time | Human pilot deaths |
| --- | --- | ---: |
| Stand idle | Cinder / 65.7 s | 4 |
| Walk only | Cinder / 80.7 s | 9 |
| Walk and fire | Still playing at 600 s | 52 |
| Walk, fire and buy | Torch / 178.7 s | 12 |
| Walk, fire, buy and pulse | Torch / 152.2 s | 10 |

The last script wins without adjusting tactics or touching the crane. The ten-minute stalemate shows how much the single purchase path can dominate progress. Both are reasons to test the core loop before adding pilots. Compare a practiced escort, a bridge flank and the simple walk-forward policy on the same build. Reward deliberate positioning without making first-time players helpless.

## Experiment 01 · Can you read and dodge a sentry shot?

Revision `85dfe31` introduced a 0.42 s locked sightline to both sentries. In a controlled encounter with the target 120 px away, staying still costs 12 HP; jumping 0.40 s after acquisition avoids the hit. Run the paired regression with `node --test tests/match.test.js`.

Repeat the five full-match policies with `node tools/compare-pushes.cjs`. On the sightline build, idle and walking lose at 63.4 s, walking and firing reaches the 600 s cutoff, adding purchases wins at 166.1 s, and adding pulse wins at 166.5 s. The simple push still wins. The new cue provides a mechanically effective response; its readability and appeal need a human test. In the next sessions, tally who moves after first seeing the line, how many dodge on the next encounter, and whether they choose to try again. If testers see the warning yet jump late, compare a longer warning before changing damage.

## First human session

Use the [session record template](playtests/session-template.md) so both completed and abandoned matches count toward the decision.

1. Use a fresh build and record its commit, device/browser, control setup, prior platformer/MOBA experience and whether the tester has played this build. Use anonymous participant IDs. Aim for six first-time pilots across different experience levels. Report the actual count.
2. Give the goal (“break the other reactor”), the controls and up to ten minutes. Observe without hints. Mark first contact, first intentional use of a crawler as cover, first purchase, first death, and every deliberate route change. Mark help, abandonment and stalemate explicitly.
3. Ask what changed the last fight, what they could have done and where they would go next. Offer a real choice to stop or rematch. Record voluntary rematches before scheduling any forced second run.
4. For testers who continue, alternate a lane escort and a vault rotation across participants. In private rooms, swap sides and pilot kits, then repeat under voice and silent play. Record whether an opponent noticed and punished or exploited the route.
5. Proposed discovery gate: at least 4/6 first-time pilots elect to replay and at least 4/6 can identify a plausible different action after a loss or setback. Observe at least two distinct tactics succeeding in live encounters. Count assisted and unassisted results separately. A small group informs the next iteration; repeat with fresh testers before expanding scope.

**Decision rule.** If the gate fails, isolate the largest source of confusion or repetitive play, change one rule or cue, and repeat. If testers like shooting but ignore the bridge, test its opportunity cost before adding another objective. If finishing a match requires holding buy until upgrades take effect, compare one meaningful upgrade choice with the baseline. Capture counterexamples even when the counts pass.

**Session record to copy.** Date and build · hypothesis and one changed variable · participants and conditions · timestamped observations with numerator/denominator · anonymous player words · rematch offers and acceptances · missed or incomplete matches · keep/change/cut decision · owner, next build and retest. Link each record here and from the relevant roadmap gate. No human session results have been recorded yet.


## Movement and MOBA session for the two-kit build

Start in **Movement run**. Give the tester one lap to find a route, then let them decide whether to retry it. Record where they intended a short hop, dash leap, drop or slide, what happened, and whether they could repeat the move. Record completion time as context. Faster alone does not establish better feel.

In a private 2v2, ask a duo to pick their own pilots and spend their first 12 scrap. Observe a last hit or pickup, their first contested objective, what their teammate contributed and whether a won fight led to structure damage. Ask both teams which move they would make differently next time. Record voluntary rematches separately from requested role swaps. [Engineering evidence and remaining human gates](playtests/2026-11-03-foundations.md)
