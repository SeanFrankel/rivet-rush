# Hosting a private match

One Node process serves the browser files and owns the four-seat rooms, match clock, hits, purchases and results. Clients send controls. A host handles up to four simultaneous rooms by default. Room state lives in memory for the session.

## Same computer

1. Install Node 22 or later. From the checkout run `npm ci`, then `npm start`.
2. Open `http://127.0.0.1:8080` and select **Private room**. Open the copied invite in another browser profile to test another seat.
3. Choose pilots and seats, ready everyone, then choose **Deploy crew**. One human can launch with three bots. The host can reopen the lobby after a match.

## Friends on the same network

On Windows PowerShell run the following from the project folder:

```powershell
$env:BIND_ADDRESS = '0.0.0.0'
$env:PORT = '8080'
npm start
```

On macOS or Linux run `BIND_ADDRESS=0.0.0.0 PORT=8080 npm start`. Open the game using the host computer's LAN address, for example `http://192.168.1.25:8080`, **before** creating and copying the invite. Each friend opens that invite on the same reachable network. A link starting with localhost or 127.0.0.1 points each friend back to their own computer. If clipboard access is unavailable, the lobby selects the invite text so the host can copy it manually.

## Internet staging

Use a persistent Node host or container behind a TLS reverse proxy. Route the site and the `/arena` WebSocket upgrade to the **same** instance, preserve the original Host header, and allow idle connections longer than the 15-second heartbeat. A static file host can serve solo play. Private rooms need the running game process. Keep one region and instance for this beta. Load balancing independent instances would split rooms.

The included [Dockerfile](../Dockerfile) packages the same server and assets. A staging operator with Docker can build and run an immutable candidate:

```sh
docker build -t rivet-rush:rc .
docker run --rm -p 127.0.0.1:8080:8080 rivet-rush:rc
```

Point the reverse proxy at this port. Use the provider's assigned port through `PORT` if required. For a bare Node deployment, use `npm ci --omit=dev`, bind to the host's required interface and run `node server/host.js`. Verify HTTPS, WSS upgrades and a match from two separate home networks before inviting a group. This project has no provisioned public server.

## Reconnect and room ownership

The invite fragment identifies a room. Each participant separately receives a seat secret stored in their tab's session storage. Copying the invite shares only the room address. Refreshing the same tab or reconnecting within 60 seconds can reclaim the pilot. Bots cover disconnected seats while another human is connected. If everybody disconnects, the room waits for reconnects and is removed once its reservations expire. Leaving via **Return to title** releases the seat immediately. Losing the host transfers room control to a connected participant.

## Check a candidate

Build a portable runtime with `npm run release:build`. It prints a directory under `.releases` and a full artifact hash. The allowlist includes the exact client/server, locked dependencies manifest, notices and verifier; local logs, room data, Git metadata and installed development packages are excluded. `sourceCommit` and `sourceDirty` record provenance separately from the exact content hash. A dirty build is labeled as such.

From the printed directory run `node tools/release.cjs verify .`, then `npm ci --omit=dev --ignore-scripts`, then `npm start`. Configure `PORT` and `BIND_ADDRESS` as above. A packaged server verifies its release files on startup and refuses modified or incomplete artifacts. `/health` reports the artifact hash, a runtime content fingerprint, rules, protocol, uptime and process RSS. Keep the whole last-good directory with its production dependencies available for rollback. The manifest detects accidental changes; it is not a cryptographic publisher signature.

From the matching source checkout run `node tools/staging-smoke.cjs https://YOUR-HOST` against a server you operate with a free room. It creates four synthetic players in one private room, exercises a ten-second disconnect/reclaim, completes a full match, verifies the authoritative replay and starts a fresh rematch before leaving. It reports build identity and outcomes without room invites or seat secrets. It can take up to seven minutes. This is an operator check; it does not establish human fun, separate-home-network compatibility or browser usability.

CI builds the package, installs production dependencies, boots that package in a separate process and runs `node tools/artifact-smoke.cjs <release directory>`. A successful workflow uploads the tested runtime as `rivet-rush-<commit>` for 14 days. Download and verify it before deployment; keep the chosen last-good artifact beyond CI's retention window. Deploy the tested pair instead of rebuilding client and server independently.

- Verify `GET /health` returns build, protocol, room counts, completed matches and drain status. Static responses and the room protocol come from one server revision.
- Run `npm test`, `npm run test:browser` and `npm run test:friends` from the same revision as the candidate. Exercise a Warden and Runner, a real join and a refresh through the public staging URL.
- At the result screen download the replay. Run `node tools/replay.cjs <file.json>` with the same build and check `verified`. A replay records gameplay inputs and seats. It contains no invite or seat secrets. Keep tester identities out of public issues.
- The server emits anonymous start/end records with the match ID and result to stdout. Compare those IDs when players disagree. Store an artifact hash and candidate commit in the release record. Set the hosting platform's log retention before inviting friends.
- Players can save a playtest JSON from Field menu or results. It contains match ID, browser/viewport, scores, rules/protocol and reachable host identity, plus blank observation fields. It contains no invitation, seat secret or automatic upload. Ask testers to fill in the observation fields and share it alongside a replay through your agreed private channel.

## Drain, restart and roll back

On SIGTERM or SIGINT the host declines new rooms and match starts and waits up to 30 seconds for active games. Longer matches are interrupted. Use a scheduled break between games for routine releases. For a bad rollout, restore the previous **client and server together**, confirm health and test a fresh two-device join, match end and rematch. A restart loses in-memory rooms. Testers need a new invite. No database migration or persistent progression is involved.

The [beta acceptance matrix](roadmap.md) adds human canaries, real WAN sessions, operator rehearsal and hosting budgets to these local checks.

The six-hero build uses protocol 8 and replay rules kiln-03.0. Serve heroes.js and abilities.js with the matching match.js, protocol.js and client; refresh older tabs together. Older recordings require their original build.

The three-arena build uses protocol 9 and replay rules arenas-04.0. Include maps.js in the client/server bundle. The host chooses a map in the lobby; changing it clears ready states. Refresh old tabs together; earlier replays need their original build.
