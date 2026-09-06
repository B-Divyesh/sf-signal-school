# Signal School handoff

## Verification 1 (2026-09-06): FAIL

Independent QA reviewed runtime implementation `0078eab2f79ec9a295bce7edccfcb92dc9ac5689` and documentation/test revision `b889bd51ce77fbc38524a25351c0d3edd0b1c2b3`. The clean aggregate suite passes and live desktop/phone samples, shared win/restart, loss, accessibility baseline, health, and rate limit were exercised. The product is nevertheless **not accepted**: `.factory/verification-1.md` records 8 findings and 6 untested/incomplete claims. Key blockers are invalid declared Vitest claim commands and browser clients that cannot restore a room after refresh. No product code was changed by this verification.

Evidence is under `/work/.evidence/signal-school-verify-1/`; the factory QA result is `/work/.evidence/qa-result.json`.

## Shipped

Signal School is a finished three-round cooperative signal-routing game for two to four players. The first screen shows an active storm relay board, an immediate sample action, a labelled practice team, keyboard route controls, pause, reduced motion, win/loss, restart, legal routes, and an isolated `/demo` sandbox.

The product also has real online rooms at `wss://signal-school-realtime.sociobot.in/ws`. The owned `sf-signal-school-realtime` container assigns distinct role views, requires shared route agreement, restores a reconnect, persists room state, reaches win/loss, and lets the host restart. Its durable state is a SQLite snapshot at `/data/rooms.sqlite`; the active connection uses a local SQLite working copy and synchronously snapshots after each mutation because Azure Files does not support SQLite's shared locking reliably. The container is single revision / one replica, so one writer owns that snapshot.

The browser bundle locally bundles Chivo and IBM Plex Mono. Board, flags, weather marks, icons, and social card are original hand-authored assets. The visual plan and provenance are in `.factory/design.md`.

The free run has Tide Lines, Fog Junction, and Headland Loop. The built-in one-time Scenario Set contains twelve more cards and rotating role views. It remains present but cannot be bought or activated until billing registration.

## Verification

Implementation SHA deployed to both services: `0078eab2f79ec9a295bce7edccfcb92dc9ac5689`.

- Clean checkout: `npm ci && npm run test:all` passed. The final working tree also passed `npm run test:all`: five Vitest checks, sixteen desktop/phone Playwright checks, realtime compilation, and production build.
- Unit/integration: five current Vitest checks cover deterministic end/restart, Scenario Set content, independent room views, four-player bounds, shared win, reconnect, process-restart persistence, and rate limiting.
- Browser: Playwright checks desktop and 390px phone flows, demo isolation, keyboard controls, settings persistence, sample request privacy, end/restart, titles/404, Scenario Set rendering, and axe serious/critical findings.
- Static build: `npm run build` produces `dist/`; initial JS is 10.46 KB gzip, CSS 3.70 KB gzip, and first-use WOFF2 fonts total 44.89 KB. Total deployed artifacts were 161 KB.
- Live: `verify-url.sh https://signal-school.sociobot.in/demo` passed: title, `lang`, one `h1`, `main`, image alts, labelled buttons, and no console errors. Evidence is under `/work/.evidence/signal-school-live/`.
- Live browser: fresh desktop demo reached **Six signals delivered** and restarted. Fresh phone and desktop both showed the job, audience copy, sample action, and game before scrolling. Two independent live browser contexts received Relay runner/Weather reader views, agreed three Split plans, won, and restarted their room.
- Live service: `/health` returned build `0078eab…` and `/data` storage. A live allowance test returned HTTP 429 with `Retry-After: 36` after 45 requests.
- Lighthouse live mobile run: Performance 100, Accessibility 100, FCP 1.2 s, LCP 1.3 s, CLS 0. Evidence: `/work/.evidence/signal-school-live/lighthouse.json`.

## Deployment

- Static app: `https://signal-school.sociobot.in`
- Room service: `https://signal-school-realtime.sociobot.in/health`
- Room service image: `sociobotregistry.azurecr.io/sf-signal-school-realtime@sha256:231b7bd45b90cdb1f416c16eab0c9a3c50b38486531ff03422c4bdbfc5085e12`
- Durable share: `sf-signal-school-realtime-data` mounted at `/data`; one replica bound preserved.

Early container revisions were diagnostic failures caused first by the runtime image missing `package.json` for ESM, then by Azure Files SQLite lock behavior. They were deactivated. The current revision is healthy with zero restarts.

## Paid offer and known gap

There was no published or registered Signal School offer in the supplied history. The public metadata is written to `/work/.evidence/billing-offer.json` with `price_minor` and `currency` intentionally `null`; no price was guessed. `.factory/catalog-description.txt` is copied to `/work/.evidence/catalog-description.txt`.

Checkout, license activation, and a price are therefore unavailable. The future license path is implemented as `GET https://api.sociobot.in/api/v1/products/signal-school/verify?license=<token>` and the Terms page says this plainly. Registration is the remaining external operator dependency; do not claim purchase or activation works until it is registered and verified end to end.

## Next steps

1. Register the one-time `signal-school` Scenario Set offer with an actual price and currency, then run hosted checkout, redirect, license restore, and verification tests.
2. Run moderated group playtests against the brief's success measure; the product makes no validated-learning claim today.
3. Add room expiry or a host leave action if long-lived anonymous room records become a concern.
