# Plan: Deflection paid unlock require unlocked

## Why this slice exists

The go-live smoke path now proves public reachability and live Checkout Session
creation. The last production-safe paid hop is post-payment render validation:
after Stripe's verified webhook unlocks a report, the hosted results page must
render the full paid artifact.

The existing paid-unlock smoke can render-check an already-unlocked report, but
if the report is still locked it creates Checkout. That is correct for preview
test-mode validation, but risky for a production post-payment render check.

## Scope (this PR)

Ownership lane: content-ops/faq-deflection
Slice phase: Functional validation

1. Add `--require-unlocked` to `smoke:deflection-paid-unlock`.
2. In that mode, fail closed on `status: "locked"` before creating Checkout.
3. Add focused tests for the strict pass and strict locked failure.
4. Document the production post-payment render command.

### Files touched

- `web/plans/PR-Deflection-Paid-Unlock-Require-Unlocked.md` - this plan doc.
- `web/scripts/smoke-deflection-paid-unlock.mjs` - strict unlocked mode.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` - focused tests.
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` -
  production post-payment command.

## Mechanism

The new flag checks report status first, like the existing smoke. If the hosted
status route returns `unlocked`, the smoke verifies paid render markers exactly
as before. If it returns `locked`, the smoke exits with `stage: "status"` and
does not call `/api/deflection-checkout`.

```bash
npm --prefix web run smoke:deflection-paid-unlock -- \
  --request-id "$REQUEST_ID" \
  --base-url https://juancanfield.com \
  --require-unlocked \
  --json
```

## Intentional

- Default behavior is unchanged for protected-preview test-mode validation.
- This does not complete payment, fake a webhook, or mark the report paid.
- The production command is a post-payment render check, not a payment driver.

## Deferred

- Completing a live payment remains a manual/operator action.
- Automated Stripe test-mode payment completion remains outside this slice.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-paid-unlock-smoke` - passed.
- `npm --prefix web run smoke:deflection-paid-unlock -- --request-id content-ops-ff9d64ad39784f5e8bb0342c1f8dd946 --base-url https://juancanfield.com --require-unlocked --json --output /tmp/deflection-paid-unlock-require-unlocked-locked.json` - failed closed as expected against a locked production report with `initialStatus: "locked"` and no Checkout URL.
- `npm --prefix web run lint` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| Smoke script | ~20 |
| Focused tests | ~30 |
| Runbook | ~15 |
| **Total** | ~134 |
