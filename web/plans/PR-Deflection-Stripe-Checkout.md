# Plan: Deflection Backlog Report — Stripe Checkout unlock (Slice B)

Wires the "Unlock the full report — $1,500" CTA on the deflection results page
to a real one-time Stripe Checkout Session. This is the buy step of the
snapshot → buy funnel: the free snapshot already renders (live fetch + the
artifact 403-locked fall-through are verified); this slice lets a buyer pay, and
ATLAS's `checkout.session.completed` webhook flips the report's paid flag so the
results page then hydrates the full report from `GET /artifact`.

## Why this slice exists

- The results page (`DeflectionResultsPage`) ships with a stubbed `handleUnlock`
  TODO — the CTA does nothing. The paid path is the only unbuilt leg of the
  funnel that is unblocked: ATLAS's checkout contract is finalized
  (`content_ops_faq_deflection_checkout_contract.md`) and the Stripe credentials
  (`ATLAS_SAAS_STRIPE_SECRET_KEY` + `ATLAS_SAAS_STRIPE_WEBHOOK_SECRET`, test
  mode) are already in the portfolio env and match ATLAS's own Stripe account.
- The portfolio owns Checkout-Session creation; ATLAS owns webhook verification
  and the paid flag. This slice implements exactly the portfolio's half.

## Scope (this PR)

Slice phase: Vertical slice

1. **`src/lib/deflection-checkout.ts`** (new, server-only) —
   `createDeflectionCheckoutSession(requestId, origin)`: POSTs Stripe's REST
   `/v1/checkout/sessions` (form-encoded, no SDK dep), `mode=payment`, inline
   `price_data` (`usd`, `150000`), session metadata
   `{source, account_id, request_id}`, success/cancel URLs back to the report.
   Fail-closed: bounded request id, 10s timeout, generic errors (never leaks the
   secret key or Stripe's error body).
2. **`src/app/api/deflection-checkout/route.ts`** (new) — `POST {requestId}`.
   Double-charge guard: probe `GET /artifact` first — `200` → `{alreadyPaid}`,
   `404` → `404`, else create the session and return `{url}`.
3. **`src/components/landing/DeflectionResultsPage.tsx`** — take a `requestId`
   prop; replace the stub with an async `handleUnlock` that POSTs to the route
   and redirects to Stripe (loading + error state on the button).
4. **`.../results/[requestId]/page.tsx`** — pass `requestId` to the component.

### Files touched

- `web/plans/PR-Deflection-Stripe-Checkout.md` — this plan doc (new)
- `web/src/lib/deflection-checkout.ts` — Checkout Session creation (new)
- `web/src/app/api/deflection-checkout/route.ts` — POST route + guards (new)
- `web/src/components/landing/DeflectionResultsPage.tsx` — wire the unlock CTA + `requestId` prop
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` — pass `requestId`

## Mechanism

- `ATLAS_SAAS_STRIPE_SECRET_KEY` + `ATLAS_ACCOUNT_ID` are read server-side only;
  `unit_amount` is server-set so the client can never lower the price.
- Metadata lives on the **session** (`source=content_ops_deflection_report`,
  `account_id`, `request_id`) — exactly what ATLAS's webhook handler reads.
- `success_url` omits `session_id`: the webhook is the trust path, and the
  results page only re-probes `GET /artifact`, so the session id is never needed
  back (also sidesteps the `{CHECKOUT_SESSION_ID}` literal-template pitfall).
- On return the existing server component re-runs `getArtifact`; once ATLAS has
  flipped the flag, it renders the full report.

## Intentional

- Stripe REST over fetch (not the `stripe` SDK) — matches the kit's fetch-based
  clients and adds no dependency.
- The double-charge guard treats a transient ATLAS error as "proceed": a Stripe
  paid event with no matching report is rejected + retried by ATLAS per the
  contract, so creating the session is still safe.
- Test-mode key by design — there is no live Stripe key yet; production billing
  is a later swap to `sk_live_`.

## Deferred

- **Post-checkout "finalizing…" polling UX.** If a buyer returns from Stripe
  before the webhook lands, they briefly see the snapshot + CTA again (the guard
  prevents an actual double-charge). A client poller on `?checkout=success` that
  waits for `GET /artifact` → 200 is a separable refinement, intentionally out of
  this slice to keep the core loop small and provable first.
- **Live Stripe key / production billing** — pending an `sk_live_` handoff.
- **Submit wiring + the multipart `/submit` deploy** — tracked separately; this
  slice is independent of it.

Parked hardening: none.

## Verification

- `npm run lint` = 0; `npm run build` compiles the new route + lib + component.
- The Checkout Session create path is exercised against the live test-mode key
  (real session id + hosted URL returned, metadata attached). The full
  webhook → paid → `GET /artifact` 200 loop is verified by completing one
  test-mode purchase (Stripe test card) against the unpaid test request — that
  also independently confirms whether ATLAS's deployed test-mode webhook is
  registered at `/webhooks/stripe`.
- `bash scripts/pre_push_audit.sh origin/main` + the python files-touched and
  diff-size audits green (committed diff).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| deflection-checkout.ts (lib) | ~105 |
| deflection-checkout route | ~45 |
| DeflectionResultsPage wiring | ~50 |
| page.tsx prop pass | ~2 |
| this plan doc | ~110 |
| **Total** | ~312 |
