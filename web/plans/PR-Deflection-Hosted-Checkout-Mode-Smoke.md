# Plan: Deflection hosted Checkout mode smoke

## Why this slice exists

Production checkout creation is fixed and now guarded by an env preflight, but
the hosted Checkout smoke still accepts any Stripe Checkout URL. For the
canonical production buy-button path, the smoke should prove the route returns a
live-mode Checkout Session (`cs_live_...`), not merely a `checkout.stripe.com`
URL.

This slice tightens the operational smoke without completing payment or changing
runtime behavior.

## Scope (this PR)

Slice phase: Functional validation

1. Add an optional `--expect-mode live|test|any` flag to the hosted Checkout
   smoke.
2. Classify Stripe Checkout URLs as `live` or `test` from their `cs_*` session
   id path segment.
3. Fail closed when the created Checkout Session mode does not match the
   requested mode.
4. Add focused mocked tests for live success, test success, mode mismatch,
   invalid expected mode, and already-paid behavior.
5. Document the production post-deploy command in the paid-unlock runbook.

### Files touched

- `web/plans/PR-Deflection-Hosted-Checkout-Mode-Smoke.md` - this plan doc.
- `web/scripts/smoke-deflection-hosted-checkout.mjs` - expected-mode option and
  URL mode classification.
- `web/scripts/test-deflection-hosted-checkout-smoke.mjs` - focused smoke tests.
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` -
  production post-deploy smoke command.

## Mechanism

The smoke still POSTs only to the deployed portfolio route. When a Stripe URL is
returned, it parses the URL path and extracts the first `cs_live_...` or
`cs_test_...` segment:

```text
https://checkout.stripe.com/c/pay/cs_live_... -> live
https://checkout.stripe.com/c/pay/cs_test_... -> test
```

By default the checker accepts either mode to preserve existing local/preview
usage. Operators can require production live mode:

```bash
npm --prefix web run smoke:deflection-hosted-checkout -- \
  --request-id "$REQUEST_ID" \
  --base-url https://juancanfield.com \
  --expect-mode live
```

## Intentional

- This does not complete payment, call Stripe directly, or mark the report paid.
- This does not make production validation depend on reading Vercel sensitive
  env values; it verifies the deployed route output.
- `already_paid` remains a pass without a Checkout mode because no new Checkout
  Session is created for an unlocked report.

## Deferred

- Completing a test-mode payment and validating artifact `200` remains covered
  by the protected-preview paid-unlock smoke.
- Automating a real live payment remains out of scope.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-hosted-checkout-smoke` - passed.
- `npm --prefix web run smoke:deflection-hosted-checkout -- --request-id content-ops-ff9d64ad39784f5e8bb0342c1f8dd946 --base-url https://juancanfield.com --expect-mode live --json --output /tmp/deflection-hosted-checkout-live-mode.json` - passed; returned `checkoutMode: "live"` and `expectedMode: "live"` without completing payment.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~85 |
| Smoke script | ~70 |
| Focused tests | ~70 |
| Runbook | ~10 |
| **Total** | ~235 |
