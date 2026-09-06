# Signal School handoff

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
