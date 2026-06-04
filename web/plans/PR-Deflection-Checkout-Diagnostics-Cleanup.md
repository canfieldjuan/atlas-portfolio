## Why this slice exists

Issue #198 tracks time-boxed cleanup of the checkout redirect diagnostics added
for #193. Those diagnostics did their job: the live checkout path was
discriminated, the browser was proven to reach Stripe Checkout, and the
no-charge webhook signing path was pinned. Keeping the client console and
sessionStorage recorder after diagnosis leaves temporary go-live plumbing in
the buyer flow.

This slice removes that temporary observer while preserving the checkout request,
Stripe idempotency attempt id, already-paid reload, error UI, and hosted Stripe
redirect behavior.

## Scope (this PR)

Ownership lane: ai-content-ops/faq-support-ticket-deflection
Slice phase: Production hardening.

1. Remove the deflection checkout diagnostics import and recording calls from the
   free snapshot results page.
2. Keep `attemptId` generation and POST body unchanged because the server uses it
   for Stripe idempotency.
3. Delete the now-orphaned diagnostics helper and focused helper script.

### Files touched

- `web/plans/PR-Deflection-Checkout-Diagnostics-Cleanup.md`
- `web/src/components/landing/DeflectionResultsPage.tsx`
- `web/src/lib/deflection-checkout-diagnostics.ts`
- `web/scripts/test-deflection-checkout-diagnostics.mjs`

## Mechanism

`DeflectionResultsPage.handleUnlock` already has the real production behavior:
POST `/api/deflection-checkout`, reload on `alreadyPaid`, set the browser to the
returned Stripe URL, and surface the existing error message on failure. The
temporary diagnostic layer wrapped each branch with a bounded console/session
record. This PR removes only those wrappers.

The route still receives `{ requestId, attemptId }`, and
`createDeflectionCheckoutSession` still uses the attempt id in the Stripe
idempotency key, so retry/concurrency behavior is unchanged.

## Intentional

- No checkout-route change. The cleanup is client observer removal only.
- No removal of `attemptId`. It is not diagnostic-only; it is part of the
  server-side Stripe idempotency contract.
- No replacement analytics sink. The #193 discriminator is complete, and adding
  a new sink would be a broader observability slice.

## Deferred

- #198 still tracks unrelated cleanup candidates: legacy Stripe fallback, legacy
  Blob token fallback, landing-config unused exports, calculator redundancy, and
  the gated `portfolio-ui/` investigation. Those remain out of scope.
- #193 can be closed or kept as the operational payment-verification record by
  the operator; this PR only removes the diagnostic code that issue produced.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-checkout`
- `npm --prefix web run test:deflection-hosted-checkout-smoke`
- `npm --prefix web run test:deflection-paid-unlock-smoke`
- `npm --prefix web run lint`
- `! rg -n "deflection-checkout-diagnostics|deflection_checkout:|atlas:deflection-checkout|recordDeflectionCheckoutDiagnostic|buildDeflectionCheckoutDiagnostic" web/src web/scripts web/package.json -S`
- `bash scripts/local_pr_review.sh`

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Checkout-Diagnostics-Cleanup.md` | +69 |
| `web/src/components/landing/DeflectionResultsPage.tsx` | -42 |
| `web/src/lib/deflection-checkout-diagnostics.ts` | -78 |
| `web/scripts/test-deflection-checkout-diagnostics.mjs` | -107 |
| Total | ~296 changed |
