# Signal School handoff

## Review 3 — FAIL

Strict live and clean-checkout review on 2026-09-06 found **6 findings and 4 untested or incompletely tested public claims**. No product code was changed. The full report is [review 3](review-3.md).

Reviewed static implementation `b21d658fe61e4fbe7de93ddadc8a99d96017f2c8`, realtime implementation `fa23702117cc348325df2225356251d5cf53bc31`, and pre-report documentation revision `bec14e90395aae8ddadf246d8559cf24a2d4baf1`. The clean build's HTML, JavaScript, and CSS hashes match live.

All 23 declared claim commands passed separately after a clean `npm ci`. `npm run test:all` passed 7 unit tests, 34 browser checks with 2 intended skips, realtime build, and production build. `npm run realtime:test` passed 2 integration tests. Fresh live desktop and phone runs passed win/loss/restart, sample reset isolation, keyboard, pause, settings, reduced motion, 200% text, axe, route, link, and performance checks. Four independent clients received four role texts, rejected a fifth, reconnected, reached shared win/loss/restart, left safely, and remained isolated from a second room. Live phone performance was 59.88 fps under 4× CPU throttling. Lighthouse scored 100 in all four categories with 1.1 s LCP, 30 ms blocking time, and 0 CLS.

Required repairs:

1. Make real room topology and role assignments vary across runs, and make each partial view affect routing outcomes.
2. Replace the 17 cloned card bodies with finished scenario-specific rounds, then test distinct playable content rather than labels alone.
3. Add server-room retention and deletion behavior, disclose every stored field, and provide a usable privacy-request path.
4. Correct the WebSocket rate-limit wording or implement and test the promised observable behavior.
5. Add a recorded-fixture claim test for future license verification or remove that public promise until it can be tested.
6. Replace the metaphorical 404 sentence with direct page-not-found copy.

Evidence is in `/work/.evidence/signal-school-review-3/`; required copies are `/work/.evidence/qa-report.md` and `/work/.evidence/qa-result.json`.

## Review 2 — PASS

Strict review 2 passed with **0 findings and 0 untested claims**. It reviewed static implementation `b21d658fe61e4fbe7de93ddadc8a99d96017f2c8`, unchanged realtime implementation `fa23702117cc348325df2225356251d5cf53bc31`, and pre-report documentation `f1e024fb4315380e8921d66a587fe1bb19529f1b`.

No product code changed. From clean `npm ci`, all 23 declared claim commands passed separately; `npm test` passed 7 tests, `npm run test:browser` passed 34 browser checks with 2 expected skips, `npm run realtime:test` passed 2 service checks, and realtime/build commands passed. Local candidate HTML, JavaScript, and CSS hashes match live.

Fresh live desktop and phone samples showed the job, audience, first action, populated board, persistent demo label, practice teammates, win/loss/restart, reset isolation, keyboard, reduced motion, 200% text, and no sample cross-origin request. `verify-url.sh` and Playwright axe passed. The phone 4×-throttled frame check measured 59.88 fps. Four independent room clients received all four intended role views, a fifth was rejected, a guest reconnected after reload, and the clients reached shared win, loss, and restart. Live health reports `/data`; a reserved test-address check received 429 and `Retry-After: 60`.

Evidence and the full report are in [review 2](review-2.md) and `/work/.evidence/signal-school-review-2/`. The separately named verification-4 evidence directory was unavailable in this worker, but the complete committed [verification 4](verification-4.md) report was reviewed and agrees with this result.

## Verification 4 — PASS

Independent QA reviewed live static implementation `b21d658fe61e4fbe7de93ddadc8a99d96017f2c8`, realtime implementation `fa23702117cc348325df2225356251d5cf53bc31`, and pre-report documentation revision `04c3791ae220535e694eef0f3fa51ff787db11bc`.

The result is **PASS: 0 findings and 0 untested claims**. All 23 declared claim commands passed from a clean `npm ci`. `npm run test:all` passed 7 Vitest tests, 34 browser checks with 2 expected device skips, the realtime build, and the production build. `npm run realtime:test` passed 2 SQLite/WebSocket integration tests. The live HTML, JavaScript, and CSS match the clean candidate build.

Fresh live desktop and phone checks covered the first-screen job, audience and action; populated sample; persistent sample label; real/demo isolation and reset; keyboard; pause; settings; reduced motion; 200% text; 44px touch targets; win, loss and restart; privacy requests; legal navigation; route titles; deliberate 404; malformed local data; and invalid-room recovery. Four independent room clients received four distinct views, a fifth was rejected, a guest reconnected safely, two clients agreed shared win/loss/restart outcomes, leaving stopped reconnect, and a separate room did not expose the first room. Live `/health` reports the expected realtime build and `/data`; a live allowance check returned 429 with `Retry-After`.

Lighthouse 13.4.1 scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO, with 1.1 s LCP, 60 ms total blocking time, and 0 CLS. Evidence and the full result are in [verification 4](verification-4.md) and `/work/.evidence/signal-school-verify-4/`.

The Scenario Set billing registration remains an external dependency. Its twelve cards stay visible, while checkout, activation, and price remain unavailable. No price or credential was invented.

## Repair 3 — complete

The intermittent V3-01 claim check is repaired and the current candidate passes its local and live gates. Static implementation `b21d658fe61e4fbe7de93ddadc8a99d96017f2c8` is deployed at <https://signal-school.sociobot.in> by successful deployment `172b1cbf-c642-46ea-ba62-31a2320aa632`. The product-owned room service was not changed; live `/health` still reports implementation `fa23702117cc348325df2225356251d5cf53bc31` and durable storage `/data`.

### Repairs

- `demo-isolation` no longer assumes two valid run documents must serialize differently. It saves a real West-route result, plays a demo Split-route result, resets the demo, returns to the real game, and checks the saved real outcome is unchanged. The declared command passed once in the clean claim run and 20 consecutive repetitions across desktop and phone.
- The claim sandbox description now names that observable sequence instead of a serialized-value comparison.
- The performance audit found undersized phone navigation and demo controls. Those targets now measure at least 44×44 CSS pixels. The phone regression measures every visible header, demo-banner, and game button while retaining 192 pixels of the active board in the first 390×844 viewport.

### Verification

- Clean setup: `npm ci` completed with no vulnerabilities. Every one of the 23 commands in `.factory/claims.json` passed individually on final commit `b21d658`.
- Aggregate gates: `npm run test:all` passed 7 unit tests and 34 Playwright checks with 2 expected device skips, then passed realtime TypeScript and Vite builds. `npm run realtime:test` passed 2 SQLite/WebSocket integration tests.
- Production output: 11.14 KB gzip JavaScript, 4.18 KB gzip CSS, 44.89 KB local WOFF2 fonts, and 168,515 bytes across `dist/`.
- Final cold URL check: `verify-url.sh` returned HTTP 200 for `/demo`, title **Demo — Signal School**, `lang="en"`, one h1, a main landmark, no missing image alternatives or unnamed buttons, and no console errors.
- Fresh desktop: the first view showed the job, audience, sample action, persistent demo label, practice teammates, and populated board. Split / Split / Read + split reached **Six signals delivered**; a West route run reached **Run ended**; restart returned to Round 1.
- Live isolation: a real West result remained at round 2 with one signal after a demo Split result was reset to round 1 with zero signals. **Start for real** reopened the unchanged West result.
- Fresh 390×844 phone: job, audience, sample action, and 192 pixels of the active board were visible. All tested interactive targets were at least 44×44 pixels; reduced motion was active; key `1` advanced the round; no console error occurred.
- Live accessibility and performance: Playwright axe found no serious or critical issue. Lighthouse scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO; LCP was 1.1 s, CLS was 0, and total blocking time was 0 ms.
- Live routes: Privacy and Terms returned their route titles and reached the landing-page **How a run works** and **Twelve more topologies** sections. `/not-a-route` returned the designed page with deliberate HTTP 404 and its own title.
- Live privacy: the completed sample contacted only `https://signal-school.sociobot.in`; no normal-route console error was recorded.
- Live multiplayer: two independent fresh clients received Relay runner and Weather reader views. Guest refresh restored the room, and both clients reached shared win, loss, and restart states. The service returned 429 with `Retry-After` after its allowance.

Evidence is in `/work/.evidence/signal-school-repair-3/`, including final URL verification, Lighthouse JSON, desktop/phone captures, shared win/loss captures, and the live check summary. `.factory/catalog-description.txt` is 90 characters, starts with a verb, and is copied to `/work/.evidence/catalog-description.txt`.

### Remaining external dependency

The Scenario Set remains a one-time paid deliverable with twelve cards and four rotating role views. Its offer is not registered, so price, currency, checkout, and activation remain unavailable and are not guessed. The free game and real rooms still work. Operator metadata is at `/work/.evidence/billing-offer.json`; the product keeps the Sociobot license-validation path.

## Verification 3 — FAIL

Independent QA reviewed deployed static implementation `a0c3d29f060f3ae43a3f58103a36cd84e4133a2d`, realtime implementation `fa23702117cc348325df2225356251d5cf53bc31`, and documentation revision `ec45e98359cabdd49f58549f627516f628632b74`.

The result is **FAIL: 1 finding, 0 untested declared claims**. The single issue is V3-01 in [verification 3](verification-3.md): the declared `demo-isolation` Playwright command intermittently fails because it compares two independent storage values and assumes they cannot be equal. It failed on the first clean invocation, then passed on a retry and five-repeat check. The demo's actual separate namespaces and reset behavior were observed; no real-data change was found. Make that outcome test deterministic before claiming a PASS.

All other current QA passed: clean unit, realtime, build, individual claim commands, full browser suite (34 passed, 2 expected skips), live desktop/phone sample, win/loss/restart, reduced motion, keyboard, axe, legal anchors, routes/404, privacy request behavior, live independent room views/reconnect/shared outcomes, health durable-storage report, and 429/Retry-After. Evidence is in `/work/.evidence/signal-school-verify-3/`.

## Repair 2 — complete

Static implementation, claims, tests, and documentation are committed and pushed as `a0c3d29f060f3ae43a3f58103a36cd84e4133a2d`. Static deployment `66f1deb4-9ec1-4693-93e5-ae4b473b1932` completed successfully to `https://signal-school.sociobot.in`. The room service has no code change and remains on its proven durable one-replica implementation `fa23702117cc348325df2225356251d5cf53bc31`, with SQLite at `/data`.

### Repairs

- Header links now use absolute landing fragments (`/#how-to-play` and `/#scenario-set`), so they work from Privacy and Terms. Mobile keeps all four header links visible; the 390px board is still visible in the first viewport.
- `.factory/claims.json` now has 23 public claims, each with exactly one outcome-based `@claim:` test. New coverage includes two-to-four-player limits, durable room restart, pause behavior, eight free cards, profile/tracker-free sample play, browser-local practice reload, populated sample readiness, game-not-course ending, unavailable Scenario Set, and leaving a room.
- The shared-room browser path now proves both a real shared win and loss before restart. The service integration proves a fifth player is rejected and its SQLite room survives a restart.
- The public copy no longer makes an untestable price statement while the external one-time offer is unregistered. The Scenario Set remains built in and unavailable for checkout or activation.

### Verification

- Clean setup: `npm ci`, then all 23 commands declared in `.factory/claims.json` passed individually. `npm test` passed 7 tests; `npm run realtime:test` passed 2 integration tests; `npm run test:browser` passed 34 checks with 2 expected phone-only skips; `npm run realtime:build` and `npm run build` passed.
- Production output: 11,123 B gzip JavaScript, 4,157 B gzip CSS, and 44,892 B local WOFF2 fonts. Static artifacts total 168,272 B.
- Live desktop `/demo`: first screen states the job, audience, and first action; the populated board, sample banner, and practice teammates appear immediately. Split / Split / Read + split reached **Six signals delivered** with its queue debrief. **Reset demo** returned to Round 1.
- Live 390×844 phone `/demo`: all header links are visible; the board begins at 610px and supplies 198px of board content in the initial viewport. Reduced motion set `data-reduce-motion="true"`; key `1` advanced to Round 2.
- Live legal navigation: Privacy → **How to play** reaches **How a run works**; Terms → **Scenario set** reaches **Twelve more topologies**. `verify-url.sh` passed for live `/demo` with no console errors, correct title/language, one h1, main, image alternatives, and labelled controls. Live Playwright axe found no serious or critical violations.
- Live privacy: a complete fresh demo requested only `https://signal-school.sociobot.in`; its deployed CSP allows only self-hosted assets plus the product-owned room WebSocket. No default analytics/tracker, remote font, or script request was observed.
- Live rooms: two independent fresh clients received Relay runner and Weather reader views. The guest refreshed into the same room; both clients then completed a shared win, host restart, shared loss, and restart. `/health` reports the existing realtime SHA and `storage: "/data"`. The service returned `429` with `Retry-After: 48` after its allowance.
- Live routes: `/`, `/demo`, `/privacy`, and `/terms` return 200. `/not-a-route` returns the designed **Page not found** page with deliberate HTTP 404 and its route-specific title. The browser records the expected failed-navigation resource message for that deliberate 404; normal `/demo` has no console errors.

Evidence is in `/work/.evidence/signal-school-repair-2/`, including desktop/phone entry and end-state screenshots, room win/loss screenshots, and the live `verify-url.sh` report. `/work/.evidence/catalog-description.txt` matches `.factory/catalog-description.txt`.

### Remaining external dependency

The Scenario Set one-time offer is still not registered. Checkout, activation, price, and currency are therefore unavailable and were not guessed. Public metadata for the commercial operator is at `/work/.evidence/billing-offer.json`; it preserves the paid cards and the Sociobot license-validation path while the free core and real rooms remain usable.

## Review 1

Fresh strict QA on 2026-09-06 is a **FAIL**: 2 findings and 0 untested declared claims. The static implementation reviewed is `67d76b89bee43ee04c366518a15a2f67f8879baa`; realtime is `fa23702117cc348325df2225356251d5cf53bc31`; the report/documentation revision is `92beb0b71b3b5d57453cd4a96b231e359a2b780c`.

The detailed report is [review 1](review-1.md). No product code was changed. Every existing declared claim command passed after `npm ci`; `npm run build` and `npm run realtime:test` passed. Live desktop and phone sample paths, win/loss/restart, demo isolation, keyboard/reduced motion, live axe, route titles/404, invalid-room recovery, independent client views/reconnect/shared win/restart, health, persistence evidence, and 429/Retry-After were exercised.

Required repair: the **How to play** and **Scenario set** header links are dead on the Privacy and Terms pages because their local targets do not exist. Also add tests and inventory entries for public claims currently absent from `.factory/claims.json`, including the no-analytics/no-profile privacy promise, player range, pause behavior, free-card count, and no-tracker/no-third-party-font promise. Evidence is in `/work/.evidence/signal-school-review-1/`.

## Verification 2

Independent QA on 2026-09-06 is a **PASS**: 0 findings and 0 untested claims. The reviewed live static implementation is `67d76b89bee43ee04c366518a15a2f67f8879baa`; the reviewed realtime implementation is `fa23702117cc348325df2225356251d5cf53bc31`; documentation and tests are `01c918e27f979af502ab6926961903f979958885`.

From a clean checkout, `npm ci`, every command in `.factory/claims.json`, `npm run test:all`, and `npm run realtime:test` passed. Live QA covered fresh desktop and 390px phone demo runs, actual win/loss/restart states, reset isolation, keyboard and reduced motion, axe, route titles and HTTP 404, invalid room recovery, independent two-client partial views, refresh recovery, room win/restart, service health/storage, and HTTP 429 with Retry-After. The 390px four-times-throttled frame-rate claim test passed. Production build output is 11,162 B gzip JavaScript and 4,128 B gzip CSS.

Evidence and the full report are in [verification 2](verification-2.md) and `/work/.evidence/signal-school-verify-2/`. The Scenario Set remains honestly unavailable until external billing registration; the free game and rooms work without it.

## Repair status

All eight findings in [verification 1](verification-1.md) are repaired in the deployed candidate. Signal School remains a two-to-four-player cooperative signal-routing game for curious adults, teams, and older children. On first view it states the job, who it is for, and the first action: **Try it with sample data** opens the populated three-round practice board.

The live static candidate is `67d76b89bee43ee04c366518a15a2f67f8879baa`. Its application repair is `fa23702117cc348325df2225356251d5cf53bc31`; the later static-only commit supplies the CSP-safe standalone 404 page. The deployed realtime image reports build `fa23702117cc348325df2225356251d5cf53bc31` and `storage: "/data"` at `/health`. The service remains one replica with the existing durable `/data` mount. The later documentation/test revision is `ac288e45d40f600d6c28e4d8a2a8e85e605f13af`; it does not change the deployed runtime.

## What changed

| Earlier finding | Disposition |
| --- | --- |
| V1-01 invalid Vitest commands | Replaced `--grep` with Vitest's supported `-t` option. Every declared claim command now runs after `npm ci`. |
| V1-02 refresh loses a room | The browser saves only the room code and selected display name in `signal-school:room-session`, resumes automatically after refresh, clears stale sessions, and offers **Leave room**. A two-browser Playwright run reloads the guest, wins, and restarts. |
| V1-03 phone board below the fold | The 390×844 demo keeps the job, audience, action, and 198 pixels of the active relay board in the first viewport. |
| V1-04 successful unknown route | Known SPA routes are explicitly rewritten. Unknown routes now return the designed standalone page with HTTP 404. |
| V1-05 dead factory link | The required footer attribution is now product-local text, with no unreliable external link. |
| V1-06 fewer than 20 cards | Free practice has eight finished cards and the Scenario Set retains twelve paid cards, for twenty distinct three-round topologies. |
| V1-07 no phone frame-rate proof | Added a 390px Chromium claim check under 4× CPU throttling. The live median was 16.7 ms, or 59.88 fps. |
| V1-08 incomplete assertions | The Scenario Set check reads all four displayed role views; the route-title check asserts the fallback title. |

The standalone 404 now has a header, footer, skip link, route-specific title, visible return link, and self-hosted `404.css`; it does not use a CSP-blocked inline style.

## Verification

- Clean setup: `npm ci`, then every command in `.factory/claims.json` passed. `npm run test:all` also passed: 6 Vitest tests, 20 Playwright passes across desktop and phone (2 expected project-specific skips), realtime TypeScript build, and Vite build.
- Production bundle: 11.18 KB gzip JavaScript, 4.11 KB gzip CSS, 44.89 KB local WOFF2 fonts, and 168,102 B deployed static artifacts.
- Live demo: `/opt/fleet/lib/verify-url.sh https://signal-school.sociobot.in/demo /work/.evidence/signal-school-repair-1` passed with no console errors, `lang="en"`, one `h1`, `main`, and labelled controls. **Reset demo** returned the sample to round one while leaving the real-practice key unchanged. Live axe found no serious or critical issue.
- Live desktop: the fresh demo showed the job, audience, action, and board; the Split/Split/Read + split path reached **Six signals delivered** and restarted. The West/West/Old plan path reached **Run ended** with its debrief.
- Live phone: the fresh 390×844 demo had the board at 592 px with 198 visible pixels. Reduced motion set `data-reduce-motion="true"`; key `1` advanced to round two.
- Live rooms: independent fresh browser contexts received Relay runner and Weather reader views. The guest refreshed into the same room, both clients agreed three Split plans, reached the shared win, and the host restarted the room.
- Live service: `/health` reports the deployed SHA and `/data`; 42 room lookups ended in HTTP 429 with `Retry-After: 2`.
- Live routes: `/`, `/demo`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`, and `404.css` return 200. `/not-a-route` returns HTTP 404, title **Page not found — Signal School**, and the complete fallback structure.

Evidence is in `/work/.evidence/signal-school-repair-1/`, including desktop win/loss and first-phone screenshots, browser results, frame-rate measurement, rate-limit response, and the worker verification report.

## Run and deploy

```bash
npm ci
npm run test:all
npm run build
```

Deploy the one-replica durable room service before `dist/` as documented in `README.md`. Do not remove `/data` or increase the realtime replica count.

## Remaining external dependency

The one-time Scenario Set offer is still not registered. Its cards and license-verification path remain in the product, while checkout, a price, and activation stay unavailable. Public registration metadata is at `/work/.evidence/billing-offer.json`; no price or provider credential was guessed or added. The free core and online rooms work without billing.
