## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses and fake local
adapters. The deflection intake ATLAS-submit test still compiles
`atlas-deflection-client.ts` into a temp CommonJS file while writing fake
`@/lib/*` modules for snapshot paths, report-contract paths, gap-report intake,
and structured runtime logging.

This slice migrates that coverage to Vitest so the test imports the real
`@/lib/atlas-deflection-client` module and real local dependencies.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the deflection intake ATLAS-submit temp transpile harness with a
   Vitest test.
2. Preserve submit request-shape, missing-env, invalid-submit-response,
   snapshot sanitization, snapshot shape rejection, artifact timeout, and
   record/intake wiring coverage.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the deflection intake ATLAS-submit test through
  Vitest.
- `web/plans/PR-Real-Adapter-Deflection-Intake-Atlas-Submit-Test.md` — plan for
  this slice.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` — remove the temp
  transpile and fake local-module harness.
- `web/src/lib/atlas-deflection-client-submit.test.ts` — add real-import submit,
  snapshot, artifact, and wiring coverage.

## Mechanism

The new test imports `submitDeflectionReportCsv`, `fetchDeflectionSnapshot`, and
`fetchDeflectionArtifact` from the production `@/lib/atlas-deflection-client`
module. It mocks only external boundaries: `@vercel/blob.get` for private Blob
reads, `globalThis.fetch` for ATLAS HTTP responses, `console.error` for
structured runtime log assertions, and timer spies for timeout-budget
assertions.

The existing source-level wiring checks for the record route and intake
transition stay in the migrated test so coverage parity is preserved while the
ATLAS client itself moves to real imports.

## Intentional

- No local product dependency is mocked. Snapshot path helpers, report contract
  helpers, gap-report Blob token helpers, and structured runtime logging resolve
  through normal repo imports.
- The record route is not converted into a broad integration test in this slice;
  this migration keeps its existing source-wiring assertions and focuses the
  real-import change on the ATLAS client harness being deleted.
- The old timeout assertion remains behavioral at the timer boundary: the real
  `fetchDeflectionArtifact` call schedules a 60s abort budget and clears it
  after the mocked ATLAS response resolves.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-intake-atlas-submit # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-intake-atlas-submit\\.mjs|atlas-deflection-submit-" web/package.json web/scripts web/src/lib/atlas-deflection-client-submit.test.ts; then exit 1; else echo "No deflection intake ATLAS-submit temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Deflection-Intake-Atlas-Submit-Test.md` | ~91 |
| `web/scripts/test-deflection-intake-atlas-submit.mjs` | ~845 |
| `web/src/lib/atlas-deflection-client-submit.test.ts` | ~637 |
| Total | ~1575 |

This is over the 400-LOC soft cap because the old temp transpile harness is
large and coverage parity keeps submit, snapshot, artifact, and wiring
assertions together.
