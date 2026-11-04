# Development and verification

Run checks from the repository root with Node 22 or later. Install the locked dependencies once with `npm ci`. The offline client runs directly from `index.html`. Node is required for hosting, automated tests and diagnostics.

| Component | Responsibility |
| --- | --- |
| [Rules](../match.js) | Shared 60 Hz movement, kit abilities, economy, NPC decisions, objectives and results. The browser and server call the same simulation. |
| [Client](../yard.js) and [entry](../index.html) | Capture held/pressed/released controls, present the local seat, expose training, traversal and replay playback. |
| [Room client](../online.js) and [wire protocol](../protocol.js) | Seat reservation, input sequence, compressed snapshots, prediction, reconciliation and interpolation. |
| [Host](../server/host.js) | Validate inputs, authorize seats, run rooms, serialize snapshots and serve the matching browser revision. See the [operator runbook](hosting.md). |
| [Replay](../replay.js) | Record changes to seat inputs, including switches between human and bot. Replay against the same rule version and compare final replicated state. |

## Checks before merge

| Command | Evidence |
| --- | --- |
| `npm test` | Match, movement, combat, farming, objectives, two-team symmetry, deterministic replay and real loopback room tests. |
| `npm run check:docs` | Resolves repository-local Markdown file links. |
| `npm run test:browser` | Opens the normal UI, runs the combat drill and movement course, plays a replay and joins/reconnects four browser sessions. |
| `npm run test:friends` | Four actual browser sessions finish a match, agree on its outcome, download a replay and ready a fresh rematch. |

For browser checks, install Chromium with `npx playwright install chromium` or set `RIVET_BROWSER` to an existing Chromium/Chrome/Edge executable. The Windows config uses installed Edge automatically. For the Playwright Firefox build, run `npx playwright install firefox`, set `RIVET_ENGINE=firefox` and run `npm run test:browser`. CI installs both engines. Browser tests start a loopback host on port 8189. The friends drill uses an available port.

## Balance, movement and network changes

- Run `node tools/compare-pushes.cjs` for the original simple policies and `node tools/match-lab.cjs` for mirrored objective, escort, poke and dive policies. Record the build and outcomes. A scripted win establishes feasibility. Ask humans whether the decisions felt satisfying.
- Compare short and full jumps, a dash jump, air reversal, struck versus evasive dash, crouched hitbox, platform drop, coyote jump and buffered landing. Run the six checkpoints in **Movement run** using the normal map. Verify both kits can reach the neutral deck.
- Run `npm run test:network -- 10` for ten minutes each of baseline 40 ms RTT and a 150 ms RTT profile with directional jitter and ordered stalls. The relay delays WebSocket messages in both directions. This does not emulate OS-level packet loss. Report p95 input-to-displayed-motion, correction distance, frame time and sample counts. Use separate home networks for the WAN gate.
- Run `npm run test:soak -- 60 4` for 60 real minutes across four rooms and 16 synthetic clients. It reports completed matches, delivered packets, bandwidth, process memory and errors every minute. Clients and server share a process in this tool; profile a separate host before sizing production.
- Reproduce a saved result with `node tools/replay.cjs match.json`. Changes to input layout or replicated fields must bump the protocol version. Changes to shared simulation behavior must bump the replay rules ID and network protocol before publication so older tabs cannot predict a different movement rule. Include the player controls and map docs in the same change.

## Manual acceptance

From a fresh profile, complete a solo match with each kit. Collect a last hit and salvage, make a purchase and contest a siege cell. Confirm a protected core ignores shots and an exposed core takes damage. A Warden should be able to shield a teammate in a push. Bring two devices into the same private room, join the same crew and then opposing crews, swap host ownership, refresh in combat and replay the result. Record commit, device, OS/browser, seats, expected/observed behavior and issue reproduction rate. [Beta acceptance matrix](roadmap.md)
