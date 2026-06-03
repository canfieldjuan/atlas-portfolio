## Why this slice exists

PR #212 centralized deflection pricing and received three non-blocking review
NITs: the checkout test stub still hardcoded the fallback cents value, the
support-tax calculator recomputed the exported benchmark delta inline, and the
Stripe fallback product name still used a pre-existing em dash.

This slice closes those small follow-ups while keeping the public price,
checkout behavior, and rendered offer unchanged.

## Scope (this PR)

Slice phase: Production hardening

1. Make the checkout test stub read the fallback cents value from the real
   `deflection-pricing.ts` source instead of duplicating `150000`.
2. Use `DEFLECTION_ASSISTED_CONTACT_DELTA_USD` in the support-tax calculator
   rather than recomputing the benchmark subtraction inline.
3. Replace the Stripe fallback product display name's em dash with ASCII
   punctuation.
4. Preserve Stripe Checkout Session shape, metadata, API version, price-id
   preference, and public pricing values.

### Files touched

- `web/plans/PR-Deflection-Pricing-Followups.md`
- `web/scripts/test-deflection-checkout.mjs`
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx`
- `web/src/lib/deflection-checkout.ts`

## Mechanism

The checkout test already transpiles `deflection-checkout.ts` into a temporary
CommonJS module and stubs its `@/lib/*` imports. This PR reads
`web/src/lib/deflection-pricing.ts`, compiles it into the temporary harness,
imports `DEFLECTION_FULL_REPORT_PRICE_CENTS`, and uses that source-derived
export in the stub and assertion.

`SupportTaxCalculator` switches from:

```ts
DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD - DEFLECTION_SELF_SERVICE_BENCHMARK_USD
```

to the exported `DEFLECTION_ASSISTED_CONTACT_DELTA_USD`. The checkout product
name changes from the old em-dash fallback label to
`Support Ticket Deflection: Backlog Report`.

## Intentional

- No checkout route behavior changes. The form fields, Stripe API version,
  dynamic-payment-method eligibility, restricted-key handling, price-id path,
  metadata, and idempotency key remain unchanged.
- No public price or benchmark value changes.
- No broader pricing or A/B work from issue #194.

## Deferred

- A larger pricing system and partner-price constants remain deferred to issue
  #194 or a partner-page slice.
- Parked hardening: none.

## Verification

Ran before push:

- `npm --prefix web run test:deflection-checkout` - passed
- `rg -n --pcre2 "Support Ticket Deflection \\x{2014} Backlog Report|exports.DEFLECTION_FULL_REPORT_PRICE_CENTS = 150000" web/src web/scripts -S` - no matches
- `rg -n "DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD - DEFLECTION_SELF_SERVICE_BENCHMARK_USD" web/src/components/deflection-demo/SupportTaxCalculator.tsx -S` - no matches
- `rg -n "DEFLECTION_ASSISTED_CONTACT_DELTA_USD|Support Ticket Deflection: Backlog Report|DEFLECTION_FULL_REPORT_PRICE_CENTS" web/src web/scripts -S` - expected shared constant and fallback product-name references present
- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| Checkout test source-derived stub | ~20 |
| Calculator import/use cleanup | ~8 |
| Stripe display-name copy | ~2 |
| Total | ~105 |
