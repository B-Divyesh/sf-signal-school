# Signal School review 4 — route signals together

## Verdict: PASS

Signal School passes this strict review with **0 findings** and **0 untested claims**.

- Live product: <https://signal-school.sociobot.in>
- Candidate implementation reviewed: `cad187f558c5faabb8802824806b7674241925dd`
- Documentation revision before this report: `cb7a633c523c059217a69d23aba0574b981e7557`
- Live realtime health: build `cad187f558c5faabb8802824806b7674241925dd`, durable storage `/data`

No product code was changed for this review. The deployed main JavaScript asset is `assets/main-CABzOP_B.js`; its SHA-256 is `21aaf89a3a4829f57ea477b231d8c0cd02139f825d6b967db47c21bab2c9ee59`, exactly matching the clean candidate build.

## What the game does

Fresh desktop and 390×844 phone browsers opened the live first screen without scrolling. Both stated:

- Job: **Route signals together before the storm**.
- Audience: **For small groups who want to discuss queues, bottlenecks, redundancy, and feedback while they play.**
- First action: **Try it with sample data** — **Opens a three-round practice run.**

The game board is on the first screen: its top was 436.47 CSS px on the phone, leaving 407.53 CSS px visible in the 844 px viewport. The phone has active reduced motion, and its fresh first Tab stop is the visible **Skip to the game** link with a 4 px outline.

The one-click `/demo` run showed its persistent **Demo — sample data, nothing is saved** label, a populated Tide Lines board, three route choices, and labelled practice teammates. The first route choice in each round reached **Six signals delivered** and its one-sentence queue debrief. **Run this topology again** returned it to Round 1. **Reset demo** returned it to Round 1 and did not alter a separate real practice run that remained at Round 2 after **Start for real**. The observed complete sample made no console error or cross-origin request.

## Local checks and claims

From this clean checkout on Node `v22.23.2`, `npm ci` completed with zero vulnerabilities. Each of the 25 exact commands declared in `.factory/claims.json` was invoked separately and passed. The aggregate gates also passed:

- `npm test`: 8 checks passed.
- `npm run realtime:test`: 3 checks passed.
- `npm run realtime:build` and `npm run build`: passed.
- `npm run test:browser`: 38 checks passed; Playwright records status `passed` with no failed tests.

The production build contains 13.37 KB gzip JavaScript and 4.18 KB gzip CSS. The live 390 px phone check under four-times CPU throttling measured a 16.60 ms median frame interval, or 60.24 fps.

I cross-checked current public factual statements on the landing page, game, legal pages, and README against the 25-entry inventory. Every operational statement has an observable declared test. The Scenario Set is described only as unavailable until registration; there is no price, checkout, activation, future credential, or learning-certification promise without coverage.

## Live routes, accessibility, and recovery

- `/opt/fleet/lib/verify-url.sh https://signal-school.sociobot.in/demo /work/.evidence/signal-school-review-4` passed: HTTP 200, title, `lang="en"`, one h1, main landmark, image alternatives, labelled buttons, and no console errors.
- A fresh live phone Playwright axe check found zero serious or critical violations. The standalone `@axe-core/cli` could not locate a system Chrome binary in this worker; the product’s pinned Playwright Chromium check was used instead.
- `/`, `/demo`, `/privacy`, `/terms`, `robots.txt`, and `sitemap.xml` returned 200. All discovered same-origin links on the landing, demo, and legal routes returned 200.
- `/not-a-route-review-4` deliberately returned HTTP 404 and the usable **Page not found** page. This expected response is not a finding.
- The live response has the expected CSP, `X-Content-Type-Options`, `Referrer-Policy`, HSTS, and permissions policy headers. The sample does not promise offline reload or updates, so none was inferred.

## Live online rooms and service

Five fresh clients exercised a live room. Four received distinct intended partial views: **Relay runner**, **Weather reader**, **Harbor clerk**, and **Signal keeper**. The fifth received **This room already has four players.** The Weather reader refreshed safely into the same role.

After the other two players left, the remaining two agreed on the correct plan in Tide Lines and Fog Junction, reaching **Six signals delivered** in both. Host restart changed the room to Fog Junction and the guest to Harbor clerk, then to Headland Loop. A third route sequence reached **Shared run ended**. The host accepted the explicit delete confirmation; both live clients returned to the room form and a direct room lookup returned 404.

`GET /health` returned the reviewed candidate SHA and `/data`. A reserved test address reached HTTP 429 on request 41, with `Retry-After: 59`; ordinary visitor allowance was not used.

## Earlier findings

| Earlier finding | Current disposition and evidence |
| --- | --- |
| V1-01 invalid claim commands | Resolved: all 25 current declared commands passed separately. |
| V1-02 reconnect lost a player | Resolved: the live Weather reader retained the room and role after reload. |
| V1-03 board missing from first phone view | Resolved: 407.53 CSS px of the game card is visible in this fresh phone check. |
| V1-04 unknown route returned 200 | Resolved: the live fallback returned HTTP 404. |
| V1-05 dead factory footer link | Resolved: attribution is present as local text, with no dead external destination. |
| V1-06 fewer than twenty cards | Resolved: the tested game-content inventory is eight free plus twelve Scenario Set cards. |
| V1-07 no phone frame-rate proof | Resolved: the current live measurement is 60.24 fps under the declared throttle. |
| V1-08 incomplete role/title assertions | Resolved: current tests cover four roles and fallback titles. |
| R1-01 dead legal-page anchors | Resolved: discovered `/#how-to-play` and `/#scenario-set` links return the landing page. |
| R1-02 missing public claim coverage | Resolved: 25 current public operational claims each have a tagged command. |
| V3-01 intermittent demo isolation | Resolved: the isolated command passed and this review observed divergent real and demo state through reset. |
| R3-01 room topology and role variation | Resolved: live restarts changed topology, guest role, plans, and outcomes. |
| R3-02 cloned card gameplay | Resolved: the current content command tests distinct complete cards and their correct paths. |
| R3-03 room deletion, retention, and privacy | Resolved: current live deletion returned all clients to the form and made the lookup 404; privacy names stored fields and 24-hour cleanup. |
| R3-04 inaccurate WebSocket rate-limit wording | Resolved: current copy distinguishes HTTP/upgrade `429` from an open-socket wait message; the rate-limit claim covers both. |
| R3-05 untestable future license promise | Resolved: no license-verification or future sale promise remains. |
| R3-06 metaphorical 404 copy | Resolved: the page says **This page does not exist.** |
| Repair 3 undersized phone targets | Resolved: the current phone accessibility checks and full browser suite pass. |

## Evidence

Evidence is in `/work/.evidence/signal-school-review-4/`, including desktop, phone, win, loss, and room captures plus `verify.json`. The required factory copy is `/work/.evidence/qa-report.md`; its matching result is `/work/.evidence/qa-result.json`.
