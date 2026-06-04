## Why this slice exists

ATLAS now fails closed when a Stripe Checkout Session amount is outside the
configured deflection-report allowlist. The portfolio checkout route still only
checks that Stripe returns a URL, so a mis-scoped `STRIPE_DEFLECTION_REPORT_PRICE_ID`
could send a buyer to pay for a Checkout Session that ATLAS would later refuse
to unlock.

This slice mirrors the backend amount contract at the storefront boundary before
the customer leaves the site.

The diff lands slightly above the 400 LOC soft cap because the checkout and
preflight guards each need negative fixtures for the new fail-closed branches.

## Scope (this PR)

Slice phase: Production hardening

1. Add a server-side allowed-amount parser for
   `ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS`, with
   the current full-report price as the default when the env var is omitted.
2. Require Stripe's returned Checkout Session to include a non-empty URL,
   `amount_total` in the allowed set, and `currency: "usd"` before returning a
   checkout redirect to the browser.
3. Extend the deflection checkout env preflight so malformed amount allowlists
   fail closed before deployment, including the legacy inline test fallback when
   its allowlist excludes the canonical inline amount.
4. Cover the default, multi-amount, malformed, wrong-currency, and missing
   amount branches in focused tests.
5. Update operator docs so the configured Price contract is exact allowlist
   parity with ATLAS, not a minimum floor.

### Files touched

- `web/plans/PR-Deflection-Checkout-Allowed-Amounts.md`
- `web/src/lib/deflection-checkout.ts`
- `web/scripts/check-deflection-checkout-env.mjs`
- `web/scripts/test-deflection-checkout.mjs`
- `web/scripts/test-deflection-checkout-env.mjs`
- `web/README.md`
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md`

## Mechanism

The checkout helper keeps the existing Checkout Sessions REST flow and keeps
using restricted Stripe keys for production. The new guard is local to the
server route:

```ts
const allowedAmounts = configuredAllowedAmounts();
const session = await res.json();
if (!isAllowedCheckoutSession(session, allowedAmounts)) {
  return { ok: false, reason: "error" };
}
return { ok: true, url: session.url };
```

`configuredAllowedAmounts()` accepts comma-separated positive integer cents from
`ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS`. Blank
means the canonical full-report amount only. Invalid entries return
`not_configured`, so checkout does not contact Stripe with an ambiguous amount
contract.

The env preflight mirrors that contract. In local/preview, a legacy
`ATLAS_SAAS_STRIPE_SECRET_KEY` fallback without `STRIPE_DEFLECTION_REPORT_PRICE_ID`
uses inline test `price_data`, so a configured allowlist must still include the
canonical inline amount.

## Intentional

- No Stripe Price lookup is added. The restricted key only needs the existing
  Checkout Session create permission; the created session response already
  carries the amount/currency needed for the guard.
- No `payment_method_types` are added. The Checkout Session keeps Stripe dynamic
  payment methods.
- The client display price is not changed here. This slice protects the
  redirect boundary; variant-specific display and copy remain separate from the
  amount gate.

## Deferred

- Issue #194 still owns price variant selection and the customer-facing single
  source of truth for displayed price/copy.
- Historical plan docs still mention older floor wording where they describe
  previous slices. The active code and operator docs are updated in this PR.
- The parked web dependency audit finding in `HARDENING.md` was considered but
  remains unrelated because this slice does not change dependencies.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-checkout` - passed; printed the
  expected fail-closed Stripe checkout log lines, then
  `Deflection checkout tests passed.`
- `npm --prefix web run test:deflection-checkout-env` - passed; printed
  `Deflection checkout env tests passed.`
- `npm --prefix web run test:deflection-checkout-env` - passed after review fix
  for legacy inline fallback allowlist parity; printed
  `Deflection checkout env tests passed.`
- `npm --prefix web run build` - initially failed because this fresh worktree
  had no `web/node_modules`; Turbopack could not resolve `next/package.json`
  from `web/src/app`.
- `npm --prefix web ci` - passed; added 378 packages, audited 379 packages, and
  reported the existing 3 dependency audit findings already parked in
  `HARDENING.md`.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed after `npm ci`; compiled successfully,
  completed TypeScript, generated 44 static pages, and copied the deterministic
  routes manifest.
- `rg -n "unit_amount >= 150000|contract floor|unlock floor|amount floor" web/src web/scripts web/README.md web/docs -S` - no matches (exit 1).
- `bash scripts/local_pr_review.sh` - passed; plan audits, drift advisory,
  ESLint, Next build, and `git diff --check` all passed.
- `bash scripts/local_pr_review.sh` - passed after review fix; plan audits,
  drift advisory, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Checkout-Allowed-Amounts.md` | +116 |
| `web/src/lib/deflection-checkout.ts` | +70 / -7 |
| `web/scripts/check-deflection-checkout-env.mjs` | +64 |
| `web/scripts/test-deflection-checkout.mjs` | +92 / -3 |
| `web/scripts/test-deflection-checkout-env.mjs` | +82 |
| `web/README.md` | +8 / -2 |
| `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` | +9 / -3 |
| Total | ~456 changed |
