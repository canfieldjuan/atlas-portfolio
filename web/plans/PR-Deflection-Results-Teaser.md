# PR-Deflection-Results-Teaser

## Why this slice exists

atlas-portfolio#196 is now unblocked by canfieldjuan/ATLAS#1262/#1269: the free FAQ deflection snapshot includes a fail-closed `teaser` block with one scoped resolution-backed full answer and bounded body-withheld previews. The production results page still renders only ranked questions, so buyers cannot see answer quality before paying. The same issue also identifies a loop where the snapshot links to the calculator, but the calculator CTA sends warm viewers back to upload instead of back to purchase.

This slice consumes the newly merged backend teaser contract on the existing results page and fixes the snapshot-to-calculator purchase loop. It is product polish because the paid/unpaid funnel already works; this improves conversion proof without changing the paywall trust boundary.

The diff is over the 400 LOC target because the teaser contract is only safe when the client type/parser, result-page render, calculator return path, and smoke fixtures land together. Splitting the parser from the render would either accept an unused upstream payload or render a payload without focused contract coverage.

## Scope (this PR)

Slice phase: Product polish

1. Extend the `DeflectionSnapshot` client contract and ATLAS parser to accept `snapshot.teaser`.
2. Render one full teaser answer and body-withheld locked previews on the unpaid results page, while keeping source IDs, evidence, Markdown, and non-teaser answer bodies unavailable.
3. Reframe the "In your full report" list around concrete artifacts/outcomes tied to the teaser.
4. Pass `requestId` from the snapshot page to the calculator and make calculator CTAs return warm viewers to the current results page instead of the upload flow.
5. Update deflection smoke fixtures/markers so the hosted results checks prove the teaser and calculator-return affordances render.

### Files touched

- `web/plans/PR-Deflection-Results-Teaser.md` - Plan doc for this slice.
- `web/src/lib/deflection-snapshot.ts` - Snapshot teaser types and demo fixture.
- `web/src/lib/atlas-deflection-client.ts` - Fail-closed teaser parser.
- `web/src/components/landing/DeflectionResultsPage.tsx` - Teaser render and calculator link query.
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` - Warm-viewer CTA target support.
- `web/src/app/systems/support-ticket-deflection/calculator/page.tsx` - Read `requestId` and configure warm calculator CTA/back link.
- `web/scripts/smoke-deflection-live-submit.mjs` - Live-submit smoke snapshot parser accepts/rejects teaser envelopes.
- `web/scripts/test-deflection-live-submit-smoke.mjs` - Snapshot fixture includes a valid teaser and rejects malformed teaser payloads.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - Hosted results smoke expects teaser/calculator-return markers.
- `web/scripts/smoke-deflection-hosted-results.mjs` - Hosted results required markers include the teaser and calculator-return link.

## Mechanism

The client snapshot type mirrors the ATLAS contract: `teaser.full_answer` is either `null` or a bounded answer object with answer/steps/status/scope/source count; `teaser.previews` contains body-withheld preview metadata only. The ATLAS parser accepts only that shape and rejects malformed teaser envelopes so a drifting upstream snapshot fails closed instead of rendering guessed data.

`DeflectionResultsPage` renders the full teaser only when present, then renders previews without answer/steps keys. The calculator link becomes `/systems/support-ticket-deflection/calculator?requestId=<id>`. The calculator page reads the request id from `searchParams`; when valid, it sends both the back link and calculator CTA to `/systems/support-ticket-deflection/results/<id>`. Cold calculator visitors keep the existing landing/upload path.

## Intentional

- This does not fetch or synthesize any answer body client-side. The only unpaid answer body rendered is `snapshot.teaser.full_answer`, supplied by ATLAS after its scoped resolution-evidence gate.
- Preview cards are not blurred hidden text; the answer body is absent from the payload and represented with a locked/body-withheld affordance.
- No change to checkout, paid artifact fetch, webhook, or success-return polling is included.
- The #197 short landing page remains separate; it should reuse this same teaser artifact after this render lands.

## Deferred

- #197 short education-first landing page and before/after demo.
- Optional vocabulary-gap teaser if ATLAS later exposes a bounded sample field.

Parked hardening: none.

## Verification

- Command: `node web/scripts/test-deflection-live-submit-smoke.mjs` - passed.
- Command: `node web/scripts/test-deflection-hosted-results-smoke.mjs` - passed.
- Command: `npm --prefix web run lint` - passed.
- Command: `npm --prefix web run build` - passed.
- Command: `rg -n "DeflectionSnapshot|teaser|calculator\\?requestId|Upload tickets, get a free Deflection Snapshot|One drafted answer you can inspect before paying" web/src web/scripts -S` - confirmed the new teaser contract/render markers and calculator-return query are present; the default upload CTA remains only as the cold calculator default.
- Command: `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~71 |
| Snapshot contract/parser | ~130 |
| Results page render | ~134 |
| Calculator return CTA | ~47 |
| Smoke tests | ~135 |
| Total | ~519 |
