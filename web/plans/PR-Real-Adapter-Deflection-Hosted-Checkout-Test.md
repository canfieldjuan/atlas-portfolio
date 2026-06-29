# Real Adapter Deflection Hosted Checkout Test

## Why this slice exists

The hosted Checkout smoke guard still runs as a standalone Node test harness. It
already exercises the real hosted Checkout smoke runner with a mocked fetch
boundary, so it should live in the Vitest lane with the other deflection
regression checks.

## Scope (this PR)

Slice phase: Robust testing

1. Move `test:deflection-hosted-checkout-smoke` from a Node harness to Vitest.
2. Keep using the real `runDeflectionHostedCheckoutSmoke` adapter from the
   production smoke script.
3. Preserve coverage for default and explicit price variants, checkout-mode
   classification, already-paid handling, invalid inputs, HTTP/fetch failures,
   and invalid or mismatched Stripe Checkout URLs.

### Files touched

- `web/package.json` — point the existing npm script at Vitest.
- `web/scripts/test-deflection-hosted-checkout-smoke.mjs` — remove the legacy Node harness.
- `web/src/lib/deflection-hosted-checkout-smoke.test.mjs` — add the Vitest replacement.
- `web/plans/PR-Real-Adapter-Deflection-Hosted-Checkout-Test.md` — plan for this slice.

## Mechanism

The new Vitest file imports `runDeflectionHostedCheckoutSmoke` directly from
`web/scripts/smoke-deflection-hosted-checkout.mjs`. It stubs only the hosted
portfolio fetch boundary and deterministic attempt/time dependencies, then
asserts the same success and fail-closed paths the Node harness covered.

## Intentional

- This is a test-harness migration only; the production hosted Checkout smoke
  script is not changed.
- Hosted portfolio requests stay mocked because this `test:*` script is the
  unit guard; the live smoke command remains `smoke:deflection-hosted-checkout`.
- `HARDENING.md` was scanned before starting. No active parked item touches
  this hosted Checkout smoke guard area.

## Deferred

The remaining browser-heavy deflection smoke scripts remain as Node harnesses
and will be migrated in later slices.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-hosted-checkout-smoke` — passed; 1 test file / 13 tests.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 39 `test:*` scripts are enrolled.
- `npm --prefix web run lint` — passed.
- `rg -n "test-deflection-hosted-checkout-smoke\\.mjs|node scripts/test-deflection-hosted-checkout-smoke" web/package.json web/src/lib/deflection-hosted-checkout-smoke.test.mjs web/scripts || true` — no matches; the legacy harness command is gone.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~72 |
| Vitest replacement | ~247 |
| Package script update | ~2 |
| Legacy harness deletion | ~269 |
| Total | ~590 |

This is over the 400 LOC soft cap because the existing harness is 269 lines and
the migrated test must preserve the hosted Checkout success/failure matrix
against the real smoke runner. Splitting it would leave the legacy harness in
place or drop one of the existing fail-closed paths.
