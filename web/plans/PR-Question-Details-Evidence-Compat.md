# PR-Question-Details-Evidence-Compat

## Why this slice exists

PR #387 kept new owner metadata optional for legacy hosted action rows, but `question_details.rows.evidence_tier` still lands in the hosted admission contract as required. Stored `deflection.v1` paid reports generated before ATLAS added that field can therefore fail validation when the paid page reads the question-details section. This slice closes that remaining back-compat gap without changing buyer-facing copy or expanding the owner-lane vertical.

## Scope (this PR)

Slice phase: Production hardening

1. Keep `question_details.rows.evidence_tier` optional in the generated hosted admission contract.
2. Regenerate the paid report-model contract from ATLAS main through the updated generator.
3. Add parser/generator regressions proving legacy question-details rows without `evidence_tier` still render.

### Files touched

- `web/plans/PR-Question-Details-Evidence-Compat.md` - this plan.
- `web/scripts/generate-deflection-snapshot-contract.mjs` - hosted admission compatibility for legacy question-details evidence tiers.
- `web/src/lib/deflection-report-model-contract.ts` - regenerated hosted admission contract.
- `web/scripts/test-deflection-snapshot-contract-generator.mjs` - generator coverage for required source row fields admitted as optional for legacy rows.
- `web/scripts/test-deflection-report-model-result-page.mjs` - parser coverage for legacy question-details rows.

## Mechanism

The generator already treats `evidence_tier` and `routing_signals` as optional hosted admission fields on action-item rows so old stored reports do not fail validation. This slice extends that compatibility rule to `question_details.rows.evidence_tier`, then regenerates the contract so only the hosted admission `required` flag changes. The TypeScript shape from ATLAS remains intact; this is an admission/back-compat rule for hosted stored payloads.

## Intentional

- No paid page rendering changes are included.
- `question_details.rows.evidence_tier` remains hosted-safe when present.
- Raw evidence, source IDs, and private fields remain excluded from hosted buyer-safe projection.

## Deferred

- Versioned report-model migration remains a follow-up if stored `deflection.v1` payloads need broader schema migration.

Parked hardening: none.

## Verification

- `node web/scripts/test-deflection-snapshot-contract-generator.mjs` - passed.
- `node web/scripts/test-deflection-report-model-result-page.mjs` - passed.
- `web/node_modules/.bin/tsc.cmd -p web/tsconfig.json --noEmit` with bundled Node on `PATH` - passed.
- `web/node_modules/.bin/eslint.cmd scripts/generate-deflection-snapshot-contract.mjs scripts/test-deflection-report-model-result-page.mjs scripts/test-deflection-snapshot-contract-generator.mjs src/lib/deflection-report-model-contract.ts` from `web/` - passed.
- `git diff --check` - passed.
- Cross-repo contract check: not cleanly runnable on this Windows checkout after restoring the untouched snapshot contract because the check compares LF-rendered output with CRLF working-tree text; CI runs the same drift check on Ubuntu.

## Estimated diff size

| Area | Approx LOC |
|---|---:|
| Plan | ~50 |
| Generator/tests | ~66 |
| Generated contract | ~1 |
| Total | ~117 |
