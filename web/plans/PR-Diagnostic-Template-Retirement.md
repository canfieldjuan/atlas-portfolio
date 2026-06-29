# PR-Diagnostic-Template-Retirement

## Why this slice exists

Issue #198 tracks verified dead-code cleanup. The only remaining Knip baseline
findings are `DiagnosticReportLandingPage.tsx` plus the `DiagnosticCard` and
`DiagnosticUseCase` types that only supported that retired template. Live source
references show current support-ticket routes use `DeflectionLandingPage`, while
the old diagnostic template is not imported by any app route or module.

This slice retires the code and updates current framework docs that still point
future work at the old template. That keeps the cleanup truthful instead of
leaving a deleted implementation as the documented path.

## Scope (this PR)

Slice phase: Production hardening

1. Delete the orphaned diagnostic landing-page template.
2. Remove `DiagnosticCard` and `DiagnosticUseCase` from shared primitives.
3. Remove the three resolved Knip baseline findings.
4. Update current landing-page framework docs to name `DeflectionLandingPage`
   as the live support-ticket implementation and mark the diagnostic template
   as retired.

### Files touched

- `web/src/components/landing/DiagnosticReportLandingPage.tsx` -- remove the unreferenced template.
- `web/src/components/landing/LandingPrimitives.tsx` -- remove types only used by the retired template.
- `web/knip-baseline.json` -- remove the resolved Knip findings.
- `web/docs/landing-page-framework/diagnostic-report-template.md` -- update the implementation note.
- `web/docs/landing-page-framework/decisions.md` -- mark the old template decision as superseded by the live deflection template.
- `web/docs/landing-page-framework/page-overhaul-brief.md` -- update current source pointers.
- `web/plans/PR-Diagnostic-Template-Retirement.md` -- this plan.

## Mechanism

The live support-ticket pages import `DeflectionLandingPage` and
`landingConfig-v2.tsx`. Once the unused diagnostic template is deleted, the two
primitive types it imported are no longer referenced anywhere. The docs update
keeps the implementation contract aligned with the live source path rather than
preserving a stale recommendation.

## Intentional

- This does not alter the live support-ticket landing page, partner page, or
  their config.
- Historical `web/plans/PR-*.md` mentions of `DiagnosticReportLandingPage` stay
  untouched because they describe past implementation history.
- This does not remove shared primitives still used by `DeflectionLandingPage`.

## Deferred

- Legacy Blob token fallback removal after the old store is no longer needed.
- Legacy Stripe test-key fallback removal after a test-mode restricted key path
  is confirmed.

Parked hardening: none.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('web/knip-baseline.json', 'utf8')); console.log('json ok')"` -- pass.
- `rg -n "DiagnosticReportLandingPage|DiagnosticCard|DiagnosticUseCase" web/src web/scripts web/package.json .github/workflows web/knip-baseline.json --glob '!node_modules/**'` -- pass; no live source references remain.
- `rg -n "landingConfig\\.tsx|DeflectionReportHeroArtifact|HelpCenterComparison|DeflectionReportSample|heroReportRows|comparisonRows|sampleRankedQuestions|demoScaleStats" web/docs/landing-page-framework/page-overhaul-brief.md` -- pass; no stale current-doc artifact pointers remain.
- `rg -n "DiagnosticReportLandingPage|DiagnosticCard|DiagnosticUseCase|DeflectionLandingPage" web/docs/landing-page-framework web/plans --glob '!node_modules/**'` -- pass; current framework docs now mark the old template retired, while historical plan mentions remain.
- `npm --prefix web run check:dead-code` -- pass; Knip baseline matches 0 known findings.
- `npm --prefix web run lint` -- pass.
- `npm --prefix web run build` -- pass.
- `git diff --check` -- pass.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/components/landing/DiagnosticReportLandingPage.tsx` | ~394 |
| `web/src/components/landing/LandingPrimitives.tsx` | ~10 |
| `web/knip-baseline.json` | ~15 |
| `web/docs/landing-page-framework/diagnostic-report-template.md` | ~8 |
| `web/docs/landing-page-framework/decisions.md` | ~8 |
| `web/docs/landing-page-framework/page-overhaul-brief.md` | ~43 |
| `web/plans/PR-Diagnostic-Template-Retirement.md` | ~92 |
| Total | ~569 |

This exceeds the 400 LOC soft cap because the slice deletes one retired
template and updates the current docs that named it.
