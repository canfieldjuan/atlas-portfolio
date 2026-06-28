## Why this slice exists

#414 is moving deflection tests away from one-off Node harnesses and toward
real Vitest coverage. The checkout env preflight test already imports the real
validator and pricing catalog, but it still runs as a long top-level assertion
script, which makes failures harder to localize and keeps it outside the
standard Vitest test shape used by the rest of this migration lane.

This slice migrates that coverage to Vitest while keeping the real
`check-deflection-checkout-env.mjs` CLI subprocess checks for env-file behavior.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the deflection checkout env Node assertion harness with a Vitest
   test file.
2. Preserve coverage for configurable price amounts, browser-facing pricing env
   reads, production/preview/local validation branches, partner credential
   requirements, allowed amount validation, and CLI env-file isolation.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the checkout env test through Vitest.
- `web/plans/PR-Real-Adapter-Deflection-Checkout-Env-Test.md` — plan for this
  slice.
- `web/scripts/test-deflection-checkout-env.mjs` — remove the old top-level
  Node assertion harness.
- `web/src/lib/deflection-checkout-env.test.ts` — add real-import validator,
  pricing catalog, source-contract, and CLI subprocess coverage.

## Mechanism

The new test imports `validateDeflectionCheckoutEnv` from the production
checkout env CLI module, imports the real pricing catalog, and imports the real
checkout requirement constants. Assertions move into named Vitest cases and
tables so each failure names the contract that broke.

The CLI env-file checks still spawn the real
`scripts/check-deflection-checkout-env.mjs` entrypoint in a temporary directory.
No local product dependency is mocked.

## Intentional

- The preflight CLI itself stays in `web/scripts` because it is operator tooling,
  not a test harness.
- The test keeps subprocess coverage for `--env-file` isolation rather than
  replacing it with direct function calls, because that is the behavior operators
  rely on.
- The old source-string assertions are preserved for the browser-facing pricing
  env reads, where the contract is specifically that the client bundle uses
  literal `NEXT_PUBLIC_*` reads.

## Deferred

The remaining #414 Node harness migrations stay queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-checkout-env # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-checkout-env\\.mjs" web/package.json web/scripts web/src/lib/deflection-checkout-env.test.ts; then exit 1; else echo "No deflection checkout env Node test harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Deflection-Checkout-Env-Test.md` | ~85 |
| `web/scripts/test-deflection-checkout-env.mjs` | ~780 |
| `web/src/lib/deflection-checkout-env.test.ts` | ~750 |
| Total | ~1617 |

This is over the 400-LOC soft cap because the old assertion harness is large
and the migration keeps validator and CLI env-file coverage together.
