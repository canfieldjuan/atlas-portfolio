# Real Adapter Deflection Browser Upload Test

## Why this slice exists

The browser-upload smoke guard still runs as a standalone Node test harness. It
already exercises the real browser-upload smoke runner with mocked upload and
fetch boundaries, so it should move into the Vitest lane with the other
deflection regression checks.

## Scope (this PR)

Slice phase: Robust testing

1. Move `test:deflection-browser-upload-smoke` from a Node harness to Vitest.
2. Keep using the real `runDeflectionBrowserUploadSmoke` adapter from the
   production smoke script.
3. Preserve coverage for private Blob upload metadata, `/record` submission,
   hosted results verification, CLI bare-flag failure, option validation,
   file-read failures, upload failures, record failures, and invalid redirect
   IDs.

### Files touched

- `web/package.json` — point the existing npm script at Vitest.
- `web/scripts/test-deflection-browser-upload-smoke.mjs` — remove the legacy Node harness.
- `web/src/lib/deflection-browser-upload-smoke.test.mjs` — add the Vitest replacement.
- `web/plans/PR-Real-Adapter-Deflection-Browser-Upload-Test.md` — plan for this slice.

## Mechanism

The new Vitest file imports `runDeflectionBrowserUploadSmoke` directly from
`web/scripts/smoke-deflection-browser-upload.mjs`. It stubs only file reads,
Blob upload, fetch, and the one CLI process invocation used to verify bare flag
handling. The success path still asserts private Blob access, intake metadata,
record-body shape, and the generated hosted results URL.

## Intentional

- This is a test-harness migration only; the production browser-upload smoke
  script is not changed.
- Browser upload and record calls stay mocked because this `test:*` script is
  the unit guard; the live smoke command remains `smoke:deflection-browser-upload`.
- `HARDENING.md` was scanned before starting. No active parked item touches
  this browser-upload smoke guard area.

## Deferred

The remaining browser-heavy deflection smoke scripts remain as Node harnesses
and will be migrated in later slices.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-browser-upload-smoke` — passed; 1 test file / 10 tests.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 39 `test:*` scripts are enrolled.
- `npm --prefix web run lint` — passed.
- `rg -n "test-deflection-browser-upload-smoke\\.mjs|node scripts/test-deflection-browser-upload-smoke" web/package.json web/src/lib/deflection-browser-upload-smoke.test.mjs web/scripts || true` — no matches; the legacy harness command is gone.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~74 |
| Vitest replacement | ~365 |
| Package script update | ~2 |
| Legacy harness deletion | ~361 |
| Total | ~802 |

This is over the 400 LOC soft cap because the existing harness is 361 lines and
the migrated test must preserve the browser-upload success/failure matrix
against the real smoke runner. Splitting it would leave the legacy harness in
place or drop one of the existing upload/record/results paths.
