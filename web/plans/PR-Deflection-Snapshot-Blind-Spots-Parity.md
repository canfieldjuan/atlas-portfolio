## Why this slice exists

Issue #324 notes that repeat-question cost and answer resolvability are
orthogonal signals. The results page already accepts and renders
`top_blind_spots` as no-proven-answer gaps, but the Snapshot landing artifact
still shows only proven-resolution rows plus locked rows. That makes the public
Snapshot example understate the high-cost-but-unresolved quadrant the report can
surface.

## Scope (this PR)

Slice phase: Functional validation

1. Render existing `top_blind_spots` data in the Snapshot landing artifact with
   the shared blind-spot row component.
2. Keep proven-resolution rows, locked rows, and no-proven-answer rows visually
   and textually distinct so no unresolved gap is implied to have a draft.
3. Extend the existing row-renderer sharing guard so the Snapshot landing stays
   aligned with the results page for blind-spot rows.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Blind-Spots-Parity.md` - plan contract for this slice.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - Snapshot artifact blind-spot rendering.
- `web/scripts/test-deflection-row-renderer-share.mjs` - parity guard for the shared blind-spot renderer.

## Mechanism

`SnapshotArtifact` defaults optional `top_blind_spots` to an empty array,
renders a no-proven-answer section only when rows exist, and delegates row
formatting/cost math to `DeflectionBlindSpotRows`. The existing shared row test
gets landing-page assertions that match the results page: the landing imports
the shared blind-spot renderer, passes `top_blind_spots` through, and preserves
copy that says these are unresolved support gaps rather than drafted answers.

## Intentional

- This slice uses the existing frontend `top_blind_spots` contract; it does not
  change ATLAS clustering, thresholds, or suppression reason generation.
- This does not expose source IDs, evidence quotes, or full answer bodies on the
  free Snapshot landing artifact.
- The landing artifact remains a representative demo; live uploaded results
  continue to render from the results page and its existing `top_blind_spots`
  handling.

## Deferred

- ATLAS-side cost thresholds, suppression reason taxonomies, and human override
  workflow remain out of scope for this frontend parity slice.
- Closing #324 fully likely needs a backend/report-generation slice that emits
  ranked unresolved gaps and suppression reasons from real uploads.

Parked hardening: none

## Verification

1. `npm --prefix web run test:deflection-row-renderer-share` - passed; verified
   the landing and results pages both use the shared top, locked, and blind-spot
   row renderers.
2. `npm --prefix web run lint` - passed with no eslint errors.
3. `npm --prefix web run build` - passed; Next compiled successfully.
4. `bash scripts/local_pr_review.sh` - passed; plan audits, drift advisory,
   dead-code baseline, eslint, Next build, and whitespace all passed.

## Estimated diff size

| Section | Size |
|---|---|
| Plan doc | ~73 |
| Snapshot artifact render | ~31 |
| Row-renderer guard | ~15 |
| Total | ~119 |
