# PR-Deflection-Paid-Report-Model-Contract

## Why this slice exists

ATLAS issue #1805 is now ready for the cross-repo paid report-model consumer
step: ATLAS publishes the paid `DeflectionStructuredReport` frontend artifact
and the in-repo paid result page consumes it. `atlas-portfolio` still carries a
hand-authored `DeflectionStructuredReport` / `DeflectionReportSection` shape in
`deflection-report-contract.ts`.

That hand-authored shape is the same drift class the snapshot arc removed. The
paid page parser is already intentionally stricter than the type and constructs
web-safe section data before rendering; this slice does not change that
runtime boundary. It only derives the paid report-model TypeScript contract
from the ATLAS-generated artifact and gates it in CI.

This slice is over the 400 LOC soft cap because the generated paid report-model
contract enumerates every report section, field tuple, row type, and section
union from ATLAS. Splitting the generated type from the consumer would leave
the portfolio page on the hand-authored paid model for another PR.

## Scope (this PR)

Slice phase: Production hardening

1. Extend the existing ATLAS snapshot contract generator so it also pulls the
   paid `deflectionReportModel.ts` artifact from ATLAS.
2. Commit the generated local paid report-model contract under `web/src/lib`.
3. Re-export the generated paid report-model types from the existing report
   contract module so current imports keep working.
4. Preserve the paid report-model parser's existing allowlist construction and
   add the generated `snapshot_safe_fields` envelope member to parsed sections.
5. Update CI to check the paid report-model contract against the checked-out
   ATLAS source artifact.
6. Extend generator tests with stale-output and missing-marker coverage for the
   paid report-model source.
7. Teach the dead-code baseline checker to ignore only generated contract
   export/type metadata from the paid report-model contract file while still
   failing if that generated file itself becomes orphaned.

### Files touched

- `web/plans/PR-Deflection-Paid-Report-Model-Contract.md` - plan contract.
- `.github/workflows/pre_push_audit.yml` - ATLAS report-model source path for the drift check.
- `web/package.json` - script labels for generated deflection contracts.
- `web/scripts/generate-deflection-snapshot-contract.mjs` - generator extended to emit paid report-model contract.
- `web/scripts/test-deflection-snapshot-contract-generator.mjs` - generator regression coverage for the paid source.
- `web/scripts/test-deflection-report-model-result-page.mjs` - paid parser fixture alignment for `snapshot_safe_fields`.
- `web/scripts/check-knip-baseline.mjs` - narrow generated-contract export/type exception.
- `web/scripts/test-knip-baseline.mjs` - regression coverage for the generated-contract exception.
- `web/src/lib/atlas-deflection-client.ts` - parser envelope alignment for the generated paid section contract.
- `web/src/lib/deflection-report-contract.ts` - re-export generated paid report-model types.
- `web/src/lib/deflection-snapshot-contract.ts` - regenerated header command text.
- `web/src/lib/deflection-report-model-contract.ts` - generated paid report-model contract.

## Mechanism

The generator keeps the existing snapshot render path, then adds a parallel
paid-report render path:

1. resolve the ATLAS `portfolio-ui/src/types/deflectionReportModel.ts` source;
2. validate source markers that prove it is the generated paid
   `report_projection` artifact;
3. normalize it through TypeScript's printer; and
4. write/check `web/src/lib/deflection-report-model-contract.ts`.

CI already checks out `canfieldjuan/ATLAS` as `_atlas_contract_source`; this PR
passes both the snapshot and report-model source files into the same drift
check. The existing parser and renderer continue importing through
`deflection-report-contract.ts`, which keeps artifact path helpers and legacy
artifact types in place while re-exporting the generated paid model types.
The parser keeps an internal generic section type while it validates unknown
JSON, then returns the generated `DeflectionStructuredReport` type only after
required sections and web-safe action-item construction have passed.
The dead-code checker filters `exports` and `types` findings for the generated
paid report-model contract file because that file intentionally publishes
future-facing contract metadata. It does not filter `files` findings, so the
generated file still has to be imported through the report contract module.

## Intentional

- The runtime parser/constructor in `atlas-deflection-client.ts` is not
  relaxed to trust the generated type. The generated type catches compile-time
  contract drift; the parser remains the fail-closed buyer-payload boundary.
- This PR does not render any new report sections or change paid/free gating.
  It is a sync mechanism slice.
- The generator filename remains `generate-deflection-snapshot-contract.mjs`
  for this narrow PR to avoid widening call sites; package scripts gain
  generated-contract wording to reflect the broader output.

## Deferred

- A later cleanup can rename the generator file itself to a neutral
  `generate-deflection-contracts.mjs` if the repo wants the filename to match
  both outputs.
- Hosted-safe projection from ATLAS `hosted_consumer_safe_fields` remains an
  ATLAS/portfolio boundary slice, separate from consuming the paid type.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-contract-generator`
  - passed.
- `npm --prefix web run test:deflection-report-model-result-page`
  - passed.
- `npm --prefix web run check:deflection-contracts -- --source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionSnapshot.ts --report-model-source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionReportModel.ts`
  - passed.
- `npm --prefix web run test:dead-code-baseline`
  - passed.
- `npm --prefix web run check:dead-code`
  - passed; Knip baseline matches 16 known findings.
- `bash scripts/local_pr_review.sh`
  - passed; plan audits, drift advisory, dead-code baseline, Snapshot landing
    smoke, ESLint, Next build, and whitespace all passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Paid-Report-Model-Contract.md` | ~80 |
| `.github/workflows/pre_push_audit.yml` | ~2 |
| `web/package.json` | ~2 |
| `web/scripts/generate-deflection-snapshot-contract.mjs` | ~120 |
| `web/scripts/test-deflection-snapshot-contract-generator.mjs` | ~140 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | ~15 |
| `web/scripts/check-knip-baseline.mjs` | ~20 |
| `web/scripts/test-knip-baseline.mjs` | ~25 |
| `web/src/lib/atlas-deflection-client.ts` | ~27 |
| `web/src/lib/deflection-report-contract.ts` | ~10 |
| `web/src/lib/deflection-snapshot-contract.ts` | ~2 |
| `web/src/lib/deflection-report-model-contract.ts` | ~650 |
| **Total** | **~1093** |
