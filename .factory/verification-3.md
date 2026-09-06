# Signal School verification 3

## Verdict: FAIL

Candidate reviewed: static implementation `a0c3d29f060f3ae43a3f58103a36cd84e4133a2d`; realtime implementation `fa23702117cc348325df2225356251d5cf53bc31`; documentation and handoff revision `ec45e98359cabdd49f58549f627516f628632b74`.

Live product: <https://signal-school.sociobot.in>  
Live room service: <https://signal-school-realtime.sociobot.in/health>

There is **1 finding** and **0 untested declared claims**. This is **not** a product PASS.

## Finding

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| V3-01 | Medium | The declared `demo-isolation` command is intermittent and therefore cannot reliably certify its public claim from a clean setup. On its first clean invocation, the desktop test failed at `expect(isolated.demo).not.toBe(isolated.real)`: both separately stored run JSON strings legitimately had the same value after one identical route. The assertion compares values, not storage namespaces or a divergent outcome. A fresh retry and a five-repeat run passed, confirming a flaky false negative rather than evidence that real data was changed. | First invocation: `npm run test:browser -- --grep @claim:demo-isolation` failed 1 desktop / passed 1 phone. Fresh retry passed 2/2; `--repeat-each=5` passed 10/10. The test is at `tests/browser.spec.ts:19-21`; the separate keys are `signal-school:run` and `demo:signal-school:run`. |

The live reset check still showed the intended user outcome: the persistent demo banner was present, Reset demo returned the demo to Round 1, and the real-practice namespace was not used by the demo. This is not a product-data-loss finding. It is a release-quality and claim-proof finding: the required declared command did fail from the clean setup and must be made deterministic before acceptance.

## What passed

- Clean prerequisites: `npm ci` completed with no reported vulnerabilities. `npm test` passed 7 tests; `npm run realtime:test` passed 2 SQLite/WebSocket integration tests; `npm run realtime:build` and `npm run build` passed. The built browser assets are 11.14 KB gzip JavaScript and 4.14 KB gzip CSS; self-hosted WOFF2 fonts total 44.89 KB.
- The complete browser suite passed after the individual claim run: 34 passed, 2 expected project-specific skips. The phone-only frame-rate test passed and the desktop instance was its expected skip.
- Every declared command other than the intermittent first `demo-isolation` invocation passed individually. The retry of that same command also passed. No declared claim is missing a test, and no declared claim is counted as untested.
- Live desktop `/demo` stated the job, audience, and first action before scrolling: **Route signals together before the storm**; the sentence for small groups discussing queues, bottlenecks, redundancy, and feedback; and **Try it with sample data — Opens a three-round practice run.** The game board, route controls, labelled practice teammates, and persistent **Demo — sample data, nothing is saved** banner were already populated.
- On live desktop, Split / Split / Read + split reached **Six signals delivered** with the one-sentence queue debrief; restart returned to Round 1. West / West / Old plan reached **Run ended** with the loss debrief. Evidence: `live-desktop-entry.png`, `live-desktop-win.png`, and `live-desktop-loss.png`.
- On live 390x844 phone `/demo`, the board began at 610.09px and 198px remained in the first viewport. Emulated reduced motion set `data-reduce-motion="true"`; key `1` advanced to Round 2. Evidence: `live-phone-entry.png`.
- Live automated axe found no serious or critical violation and no browser console errors. `verify-url.sh` passed for `/demo` (HTTP 200, title, `lang`, one h1, main landmark, image alternatives, and labelled buttons). The sample run made no cross-origin request during the inspected flow.
- Live Privacy and Terms header links reached `/#how-to-play` (**How a run works**) and `/#scenario-set` (**Twelve more topologies**) from both pages. `/`, `/demo`, `/privacy`, `/terms`, `robots.txt`, and `sitemap.xml` returned 200. `/not-a-route` returned the designed page with deliberate HTTP 404 and title **Page not found — Signal School**.
- Two independent live clients created a room. The host received Relay runner information and the guest Weather reader information; the guest refreshed into the same role and partial view. A shared Split run reached **Six signals delivered**; a separate shared Direct run reached **Shared run ended**; host restart returned the guest to the waiting lobby. Evidence: `live-room-win.png` and `live-room-loss.png`.
- An invalid live room code announced the recovery message, `/health` returned `ok`, build `fa237021…`, and `storage: "/data"`; 42 live room lookups produced HTTP 429 with `Retry-After: 43`. Local integration tests prove SQLite room state survives a service stop/reopen.
- The Scenario Set is honestly unavailable: all twelve built-in cards remain visible, with no price, checkout, or activation path. The conditional future offer is not treated as a current purchasable feature.

## Declared claim commands

| Claim ID | Result |
| --- | --- |
| `three-round-ending` | Pass |
| `restart-reset` | Pass |
| `scenario-set-content` | Pass |
| `demo-isolation` | **Intermittent failure; finding V3-01.** Fresh retry passed. |
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
| `phone-frame-rate` | Pass |
| `online-rooms` | Pass |
| `two-to-four-players` | Pass |
| `room-persistence` | Pass |
| `scenario-set-unavailable` | Pass |
| `leave-room` | Pass |
| `room-rate-limit` | Pass |

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| V1-01 invalid claim-command syntax | Resolved: current inventory uses supported Vitest `-t`; the affected commands pass. |
| V1-02 room refresh recovery | Resolved: independent live guest refresh restored its room and Weather reader view. |
| V1-03 phone board below first view | Resolved: 198px of the active board was visible at 390x844. |
| V1-04 unknown route returned 200 | Resolved: live unknown route is the designed HTTP 404. |
| V1-05 dead factory footer link | Resolved: footer attribution is local text, with no dead external destination. |
| V1-06 fewer than 20 cards | Resolved: eight free plus twelve Scenario Set cards pass the inventory test. |
| V1-07 no phone frame-rate proof | Resolved: declared four-times-throttled phone frame-rate check passes. |
| V1-08 incomplete scenario/title assertions | Resolved: current tests assert four role views and the fallback title. |
| Review-1 dead legal header anchors | Resolved: live Privacy and Terms anchors reach both named landing sections. |
| Review-1 missing claim inventory coverage | Resolved in inventory breadth; V3-01 is a new reliability defect in one of those commands. |

## Evidence

Evidence directory: `/work/.evidence/signal-school-verify-3/`. It contains the URL verifier result and desktop, phone, and shared-room end-state screenshots. The required top-level copy is `/work/.evidence/qa-report.md`.
