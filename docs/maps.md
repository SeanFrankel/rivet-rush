# Arenas: routes worth choosing

Three selectable arenas share the same 1,780 px width, floor at y=345, mirrored bases, farming economy and victory condition: destroy the enemy sentry, then its reactor. Geometry and secondary objectives change the decisions around that lane. Current art is reused placeholder art; these are playable layouts, not finished visual environments or human-proven balance.

Choose **Arena** on the title screen before a skirmish, training deck or movement run. In a private lobby only the host changes the arena. A map change clears every seat's ready state, so nobody deploys into a different map unknowingly. The selection persists through deploy, reconnect and rematch; map identity is stored in snapshots, reports and replays. Movement records are separate for each arena and hero.

## At a glance

| Arena | Traversal identity | Secondary objective | Advantage to exploit | Cost or answer |
| --- | --- | --- | --- | --- |
| Kiln Yard | Five ascending decks, a central roof and a switch-operated crossing | Defeat the Siege Vault Keeper, then collect its cell for a bonus Breaker | Straightforward escort with an optional high flank and siege payoff | Climbing sacrifices lane presence; rivals can steal the dropped cell |
| Skyway Relay | Seven overlapping decks, split high perches and two floor launch pads | Hold the central relay for four uncontested seconds for a 20-second team running boost | Fast changes of height and long upper firing angles | The capture deck is lower than both flanking perches; attackers can contest or push while you wait |
| Foundry Split | Seven shorter staggered decks and a low central crossing | Two independently respawning supply camps grant crew scrap and repair | Short approaches suit melee entries, traps and repeated skirmishes | Both camps are neutral; splitting for both exposes the lane and can leave a teammate isolated |

All decks are one-way: jump upward through them, land from above, or hold S to drop. Decks do not block projectiles. High ground changes angles and access, not line-of-sight protection. There are no pits, unannounced hazards or instant-death traps. Shared double jump and dash suffice to traverse each map; no hero-specific ability is mandatory.

## Kiln Yard · turn a rotation into siege

Lower decks sit at y=275, approach decks at y=208 and the central vault at y=149. C near either upper switch opens the crossing for ten seconds. Both crews have identical approach distances and switch access.

The 245-HP Keeper arrives at 0:48. Its discharge warns for 0.65 seconds before dealing 22 damage within 125 px. Defeat leaves a cell for ten seconds; either crew can collect it. The claiming crew receives 6 scrap per pilot and a bonus Breaker in its next wave. The Keeper returns 75 seconds after defeat. A kill without collection earns no reinforcement.

An escort can stay under the vault and threaten the opposing sentry while a rival climbs. A coordinated crew can send one pilot up and leave one protecting its Breaker. The upper approach is useful for a diving entry, but the exposed prize allows a late steal. Compare whether the reward offsets the time away from farming.

## Skyway Relay · hold the lower deck, threaten from above

Low decks at y=285 feed broad y=225 approaches and split y=155 perches. The relay sits between those perches at y=205. The gaps around it give a pursuer a choice: stay high for an angle, drop onto the holder, or keep the ground push moving.

Launch pads at x=400 and x=1380 trigger only when a pilot jumps while grounded on the floor within 28 px. The jump starts at 620 px/s upward, consumes the ordinary first jump and leaves the second jump available. No automatic launch occurs just from walking across. A pad launch is a full launch; releasing jump does not shorten it. Both crews can use either pad, and there is no invulnerability.

The relay opens at 0:30. A living pilot must be grounded on its deck, within 60 px of center, for four seconds. Two allies capture no faster than one. If both crews stand there, progress freezes. With nobody there, progress decays at one second per second. An opposing crew taking sole occupancy starts its own progress from zero. Passing overhead does not capture or contest it.

A capture grants that crew **+20% running speed for 20 seconds**. It does not increase damage, basic attack speed, dash speed, health or jump height. The relay reopens 50 seconds after capture. The opponent can refuse the deck fight, attack from a higher perch, or exploit the four-second commitment by pushing a wave. The buff helps convert a won contest into a rotation; it does not damage the base for you.

## Foundry Split · choose your raid

Low approach decks sit at y=285; the camps sit on y=255 shelves, with y=185 perches nearby. A broad central y=275 deck creates a short hop across midfield. Its low ceiling relative to the side perches encourages close approaches and landing prediction without forcing every fight onto one roof.

Both camps activate at 0:32, at x=620 and x=1160. Neither belongs to a crew. Each 150-HP guard warns for 0.65 seconds before a 14-damage discharge within 95 px. A defeated guard leaves a supply cache for ten seconds. Either crew may collect it, including the crew that did no damage to the guard.

Collection grants **8 scrap to every pilot on the claiming crew** and **40 HP repair to each living pilot**, capped at maximum HP. It does not resurrect a pilot, repair a sentry/reactor, or add a Breaker. That camp respawns 55 seconds after its guard dies, independently of the other camp. A dead pilot receives the scrap but no healing.

An injured duo can secure its nearer camp together, while an invader threatens the farther cache. Winning both requires time or a split. A defender can escort a Breaker instead of chasing a raid. Watch whether the repair supports another interesting fight or creates repetitive sustain stalls; tune the reward and timing if the latter appears.

## Map rules for future changes

[maps.js](../maps.js) is the canonical catalog for geometry, traversal checkpoints, launch pads and objective definitions. [match.js](../match.js) executes movement, capture, guard combat and rewards. [Game rules](gameplay.md) own shared farming and base rules. Update this page, player guidance, in-game labels and affected tests together using the [update matrix](updating.md). A changed map is a changed simulation: bump protocol/replay rules before publication.

Keep mirrored access unless an asymmetry has a measured compensation. Check every hero, both starting sides, objective access and return to lane without a special ability. Keep the ground NPC lane continuous. A new reward needs a visible availability cue, an explicit contest/steal rule and a way for the opponent to exploit the commitment. Map variety should change farming, rotations, fights or siege—not just their background image.

## Next human session

Play two matches per arena with crews swapped; vary one melee/ranged pairing before expanding. Record who leaves lane, lost farm during the rotation, whether a defender successfully answers it, reward collection versus steals, and base damage after the objective. Ask each player which route they would use next and why. Offer a genuine choice of arena for a rematch. A favorite and a disliked route are useful evidence; equal win rates from bots are not evidence that the maps feel excellent.
