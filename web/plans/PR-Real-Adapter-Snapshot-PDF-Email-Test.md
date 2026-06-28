## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses now that Vitest can
load repo TypeScript directly. The snapshot PDF/email test still compiles
`deflection-snapshot-pdf.ts` into a temp CommonJS file and writes a fake
`deflection-pricing` module beside it.

This slice migrates that coverage to Vitest so the test imports the real
`@/lib/deflection-snapshot-pdf` helper and real pricing module.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the snapshot PDF/email temp transpile harness with a Vitest test.
2. Preserve coverage for default Resolution Audit Snapshot copy, support-tax
   math, privacy exclusions, locked placeholders, attachment filenames, PDF
   structure, partner override copy, and pagination.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the snapshot PDF/email test through Vitest.
- `web/plans/PR-Real-Adapter-Snapshot-PDF-Email-Test.md` — plan for this slice.
- `web/scripts/test-deflection-snapshot-pdf-email.mjs` — remove the temp
  transpile and fake-pricing harness.
- `web/src/lib/deflection-snapshot-pdf.test.ts` — add real-import PDF coverage.

## Mechanism

The new test imports `DEFLECTION_SNAPSHOT_PDF_LINES_PER_PAGE`,
`buildDeflectionSnapshotPdfLines`, `buildDeflectionSnapshotPdfPages`, and
`createDeflectionSnapshotPdfAttachment` from the production
`@/lib/deflection-snapshot-pdf` module. That helper then imports the production
pricing constants and formatters through the normal repo path.

The fixture is typed as `DeflectionSnapshot`, including the current required
`title` field. The assertions are carried over from the deleted harness: raw
source IDs and locked bodies must not render, default and partner copy must stay
distinct, generated PDFs must contain the expected PDF markers, and content-rich
snapshots must paginate instead of clipping.

## Intentional

- No dependency is mocked. The PDF helper and pricing helper are both pure local
  code and should run for real in this slice.
- The test still inspects the generated PDF as ASCII text, matching the old
  harness. This is enough for the current helper because it writes a small
  uncompressed PDF string.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-snapshot-pdf-email # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-snapshot-pdf-email\\.mjs|atlas-deflection-snapshot-pdf" web/package.json web/scripts web/src/lib/deflection-snapshot-pdf.test.ts; then exit 1; else echo "No snapshot PDF temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~1 |
| `web/plans/PR-Real-Adapter-Snapshot-PDF-Email-Test.md` | ~82 |
| `web/scripts/test-deflection-snapshot-pdf-email.mjs` | ~211 |
| `web/src/lib/deflection-snapshot-pdf.test.ts` | ~196 |
| Total | ~491 |

This is over the 400-LOC soft cap because the old temp transpile harness is
deleted and replaced with full parity PDF coverage in one slice.
