# PR-Deflection-Review-Decisions-API

## Why this slice exists

Issue #324 needs a real reviewer override workflow for suppressed repeat rows. ATLAS now emits a hosted-safe `review_key`, so Portfolio can persist reviewer decisions without storing raw repeat IDs, cluster IDs, source IDs, evidence quotes, or customer question text as the key.

This slice builds the backend foundation first: refresh the report-model contract, add a small decision table, and expose a route that accepts only valid `review_key` values from the unlocked report model. It intentionally exceeds the 400-LOC soft cap because the smallest useful backend vertical needs contract alignment, schema, persistence, route validation, and route-level smoke coverage together.

## Scope (this PR)

Slice phase: Vertical slice

1. Refresh the generated report-model contract from merged ATLAS so `suppressed_repeat_review_queue.items[]` includes `review_key`.
2. Update the local demo report fixture so the required field remains present in the sample model.
3. Add a `portfolio_deflection_review_decisions` table keyed by `(request_id, review_key)`.
4. Add lazy Neon persistence helpers for listing and upserting review decisions.
5. Add a node runtime API route for reading/upserting decisions after validating the report is unlocked and the `review_key` exists in the current hosted-safe report model.
6. Add a focused route smoke test covering invalid input, locked reports, unknown keys, successful upsert, and the no-customer-wording persistence boundary.
7. Enroll the focused route smoke test in CI so the new `test:*` script cannot drift outside the pre-push workflow.

### Files touched

- `.github/workflows/pre_push_audit.yml` — enrolls the focused API test script in CI.
- `web/package.json` — adds the focused test script.
- `web/plans/PR-Deflection-Review-Decisions-API.md` — this plan.
- `web/plans/deflection-snapshot-report-groundtruth.json` — locked preview shape ground truth.
- `web/scripts/test-deflection-review-decisions-api.mjs` — route-level smoke coverage.
- `web/sql/003_deflection_review_decisions.sql` — persistence table.
- `web/src/app/api/deflection-review-decisions/route.ts` — read/write API.
- `web/src/lib/deflection-report-demo.ts` — sample model required-field alignment.
- `web/src/lib/deflection-report-model-contract.ts` — regenerated ATLAS report contract.
- `web/src/lib/deflection-review-decisions-database.ts` — lazy Neon persistence helpers.

## Mechanism

The API accepts `requestId`, `reviewKey`, and `decision`. `requestId` uses the existing deflection request-id shape, `reviewKey` must match the ATLAS-generated `review_[24 hex chars]` shape, and `decision` is restricted to `keep_suppressed` or `promote_to_review`.

Before any write, the route fetches the paid report model from ATLAS. Locked reports return `403`, missing reports return `404`, and upstream/config failures return `503`. A decision is accepted only when the requested key is present in `suppressed_repeat_review_queue.items[]`; this keeps Portfolio from persisting arbitrary keys or using customer wording as identity.

The database table stores the request ID, review key, decision, and timestamps. It intentionally does not store question text, source IDs, evidence, raw repeat keys, or cluster IDs.

## Intentional

- This slice does not render controls in the paid report page. Keeping API/storage separate makes the next UI slice smaller and lets review focus on the privacy and persistence contract.
- POST fails closed when persistence is not configured. GET still validates report access before returning decisions, so callers cannot use the endpoint as a report-existence oracle beyond the existing paid-result access boundary.
- The table uses `text` for `request_id` because ATLAS report IDs are not guaranteed to be UUIDs.

## Deferred

- UI follow-up: render per-row controls in `SuppressedRepeatReviewQueue`, call this API, and display saved decision state.
- Future ATLAS follow-up: feed reviewer decisions back into report generation if overrides should regenerate exports instead of annotating the hosted report.

Parked hardening: none.

## Verification

- `npm --prefix web run generate:deflection-contracts -- --report-model-source /home/juan-canfield/Desktop/Atlas/worktrees/deflection-suppressed-repeat-review-queue/portfolio-ui/src/types/deflectionReportModel.ts` - passed.
- `npm --prefix web run test:deflection-review-decisions` - passed.
- `node web/scripts/audit-test-enrollment.mjs` - passed after enrolling `test:deflection-review-decisions` in CI.
- `npm --prefix web run check:deflection-contracts -- --report-model-source /home/juan-canfield/Desktop/Atlas/worktrees/deflection-suppressed-repeat-review-queue/portfolio-ui/src/types/deflectionReportModel.ts` - passed.
- `npm --prefix web run test:deflection-report-model-result-page` - passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed after updating the locked report-model ground truth for `review_key`.
- `./node_modules/.bin/eslint src/app/api/deflection-review-decisions/route.ts src/lib/deflection-review-decisions-database.ts` from `web/` - passed.
- `npm --prefix web run build` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `.github/workflows/pre_push_audit.yml` | ~3 |
| `web/package.json` | ~1 |
| `web/plans/PR-Deflection-Review-Decisions-API.md` | ~82 |
| `web/plans/deflection-snapshot-report-groundtruth.json` | ~1 |
| `web/scripts/test-deflection-review-decisions-api.mjs` | ~209 |
| `web/sql/003_deflection_review_decisions.sql` | ~13 |
| `web/src/app/api/deflection-review-decisions/route.ts` | ~116 |
| `web/src/lib/deflection-report-demo.ts` | ~1 |
| `web/src/lib/deflection-report-model-contract.ts` | ~5 |
| `web/src/lib/deflection-review-decisions-database.ts` | ~131 |
| **Total** | **~562** |

Soft cap note: over 400 LOC; kept as one PR because storage, access validation, and smoke coverage are the indivisible backend path for reviewer decisions.
