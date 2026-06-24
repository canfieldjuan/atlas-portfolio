# PR-Deflection-Report-Hosted-Shape-Consumer

## Why this slice exists

ATLAS #1805's paid report-model contract arc now publishes the generated
`DEFLECTION_REPORT_HOSTED_FIELD_SHAPES` map in the cross-repo
`deflection-report-model-contract.ts` artifact. The portfolio parser already
imports that generated artifact, but the buyer-facing report payload boundary
still hand-constructs hosted-safe action sections with local field lists in
`atlas-deflection-client.ts`.

That is the final cross-repo version of the drift class #1833 closed inside
ATLAS: ATLAS can add or remove a hosted-safe field, the generated contract can
update, and the portfolio parser can still silently keep an older local
projection. This slice fixes the root by making portfolio's paid report parser
project web-safe section data from the generated hosted-field shape map instead
of local per-section constructors.

This slice is over the 400 LOC soft cap because the root fix replaces local
projection code and updates the focused report-model test harness with the
generated hosted-shape contract needed to prove private/export-only fields stay
out while generated-safe fields survive.

## Scope (this PR)

Slice phase: Production hardening

1. Import the generated `DEFLECTION_REPORT_HOSTED_FIELD_SHAPES` artifact in the
   server-side ATLAS deflection client.
2. Replace local action-section projection helpers with a generated-shape
   projector that supports scalar, scalar-array, record, object, and
   object-array fields.
3. Preserve the existing fail-closed validation gate before projection.
4. Extend report-model tests so a generated hosted-safe field survives by
   contract and raw/export-only fields still do not reach buyer-facing page
   data.
5. Update the hosted result page to use generated-safe source counts rather
   than raw source IDs.

### Files touched

- `web/plans/PR-Deflection-Report-Hosted-Shape-Consumer.md` - plan contract.
- `web/src/lib/atlas-deflection-client.ts` - consume generated hosted-field shapes for buyer-safe report projection.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - read hosted-safe source counts instead of raw source IDs.
- `web/scripts/test-deflection-report-model-result-page.mjs` - regression coverage for generated-shape projection and private-field stripping.

## Mechanism

`constructWebReportSection` keeps the existing section-specific validation
checks. After a section validates, the data object is projected through
`DEFLECTION_REPORT_HOSTED_FIELD_SHAPES[section.id]`. Nested owner paths use
dot-separated keys from the generated artifact, so action rows, CSAT objects,
support-cost basis objects, source windows, records, and term-mapping arrays
all derive from one ATLAS-owned shape map.

The projector is fail-closed: an unknown shape is ignored, malformed object and
array values are skipped, records keep only scalar numeric/string/boolean/null
values, and nullable object fields preserve `null` only when the generated
shape marks the field as an object. The section envelope remains unchanged.

## Intentional

- This slice does not remove the existing validation predicates. The generated
  shape map controls projection; validation still rejects malformed upstream
  report sections before anything renders.
- This does not render new sections or change paid/free gating.
- This keeps the generated contract file as-is; ATLAS remains the owner of the
  report-model artifact.

## Deferred

- A later cleanup can simplify the now-redundant section-specific validation
  predicates once more parser behavior is generated from the report contract.

Parked hardening: none.

## Verification

- Pass: `npm --prefix web run test:deflection-report-model-result-page`
- Pass: `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts src/components/landing/DeflectionReportModelPage.tsx scripts/test-deflection-report-model-result-page.mjs`
- Pass: `npm --prefix web run check:deflection-contracts -- --source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionSnapshot.ts --report-model-source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionReportModel.ts`
- Pass: `bash scripts/local_pr_review.sh`

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Report-Hosted-Shape-Consumer.md` | +92 / -0 |
| `web/src/lib/atlas-deflection-client.ts` | +69 / -140 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | +1 / -1 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | +363 / -104 |
| **Total** | **~770** |
