# PR-Deflection-Report-Contract-Type-Trim

## Why this slice exists

Issue #198 tracks verified dead-code cleanup. After the export-style script
drains, Knip still reports two unused exported types in
`web/src/lib/deflection-report-contract.ts`: `TicketFAQMarkdownResult` and
`FAQDeflectionReportSummary`. Reference checks show neither type is imported by
external modules; both are only used inside the same contract file to shape the
exported `FAQDeflectionReportArtifact`.

## Scope (this PR)

Slice phase: Production hardening

1. Localize `TicketFAQMarkdownResult` and `FAQDeflectionReportSummary` by
   removing only their `export` modifiers.
2. Remove the two resolved type findings from `web/knip-baseline.json`.
3. Leave the externally imported report contract types untouched.

### Files touched

- `web/src/lib/deflection-report-contract.ts` -- localize the two
  module-internal artifact helper types.
- `web/knip-baseline.json` -- remove the resolved Knip baseline findings.
- `web/plans/PR-Deflection-Report-Contract-Type-Trim.md` -- this plan.

## Mechanism

`FAQDeflectionReportArtifact` remains exported and keeps the same field shapes.
Its `summary` and `faq_result` properties still refer to the same local type
aliases; those aliases simply stop being part of this module's external import
surface. Existing external imports of `FAQDeflectionReportArtifact`,
`TicketFAQItem`, `FAQTermMapping`, and report-model types are unchanged.

## Intentional

- This does not touch generated report-model contract findings; those are
  intentionally ignored by the Knip baseline checker.
- This does not remove file-level findings or shared landing component types.
- This is a baseline drain only; no product behavior changes.

## Deferred

- Remaining file-level and landing primitive type findings.
- Legacy Blob token fallback removal after the old store is no longer needed.
- Legacy Stripe test-key fallback removal after a test-mode restricted key path
  is confirmed.

Parked hardening: none.

## Verification

- `rg -n "TicketFAQMarkdownResult|FAQDeflectionReportSummary" web/src web/scripts web/package.json --glob '!node_modules/**'` -- pass; both names remain only in `web/src/lib/deflection-report-contract.ts`.
- `node -e "JSON.parse(require('fs').readFileSync('web/knip-baseline.json', 'utf8')); console.log('json ok')"` -- pass.
- `npm --prefix web run check:dead-code` -- pass; Knip baseline matches 5 known findings.
- `npm --prefix web run test:deflection-report-model-result-page` -- pass; 40 tests.
- `npm --prefix web run test:deflection-hosted-results-smoke` -- pass; 32 tests.
- `npm --prefix web run test:deflection-snapshot-contract-generator` -- pass; 1 test.
- `npm --prefix web run lint` -- pass.
- `npm --prefix web run build` -- pass.
- `git diff --check` -- pass.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/lib/deflection-report-contract.ts` | ~4 |
| `web/knip-baseline.json` | ~10 |
| `web/plans/PR-Deflection-Report-Contract-Type-Trim.md` | ~63 |
| Total | ~77 |
