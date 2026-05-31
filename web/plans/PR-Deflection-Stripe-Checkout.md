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
  (`content_ops_faq_deflection_checkout_contract.md`) and the Stripe test
  credentials are already in the portfolio env and match ATLAS's own Stripe
  account.
- The portfolio owns Checkout-Session creation; ATLAS owns webhook verification
  and the paid flag. This slice implements exactly the portfolio's half.

## Scope (this PR)

Slice phase: Vertical slice

1. **`src/lib/deflection-checkout.ts`** (new, server-only) —
   `createDeflectionCheckoutSession(requestId, attemptId)`: POSTs Stripe's REST
   `/v1/checkout/sessions` (form-encoded, no SDK dep),
   `mode=payment`, inline `price_data` (`usd`, `150000`), session metadata
   `{source, account_id, request_id}`, success/cancel URLs back to the report.
   Fail-closed: bounded request id + attempt id, 10s timeout, generic errors
   (never leaks the Stripe key or Stripe's error body), pinned Stripe API
   version, and attempt-scoped idempotency.
2. **`src/app/api/deflection-checkout/route.ts`** (new) —
   `POST {requestId, attemptId}`. Double-charge guard: probe `GET /artifact`
   first — `200` → `{alreadyPaid}`, `404` → `404`, `403 locked` → create the
   session, any other probe result → `503` fail-closed.
3. **`src/components/landing/DeflectionResultsPage.tsx`** — take a `requestId`
   prop; replace the stub with an async `handleUnlock` that generates an
   attempt id per click, POSTs to the route, and redirects to Stripe (loading +
   error state on the button).
4. **`.../results/[requestId]/page.tsx`** — pass `requestId` to the component.

### Files touched

- `web/plans/PR-Deflection-Stripe-Checkout.md` — this plan doc (new)
- `web/src/lib/deflection-checkout.ts` — Checkout Session creation (new)
- `web/src/app/api/deflection-checkout/route.ts` — POST route + guards (new)
- `web/src/components/landing/DeflectionResultsPage.tsx` — wire the unlock CTA + `requestId` prop
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` — pass `requestId`
- `web/README.md` — document restricted-key Checkout configuration

## Mechanism

- `ATLAS_SAAS_STRIPE_RAK` + `ATLAS_ACCOUNT_ID` are read server-side only;
  `unit_amount` is server-set so the client can never lower the price. The
  existing test-mode `ATLAS_SAAS_STRIPE_SECRET_KEY` can still drive preview
  validation, but full live `sk_live_` keys are rejected; production should use
  an `rk_live_` restricted key.
- Return URLs are built from the canonical `SITE_URL`
  (`https://juancanfield.com`), not the inbound request origin, so the buyer's
  post-payment redirect cannot be host-spoofed.
- Metadata lives on the **session** (`source=content_ops_deflection_report`,
  `account_id`, `request_id`) — exactly what ATLAS's webhook handler reads.
- The Stripe REST call pins `Stripe-Version: 2026-05-27.dahlia` and sends
  `Idempotency-Key: deflection-checkout-{requestId}-{attemptId}`. Duplicate
  submissions inside one click attempt reuse the same Checkout Session, while a
  later explicit retry gets a fresh key so a transient Stripe failure is not
  cached against the report for a day.
- `success_url` omits `session_id`: the webhook is the trust path, and the
  results page only re-probes `GET /artifact`, so the session id is never needed
  back (also sidesteps the `{CHECKOUT_SESSION_ID}` literal-template pitfall).
- On return the existing server component re-runs `getArtifact`; once ATLAS has
  flipped the flag, it renders the full report.

## Intentional

- Stripe REST over fetch (not the `stripe` SDK) — matches the kit's fetch-based
  clients and adds no dependency.
- The double-charge guard now creates Checkout only when ATLAS proves the report
  exists and is unpaid (`GET /artifact` returns `403 locked`). Unknown artifact
  probe errors fail closed because they could also mean an already-paid artifact
  exists but failed local validation.
- Test-mode fallback key by design — live production billing is a later
  provisioning swap to `ATLAS_SAAS_STRIPE_RAK` with an `rk_live_` restricted key.

## Deferred

- **Post-checkout "finalizing…" polling UX.** If a buyer returns from Stripe
  before the webhook lands, they briefly see the snapshot + CTA again (the guard
  prevents an actual double-charge). A client poller on `?checkout=success` that
  waits for `GET /artifact` → 200 is a separable refinement, intentionally out of
  this slice to keep the core loop small and provable first.
- **Live Stripe key / production billing** — pending an `rk_live_` restricted
  key handoff with Checkout Sessions write permission.
- **Submit wiring + the multipart `/submit` deploy** — tracked separately; this
  slice is independent of it.

Parked hardening: none.

## Verification

- `npm run lint` = 0; `npm run build` compiles the new route + lib + component.
- Review hardening: Checkout creation now fails closed unless the artifact probe
  returns `locked`; Stripe calls include `Stripe-Version` and an
  attempt-scoped `Idempotency-Key`; env docs prefer `ATLAS_SAAS_STRIPE_RAK` and
  reject full live `sk_live_` keys.
- `rg "payment_method_types|transient ATLAS error as|ATLAS_SAAS_STRIPE_SECRET_KEY \\+ ATLAS_ACCOUNT_ID" src README.md plans/PR-Deflection-Stripe-Checkout.md` - no stale unsafe Checkout guidance remains.
- `rg "sk_live_" src README.md plans/PR-Deflection-Stripe-Checkout.md` - remaining matches are the explicit live-secret rejection and RAK production guidance.
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
| deflection-checkout route | ~55 |
| DeflectionResultsPage wiring | ~55 |
| page.tsx prop pass | ~2 |
| README docs | ~15 |
| this plan doc | ~110 |
| **Total** | ~342 |

Actual diff is 6 files, +364 / -10.
