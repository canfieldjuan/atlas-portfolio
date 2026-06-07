## Why this slice exists

Issue #194's prerequisite is now satisfied in ATLAS: the webhook amount gate
accepts an exact configured amount set instead of a single global floor. The
portfolio side also supports standard and partner Checkout variants, persists
the selected variant, stamps it into Stripe metadata, and displays the selected
variant label.

The remaining portfolio gap is that the variant amounts are still hardcoded in
two places: `deflection-pricing.ts` drives display/runtime copy, while
`deflection-checkout-requirements.js` repeats the standard and partner cents for
deploy preflight. That means a future price change is still a code edit and a
possible drift point. This slice makes the amounts configurable while preserving
the current `$1,500` standard and `$1,000` partner defaults.

This PR exceeds the 400 LOC soft cap because the shared catalog, the runtime
adoption, the preflight adoption, and the negative fixtures need to land
together. Splitting them would temporarily keep duplicate price amount sources
alive, which is the drift this slice closes.

## Scope (this PR)

Slice phase: Production hardening

1. Add a shared browser-safe price catalog module that parses the public
   standard/partner amount env vars and builds the existing price variants.
2. Make `deflection-pricing.ts` export variants from that shared catalog so
   landing/result display copy and checkout runtime use the configured amount.
3. Make the Checkout env preflight use the same amount parser before checking
   ATLAS's allowed amount set, so misconfigured public price envs fail closed.
4. Extend focused tests to prove configured amount success, invalid amount
   rejection, and allowed-amount mismatch detection for both runtime and
   preflight.

### Files touched

- `web/plans/PR-Deflection-Configurable-Price-Amounts.md` - plan for this slice.
- `web/src/lib/deflection-pricing-catalog.js` - shared amount parser and price
  variant catalog builder.
- `web/src/lib/deflection-pricing.ts` - typed exports backed by the shared
  catalog.
- `web/src/lib/deflection-checkout-requirements.js` - preflight/runtime config
  uses the shared configured amounts.
- `web/scripts/check-deflection-checkout-env.mjs` - usage text names the new
  amount env vars.
- `web/scripts/test-deflection-checkout.mjs` - runtime Checkout amount fixtures.
- `web/scripts/test-deflection-checkout-env.mjs` - preflight amount fixtures.
- `web/scripts/test-deflection-partner-access.mjs` - temp harness copy for the
  shared catalog dependency.

## Mechanism

The new catalog reads:

```text
NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS
NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_PARTNER_AMOUNT_CENTS
```

Both are optional. Missing values preserve today's defaults; present values must
be positive integer cents. The catalog returns the same `DeflectionPriceVariant`
shape the app already uses: id, metadata value, Stripe product name, amount
cents, amount dollars, and formatted price label.

`deflection-checkout-requirements.js` imports the catalog directly, so production
preflight checks the ATLAS allowed amount env against the same cents that
checkout/runtime display will use. If a configured amount is malformed, preflight
and runtime fail before creating a Stripe Session.

## Intentional

- The env vars are `NEXT_PUBLIC_*` because price amounts are not secret and the
  browser-rendered landing/results copy must use the same configured values as
  server Checkout logic.
- Missing amount envs intentionally fall back to the current public offers:
  standard `$1,500`, partner `$1,000`. This preserves deployed behavior until an
  operator explicitly configures a new amount and redeploys.
- This PR does not add a third price variant or a general A/B framework. It
  makes the existing standard/partner variants configurable and keeps the
  selection model from #229/#232.
- No `payment_method_types` is added to Stripe calls; Checkout keeps dynamic
  payment methods.

## Deferred

- Adding more variants than standard/partner remains a future #194 follow-up if
  product wants true multi-arm experimentation beyond the current partner offer.
- Live pricing smoke with changed env amounts is operational and depends on
  Vercel/ATLAS env updates; this PR only proves the local runtime/preflight
  behavior with fixtures.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-checkout-env` - PASS; printed
  `Deflection checkout env tests passed.` The fixture now also guards the
  browser-facing pricing module's literal `process.env.NEXT_PUBLIC_*` reads.
- `npm --prefix web run test:deflection-partner-access` - PASS; printed
  `Deflection partner access tests passed.`
- `npm --prefix web run test:deflection-checkout` - PASS; printed the expected
  fail-closed Stripe checkout diagnostic lines, including
  `configured price amount is invalid`, then
  `Deflection checkout tests passed.`
- `npm --prefix web run lint -- src/lib/deflection-pricing.ts src/lib/deflection-checkout-requirements.js src/lib/deflection-pricing-catalog.js scripts/check-deflection-checkout-env.mjs scripts/test-deflection-checkout.mjs scripts/test-deflection-checkout-env.mjs scripts/test-deflection-partner-access.mjs` - PASS; no ESLint diagnostics.
- `npm --prefix web run build` - PASS; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest.
- `bash scripts/local_pr_review.sh` - PASS; plan shape/files/diff-size, drift
  advisory, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Area | Actual |
| --- | ---: |
| Plan doc | +119 |
| Shared price catalog | +139 |
| Pricing/preflight/usage wiring | +106 / -47 |
| Focused tests | +182 / -1 |
| Total | ~594 changed |
