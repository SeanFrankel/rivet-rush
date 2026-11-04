# Shared match rules

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

Six pilots each have four active abilities on **Q/E/R/F**, plus a basic attack, double jump and shared Shift dash. [Character guide](characters.md) is authoritative for kit numbers, combos and counterplay. Warden, Rook and Echo use directional melee cleaves; Runner, Vesper and Fuse fire projectiles. Melee hits every enemy in its forward arc within range, never launches a basic projectile, and cannot hit the Keeper from below the upper decks.

Abilities have independent cooldowns. E/R/F cooldowns continue through death; Q resets on respawn as before. Coils distributes its +4 damage budget across a cast's damaging parts, pellets and timed pulses, rather than adding +4 to every pellet. Shields refresh to the stronger value without shortening an existing longer barrier. Damage zones show their actual radius, traps show their arming interval and anchors remain visible to both crews. NPCs can consume traps and intercept ability shots; structures resist displacement. Echo's anchor restores position only, never health or cooldowns.

Shift dashes in the pilot's facing direction for 0.18 s. A clean dash evades rivets during its opening frames. Holding fire commits to a shoulder attack that can hit each enemy once for 25 (Runner) or 29 (Warden) and knock mobile targets away. A dive has a 0.15 s windup before the fall and 0.21 s of landing recovery. The pilot can steer slightly during the dive. Sentries and reactors hold position against knockback.

Ground acceleration reaches full running speed in about five frames for a Runner. Steering in the air preserves forward momentum. A deliberate opposite input immediately brakes the pilot's own velocity and starts the turn on the next simulation tick. Knockback and committed attacks retain their recovery. Tap jump for a short hop or hold for a full jump. A jump during an evasive dash cancels its protection and starts a leap at 1.78 times run speed. A shoulder strike commits through the dash. At speed on the floor, hold S to slide for up to 0.38 s with a 21 px hitbox. Jump to carry the slide forward or steer against it to brake. A fresh slide requires a new press and a 0.85 s cooldown. Jump twice with W, Up or Space. A small grace period after leaving an edge (85 ms) and a jump buffer before landing (110 ms) allow close inputs to connect. Hold S/Down to descend through one-way decks or fast-fall after the apex. Movement and hits resolve in separate phases so two lethal attacks in the same tick can trade.

For ranged pilots, J aims at the nearest living opponent ahead within range. With no target it fires horizontally. Left mouse aims freely, including while retreating. Rivets travel at 600 px/s for their range plus 24 px. The first enemy hitbox along the shot intercepts it. Decks allow shots through. The Keeper can be hit by pilots firing from the upper decks.

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

Purchases are personal and work anywhere while alive. Buy up to six mods per match, with up to three in each track. Successive purchases cost **12, 20, 28, 36, 44 and 52 scrap**. Rivets add 4 basic-attack damage (including melee). Drive adds 18 maximum and current HP and reduces dash recharge by 0.25 s. Coils add 4 ability damage, reduce each ability recharge by 0.2 s and add 5 strength to direct ability barriers. Mods and unspent scrap survive a death and reset on rematch.

## Map, NPCs and objectives

Three arenas are available in solo and private play. The [arena guide](maps.md) owns their geometry, secondary objectives, timing, launch pads and rewards. The Kiln Yard details below apply to that arena; Skyway Relay replaces its Keeper with a contested capture point, and Foundry Split replaces it with two supply camps. Base, wave and farming rules remain shared.

Each arena is 1,780 px wide, with the floor at y=345. Both crews have mirrored platforms, sentries and reactors. Kiln Yard also has crossing switches. Lower decks sit 70 px above the floor, upper decks 137 px above it and the central vault deck 196 px above it. C at either switch opens the upper crossing for ten seconds. The bridge is one optional route.

| Unit | HP | Movement / target range | Attack |
| --- | ---: | --- | --- |
| Crawler | 48 | 46 px/s / 142 px | 7 damage every 0.95 s |
| Breaker | 125 | 41 px/s / 182 px | 10 damage every 1.1 s, tripled against structures |
| Sentry | 320 | Stationary / 238 px | Locks a dashed firing line for 0.42 s before a 12-damage rivet. Cycle about 0.82 s. |
| Reactor | 540 | Stationary / 120 px | 8 damage every 1.1 s. Shielded until its sentry falls or meltdown begins. |
| Vault Keeper | 245 | Central upper deck / 125 px | Shows a warning circle for 0.65 s before a 22-damage discharge. Both crews can dodge out. |

On Kiln Yard, the first Keeper spawns at 0:48. After it falls, the siege cell stays on the upper deck for ten seconds. Carrying it is automatic on contact. Each pilot on the claiming crew gets 6 scrap and the next wave gains a bonus Breaker. The Keeper returns 75 s after defeat. A kill alone leaves the cell open to a steal.

At home, a wounded pilot within 106 px horizontally of their reactor repairs 24 HP/s once two seconds have elapsed without taking damage. Respawn delay starts at five seconds and adds one every 75 s, up to nine. On respawn, a pilot returns with full health and up to 1.1 s of protection. Attacking or using any ability ends that protection.

## Live and solo play

G sends a rally signal and H sends a retreat signal at the pointer's arena position. With the pointer outside the arena, the signal marks the pilot. A crew sees a circle/+ for rally or a triangle/! for retreat, plus an edge arrow for an off-screen location. Signals last five seconds. Each seat may send one every three seconds, including across a reconnect. The server supplies the sender's seat, bounds the position, rejects stale-match requests and delivers only to that crew. Signals are advisory: they do not change NPC behavior, reveal otherwise hidden information, affect combat or enter an input replay. Solo signals let a player practice the controls.

On death, the recap groups HP actually lost during the preceding six seconds by credited attacker type or pilot kit. Barrier absorption and overkill are excluded; this is recent damage, not the pilot's lifetime damage or a count of attacks. It clears at respawn. A surviving ally becomes the camera subject during the respawn wait, while the local pilot's health and timer remain visible. The scoreboard's **shield given** counts newly granted barrier, which can expire unused; it is not damage absorbed.

Optional field tips react to low health, farming progress and objective state. They explain existing rules and never alter the match. The rig shows purchased tiers, remaining scrap and disabled unaffordable/full tracks; keyboard purchases retain the same server checks.

Bots can farm, buy builds suited to their kit, jump sentry shots, fall back to repair and rotate a pilot to the vault while a teammate holds lane. In a private room, a disconnected pilot gets a bot substitute while another human remains connected. The seat is reserved for 60 seconds. An online match continues when a player opens the menu. A solo skirmish pauses on Escape or focus loss.

Human enjoyment, real internet conditions and balance between experienced human teams remain to be measured. The [playtest guide](playtesting.md) describes those checks.
