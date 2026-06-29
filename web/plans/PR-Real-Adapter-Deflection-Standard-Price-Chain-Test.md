# Real Adapter Deflection Standard Price Chain Test

## Why this slice exists

The standard price-chain smoke guard still runs as a standalone Node test
harness. It already exercises the real smoke runner with mocked network
boundaries, so it belongs in the Vitest lane with the other deflection
regression checks.

## Scope (this PR)

Slice phase: Robust testing

1. Move `test:deflection-standard-price-chain-smoke` from a Node harness to
   Vitest.
2. Keep using the real `runDeflectionStandardPriceChainSmoke` adapter from the
   production smoke script.
3. Preserve coverage for Stripe env validation, standard terms validation,
   allowed-amount enforcement, checkout-mode fail-closed behavior, Stripe
   Session verification, unlock polling handoff, and JSON-mode source guards.

### Files touched

- `web/package.json` — point the existing npm script at Vitest.
- `web/scripts/test-deflection-standard-price-chain-smoke.mjs` — remove the legacy Node harness.
- `web/src/lib/deflection-standard-price-chain-smoke.test.mjs` — add the Vitest replacement.
- `web/plans/PR-Real-Adapter-Deflection-Standard-Price-Chain-Test.md` — plan for this slice.

## Mechanism

The new Vitest file imports `runDeflectionStandardPriceChainSmoke` directly from
`web/scripts/smoke-deflection-standard-price-chain.mjs`. It stubs only the
external fetch boundaries and clock/sleep dependencies, matching the old harness
while giving each path an explicit Vitest test case.

The test also keeps the source checks for JSON progress logging and fallback
Stripe key safety because those are CLI boundary contracts that are easier to
guard statically than through a live command invocation.

## Intentional

- This is a test-harness migration only; the production standard price-chain
  smoke script is not changed.
- The network and Stripe calls stay mocked because this `test:*` script is the
  unit guard; the live smoke command remains `smoke:deflection-standard-price-chain`.
- `HARDENING.md` was scanned before starting. No active parked item touches
  this standard price-chain smoke guard area.

## Deferred

The remaining browser-heavy deflection smoke scripts remain as Node harnesses
and will be migrated in later slices.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-standard-price-chain-smoke` — passed; 1 test file / 7 tests.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 39 `test:*` scripts are enrolled.
- `npm --prefix web run lint` — passed.
- `rg -n "test-deflection-standard-price-chain-smoke\\.mjs|node scripts/test-deflection-standard-price-chain-smoke" web/package.json web/src/lib/deflection-standard-price-chain-smoke.test.mjs web/scripts || true` — no matches; the legacy harness command is gone.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~77 |
| Vitest replacement | ~251 |
| Package script update | ~2 |
| Legacy harness deletion | ~252 |
| Total | ~582 |

This is over the 400 LOC soft cap because the existing harness is 252 lines and
the migrated test must preserve the multi-stage standard price-chain contract
against the real smoke runner. Splitting it would leave the legacy harness in
place or drop one of the existing fail-closed paths.
