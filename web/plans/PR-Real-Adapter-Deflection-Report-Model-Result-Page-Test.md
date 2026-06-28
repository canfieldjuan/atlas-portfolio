## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses and fake local
adapters. The report-model result-page test is the largest remaining offender:
it compiles the ATLAS client and report-status route into temporary CommonJS
files, then writes fake `@/lib/*`, Blob, and Next modules beside them.

This slice migrates that coverage to Vitest so the test imports the real ATLAS
client, real report-status route, real report contract, and real owner-cost
summary helper.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the report-model result-page temp transpile harness with a Vitest
   test.
2. Preserve report-model parser coverage for success projection, locked/not
   found/not configured states, unsafe-field stripping, legacy optional fields,
   shape rejection cases, and invalid request IDs.
3. Preserve result-page/status-route source guards for copy, section rendering,
   review-decision controls, ordering, and hosted-safe field usage.
4. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the report-model result-page test through Vitest.
- `web/plans/PR-Real-Adapter-Deflection-Report-Model-Result-Page-Test.md` —
  plan for this slice.
- `web/scripts/test-deflection-report-model-result-page.mjs` — remove the temp
  transpile and fake local-module harness.
- `web/src/lib/deflection-report-model-result-page.test.ts` — add real-import
  ATLAS client, status route, owner-summary, source-guard, and parser coverage.

## Mechanism

The new test imports `fetchDeflectionReportModel` from the production ATLAS
client, imports the production `/api/deflection-report-status` route, imports
the generated hosted field contract, and imports the real owner-cost summary
helper. ATLAS HTTP is isolated through `globalThis.fetch`; Blob is mocked only
at `@vercel/blob` because the ATLAS client module imports it for sibling paths.

The old repeated shape-rejection blocks are retained as a table of mutations
against the same fixture model. Source/copy assertions still read route and
component files because those checks are about page composition, visible copy,
and unsafe field usage rather than helper behavior.

## Intentional

- No local product dependency is mocked. The ATLAS client parser, generated
  report contract, status route, rate limiter, owner-cost summary, and routing
  helpers resolve through normal repo imports.
- Blob is mocked as an external package boundary even though report-model fetch
  itself does not read Blob; the shared ATLAS client module imports Blob for
  submit/artifact paths.
- The source-read assertions remain source guards. They are not replaced with a
  server-component render because the old contract is checking static wiring,
  copy, and field-access invariants.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-report-model-result-page # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-report-model-result-page\\.mjs|atlas-deflection-report-model-" web/package.json web/scripts web/src/lib/deflection-report-model-result-page.test.ts; then exit 1; else echo "No deflection report-model temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Deflection-Report-Model-Result-Page-Test.md` | ~92 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | ~2388 |
| `web/src/lib/deflection-report-model-result-page.test.ts` | ~1374 |
| Total | ~3856 |

This is over the 400-LOC soft cap because the old temp harness is very large
and this slice preserves parser, status-route, page-source, and owner-summary
coverage together.
