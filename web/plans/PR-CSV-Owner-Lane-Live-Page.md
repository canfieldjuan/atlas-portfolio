# PR-CSV-Owner-Lane-Live-Page

## Why this slice exists

ATLAS can now emit buyer-safe owner-lane metadata for repeated CSV-backed gaps, but the live paid result page in `atlas-portfolio` is the acceptance gate buyers actually see. This slice regenerates the portfolio report-model contract from ATLAS and renders the first owner-lane vertical on paid report rows: owner, repeat count, estimated handling cost, evidence tier, and a compact routing cue. The page deliberately avoids exact UI-path/root-cause claims.

The diff is over the 400 LOC soft cap because the generated report-model contract carries nested hosted field metadata for every paid action-item collection. The hand-written page/test changes are small; the generated contract must land with them so the parser and CI drift check agree with ATLAS.

## Scope (this PR)

Slice phase: Vertical slice

1. Regenerate `web/src/lib/deflection-report-model-contract.ts` from the updated ATLAS generated report-model contract.
2. Render evidence tier and compact routing cues in the paid result-page owner-lane cell wherever action rows already show owner, repeats, and cost.
3. Reframe unresolved-repeat copy from a docs-only queue to routable product, content, or support friction.
4. Keep locked/free snapshot behavior unchanged and paid-field-free.
5. Update parser/generator tests and demo data so evidence tiers and routing signals survive hosted paid parsing while raw evidence/source IDs remain excluded.

### Files touched

- `web/plans/PR-CSV-Owner-Lane-Live-Page.md` - this plan.
- `web/src/lib/deflection-report-model-contract.ts` - regenerated ATLAS paid report-model contract.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - paid result page evidence/routing rendering and copy.
- `web/src/lib/deflection-report-demo.ts` - demo report item metadata matching the generated contract.
- `web/plans/deflection-snapshot-report-groundtruth.json` - locked-preview report-model shape ground truth.
- `web/scripts/test-deflection-report-model-result-page.mjs` - parser/page source coverage for evidence tier, routing cues, and non-leakage.
- `web/scripts/test-deflection-snapshot-contract-generator.mjs` - generator fixture coverage for nested routing-signal shapes.

## Mechanism

The generated contract now admits `evidence_tier` and nested `routing_signals` objects on hosted-safe paid action rows. The paid page adds a shared `OwnerEvidenceCell` that keeps the existing table shape but expands the owner lane cell with an evidence label and the first available routing cue, preferring product area, custom product area, group, tags, brand, organization, then assignee.

The unresolved-repeat copy now tells buyers to treat the queue as routable product, content, or support friction. It does not infer an exact UI path or root cause from CSV data.

## Intentional

- Locked/free snapshot pages are not changed in this slice.
- The page does not show source IDs, raw quotes, `top_evidence`, or exact UI root-cause language.
- The routing cue is compact and uses only the safe metadata ATLAS exposes.
- No new API route is added; the existing report-model parser consumes the regenerated hosted contract.

## Deferred

- Jira template generation remains an ATLAS follow-up.
- Monthly normalization and richer department taxonomy remain follow-up work after this vertical is proven.
- Visual browser smoke for the paid result page can follow once a representative hosted report fixture is available locally.

Parked hardening: none.

## Verification

- `node web/scripts/test-deflection-snapshot-contract-generator.mjs` - passed.
- `node web/scripts/test-deflection-report-model-result-page.mjs` - passed.
- `node web/scripts/test-deflection-snapshot-landing-smoke.mjs` - shape assertions reached the CLI smoke branch, then hit the existing Windows `C:\C:\...` file-URL spawn issue; CI runs this smoke on Ubuntu.
- `node --input-type=module -e "import('./web/scripts/generate-deflection-snapshot-contract.mjs').then((m) => m.main(['--check','--source','.../ATLAS-main/portfolio-ui/src/types/deflectionSnapshot.ts','--report-model-source','.../ATLAS-main/portfolio-ui/src/types/deflectionReportModel.ts']));"` - passed; portfolio generated contracts match ATLAS.
- `web/node_modules/.bin/tsc.cmd -p web/tsconfig.json --noEmit` with bundled Node on `PATH` - passed.
- `web/node_modules/.bin/eslint.cmd src/components/landing/DeflectionReportModelPage.tsx src/lib/deflection-report-demo.ts scripts/test-deflection-report-model-result-page.mjs scripts/test-deflection-snapshot-contract-generator.mjs` from `web/` - passed.
- `git diff --check` - passed.
- `rg "docs queue" web/src` - no stale docs-only product copy remains; `web/scripts/test-deflection-report-model-result-page.mjs` intentionally asserts the old phrase is absent.
- Not run: `bash scripts/local_pr_review.sh` because this Windows runtime has no `bash` executable.

## Estimated diff size

| Area | Approx LOC |
|---|---:|
| Plan | ~49 |
| Paid page/demo/tests | ~143 |
| Generated contract | ~492 |
| Ground truth | ~14 |
| Total | ~698 |
