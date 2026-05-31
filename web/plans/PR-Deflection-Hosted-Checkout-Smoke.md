# Plan: Deflection hosted Checkout smoke

## Why this slice exists

The go-live smoke coverage now proves the deployed ATLAS submit leg and the
hosted portfolio results page. The next paid-flow gap is the entry into Stripe:
for a known locked report id, the deployed portfolio route should create a
Checkout Session and return Stripe's hosted URL without exposing secrets or
marking the report paid.

## Scope (this PR)

Slice phase: Functional validation

1. Add a no-secret hosted Checkout-start smoke that POSTs
   `/api/deflection-checkout` with a bounded request id and attempt id.
2. Verify the response is either a Stripe Checkout URL for the expected locked
   report path or an explicit already-paid state.
3. Add focused mocked tests for success, already-paid, invalid id, non-200,
   malformed URL, and transport-failure branches.
4. Enroll the focused test in pre-push CI.

### Files touched

- `web/plans/PR-Deflection-Hosted-Checkout-Smoke.md` - this plan doc.
- `web/scripts/smoke-deflection-hosted-checkout.mjs` - hosted Checkout-start smoke.
- `web/scripts/test-deflection-hosted-checkout-smoke.mjs` - focused checker tests.
- `web/package.json` - npm scripts for the smoke and its test.
- `.github/workflows/pre_push_audit.yml` - CI enrollment for the focused test.

## Mechanism

The command takes the `request_id` from the submit smoke:

```bash
npm --prefix web run smoke:deflection-hosted-checkout -- \
  --request-id content-ops-... \
  --base-url https://juancanfield.com
```

It validates the request id, generates or accepts an `attemptId`, and POSTs to
the hosted portfolio route. A passing locked-report response must include a URL
whose hostname is `checkout.stripe.com`. If the route returns `{alreadyPaid:
true}`, the smoke reports that state separately because the route correctly
refuses to create another Session for an unlocked report.

## Intentional

- The smoke creates a Checkout Session but does not complete payment, call Stripe
  directly, or mark the report paid. ATLAS webhook verification remains the paid
  trust boundary.
- No Stripe or ATLAS credentials are needed locally; the deployed portfolio route
  owns those secrets.
- The smoke does not accept arbitrary redirect hosts as success. It requires
  Stripe-hosted Checkout.

## Deferred

- Completing a test-mode payment and validating artifact `200` remains a separate
  Stripe/webhook smoke.
- Browser upload validation remains manual/live-preview work because it depends
  on Vercel Blob client-token minting and the deployed intake form.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-hosted-checkout-smoke` - passed.
- `npm --prefix web run smoke:deflection-hosted-checkout -- --request-id content-ops-b98ea1f8792f48399f0bbaed228f0f4d --json --output /tmp/deflection-hosted-checkout-smoke.json` - passed against `https://juancanfield.com`, returning a `checkout.stripe.com` URL without completing payment.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~80 |
| Smoke script | ~170 |
| Focused tests | ~150 |
| Package/CI enrollment | ~4 |
| **Total** | ~404 |
