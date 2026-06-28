## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses and fake local
adapters. The deflection checkout test still compiles `deflection-checkout.ts`
and the checkout route into temp CommonJS files while writing fake `@/lib/*`
modules for pricing, SEO, ATLAS authorization, checkout session creation,
rate limiting, and gap-report database lookup.

This slice migrates that coverage to Vitest so checkout behavior imports the
real `@/lib/deflection-checkout` helper, real checkout route, real ATLAS client,
real pricing helpers, and real runtime config helper.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the deflection checkout temp transpile harness with a Vitest test.
2. Preserve coverage for Stripe request shape, price/amount guards,
   environment-mode guards, partner-variant handling, route server-bound price
   enforcement, ATLAS authorization branches, and route invalid-request paths.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the deflection checkout test through Vitest.
- `web/plans/PR-Real-Adapter-Deflection-Checkout-Test.md` — plan for this
  slice.
- `web/scripts/test-deflection-checkout.mjs` — remove the temp transpile and
  fake local-module harness.
- `web/src/lib/deflection-checkout.test.ts` — add real-import checkout helper
  and route coverage.

## Mechanism

The new test imports `createDeflectionCheckoutSession` from
`@/lib/deflection-checkout` and imports the real checkout route `POST` handler
from `@/app/api/deflection-checkout/route`.

External boundaries stay mocked: `globalThis.fetch` returns queued ATLAS and
Stripe responses, and `@neondatabase/serverless` is mocked as an in-memory
Neon boundary for the route's saved price-variant lookup. Local route/helper
modules are not faked.

## Intentional

- No local product dependency is mocked. The checkout helper, checkout route,
  ATLAS client, pricing helpers, rate limiter, runtime config helper, and
  structured logger resolve through normal repo imports.
- Synthetic Stripe-looking test keys are constructed from parts so the diff
  does not introduce high-entropy-looking secret literals.
- Route expectations become behavioral: the real route calls ATLAS authorization
  and Stripe through the real helper chain, while Neon remains the external DB
  boundary.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-checkout # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-checkout\\.mjs|atlas-deflection-checkout-'\\)" web/package.json web/scripts web/src/lib/deflection-checkout.test.ts; then exit 1; else echo "No deflection checkout temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Deflection-Checkout-Test.md` | ~86 |
| `web/scripts/test-deflection-checkout.mjs` | ~760 |
| `web/src/lib/deflection-checkout.test.ts` | ~527 |
| Total | ~1375 |

This is over the 400-LOC soft cap because the old temp transpile harness is
large and coverage parity keeps checkout helper and route coverage together.
