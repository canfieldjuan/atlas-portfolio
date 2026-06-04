## Why this slice exists

Issue #194 now has the partner price variant wired through intake, persistence,
checkout creation, and the consolidated checkout trust rules. The live hosted
Checkout smoke, however, can only exercise the default checkout request shape.
That leaves the explicit partner checkout-start verification as a manual
request-body edit instead of a repeatable smoke.

This slice makes the hosted Checkout smoke variant-aware so operators can run
the same smoke against standard and partner report ids and prove that each leg
creates a live Stripe Checkout Session without completing payment.

## Scope (this PR)

Slice phase: Functional validation

1. Add an optional `--price-variant standard|partner` flag to the hosted
   Checkout smoke.
2. Preserve the existing default request body when no variant flag is supplied.
3. When a variant is supplied, send it to `/api/deflection-checkout` and include
   the selected variant in the smoke artifact.
4. Add focused tests for default omission, explicit standard, explicit partner,
   and invalid variant rejection before any API call.

### Files touched

- `web/plans/PR-Deflection-Hosted-Checkout-Variant-Smoke.md`
- `web/scripts/smoke-deflection-hosted-checkout.mjs`
- `web/scripts/test-deflection-hosted-checkout-smoke.mjs`

## Mechanism

The smoke keeps validating request id, attempt id, base URL, expected mode, and
Checkout Session creation exactly as before. A small local variant allowlist
accepts `standard` and `partner`.

If `--price-variant` is omitted, the smoke sends the existing body:

```json
{ "requestId": "...", "attemptId": "..." }
```

If `--price-variant partner` or `--price-variant standard` is supplied, the
smoke sends:

```json
{ "requestId": "...", "attemptId": "...", "priceVariant": "partner" }
```

The route remains the authority for saved-variant trust. For a forged partner
request on a standard report, the existing server gate should still fail closed;
this smoke only makes that leg easy to call and record.

## Intentional

- No product code changes. This is smoke tooling for the already-wired checkout
  route.
- No Stripe direct calls and no payment completion. The smoke still only asks
  the hosted portfolio route to create a Checkout Session.
- The default smoke omits `priceVariant` to preserve existing live command
  behavior and artifact comparisons.
- The smoke does not try to discover whether a request id is a partner report.
  That remains backend state owned by the intake persistence path.

## Deferred

- Full end-to-end partner unlock remains a live operator run once a partner
  report id exists and the partner Price ID is provisioned in production.
- Generalized cohort/flag routing remains deferred to #194; this slice only
  validates the explicit variant request path.

Parked hardening: none.

## Verification

- `npm --prefix web ci` -> pass; installed 378 packages, audited 379 packages,
  reported the existing npm audit state: 3 vulnerabilities (2 moderate, 1 high).
- `npm --prefix web run test:deflection-hosted-checkout-smoke` -> pass;
  `Deflection hosted Checkout smoke tests passed.`
- `npm --prefix web run lint -- scripts/smoke-deflection-hosted-checkout.mjs
  scripts/test-deflection-hosted-checkout-smoke.mjs` -> pass.
- `bash scripts/local_pr_review.sh` -> pass after local dependencies were
  installed; plan audits, cross-session drift, full ESLint, Next build, and
  `git diff --check` all passed.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Hosted-Checkout-Variant-Smoke.md` | +93 / -0 |
| `web/scripts/smoke-deflection-hosted-checkout.mjs` | +38 / -17 |
| `web/scripts/test-deflection-hosted-checkout-smoke.mjs` | +54 / -0 |
| Total | 202 changed (+185 / -17 across 3 files) |
