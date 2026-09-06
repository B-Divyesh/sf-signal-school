# Signal School verification 1

## Verdict: FAIL

Candidate reviewed: implementation `0078eab2f79ec9a295bce7edccfcb92dc9ac5689`; documentation/test revision `b889bd51ce77fbc38524a25351c0d3edd0b1c2b3`.

Live product: <https://signal-school.sociobot.in>  
Live room service: <https://signal-school-realtime.sociobot.in/health>

There are 8 findings and 6 untested/incompletely tested claims. This is not a product PASS.

## Findings

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| V1-01 | High | Four declared public-claim commands do not run from the documented clean setup. The inventory specifies `npm test -- --grep …`, but Vitest rejects `--grep` with `CACError: Unknown option --grep`. This leaves `three-round-ending`, `restart-reset`, `online-rooms`, and `room-rate-limit` untested by their declared commands. | After `npm ci`, each affected command failed before selecting a test. `npm run test:all` still passes because it runs all Vitest tests without the invalid option. |
| V1-02 | High | A player cannot recover an online room after a normal page refresh. The browser client keeps the room code only in memory, so it does not send the existing `resume` message after reload. This fails the promised reconnect-safe multiplayer path. | Live room `MVOFU1`: after the guest reloaded, the guest saw the join form (`guestAfterReloadHasJoinForm: true`), the room was not restored, and the host showed the guest as reconnecting. |
| V1-03 | Medium | On a fresh 390×844 phone `/demo` view, the game board is below the first viewport. The banner and landing copy consume the screen; only a sliver of the board is visible. The browser-game contract requires the game itself on the first screen. | [live-phone-first.png](/work/.evidence/signal-school-verify-1/live-phone-first.png) shows the first viewport. |
| V1-04 | Medium | An unknown live route returns HTTP 200, not a deliberate HTTP 404. The JavaScript fallback eventually renders a usable “Page not found” screen, but the response is still a successful navigation response. | `curl -I https://signal-school.sociobot.in/not-a-route` returned `HTTP/2 200`; browser UI rendered the expected fallback title and heading. |
| V1-05 | Medium | The footer’s required “Built by Param Factory” link is dead from the verification environment. | Both the link crawl and `curl -I https://paramfactory.com/` failed with `Could not resolve host: paramfactory.com`. All product-local links returned 200. |
| V1-06 | Medium | The game does not meet the game-content floor: it has 3 free topologies plus 12 Scenario Set cards (15 total), with no procedural generator. The games contract requires at least 20 levels or a procedural generator. The remaining cards are also unavailable until an unregistered offer exists. | `freeScenarioCount` is 3 and `premiumScenarioSet` contains 12 cards; the public Terms page correctly says checkout and activation are unavailable. |
| V1-07 | Medium | No 60-fps-on-a-mid-range-phone claim, measurement, or claim test is present. The game-loop contract requires this measurement and its handoff record. | `.factory/claims.json` has no frame-rate claim; the handoff records Lighthouse but no game frame-rate result. |
| V1-08 | Low | Two claim tests are incomplete for the wording they certify. `scenario-set-content` counts 12 cards but does not assert rotating role views. `route-titles` asserts Demo, Privacy, and Terms titles, but for the fallback route only asserts its heading—not its title. | `tests/browser.spec.ts`; live manual checks did confirm the fallback title, but the declared claim test does not. |

## Claim command results

| Claim IDs | Declared command | Result |
| --- | --- | --- |
| `three-round-ending`, `restart-reset`, `online-rooms`, `room-rate-limit` | `npm test -- --grep @claim:<id>` | Failed: Vitest rejects `--grep` (V1-01). |
| `scenario-set-content`, `demo-isolation`, `keyboard-routes`, `settings-persist`, `demo-no-external-requests`, `browser-end-screen`, `accessibility-basics`, `route-titles` | `npm run test:browser -- --grep @claim:<id>` | Passed for desktop and phone projects. The two scope gaps are V1-08. |

Untested/incomplete-claim count: **6** (the four commands in V1-01 plus the two incomplete claim assertions in V1-08).

## Passed checks and evidence

- Clean install: `npm ci && npm run test:all` passed: 5 Vitest tests, 16 Playwright desktop/phone tests, realtime TypeScript build, and Vite production build. Initial JS gzip is 10.46 KB; CSS gzip is 3.70 KB.
- Live `/demo` passed `/opt/fleet/lib/verify-url.sh`: 200, title, `lang="en"`, one `h1`, `main`, image-alternative check, labelled-button check, and no console errors. Output: `/work/.evidence/signal-school-verify-1/verify.json`.
- Fresh desktop and phone contexts both showed the job (“Route signals together before the storm”), audience sentence, sample action, persistent sample label, populated board, and practice teammates before interaction. Both used only `https://signal-school.sociobot.in` during the sample run, reached **Six signals delivered**, and restarted. Screenshots are in `/work/.evidence/signal-school-verify-1/`.
- A live deterministic loss path (West/West/West) rendered **Run ended**. Reduced-motion media set `data-reduce-motion="true"`. Live axe on the phone demo found zero serious or critical violations.
- Live Privacy, Terms, and fallback UI had the expected route-specific titles and headings. The fallback UI itself works; V1-04 concerns its HTTP status.
- Two independent live browser clients received Relay runner and Weather reader views, an invalid room code gave a clear recovery message, the clients agreed three Split plans, reached the shared win, and the host restarted the room. Live `/health` returned build `0078eab…` and `storage: "/data"`.
- The live room allowance returned `429` with `Retry-After: 10` after 42 requests.
- The earlier deployment-wrapper diagnostics recorded in the prior handoff are resolved in the current candidate: both live static app and room service are healthy. The separately documented unregistered billing offer remains honestly unavailable and is not a finding.

## Required follow-up

1. Replace the four Vitest claim commands with a supported exact test-name option and rerun every claim command after `npm ci`.
2. Persist room code/name client state or encode it in a safe reconnect URL, then automatically resume after refresh and cover it with independent browser clients.
3. Put the active sample board and route controls in the first phone viewport.
4. Make unknown routes return the designed HTTP 404 response, repair or replace the dead Param Factory footer URL, add sufficient accessible game content or a seeded generator, and measure/test 60 fps on the target phone.
5. Tighten V1-08’s claim tests so their asserted behavior exactly matches their public wording.
