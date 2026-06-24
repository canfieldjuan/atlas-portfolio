# PR-Deflection-Checkout-Atlas-Authorized-Price

## Why this slice exists

Issue #194's standard price display now consumes ATLAS terms, but the checkout
runtime still has one stale local-price dependency: before it can use the
ATLAS-authorized standard `price_id` and amount, it asks the portfolio runtime
config to validate the local standard variant Price ID and amount. That keeps a
price-change footgun alive for the runbook/smoke slice: changing the standard
price in ATLAS could still require portfolio env churn before checkout reaches
the ATLAS authorization it already trusts.

This slice makes the standard checkout path follow the same source of truth as
display: ATLAS supplies the actual charge terms, and portfolio validates those
terms against the allowed amount set plus Stripe's returned Checkout Session.

## Scope (this PR)

Slice phase: Production hardening

1. Remove the standard checkout runtime dependency on local portfolio standard
   Price ID / standard amount validation before ATLAS authorization is applied.
2. Keep partner/local variant behavior unchanged; public partner checkout remains
   gated off until ATLAS has variant-aware authorization.
3. Keep the money safety checks that matter: ATLAS-authorized amount must be in
   the allowed amount set, and Stripe's returned Checkout Session amount/currency
   must match the ATLAS authorization exactly.
4. Update the checkout docs so the operator model is clear before the final
   runbook/smoke slice.

### Files touched

- `web/src/lib/deflection-checkout-requirements.js` -- let standard checkout
  runtime config avoid stale local standard Price ID / amount validation.
- `web/scripts/test-deflection-checkout.mjs` -- cover ATLAS-authorized standard
  amounts without local portfolio price config and preserve allowed-set failure.
- `web/README.md` -- clarify that ATLAS authorization supplies the standard
  charge Price ID and amount; local standard price env is legacy display/variant
  plumbing, not the standard checkout source of truth.
- `web/plans/PR-Deflection-Checkout-Atlas-Authorized-Price.md` -- this plan.

## Mechanism

`resolveDeflectionCheckoutRuntimeConfig()` still validates Stripe key mode,
account id, and the allowed amount list for every checkout. For the standard
variant, it no longer requires a locally configured portfolio Price ID or parses
the local standard amount before returning the Stripe runtime config. The
caller, `createDeflectionCheckoutSession()`, already receives the ATLAS checkout
authorization and enforces the money checks at the right boundary:

- the ATLAS-authorized amount must be present in the allowed amount set;
- Stripe's created Checkout Session `amount_total` must equal the ATLAS amount;
- Stripe's created Checkout Session `currency` must equal the ATLAS currency;
- the Stripe line item uses the ATLAS-authorized `price_id`.

Non-standard variants keep the existing local Price ID / variant-amount guard so
this does not accidentally make partner checkout public.

## Intentional

- This does not remove the legacy `NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS`
  catalog entry. It remains until the final runbook/smoke slice decides whether
  to retire or rename that env for remaining non-checkout tooling.
- This does not make partner checkout transact publicly. The route-level
  standard-only gate stays in place.
- The allowed amount set remains required because it is the portfolio-side
  mirror of the ATLAS webhook amount safety gate.

## Deferred

- Item 5 from #194: consolidated change-price runbook and the single full-chain
  smoke that proves ATLAS display terms, ATLAS authorization, Stripe Checkout
  amount, allowed amount set, and webhook unlock all agree.
- Optional cleanup of legacy standard price env naming once the smoke proves no
  standard buyer-facing or checkout path depends on it.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-checkout` — passed
  (`Deflection checkout tests passed.`).
- `npm --prefix web run test:deflection-checkout-env` — passed
  (`Deflection checkout env tests passed.`).
- `rg -n "NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS|STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD|STRIPE_DEFLECTION_REPORT_PRICE_ID=|selected variant amount is not allowed" web/src web/scripts web/README.md web/plans/PR-Deflection-Checkout-Atlas-Authorized-Price.md`
  — remaining hits are intentional legacy/preflight/test/docs references. The
  runtime `selected variant amount is not allowed` guard now applies only to
  non-standard variants; standard checkout is guarded by the ATLAS-authorized
  amount and Stripe Session validation.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed. Next emitted the existing edge-runtime
  static-generation warning while generating all 45 pages.
- `git diff --check` — passed.
- Pending before push: `bash scripts/local_pr_review.sh`.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/lib/deflection-checkout-requirements.js` | ~54 |
| `web/scripts/test-deflection-checkout.mjs` | ~28 |
| `web/README.md` | ~38 |
| `web/plans/PR-Deflection-Checkout-Atlas-Authorized-Price.md` | ~104 |
| **Total** | **~224** |
