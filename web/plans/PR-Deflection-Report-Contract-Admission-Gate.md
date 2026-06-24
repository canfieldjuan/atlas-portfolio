# PR-Deflection-Report-Contract-Admission-Gate

## Why this slice exists

#382 moved buyer-facing paid report projection to the ATLAS-generated
`DEFLECTION_REPORT_HOSTED_FIELD_SHAPES` map, closing the leak-prone hand-sync
projection path. The review's remaining deferred note is that portfolio still
has a second hand-coded shape reference in the admission gate:
`validateWebReportSection` and its section helpers still list fields and nested
row shapes beside the generated projector.

That does not widen the buyer payload, because projection is already
fail-closed, but it keeps a latent drift sibling alive: a stale validator can
continue accepting or rejecting a field shape the contract no longer says the
hosted page owns. The first pass at this slice proved the existing generated
shape map was too thin for admission: it carried field shape but not
required-ness, nullability, or scalar primitive kind. This slice fixes that
root by enriching the generated report-model artifact from the ATLAS TypeScript
types and deriving the admission gate from that richer generated contract.

This slice is over the 400 LOC soft cap because the generated contract now
includes the hosted admission metadata for every paid report owner path. The
manual runtime validator code still shrinks; most added LOC is generated
single-source contract data and the generator regression that protects it.

## Scope (this PR)

Slice phase: Production hardening

1. Replace section-specific hosted report-model validators with a generated
   admission check for scalar, scalar-array, record, object, and object-array
   values.
2. Keep the existing report envelope checks, required-data presence check, and
   fail-closed projection boundary intact.
3. Generate hosted admission metadata from ATLAS's report-model TypeScript
   aliases: shape, required, nullable, and scalar primitive value kind.
4. Add focused report-model tests proving the gate rejects malformed hosted
   values from the generated contract without reintroducing hand-coded section
   shape lists.

### Files touched

- `web/plans/PR-Deflection-Report-Contract-Admission-Gate.md` - plan contract.
- `web/scripts/generate-deflection-snapshot-contract.mjs` - derive hosted admission metadata from ATLAS report-model types.
- `web/scripts/test-deflection-report-model-result-page.mjs` - regression coverage for generated contract admission failures.
- `web/scripts/test-deflection-snapshot-contract-generator.mjs` - generator coverage for required, nullable, and primitive metadata.
- `web/src/lib/atlas-deflection-client.ts` - derive hosted report section admission from the generated contract metadata.
- `web/src/lib/deflection-report-model-contract.ts` - generated hosted admission metadata.

## Mechanism

`renderDeflectionReportModelContract` now parses the ATLAS generated
`deflectionReportModel.ts` TypeScript aliases and appends
`DEFLECTION_REPORT_HOSTED_FIELD_CONTRACT` beside the existing projection shape
map. The new generated map keeps one entry per hosted owner path and field with
`shape`, `required`, `nullable`, and scalar `value` metadata. That metadata is
derived from ATLAS's real types, so `source_date_window` remains nullable,
`csat_signal` and `support_cost_basis` remain non-nullable, optional
annualized support-tax fields remain optional, and numeric/string/boolean
scalars stay typed.

`constructWebReportSection` validates section data by walking
`DEFLECTION_REPORT_HOSTED_FIELD_CONTRACT` for the section id and nested owner
paths. The validator uses the same owner-path recursion as projection:
required generated fields must be present, nullable fields alone accept `null`,
scalar and scalar-array values must match the generated primitive kind, records
must contain generated primitive values, objects recurse into nested contract
definitions, and object arrays require every item to satisfy the nested
contract.

The admission gate remains fail-closed for shaped fields: if the upstream sends
a field that the generated hosted contract owns with the wrong shape, the
section is rejected before rendering. Unowned raw/export-only fields remain
allowed at the input boundary because the projector strips them after the
hosted-owned fields validate.

## Intentional

- This slice validates only generated hosted-owned structural contract
  metadata. It does not recreate business invariants such as
  `top_item_count === items.length` or `total_item_count >= items.length`;
  ATLAS owns those semantics and the portfolio page boundary only needs to
  reject structurally malformed hosted payloads before projection.
- This changes the generated contract artifact, but not by hand: the portfolio
  generator derives the new metadata from ATLAS's existing report-model source.
- This does not render new sections, alter paid/free gating, or change landing
  copy.

## Deferred

- If we want portfolio to enforce semantic report invariants later, add those
  as explicit generated contract metadata in ATLAS rather than hand-coding them
  beside the generated structural contract.

Parked hardening: none.

## Verification

- Pass: `npm --prefix web run test:deflection-report-model-result-page`
- Pass: `npm --prefix web run test:deflection-snapshot-contract-generator`
- Pass: `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts scripts/generate-deflection-snapshot-contract.mjs scripts/test-deflection-snapshot-contract-generator.mjs scripts/test-deflection-report-model-result-page.mjs`
- Pass: `bash scripts/local_pr_review.sh`

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Report-Contract-Admission-Gate.md` | +114 / -0 |
| `web/scripts/generate-deflection-snapshot-contract.mjs` | +236 / -0 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | +157 / -38 |
| `web/scripts/test-deflection-snapshot-contract-generator.mjs` | +101 / -0 |
| `web/src/lib/atlas-deflection-client.ts` | +83 / -267 |
| `web/src/lib/deflection-report-model-contract.ts` | +1088 / -0 |
| **Total** | **~2084** |
