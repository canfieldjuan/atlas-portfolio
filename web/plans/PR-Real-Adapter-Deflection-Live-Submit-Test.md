# Real Adapter Deflection Live Submit Test

## Why this slice exists

The live-submit smoke guard still runs as a standalone Node test harness. It
already exercises the real deployed-ATLAS submit smoke runner with mocked fetch
and file-read boundaries, so it should move into the Vitest lane with the other
deflection regression checks while keeping the live smoke command unchanged.

## Scope (this PR)

Slice phase: Robust testing

1. Move `test:deflection-live-submit-smoke` from a Node harness to Vitest.
2. Keep using the real `runDeflectionLiveSubmitSmoke` adapter from the
   production smoke script.
3. Preserve coverage for submit FormData construction, snapshot parsing, source
   window validation, teaser validation, locked artifact checks, fail-closed
   env/options/file-read behavior, and ATLAS HTTP failures.

### Files touched

- `web/package.json` — point the existing npm script at Vitest.
- `web/scripts/test-deflection-live-submit-smoke.mjs` — remove the legacy Node harness.
- `web/src/lib/deflection-live-submit-smoke.test.mjs` — add the Vitest replacement.
- `web/plans/PR-Real-Adapter-Deflection-Live-Submit-Test.md` — plan for this slice.

## Mechanism

The new Vitest file imports `runDeflectionLiveSubmitSmoke` directly from
`web/scripts/smoke-deflection-live-submit.mjs`. It stubs only CSV reads, fetch,
and the clock. The success path still inspects the real FormData body sent to
ATLAS and the derived hosted results URL.

## Intentional

- This is a test-harness migration only; the production live-submit smoke script
  is not changed.
- ATLAS submit, snapshot, and artifact calls stay mocked because this `test:*`
  script is the unit guard; the live smoke command remains
  `smoke:deflection-live-submit`.
- `HARDENING.md` was scanned before starting. No active parked item touches this
  live-submit smoke guard area.

## Deferred

The remaining browser-heavy deflection smoke scripts remain as Node harnesses
and will be migrated in later slices.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-live-submit-smoke` — passed; 1 test file / 21 tests.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 39 `test:*` scripts are enrolled.
- `npm --prefix web run lint` — passed.
- `rg -n "test-deflection-live-submit-smoke\\.mjs|node scripts/test-deflection-live-submit-smoke" web/package.json web/src/lib/deflection-live-submit-smoke.test.mjs web/scripts || true` — no matches; the legacy harness command is gone.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~73 |
| Vitest replacement | ~450 |
| Package script update | ~2 |
| Legacy harness deletion | ~384 |
| Total | ~909 |

This is over the 400 LOC soft cap because the existing harness is 384 lines and
the migrated test must preserve the live-submit success/failure matrix against
the real smoke runner. Splitting it would leave the legacy harness in place or
drop one of the existing submit/snapshot/artifact paths.
