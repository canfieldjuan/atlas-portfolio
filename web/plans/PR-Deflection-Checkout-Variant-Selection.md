## Why this slice exists

Issue #194 now has the backend amount gate and the portfolio default price
catalog in place. PR #228's review called out the next pricing hazard: Checkout
Sessions created from `STRIPE_DEFLECTION_REPORT_PRICE_ID` can charge an
allowlisted non-default Price, but the portfolio still stamps metadata as
`standard` / `150000`. That is safe for today's default Price, but it becomes
misleading attribution as soon as #194 wires another price.

This slice adds the checkout variant boundary before adding any second price. The
route can accept an optional variant id, validates it against the catalog, and
checkout metadata no longer claims a hardcoded amount on the Price-ID path.

## Scope (this PR)

Slice phase: Production hardening

1. Add price-variant lookup helpers around the current catalog, preserving
   `standard` as the only accepted variant for now.
2. Accept an optional `priceVariant` field on `POST /api/deflection-checkout`
   and reject unknown or malformed variants with the existing 400 invalid request
   response.
3. Pass the selected variant into checkout creation.
4. Stamp `metadata[price_variant]` from the selected variant on all sessions.
5. Stamp `metadata[price_id]` on Stripe Price-ID sessions and stamp
   `metadata[price_amount_cents]` only on inline `price_data` sessions where the
   portfolio actually sets the amount.
6. Extend the focused checkout test for invalid variant rejection, route pass
   through, Price-ID metadata, and inline amount metadata.

### Files touched

- `web/plans/PR-Deflection-Checkout-Variant-Selection.md`
- `web/src/lib/deflection-pricing.ts`
- `web/src/lib/deflection-checkout.ts`
- `web/src/app/api/deflection-checkout/route.ts`
- `web/scripts/test-deflection-checkout.mjs`

## Mechanism

The current price catalog remains single-variant:

```ts
resolveDeflectionPriceVariant(undefined) -> standard
resolveDeflectionPriceVariant('standard') -> standard
resolveDeflectionPriceVariant('other') -> null
```

The route resolves the body field before rate limiting or probing ATLAS. Checkout
receives a variant id, resolves it again defensively, and uses the selected
variant for inline fallback amount/product metadata.

For restricted-key production sessions, the form now sends:

```text
metadata[price_variant]=standard
metadata[price_id]=price_...
```

For inline test fallback sessions, the form sends:

```text
metadata[price_variant]=standard
metadata[price_amount_cents]=150000
```

That avoids claiming an amount the portfolio did not set while preserving the
existing ATLAS trust metadata (`source/account_id/request_id`).

## Intentional

- No second catalog variant is added. This PR creates the selection boundary and
  fixes metadata accuracy before a later slice enables any non-default price.
- No client UI sends `priceVariant` yet; omitted body field still selects
  `standard`.
- No Stripe Price lookup is added. Price-ID sessions carry `metadata[price_id]`
  because Stripe owns the final amount for that path.

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
- `rg -n "metadata\\[price_amount_cents\\]|metadata\\[price_id\\]|priceVariant|resolveDeflectionPriceVariant" web/src web/scripts/test-deflection-checkout.mjs -S` - passed; matches are limited to the resolver, route body field/pass-through, checkout metadata setters, and focused test assertions.
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
| `web/plans/PR-Deflection-Checkout-Variant-Selection.md` | +120 |
| `web/src/lib/deflection-pricing.ts` | +12 |
| `web/src/lib/deflection-checkout.ts` | +27 / -6 |
| `web/src/app/api/deflection-checkout/route.ts` | +16 / -2 |
| `web/scripts/test-deflection-checkout.mjs` | +64 / -5 |
| Total | ~252 changed |
