## Why this slice exists

Atlas now emits a paid-only `suppressed_repeat_review_queue` section for repeat questions that were kept out of the headline action lanes. Portfolio needs to consume that contract without letting those rows vanish, so issue #324 can show both the expensive unresolved lanes and the honest review queue for hidden/noisy repeats.

## Scope (this PR)

Slice phase: Functional validation

1. Regenerate the paid report-model contract from the merged ATLAS producer contract so Portfolio recognizes `suppressed_repeat_review_queue`.
2. Project the new section through the server-side ATLAS client with the same private-field scrubbing used by existing action queues, keeping only the suppression reason fields in addition to hosted-safe action fields.
3. Render the new paid section on the hosted report page and locked full-report preview so hidden repeat questions explain why they were hidden.
4. Update the demo report and ground-truth fixture so the sample report shape stays aligned with the real backend contract.
5. Extend the existing report-model and landing smoke tests to cover the new section and content-vs-product/ops framing.

### Files touched

- `web/plans/PR-Deflection-Suppressed-Review-Render.md` - slice contract.
- `web/plans/deflection-snapshot-report-groundtruth.json` - paid report shape ground truth.
- `web/src/lib/deflection-report-model-contract.ts` - generated paid report-model contract.
- `web/src/lib/deflection-report-demo.ts` - demo report fixture for locked preview.
- `web/src/lib/atlas-deflection-client.ts` - hosted-report validation and scrubbing for the new section.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - hosted report renderer.
- `web/src/components/landing/DeflectionLockedReportPreview.tsx` - locked full-report preview renderer.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - public landing marker smoke contract.
- `web/scripts/test-deflection-report-model-result-page.mjs` - report-model route/client/page smoke coverage.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - landing locked-preview smoke coverage.

## Mechanism

The generated contract is refreshed from ATLAS `portfolio-ui/src/types/deflectionReportModel.ts`, which now declares `suppressed_repeat_review_queue` with `items`, `total_item_count`, `default_limit`, and `reason_counts`. The server client validates that section as a bounded action-item queue, strips the same private fields removed from other hosted action sections, and preserves `suppression_reason` plus `suppression_reason_label` for the review UI.

The hosted report page adds a new table section for suppressed repeats. It presents the question, hide reason, repeat count, cost, CSAT, owner lane, and recommended review action. The existing unresolved and covered-recurring sections get copy that names the split explicitly: missing-answer content gaps versus product/process gaps where documentation alone is not carrying the load.

The locked preview mirrors the new section from the demo report fixture. The landing smoke test keeps the preview section order and fixture shape aligned with `deflection-snapshot-report-groundtruth.json`, while the report-model result-page test verifies validation, projection, private-field scrubbing, and renderer ownership.

## Intentional

The slice does not add `already_deflected` suppression. That reason requires published help-center content as a new input and was explicitly deferred from issue #324.

The suppressed queue is rendered on `web` and previewed as part of the paid report shape, but it is not promoted into Snapshot copy. Snapshot remains a gate; the full report owns the review queue.

The page remains bounded. Complete raw evidence, source IDs, and quote trails stay out of the hosted page and remain in the evidence export.

## Deferred

Published-help-center deduplication and any future `already_deflected` suppression reason stay deferred until the product accepts a help-center corpus input.

No reviewer override workflow is added in this slice; this only exposes the queue and reasons in the paid report UI.

Parked hardening: none

## Verification

Completed locally:

- `npm --prefix web run generate:deflection-contracts -- --report-model-source /home/juan-canfield/Desktop/Atlas/worktrees/deflection-suppressed-repeat-review-queue/portfolio-ui/src/types/deflectionReportModel.ts` - passed; generated the paid report-model contract from the merged ATLAS source.
- `npm --prefix web run test:deflection-report-model-result-page` - passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run check:deflection-contracts -- --report-model-source /home/juan-canfield/Desktop/Atlas/worktrees/deflection-suppressed-repeat-review-queue/portfolio-ui/src/types/deflectionReportModel.ts` - passed.
- `if rg "low_confidence_cluster|already_deflected" web/src web/scripts; then exit 1; fi` - passed; source and test code do not claim the removed or deferred reasons.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan and ground-truth fixtures | ~115 |
| Generated contract and demo fixture | ~135 |
| Client projection and renderer | ~185 |
| Smoke tests | ~95 |
| Total | ~530 |

The slice is over the 400-LOC soft cap because contract generation, server projection, renderer, fixtures, and smoke coverage must move together to prevent another report-shape drift.
