## Why this slice exists

PR-Deflection-Review-Decisions-API added the privacy-safe persistence layer for suppressed repeat reviewer decisions, but the paid hosted report still shows those rows as static text. Issue #324 needs the hosted report to become the decision surface, so a reviewer can promote a suppressed row for review or explicitly keep it suppressed without leaving the result page.

This vertical slice connects the existing API to the suppressed repeat review queue only. It proves the real end-to-end path from hosted-safe `review_key` to `/api/deflection-review-decisions` without expanding export regeneration, downstream queue mutation, or raw evidence exposure.

## Scope (this PR)

Slice phase: Vertical slice

1. Pass the paid report `requestId` into the suppressed repeat review queue renderer.
2. Render per-row review controls only from the hosted-safe `review_key` already present in `suppressed_repeat_review_queue.items[]`.
3. Fetch saved decisions from `/api/deflection-review-decisions?requestId=...` and display the current saved state.
4. POST `keep_suppressed` or `promote_to_review` decisions to the existing API with pending, saved, unconfigured, and error states.
5. Extend the existing report-model result-page smoke test for the UI/API wiring without adding a new test script.

### Files touched

- `web/plans/PR-Deflection-Review-Controls.md` - slice contract.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - passes `requestId` and `review_key` into the row controls.
- `web/src/components/landing/DeflectionReviewDecisionControl.tsx` - client-side decision fetch/save controls.
- `web/scripts/test-deflection-report-model-result-page.mjs` - source-level smoke coverage for the hosted review-control wiring.

## Mechanism

`DeflectionReportModelPage` keeps rendering the report model as a server component. For the `suppressed_repeat_review_queue` section, it now passes `requestId` to `SuppressedRepeatReviewQueue`, and each row passes its hosted-safe `review_key` into a small client component.

The client component fetches the current decision list once per `requestId` using the existing `/api/deflection-review-decisions` route, finds the matching row decision locally, and posts updates back to that route. It never displays the `review_key`, source IDs, evidence quotes, or raw customer identifiers; the key is used only as the opaque API handle. If storage is unconfigured or the API fails, the controls stay visible but disabled with a status message.

## Intentional

- No export regeneration or queue mutation in this slice. The API records reviewer intent; downstream use of those decisions is deferred.
- No new route or persistence logic. This PR consumes the API from PR-Deflection-Review-Decisions-API rather than changing its security boundary.
- No new npm test script. The existing report-model result-page smoke test already owns this page wiring and avoids another CI-enrollment edit.

## Deferred

- Apply saved decisions to exported artifacts, downstream review queues, or ATLAS-side regenerated report state.
- Add broader browser-level interaction coverage after the first hosted control path lands.

Parked hardening: none

## Verification

- `npm --prefix web ci` - passed; npm reported the existing audit advisory set (6 vulnerabilities) without changing files.
- `npm --prefix web run test:deflection-report-model-result-page` - passed.
- `node web/scripts/audit-test-enrollment.mjs` - passed; all 34 `test:*` scripts are enrolled.
- `./node_modules/.bin/eslint src/components/landing/DeflectionReportModelPage.tsx src/components/landing/DeflectionReviewDecisionControl.tsx` from `web/` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed after rebasing on #380.

## Estimated diff size

| File | Estimate |
|---|---:|
| `web/plans/PR-Deflection-Review-Controls.md` | ~60 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | ~15 |
| `web/src/components/landing/DeflectionReviewDecisionControl.tsx` | ~265 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | ~55 |
| Total | ~395 |
