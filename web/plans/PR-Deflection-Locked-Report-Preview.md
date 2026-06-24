## Why this slice exists

Issue #371 Part B asks the public Snapshot landing page to show the paid report
shape visitors unlock after the free Snapshot. Part A moved the cost projection
inside the Snapshot block; the remaining gap is that the page still does not
show the seven paid-only sections from the full Resolution Audit.

This is a fidelity slice. The preview must show the real paid-report structure,
not a new marketing artifact with invented rows.

## Scope (this PR)

Slice phase: Product polish

1. Add a committed demo `DeflectionStructuredReport` fixture that includes the
   seven paid-only sections from #371 in the same order as the paid report.
2. Render a locked full-report preview on the Snapshot landing page after the
   Snapshot artifact and before the proof/final CTA sections.
3. Show each paid-only section with its real section heading and column/field
   set, plus one representative locked row from the demo report.
4. Add stable smoke markers for the locked preview and each section.
5. Extend the Snapshot landing guard so the fixture section set, live markers,
   and preview labels stay pinned to the generated paid-report shape.

### Files touched

- `web/plans/PR-Deflection-Locked-Report-Preview.md` - plan for this slice.
- `web/src/lib/deflection-report-demo.ts` - demo paid-report fixture for the
  locked preview.
- `web/src/components/landing/DeflectionLockedReportPreview.tsx` - locked
  full-report preview renderer.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - insert the
  locked preview after the Snapshot block.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - monitored locked-preview
  smoke markers.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - marker fixture and
  source/fixture guards for the preview.

## Mechanism

`deflection-report-demo.ts` exports `DEMO_DEFLECTION_REPORT_MODEL`, typed against
the generated `DeflectionStructuredReport` contract that now comes from ATLAS.
It contains synthetic sample values only, but the section IDs and row/data keys
mirror the generated paid model shape.

`DeflectionLockedReportPreview.tsx` reads the seven target sections from that
fixture, renders them in #371's required order, and labels the block as a locked
preview of the full Resolution Audit. It uses the same section headings and
table/field labels as the real paid report page for the action queue sections,
and field labels derived from the generated contract shape for the card-style
diagnostic/detail sections.

The Snapshot landing page imports the demo report fixture and renders the locked
preview after `SnapshotArtifact`. The smoke script and test require a parent
`lockedReportPreview` marker plus one marker per paid-only section so an empty
or dropped fixture section fails locally instead of silently disappearing.

## Intentional

- This PR does not extract or rewrite `DeflectionReportModelPage` renderers.
  Those renderers are currently page-local and tied to the paid results view;
  extracting them would turn this product-polish slice into a broad renderer
  refactor.
- The preview rows are visibly locked and synthetic. They demonstrate structure,
  not customer metrics, guaranteed savings, or a paid artifact from a real CSV.
- The complete evidence export stays described as locked/paid; no raw source
  IDs or evidence quotes are rendered on the public landing page.
- No route, upload, checkout, pricing, parser, or paid/free gating behavior is
  changed.

## Deferred

- A future renderer-sharing refactor can export the paid report section
  renderers if the result page and landing preview need one render path.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - PASS;
  printed `Deflection Snapshot landing smoke tests passed.`
- `npm --prefix web run lint -- src/components/landing/DeflectionLockedReportPreview.tsx src/components/landing/DeflectionSnapshotLandingPage.tsx src/lib/deflection-report-demo.ts scripts/smoke-deflection-snapshot-landing.mjs scripts/test-deflection-snapshot-landing-smoke.mjs`
  - PASS; no ESLint diagnostics.
- `npm --prefix web run build` - PASS; Next build completed. It printed the
  existing edge-runtime static-generation warning.
- `git diff --check` - PASS.
- `bash scripts/local_pr_review.sh` - PASS.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | ~95 LOC |
| Demo report fixture | ~252 LOC |
| Locked preview component | ~333 LOC |
| Landing insertion | ~5 LOC |
| Smoke/test guards | ~131 LOC |
| Total | ~816 changed |
