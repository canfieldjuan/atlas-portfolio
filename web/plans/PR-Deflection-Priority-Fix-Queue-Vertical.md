# PR-Deflection-Priority-Fix-Queue-Vertical

## Why this slice exists

#1612's latest sequencing note says S3 should stop adding horizontal model
layers and cut one buyer-visible section end-to-end. ATLAS S1/S2 now emit the
paid `priority_fix_queue` section with deterministic `priority_score`,
`priority_drivers`, status, CSAT, owner lane, fix type, confidence, and
recommended action. The hosted buyer result page currently renders the older
`ranked_questions` / `question_details` sections but skips the new priority
queue entirely, so the S1/S2 value is not observable to a buyer/operator.

This slice is the smallest vertical proof for that contract: validate the
incoming priority-queue shape, render the top bounded rows on the paid result
page, and extend the hosted-results smoke so the model-backed full report must
show the action queue while legacy paid reports remain tolerated.

Review follow-up root cause: the first validator version checked less than the
renderer consumed, so malformed cost-basis metadata, malformed CSAT metrics, or
an explicit zero row cap could still produce misleading paid output. This push
fixes the root in the validation/render contract: every priority-queue field the
renderer reads is either validated before render or, for `result_page_limit: 0`,
preserved as an explicit cap instead of falling through to the default.

The final diff is over the 400 LOC soft cap because the review fix adds the
required fail-closed regression fixtures to the same validator/renderer boundary.
Splitting those tests out would leave this buyer-visible slice knowingly under
protected.

Second review follow-up root cause: the same validator/render contract still
left three values fail-open. A model-backed report could omit the priority
section, malformed status counts could disappear from the summary, and malformed
ranks could be floored/clamped for buyers. This push closes that class by
requiring the section for `deflection.v1` model reports and validating
renderer-read counts/ranks before render.

Third review follow-up root cause: a valid explicit zero result-page cap kept
the data contract intact but returned `null` from the renderer, hiding the
required action section marker. Fractional limits also still accepted malformed
input and floored it at render time. This push keeps zero-cap sections visible
with an empty state and requires priority queue limits to be integers.

## Scope (this PR)

Slice phase: Vertical slice

1. Add a fail-closed web-section validator for `priority_fix_queue` rows.
2. Render the paid model's `priority_fix_queue` as a bounded operating table on
   `/systems/support-ticket-deflection/results/{requestId}` when the report-model
   route is unlocked.
3. Keep the render to this one action section: no top-unresolved, drafted
   resolutions, already-covered callout, email, or PDF changes.
4. Extend the hosted-results smoke to require the priority queue on model-backed
   full reports while keeping historical legacy full reports valid.

### Files touched

- `web/src/lib/atlas-deflection-client.ts`
- `web/src/components/landing/DeflectionReportModelPage.tsx`
- `web/scripts/smoke-deflection-hosted-results.mjs`
- `web/scripts/test-deflection-hosted-results-smoke.mjs`
- `web/scripts/test-deflection-report-model-result-page.mjs`
- `web/plans/PR-Deflection-Priority-Fix-Queue-Vertical.md`

## Mechanism

`atlas-deflection-client.ts` requires model-backed reports to include
`priority_fix_queue` and validates `priority_fix_queue.data.items` before the
model reaches the renderer. It checks the fields the result page needs:
positive-integer rank, question, status, owner lane, fix type, confidence,
recommended action, ticket count, estimated cost, priority score, CSAT
status/count/average metrics, numeric status counts, cost basis status, and
integer result/PDF/backlog limits, and driver labels. Malformed web
priority-queue sections reject the model instead of rendering partial or
misleading rows.

`DeflectionReportModelPage` adds a `PriorityFixQueue` section. It reads
`result_page_limit` / `default_limit`, caps locally to the result-page maximum,
honors explicit zero as a valid cap, and renders only the top rows with status,
repeat count, estimated cost, CSAT signal, owner lane, confidence, priority
score, and recommended action. Explicit zero caps keep the section marker
visible and render an empty state instead of omitting the action queue. It does
not render `top_evidence`, raw source IDs, evidence quotes, or representative
phrasing in this first vertical.

The hosted-results smoke chooses marker sets based on the rendered paid report
shape. Model-backed reports must include `Priority Fix Queue`; legacy full
reports keep their existing markers so older paid artifacts do not fail the
read-only smoke.

## Intentional

- No Snapshot expansion. The free results path still renders `DeflectionSnapshot`
  only; paid priority fields stay behind the unlocked report-model route.
- No renderer sweep. S3A validates one action section before adding the rest.
- No evidence/snippet rendering. Evidence stays in the export until the
  dedicated snippet-bearing section lands with its own scrub/projection tests.
- No visual redesign of the paid page. This PR follows the existing report-model
  section rhythm to keep the diff reviewable.
- `result_page_limit: 0` is honored as "show no priority rows" rather than
  rejected, because the model contract already treats the limit as
  non-negative.

## Deferred

- S3B: top unresolved repeats vertical with snippet/phrasing safeguards.
- S3C: drafted resolutions vertical.
- S3D: already-covered-still-recurring callout.
- S4: curated email/PDF refresh.
- S5: cross-surface QA scorecard updates beyond the hosted-results smoke marker.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-report-model-result-page`
  - Pass: `Deflection report-model result page tests passed.`
  - Covers invalid priority score, invalid cost-basis status, invalid CSAT
    counts, invalid status-count values, missing priority queue sections,
    invalid ranks, fractional limits, and explicit zero result-page limits with
    visible empty-state rendering.
- `npm --prefix web run test:deflection-hosted-results-smoke`
  - Pass: `Deflection hosted results smoke tests passed.`
- `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts src/components/landing/DeflectionReportModelPage.tsx scripts/smoke-deflection-hosted-results.mjs scripts/test-deflection-hosted-results-smoke.mjs scripts/test-deflection-report-model-result-page.mjs`
  - Pass.
- `bash scripts/local_pr_review.sh` - Pass.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/lib/atlas-deflection-client.ts` | +54 / -0 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | +128 / -1 |
| `web/scripts/smoke-deflection-hosted-results.mjs` | +21 / -5 |
| `web/scripts/test-deflection-hosted-results-smoke.mjs` | +14 / -0 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | +260 / -1 |
| `web/plans/PR-Deflection-Priority-Fix-Queue-Vertical.md` | +138 / -0 |
| **Total** | **622 LOC** |
