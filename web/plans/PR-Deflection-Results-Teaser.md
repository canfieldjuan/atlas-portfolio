# PR-Deflection-Results-Teaser

## Why this slice exists

atlas-portfolio#196 is now unblocked for its teaser-render portion by canfieldjuan/ATLAS#1262/#1269: the free FAQ deflection snapshot includes a fail-closed `teaser` block with one scoped resolution-backed full answer and bounded body-withheld previews. The production results page still renders only ranked questions, so buyers cannot see answer quality before paying.

The updated #196 also supersedes the old snapshot-to-calculator loop fix: the separate calculator out-link should be removed from the results page and replaced later by an inline pre-filled projection. That projection needs new ATLAS snapshot fields (`ticket_count`, total repeat-ticket volume, and locked 6-N rows), so this slice removes the stale out-link but does not invent substitute cost numbers from weighted frequency.

This slice consumes the newly merged backend teaser contract on the existing results page. It is product polish because the paid/unpaid funnel already works; this improves conversion proof without changing the paywall trust boundary.

The diff is over the 400 LOC target because the privacy-critical client parser, render, and regression smokes need to land together. The reviewer found that `full_answer` needed allowlist reconstruction before it crosses to the browser, so this slice includes the focused parser regression instead of parking that trust-boundary fix.

## Scope (this PR)

Slice phase: Product polish

1. Extend the `DeflectionSnapshot` client contract and ATLAS parser to accept `snapshot.teaser`.
2. Render one full teaser answer and body-withheld locked previews on the unpaid results page, while keeping source IDs, evidence, Markdown, and non-teaser answer bodies unavailable.
3. Reframe the "In your full report" list around concrete artifacts/outcomes tied to the teaser.
4. Remove the stale results-page calculator out-link; the inline Support Tax projection is deferred until ATLAS exposes real raw-count fields.
5. Update deflection smoke fixtures/markers so hosted results checks prove the teaser renders.

### Files touched

- `web/plans/PR-Deflection-Results-Teaser.md` - Plan doc for this slice.
- `web/src/lib/deflection-snapshot.ts` - Snapshot teaser types and demo fixture.
- `web/src/lib/atlas-deflection-client.ts` - Fail-closed teaser parser.
- `web/src/components/landing/DeflectionResultsPage.tsx` - Teaser render and stale calculator out-link removal.
- `web/scripts/smoke-deflection-live-submit.mjs` - Live-submit smoke snapshot parser accepts/rejects teaser envelopes.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - Client parser regression for allowlist teaser reconstruction.
- `web/scripts/test-deflection-live-submit-smoke.mjs` - Snapshot fixture includes a valid teaser and rejects malformed teaser payloads.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - Hosted results smoke expects the teaser marker.
- `web/scripts/test-deflection-browser-upload-smoke.mjs` - Browser-upload results verification fixture expects the teaser marker.
- `web/scripts/smoke-deflection-hosted-results.mjs` - Hosted results required markers include the teaser.

## Mechanism

The client snapshot type mirrors the ATLAS contract: `teaser.full_answer` is either `null` or a bounded answer object with answer/steps/status/scope/source count; `teaser.previews` contains body-withheld preview metadata only. The ATLAS parser accepts only that shape and rejects malformed teaser envelopes so a drifting upstream snapshot fails closed instead of rendering guessed data.

`DeflectionResultsPage` renders the full teaser only when present, then renders previews without answer/steps keys. The results page no longer sends warm report viewers to the separate calculator route; #196's inline pre-filled projection will replace that once ATLAS exposes raw repeat-ticket volume.

## Intentional

- This does not fetch or synthesize any answer body client-side. The only unpaid answer body rendered is `snapshot.teaser.full_answer`, supplied by ATLAS after its scoped resolution-evidence gate.
- Preview cards are not blurred hidden text; the answer body is absent from the payload and represented with a locked/body-withheld affordance.
- This removes the separate calculator link without adding placeholder cost math. The updated #196 requires raw `ticket_count`/volume fields; using `weighted_frequency` would make derived copy untruthful.
- No change to checkout, paid artifact fetch, webhook, or success-return polling is included.
- The #197 short landing page remains separate; it should reuse this same teaser artifact after this render lands.

## Deferred

- ATLAS snapshot payload slice for raw per-question `ticket_count`, total repeat-ticket volume, and locked 6-N rows.
- #196 inline Support Tax projection, per-question cost overlay, 6-N FOMO rows, and keyword reframe after those real backend fields exist.
- #197 short education-first landing page and before/after demo.

Parked hardening: none.

## Verification

- Command: `node web/scripts/test-deflection-live-submit-smoke.mjs` - passed.
- Command: `node web/scripts/test-deflection-intake-atlas-submit.mjs` - passed.
- Command: `node web/scripts/test-deflection-hosted-results-smoke.mjs` - passed.
- Command: `node web/scripts/test-deflection-browser-upload-smoke.mjs` - passed.
- Command: `npm --prefix web run lint` - passed.
- Command: `npm --prefix web run build` - passed.
- Command: `rg -n "calculator\\?requestId|See what this volume is costing you|Back to your snapshot|Return to your snapshot" web/src web/scripts -S` - no matches.
- Command: `rg -n "One drafted answer you can inspect before paying|snapshot\\.teaser|teaser" web/src web/scripts -S` - confirmed teaser contract/render markers.
- Command: `bash scripts/local_pr_review.sh` - pending rerun after MAJOR fix.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~78 |
| Snapshot contract/parser | ~187 |
| Results page render | ~137 |
| Smoke tests | ~262 |
| Total | ~636 |
