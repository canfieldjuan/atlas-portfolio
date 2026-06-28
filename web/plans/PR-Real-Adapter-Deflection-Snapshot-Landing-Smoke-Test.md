## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses. The Snapshot
landing smoke test still compiles generated fixture modules into temporary
CommonJS files before asserting the landing-page contract.

This slice migrates that coverage to Vitest so the test imports the real
generated Snapshot fixture, report-model fixture, and Snapshot contract fields
directly.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the Snapshot landing smoke temp fixture transpile harness with a
   Vitest test.
2. Preserve fixture-shape checks, Snapshot/report-model relationship checks,
   source/copy guards, locked preview guards, and smoke-helper failure cases.
3. Keep the CLI smoke-helper check for the `--output` bare-flag failure.
4. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the Snapshot landing smoke test through Vitest.
- `web/plans/PR-Real-Adapter-Deflection-Snapshot-Landing-Smoke-Test.md` — plan
  for this slice.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` — remove the temp
  fixture transpile harness.
- `web/src/lib/deflection-snapshot-landing-smoke.test.ts` — add real-import
  fixture, source-guard, smoke-helper, and CLI coverage.

## Mechanism

The new test imports `DEMO_DEFLECTION_SNAPSHOT`,
`DEMO_DEFLECTION_SNAPSHOT_CLEAN_UPLOAD`, and the generated Snapshot field
constants from `@/lib/deflection-snapshot`. It imports
`DEMO_DEFLECTION_REPORT_MODEL` from `@/lib/deflection-report-demo`, and imports
the existing `runDeflectionSnapshotLandingSmoke` helper from the script under
test.

Source/copy assertions still read landing, intake, locked-preview, and paid
report files because those checks protect public copy, smoke markers, and static
render wiring. The smoke-helper tests still mock only `fetch` and the CLI process
boundary.

## Intentional

- No local product fixture is compiled into a fake CJS copy. Generated fixtures
  and contract constants resolve through normal repo imports.
- The smoke helper remains in `web/scripts/` because it is the production CLI
  surface; this slice migrates its test, not the CLI itself.
- Source-read assertions remain source guards because they validate copy and
  marker presence rather than runtime helper behavior.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-snapshot-landing-smoke # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-snapshot-landing-smoke\\.mjs|atlas-deflection-snapshot-fixtures-|atlas-deflection-report-fixtures-" web/package.json web/scripts web/src/lib/deflection-snapshot-landing-smoke.test.ts; then exit 1; else echo "No deflection Snapshot landing temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Deflection-Snapshot-Landing-Smoke-Test.md` | ~87 |
| `web/scripts/test-deflection-snapshot-landing-smoke.mjs` | ~848 |
| `web/src/lib/deflection-snapshot-landing-smoke.test.ts` | ~657 |
| Total | ~1594 |

This is over the 400-LOC soft cap because the old smoke contract combines
fixture projection checks, source/copy guards, render-marker validation, and CLI
failure coverage.
