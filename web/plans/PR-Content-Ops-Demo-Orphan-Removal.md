# PR-Content-Ops-Demo-Orphan-Removal

## Why this slice exists

Issue #198 tracks verified dead-code cleanup. After the entrypoint false-positive
fix, Knip still reports `web/src/components/ContentOpsDemo.tsx` as an unused
file. Live source reference checks show no app route, source module, package
script, or workflow imports it. The current `/systems/ai-content-ops` routes are
handwritten pages, so this old demo widget is not part of the served site.

This slice intentionally exceeds the 400 LOC soft cap because the candidate is
one indivisible orphan component file. The implementation removes that one file
rather than mixing in unrelated cleanup.

## Scope (this PR)

Slice phase: Production hardening

1. Delete the orphaned `ContentOpsDemo` component file.
2. Remove the resolved file finding from the Knip baseline.
3. Leave historical plan mentions alone; they describe past slices and are not
   live source references.

### Files touched

- `web/src/components/ContentOpsDemo.tsx` -- remove the unreferenced component.
- `web/knip-baseline.json` -- remove the resolved Knip file finding.
- `web/plans/PR-Content-Ops-Demo-Orphan-Removal.md` -- this plan.

## Mechanism

The deletion is safe only because source grep finds no imports or render calls
for `ContentOpsDemo`. The live content-ops hub and ongoing-support pages own
their own UI directly, and the demo route imports `CostObservabilityDemo` and
`DocClassificationDemo` instead.

## Intentional

- This does not touch the current `/systems/ai-content-ops` or
  `/systems/ai-content-ops/ongoing-support` route implementations.
- This does not update historical plan docs that mention `ContentOpsDemo`.
- This does not touch `DiagnosticReportLandingPage` yet because current
  landing-page framework docs still describe that template and need a
  doc-aware cleanup slice.

## Deferred

- Remaining baseline findings for `DiagnosticReportLandingPage.tsx`,
  `DiagnosticCard`, and `DiagnosticUseCase`.
- Legacy Blob token fallback removal after the old store is no longer needed.
- Legacy Stripe test-key fallback removal after a test-mode restricted key path
  is confirmed.

Parked hardening: none.

## Verification

- `rg -n "ContentOpsDemo" web/src web/scripts web/package.json .github/workflows web/knip-baseline.json --glob '!node_modules/**'` -- pass; no live source references remain.
- `node -e "JSON.parse(require('fs').readFileSync('web/knip-baseline.json', 'utf8')); console.log('json ok')"` -- pass.
- `npm --prefix web run check:dead-code` -- pass; Knip baseline matches 3 known findings.
- `npm --prefix web run lint` -- pass.
- `npm --prefix web run build` -- pass.
- `git diff --check` -- pass.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/components/ContentOpsDemo.tsx` | ~691 |
| `web/knip-baseline.json` | ~5 |
| `web/plans/PR-Content-Ops-Demo-Orphan-Removal.md` | ~75 |
| Total | ~771 |

This exceeds the 400 LOC soft cap because the slice deletes one orphan file.
