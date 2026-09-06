# Signal School handoff

## Repair 4 — complete

Implementation commit: `cad187f558c5faabb8802824806b7674241925dd`  
Static deployment: `38021290-fcf5-4bba-8145-f5f979cf50ce`  
Realtime implementation reported live: `cad187f558c5faabb8802824806b7674241925dd`

Signal School is the cooperative signal-routing browser game for curious adults, teams, and older children. A group shares a short code, compares different parts of the network, and agrees on three routes before the storm. The first action is **Try it with sample data**, which opens the isolated Tide Lines practice board.

## What changed

- Real rooms now rotate through Tide Lines, Fog Junction, and Headland Loop after host restart. Each has different route plans, winning sequences, role assignments, and role-specific clues. The shared outcome is scored from that topology’s route plan.
- Replaced the cloned scenario bodies with twenty independently scripted three-round cards. Every card has its own goals, partial information, teammate report, plan labels, outcomes, and correct route sequence.
- Added host-controlled **Delete room data**. It deletes the room and player rows from product SQLite and returns every connected client to the room form. A scheduled service sweep and startup cleanup remove rooms with no update for 24 hours.
- Privacy copy now names every stored room field: room code, selected name, browser-generated reconnect identifier, host and connection status, role, shared choices and game state, and timestamps.
- Corrected rate-limit copy and coverage. HTTP room lookups and new WebSocket upgrades use `429` plus `Retry-After`; an already-open WebSocket receives a readable JSON wait message.
- Removed the unregistered future license-verification promise and its unused browser implementation. The paid Scenario Set remains present and explicitly unavailable until its separate offer registration.
- Replaced the 404 metaphor with the direct sentence: “This page does not exist.”

## Verification

From the documented clean Node 22+ setup, `npm ci` completed with zero reported vulnerabilities. All 25 commands declared in `.factory/claims.json` were run separately and passed.

Aggregate local gates passed:

- `npm test`: 8 Vitest checks passed.
- `npm run realtime:test`: 3 SQLite/WebSocket integration checks passed.
- `npm run test:browser`: 36 browser checks passed with 2 expected device-specific skips.
- `npm run realtime:build` and `npm run build` passed.
- Production output: 13.37 KB gzip JavaScript, 4.18 KB gzip CSS, 44.89 KB self-hosted fonts, and 176,436 B total deployed artifacts.

The new outcome checks prove all twenty cards have distinct playable content and each correct three-route path wins. They also prove four-player limits, reconnect, room restart persistence, three different shared topologies and role rotations, shared win/loss endings, deletion, 24-hour expiry, HTTP `429`/`Retry-After`, WebSocket upgrade limits, and open-socket wait messages.

## Live HTTPS checks

- `/opt/fleet/lib/verify-url.sh https://signal-school.sociobot.in/demo` passed: HTTP 200, title **Demo — Signal School**, `lang="en"`, one h1, main landmark, labelled controls, image alternatives, and no console errors.
- Fresh desktop and 390×844 phone `/demo` contexts both showed the job, audience, **Try it with sample data**, populated board, named practice teammates, and persistent **Demo — sample data, nothing is saved** label before scrolling. Both completed the win path, showed the one-sentence debrief, restarted to Round 1, and Reset demo returned to Round 1. The phone browser had reduced motion enabled, no serious/critical axe issue, no undersized tested control, and made only same-origin requests.
- Four fresh live browser clients received the Tide Lines Relay runner, Weather reader, Harbor clerk, and Signal keeper views. The Weather reader refreshed safely into the same role. After restart they became Weather reader, Harbor clerk, Signal keeper, and Relay runner on Fog Junction; after another restart they became Harbor clerk, Signal keeper, Relay runner, and Weather reader on Headland Loop. The group reached Tide Lines and Fog Junction wins, then a Headland Loop loss, and successfully deleted the test room. No page recorded a console error.
- Two separate live rooms had different short codes and the second did not expose the first room’s name.
- Live room health is `{"ok":true,"build":"cad187f…","storage":"/data"}`. A reserved test IP reached HTTP 429 with `Retry-After: 59` after the allowance.
- `/not-a-route` returned the designed HTTP 404 with the direct page-not-found copy. The deployed main JavaScript SHA-256 exactly matches the local `dist` asset.

Evidence, including desktop/phone and room screenshots, is in `/work/.evidence/signal-school-repair-4/`. The catalog description copy is in `/work/.evidence/catalog-description.txt`.

## Deploy

```bash
npm ci
npm run test:all
npm run realtime:test
npm run build
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh signal-school-realtime /work/repo Dockerfile 8080
/opt/fleet/lib/deploy-static.sh signal-school /work/repo/dist
```

The realtime deployment remains the product’s one-replica service with the durable `/data` mount. Do not change it to ephemeral or multi-replica storage.

## Remaining external dependency

The one-time Scenario Set billing offer is not registered. Its exact offer slug, price, currency, checkout, activation, and license path are therefore unavailable and are not guessed. The built-in twelve paid cards remain visible; the free practice game and real rooms work without billing. Honest operator metadata is at `/work/.evidence/billing-offer.json`.

## Verification 5 — PASS

Independent QA reviewed implementation `cad187f558c5faabb8802824806b7674241925dd` and documentation/test revision `3020b079724836fa9411a108e135e32ccfeedbda`. It found **0 findings** and **0 untested claims**.

From a clean Node 22.23.2 install, `npm ci` completed with zero vulnerabilities and every one of the 25 exact commands in `.factory/claims.json` passed. `npm test` passed 8 checks, `npm run realtime:test` passed 3 checks, and `npm run realtime:build` plus `npm run build` passed. The clean main bundle's SHA-256 matched the deployed main bundle exactly.

Fresh live desktop and 390×844 phone contexts showed the job, intended small-group audience, game board, and **Try it with sample data** action before scrolling. The sample label remained present; deterministic win, loss, restart, reset, keyboard, reduced motion, focus, same-origin traffic, automated axe, and URL verification passed. The live throttled-phone measurement was 60.24 fps.

Four independent live room clients received different roles, a fifth was rejected, a client reconnected safely, restart changed topology and roles, two route plans won, a third lost, and room deletion returned every client to the form and removed the server record. Two separately created rooms did not expose one another's data. Live health reported implementation `cad187f…` and durable `/data`; lookup allowance correctly ended in 429 with `Retry-After`.

The detailed committed report is [.factory/verification-5.md](verification-5.md). Runtime captures and headers are in `/work/.evidence/signal-school-verify-5/`; the factory-required copy is `/work/.evidence/qa-report.md` and its machine-readable verdict is `/work/.evidence/qa-result.json`.
