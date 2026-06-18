## Why this slice exists

PR-Snapshot-Inline-Intake deferred result locked-range math while moving the CSV
form into the Snapshot hero. The Snapshot landing page already derives the
locked preview range from actual `locked_questions[].rank`, but the real results
page still assumes the first locked rank is `top_questions.length + 1`. If ATLAS
returns non-contiguous visible ranks or locked rows that do not immediately
follow the visible row count, the paid-report teaser can show the wrong rank
range.

## Scope (this PR)

Slice phase: Product polish

1. Update `DeflectionResultsPage` to derive locked backlog rank bounds from the
   actual locked-row ranks when they exist, matching the Snapshot landing page.
2. Preserve the existing fallback for snapshots that have no locked rows by
   using the max visible top-question rank plus one and `summary.generated`.
3. Add a focused source guard so the results page cannot silently regress to
   `top_questions.length + 1`.
4. Gate the rendered range on `firstLockedRank <= lastLockedRank` so the sparse
   no-locked fallback (non-contiguous visible ranks) cannot render a backwards
   range like `#7-#6`; fall back to a non-range "Complete ranked backlog" lead.

### Files touched

- `web/plans/PR-Snapshot-Locked-Rank-Range.md` - plan contract for this slice.
- `web/src/components/landing/DeflectionResultsPage.tsx` - locked range math.
- `web/scripts/test-deflection-row-renderer-share.mjs` - result-page range guard.

## Mechanism

`DeflectionResultsPage` now builds `lockedRanks` from
`locked_questions.map((question) => question.rank)`. When locked rows exist it
uses `Math.min(...lockedRanks)` and `Math.max(...lockedRanks)` for the range
shown in the full-report teaser. When no locked rows exist, it falls back to the
next rank after the max visible `top_questions[].rank` and the existing
`summary.generated` endpoint. The teaser renders the bold `#first-#last` range
only when `firstLockedRank <= lastLockedRank`; otherwise it drops the range and
leads with "Complete ranked backlog", matching the Snapshot landing page guard.

## Intentional

- This does not change the locked-row renderer or the Snapshot parser. It only
  fixes the result-page label that describes already-parsed ranks.
- The fallback stays compatible with snapshots that expose only visible rows and
  `summary.generated`.
- The Snapshot landing page is left unchanged because it already uses the
  actual locked-rank bounds.

## Deferred

Live ATLAS generation details remain outside this portfolio UI slice.

Parked hardening: none

## Verification

1. `npm --prefix web run test:deflection-row-renderer-share` - passed; verified
   the results page derives locked rank bounds from `locked_questions[].rank` and
   no longer uses `top_questions.length + 1`.
2. `rg -n "top_questions\\.length \\+ 1|lockedRanks|firstLockedRank|lastLockedRank" web/src/components/landing/DeflectionResultsPage.tsx web/scripts/test-deflection-row-renderer-share.mjs` - passed; the stale formula is absent from runtime source and the new rank-bound derivation is present.
3. `npm --prefix web run lint` - passed with no eslint errors.
4. `npm --prefix web run build` - passed; Next compiled and prerendered the app.
5. `bash scripts/local_pr_review.sh` - passed; plan audits, drift advisory,
   dead-code baseline, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Section | Size |
|---|---|
| Plan doc | ~80 |
| Results page rank math + inverted-range guard | ~20 |
| Source guard (regression asserts, both pages) | ~25 |
| Total | ~120 |
