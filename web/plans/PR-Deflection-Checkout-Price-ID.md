# Plan: Deflection Checkout Price ID

The portfolio Checkout route now supports restricted Stripe keys, but it still
builds the $1,500 line item with inline `price_data`. A minimally scoped
restricted key for Checkout Session creation should use an existing Stripe Price
instead of relying on inline price creation.

## Why this slice exists

- The production billing setup already has a Stripe Price ID for the deflection
  report.
- The route documentation says production should use `ATLAS_SAAS_STRIPE_RAK`,
  but inline `price_data` can require broader Stripe permissions than a
  checkout-only restricted key.
- This slice keeps the existing webhook metadata and paid-gate contract intact
  while aligning the portfolio route with the least-privilege key posture.

## Scope (this PR)

Slice phase: Production hardening

1. Add server-side Price ID selection for `createDeflectionCheckoutSession`.
2. Require a configured Price ID when using an `rk_` restricted key.
3. Preserve inline `price_data` only for the existing `sk_test_` local/preview
   fallback.
4. Add focused tests for the restricted-key Price path and fallback behavior.
5. Enroll the focused Checkout test in the existing pre-push CI workflow.

### Files touched

- `web/plans/PR-Deflection-Checkout-Price-ID.md` - this plan doc (new)
- `web/src/lib/deflection-checkout.ts` - Price ID selection and restricted-key
  fail-closed guard
- `web/scripts/test-deflection-checkout.mjs` - focused Checkout form regression
  test (new)
- `web/package.json` - adds the focused test script
- `.github/workflows/pre_push_audit.yml` - runs the focused Checkout test in CI
- `web/README.md` - documents the production Price ID env var

## Mechanism

`stripeConfig()` classifies the Stripe key source:

- `restricted`: `ATLAS_SAAS_STRIPE_RAK` is set and starts with `rk_`.
- `test_secret`: the preview/local fallback uses `sk_test_`.

Restricted-key Checkout requires `STRIPE_DEFLECTION_REPORT_PRICE_ID`, validated
as a Stripe `price_...` id. In that mode the Session form sends
`line_items[0][price]` and does not send inline `price_data`.

The `sk_test_` fallback can still use inline `price_data` when no Price ID is
configured, so existing local/preview validation remains easy. Full live
`sk_live_` keys remain rejected.

## Intentional

- No Stripe SDK dependency; the route already uses direct REST calls and the
  change only adjusts the form body.
- No Price read preflight; checkout-only restricted keys should not need Prices
  read permission. Stripe validates the configured Price during Session create.
- `STRIPE_DEFLECTION_REPORT_PRICE_ID` is optional for `sk_test_` fallback but
  required for `rk_` keys, because production least-privilege is the point of
  this slice.

## Deferred

- Provisioning the live restricted key and Price ID in Vercel remains an
  operator/deploy step. The README now names the required Price shape:
  active, `usd`, and `unit_amount >= 150000`.
- Live Stripe Checkout smoke with the restricted key remains deferred until the
  env values are present in the deployed project.

Parked hardening: none.

## Verification

- `npm run test:deflection-checkout`
- `npm run lint`
- `npm run build`
- `bash scripts/local_pr_review.sh --allow-dirty`

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| checkout lib | ~45 |
| focused checkout test + script entry | ~120 |
| CI test enrollment | ~3 |
| README docs | ~8 |
| this plan doc | ~80 |
| **Total** | ~256 |

Actual diff: 6 files, +283 / -13.
