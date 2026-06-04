## Why this slice exists

Issue #194's safety prerequisite is now live in ATLAS: the webhook amount gate
accepts exact allowed amounts instead of one global floor. Portfolio still only
has the `standard` price variant wired end to end, while the product decision
D-025 already exposes a separate `/systems/support-ticket-deflection/partner`
price.

Today the partner landing page shows `$1,000`, but its CTA goes through the same
intake/results/checkout path that falls back to the standard `$1,500` variant.
That is a buyer-trust mismatch and blocks using the partner URL for real
outbound.

The estimated diff is slightly over the 400 LOC soft cap because the slice has
to carry one price variant through the full buyer path: catalog, partner CTA,
intake redirect/email links, results render, checkout payload, preflight, docs,
and focused regression tests. Splitting those would leave an intermediate state
where the partner page could still advertise one price and charge another.

## Scope (this PR)

Slice phase: Vertical slice

1. Add a `partner` deflection price variant to the shared price catalog with its
   own Stripe Price ID env key.
2. Drive partner-page pricing from that catalog instead of hardcoded `$1,000`
   copy.
3. Preserve `priceVariant=partner` from the partner CTA through intake,
   notification/results links, and the results page.
4. Bind checkout eligibility to the saved intake price variant for the report
   request, so mutable results-page query strings cannot self-discount.
5. Submit the selected variant to `/api/deflection-checkout`, so Stripe session
   creation uses the partner Price ID and stamps partner metadata.
6. Extend focused tests for the partner variant catalog, checkout metadata,
   intake link preservation, and route forwarding.
7. Update operator docs/runbooks for the partner Price ID env and allowed amount.

### Files touched

- `web/plans/PR-Deflection-Partner-Price-Variant.md`
- `web/src/lib/deflection-pricing.ts`
- `web/src/lib/deflection-checkout.ts`
- `web/src/lib/gap-report-intake-database.ts`
- `web/src/lib/gap-report-intake.ts`
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx`
- `web/src/components/landing/DeflectionResultsPage.tsx`
- `web/src/app/api/deflection-checkout/route.ts`
- `web/src/app/api/gap-report-intake/record/route.ts`
- `web/src/app/systems/support-ticket-deflection/intake/page.tsx`
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx`
- `web/src/app/systems/support-ticket-deflection/partner/page.tsx`
- `web/scripts/check-deflection-checkout-env.mjs`
- `web/scripts/test-deflection-checkout.mjs`
- `web/scripts/test-deflection-checkout-env.mjs`
- `web/scripts/test-deflection-email-results-link.mjs`
- `web/scripts/test-deflection-intake-atlas-submit.mjs`
- `web/README.md`
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md`

## Mechanism

The catalog gains a second variant:

```ts
{
  id: 'partner',
  amountUsd: 1000,
  stripePriceIdEnvKey: 'STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER',
}
```

The partner page links to the same intake route with `?priceVariant=partner`.
The intake route validates that query against the catalog and passes the variant
into the client intake component. The intake component includes the variant in
Blob/client metadata, record-route metadata, analytics context, and generated
results URLs. The server-side notification/customer links also append the
validated non-default variant, so a later email click does not silently revert a
partner buyer to the standard price.

The results route looks up the saved intake payload by ATLAS report request id
and uses that server-side `priceVariant` as the display variant. Production does
not trust a mutable `?priceVariant=partner` query string for pricing. The unlock
button uses the server-bound variant label and sends the variant id to
`/api/deflection-checkout`.

The checkout route repeats the same server-side lookup and rejects a posted
variant that does not match the saved intake variant for the report request.
Checkout then resolves variant-specific Price IDs, requires Stripe's returned
`amount_total` to equal the selected variant amount, and stamps
`metadata[price_variant]`.

## Intentional

- No random A/B assignment is added. This slice wires the explicit partner URL
  variant only.
- Invalid or missing `priceVariant` query values fall back to the standard price
  on page render when no saved intake variant exists; production pricing is
  bound to saved intake metadata, and the checkout API rejects mismatched
  explicit request payloads.
- No new database column is added. Existing submission persistence stores the
  full payload JSON, and top-level reporting tables do not need price-variant
  filtering in this slice.
- Production preflight requires both standard and partner Price IDs plus an
  allowlist containing `100000` and `150000`, because the partner URL is active
  once this PR lands.

## Deferred

- Issue #194 still owns generalized cohort/flag routing and any future
  simultaneous price experiments beyond the explicit partner URL.
- A shared runtime/preflight Price ID decision helper remains deferred from
  #230; this slice extends the current preflight shape for the partner env.
- Live Stripe verification is deferred until production has
  `STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER` and the matching ATLAS allowed
  amount configured.
- The partner page `layout.tsx` still contains the historical `$1,000` metadata
  description/noindex comment. That is intentional static partner-page context,
  not active checkout/copy state.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-checkout` - passed; printed expected
  fail-closed checkout logs including `selected variant amount is not allowed`,
  then `Deflection checkout tests passed.`
- `npm --prefix web run test:deflection-checkout` - passed after the P1 review
  fix; printed expected fail-closed checkout logs including `session amount does
  not match selected variant`, then `Deflection checkout tests passed.`
- `npm --prefix web run test:deflection-checkout` - passed after the P2 review
  fix; unsigned partner checkout for a standard/default report returned HTTP 400
  without calling checkout creation, while a saved partner variant still
  forwarded partner checkout.
- `npm --prefix web run test:deflection-checkout-env` - passed; printed
  `Deflection checkout env tests passed.`
- `npm --prefix web run test:deflection-checkout-env` - passed after the review
  fix; production candidates without `STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER`
  now fail preflight.
- `npm --prefix web run test:deflection-email-results-link` - passed; printed
  `Deflection email results-link tests passed.`
- `npm --prefix web run test:deflection-intake-atlas-submit` - initially failed
  on a stale source assertion for the old local results-link helper name.
- `npm --prefix web run test:deflection-intake-atlas-submit` - passed after
  updating the assertion to the shared `deflectionResultsPath` helper; printed
  `Deflection intake ATLAS submit tests passed.`
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
- `rg -n "STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER|priceVariant=partner|\$1,000|100000|DEFLECTION_PARTNER_PRICE_VARIANT" web/src web/scripts web/README.md web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md -S` -
  passed; matches are the partner catalog/env/docs/tests, route/query plumbing,
  and the existing noindex partner-page metadata/comment.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed; plan shape, files touched,
  diff-size drift, cross-session drift, ESLint, Next build, and
  `git diff --check` all passed.
- `bash scripts/local_pr_review.sh` - passed after the review fix; plan shape,
  files touched, diff-size drift, cross-session drift, ESLint, Next build, and
  `git diff --check` all passed.
- `bash scripts/local_pr_review.sh` - passed after the P1 review fix; plan
  shape, files touched, diff-size drift, cross-session drift, ESLint, Next
  build, and `git diff --check` all passed.
- `bash scripts/local_pr_review.sh` - passed after the P2 review fix; plan
  shape, files touched, diff-size drift, cross-session drift, ESLint, Next
  build, and `git diff --check` all passed.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Partner-Price-Variant.md` | +196 |
| `web/src/lib/deflection-pricing.ts` | +16 / -1 |
| `web/src/lib/deflection-checkout.ts` | +34 / -10 |
| `web/src/lib/gap-report-intake-database.ts` | +36 |
| `web/src/lib/gap-report-intake.ts` | +32 / -4 |
| `web/src/components/landing/SupportTicketCsvIntakePage.tsx` | +10 / -9 |
| `web/src/components/landing/DeflectionResultsPage.tsx` | +7 / -4 |
| `web/src/app/api/deflection-checkout/route.ts` | +21 |
| `web/src/app/api/gap-report-intake/record/route.ts` | +1 |
| `web/src/app/systems/support-ticket-deflection/intake/page.tsx` | +27 / -3 |
| `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` | +31 / -1 |
| `web/src/app/systems/support-ticket-deflection/partner/page.tsx` | +8 / -4 |
| `web/scripts/check-deflection-checkout-env.mjs` | +24 / -2 |
| `web/scripts/test-deflection-checkout.mjs` | +133 / -4 |
| `web/scripts/test-deflection-checkout-env.mjs` | +89 / -9 |
| `web/scripts/test-deflection-email-results-link.mjs` | +44 / -1 |
| `web/scripts/test-deflection-intake-atlas-submit.mjs` | +2 / -3 |
| `web/README.md` | +11 / -7 |
| `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` | +5 / -2 |
| Total | ~775 changed |
