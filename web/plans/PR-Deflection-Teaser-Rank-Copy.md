# PR-Deflection-Teaser-Rank-Copy

## Why this slice exists

ATLAS PR #1288 changed the snapshot teaser to expose the first eligible answer
by rank, and ATLAS PR #1291 removed the full teaser rank from locked rows when a
fall-through teaser lands beyond `top_n`. The portfolio results page already
prints the numeric rank, but its teaser label is still generic and the local
demo fixture still models the older rank-4 teaser.

This slice makes the visible teaser copy honest to the new contract: say "#1
most-asked" only when the payload rank is actually 1, otherwise name the real
rank. It also updates the demo fixture so local renders match the production
default coming from current ATLAS.

## Scope (this PR)

Slice phase: Product polish

1. Add a small rank-aware teaser label helper for the production results page.
2. Replace the generic teaser card label with that helper's output.
3. Update the demo snapshot fixture so the full teaser answer is rank 1, with
   previews on later eligible ranks.
4. Preserve parser, API, checkout, paid gating, and no-leak behavior.

### Files touched

- `web/plans/PR-Deflection-Teaser-Rank-Copy.md`
- `web/src/components/landing/DeflectionResultsPage.tsx`
- `web/src/lib/deflection-snapshot.ts`
- `HARDENING.md`

## Mechanism

`DeflectionResultsPage` receives the allowlisted `snapshot.teaser.full_answer`
payload. The new helper reads only `answer.rank`:

```ts
function teaserAnswerLabel(answer: DeflectionSnapshotFullAnswer) {
  return answer.rank === 1
    ? 'Sample answer for your #1 most-asked question'
    : `Sample answer for ranked question #${answer.rank}`;
}
```

The card label calls this helper. The broader section marker remains generic so
hosted smoke checks do not require every live report to have a rank-1 teaser.

## Intentional

- No hardcoded "#1" appears without checking `answer.rank === 1`.
- No new snapshot field is introduced. The existing rank is the only source of
  truth for this copy.
- The snapshot landing page is left unchanged because it already renders the
  actual rank and is not the paid-checkout results surface.
- No checkout, API, parser, or paid-unlock behavior changes.

## Deferred

- Further article-card styling for the teaser remains a separate frontend
  polish slice if the operator wants a richer help-center treatment.
- Parked hardening: `NPM-AUDIT-WEB-1 — web dependency audit findings`.
  `npm --prefix web ci` reports existing dependency audit findings that are not
  introduced by this copy/fixture slice.

## Verification

Ran before push:

- `node web/scripts/test-deflection-hosted-results-smoke.mjs` - passed
- `node web/scripts/test-deflection-browser-upload-smoke.mjs` - passed
- `npm --prefix web ci` - passed; reported existing 3 audit findings, parked in `HARDENING.md`
- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed
- `rg -n "Sample Drafted Answer|Sample answer for your #1 most-asked question|Sample answer for ranked question" web/src web/scripts -S` - old label absent; rank-aware labels present
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| Results teaser copy | ~10 |
| Demo fixture | ~20 |
| Parked hardening | ~12 |
| **Total** | **~117** |
