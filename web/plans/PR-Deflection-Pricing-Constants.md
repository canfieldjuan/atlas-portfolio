# PR-Deflection-Pricing-Constants

## Why this slice exists

PR #211 shipped the snapshot landing cost-proof band and received an LGTM with
one non-blocking drift note: the deflection assisted-contact benchmark and
full-report price now appear in multiple active UI files. The current values are
still correct, but future edits could update one surface and miss another.

This slice centralizes the public deflection pricing and benchmark numbers
without changing the offer: assisted contact remains `$13.50`, self-service
remains `$1.84`, the public full report remains `$1,500`, and the Stripe
fallback checkout amount remains `150000` cents.

## Scope (this PR)

Slice phase: Production hardening

1. Add a dependency-free deflection pricing module safe for client and server
   imports.
2. Replace active deflection UI price/benchmark literals with shared constants
   or labels.
3. Reuse the same cents constant in the existing Stripe Checkout fallback path.
4. Preserve all pricing values, route destinations, checkout mode, Stripe
   parameters, and public copy meaning.

### Files touched

- `web/plans/PR-Deflection-Pricing-Constants.md`
- `web/src/lib/deflection-pricing.ts`
- `web/src/lib/deflection-checkout.ts`
- `web/scripts/test-deflection-checkout.mjs`
- `web/src/components/landing/DeflectionResultsPage.tsx`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx`
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx`
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx`
- `web/src/app/systems/ai-content-ops/page.tsx`

## Mechanism

The new module exports raw numeric values and formatted labels:

```ts
export const DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD = 13.5;
export const DEFLECTION_SELF_SERVICE_BENCHMARK_USD = 1.84;
export const DEFLECTION_FULL_REPORT_PRICE_USD = 1500;
export const DEFLECTION_FULL_REPORT_PRICE_CENTS =
  DEFLECTION_FULL_REPORT_PRICE_USD * 100;
```

Client UI imports labels for display copy and numeric constants for math. The
checkout module imports only the cents constant for its existing inline
`price_data` fallback. This keeps Stripe Checkout Sessions and restricted-key
behavior unchanged while removing the duplicate source literal.

## Intentional

- No price, discount, partner-price, or experiment behavior changes.
- No Stripe API shape changes. This keeps Checkout Sessions, dynamic payment
  methods, restricted-key handling, price-id preference, metadata, and
  idempotency exactly as-is.
- Existing historical plan docs, unrelated audit pricing, and unrelated
  calculator defaults are not rewritten.
- The public `$1,500` price remains distinct from the partner `$1,000` offer and
  from broader Content Ops Audit pricing.

## Deferred

- Issue #194's larger pricing/A-B system remains out of scope. This slice only
  removes duplicate literals from the current public deflection surfaces.
- A dedicated partner-pricing constant can be added when the partner page is
  actively changed.
- Parked hardening: none.

## Verification

Ran before push:

- `npm --prefix web run test:deflection-checkout` - passed
- `npm --prefix web run test:deflection-teaser-rank-copy` - passed
- `node web/scripts/test-deflection-hosted-results-smoke.mjs` - passed
- `node web/scripts/test-deflection-browser-upload-smoke.mjs` - passed
- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed
- Dev-server browser check at `http://127.0.0.1:3100/systems/support-ticket-deflection/snapshot` with `agent-browser` at 1440x1000 - passed; page had content, no Next.js error overlay, no horizontal overflow, and rendered `$13.50` plus `$1,500`
- `rg -n "\\$13\\.50|13\\.5|\\$1,500|150000|150_000" web/src/app/systems/support-ticket-deflection web/src/app/systems/ai-content-ops/page.tsx web/src/components/landing/DeflectionResultsPage.tsx web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/src/components/deflection-demo/SupportTaxCalculator.tsx web/src/lib/deflection-checkout.ts -S` - active UI display literals removed; only the checkout contract-floor comment still contains raw `150000`
- `rg -n "DEFLECTION_FULL_REPORT_PRICE|DEFLECTION_ASSISTED_CONTACT|DEFLECTION_SELF_SERVICE|DEFLECTION_SNAPSHOT_FULL_REPORT" web/src/app/systems/support-ticket-deflection web/src/app/systems/ai-content-ops/page.tsx web/src/components/landing/DeflectionResultsPage.tsx web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/src/components/deflection-demo/SupportTaxCalculator.tsx web/src/lib/deflection-checkout.ts web/src/lib/deflection-pricing.ts -S` - active surfaces import or define shared constants
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~100 |
| Pricing constants module | ~40 |
| UI imports/replacements | ~80 |
| Checkout/test import update | ~20 |
| **Total** | **~240** |
