# PR-Deflection-Variant-Price-Display

## Why this slice exists

Issue #194 can now authorize both `standard` and `partner` checkout variants
through ATLAS, but portfolio still displays partner pricing from the local
`NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_PARTNER_AMOUNT_CENTS` catalog value. That
recreates the stale-display class already fixed for the standard price: an
operator can configure a different partner test price in ATLAS, then show one
price while charging the ATLAS-authorized amount.

This slice fixes the root for the current `standard` / `partner` variants by
making buyer-facing variant display consume ATLAS public pricing terms instead
of a local amount when Atlas terms are available. Generic multi-arm experiment
routing remains deferred.

## Scope (this PR)

Slice phase: Vertical slice

1. Add variant-aware ATLAS pricing terms fetch/parsing for the supported
   `standard` and `partner` variants.
2. Add a browser-safe portfolio pricing route for
   `/api/deflection-pricing/{variant}` that returns only non-secret
   amount/currency/label data.
3. Generalize pricing-card hydration so partner cards can opt into the same
   ATLAS display source as standard cards.
4. Update partner result/unlock display to use the ATLAS partner terms and fail
   closed to `Price unavailable` when terms are unavailable.
5. Keep checkout creation unchanged: ATLAS checkout authorization remains the
   only source for the actual Stripe `price_id` and amount.

### Files touched

- `web/plans/PR-Deflection-Variant-Price-Display.md` -- this plan.
- `web/src/lib/atlas-deflection-client.ts` -- variant pricing terms client/parser.
- `web/src/lib/deflection-pricing.ts` -- variant display projection helper.
- `web/src/app/api/deflection-pricing/[priceVariant]/route.ts` -- browser-safe variant pricing proxy.
- `web/src/components/landing/LandingPrimitives.tsx` -- tier-level Atlas variant marker.
- `web/src/components/landing/DeflectionLandingPage.tsx` -- multi-variant pricing hydration.
- `web/src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx` -- partner full-report price opts into Atlas partner terms.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` -- locked result display fetches terms for the selected variant.
- `web/scripts/test-deflection-atlas-price-display.mjs` -- parser/helper coverage for standard and partner terms.
- `web/scripts/test-deflection-report-model-result-page.mjs` -- route source regression for variant display terms.

## Mechanism

`atlas-deflection-client.ts` keeps `fetchDeflectionStandardPricingTerms()` as a
compatibility wrapper, and adds `fetchDeflectionPricingTerms(variant)` for the
ATLAS `/pricing/{price_variant}` contract. The parser accepts only configured
terms for the requested supported variant and rejects unknown, malformed, or
unconfigured responses.

`deflection-pricing.ts` keeps the local catalog as the identity/default catalog,
but `withDeflectionPriceDisplayTerms()` can project either supported variant to
the ATLAS amount/currency label or to `Price unavailable`. Result pages use that
helper for the saved variant before rendering the locked checkout surface.

The landing component hydrates every pricing tier with an `atlasPriceVariant`
marker by calling `/api/deflection-pricing/{variant}` and leaving unavailable
labels in place when the proxy refuses terms. The partner funnel marks its
full-report tier as `atlasPriceVariant: "partner"`, so hosted partner tests show
the same amount ATLAS will authorize.

## Intentional

- This does not add arbitrary cohort routing or a generic price catalog. It
  covers the two variants the current product and ATLAS contract support.
- Public pricing routes expose only non-secret display terms. Stripe Price IDs
  remain available only through request-specific checkout authorization.
- Local partner amount env support remains in the catalog for fallback identity,
  tests, and non-hosted contexts, but buyer-facing partner display no longer
  trusts it when ATLAS terms are needed.

## Deferred

- Generic multi-arm/cohort A/B pricing beyond `standard` / `partner` remains
  deferred until the product chooses that paid-surface shape.
- Live hosted proof with real standard and partner request ids remains an
  operator run after this display slice deploys with the already-merged checkout
  authorization path.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-atlas-price-display` -- passed
  (`Deflection ATLAS price display tests passed.`).
- `npm --prefix web run test:deflection-report-model-result-page` -- passed
  (`Deflection report-model result page tests passed.`).
- `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts
  src/lib/deflection-pricing.ts
  src/app/api/deflection-pricing/[priceVariant]/route.ts
  src/components/landing/DeflectionLandingPage.tsx
  src/components/landing/LandingPrimitives.tsx
  src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx
  src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx
  scripts/test-deflection-atlas-price-display.mjs
  scripts/test-deflection-report-model-result-page.mjs` -- passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Variant-Price-Display.md` | ~103 |
| `web/src/lib/atlas-deflection-client.ts` | ~53 |
| `web/src/lib/deflection-pricing.ts` | ~30 |
| `web/src/app/api/deflection-pricing/[priceVariant]/route.ts` | ~47 |
| `web/src/components/landing/LandingPrimitives.tsx` | ~1 |
| `web/src/components/landing/DeflectionLandingPage.tsx` | ~75 |
| `web/src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx` | ~4 |
| `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` | ~9 |
| `web/scripts/test-deflection-atlas-price-display.mjs` | ~53 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | ~8 |
| **Total** | **~383** |
