# Plan: Deflection Checkout Endpoint Rate Limit

Adds a narrow app-side throttle to the public deflection paid-flow endpoints.
The paid flow is now live enough that a known report id can amplify browser
requests into ATLAS artifact probes, and the Checkout route can also create many
Stripe Checkout Sessions by varying `attemptId`.

## Why this slice exists

- The #160/#161 reviews parked public endpoint amplification as acceptable for
  the initial go-live path because report ids are unguessable.
- After #161, the customer-facing payment/result path is live and the next
  hardening step is reducing accidental or low-effort repeated calls against
  `/api/deflection-checkout` and `/api/deflection-report-status`.
- This does not replace edge enforcement, but gives the app a conservative
  fail-closed guard before calling ATLAS or Stripe.

## Scope (this PR)

Slice phase: Production hardening

1. Add a small server-only in-memory rate-limit helper for deflection endpoints.
2. Apply a stricter bucket to `POST /api/deflection-checkout`.
3. Apply a looser bucket to `GET /api/deflection-report-status`, sized so the
   #161 success-return poll can complete without tripping itself.

### Files touched

- `web/plans/PR-Deflection-Endpoint-Rate-Limit.md` - this plan doc (new)
- `web/src/lib/deflection-rate-limit.ts` - shared server-side throttle helper
  (new)
- `web/scripts/test-deflection-rate-limit.mjs` - focused helper regression test
  (new)
- `web/package.json` - adds the focused test script
- `web/src/app/api/deflection-checkout/route.ts` - checkout throttle before
  ATLAS/Stripe calls
- `web/src/app/api/deflection-report-status/route.ts` - status throttle before
  ATLAS calls

## Mechanism

The helper stores per-process counters on `globalThis`, keyed by route scope,
client identifier, and request id. It reads the client identifier from common
Vercel/proxy headers and falls back to `unknown` if no address is available.

Buckets:

- Checkout creation: `5` attempts per `10` minutes for a given
  `ip + requestId`.
- Status polling: `40` attempts per `60` seconds for a given `ip + requestId`.

On limit hit, the routes return `429` with generic copy and do not call ATLAS or
Stripe.

## Intentional

- In-memory is best-effort on serverless: it limits repeated calls on a warm
  instance but is not a global distributed quota. That is still useful as a
  cheap guard and does not add paid infrastructure or a new dependency.
- Status polling gets a higher limit because the UI legitimately makes up to 10
  calls during the success-return finalization window.
- The limit key includes `requestId`; this avoids one report's finalization poll
  blocking another report from the same office/network.

## Deferred

- Global edge/KV rate limiting remains the stronger go-live posture. The intake
  flow uses Vercel WAF for this class of protection; the same can be added for
  `/api/deflection-checkout` and `/api/deflection-report-status` when the live
  billing key is provisioned.

Parked hardening: none.

## Verification

- `npm run lint`
- `npm run test:deflection-rate-limit`
- `npm run build`
- `bash scripts/local_pr_review.sh --allow-dirty`
- Grep old parked wording / route names to confirm both public deflection paid
  endpoints are covered by the helper.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| rate-limit helper | ~60 |
| focused helper test + script entry | ~85 |
| checkout route hook | ~15 |
| status route hook | ~15 |
| this plan doc | ~85 |
| **Total** | ~260 |

Actual diff: 6 files, +278 / -0.
