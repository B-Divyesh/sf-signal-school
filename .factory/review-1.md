# Signal School review 1

## Verdict: FAIL

Candidate reviewed: static implementation `67d76b89bee43ee04c366518a15a2f67f8879baa`; realtime implementation `fa23702117cc348325df2225356251d5cf53bc31`; documentation/test revision `92beb0b71b3b5d57453cd4a96b231e359a2b780c`.

Live product: <https://signal-school.sociobot.in>  
Live room service: <https://signal-school-realtime.sociobot.in/health>

There are **2 findings** and **0 untested declared claims**. This is not a product PASS.

## Findings

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| R1-01 | Medium | The **How to play** and **Scenario set** header links are dead on `/privacy` and `/terms`. They use relative `#how-to-play` and `#scenario-set` URLs, while neither legal page contains those IDs. A visitor is left on the same legal page instead of reaching the named section. | Fresh desktop browser inspection found both targets absent on both routes. The deployed source creates these links as relative anchors in `src/main.ts`; the landing page alone owns the targets. |
| R1-02 | Medium | Public factual promises are missing from `.factory/claims.json`, so the claim inventory is not complete. Examples include **No profiles or default analytics** on the first screen, **two to four players**, **Pause stops the storm clock**, the **eight** free topologies, and the privacy page’s no-tracker/no-third-party-font promise. Some underlying behavior is exercised incidentally, but none of these statements has its own listed `@claim:` test as required. | Cross-check of the live landing page, Privacy page, and README against the 14-entry claim inventory. The inventory covers demo same-origin traffic, not the broader privacy statement; it covers a three-round practice run, not the player-range or pause promise. |

## Declared claim commands

After a clean `npm ci`, every command declared in `.factory/claims.json` passed individually:

| Claim IDs | Declared command family | Result |
| --- | --- | --- |
| `three-round-ending`, `restart-reset`, `game-content`, `room-rate-limit` | `npm test -- -t @claim:<id>` | Pass |
| `scenario-set-content`, `demo-isolation`, `keyboard-routes`, `settings-persist`, `demo-no-external-requests`, `browser-end-screen`, `accessibility-basics`, `route-titles`, `phone-frame-rate`, `online-rooms` | `npm run test:browser -- --grep @claim:<id>` | Pass |

`npm run build` passed (11.18 KB gzip JavaScript; 4.11 KB gzip CSS). `npm run realtime:test` passed both SQLite/WebSocket integration tests. The aggregate test suite was also started after the clean install; every component was subsequently rerun successfully as listed above.

## Live checks that passed

- Fresh desktop and 390×844 phone `/demo` contexts stated the job, audience, and first action before scrolling: **Route signals together before the storm**; small groups discussing queues, bottlenecks, redundancy, and feedback; **Try it with sample data**. Both showed the persistent sample label, named practice teammates, and populated board. The phone board began at 592px, leaving 198px visible in the first viewport.
- The sample run used only `https://signal-school.sociobot.in`, won via Split / Split / Read + split, showed **Six signals delivered** and its one-sentence queue debrief, restarted to round one, and reached **Run ended** on a loss path. The demo banner reset remains separate from real practice storage.
- Fresh independent live browser contexts created room `8R7K41`. The host received Relay runner capacity information and the guest received Weather reader marks; guest refresh restored the same partial view. Both chose Split for three rounds, reached the shared win, and the host restarted the room. An invalid code displayed “That room code does not exist. Ask the host to check the code.”
- The live room health response is `ok`, reports realtime build `fa23702…`, and reports `/data`. Forty-two room lookups ended in `429` with `Retry-After: 60`.
- `/demo` passed `verify-url.sh`: HTTP 200, route title, `lang="en"`, one `h1`, `main`, labelled controls, image alternatives, and no console errors. The standalone `npx @axe-core/cli` could not start because this container has Playwright Chromium but no system Chrome binary; the allowed Playwright axe check was run instead and found zero serious or critical violations on live phone `/demo`.
- Reduced-motion emulation set `data-reduce-motion="true"`; the first Tab focus was the visible skip link; key `1` advanced the run. `/`, `/demo`, `/privacy`, and `/terms` returned their expected titles and headings. `/not-a-route` returned the designed page with HTTP 404 and title **Page not found — Signal School**.

## Earlier findings

All eight findings in [verification 1](verification-1.md) remain resolved: supported Vitest claim commands; room refresh recovery; board visibility on phone; deliberate HTTP 404; usable factory attribution; twenty cards; phone frame-rate check; and complete scenario/title test assertions. They are not repeated here.

## Evidence

Live screenshots, response headers, health response, and `verify-url.sh` output are retained in `/work/.evidence/signal-school-review-1/`.

## Required follow-up

1. Make the two header navigation links point to `/#how-to-play` and `/#scenario-set` (or omit them on routes without those sections), then verify their target and keyboard path on all routes.
2. Add every public factual promise to `.factory/claims.json` with one exact observable test, or remove/rewrite the unsupported promises. Rerun each declared command from a clean checkout.
