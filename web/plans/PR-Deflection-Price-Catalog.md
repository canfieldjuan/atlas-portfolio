## Why this slice exists

Issue #194's money-safety order is now satisfied: ATLAS accepts only configured
deflection amounts, and the portfolio redirects only when Stripe returns an
allowed amount/currency. The next portfolio gap is price drift. The checkout
fallback, unlock button, and pricing cards still read loosely coupled constants
instead of a named price variant that can later be selected, stamped into Stripe
metadata, and displayed consistently.

This slice introduces the default price variant as the single current catalog
record while preserving today's $1,500 behavior. It is the safe base for later
A/B routing because there is still only one active variant.

## Scope (this PR)

Slice phase: Production hardening

1. Add a default deflection price variant record in `deflection-pricing.ts`
   containing id, label, amount, metadata value, and Stripe product name.
2. Keep the existing exported price constants as aliases so current call sites
   stay compatible.
3. Use the default variant in checkout fallback amount, product name, and Stripe
   metadata.
4. Move the active public unlock/pricing display surfaces to read the default
   variant label.
5. Extend the focused checkout test to prove the variant metadata and fallback
   product name are sent.

### Files touched

- `web/plans/PR-Deflection-Price-Catalog.md`
- `web/src/lib/deflection-pricing.ts`
- `web/src/lib/deflection-checkout.ts`
- `web/src/app/api/deflection-checkout/route.ts`
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx`
- `web/src/components/landing/DeflectionResultsPage.tsx`
- `web/scripts/test-deflection-checkout.mjs`

## Mechanism

`DEFLECTION_DEFAULT_PRICE_VARIANT` becomes the catalog source for the current
paid report offer:

```ts
{
  id: 'standard',
  amountCents: 150000,
  priceLabel: '$1,500',
  metadataValue: 'standard',
}
```

Checkout still creates the same one-time Checkout Session. It now derives the
inline fallback amount and product name from that record and adds
`metadata[price_variant]` plus `metadata[price_amount_cents]` for attribution.
The existing `source/account_id/request_id` metadata and amount allowlist guard
remain unchanged.

## Intentional

- No second price, cohort routing, query-param variant, or feature flag is added
  here. This is the default catalog foundation only.
- `DEFLECTION_FULL_REPORT_PRICE_*` exports remain available as compatibility
  aliases to avoid broad churn in non-price-selection call sites.
- The partner page's hardcoded `$1,000` design-partner offer remains out of
  scope. It is a noindex URL-specific offer documented by D-025, not the public
  default checkout variant.

## Deferred

- Issue #194 still owns selecting a variant in `/api/deflection-checkout`,
  mapping variants to Stripe Price IDs, and keeping the displayed variant in
  sync with that selection.
- Cross-system env parity remains operational: when a future variant is added,
  the portfolio and ATLAS allowed-amount envs must be updated together.
- The parked web dependency audit finding in `HARDENING.md` was considered but
  remains unrelated because this slice does not change dependencies.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-checkout` - passed; printed the
  expected fail-closed Stripe checkout log lines, then
  `Deflection checkout tests passed.`
- `rg -n "\\$1,500|150000|Support Ticket Deflection: Backlog Report" web/src/lib web/src/components/landing/DeflectionResultsPage.tsx web/src/app/api/deflection-checkout/route.ts web/src/app/systems/support-ticket-deflection/landingConfig.tsx web/scripts/test-deflection-checkout.mjs -S` - one expected match remains:
  the catalog source `DEFLECTION_DEFAULT_PRICE_VARIANT.stripeProductName` in
  `web/src/lib/deflection-pricing.ts`.
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
- `bash scripts/local_pr_review.sh` - passed; plan audits, drift advisory,
  ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Price-Catalog.md` | +116 |
| `web/src/lib/deflection-pricing.ts` | +25 / -3 |
| `web/src/lib/deflection-checkout.ts` | +8 / -4 |
| `web/src/app/api/deflection-checkout/route.ts` | +2 / -2 |
| `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` | +3 / -3 |
| `web/src/components/landing/DeflectionResultsPage.tsx` | +4 / -3 |
| `web/scripts/test-deflection-checkout.mjs` | +18 / -3 |
| Total | ~191 changed |
