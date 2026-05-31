# Plan: Deflection Checkout Finalizing Poll

The paid unlock path now works end to end, but a buyer can return from Stripe
before the ATLAS webhook has flipped the report's paid flag. In that short
window the results page falls back to the free snapshot and shows the purchase
CTA again. This slice makes the success-return state wait briefly for the real
unlock before asking the buyer to retry.

## Why this slice exists

- PR-Deflection-Stripe-Checkout intentionally deferred post-checkout polling to
  keep the money-safe Checkout creation slice small.
- After #160 landed, production was provisioned and the live smoke proved:
  results page 200, Checkout create 200, ATLAS signed webhook 200, replay
  idempotency 200/already_processed, and `/artifact` 403 -> 200.
- The remaining buyer-facing gap is the race between Stripe's return redirect
  and ATLAS processing the webhook.

## Scope (this PR)

Slice phase: Product polish

1. Add a server-only report status endpoint for the results page:
   `GET /api/deflection-report-status?requestId=...`.
2. Pass the `checkout` search param from the results route into the snapshot
   component.
3. When `checkout=success`, poll the status endpoint briefly; if it reports
   `unlocked`, reload the clean results URL so the server component renders the
   paid artifact.

### Files touched

- `web/plans/PR-Deflection-Checkout-Finalizing-Poll.md` - this plan doc (new)
- `web/src/app/api/deflection-report-status/route.ts` - status endpoint (new)
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` -
  checkout search param handoff
- `web/src/components/landing/DeflectionResultsPage.tsx` - success-return poll
  state

## Mechanism

The status endpoint reuses `fetchDeflectionArtifact` and keeps the same
fail-closed trust boundary as the server route:

```ts
ok -> { status: 'unlocked' }
locked -> { status: 'locked' }
not_found -> 404
error/not_configured -> 503
```

The client only polls after Stripe returns with `checkout=success`. A successful
unlock navigates to `window.location.pathname` so the server component reruns
without the query string and renders the paid artifact. If the webhook is still
not visible after the bounded polling window, the CTA returns with a generic
error message; a subsequent click still goes through the #160 double-charge
guard.

## Intentional

- No client call to ATLAS. The browser only talks to portfolio server routes;
  the service JWT stays server-side.
- No optimistic paid render. The paid artifact only appears after
  `GET /artifact` returns 200 through the existing server-side parser.
- The endpoint does not expose artifact content, only locked/unlocked state.

## Deferred

- Live `rk_live_` restricted key provisioning remains a deployment step before
  taking real money.
- Public POST rate limiting remains parked from the #160 review; this slice
  does not widen the money-moving endpoint.

Parked hardening: none.

## Verification

- `npm run lint`
- `npm run build`
- `bash scripts/local_pr_review.sh --allow-dirty`
- Production handoff already proven before this slice:
  `juancanfield.com` results 200, Checkout create 200, ATLAS signed webhook 200,
  replay 200/already_processed, `/artifact` 403 -> 200.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| status route | ~45 |
| results page search param | ~15 |
| client polling state | ~45 |
| this plan doc | ~80 |
| **Total** | ~185 |

Actual diff is 4 files, +183 / -8.
