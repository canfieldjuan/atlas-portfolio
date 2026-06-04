## Why this slice exists

Issue #194 now has a route-level price-variant boundary, but checkout still
loads one global `STRIPE_DEFLECTION_REPORT_PRICE_ID`. That keeps the next
variant coupled to the default Price ID and makes the selected variant less
meaningful than the route contract implies.

This slice makes Price ID lookup variant-aware for the existing `standard`
variant while preserving the current env as a legacy fallback. No second price
is introduced; this just removes the global-only Price ID assumption before a
future slice adds another variant.

## Scope (this PR)

Slice phase: Production hardening

1. Add a variant-specific Price ID env key to the default price catalog record:
   `STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD`.
2. Resolve the selected variant's Price ID from that key first, falling back to
   the current `STRIPE_DEFLECTION_REPORT_PRICE_ID` only for the standard variant.
3. Keep restricted-key checkout fail-closed when no Price ID is configured for
   the selected variant.
4. Extend the checkout env preflight to accept and validate the new standard
   Price ID env key, while preserving legacy production compatibility.
5. Extend focused checkout and env tests for precedence, legacy fallback,
   malformed variant-specific IDs, and preflight classification.
6. Update operator docs/runbook env examples to name the variant-specific key.

### Files touched

- `web/plans/PR-Deflection-Price-ID-Map.md`
- `web/src/lib/deflection-pricing.ts`
- `web/src/lib/deflection-checkout.ts`
- `web/scripts/check-deflection-checkout-env.mjs`
- `web/scripts/test-deflection-checkout.mjs`
- `web/scripts/test-deflection-checkout-env.mjs`
- `web/README.md`
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md`

## Mechanism

The default catalog record gains:

```ts
stripePriceIdEnvKey: 'STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD',
legacyStripePriceIdEnvKey: 'STRIPE_DEFLECTION_REPORT_PRICE_ID',
```

Checkout resolves the selected variant first, then resolves its Price ID:

```ts
configuredPriceIdForVariant(variant)
// standard-specific env wins
// legacy global env is accepted only as standard fallback
```

Restricted keys still require a Price ID. Legacy `sk_test_` fallback can keep
using inline `price_data` when no Price ID is present, exactly as before.

## Intentional

- No second variant is added. This is the variant-specific Price ID seam only.
- `STRIPE_DEFLECTION_REPORT_PRICE_ID` remains accepted for the standard variant
  so production does not need a same-PR env rename.
- No Stripe Price lookup is added. The route still trusts Stripe's created
  Checkout Session response for amount/currency validation.

## Deferred

- Issue #194 still owns adding a second configured variant, choosing variants by
  cohort/flag, and syncing displayed price with the selected variant.
- Cross-system env parity remains operational: when a future variant is added,
  the portfolio and ATLAS allowed-amount envs must be updated together.
- The parked web dependency audit finding in `HARDENING.md` was considered but
  remains unrelated because this slice does not change dependencies.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-checkout` - passed; printed the
  expected fail-closed Stripe checkout log lines, then
  `Deflection checkout tests passed.`
- `npm --prefix web run test:deflection-checkout-env` - passed; printed
  `Deflection checkout env tests passed.`
- `rg -n "STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD|STRIPE_DEFLECTION_REPORT_PRICE_ID" web/src web/scripts web/README.md web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md -S` - passed; matches are the catalog env keys, runtime/preflight lookup, focused tests, and docs.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - initially failed because this fresh worktree
  had no `web/node_modules`; Turbopack could not resolve `next/package.json`
  from `web/src/app`.
- `npm --prefix web ci` - passed; added 378 packages, audited 379 packages, and
  reported the existing 3 dependency audit findings already parked in
  `HARDENING.md`.
- `npm --prefix web run build` - passed after `npm ci`; compiled successfully,
  completed TypeScript, generated 44 static pages, and copied the deterministic
  routes manifest.
- `bash scripts/local_pr_review.sh` - passed; plan shape, files touched,
  diff-size drift, cross-session drift, ESLint, Next build, and
  `git diff --check` all passed.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Price-ID-Map.md` | +116 |
| `web/src/lib/deflection-pricing.ts` | +4 |
| `web/src/lib/deflection-checkout.ts` | +27 / -11 |
| `web/scripts/check-deflection-checkout-env.mjs` | +30 / -12 |
| `web/scripts/test-deflection-checkout.mjs` | +18 / -3 |
| `web/scripts/test-deflection-checkout-env.mjs` | +56 / -17 |
| `web/README.md` | +6 / -2 |
| `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` | +6 / -3 |
| Total | ~317 changed |
