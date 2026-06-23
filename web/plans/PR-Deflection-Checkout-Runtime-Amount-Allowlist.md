## Why this slice exists

Issue #313 M2 flags a dead runtime guard: `resolveDeflectionCheckoutRuntimeConfig`
knows the configured checkout amount allowlist, but the live
`createDeflectionCheckoutSession` path never calls it. That leaves point of sale
depending on ATLAS authorization and the post-create Stripe response check instead
of failing closed before Stripe when the selected variant or authorized amount
falls outside the allowlist.

## Scope (this PR)

Slice phase: Production hardening

1. Have live deflection checkout resolve the existing runtime checkout config
   before creating a Stripe Checkout Session.
2. Reject a selected variant or ATLAS-authorized checkout amount that is not in
   `ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS` before
   calling Stripe.
3. Extend the focused checkout tests to prove disallowed selected/authorized
   amounts return a failure result with zero Stripe calls.

### Files touched

- `web/plans/PR-Deflection-Checkout-Runtime-Amount-Allowlist.md` — plan for this hardening slice.
- `web/src/lib/deflection-checkout.ts` — runtime amount allowlist enforcement.
- `web/scripts/test-deflection-checkout.mjs` — regression coverage for pre-Stripe amount rejection.

## Mechanism

The checkout helper already resolves the requested price variant and receives
ATLAS-authorized checkout terms. This slice imports the shared CommonJS
`deflection-checkout-requirements` module and calls
`resolveDeflectionCheckoutRuntimeConfig(process.env, priceVariant)` after basic
request/checkout validation and before building the Stripe form.

The resolved config supplies the Stripe key, account id, and the allowed amount
set while also validating that the selected variant has a configured Price ID. If
the selected variant is not allowlisted, the helper returns `not_configured`
without calling Stripe. If ATLAS authorizes an
`amountCents` value outside the same allowlist, the helper also returns
`not_configured` without calling Stripe. The existing post-create session check
stays in place as a second guard against Stripe or Price configuration drift.

## Intentional

- The slice reuses the existing runtime resolver instead of adding a second
  parser or a Stripe Price lookup.
- Checkout still uses the ATLAS-authorized `checkout.priceId`; this slice gates
  whether the selected variant and authorized amount are allowed before using it.
- No `payment_method_types` are added; Checkout keeps Stripe dynamic payment
  methods.
- The live route response shape stays unchanged. Mispriced checkout contracts
  still return the existing generic checkout failure copy.

## Deferred

- #313 still owns the larger security CI, admin hardening, deletion, disclosure,
  structured logging, purge endpoint, and JSON-LD escaping follow-ups.
- Cross-repo amount single-source work remains owned by #194 and ATLAS#1697.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-checkout` — passed; printed the expected
  fail-closed checkout logs and `Deflection checkout tests passed.`
- `npm --prefix web run test:deflection-checkout-env` — passed; printed
  `Deflection checkout env tests passed.`
- `npm --prefix web run lint -- src/lib/deflection-checkout.ts scripts/test-deflection-checkout.mjs` — passed.
- `rg -n "resolveDeflectionCheckoutRuntimeConfig|authorized amount is not allowed|allowedAmountsCents|calls.length, 0" web/src/lib/deflection-checkout.ts web/scripts/test-deflection-checkout.mjs web/plans/PR-Deflection-Checkout-Runtime-Amount-Allowlist.md` — confirmed the live helper calls the shared resolver, checks the authorized amount before Stripe, and the test asserts zero Stripe calls on fail-closed branches.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~73 |
| Checkout helper | ~53 |
| Checkout test | ~37 |
| Total | ~163 |
