## Why this slice exists

#414 is migrating tests away from temp-module stubs and `ts.transpileModule`
harnesses now that the repo has a real Vitest runner with `@/` alias support.
`test-deflection-results-state.mjs` is a small but representative fake-adapter
harness: it writes a local `@/lib/deflection-snapshot` stub before testing
`resolveDeflectionSnapshotRouteState`.

This slice migrates that harness to import the real `@/lib/deflection-results-state`
module and the real demo snapshot, preserving coverage parity for every route
state the old harness asserted.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the standalone `test-deflection-results-state.mjs` harness with a
   Vitest test that imports the real module through `@/`.
2. Preserve coverage parity for Atlas snapshot success, not-found, local demo
   fallback in non-production environments, production not-configured
   unavailability, and generic error unavailability.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the results-state test through Vitest.
- `web/plans/PR-Real-Adapter-Results-State-Test.md` — plan for this slice.
- `web/scripts/test-deflection-results-state.mjs` — remove the temp-stub harness.
- `web/src/lib/deflection-results-state.test.ts` — add the real-import coverage.

## Mechanism

The new Vitest test imports `resolveDeflectionSnapshotRouteState` from
`@/lib/deflection-results-state` and `DEMO_DEFLECTION_SNAPSHOT` from
`@/lib/deflection-snapshot`. That keeps the actual application import path in
the call graph instead of writing a fake `@/lib/deflection-snapshot` module into
a temporary `node_modules` directory.

Each old harness case maps directly to one test assertion. The demo fallback
assertions compare against the real exported demo snapshot so a broken alias,
missing export, or changed demo fixture shape fails the test through the normal
module path.

## Intentional

- This slice migrates only the results-state harness. Larger fake-adapter
  harnesses such as report-model result-page and rate-limit remain deferred.
- There are no external services in this module, so no mocks are needed.

## Deferred

The remaining #414 fake-adapter harness migrations stay queued after this small
coverage-preserving conversion.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-results-state # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-results-state\\.mjs|atlas-deflection-results-state" web/package.json web/scripts web/src/lib/deflection-results-state.test.ts; then exit 1; else echo "No results-state fake harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~1 |
| `web/plans/PR-Real-Adapter-Results-State-Test.md` | ~73 |
| `web/scripts/test-deflection-results-state.mjs` | ~95 |
| `web/src/lib/deflection-results-state.test.ts` | ~80 |
| Total | ~249 |
