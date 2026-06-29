# Real Adapter Deflection Hosted Results Test

## Why this slice exists

The hosted-results smoke guard is the last deflection smoke `test:*` script
still running as a standalone Node harness. It already exercises the real
hosted-results smoke runner and pins snapshot, full-report, model-full-report,
partner-copy, and locked-vs-paid render markers, so it should move into the
Vitest lane without changing the live smoke command.

## Scope (this PR)

Slice phase: Robust testing

1. Move `test:deflection-hosted-results-smoke` from a Node harness to Vitest.
2. Keep using the real `runDeflectionHostedResultsSmoke` adapter from the
   production smoke script.
3. Preserve coverage for snapshot render markers, no-proven-answer snapshots,
   invalid request/base/expected-state fail-closed behavior, fetch failures,
   visible error markers, full-report and model-full-report marker contracts,
   partner full-report copy, locked-marker detection, and result-page source
   copy guards.

### Files touched

- `web/package.json` — point the existing npm script at Vitest.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` — remove the legacy Node harness.
- `web/src/lib/deflection-hosted-results-smoke.test.mjs` — add the Vitest replacement.
- `web/plans/PR-Real-Adapter-Deflection-Hosted-Results-Test.md` — plan for this slice.

## Mechanism

The new Vitest file imports `runDeflectionHostedResultsSmoke` directly from
`web/scripts/smoke-deflection-hosted-results.mjs`. Runtime checks stub only
`fetch` and the clock, then assert exact result marker objects, missing-marker
arrays, API-call boundaries, and rendered error strings. Source-level partner
copy checks remain source reads against `DeflectionResultsPage.tsx`.

## Intentional

- This is a test-harness migration only; the production hosted-results smoke
  script is not changed.
- Hosted results page requests stay mocked because this `test:*` script is the
  unit guard; the live smoke command remains `smoke:deflection-hosted-results`.
- `HARDENING.md` was scanned before starting. No active parked item touches this
  hosted-results smoke guard area.

## Deferred

This is the final Node-harness migration in the deflection smoke lane.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-hosted-results-smoke` — passed; 1 test file / 32 tests.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 39 `test:*` scripts are enrolled.
- `npm --prefix web run lint` — passed.
- `rg -n "test-deflection-hosted-results-smoke\\.mjs|node scripts/test-deflection-hosted-results-smoke" web/package.json web/src/lib/deflection-hosted-results-smoke.test.mjs web/scripts || true` — no matches; the legacy harness command is gone.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| Vitest replacement | ~370 |
| Package script update | ~2 |
| Legacy harness deletion | ~545 |
| Total | ~992 |

This is over the 400 LOC soft cap because the existing harness is 545 lines and
the migrated test must preserve snapshot, full-report, model-backed, partner,
and source-level result-page contracts. Splitting it would leave the final Node
harness in place or temporarily weaken one of the hosted result render paths.
