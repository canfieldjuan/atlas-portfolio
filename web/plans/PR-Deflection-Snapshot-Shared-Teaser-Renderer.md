## Why this slice exists

Issue #245 found that `/systems/support-ticket-deflection/snapshot` renders the
demo Snapshot through bespoke marketing components while the real post-upload
results page renders the same contract through separate production components.
That drift is most risky around the teaser answer because it is the visible
"one answer you can inspect" proof point. This slice starts the structural fix
by making the landing page and results page share the production teaser answer
and teaser-preview cards.

This does not close #245 by itself. It deliberately takes the first thin
extraction so the larger question-row, cost-projection, and full-report-demo
decisions can follow without a large mixed refactor. The diff is slightly over
the 400 LOC soft cap because the slice moves one duplicated teaser renderer into
a new shared file, deletes both old local renderers, and updates the focused
guard in the same reviewable step.

## Scope (this PR)

Slice phase: Product polish

1. Extract the rank-aware teaser answer label, answer card, and blurred preview
   card from `DeflectionResultsPage.tsx` into a shared landing component.
2. Replace the `/snapshot` landing page's bespoke `AnswerTeaser` and
   `PreviewPill` renderers with the shared production teaser components.
3. Keep the Snapshot landing route, hero proof panel, artifact section, top
   question rows, locked question rows, cost band, CTA href/label, metadata,
   intake flow, result page behavior, checkout behavior, and smoke markers
   unchanged.
4. Update the teaser rank-copy guard so it follows the helper to the shared
   component and proves the landing page imports the shared renderer.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Shared-Teaser-Renderer.md`
- `web/scripts/test-deflection-teaser-rank-copy.mjs`
- `web/src/components/landing/DeflectionResultsPage.tsx`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`
- `web/src/components/landing/DeflectionSnapshotTeaser.tsx`

## Mechanism

`DeflectionSnapshotTeaser.tsx` becomes the single source for:

- `teaserAnswerLabel(answer)`;
- `DeflectionTeaserAnswer`;
- `DeflectionTeaserPreviewCard`.

`DeflectionResultsPage.tsx` imports those shared exports and keeps its existing
section placement, checkout state, and copy around the teaser. The Snapshot
landing page imports the same answer and preview card components inside
`SnapshotArtifact`, deleting the older local `AnswerTeaser` and `PreviewPill`
implementations.

The focused guard moves its source read from `DeflectionResultsPage.tsx` to the
new shared component and adds an import assertion for
`DeflectionSnapshotLandingPage.tsx`, so a future drift back to bespoke teaser
rendering fails locally.

## Intentional

- This slice shares the answer teaser only. The landing page's top-question
  rows, locked-question rows, and cost proof band still differ from the real
  results page and remain part of #245.
- The shared teaser component keeps the production results-page styling. The
  landing artifact may look slightly more like the post-upload page after this
  PR; that is the point of this structural slice.
- No full-report artifact preview is introduced yet because #245 calls for an
  explicit product decision on whether prose is enough.
- No smoke marker changes are planned because the monitored landing strings
  stay intact.

## Deferred

- #245 follow-up: share or align top-question and locked-question row rendering
  so the landing page no longer shows `priority score` or separate locked-row
  styling.
- #245 follow-up: decide whether the landing page should reuse the results-page
  interactive Support Tax projection or keep the current marketing cost band as
  a separate proof section.
- #245 follow-up: decide whether to add a faithful full-report artifact preview
  or keep the paid report described in prose.
- Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-teaser-rank-copy` - passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3117` - passed against the local dev server.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser spot-check of `/systems/support-ticket-deflection/snapshot` desktop
  and mobile - passed; shared teaser preview copy rendered, the rank-aware
  teaser label appeared, no framework error overlay appeared, and mobile
  reported `hasHorizontalOverflow: false`.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~108 |
| Shared teaser component extraction | ~97 |
| Results page import/use cleanup | ~92 |
| Snapshot landing import/use cleanup | ~61 |
| Focused guard update | ~49 |
| Total | ~407 |

Slightly over the 400 LOC soft cap because this is an extraction/de-duplication
slice: the new shared renderer, two local deletions, and the guard update need to
land together for the landing page to stop drifting from the results page.
