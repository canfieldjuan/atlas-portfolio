## Why this slice exists

Issue #193 narrowed the live checkout stall to one missing browser observation:
did the buyer's browser leave `juancanfield.com` and reach Stripe-hosted
Checkout, or did it stall before redirect? The checkout contract is already
correct on both sides, so this slice adds diagnostic checkpoints around the
client redirect without changing Stripe session creation or the paid-unlock
trust path.

## Scope (this PR)

Slice phase: Production hardening

1. Add a browser-safe checkout diagnostic helper that summarizes the response
   and redirect target without logging secrets.
2. Record checkout response and redirect checkpoints from the results-page
   unlock handler to `console` and `sessionStorage`.
3. Keep the existing hosted Checkout redirect flow intact: server returns the
   Stripe URL, client assigns `window.location.href`.
4. Add a focused Node regression script for the diagnostic helper.

### Files touched

- `web/src/lib/deflection-checkout-diagnostics.ts` — new pure helper for safe checkout diagnostics.
- `web/src/components/landing/DeflectionResultsPage.tsx` — records response/redirect checkpoints around `handleUnlock`.
- `web/scripts/test-deflection-checkout-diagnostics.mjs` — focused helper regression script.
- `web/plans/PR-Deflection-Checkout-Redirect-Diagnostics.md` — this plan doc.

## Mechanism

The client builds a small diagnostic envelope for each unlock attempt:

- `phase`: `checkout_response` or `checkout_redirect`
- redacted `requestId` / `attemptId` suffixes
- response status/ok, elapsed milliseconds, `alreadyPaid`, `hasUrl`
- redirect URL origin/host/path prefix and whether the host is
  `checkout.stripe.com`

The results page logs the envelope with `console.info(...)` and writes the last
checkpoint to `sessionStorage` under a stable key. That gives a live repro a
single place to answer #193's split: if the redirect checkpoint says
`isStripeCheckoutUrl: true`, the browser received a Stripe-hosted URL and the
next failure is hosted-page/account-side. If no redirect checkpoint appears,
the stall is still on `juancanfield.com`.

## Intentional

- No `payment_method_types` is added; dynamic payment methods remain dashboard
  controlled per Stripe guidance.
- No API route or telemetry sink is added; this slice avoids collecting buyer
  data server-side and keeps the diagnostic local to the repro browser.
- No visible customer-facing copy is added; this is a go-live diagnostic, not a
  checkout UX rewrite.

## Deferred

- If #193 shows the browser never reaches Stripe, follow-up slice: add a
  customer-visible retry/copy-link fallback around the redirect failure.
- If #193 shows the browser reaches Stripe and stalls there, follow-up is a
  Stripe Dashboard/live-account checklist, not a code PR.
- Parked hardening: none.

## Verification

- `node web/scripts/test-deflection-checkout-diagnostics.mjs` — passed.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Diagnostic helper | ~95 |
| Results-page wiring | ~40 |
| Helper test script | ~110 |
| Plan doc | ~80 |
| Total | ~325 |
