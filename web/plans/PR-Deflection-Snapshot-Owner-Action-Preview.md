# PR-Deflection-Snapshot-Owner-Action-Preview

## Why this slice exists

ATLAS #1875 added owner lane, recommended action, and estimated support cost to the fail-closed Snapshot projection, but atlas-portfolio still consumes and renders the older Snapshot row shape. Root cause: the portfolio contract/demo/parser/render path is still pinned to the pre-routing Snapshot projection, so the landing demo and uploaded Snapshot cards cannot show who likely owns each repeat or what action to take next. This fixes the root for the portfolio consumer by regenerating the contract/demo from ATLAS, admitting the new runtime shape, and rendering those fields in the existing row cards.

This slice is slightly over the 400 LOC soft target because the contract change is not safe as a render-only edit: the generated artifacts, generator validation, live parser admission, parser negative fixtures, landing smoke fixture, and shared-row guard need to move together so the landing demo and uploaded Snapshot stay on the same projection.

## Scope (this PR)

Slice phase: Product polish

1. Regenerate the deflection Snapshot contract and demo fixture from the ATLAS-generated artifacts.
2. Update the live Snapshot parser to require and preserve the new row fields.
3. Render owner lane, action label, and projected support cost inside the existing top-question and high-cost-repeat cards.
4. Strengthen the generator and row-sharing guards so future generated fixtures prove the same fields stay wired.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Owner-Action-Preview.md`
- `web/plans/deflection-snapshot-report-groundtruth.json`
- `web/scripts/generate-deflection-snapshot-contract.mjs`
- `web/scripts/test-deflection-intake-atlas-submit.mjs`
- `web/scripts/test-deflection-snapshot-contract-generator.mjs`
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs`
- `web/scripts/test-deflection-row-renderer-share.mjs`
- `web/src/components/landing/DeflectionSnapshotRows.tsx`
- `web/src/lib/atlas-deflection-client.ts`
- `web/src/lib/deflection-demo-example.ts`
- `web/src/lib/deflection-report-model-contract.ts`
- `web/src/lib/deflection-snapshot-contract.ts`

### Review Contract

- The generated portfolio Snapshot contract must include `owner_lane`, `action_label`, and `estimated_support_cost` on visible repeat rows and blind spots.
- The generated demo fixture must come from the ATLAS example pair and keep the Snapshot/report projected cost relationship.
- The live ATLAS Snapshot parser must reject payloads missing the new row fields and must not pass through private evidence fields.
- The landing and uploaded Snapshot row cards must show owner/action metadata inline without adding new sections.
- Locked question rows remain withheld and unchanged.

## Mechanism

The generator continues to copy the ATLAS-owned Snapshot contract and demo JSON, but its validation now treats `owner_lane`, `action_label`, and `estimated_support_cost` as required fields on `top_questions` and `top_blind_spots`. The paired demo check asserts those values match the corresponding `ranked_questions` report rows so the landing demo keeps the production `snapshot = projection(report)` relationship.

The runtime parser mirrors the generated contract and rejects live Snapshot payloads that omit the new fields. The shared Snapshot row component renders compact owner/action labels in each existing row and uses the projected `estimated_support_cost` for the cost sentence instead of recomputing a separate display value from the slider.

## Intentional

- No new landing sections: the owner/action hints live in the existing proven-resolution and high-cost-repeat cards, matching the current page shape.
- Locked rows stay unchanged because the public Snapshot still withholds the locked question text.
- Full routing evidence, source IDs, and detailed action queue remain paid-report-only; this slice only consumes the already snapshot-safe projection.

## Deferred

- Parked hardening: none.
- The paused landing-demo derivation slice remains downstream; this PR only consumes the now-published Snapshot fields.

## Verification

- Pass: `npm --prefix web run generate:deflection-contracts`
- Pass: `npm --prefix web run check:deflection-contracts`
- Pass: `npm --prefix web run test:deflection-snapshot-contract-generator`
- Pass: `npm --prefix web run test:deflection-intake-atlas-submit`
- Pass: `npm --prefix web run test:deflection-snapshot-landing-smoke`
- Pass: `npm --prefix web run test:deflection-row-renderer-share`
- Pass: `npm --prefix web run test:deflection-cost-projection-share`
- Pending: `bash scripts/local_pr_review.sh`

## Estimated diff size

| Area | LOC |
| --- | ---: |
| Plan and fixture updates | ~95 |
| Generator/parser/tests | ~215 |
| Shared row renderer and generated artifacts | ~127 |
| **Total** | **~437** |
