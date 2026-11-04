# Foundation build · engineering playtest

**Participants:** automated pilots and scripted browser sessions on one Windows computer. Human participants: zero. These results cover repeatability, available tactics and room behavior. A human session is still needed to evaluate movement feel, enjoyment and willingness to rematch.

## Movement

At 60 Hz both kits reach ordinary run speed in five grounded ticks (about 83 ms). Measurements below use a flat unobstructed stretch, hold direction from takeoff, and release after two ticks for the short hop. A boost jump is a jump during a clean dash.

| Pilot | Short-hop height / travel | Full-jump height / travel | Boost-jump height / travel |
| --- | --- | --- | --- |
| Arc Runner | 29 / 80 px | 93 / 162 px | 93 / 255 px |
| Kiln Warden | 28 / 72 px | 87 / 137 px | 87 / 209 px |

The first deck is 70 px high. The extra clearance gives both kits room to land a full jump. A regression test checks that the boosted pilot can reverse direction while airborne. The browser movement drill traverses all six gates, lands on the approach decks, opens the crossing and restarts from the finish screen. The practice timer and personal best are separate for each kit.

Two changes came directly from exercising the keyboard. A very quick fire-and-dash chord could lose the fire input before the next frame. Capturing the chord fixes the strike. A release followed by another jump within one tick could shorten the new jump. The later press now takes precedence. The traversal bot also waits to land on the upper approach deck before committing to the vault crossing.

## Farm, fight and finish

At the start of the session, a simple upgraded push could finish without jumping. Subsequent policies use both crews, NPC last hits, contested pickups, independent builds, two kits and a shielded reactor. A controlled encounter verifies that a stationary target takes a sentry shot and a timed jump clears it. Other encounters verify that an evasive dash can avoid a rivet, a shoulder strike commits the attacker, a Warden shields a nearby ally and a pilot can steal salvage after the exclusive pickup window.

The seven-minute cap exposed a pacing problem. With a Warden as the controlled pilot, all three tested 2v2 policies reached the time limit. We added an interruptible overtime siege shot for a Breaker that advances past midfield. In the subsequent Torch runs, the Warden escort won at 359.4 s, the direct siege won at 407.5 s and the repeated dive drew at 420 s. The intervention gives both crews a specific unit to protect or destroy. These single deterministic runs inform a human comparison. They are not estimates of kit win rates.

Both crews can defeat the neutral Keeper, secure its cell and receive a bonus Breaker. The progression tests check team bounty, personal last-hit credit, delayed salvage theft, purchases and survival of an upgrade through death. The normal victory condition requires actual reactor destruction. Passive decay stops at 1 HP, and simultaneous reactor loss draws.

## Multiplayer

Four independent browser sessions selected kits, deployed, completed a match, downloaded a replay that reproduced the recorded final state and entered a fresh rematch. A separate browser test refreshes a live guest and checks its seat, movement and match ID. Real-socket fault tests exercise version mismatches, malformed input, seat theft, host transfer, duplicate purchases, burst input and 50 room create/leave cycles.

During implementation, compressing the public state reduced a representative 2v2 snapshot from 6,584 to 920 bytes before later farm and roster fields were added. In the first ten-minute browser delay drill, baseline input-to-motion p95 was 14.8 ms and the impaired profile's p95 correction was 10.25 px. The relay used 150 ms RTT, jitter and occasional ordered stalls. This was a local transport test. On the first momentum build the raw direction-change measurement rose to 230.4 ms (baseline) and 239.5 ms (impaired). Countersteering now immediately cancels the pilot's own velocity. The regression test requires more than one pixel of opposite movement on the next simulation tick, including during a boosted leap. Intentional attack commitment and incoming knockback still apply.

## Candidate checks

The local Node suite passed 29 rules, movement, replay and socket checks. Five browser scenarios passed in installed Edge 156, Chrome 156 and Playwright Firefox 157 on Windows. Those scenarios cover deployment, the complete move drill, the traversal course, replay viewing and a four-seat reconnect. The Windows exercise does not cover macOS or a public hosting provider. Docker was unavailable on the test machine; the Node host was exercised directly.

## Published candidate

Game revision `2946493` passed [GitHub's Linux CI run](https://github.com/SeanFrankel/rivet-rush/actions/runs/41743492728). Its clean archive served the entire game after installing production dependencies only. The four-browser release run finished at tick 7,460. Torch won with 6 pilot KOs against Cinder's 13 by destroying the reactor. Both Torch pilots farmed and reached rig level six. All clients agreed, and the same room started a clean rematch. The exported [match replay](../../tests/fixtures/kiln-02.4-2v2.json) reproduces signature `4006c11c` in a clean checkout. These were scripted crews with different objectives, so the result says nothing about human balance.

Run `node tools/replay.cjs tests/fixtures/kiln-02.4-2v2.json` or select this file in **Watch replay** to inspect the match. A separate regression preserves this recording across refactors. When intentionally changing rules, retain the old fixture with its source revision and establish a new candidate record.

## Endurance and final direction-change measurements

All load runs used loopback WebSockets on this Windows machine. Each used four rooms, four connected clients per room, and deliberately lopsided input policies to exercise endings and rematches. Four games were still active at each cutoff. The runs sampled successive implementations during development.

| Implementation exercised | Wall time | Completed matches | Unexpected disconnects / rejected actions | Server catch-up budget overruns |
| --- | ---: | ---: | ---: | ---: |
| Initial authoritative server | 60 min | 992 | 0 | 1 |
| Compact snapshot iteration | 47 min | 780 | 0 | 1 |
| MOBA kits, farming and objectives iteration | 35 min | 476 | 0 | 0 |
| Movement build with server timing instrumentation | 15 min | 224 | 0 | 0 |

In the 15-minute run, server update work across four rooms was 2.849 ms at p95 and 5.239 ms at p99. Host and synthetic clients shared a Node process. RSS rose from 65.2 MiB at the first minute to 84 MiB by the end. The separate-host two-hour memory and cleanup gate remains open.

The repeat ten-minute browser drill used the same direction-change procedure after the countersteer fix. Input-to-motion measures elapsed time from the keyboard event to the first displayed world displacement greater than one pixel in the requested direction. The drill includes fights, ordinary steering and action recovery.

| Relay profile | Measured inputs | Input-to-motion p95 | Corrections sampled | Position correction p95 | Frame time p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 40 ms round trip | 470 | 18.1 ms | 6,279 | 3.42 px | 8.5 ms |
| 150 ms round trip, jitter and ordered stalls | 496 | 31.9 ms | 6,512 | 10.25 px | 8.5 ms |

Both runs completed without browser errors or a measured turn timing out at 400 ms. This verifies input response under the tested conditions. Player preference for the amount of momentum, real home-network behavior and human matchup balance still require playtests.

## Next human session

Let each tester choose a kit and make a first lap without coaching. Record which input they intended when they miss a platform. Then put a duo in a match and watch its first farm purchase, first contested objective and first attack on a reactor. Ask the opposing crew what response it saw. Offer a real choice to stop or rematch. Use the [session record](session-template.md) and measure the [human gates](../playtesting.md). Internet staging, human balance, macOS coverage and an independent rollback rehearsal remain outstanding.
