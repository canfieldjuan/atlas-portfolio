## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses and fake local
adapters. The CSV privacy contract still compiles the upload route and cleanup
library into temporary CommonJS files, writes fake `@/lib/*`, Blob, and Next
modules beside them, and then exercises those compiled copies.

This slice migrates that coverage to Vitest so the behavior checks import the
real upload route, real cleanup library, real database adapter, real intake
metadata parser, and real rate limiter.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the CSV privacy temp transpile harness with a Vitest test.
2. Preserve public copy/source guards for scoped PII claims, private upload
   storage, admin CSV access, self-service purge controls, and retention copy.
3. Preserve behavior coverage for upload IP/email rate limiting, cleanup token
   fallback, tracked cleanup ordering, retained-failure paging, orphan cleanup,
   and self-service purge ordering.
4. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the CSV privacy contract through Vitest.
- `web/plans/PR-Real-Adapter-Deflection-Csv-Privacy-Test.md` — plan for this
  slice.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` — remove the temp
  transpile and fake local-module harness.
- `web/src/lib/deflection-csv-privacy.test.ts` — add real-import privacy,
  upload, cleanup, and purge coverage.

## Mechanism

The new test imports the production `/api/gap-report-intake/upload` route and
`gap-report-cleanup` helpers directly. It also lets cleanup reach the real
`gap-report-intake-database` adapter; Neon is mocked at the external
`@neondatabase/serverless` boundary rather than replacing local database
functions.

External boundaries stay mocked: `@vercel/blob/client` for client-upload token
generation, `@vercel/blob` for private Blob delete/list behavior,
`@neondatabase/serverless` for persisted submission rows, and `globalThis.fetch`
for ATLAS report deletion. Source/copy assertions still read the relevant app
files because those checks are about page composition and public claims.

## Intentional

- No local product dependency is mocked. Upload validation, metadata parsing,
  rate limiting, Blob token resolution, cleanup, purge, database query mapping,
  review-decision deletion, ATLAS delete client behavior, and structured logging
  resolve through normal repo imports.
- The source-read assertions remain source guards, not runtime rendering tests.
  This matches the old contract: they protect privacy/security claims and route
  wiring from silent copy drift.
- The test keeps upload and cleanup together because the privacy contract spans
  both ingestion and deletion; splitting them would leave the retention story
  half-proven in each PR.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-csv-privacy # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-csv-privacy-contract\\.mjs|atlas-deflection-csv-privacy-" web/package.json web/scripts web/src/lib/deflection-csv-privacy.test.ts; then exit 1; else echo "No deflection CSV privacy temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Deflection-Csv-Privacy-Test.md` | ~93 |
| `web/scripts/test-deflection-csv-privacy-contract.mjs` | ~667 |
| `web/src/lib/deflection-csv-privacy.test.ts` | ~674 |
| Total | ~1436 |

This is over the 400-LOC soft cap because the old temp transpile harness is
large and coverage parity keeps source-claim, upload, cleanup, and purge
assertions in one privacy contract.
