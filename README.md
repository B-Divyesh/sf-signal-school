# Signal School

Signal School is a cooperative signal-routing browser game for two to four players. A run takes three finite rounds: each player sees one part of the network, talks through a route, and tries to deliver all six signals before the storm. Use the on-screen route buttons or keys `1`, `2`, and `3`.

Live product: https://signal-school.sociobot.in

Start with the immediate sample at https://signal-school.sociobot.in/demo. It is a populated Tide Lines practice run with labelled practice teammates; its progress is isolated from a real local practice run.

## Who it is for

It is for curious adults, teams, and older children who prefer discussing a shared systems problem to reading a lesson. It frames queues, bottlenecks, redundancy, and feedback as game goals. It does not grade people, issue certificates, or claim validated learning.

## Play

- Open `/demo` and choose routes with the on-screen buttons or keys `1`, `2`, and `3`.
- A successful run delivers six signals across three rounds, then shows a one-sentence debrief.
- Pause stops the storm clock. The local motion setting persists.
- Use **Run this topology again** to reset a finished run, or **Try another topology** for one of the other free maps.

The free practice game includes eight finished topologies, starting with Tide Lines, Fog Junction, and Headland Loop. The built-in Scenario Set holds twelve additional playable topology cards and rotating role views. Together, the game includes twenty distinct three-round cards. The one-time offer is not registered yet, so checkout and activation are unavailable; see [Terms](https://signal-school.sociobot.in/terms).

## Online rooms

The product-owned `sf-signal-school-realtime` Node/WebSocket service gives rooms short codes and stores room state in SQLite under `/data` in production. It supports two to four independent clients, partial role views, a browser-refresh reconnect, shared consensus choices, win/loss, and host restart. Each restart rotates the room to a different topology and reassigns roles. It is not a demo transport.

The static frontend connects only after someone creates or joins a room. The service exposes `GET /health`. Room lookups and new room connections return HTTP `429` with `Retry-After` after their request allowance. An open room that sends too many messages receives a readable wait message instead.

## Privacy

There are no learner profiles, default analytics, advertising trackers, third-party scripts, or remote fonts. Practice progress is browser-local. Demo progress uses `demo:signal-school:*` keys and never writes the real practice key. An online room stores its code, selected display names, browser-generated reconnect identifiers, host and connection status, role assignments, shared choices and game state, plus created and last-updated times. A host can use **Delete room data** to remove the room for every player. Rooms with no update for 24 hours are deleted automatically. See [Privacy](https://signal-school.sociobot.in/privacy).

## Develop

Prerequisite: Node 22+. Playwright Chromium 1.58.2 is used for browser checks.

```bash
npm ci
npm test
npm run test:browser
npm run realtime:build
npm run build
```

`npm run test:all` runs every command above. `npm run dev` serves the static game at `http://127.0.0.1:4173`. `npm run realtime:dev` starts the room service at `http://127.0.0.1:8080`; set `PORT` or `DATA_DIR` to change those local defaults. For local browser testing against that service, build with `VITE_REALTIME_URL=ws://127.0.0.1:8080/ws`.

The claim inventory is in [.factory/claims.json](.factory/claims.json). Each listed command is runnable from a clean checkout after `npm ci`. The 390px Chromium phone check measures 60 fps with a five-fps margin while CPU throttling is set to four times.

## Deploy

Build the frontend into `dist/`, deploy the durable one-replica room service first, then deploy `dist/` as the static app. The production browser endpoint is `wss://signal-school-realtime.sociobot.in/ws`.

```bash
npm run test:all
npm run build
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh signal-school-realtime /work/repo Dockerfile 8080
/opt/fleet/lib/deploy-static.sh signal-school /work/repo/dist
```

The container deployment preserves its `/data` mount and one-replica bound. Do not replace it with ephemeral or multi-replica storage.

## Design and license

[.factory/design.md](.factory/design.md) records the palette, typography, board interaction, motion policy, and original asset provenance. Source code is MIT licensed; see [LICENSE](LICENSE).
