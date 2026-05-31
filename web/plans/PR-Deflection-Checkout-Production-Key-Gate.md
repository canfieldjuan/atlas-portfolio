# Plan: Deflection Checkout Production Key Gate

The Checkout route now prefers a restricted Stripe key and configured Price ID,
but the test-secret fallback is still available anywhere the environment has
`ATLAS_SAAS_STRIPE_SECRET_KEY`. That is useful for local/preview verification,
but production buyer traffic should fail closed unless the restricted key is
actually provisioned.

## Why this slice exists

- PR-Deflection-Checkout-Price-ID aligned restricted-key Checkout with a
  configured Stripe Price, but deliberately kept the existing `sk_test_`
  fallback for local/preview.
- A live production deployment can still have old test-key env values while the
  restricted key is being provisioned.
- In production, creating test-mode Checkout Sessions for buyers is worse than a
  clear `503` because it can look like payment worked while the live unlock path
  cannot complete.

## Scope (this PR)

Slice phase: Production hardening

1. Reject the `sk_test_` fallback when `VERCEL_ENV=production`.
2. Preserve `sk_test_` fallback for local and Vercel preview deployments.
3. Add focused regression coverage for production rejection and preview fallback.

### Files touched

- `web/plans/PR-Deflection-Checkout-Production-Key-Gate.md` - this plan doc
  (new)
- `web/src/lib/deflection-checkout.ts` - production fallback guard
- `web/scripts/test-deflection-checkout.mjs` - focused guard coverage
- `web/README.md` - production key posture note

## Mechanism

`stripeConfig()` already chooses `ATLAS_SAAS_STRIPE_RAK` first. This slice only
changes the fallback branch: when no restricted key is present and
`VERCEL_ENV=production`, `stripeConfig()` returns `null` before accepting
`ATLAS_SAAS_STRIPE_SECRET_KEY`.

That means the public Checkout route returns its existing generic `503` instead
of creating a test-mode Stripe session on the live site. Preview/local
deployments keep the `sk_test_` path for verification.

## Intentional

- Use `VERCEL_ENV`, not `NODE_ENV`, because Next production builds also run with
  `NODE_ENV=production` in local/preview contexts where the test fallback is
  useful.
- No change to `rk_` handling: production works once the restricted key and
  Price ID are configured.
- No user-facing copy change in the route; the existing generic Checkout failure
  copy remains the fail-closed behavior.

## Deferred

- Live restricted-key smoke remains deferred until `ATLAS_SAAS_STRIPE_RAK` and
  `STRIPE_DEFLECTION_REPORT_PRICE_ID` are present in the deployed project.

Parked hardening: none.

## Verification

- `npm run test:deflection-checkout`
- `npm run lint`
- `npm run build`
- `bash scripts/local_pr_review.sh --allow-dirty`

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| checkout lib | ~8 |
| checkout test | ~20 |
| README docs | ~3 |
| this plan doc | ~80 |
| **Total** | ~111 |

Actual diff: 4 files, +101 / -0.
