# PR-Deflection-Checkout-Atlas-Authorization

## Why this slice exists

#1386 calls out the paid-funnel boundary-disagreement class: the portfolio can
make independent price, currency, and report-existence decisions before Stripe
Checkout, while ATLAS later applies stricter unlock rules after money moves.
ATLAS PR #1393 added the backend authorization contract. This slice makes the
portfolio route consume that contract before creating Checkout.

The final diff is above the 400 LOC soft cap because the route, Checkout
creator, ATLAS client parser, and negative no-Stripe-call tests must move
together; splitting them would ship either a callable endpoint with no consumer
or a payment route without the boundary test coverage.

## Scope (this PR)

Slice phase: Production hardening

1. Add a server-only ATLAS checkout authorization client for
   `POST /content-ops/deflection-reports/{request_id}/checkout-authorization`.
2. Replace the checkout route's artifact probe with the authorization call so
   missing, paid, artifactless, or misconfigured reports fail before Stripe is
   called.
3. Build Stripe Checkout from ATLAS-returned `price_id`, `amount_cents`, and
   `currency`; keep local price variant only for route-bound metadata/return URL
   context.
4. Fail closed for non-standard/partner checkout until ATLAS authorization is
   variant-aware, preventing the partner funnel from charging standard terms.
5. Add ATLAS API base URL and service token to the checkout env preflight so
   deploy checks cover the runtime authorization dependency.
6. Keep Stripe restricted-key handling environment-safe: production requires
   `rk_live_`, while preview/local rejects copied live restricted keys before
   any Stripe call.
7. Distinguish saved-variant lookup failure from "no saved variant" so lookup
   drift fails closed before accepting default checkout terms.
8. Extend checkout tests to prove missing authorization blocks Stripe, ATLAS
   terms are used verbatim, and local price/currency config no longer decides
   the live line item.

### Files touched

- `web/plans/PR-Deflection-Checkout-Atlas-Authorization.md` — plan contract.
- `web/src/lib/atlas-deflection-client.ts` — add ATLAS authorization client.
- `web/src/lib/deflection-checkout.ts` — create Checkout from authorized terms.
- `web/src/app/api/deflection-checkout/route.ts` — call authorization before Stripe.
- `web/src/lib/deflection-checkout-requirements.js` — require ATLAS auth env in checkout preflight.
- `web/scripts/check-deflection-checkout-env.mjs` — document new preflight env requirements.
- `web/scripts/test-deflection-checkout.mjs` — source-level/unit assertions.
- `web/scripts/test-deflection-checkout-env.mjs` — preflight assertions.

## Mechanism

The route calls ATLAS with the current service credentials and `request_id`.
Authorization succeeds only when ATLAS says the report can be charged and
returns canonical checkout terms. The route then passes those terms to
`createDeflectionCheckoutSession`, which uses `line_items[0][price]` from
ATLAS' `price_id` and validates Stripe's returned `amount_total` and `currency`
against ATLAS' terms, not local portfolio price constants.

The existing local price variant remains useful for saved intake context,
partner route binding, success/cancel URL continuity, and metadata attribution.
It no longer controls the Stripe line item.

Until ATLAS exposes variant-aware authorization, the route rejects non-standard
checkout before calling ATLAS or Stripe. That is intentionally fail-closed: it
preserves the standard path while preventing a partner-priced report from being
charged standard terms.

Saved price-variant lookup failure is distinct from an absent saved variant.
The route returns 503 on lookup failure before ATLAS authorization or Stripe, so
database/read drift cannot silently fall back to standard checkout.

Stripe restricted-key handling mirrors the preflight contract at runtime:
`rk_live_` is accepted only in production, and preview/local deployments must use
test-mode restricted keys or the existing test-mode fallback.

## Intentional

- This PR does not add async-payment webhook fulfillment; that remains an ATLAS
  slice because Stripe events are handled there.
- This PR does not add `payment_method_types`; Stripe Checkout should keep
  dynamic payment methods.
- The checkout env preflight script may still report existing local price-id
  variables until a separate deploy-config cleanup slice removes obsolete env
  requirements. The runtime Checkout creation path stops using them.
- The partner funnel is gated rather than re-priced locally. Reintroducing
  partner checkout needs ATLAS to accept the server-bound variant and return
  matching partner terms.

## Deferred

- #1386 ATLAS slice: fulfill `checkout.session.async_payment_succeeded` and
  surface delayed-payment failures as paid-funnel incidents.
- #1386 variant-aware authorization slice: ATLAS accepts the server-bound
  variant and returns matching partner terms so the partner checkout path can be
  safely re-enabled.
- #1386 delivery slice: reconcile delivery URL and scheduler.
- Portfolio deploy-config cleanup: remove stale local price-id/amount env
  requirements once production has consumed the ATLAS authorization contract.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-checkout`
  - passed.
- `npm --prefix web run test:deflection-checkout-env`
  - passed.
- `npm --prefix web run lint`
  - passed.
- `npm --prefix web run build`
  - passed.
- Grep check for stale runtime checkout calls:
  - `rg "fetchDeflectionArtifact|line_items\\[0\\]\\[price_data\\]|STRIPE_DEFLECTION_REPORT_PRICE_ID|ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS|createDeflectionCheckoutSession\\(" -n web/src/lib/deflection-checkout.ts web/src/app/api/deflection-checkout/route.ts web/scripts/test-deflection-checkout.mjs web/src/lib/atlas-deflection-client.ts`
  - Remaining `fetchDeflectionArtifact` is the paid artifact client, not the
    checkout route; remaining local price/env strings are test fixtures proving
    stale portfolio config no longer controls runtime line items.
- `bash scripts/local_pr_review.sh`
  - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Checkout-Atlas-Authorization.md` | 134 |
| `web/src/lib/atlas-deflection-client.ts` | 107 |
| `web/src/lib/deflection-checkout.ts` | 100 |
| `web/src/app/api/deflection-checkout/route.ts` | 59 |
| `web/src/lib/deflection-checkout-requirements.js` | 24 |
| `web/scripts/check-deflection-checkout-env.mjs` | 4 |
| `web/scripts/test-deflection-checkout.mjs` | 261 |
| `web/scripts/test-deflection-checkout-env.mjs` | 31 |
| Total | 720 |
