# Signal School verification 2

## Verdict: PASS

Candidate reviewed: static implementation `67d76b89bee43ee04c366518a15a2f67f8879baa`; realtime implementation `fa23702117cc348325df2225356251d5cf53bc31`; documentation and test revision `01c918e27f979af502ab6926961903f979958885`.

Live product: <https://signal-school.sociobot.in>  
Live room service: <https://signal-school-realtime.sociobot.in/health>

There are **0 findings** and **0 untested claims**. This is a product PASS.

## What was checked

- Fresh setup: `npm ci` completed with no vulnerabilities. `npm run test:all` passed: 6 unit tests, 20 Playwright checks (2 expected project-specific skips), realtime TypeScript build, and Vite production build. `npm run realtime:test` separately passed its two SQLite/WebSocket integration tests, including a service stop/reopen persistence check.
- Every command declared in `.factory/claims.json` passed after the clean install. This covers the three-round ending, restart reset, scenario content and role rotation, demo isolation, keyboard choices, persisted motion setting, same-origin demo traffic, end screen, automated accessibility, route titles, twenty-card inventory, phone frame-rate threshold, room recovery, and rate limiting.
- The first desktop view puts the game board in the viewport and states the job, audience, and first action: **Route signals together before the storm**; for small groups discussing systems ideas while playing; **Try it with sample data**. The board was at 266–700px in a 900px viewport.
- A fresh desktop `/demo` showed the persistent **Demo — sample data, nothing is saved** label, named practice teammates, a populated relay board, and route controls. Split / Split / Read + split reached **Six signals delivered** with a one-sentence queue debrief. West / West / Old plan reached **Run ended**. Restart returned to Round 1 of 3.
- A fresh 390×844 phone `/demo` showed the job, audience, first action, label, and 198px of the board in the first viewport. With reduced motion emulated, the page set `data-reduce-motion="true"`; key `1` advanced to Round 2 and Reset demo returned it to Round 1. Live axe found no serious or critical violations and no console errors were observed.
- Demo reset was checked against a real practice run in one browser context: real progress was unchanged and the reset demo state was `active`, round 0, delivered 0. The sample run made only same-origin requests.
- Two independent live browser contexts created and joined room `4QPJFJ`. The host received Relay runner capacity information while the guest received Weather reader information; the guest refresh restored that same partial view. Both submitted Split for three rounds, reached the shared win, and host restart returned the guest to the lobby. An invalid code produced the announced recovery message, “That room code does not exist. Ask the host to check the code.”
- Live `/health` returned `{ "ok": true, "build": "fa23702…", "storage": "/data" }`. Forty-two room lookups ended in HTTP 429 with `Retry-After: 31`. The local integration suite proves state still exists after a service restart against SQLite.
- `/opt/fleet/lib/verify-url.sh` passed on live `/demo`: HTTP 200, correct title and language, one h1, main landmark, no missing image alternatives or unlabeled buttons, and no console errors. Live Privacy, Terms, and designed fallback had their route titles and one h1; `/not-a-route` returned deliberate HTTP 404, not a broken page.
- Production output is 11,162 B gzip JavaScript and 4,128 B gzip CSS. Bundled local WOFF2 fonts total 44,892 B. The frame-rate claim test passed at the stated 390px / 4× CPU-throttled measurement environment.

## Claim results

| Claim IDs | Declared command family | Result |
| --- | --- | --- |
| `three-round-ending`, `restart-reset`, `game-content`, `room-rate-limit` | `npm test -- -t @claim:<id>` | Pass |
| `scenario-set-content`, `demo-isolation`, `keyboard-routes`, `settings-persist`, `demo-no-external-requests`, `browser-end-screen`, `accessibility-basics`, `route-titles`, `phone-frame-rate`, `online-rooms` | `npm run test:browser -- --grep @claim:<id>` | Pass |

## Earlier findings

| Earlier finding | Current disposition | Evidence |
| --- | --- | --- |
| V1-01 invalid Vitest claim commands | Resolved | The four inventory commands now use Vitest `-t` and all pass from the clean install. |
| V1-02 room refresh recovery | Resolved | The guest resumed the same live room and Weather reader partial view after a normal reload. |
| V1-03 phone board below the viewport | Resolved | Board top 592px, with 198px visible in the 844px phone viewport. |
| V1-04 unknown path returned 200 | Resolved | `GET /not-a-route` returned HTTP 404 and the styled fallback title, h1, header, footer, and return link. |
| V1-05 dead factory footer link | Resolved | The footer attribution is product-local text; all product navigation links checked return usable routes. |
| V1-06 fewer than 20 cards | Resolved | The scenario inventory claim passes for eight free and twelve Scenario Set cards, twenty distinct three-round cards total. |
| V1-07 no phone frame-rate proof | Resolved | The declared phone frame-rate claim passes at 4× CPU throttling; the production result is recorded in handoff. |
| V1-08 incomplete role/title assertions | Resolved | The scenario test checks all four role views and the route-title test asserts the fallback title. |

The unregistered Scenario Set offer remains explicitly unavailable: the Terms page states there is no checkout, activation, or price. It is an external registration dependency, not an untested product claim or a user-path defect.

## Evidence

Evidence is retained in `/work/.evidence/signal-school-verify-2/`: desktop entry, win, and loss screenshots; phone demo screenshot; shared-room win screenshot; response headers and fallback document; and the `verify-url.sh` report.
