# Plan: Deflection hosted Checkout require session

## Why this slice exists

PR-Deflection-Hosted-Checkout-Mode-Smoke added `--expect-mode live`, proving the
production route can return a live Checkout Session without completing payment.
The reviewer noted one future automation gap: if the supplied report is already
paid, the smoke returns `already_paid` without creating a Checkout Session, so an
automated go-live gate could pass without proving `checkoutMode === expectedMode`.

This slice adds an explicit gate option for production checks that must prove a
fresh Checkout Session was created.

## Scope (this PR)

Slice phase: Functional validation

1. Add `--require-checkout-session` to the hosted Checkout smoke.
2. Preserve the existing default behavior where `already_paid` remains a valid
   informational pass for manual checks.
3. Fail closed when `--require-checkout-session` receives `{ alreadyPaid: true }`.
4. Add focused tests for both the default already-paid pass and the strict
   require-session failure.
5. Update the production runbook command to use the stricter gate.

### Files touched

- `web/plans/PR-Deflection-Hosted-Checkout-Require-Session.md` - this plan doc.
- `web/scripts/smoke-deflection-hosted-checkout.mjs` - require-session option.
- `web/scripts/test-deflection-hosted-checkout-smoke.mjs` - focused tests.
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` -
  strict production smoke command.

## Mechanism

The existing hosted smoke still treats `{ alreadyPaid: true }` as a pass unless
the caller opts into the stricter gate:

```bash
npm --prefix web run smoke:deflection-hosted-checkout -- \
  --request-id "$REQUEST_ID" \
  --base-url https://juancanfield.com \
  --expect-mode live \
  --require-checkout-session
```

With `--require-checkout-session`, an already-paid report fails with
`stage: "checkout_session"` before the smoke can be misread as a live-mode
Checkout creation proof.

## Intentional

- This does not complete payment, call Stripe directly, or mark the report paid.
- The stricter behavior is opt-in so existing manual smoke usage remains
  backward-compatible.
- This does not change the route behavior; it only tightens the operator smoke.

## Deferred

- Completing a test-mode payment and validating artifact `200` remains covered
  by the protected-preview paid-unlock smoke.
- Automating a real live payment remains out of scope.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-hosted-checkout-smoke` - passed.
- `npm --prefix web run smoke:deflection-hosted-checkout -- --request-id content-ops-ff9d64ad39784f5e8bb0342c1f8dd946 --base-url https://juancanfield.com --expect-mode live --require-checkout-session --json --output /tmp/deflection-hosted-checkout-require-session.json` - passed; returned `checkoutMode: "live"`, `expectedMode: "live"`, and `requireCheckoutSession: true` without completing payment.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~80 |
| Smoke script | ~25 |
| Focused tests | ~25 |
| Runbook | ~5 |
| **Total** | ~135 |
