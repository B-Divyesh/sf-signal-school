# Signal School verification 4 — route signals together

## Verdict: PASS

Independent QA found **0 findings** and **0 untested claims**. Signal School passes this verification.

- Live product: <https://signal-school.sociobot.in>
- Static implementation reviewed: `b21d658fe61e4fbe7de93ddadc8a99d96017f2c8`
- Realtime implementation reviewed: `fa23702117cc348325df2225356251d5cf53bc31`
- Documentation revision before this report: `04c3791ae220535e694eef0f3fa51ff787db11bc`

The only change between the static implementation and the pre-verification documentation revision is `.factory/handoff.md`. The clean build's HTML, JavaScript, and CSS hashes match the live files.

## First screen

Before scrolling in fresh desktop and 390×844 phone contexts, the page states:

- Job: **Route signals together before the storm**.
- Audience: small groups discussing queues, bottlenecks, redundancy, and feedback while playing.
- First action: **Try it with sample data**, followed by **Opens a three-round practice run**.

The game is visible on the first screen. The phone view shows 192.19 CSS pixels of the populated relay board. The persistent **Demo — sample data, nothing is saved** label, three route controls, and labelled practice teammates are present.

## Clean setup and claim commands

Node `v22.23.2` and npm `10.9.8` satisfy the documented Node 22+ prerequisite. `npm ci` completed with zero vulnerabilities. Every command in `.factory/claims.json` ran separately from this clean setup.

| Claim | Result |
| --- | --- |
| `three-round-ending` | Pass |
| `restart-reset` | Pass |
| `scenario-set-content` | Pass |
| `demo-isolation` | Pass on both browser projects |
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
| `game-content` | Pass |
| `pause-stops-storm-clock` | Pass |
| `phone-frame-rate` | Pass at the stated 390px and 4× CPU setting |
| `online-rooms` | Pass with independent browser contexts |
| `two-to-four-players` | Pass |
| `room-persistence` | Pass across a local service restart and the same SQLite database |
| `scenario-set-unavailable` | Pass |
| `leave-room` | Pass |
| `room-rate-limit` | Pass |

Each of the 23 claim IDs is unique and appears in exactly one test. No current operational claim on the live landing, legal, demo, README, or service surfaces lacks matching coverage. The conditional Scenario Set offer remains clearly unavailable until its separate billing registration; no price, checkout, activation, or credential is presented.

## Game and sample evidence

- Fresh desktop sample: Split in all three rounds reached **Six signals delivered** and the one-sentence queue debrief. Restart returned to Round 1. West in all three rounds reached **Run ended**.
- Keyboard: key `1` completed the deterministic winning run without pointer input.
- Pause and settings: the displayed storm clock did not change during a timed pause, resumed afterward, and the reduced-motion setting survived reload.
- Sample isolation: a real West-route result remained at Round 2 with one delivered signal after a demo Split result was reset. The reset demo returned to Round 1 with zero signals. **Start for real** restored the unchanged real result.
- Recovery: malformed saved practice JSON recovered to the start state without a console error. An unknown room code gave the stated check-the-code recovery message.
- The sample requested only `https://signal-school.sociobot.in`; it made no room connection, analytics, tracker, remote-font, or remote-script request.

Run evidence: `live-demo-trace.zip`, `live-desktop-entry.png`, `live-desktop-win.png`, and `live-desktop-loss.png` in `/work/.evidence/signal-school-verify-4/`.

## Multiplayer and service evidence

- Four independent live browser contexts joined room `BLPDIC` and received four distinct role views: Relay runner, Weather reader, Harbor clerk, and Signal keeper. A fifth independent client was rejected with **This room already has four players**.
- The Weather reader reloaded into the same room, role, and partial information. Two remaining connected clients agreed on three Split plans and both received the shared win. After host restart, three Direct plans produced the shared loss. A second restart returned the guest to the lobby.
- **Leave room** prevented reconnect on reload. A separate room `51O32N` had a different code and did not expose the first room's players.
- Live `/health` returned 200, build `fa23702117cc348325df2225356251d5cf53bc31`, and storage `/data`.
- The live service returned HTTP 429 with `Retry-After: 60` after its allowance. The request used a reserved test address header so it did not consume another visitor's bucket.
- The integration claim stopped and reopened the product service against the same temporary SQLite file and found the room. The live service itself was not restarted.

End-screen evidence: `live-room-win-host.png`, `live-room-win-guest.png`, and `live-room-loss-host.png` in the evidence directory.

## Accessibility, phone, performance, and routes

- `/opt/fleet/lib/verify-url.sh` passed live `/demo`: HTTP 200, `lang="en"`, one h1, main landmark, labelled buttons, image alternatives, and no console errors.
- Playwright axe found no serious or critical issue. The first Tab stop is the visible skip link with a 4px focus outline. Route changes and browser back focus the h1.
- Every visible phone header, demo, and game control measured at least 44×44 CSS pixels. Reduced-motion media set `data-reduce-motion="true"`. At 200% root text size there was no horizontal overflow or loss of the active round label.
- Lighthouse 13.4.1 mobile scores: performance 100, accessibility 100, best practices 100, SEO 100. FCP was 0.9 s, LCP 1.1 s, total blocking time 60 ms, and CLS 0.
- The build contains 11.14 KB gzip JavaScript, 4.18 KB gzip CSS, and 44.89 KB of self-hosted fonts. All `dist/` files total 168,515 bytes.
- `/`, `/demo`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`, the manifest, social image, and favicon returned 200. Legal-page header links reach their named landing sections.
- `/not-a-route` intentionally returned HTTP 404 with title **Page not found — Signal School**, one h1, the site structure, and a return link. This expected 404 is not a defect.
- An empty license form is rejected by native validation. No offline mode or update behavior is promised; the live page registers no service worker.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| V1-01 invalid Vitest claim commands | Resolved. All affected `-t` commands pass. |
| V1-02 room refresh lost the player | Resolved. The live guest retained its room and Weather reader view after reload. |
| V1-03 phone board below the first view | Resolved. 192.19 CSS pixels are visible at 390×844. |
| V1-04 unknown route returned 200 | Resolved. The designed fallback returns HTTP 404. |
| V1-05 dead factory footer link | Resolved. The attribution is local text. |
| V1-06 fewer than twenty cards | Resolved. The inventory has eight free and twelve Scenario Set cards. |
| V1-07 missing phone frame-rate proof | Resolved. The declared throttled phone command passes. |
| V1-08 incomplete role/title assertions | Resolved. The tests check four role views and the fallback title. |
| R1-01 legal-page header links were dead | Resolved on both Privacy and Terms. |
| R1-02 public claims were missing from the inventory | Resolved. There are 23 unique claims with one tagged test each. |
| V3-01 demo-isolation command was intermittent | Resolved. It passed first invocation on both projects and now asserts distinct outcomes and reset behavior. |
| Repair 3 phone targets below 44px | Resolved. The live minimum is 44px. |

## Other gates

- `npm run test:all`: 7 Vitest tests passed; 34 browser checks passed; 2 device-specific checks were expected skips; realtime TypeScript and the Vite production build passed.
- `npm run realtime:test`: 2 SQLite/WebSocket integration tests passed.
- Security headers include CSP with `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS.
- Privacy, Terms, README, MIT `LICENSE`, design plan, demo documentation, copy audit, metadata, sitemap, robots file, and designed 404 are present.

Evidence directory: `/work/.evidence/signal-school-verify-4/`.
