# PR-Deflection-Partner-Checkout-Authorization

## Why this slice exists

Issue #194 still cannot be used to test different configured deflection prices
end to end. Portfolio already persists the server-bound `standard` or `partner`
price variant at intake and validates checkout requests against that saved
variant, and ATLAS now exposes variant-aware checkout authorization. The
remaining break is in portfolio's checkout start route: it still blocks every
non-standard variant and calls ATLAS authorization without naming the saved
variant.

This slice removes that last standard-only bridge so a saved partner report can
ask ATLAS for partner checkout terms and create the matching Stripe Checkout
Session. The root safety boundary stays server-bound: a buyer request can only
use the saved intake variant, and ATLAS binds the returned checkout terms to the
same report row before portfolio calls Stripe.

## Scope (this PR)

Slice phase: Vertical slice

1. Extend the ATLAS deflection checkout authorization client to accept
   `standard` or `partner` and send it as `price_variant` on the authorization
   request.
2. Remove the portfolio route's temporary non-standard 503 gate after the saved
   variant has been validated.
3. Pass the validated server-bound variant into ATLAS authorization and then into
   Stripe Checkout creation.
4. Keep fail-closed behavior for missing saved partner variants, mismatched
   requested variants, invalid variants, ATLAS 503s, and Stripe/session
   mismatch paths.
5. Regenerate the deflection contract artifacts against current ATLAS `main`
   after the Snapshot owner/action contract landed there, so CI's contract drift
   gate stays green on top of this pricing slice.

### Files touched

- `web/src/lib/atlas-deflection-client.ts`
- `web/src/app/api/deflection-checkout/route.ts`
- `web/scripts/test-deflection-checkout.mjs`
- `web/scripts/test-deflection-atlas-price-display.mjs`
- `web/scripts/test-deflection-intake-atlas-submit.mjs`
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs`
- `web/src/lib/deflection-snapshot-contract.ts`
- `web/src/lib/deflection-report-model-contract.ts`
- `web/src/lib/deflection-demo-example.ts`
- `web/plans/PR-Deflection-Partner-Checkout-Authorization.md`

## Mechanism

`authorizeDeflectionCheckout()` gains an optional price-variant argument. The
client validates the request id as before, checks the variant against the
supported `standard` / `partner` ids, and appends `?price_variant=<id>` to the ATLAS
checkout-authorization URL. Invalid local variants fail before any upstream call.

`/api/deflection-checkout` already resolves the request body's `priceVariant`
and compares it to the variant saved during intake. After that server-side check
passes, the route calls `authorizeDeflectionCheckout(requestId,
authorizedPriceVariantId)` with the server-resolved variant instead of
hard-failing non-standard variants. The returned ATLAS checkout terms remain the
only Stripe price source.

The checkout harness stubs the ATLAS client with a `(requestId, priceVariantId)`
signature and proves both default standard and saved partner requests reach
authorization and checkout with the expected variant.

The ATLAS client price-display harness also covers the authorization URL shape:
omitted variants keep the legacy URL, while explicit `standard` and `partner`
requests include the matching `price_variant` query parameter.

The generated deflection contract files are regenerated from current ATLAS
`main` using `npm --prefix web run generate:deflection-contracts -- --source
... --report-model-source ...`. Those changes are generated artifact alignment
only; this PR does not render the newly available Snapshot owner/action fields.
The ATLAS client parser validates and preserves those newly required Snapshot
fields while the intake harness continues to prove private source/evidence fields
are stripped from the public snapshot.
The Snapshot landing smoke now derives expected generated Snapshot field sets
from the generated contract constants, so future ATLAS contract regeneration
does not leave the smoke pinned to a stale hand-written field list.

## Intentional

- This does not make arbitrary A/B experiments public. It enables only the
  already-defined `standard` and `partner` variants.
- The route still rejects a partner request when no partner variant was saved
  for the report id. Query/body input remains advisory until it matches the
  server-bound intake record.
- Portfolio still creates Stripe Checkout Sessions with dynamic payment methods:
  no `payment_method_types` is added.

## Deferred

- Live hosted proof with real standard and partner request ids remains an
  operator run after the merged ATLAS authorization contract and hosted env are
  deployed together.
- Generic multi-arm/cohort price experiments remain deferred until the product
  chooses that paid-surface shape.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-checkout` — passed.
- `npm --prefix web run test:deflection-atlas-price-display` — passed.
- `npm --prefix web run test:deflection-report-model-result-page` — passed.
- `npm --prefix web run test:deflection-intake-atlas-submit` — passed.
- `npm --prefix web run generate:deflection-contracts -- --source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionSnapshot.ts --report-model-source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionReportModel.ts` — passed.
- `npm --prefix web run check:deflection-contracts -- --source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionSnapshot.ts --report-model-source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionReportModel.ts` — passed.
- `npm --prefix web run test:deflection-snapshot-contract-generator` — passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` — passed.
- `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts src/app/api/deflection-checkout/route.ts scripts/test-deflection-checkout.mjs scripts/test-deflection-atlas-price-display.mjs` — passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/lib/atlas-deflection-client.ts` | ~40 |
| `web/src/app/api/deflection-checkout/route.ts` | ~13 |
| `web/scripts/test-deflection-checkout.mjs` | ~35 |
| `web/scripts/test-deflection-atlas-price-display.mjs` | ~70 |
| `web/scripts/test-deflection-intake-atlas-submit.mjs` | ~12 |
| `web/scripts/test-deflection-snapshot-landing-smoke.mjs` | ~31 |
| `web/src/lib/deflection-snapshot-contract.ts` | ~10 |
| `web/src/lib/deflection-report-model-contract.ts` | ~4 |
| `web/src/lib/deflection-demo-example.ts` | ~4 |
| `web/plans/PR-Deflection-Partner-Checkout-Authorization.md` | ~130 |
| **Total** | ~349 |
