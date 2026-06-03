# PR-Deflection-Teaser-Rank-Guard

## Why this slice exists

PR #209 made the results-page teaser label rank-aware so the page says
"#1 most-asked" only when `teaser.full_answer.rank === 1`. A concurrent redesign
branch rewrites the same `TeaserAnswer` component and can accidentally bring
back the stale static "Sample Drafted Answer" label. That would silently undo
the truthfulness fix if the redesign merged second.

This slice turns the coordination warning into a durable guard: CI now checks
the results component and demo fixture for the rank-aware teaser contract.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a focused Node test that reads the results component source and fails if
   the static teaser label returns.
2. Assert the rank-aware label still gates "#1 most-asked" on
   `answer.rank === 1` and renders a fallback label with the real rank.
3. Assert the demo snapshot fixture still models a rank-1 full teaser answer
   with later ranks as previews.
4. Enroll the test in `web/package.json` and the pre-push audit workflow so it
   runs in CI.

### Files touched

- `web/plans/PR-Deflection-Teaser-Rank-Guard.md`
- `web/scripts/test-deflection-teaser-rank-copy.mjs`
- `web/package.json`
- `.github/workflows/pre_push_audit.yml`

## Mechanism

The test intentionally operates at the source boundary because the regression
risk is a component rewrite that reintroduces a literal label. It checks:

```js
assert.equal(resultsSource.includes('Sample Drafted Answer'), false);
assert.match(resultsSource, /answer\.rank === 1/);
assert.match(resultsSource, /Sample answer for your #1 most-asked question/);
assert.match(resultsSource, /Sample answer for ranked question #/);
```

It also scans the demo fixture to keep the local fallback aligned with the
current ATLAS rank-first default.

## Intentional

- This does not require the live hosted-results smoke to see a rank-1 teaser.
  Live reports can truthfully fall through to rank N, so the guard stays on the
  component/fixture contract instead of public HTML markers.
- This does not change runtime behavior. It only prevents future PRs from
  reverting the already-merged rank-aware copy.
- The existing `NPM-AUDIT-WEB-1` hardening entry remains parked; this slice does
  not change dependencies.

## Deferred

- Broader visual regression coverage for the full redesigned results page is
  deferred to a separate frontend QA slice.
- Parked hardening: none added. Existing `NPM-AUDIT-WEB-1` remains parked and
  unrelated to this test-only slice.

## Verification

Ran before push:

- `node web/scripts/test-deflection-teaser-rank-copy.mjs` - passed
- `npm --prefix web run test:deflection-teaser-rank-copy` - passed
- `npm --prefix web ci` - passed; repeated existing `NPM-AUDIT-WEB-1` findings already parked
- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~80 |
| Source regression test | ~45 |
| Package/workflow enrollment | ~5 |
| **Total** | **~130** |
