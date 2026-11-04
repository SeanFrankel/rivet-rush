# Kiln Yard rules

One or two pilots per crew push a shared lane. Online rooms field two pilots per crew and fill vacant seats with bots. Everyone uses the same simulation on a fixed 60 Hz clock. A match awards victory to the crew that destroys the opposing reactor. If both reactors fall on the same tick, the match is a draw. [Simulation](../match.js) · [controls](../README.md)

## The match loop

| Moment | Decision | Consequence |
| --- | --- | --- |
| First wave | Escort the crawlers or reach a firing position in front of them. | A friendly body can intercept a rivet. Last hits and nearby salvage pay for earlier upgrades. |
| Pilot fight | Save your dash to evade a shot, commit to a shoulder strike, or hold high ground for a dive. | A clean dash briefly evades projectiles. A striking pilot remains vulnerable. Opponents can move out of a dive during its windup. |
| Siege | Fight near your Breaker or rotate to the upper vault. | A Breaker inflicts triple damage on structures. Winning the vault can add a second Breaker to a push. |
| Reset | Retreat to repair or stay for the next wave. | A live pilot returns sooner. A dead pilot waits 5–9 seconds and travels back from base. |
| Finish | Destroy the sentry, then use your surviving wave to reach the exposed reactor. | Structure damage persists. At five minutes both shields fall and both cores lose 6 HP/s. Passive damage stops at 1 HP. Every wave in meltdown includes a Breaker. A pilot or NPC must deliver the final hit. A Breaker that advances 55 px past midfield in overtime can charge one base shot for 2.1 s. Destroy it or knock it back to interrupt. A launched shell lands after 0.85 s for 70 damage. Two surviving bases at seven minutes draw. |

## Pilots

| Pilot | HP | Run speed | Rivet range / damage / interval | Dash speed / base recharge | Ability |
| --- | ---: | ---: | --- | --- | --- |
| Arc Runner | 150 | 205 px/s | 248 px / 10 / 0.26 s | 585 px/s / 2.1 s | Ground pulse deals 32 damage within 110 px. Aerial Pile Driver deals 44 within 116 px and launches enemies. Recharges in 4 s. |
| Kiln Warden | 190 | 179 px/s | 203 px / 14 / 0.39 s | 465 px/s / 2.6 s | Ground rally deals 18 damage. Bastion Drop deals 27 and launches. Either grants up to 32 barrier to the Warden and allied mobile units within 138 px for 2.4 s. Recharges in 6 s. |

Shift dashes in the pilot's facing direction for 0.18 s. A clean dash evades rivets during its opening frames. Holding fire commits to a shoulder attack that can hit each enemy once for 25 (Runner) or 29 (Warden) and knock mobile targets away. A dive has a 0.15 s windup before the fall and 0.21 s of landing recovery. The pilot can steer slightly during the dive. Sentries and reactors hold position against knockback.

Ground acceleration reaches full running speed in about five frames for a Runner. Steering in the air preserves forward momentum. A deliberate opposite input immediately brakes the pilot's own velocity and starts the turn on the next simulation tick. Knockback and committed attacks retain their recovery. Tap jump for a short hop or hold for a full jump. A jump during an evasive dash cancels its protection and starts a leap at 1.78 times run speed. A shoulder strike commits through the dash. At speed on the floor, hold S to slide for up to 0.38 s with a 21 px hitbox. Jump to carry the slide forward or steer against it to brake. A fresh slide requires a new press and a 0.85 s cooldown. Jump twice with W, Up or Space. A small grace period after leaving an edge (85 ms) and a jump buffer before landing (110 ms) allow close inputs to connect. Hold S/Down to descend through one-way decks or fast-fall after the apex. Movement and hits resolve in separate phases so two lethal attacks in the same tick can trade.

J aims at the nearest living opponent ahead within range. With no target it fires horizontally. Left mouse aims freely, including while retreating. Rivets travel at 600 px/s for their range plus 24 px. The first enemy hitbox along the shot intercepts it. Decks allow shots through. The Keeper can be hit by pilots firing from the upper decks.

## Farming and builds

Each crew receives three crawlers per wave, immediately on deploy and every 12 s thereafter. Every third wave adds a Breaker. All pilots on the opposing crew earn a bounty on an enemy loss, even when a crawler lands the finishing shot.

| Enemy defeated | Scrap per opposing pilot | Additional rewards |
| --- | ---: | --- |
| Crawler | 2 | Pilot last hit +2. Drops a 2-scrap salvage pickup. |
| Breaker | 5 | Pilot last hit +2. Drops a 4-scrap pickup. |
| Pilot | 8 | A credited pilot also gains a KO. |
| Sentry | 15 | Its reactor loses the shield. |
| Vault Keeper | — | Drops a siege cell for either crew. |

Salvage remains for six seconds. The winning crew gets the first second to collect it. Afterward either crew can take it by moving within 33 px. The closest eligible pilot collects. Opponents tied at the same distance contest the pickup. Last hits and pickup income appear in the scoreboard's farming columns.

Purchases are personal and work anywhere while alive. Buy up to six mods per match, with up to three in each track. Successive purchases cost **12, 20, 28, 36, 44 and 52 scrap**. Rivets add 4 shot damage. Drive adds 18 maximum and current HP and reduces dash recharge by 0.25 s. Coils add 4 ability damage, reduce its recharge by 0.2 s and add 5 barrier strength for a Warden. Mods and unspent scrap survive a death and reset on rematch.

## Map, NPCs and objectives

The arena is 1,780 px wide, with the floor at y=345. Both crews have mirrored lower decks, upper decks, crossing switches, sentries and reactors. Lower decks sit 70 px above the floor, upper decks 137 px above it and the central vault deck 196 px above it. Either switch opens the upper crossing for ten seconds. The bridge is one optional route.

| Unit | HP | Movement / target range | Attack |
| --- | ---: | --- | --- |
| Crawler | 48 | 46 px/s / 142 px | 7 damage every 0.95 s |
| Breaker | 125 | 41 px/s / 182 px | 10 damage every 1.1 s, tripled against structures |
| Sentry | 320 | Stationary / 238 px | Locks a dashed firing line for 0.42 s before a 12-damage rivet. Cycle about 0.82 s. |
| Reactor | 540 | Stationary / 120 px | 8 damage every 1.1 s. Shielded until its sentry falls or meltdown begins. |
| Vault Keeper | 245 | Central upper deck / 125 px | Shows a warning circle for 0.65 s before a 22-damage discharge. Both crews can dodge out. |

The first Keeper spawns at 0:48. After it falls, the siege cell stays on the upper deck for ten seconds. Carrying it is automatic on contact. Each pilot on the claiming crew gets 6 scrap and the next wave gains a bonus Breaker. The Keeper returns 75 s after defeat. A kill alone leaves the cell open to a steal.

At home, a wounded pilot within 106 px horizontally of their reactor repairs 24 HP/s once two seconds have elapsed without taking damage. Respawn delay starts at five seconds and adds one every 75 s, up to nine. On respawn, a pilot returns with full health and up to 1.1 s of protection. Firing or using the pulse/drop ends that protection.

## Live and solo play

Bots can farm, buy builds suited to their kit, jump sentry shots, fall back to repair and rotate a pilot to the vault while a teammate holds lane. In a private room, a disconnected pilot gets a bot substitute while another human remains connected. The seat is reserved for 60 seconds. An online match continues when a player opens the menu. A solo skirmish pauses on Escape or focus loss.

Human enjoyment, real internet conditions and balance between experienced human teams remain to be measured. The [playtest guide](playtesting.md) describes those checks.
