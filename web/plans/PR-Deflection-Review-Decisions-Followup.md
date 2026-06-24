# PR-Deflection-Review-Decisions-Followup

## Why this slice exists

PR #379 landed the backend review-decision foundation, but the follow-up review found two remaining correctness gaps: older suppressed-repeat reports generated before `review_key` should still render, and configured storage query failures should return controlled API errors instead of generic 500s.

This slice keeps the merged backend foundation intact while tightening those edge cases before the UI controls slice builds on the endpoint.

## Scope (this PR)

Slice phase: Functional validation

1. Keep `suppressed_repeat_review_queue` rows renderable when they predate `review_key`.
2. Preserve `review_key` only when the hosted-safe suppressed row actually carries a string key.
3. Return controlled storage-unavailable `503` responses when configured list/upsert queries fail.
4. Refresh the generated report-model contract from ATLAS main so CI and the repo agree on the current source of truth.
5. Align the demo report fixture with the refreshed outcome-diagnostics scalar `status_mix` contract.
6. Extend focused route and real client-projection tests for both cases.

### Files touched

- `web/plans/PR-Deflection-Review-Decisions-Followup.md` — this plan.
- `web/scripts/test-deflection-report-model-result-page.mjs` — legacy suppressed queue projection coverage.
- `web/scripts/test-deflection-review-decisions-api.mjs` — configured storage failure coverage.
- `web/src/app/api/deflection-review-decisions/route.ts` — controlled storage failure responses.
- `web/src/lib/atlas-deflection-client.ts` — optional `review_key` projection for legacy-safe rendering.
- `web/src/lib/deflection-report-demo.ts` — demo fixture alignment with refreshed contract.
- `web/src/lib/deflection-report-model-contract.ts` — regenerated ATLAS report-model contract.

## Mechanism

The ATLAS client keeps the existing suppressed-repeat shape validation for display, but no longer requires `review_key` on every suppressed row. The safe projection adds `review_key` only when the source row includes a string key. The review-decision API already builds its allowlist from valid `review_[24 hex chars]` keys, so legacy rows remain visible but cannot be written to as reviewer decisions.

The API wraps list and upsert calls in narrow `try` blocks. If the database URL is configured but the migration is missing or Neon returns a transient query error, the endpoint returns a storage-unavailable `503`.

The generated report-model contract is refreshed from ATLAS main because CI checks against the live ATLAS checkout, and the merged #379 contract was behind that source.

## Intentional

- Rows without `review_key` are display-only for the review-decision feature; the API still rejects writes unless the key is present in the current hosted-safe report model.
- The storage failure response does not expose database details to the client.

## Deferred

- UI follow-up: render per-row controls and decide how to message rows that are visible but not review-decision eligible because they predate `review_key`.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-report-model-result-page` - passed.
- `npm --prefix web run test:deflection-review-decisions` - passed.
- `npm --prefix web run check:deflection-contracts -- --report-model-source /home/juan-canfield/Desktop/Atlas/worktrees/deflection-suppressed-repeat-review-queue/portfolio-ui/src/types/deflectionReportModel.ts` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Review-Decisions-Followup.md` | ~58 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | ~40 |
| `web/scripts/test-deflection-review-decisions-api.mjs` | ~12 |
| `web/src/app/api/deflection-review-decisions/route.ts` | ~18 |
| `web/src/lib/atlas-deflection-client.ts` | ~19 |
| `web/src/lib/deflection-report-demo.ts` | ~2 |
| `web/src/lib/deflection-report-model-contract.ts` | ~255 |
| **Total** | **~417** |

Soft cap note: over 400 LOC because the generated contract refresh is required for CI to match ATLAS main.
