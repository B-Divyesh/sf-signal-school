# Signal School verification 5 — route signals together

## Verdict: PASS

Independent QA found **0 findings** and **0 untested claims**. Signal School passes this verification.

- Live product: <https://signal-school.sociobot.in>
- Candidate implementation reviewed: `cad187f558c5faabb8802824806b7674241925dd`
- Documentation/test revision reviewed: `3020b079724836fa9411a108e135e32ccfeedbda`
- Live realtime health: build `cad187f558c5faabb8802824806b7674241925dd`, durable storage `/data`

The live main JavaScript asset SHA-256 is `21aaf89a3a4829f57ea477b231d8c0cd02139f825d6b967db47c21bab2c9ee59`, exactly matching the clean candidate build's `dist/assets/main-CABzOP_B.js`. Later revisions before this report are documentation and tests, not a different product image.

## First screen and sample

Fresh desktop and 390×844 phone contexts opened the live landing page without scrolling. Both showed the game itself and stated:

- Job: **Route signals together before the storm**.
- Audience: **For small groups who want to discuss queues, bottlenecks, redundancy, and feedback while they play.**
- First action: **Try it with sample data** — **Opens a three-round practice run.**

The phone showed 198 CSS pixels of the populated relay board in its initial viewport. Its reduced-motion state was active, no tested target was smaller than 44×44 CSS pixels, and the first Tab stop was the visible **Skip to the game** link with a 4px outline.

The fresh live `/demo` showed the persistent **Demo — sample data, nothing is saved** banner, Tide Lines relay board, three route controls, and labelled practice teammates. It made only same-origin product requests and emitted no console errors. The deterministic first-choice route sequence reached **Six signals delivered** with the one-sentence queue debrief; second choices reached **Run ended**. **Run this topology again** returned to Round 1, and **Reset demo** returned the sample to Round 1 without retaining its prior progress. Desktop entry, win, loss, and phone entry captures are in `/work/.evidence/signal-school-verify-5/`.

## Clean setup and declared claims

From the documented clean Node `v22.23.2` setup, `npm ci` completed with zero vulnerabilities. All 25 declared claim commands in `.factory/claims.json` were invoked separately and passed.

| Claim IDs | Result |
| --- | --- |
| `three-round-ending`, `restart-reset`, `game-content`, `pause-stops-storm-clock`, `room-rate-limit` | Pass |
| `scenario-set-content`, `demo-isolation`, `keyboard-routes`, `settings-persist`, `demo-no-external-requests`, `privacy-by-default`, `local-practice`, `sample-ready`, `browser-end-screen`, `game-not-course`, `accessibility-basics`, `route-titles`, `phone-frame-rate`, `online-rooms`, `scenario-set-unavailable`, `leave-room`, `room-data-deletion` | Pass |
| `two-to-four-players`, `room-persistence`, `room-retention` | Pass |

The aggregate gates also passed: `npm test` (8 checks), `npm run realtime:test` (3 checks), `npm run realtime:build`, and `npm run build`. The production build is 13.37 KB gzip JavaScript and 4.18 KB gzip CSS; bundled self-hosted fonts total 44.89 KB. The independent live 390px / four-times CPU-throttled measurement had a 16.6 ms median animation frame interval (60.24 fps).

## Live game, accessibility, routes, and recovery

- Live Playwright axe on phone `/demo` found no violations, including no serious or critical violations. `verify-url.sh` passed for `/demo`: HTTP 200, route title, `lang="en"`, one h1, main landmark, no missing image alternatives, no unlabeled buttons, and no console errors.
- Key `1` advanced a live demo from Round 1 to Round 2. The sample game exposes pointer, touch, and keyboard route choices; pause and persisted motion settings are covered by their passed deterministic claims.
- Live titles and h1s were checked for `/`, `/demo`, `/privacy`, `/terms`, and `/not-a-route`. The last deliberately returns HTTP 404 with **Page not found** and **This page does not exist.** This expected 404 is not a defect.
- `/`, `/demo`, `/privacy`, `/terms`, `robots.txt`, and `sitemap.xml` returned 200. Privacy and Terms are present. No offline reload or update promise is published, so none was inferred.
- An invalid room code showed the recovery message: **That room code does not exist. Ask the host to check the code.**

## Live multiplayer, isolation, and service

Four independent fresh browser clients joined live room `R14OKG` and received the distinct views **Relay runner**, **Weather reader**, **Harbor clerk**, and **Signal keeper**. A fifth client received **This room already has four players.** The Weather reader reloaded into the same room safely.

After the two remaining connected clients started the run, they reached a Tide Lines win using `split / west / hold`. Host restart changed the room to Fog Junction and changed the guest to Harbor clerk; `west / hold / split` won. A further restart changed it to Headland Loop and changed the guest to Signal keeper; `split / split / split` reached **Shared run ended**. Host deletion returned both clients to the room form, displayed the deletion message, and `GET /rooms/R14OKG` then returned 404. Win and loss captures are retained in the evidence directory.

Two separately created live rooms had different codes (`VG6BKO`, `NN8JMD`); the second room did not expose the first host's name. This confirms room isolation in addition to the claimed local SQLite restart-persistence check. Live `/health` returned 200 with the candidate SHA and `/data`. Forty-two lookup requests using reserved address `198.18.0.55` ended in HTTP 429 with `Retry-After: 59`, without consuming a normal visitor allowance.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| V1-01 invalid claim commands | Resolved; all current declared commands use supported selectors and passed separately. |
| V1-02 reconnect lost a player | Resolved; the live Weather reader recovered the same room and role after reload. |
| V1-03 board not visible on phone | Resolved; 198 CSS pixels of active board are visible at 390×844. |
| V1-04 unknown route returned 200 | Resolved; the designed fallback deliberately returns HTTP 404. |
| V1-05 dead factory footer link | Resolved; the required attribution is present as local text with no dead destination. |
| V1-06 fewer than 20 cards | Resolved; the distinct-content claim passes for eight free plus twelve Scenario Set cards. |
| V1-07 no phone frame-rate proof | Resolved; the declared check passes and this live check measured 60.24 fps. |
| V1-08 incomplete role/title assertions | Resolved; current checks cover four role views and fallback titles. |
| R1-01 legal-page section links dead | Resolved; Privacy and Terms link to the named landing sections. |
| R1-02 public factual claims absent from inventory | Resolved; 25 unique public claims have tagged commands. |
| V3-01 intermittent demo-isolation command | Resolved; the first clean invocation passed on both browser projects and asserts divergent real/demo outcomes. |
| R3-01 room topology and role variation | Resolved; current live room run changed topology, roles, plans, wins, and loss across restarts. |
| R3-02 cloned card gameplay | Resolved; current twenty-card content claim tests distinct full playable round content and correct paths. |
| R3-03 room deletion/retention and incomplete privacy | Resolved; live host deletion, documented fields, and 24-hour expiry claim are present. |
| R3-04 incorrect WebSocket rate-limit wording | Resolved; HTTP/upgrade limits use 429 with `Retry-After`; an open socket gets the separately stated readable wait message. |
| R3-05 untestable future license promise | Resolved; the unregistered offer has no price, checkout, activation, or license-verification promise. |
| R3-06 metaphorical 404 copy | Resolved; live copy says **This page does not exist.** |
| Repair 3 undersized phone targets | Resolved; tested live targets meet the 44px minimum. |

## Evidence

Evidence is in `/work/.evidence/signal-school-verify-5/`, including `live-desktop-entry.png`, `live-desktop-win.png`, `live-desktop-loss.png`, `live-phone-entry.png`, `live-room-win-host.png`, `live-room-win-guest.png`, `live-room-loss-host.png`, `verify.json`, live health headers, and rate-limit headers. The required top-level copy is `/work/.evidence/qa-report.md`.
