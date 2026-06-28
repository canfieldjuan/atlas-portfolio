## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses and fake local
adapters. The deflection email results-link test still compiles
`gap-report-intake.ts` into a temp CommonJS file and writes fake local modules
for pricing, partner access, SEO, persistence, and PDF generation.

This slice migrates that coverage to Vitest so the test imports the real
`@/lib/gap-report-intake` module and its real local dependencies.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the email results-link temp transpile harness with a Vitest test.
2. Preserve coverage for results path generation, partner-token metadata
   validation, customer/operator email links, unsafe request ID suppression,
   default vs partner copy, PDF attachment presence, and snapshot-email failure
   warnings.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the email results-link test through Vitest.
- `web/plans/PR-Real-Adapter-Email-Results-Link-Test.md` — plan for this slice.
- `web/scripts/test-deflection-email-results-link.mjs` — remove the temp
  transpile and fake local-module harness.
- `web/src/lib/gap-report-intake.test.ts` — add real-import email results-link
  coverage.

## Mechanism

The new test imports `deflectionResultsPath`, `parseGapReportMetadata`, and
`recordGapReportSubmission` from the production `@/lib/gap-report-intake`
module. That means pricing, partner access, SEO, PDF generation, and the
database adapter are resolved through the normal repo path instead of temp
CommonJS stubs.

The test still intercepts `globalThis.fetch` because the production code sends
email through Resend. The test also clears database URL environment variables so
the real persistence adapter follows its no-database configured path instead of
writing to a developer or production database.

## Intentional

- No local product dependency is mocked. The intake, pricing, partner access,
  SEO, PDF, and persistence modules run for real.
- External side effects are isolated: Resend calls are captured with a fetch
  stub, and database URL env vars are cleared so no real records are written.
- The old fake-persistence status assertions are replaced with assertions on
  the real adapter's not-configured warning.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-email-results-link # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-email-results-link\\.mjs|atlas-deflection-email-link" web/package.json web/scripts web/src/lib/gap-report-intake.test.ts; then exit 1; else echo "No email results-link temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Email-Results-Link-Test.md` | ~84 |
| `web/scripts/test-deflection-email-results-link.mjs` | ~340 |
| `web/src/lib/gap-report-intake.test.ts` | ~249 |
| Total | ~675 |

This is over the 400-LOC soft cap because the old temp transpile harness is
deleted and replaced with parity email results-link coverage in one slice.
