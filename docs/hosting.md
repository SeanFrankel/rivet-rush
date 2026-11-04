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

- Verify `GET /health` returns build, protocol, room counts, completed matches and drain status. Static responses and the room protocol come from one server revision.
- Run `npm test`, `npm run test:browser` and `npm run test:friends` from the same revision as the candidate. Exercise a Warden and Runner, a real join and a refresh through the public staging URL.
- At the result screen download the replay. Run `node tools/replay.cjs <file.json>` with the same build and check `verified`. A replay records gameplay inputs and seats. It contains no invite or seat secrets. Keep tester identities out of public issues.
- The server emits anonymous start/end records with the match ID and result to stdout. Compare those IDs when players disagree. Store an artifact hash and candidate commit in the release record. Set the hosting platform's log retention before inviting friends.

## Drain, restart and roll back

On SIGTERM or SIGINT the host declines new rooms and match starts and waits up to 30 seconds for active games. Longer matches are interrupted. Use a scheduled break between games for routine releases. For a bad rollout, restore the previous **client and server together**, confirm health and test a fresh two-device join, match end and rematch. A restart loses in-memory rooms. Testers need a new invite. No database migration or persistent progression is involved.

The [beta acceptance matrix](roadmap.md) adds human canaries, real WAN sessions, operator rehearsal and hosting budgets to these local checks.
