# Rivet Rush

A side-scrolling MOBA for up to four pilots. Farm crawlers for scrap, build your pilot, and fight alongside your teammate to destroy the enemy sentry and reactor. Choose among [three arenas](docs/maps.md): Kiln Yard’s siege vault, Skyway Relay’s launch pads and capture point, or Foundry Split’s twin supply camps. Each retains a ground lane for siege waves.

## Play on your computer

Download or clone this repository, open `index.html` in a desktop browser, pick one of [six heroes](docs/characters.md), choose an **Arena**, then select **Play skirmish**. You control one pilot. Bots fill the other seats. **Crew size** switches between 1v1 and 2v2. **Training deck** teaches a double jump, dash strike and all four abilities. **Movement run** times you across six checkpoints on the selected map and keeps a personal best per arena and pilot on this device. R restarts a run.

## Play with friends

The host needs Node.js 22 or newer. From the project folder run:

```sh
npm ci
npm start
```

Open [the local game](http://127.0.0.1:8080), choose **Private room**, select a pilot and ready up. The host selects **Deploy crew** once everyone is ready. Seats on the same crew play together. Empty seats get bots. Use a host address reachable by your friends before copying the invite. On a shared LAN, follow the [hosting guide](docs/hosting.md). Friends joining an existing host need only the invite and a desktop browser.

## Your first push

| Move | Input |
| --- | --- |
| Run, jump twice, drop through a platform or fast-fall | A/D steers. Tap W for a short hop or hold it for height. S drops through decks or slides on the ground at speed. Arrows and Space also work. |
| Dash through a projectile or commit to a shoulder strike | Shift dashes. Jump during a clean dash to carry speed. Hold fire and dash to strike. |
| Basic attack | Hold J for a forward melee swing or assisted ranged fire. Left mouse aims attacks toward the pointer. |
| Four hero abilities | Q / E / R / F. K or right-click also uses Q. Point into the arena to aim skills, or keep the pointer outside for assisted aim. Hover the ability bar for descriptions. |
| Buy a mod | 1 for rivets, 2 for the drive, 3 for coils. The rig shows the next scrap price. |
| Signal your crew | G rallies, H calls a retreat. Point inside the arena to mark a location, or move the cursor outside it to mark your pilot. Signals last five seconds, with a three-second cooldown. Bots keep their own plans. |
| Operate a crossing, check the score, open the menu | C by either upper switch, hold Tab, Escape. |

Walk with your first crawler wave. Land the finishing shot on enemy crawlers for bonus scrap, then collect the dropped salvage before an opponent takes it. Use a friendly Breaker to push the sentry. Fall back near your reactor to repair. After the enemy sentry falls, finish its reactor. At five minutes both reactors enter meltdown. Escort a Breaker past midfield to earn a charged base shot. A pilot or NPC still has to deliver the final hit. If both bases hold for seven minutes, the match is a draw.

At the result screen, **Save match replay** exports an anonymous input recording. Open **Watch replay** on the title screen to view it on the matching build, switch pilots or speed up playback.

Your rig shows each mod track's purchased tiers and what the next mod costs. Last hits and collected salvage display extra scrap above your pilot. **Tips on/off** controls optional advice about farming, repairing and objectives. The setting stays on this browser. While downed, the camera follows a surviving teammate and a recap shows recent HP loss by source. Hold Tab to compare farming, siege damage and shielding as well as KOs.

For a bug or playtest observation, open **Field menu → Save playtest report**, or save it at the result screen. The JSON contains match/build information and scores, with blank observation fields you can fill in. It excludes room invitations and seat secrets and sends nothing automatically. Pair it with a replay when possible. Tactical signals are live communication and are not included in replays.

The [game handbook](docs/README.md) contains the rules, test procedures and beta roadmap. Contributors should start with [AGENTS.md](AGENTS.md). Third-party licenses and asset provenance are recorded in [THIRD_PARTY.md](THIRD_PARTY.md).

Three melee heroes (Warden, Rook, Echo) specialize in protection, displacement and flanking. Three ranged heroes (Runner, Vesper, Fuse) specialize in aerial pursuit, precision and traps. All retain double jump and the shared Shift dash. The [character guide](docs/characters.md) describes each kit, combo and counterplay. Current art remains placeholder; the proposed art direction awaits owner review.

The private-room host chooses the arena before ready-up; changing it clears everyone’s ready state. Secondary objectives support the push: a bonus Breaker in Kiln Yard, a temporary running boost in Skyway Relay, or crew scrap and repairs in Foundry Split. [Routes, rewards and counterplay](docs/maps.md).
