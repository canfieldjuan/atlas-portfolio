# Real Adapter Deflection Row Renderer Share Test

## Why this slice exists

The deflection row-renderer sharing guard still runs as a standalone Node
harness. It protects the Snapshot/results shared-row contract, but it only
inspects source text. The row components are exportable React components, so
this guard can move into Vitest and verify real rendered output while preserving
the cross-page wiring checks.

## Scope (this PR)

Slice phase: Robust testing

1. Move `test:deflection-row-renderer-share` from a Node script to a Vitest test.
2. Render the real shared row components with typed Snapshot row fixtures and
   assert their visible labels, costs, routing chips, and empty-wording behavior.
3. Preserve source guards for results-page and Snapshot-landing consumption of
   the shared row components.

### Files touched

- `web/package.json` — point the existing npm script at Vitest.
- `web/scripts/test-deflection-row-renderer-share.mjs` — remove the legacy Node harness.
- `web/src/lib/deflection-row-renderer-share.test.tsx` — add the Vitest replacement.
- `web/plans/PR-Real-Adapter-Deflection-Row-Renderer-Share-Test.md` — plan for this slice.

## Mechanism

The new test imports `DeflectionTopQuestionRows`, `DeflectionLockedQuestionRows`,
and `DeflectionBlindSpotRows` from the production component module and renders
them with `react-dom/server`. That directly verifies the shared renderers rather
than only checking that their source contains expected strings.

The page-level assertions still read source because they protect ownership of
the shared renderer: results and landing pages must keep delegating top
questions, locked rows, and blind spots to `DeflectionSnapshotRows` rather than
reintroducing bespoke row renderers.

## Intentional

- This is a test-harness migration only; it does not change row components,
  page components, generated data, or product copy.
- React rendering uses `renderToStaticMarkup`; no browser test harness is added
  for this static row contract.
- `HARDENING.md` was scanned before starting. No active parked item touches
  this row-renderer guard area.

## Deferred

The remaining browser-heavy deflection smoke scripts remain as Node harnesses
and will be migrated in later slices.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-row-renderer-share` — passed; 1 test file / 2 tests.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 39 `test:*` scripts are enrolled.
- `npm --prefix web run lint` — passed.
- `rg -n "test-deflection-row-renderer-share\\.mjs|node scripts/test-deflection-row-renderer-share" web/package.json web/src/lib/deflection-row-renderer-share.test.tsx web/scripts || true` — no matches; the legacy harness command is gone.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~77 |
| Vitest replacement | ~164 |
| Package script update | ~2 |
| Legacy harness deletion | ~206 |
| Total | ~449 |

This is over the 400 LOC soft cap because the existing harness is 206 lines and
the replacement both preserves page wiring coverage and adds real rendered
component coverage. Splitting it would leave the script half-migrated or drop
one side of the contract.
