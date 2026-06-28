## Why this slice exists

#414 is moving deflection tests away from one-off Node assertion harnesses and
toward the shared Vitest shape used by the rest of the real-adapter migration
lane. The snapshot contract generator test already imports the real generator,
but it still executes as a large top-level script rather than a named Vitest
case.

This slice migrates that test into Vitest while preserving the real generator
coverage for snapshot contracts, paid report-model contracts, generated demo
examples, check-mode drift detection, and write-mode output.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the snapshot contract generator Node assertion harness with a Vitest
   test file.
2. Preserve generator render assertions, fail-closed malformed-source cases,
   temp-file check-mode drift cases, and write-mode output checks.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the snapshot contract generator test through Vitest.
- `web/plans/PR-Real-Adapter-Deflection-Snapshot-Contract-Generator-Test.md` —
  plan for this slice.
- `web/src/lib/deflection-snapshot-contract-generator.test.ts` — add real-import
  generator coverage in Vitest, moved from the old top-level Node assertion
  harness.

## Mechanism

The new test imports the production
`scripts/generate-deflection-snapshot-contract.mjs` module directly from Vitest.
The existing ATLAS source fixtures, render assertions, rejection cases, and
temporary-file check/write mode checks move under a named async test case.

No local product dependency is mocked. The generator remains the real script
module, and filesystem writes stay confined to a temporary directory.

## Intentional

- The generator CLI remains in `web/scripts` because it is operator/build
  tooling, not a test harness.
- The large fixtures remain local to the test because they model ATLAS generated
  contract input and paired demo JSON; splitting them out would only hide the
  parity contract.
- The test still uses the real filesystem for check/write mode because drift
  detection is a file comparison behavior.

## Deferred

The remaining #414 Node harness migrations stay queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-snapshot-contract-generator # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-snapshot-contract-generator\\.mjs" web/package.json web/scripts web/src/lib/deflection-snapshot-contract-generator.test.ts; then exit 1; else echo "No deflection snapshot contract generator Node test harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Deflection-Snapshot-Contract-Generator-Test.md` | ~84 |
| `web/src/lib/deflection-snapshot-contract-generator.test.ts` | ~9 |
| Total | ~95 |

Git recognizes the old harness as a 99% rename, so the diff stays under the
400-LOC soft cap.
