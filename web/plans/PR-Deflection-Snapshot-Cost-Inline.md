## Why this slice exists

Issue #371 asks the Snapshot landing demo to present the existing product shape
more faithfully. The current page renders the representative Snapshot artifact
first, then renders the interactive Support Tax projection in a separate muted
band below it. That makes the cost proof feel detached from the Snapshot block
it explains.

This slice handles only Part A from #371: move the existing cost projection into
the Snapshot artifact. The later locked full-report preview stays deferred so
this PR remains a small relocation instead of a new paid-report fixture slice.

## Scope (this PR)

Slice phase: Product polish

1. Move the existing `DeflectionSupportTaxProjection` render into
   `SnapshotArtifact` so the Snapshot block contains the interactive cost proof.
2. Preserve the parent-owned `assistedContactCost` state and thread the setter
   into the projection's new home so the slider keeps updating the landing
   preview.
3. Remove the now-empty separate `CostProofBand` wrapper.
4. Preserve the monitored `supportTaxProjection assistedContactCost valueAnchor`
   smoke markers with the projection.
5. Add a source-level guard that prevents the old separate cost band from
   returning.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Cost-Inline.md` - plan for this slice.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - move the
  shared projection into the Snapshot artifact and pass the existing state
  setter through.
- `web/scripts/test-deflection-cost-projection-share.mjs` - guard the inline
  placement and removal of the separate cost band.

## Mechanism

`DeflectionSnapshotLandingPage` continues to own `assistedContactCost` and
`setAssistedContactCost`. The page passes both values into `SnapshotArtifact`.
`SnapshotArtifact` renders the same `DeflectionSupportTaxProjection` that the
old `CostProofBand` rendered, with the same `repeatTicketCount`,
`sourceWindow`, `subjectLabel`, `valueAnchor`, CTA action, and smoke marker.

Because the projection is now inside the Snapshot artifact, the separate
`CostProofBand` function and its post-Snapshot section render are removed. No
cost formula, fixture value, route, CTA destination, upload behavior, checkout
behavior, or paid-report shape changes.

The cost-projection sharing guard keeps asserting that the Snapshot landing
imports and renders the shared projection, owns a single assisted-contact cost
state, and passes `onAssistedContactCostChange={setAssistedContactCost}`. This
slice adds checks that `CostProofBand` is gone and that the projection still
carries the live smoke markers.

## Intentional

- This PR does not add Part B from #371. A faithful locked full-report preview
  needs a generator-derived `DeflectionStructuredReport` fixture or shared real
  report renderers, which is a larger slice.
- The Snapshot artifact already has a compact Support Tax metric in its header;
  this slice keeps that scan-level metric and adds the interactive projection
  beneath the artifact header as deeper proof.
- The projection styling remains the shared component's styling so landing and
  results pages stay visually and mechanically aligned.

## Deferred

- #371 Part B remains open: add a locked preview of every paid report section,
  backed by real report shape rather than hand-drawn marketing rows.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - PASS; installed this fresh worktree's dependencies.
  The install reported the existing dependency audit findings (1 low, 3
  moderate, 2 high).
- `npm --prefix web run test:deflection-cost-projection-share` - PASS; printed
  `Deflection cost projection sharing guard passed.`
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - PASS; printed
  `Deflection Snapshot landing smoke tests passed.`
- `npm --prefix web run lint -- src/components/landing/DeflectionSnapshotLandingPage.tsx scripts/test-deflection-cost-projection-share.mjs`
  - PASS; no ESLint diagnostics.
- `npm --prefix web run build` - PASS; Next build completed. It printed the
  existing edge-runtime static-generation warning.
- `git diff --check` - PASS.
- `bash scripts/local_pr_review.sh` - PASS.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | ~100 LOC |
| Snapshot landing relocation | ~70 LOC |
| Cost-projection guard | ~20 LOC |
| Total | ~190 changed |
