# Signal School review 2 — route signals together

## Verdict: PASS

Signal School passes this strict review with **0 findings** and **0 untested claims**.

- Live product: <https://signal-school.sociobot.in>
- Static implementation reviewed: `b21d658fe61e4fbe7de93ddadc8a99d96017f2c8`
- Realtime implementation reviewed: `fa23702117cc348325df2225356251d5cf53bc31`
- Documentation revision before this report: `f1e024fb4315380e8921d66a587fe1bb19529f1b`

No product code was changed for this review. A clean local build produced HTML, JavaScript, and CSS whose SHA-256 hashes exactly match the live files.

## First screen and sample

Fresh desktop and 390×844 phone browsers opened `/demo` before scrolling. Both stated the job, audience, and first action:

- Job: **Route signals together before the storm**.
- Audience: small groups discussing queues, bottlenecks, redundancy, and feedback while playing.
- First action: **Try it with sample data**; it says **Opens a three-round practice run**.

The populated relay board, route controls, labelled practice teammates, and persistent **Demo — sample data, nothing is saved** label appeared immediately. The phone view contained 192.19 CSS pixels of board. All tested phone header, demo, and game targets were at least 44×44 CSS pixels.

The deterministic sample reached **Six signals delivered** with its queue debrief by choosing Split, Split, and Read + split. Restart returned it to Round 1; the West, West, Old plan path reached **Run ended**. Reset demo returned to Round 1 without changing a real local run. A complete demo made requests only to the product origin.

## Claims and local gates

After `npm ci` on the documented Node 22+ setup, every one of the 23 commands in `.factory/claims.json` was invoked separately and passed. The isolated rerun of `settings-persist` also passed on both desktop and phone projects after the local test servers were free.

- `npm test`: 7 tests passed.
- `npm run test:browser`: 34 browser checks passed; 2 device-specific checks were expected skips.
- `npm run realtime:test`: 2 SQLite/WebSocket integration tests passed.
- `npm run realtime:build` and `npm run build` passed.

The browser claims cover the demo sandbox, keyboard, settings, privacy requests, sample readiness, end/restart, no grading path, axe, route titles, scenario offer, room leave, frame-rate, and real browser-client rooms. Unit and service claims cover the deterministic ending, reset, content count, pause, player limit, SQLite restart persistence, and HTTP rate limiting.

## Live interaction, recovery, and accessibility

- Pause held the live storm clock at 2:58; resume advanced it to 2:57. A malformed saved demo document recovered to Round 1 without a console error.
- Key `1` advanced a phone run. System reduced motion set `data-reduce-motion="true"`. The in-game motion setting survives reload. At 200% root text size there was no horizontal overflow.
- The first Tab stop was the visible **Skip to the game** link. Live Playwright axe found zero serious or critical issues; `verify-url.sh` passed `/demo` with `lang="en"`, one h1, a main landmark, labelled buttons, image alternatives, and no console errors.
- Privacy and Terms links reached their named landing sections. The designed `/not-a-route` page returned HTTP 404, its own title, one h1, header, footer, skip link, and return path. The deliberate 404 is expected behavior, not a finding.
- Invalid room code `ZZZZZZ` showed the stated check-the-code recovery message. Local malformed practice state recovered safely. No offline or update behavior is promised.
- `/`, `/demo`, `/privacy`, `/terms`, metadata routes, and all non-fragment internal links returned 200. Live metadata includes route title, description, canonical URL, social card, and `lang="en"`.

## Multiplayer and service

Five independent live browser contexts were used. Four joined room `9VC6WW` with the intended distinct views: Relay runner (West capacity), Weather reader (weather marks), Harbor clerk (Harbor priority), and Signal keeper (status flags). The fifth received **This room already has four players.**

The Weather reader reloaded into the same room and role. All four clients submitted three Split plans and reached the shared win, restarted, submitted three Direct plans, reached the shared loss, and restarted again. This proves independent real-client partial views, shared outcomes, recovery, win, loss, and restart rather than a sample transport.

Live `/health` returned 200 with realtime build `fa23702117cc348325df2225356251d5cf53bc31` and storage `/data`. The local integration claim proves a room remains after a service restart against the same SQLite file. A live allowance check using reserved test address `198.18.0.22` returned 429 with `Retry-After: 60` without using a visitor bucket.

## Prior findings

| Earlier finding | Current disposition |
| --- | --- |
| V1-01 invalid claim commands | Resolved; all declared commands now use supported selectors and passed individually. |
| V1-02 room refresh lost a player | Resolved; the Weather reader resumed the same room and view. |
| V1-03 board was below the phone viewport | Resolved; 192.19 CSS pixels of board are visible initially. |
| V1-04 unknown route returned 200 | Resolved; the designed fallback returns HTTP 404. |
| V1-05 dead factory footer link | Resolved; required attribution is local text, not a dead external link. |
| V1-06 fewer than 20 topology cards | Resolved; eight free plus twelve Scenario Set cards are tested. |
| V1-07 missing phone frame-rate proof | Resolved; live 390px / 4× throttle measurement was 59.88 fps. |
| V1-08 incomplete role/title assertions | Resolved; tests assert all four role views and the fallback title. |
| R1-01 legal-page section links were dead | Resolved; Privacy and Terms both reach the named landing sections. |
| R1-02 public factual promises missing from claims | Resolved; 23 unique claims each have one tagged test. |
| V3-01 intermittent demo-isolation command | Resolved; its outcome-based test passed from the clean command run. |
| Repair 3 undersized phone targets | Resolved; live tested targets meet the 44px minimum. |

## Evidence

Evidence is in `/work/.evidence/signal-school-review-2/`, including `live-desktop-entry.png`, `live-desktop-win.png`, `live-desktop-loss.png`, `live-phone-entry.png`, `live-room-win-host.png`, `live-room-win-weather-reader.png`, `live-room-loss-host.png`, and `verify.json`.

The named `factory-evidence/signal-school-verify-4/qa-report.md` directory was not present in this checkout or `/work`; the complete committed [verification 4](verification-4.md) report was available and reviewed. Its reported candidate, live behavior, and static hashes agree with this review.

The Scenario Set remains visibly built in but unavailable for checkout, activation, or price until its separate one-time offer is registered. That external commercial dependency does not block the free game or real rooms and is not presented as currently available.
