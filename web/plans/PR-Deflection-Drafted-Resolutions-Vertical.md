## Why this slice exists

#1612 is reshaping the paid deflection report into an operating report that a
support lead can use immediately. #345 added `priority_fix_queue`; #348 added
`top_unresolved_repeats` and tightened the action-section boundary so raw
evidence fields do not ride into the hosted-page payload. The next smallest
vertical is `drafted_resolutions`: show the buyer which repeat questions already
have a resolution path ready to review, without dumping source IDs, customer
phrasing, or evidence quotes into the page data.

This keeps the S3 rollout one section at a time. It proves the parser,
allowlist projection, hosted render, and smoke marker for drafted resolutions
before the report expands into already-covered recurrence or a denser email/PDF
surface.

## Scope (this PR)

Slice phase: Vertical slice

1. Add fail-closed web validation for the `drafted_resolutions` section.
2. Construct `drafted_resolutions` page data through the shared safe action-item
   projection.
3. Render a bounded hosted result-page section for drafted resolutions.
4. Extend the model-backed full-report smoke marker so current paid reports must
   include the drafted-resolution section.
5. Add focused regression coverage for malformed drafted-resolution shapes and
   export-only field stripping.

### Files touched

- `web/plans/PR-Deflection-Drafted-Resolutions-Vertical.md` - this plan.
- `web/src/lib/atlas-deflection-client.ts` - report-model validation and safe construction for the new section.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - result-page rendering for drafted resolutions.
- `web/scripts/smoke-deflection-hosted-results.mjs` - required model-backed full-report marker.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - smoke marker fixture coverage.
- `web/scripts/test-deflection-report-model-result-page.mjs` - parser/projection/render regression coverage.

## Mechanism

`atlas-deflection-client.ts` will accept `drafted_resolutions` only when the
section data has a valid action-row array and a `top_item_count` that matches the
rows being projected into the result-page model. The section then passes through
`constructSafeActionSection`, which keeps only the fields the hosted page needs:
rank, question, status, owner lane, confidence, recommended action, ticket
count, estimated support cost, priority score, priority drivers, and the bounded
CSAT signal.

`DeflectionReportModelPage` will render a capped `Drafted Resolutions` table for
web sections only. It uses the same safe row fields as the other action
sections and points buyers to the evidence export for complete source detail.

The smoke test adds a stable marker for model-backed full reports. The model
test pins the safe payload key set across all action sections so backend-only
fields such as `recommended_title`, `representative_phrasing`, `source_ids`,
`top_evidence`, `fix_type`, and `opportunity_score` cannot leak through the
page model.

## Intentional

- This PR does not make `drafted_resolutions` required for every parsed model.
  The hosted smoke is the current-report acceptance check; older report models
  can still render without this optional section.
- The hosted page shows the action summary, not full draft answer bodies. Full
  drafted answer prose still belongs in the existing detail/export surfaces
  until the email/PDF shape is finalized.
- The section reuses the shared action-row validator and projection instead of
  introducing a drafted-resolution-specific payload contract in this slice.
- No already-covered recurrence, deltas, macro writeback, email, or PDF changes
  are included here.

## Deferred

- `already_covered_still_recurring` remains a separate one-section vertical.
- Email/PDF restructuring, report deltas, and macro-writeback upsell fields are
  deferred until the hosted action-section contract is stable.
- Cross-run delta identity (`repeat_key` / `cluster_id`) remains tracked in
  canfieldjuan/ATLAS#1316 and should land before customer-facing delta reports.
- Parked hardening: none.

## Verification

- Pass: `npm --prefix web run test:deflection-report-model-result-page`
- Pass: `npm --prefix web run test:deflection-hosted-results-smoke`
- Pass: `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts src/components/landing/DeflectionReportModelPage.tsx scripts/smoke-deflection-hosted-results.mjs scripts/test-deflection-hosted-results-smoke.mjs scripts/test-deflection-report-model-result-page.mjs`
- Pass: `bash scripts/local_pr_review.sh`

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Drafted-Resolutions-Vertical.md` | +97 / -0 |
| `web/src/lib/atlas-deflection-client.ts` | +24 / -1 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | +72 / -1 |
| `web/scripts/smoke-deflection-hosted-results.mjs` | +1 / -0 |
| `web/scripts/test-deflection-hosted-results-smoke.mjs` | +14 / -0 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | +103 / -2 |
| Total | ~314 LOC |
