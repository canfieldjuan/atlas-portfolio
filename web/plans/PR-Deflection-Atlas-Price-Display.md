# PR-Deflection-Atlas-Price-Display

## Why this slice exists

Issue #194's first ATLAS slice is merged, so portfolio can stop showing the
standard full-audit price from a browser-facing `NEXT_PUBLIC` amount that can
drift from the ATLAS checkout authorization. This slice is the portfolio item 3
follow-up: paid display surfaces should use ATLAS standard pricing terms when
available and show a safe unavailable state when ATLAS refuses the terms.

## Scope (this PR)

Slice phase: Vertical slice

1. Add a portfolio server client for ATLAS
   `GET /api/v1/content-ops/deflection-reports/pricing/standard` and parse only
   the non-secret `{ variant, status, amount_cents, currency }` contract.
2. Add a safe standard display-price projection: ATLAS terms produce the
   standard amount label, while non-200/malformed/unconfigured responses produce
   `Price unavailable` instead of falling back to a stale local amount.
3. Update standard deflection pricing display on the public landing pricing
   cards, locked/paid result surfaces, and locked Snapshot PDF preview copy to
   consume that projection.
4. Keep checkout creation and Stripe `price_id` lookup unchanged; checkout still
   uses ATLAS request-specific authorization for the actual charge.
5. Add focused tests for the ATLAS terms parser/fail-closed result and update
   existing partner/PDF coverage so the retired local display fallback cannot
   leak back in.

### Files touched

- `.github/workflows/pre_push_audit.yml` -- enroll the focused pricing display
  test in CI.
- `web/src/lib/atlas-deflection-client.ts` -- fetch and parse ATLAS standard
  pricing terms.
- `web/src/lib/deflection-pricing.ts` -- standard display projection helpers and
  unavailable label.
- `web/src/app/api/deflection-pricing/standard/route.ts` -- browser-safe proxy
  for the non-secret display terms.
- `web/src/components/landing/DeflectionLandingPage.tsx` -- hydrate landing
  standard price cards from the proxy or keep the unavailable state.
- `web/src/components/landing/DeflectionResultsPage.tsx` -- disable checkout
  when trusted standard price display is unavailable.
- `web/src/components/landing/LandingPrimitives.tsx` -- mark which pricing cards
  are ATLAS standard-price sourced.
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` -- remove
  stale standard default price labels from the static pricing config.
- `web/src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx`
  -- keep partner-access pricing from being overwritten by standard-price
  hydration.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx`
  -- fetch display terms for result/unlock surfaces.
- `web/src/lib/deflection-snapshot-pdf.ts` -- use the safe unavailable label for
  locked preview pricing when no trusted terms are attached.
- `web/scripts/test-deflection-partner-access.mjs` -- assert partner access does
  not reintroduce the stale public standard-price fallback.
- `web/scripts/test-deflection-snapshot-pdf-email.mjs` -- update locked preview
  assertions for the fail-closed unavailable label.
- `web/scripts/test-deflection-atlas-price-display.mjs` -- focused parser and
  display fallback tests.
- `web/package.json` -- add the focused test script.
- `web/plans/PR-Deflection-Atlas-Price-Display.md` -- this plan.

## Mechanism

The ATLAS client gains a `fetchDeflectionStandardPricingTerms()` server-only
function that uses the same base URL/token config as the other deflection calls,
requests `/api/v1/content-ops/deflection-reports/pricing/standard`, and returns
`ok:false` on 503, non-200, malformed payloads, or missing config.

`deflection-pricing.ts` remains the catalog of variant identities, but display
code can now derive a standard variant from ATLAS terms. When terms are
unavailable, the helper returns a standard variant with `priceLabel: "Price
unavailable"` so UI can render safely without lying. The browser never receives
the ATLAS token: the public landing page reads an internal portfolio API route
that proxies only the non-secret amount/currency payload.

Landing pricing cards opt into ATLAS hydration with a tier-level
`standardPriceSource: "atlas"` flag so partner-specific prices can remain
explicit. Results pages fetch the same terms server-side before rendering the
unlock view; when the terms are unavailable, checkout is disabled rather than
showing a stale amount.

## Intentional

- Partner pricing remains local/configured. ATLAS still has only standard
  authorization, so this slice does not make partner checkout public.
- The old standard amount env may remain in checkout/preflight code until the
  runbook/smoke slice retires it from operational checks. This slice removes it
  as the standard display source on buyer-facing surfaces.
- The unavailable state is deliberately plain. A missing or invalid ATLAS price
  is a pricing safety condition, not a marketing moment.

## Deferred

- Item 5 from #194: consolidated change-price runbook and full-chain smoke.
- Optional ATLAS boot-time guard for price config. Runtime fail-closed behavior
  is already in place after ATLAS #1816.
- Partner or arbitrary variant-aware ATLAS authorization.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-atlas-price-display` — passed
  (`Deflection ATLAS price display tests passed.`).
- `npm --prefix web run test:deflection-report-model-result-page` — passed
  (`Deflection report-model result page tests passed.`).
- `npm --prefix web run test:deflection-snapshot-pdf-email` — passed
  (`Resolution Audit Snapshot PDF email tests passed.`).
- `npm --prefix web run test:deflection-partner-access` — passed
  (`Deflection partner access tests passed.`).
- `npm --prefix web run test:deflection-checkout-env` — passed
  (`Deflection checkout env tests passed.`).
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 32 `test:*`
  scripts are enrolled in `.github/workflows/pre_push_audit.yml`.
- `npm --prefix web run check:dead-code` — passed; Knip baseline matches 16
  known findings.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` — passed
  (`Deflection Snapshot landing smoke tests passed.`).
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed. Next emitted the existing edge-runtime
  static-generation warning while generating all 45 pages.
- `git diff --check` — passed.
- `rg -n "NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS|DEFLECTION_DEFAULT_PRICE_VARIANT\\.priceLabel|DEFLECTION_FULL_REPORT_PRICE_LABEL|\\$1,500" web/src web/scripts .github web/plans/PR-Deflection-Atlas-Price-Display.md`
  — confirmed the old `$1,500` display string is gone. Remaining
  `NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS` hits are confined
  to checkout/preflight plumbing and checkout tests. The
  `DEFLECTION_DEFAULT_PRICE_VARIANT.priceLabel` hit is a negative regression
  assertion in `web/scripts/test-deflection-partner-access.mjs`.

## Estimated diff size

| File | LOC |
|---|---:|
| `.github/workflows/pre_push_audit.yml` | ~3 |
| `web/src/lib/atlas-deflection-client.ts` | ~70 |
| `web/src/lib/deflection-pricing.ts` | ~45 |
| `web/src/app/api/deflection-pricing/standard/route.ts` | ~31 |
| `web/src/components/landing/DeflectionLandingPage.tsx` | ~45 |
| `web/src/components/landing/DeflectionResultsPage.tsx` | ~15 |
| `web/src/components/landing/LandingPrimitives.tsx` | ~3 |
| `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` | ~10 |
| `web/src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx` | ~5 |
| `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` | ~25 |
| `web/src/lib/deflection-snapshot-pdf.ts` | ~4 |
| `web/scripts/test-deflection-partner-access.mjs` | ~12 |
| `web/scripts/test-deflection-snapshot-pdf-email.mjs` | ~4 |
| `web/scripts/test-deflection-atlas-price-display.mjs` | ~193 |
| `web/package.json` | ~1 |
| `web/plans/PR-Deflection-Atlas-Price-Display.md` | ~156 |
| **Total** | **~614** |

This is above the 400 LOC soft cap because the buyer-facing display path needs
one server parser, one browser-safe proxy, landing/results/PDF wiring, and
CI-enrolled tests to avoid reintroducing a stale price source.
