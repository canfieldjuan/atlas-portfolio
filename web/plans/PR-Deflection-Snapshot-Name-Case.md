## Why this slice exists

PR-Deflection-Snapshot-Support-Tax-Fomo strengthened the Snapshot landing page,
and review explicitly carried forward a capitalization nit: the page treats
`Snapshot` as a named artifact in most places, but a few user-facing strings
still used lowercase `snapshot` when referring to the product artifact.

This slice makes the offer name consistent without changing positioning,
layout, routes, pricing, checkout, payloads, or tests.

## Scope (this PR)

Slice phase: Product polish

1. Capitalize `Snapshot` in the hero description.
2. Capitalize `Snapshot` in the proof-panel free/full boundary label.
3. Capitalize `Snapshot` in the customer-wording proof copy.
4. Capitalize `Snapshot` in the final-push heading.
5. Preserve all CTA labels, hrefs, layout, cost math, locked-row copy, intake,
   checkout, results, and smoke scripts.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Name-Case.md`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`

## Mechanism

This is a copy-only edit in `DeflectionSnapshotLandingPage.tsx`: visible strings
that refer to the Snapshot as the named product artifact now capitalize it.
Instance-referent phrases like `this representative snapshot` or `the snapshot
below` remain lowercase. No component structure, props, data, or styles change.

## Intentional

- This does not reword the offer or change any CTA.
- This does not touch the live results-page #196 redesign work.
- This does not change long-page, partner-page, or legacy-config behavior.

## Deferred

- Broader style-guide decisions for every product noun remain out of scope.
- Parked hardening: none.

## Verification

Run before push:

- `rg -ni "snapshot" web/src/components/landing/DeflectionSnapshotLandingPage.tsx | grep -viE "deflection-snapshot|DeflectionSnapshot|DEMO_DEFLECTION_SNAPSHOT|snapshotCostProof|PrimarySnapshotCta|SnapshotQuestionRows|SnapshotArtifact|snapshot=|= snapshot|snapshot\\.|snapshot,|: snapshot|snapshot:"` - passed; product-artifact references use `Snapshot`, with remaining lowercase instances limited to instance-referent `uploaded snapshot` / `snapshot below` copy.
- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~66 |
| Copy-only Snapshot capitalization | ~4 |
| Total | ~68 |
