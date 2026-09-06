# Signal School review 3 — route signals together

## Verdict: FAIL

Signal School fails this strict review with **6 findings** and **4 untested or incompletely tested public claims**. Passing declared commands does not make this a product PASS.

- Live product: <https://signal-school.sociobot.in>
- Static implementation reviewed: `b21d658fe61e4fbe7de93ddadc8a99d96017f2c8`
- Realtime implementation reviewed: `fa23702117cc348325df2225356251d5cf53bc31`
- Documentation revision before this report: `bec14e90395aae8ddadf246d8559cf24a2d4baf1`

The clean build's HTML, JavaScript, and CSS hashes match the live files. Later commits through `bec14e9` change only factory reports and handoff documentation.

## Findings

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| R3-01 | High | Real multiplayer does not vary topology or role across runs, and its partial views do not affect routing outcomes. A restart left all four live clients in the same roles. The service increments a hidden `scenario` number, but does not send or use it in role information, choices, scoring, or the displayed room. Every round and hidden scenario awards 2 for Split, 1 for Direct, and 0 for Hold. This misses the required varying asymmetric signal-routing game. | Four live clients in room `DMZD36` remained Relay runner, Weather reader, Harbor clerk, and Signal keeper after restart. `realtime/src/server.ts` stores `scenario` but `publicState`, `ownIntel`, and `choose` do not use it. Evidence: `live-review.json` and the room win/loss captures. |
| R3-02 | High | The public claim of twenty finished topology cards is not supported by twenty finished gameplay sets. Seventeen cards copy all round goals, partial information, teammate lines, choices, and outcomes from one of three core scenarios; only the title, topology summary, role shell, and debrief change. The claim test checks counts, three-round length, and distinct topology strings, so it can pass without testing distinct playable content. | `scenario-signatures.json` found 20 cards but only 3 distinct round-content signatures: groups of 8, 7, and 5 cards. `additionalPracticeCards` and `premiumScenarioSet` clone `template.rounds` in `src/lib/game.ts`. This is an incompletely tested public claim. |
| R3-03 | Medium | Online-room privacy has no deletion or retention path, and the README's “retain only” list is false. Leaving a room clears browser reconnection but the durable SQLite row remains indefinitely. The service also stores a persistent client UUID, host/connection flags, and created/updated timestamps, none of which are named in the public “only” list. Privacy gives no server-data deletion action, retention period, or usable contact route. | `players` stores `client_id`, `connected`, and `is_host`; `rooms` stores `created_at` and `updated_at`. `leave()` only removes `signal-school:room-session`; socket close updates `connected=0`. The room-persistence test confirms the row remains. No claim test checks the public retention-only statement. |
| R3-04 | Medium | The README says regular HTTP and WebSocket actions send `429` with `Retry-After` after the allowance. The declared rate-limit test exercises HTTP only. An established WebSocket that exceeds its message allowance stays open and receives a JSON error, not an HTTP 429 response or `Retry-After` header. | A local product-service check returned `{socketStillOpen:true,lastMessage:{type:"error",message:"Rate limit exceeded. Try again in 60 seconds."}}`. The live HTTP allowance correctly returned 429 with `Retry-After: 60`. Evidence: `websocket-rate-behavior.txt` and `rate-limit.txt`. This is an incompletely tested and partly false public claim. |
| R3-05 | Low | The Terms page and README promise a future Sociobot license-verification path, but `.factory/claims.json` has no claim or fixture test for accepting, rejecting, caching, or recovering from license verification. The `scenario-set-unavailable` test only proves that cards are visible and checkout is absent. | Public copy says “The game verifies that token at the documented product endpoint” and “future Sociobot license verification path.” No `@claim` test covers `src/lib/license.ts`. This is an untested public claim even though the offer is currently unavailable. |
| R3-06 | Low | The designed 404 uses metaphorical product copy: “This route is not on the relay board.” The current plain-words contract requires a direct explanation such as “This page does not exist.” | Live `/not-a-route-review-3` correctly returned HTTP 404 and remained usable; only the non-plain sentence is defective. |

Untested/incomplete public-claim count: **4** (`game-content`, online retention-only privacy, WebSocket 429 behavior, and future license verification).

## First screen and complete runs

Fresh desktop and 390×844 phone contexts opened `/demo` before scrolling. Both showed:

- Job: **Route signals together before the storm**.
- Audience: small groups discussing queues, bottlenecks, redundancy, and feedback while playing.
- First action: **Try it with sample data**, with **Opens a three-round practice run**.
- The persistent **Demo — sample data, nothing is saved** label, a populated Tide Lines board, three route choices, and labelled practice teammates.

The desktop Split path reached **Six signals delivered** and its one-sentence queue debrief. Restart returned to Round 1. Three West choices reached **Run ended**. Pause held the clock at 2:59 and resume advanced it to 2:58. The phone completed the winning path with keys 1, 1, 1, showed the end screen, and restarted to Round 1.

Reset demo returned the sample to Round 1 while an existing real West-route run remained at Round 2 with one delivered signal. **Start for real** restored that unchanged run. Malformed sample storage recovered to Round 1 without a console error.

## Declared claims and clean gates

Node `v22.23.2` and npm `10.9.8` satisfy the documented Node 22+ prerequisite. From a detached clean checkout, `npm ci` completed with no vulnerabilities. Every command in `.factory/claims.json` was invoked separately.

| Declared claim | Command result |
| --- | --- |
| `three-round-ending` | Pass |
| `restart-reset` | Pass |
| `scenario-set-content` | Pass |
| `demo-isolation` | Pass on desktop and phone |
| `keyboard-routes` | Pass |
| `settings-persist` | Pass |
| `demo-no-external-requests` | Pass |
| `privacy-by-default` | Pass |
| `local-practice` | Pass |
| `sample-ready` | Pass |
| `browser-end-screen` | Pass |
| `game-not-course` | Pass |
| `accessibility-basics` | Pass |
| `route-titles` | Pass |
| `game-content` | Command passes; assertion is incomplete, finding R3-02 |
| `pause-stops-storm-clock` | Pass |
| `phone-frame-rate` | Pass |
| `online-rooms` | Pass for its asserted two-client flow; core variation gap is R3-01 |
| `two-to-four-players` | Pass |
| `room-persistence` | Pass across local service restart and the same SQLite file |
| `scenario-set-unavailable` | Pass; it does not test the license promise in R3-05 |
| `leave-room` | Pass; it does not delete durable room data in R3-03 |
| `room-rate-limit` | HTTP assertion passes; WebSocket wording is incomplete, finding R3-04 |

Aggregate gates also passed:

- `npm run test:all`: 7 Vitest tests and 34 Playwright checks passed; 2 device-specific checks were expected skips; realtime TypeScript and Vite builds passed.
- `npm run realtime:test`: 2 integration tests passed.
- Production output: 11.14 KB gzip JavaScript, 4.18 KB gzip CSS, 44.89 KB local fonts, and 168,515 bytes total in `dist/`.

## Live multiplayer and service checks

Five independent live browser contexts used room `DMZD36`. Four clients received distinct role text for Relay runner, Weather reader, Harbor clerk, and Signal keeper. A fifth client was rejected. The Weather reader reloaded into the same room and role. All four clients agreed on three Split choices and reached the shared win, restarted, agreed on three Direct choices, reached the shared loss, and restarted again. Leaving stopped browser reconnection. A separate room `Q4HST2` did not expose the first room's players.

Live `/health` returned 200, realtime build `fa23702117cc348325df2225356251d5cf53bc31`, and storage `/data`. A reserved test address reached HTTP 429 with `Retry-After: 60`. The live service was not restarted; the clean integration test proved SQLite availability after closing and reopening the product service against the same database.

## Accessibility, performance, privacy, and routes

- `verify-url.sh` passed live `/demo`: HTTP 200, `lang="en"`, one h1, main landmark, labelled controls, image alternatives, and no console errors.
- Live Playwright axe found zero violations. The first Tab stop was the visible skip link. SPA navigation and browser Back focused the h1.
- Every visible phone header, demo, and game control measured at least 44×44 CSS pixels. Reduced-motion media set `data-reduce-motion="true"`. At 200% text size there was no horizontal overflow.
- Live 390px performance under 4× CPU throttling measured 59.88 fps. Fresh Lighthouse scores were 100 performance, 100 accessibility, 100 best practices, and 100 SEO; LCP was 1.1 s, total blocking time 30 ms, and CLS 0.
- A complete sample made only same-origin requests. No analytics, tracker, remote font, or remote script request appeared. No offline or update behavior is promised.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200 with their route titles and one h1. Internal links and metadata assets returned 200. Legal-page section links reached their landing targets. The designed unknown route returned the expected HTTP 404 with a return path.
- The empty license form was rejected by native validation. The missing server-data deletion path and untested future verification path remain findings R3-03 and R3-05.

No AI feature is implied by this game brief, so the missed-leverage check found no AI omission.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| V1-01 invalid claim commands | Still resolved; all 23 commands ran separately. |
| V1-02 room refresh lost a player | Still resolved; the Weather reader resumed the same room and role. |
| V1-03 board below the phone viewport | Still resolved; 192.19 CSS pixels were visible. |
| V1-04 unknown route returned 200 | Still resolved; the designed route returned HTTP 404. |
| V1-05 dead factory footer link | Still resolved; attribution is local text. |
| V1-06 fewer than twenty card records | Count is 20, but R3-02 finds only three distinct gameplay sets. |
| V1-07 missing phone frame-rate proof | Still resolved; live result was 59.88 fps under the stated throttle. |
| V1-08 incomplete role/title assertions | The prior exact gaps remain resolved. New claim-depth gaps are R3-02, R3-04, and R3-05. |
| R1-01 dead legal section links | Still resolved on Privacy and Terms. |
| R1-02 missing public claim coverage | Reopened in narrower forms by R3-02 through R3-05. |
| V3-01 intermittent demo-isolation assertion | Still resolved; the fresh separate command and live outcome both passed. |
| Repair 3 undersized phone targets | Still resolved; all measured controls meet 44 px. |

## Evidence

Evidence is in `/work/.evidence/signal-school-review-3/`. It includes desktop and phone entry/end captures, shared win/loss captures, `live-review.json`, URL verification, health and rate-limit results, WebSocket rate behavior, Lighthouse JSON, and live/static hash evidence in the command record.

Required evidence copies are `/work/.evidence/qa-report.md` and `/work/.evidence/qa-result.json`.
