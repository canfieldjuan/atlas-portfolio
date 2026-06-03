# PR-Deflection-Results-Support-Tax

## Why this slice exists

atlas-portfolio#196 is now unblocked by canfieldjuan/ATLAS#1274: the free FAQ deflection snapshot exposes raw per-question `ticket_count`, `summary.repeat_ticket_count`, and rank/count-only `locked_questions`. The results page still renders the old score-only view, so it cannot show the buyer what the repeat questions are costing without misusing `weighted_frequency`.

This slice consumes the new producer fields on the unpaid results page. It turns the snapshot into an honest Support Tax projection based on measured repeat-ticket counts and the existing Gartner assisted-contact benchmark, while preserving the paywall boundary for locked question text, evidence, source IDs, Markdown, and full artifact content.

The diff is over the 400 LOC target because this is a trust-boundary payload change: the client type, fail-closed parser, render surface, and smoke fixtures need to land together. Splitting parser safety from render would either reject the new producer payload without a UI consumer or render cost copy without enough regression coverage around count fields and locked-row withholding.

## Scope (this PR)

Slice phase: Product polish

1. Extend the snapshot client contract and ATLAS parser for `ticket_count`, `summary.repeat_ticket_count`, and `locked_questions`.
2. Add per-question cost overlays that use raw `ticket_count`, not `weighted_frequency`.
3. Add an inline prefilled Support Tax projection from `summary.repeat_ticket_count` with an adjustable assisted-contact cost input and transparent estimate copy.
4. Render locked 6-N rows with only rank, ticket count, and estimated cost visible; question text stays withheld.
5. Update deflection smoke fixtures/markers so hosted results checks prove the Support Tax block renders.

### Files touched

- `web/plans/PR-Deflection-Results-Support-Tax.md` - Plan doc for this slice.
- `web/src/lib/deflection-snapshot.ts` - Snapshot raw-count and locked-row types plus demo fixture.
- `web/src/lib/atlas-deflection-client.ts` - Fail-closed parser for raw counts and locked rows.
- `web/src/components/landing/DeflectionResultsPage.tsx` - Results-page cost overlay, projection, and locked-row render.
- `web/scripts/smoke-deflection-live-submit.mjs` - Live-submit smoke snapshot parser accepts/rejects raw-count fields.
- `web/scripts/test-deflection-live-submit-smoke.mjs` - Snapshot fixture includes valid counts/locked rows and rejects malformed count payloads.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - Client parser regression for count allowlisting and locked-row withholding.
- `web/scripts/smoke-deflection-hosted-results.mjs` - Hosted results required markers include the Support Tax projection.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - Hosted-results fixture and missing-marker regression for Support Tax.
- `web/scripts/test-deflection-browser-upload-smoke.mjs` - Browser-upload results fixture and marker assertions include Support Tax.

## Mechanism

The parser requires visible `top_questions[].ticket_count`, requires numeric `summary.repeat_ticket_count`, and reconstructs `locked_questions` from only `{ rank, ticket_count }`. Any locked-row `question`, `customer_wording`, answer, evidence, source ID, Markdown, or extra payload is dropped before the client snapshot is returned.

`DeflectionResultsPage` keeps `weighted_frequency` only for ranking bars. The new Support Tax math uses `ticket_count * assistedCost`, with a default assisted-contact cost of `$13.50` from the existing site benchmark and a slider bounded to customer-adjustable values. The projection labels the current upload window and run-rate as an estimate rather than a guaranteed savings claim.

## Intentional

- This does not infer costs from `weighted_frequency`; weighted score remains rank metadata only.
- This does not claim customer-specific search rank, keyword volume, or guaranteed savings.
- Locked rows intentionally do not display question text. They show curiosity-driving measured counts and estimated cost only.
- This keeps the existing checkout, paid artifact fetch, webhook, and success-return polling unchanged.

## Deferred

- The fuller #196 SEO/keyword reframe and "complete phrase list" copy beyond the current visible customer wording.
- Any date-window-normalized monthly math once ATLAS exposes a report date span. This slice labels the projection against the uploaded batch/current run-rate estimate instead of claiming a known month.
- Live production smoke after ATLAS deploys #1274 and a fresh report carries the new fields.

Parked hardening: none.

## Verification

- Command: `node web/scripts/test-deflection-live-submit-smoke.mjs && node web/scripts/test-deflection-intake-atlas-submit.mjs && node web/scripts/test-deflection-hosted-results-smoke.mjs && node web/scripts/test-deflection-browser-upload-smoke.mjs` - passed.
- Command: `npm --prefix web run lint` - passed.
- Command: `npm --prefix web run build` - passed.
- Command: `node web/scripts/smoke-deflection-hosted-results.mjs --base-url http://localhost:3010 --request-id local-demo --json` - passed against the local Next dev server; markers included `supportTax`.
- Command: `rg -n "weighted_frequency|ticket_count|repeat_ticket_count|locked_questions|Support Tax projection|See what this volume is costing you|calculator\\?requestId" web/src web/scripts -S` - confirmed results-page cost math uses `ticket_count`/`repeat_ticket_count`; remaining `weighted_frequency` references are parser/fixture metadata, teaser metadata, or paid artifact/report surfaces; no stale calculator out-link returned.
- Command: `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~72 |
| Snapshot contract/parser | ~88 |
| Results page render | ~253 |
| Smoke tests | ~158 |
| Total | ~600 |
