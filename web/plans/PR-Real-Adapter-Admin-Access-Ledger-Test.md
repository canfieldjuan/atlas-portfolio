## Why this slice exists

#414 is removing the brittle test pattern where harnesses transpile TypeScript
into temp files and fabricate internal `@/lib/*` modules. The admin access
ledger harness still writes fake `@/lib/structured-runtime-log` and fake Neon
modules before requiring a transpiled copy of `admin-access-log.ts`.

This slice migrates the ledger helper coverage to Vitest so the test imports the
real `@/lib/admin-access-log` module and the real structured runtime logger.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the temp-file admin access ledger harness with a Vitest test.
2. Mock only the external Neon package boundary while keeping the portfolio
   ledger helper and structured logger in the real call path.
3. Preserve coverage parity for configuration detection, successful insert
   shape, metadata sanitization, write-failure logging, admin page wiring, CSV
   route ordering, and SQL ledger protections.
4. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the admin access ledger test through Vitest.
- `web/plans/PR-Real-Adapter-Admin-Access-Ledger-Test.md` — plan for this slice.
- `web/scripts/test-admin-access-ledger.mjs` — remove the fake-module harness.
- `web/src/lib/admin-access-log.test.ts` — add real-import ledger coverage.

## Mechanism

The new test imports `adminAccessLogConfigured` and `recordAdminAccessEvent` from
the production `@/lib/admin-access-log` module. That module imports
`@/lib/structured-runtime-log` normally, so write-failure logging is asserted via
the real logger's `console.error` output rather than a fabricated internal stub.

Neon remains mocked at `@neondatabase/serverless`, the package boundary. The mock
captures database URLs and SQL calls while the real ledger helper performs env
resolution, client caching, header extraction, metadata sanitization, and error
mapping. The test clears the helper's global client cache between cases so env
changes do not leak.

## Intentional

- The admin page and CSV route checks remain source-level assertions in this
  slice. Fully rendering the Next server component and route dependencies would
  broaden this PR beyond the ledger helper migration; the existing wiring and
  ordering invariants are preserved without fabricating internal modules.
- Neon is mocked because it is the external database boundary. The admin ledger
  adapter and structured logger are not mocked.

## Deferred

The remaining #414 fake-adapter harness migrations stay queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:admin-access-ledger # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-admin-access-ledger\\.mjs|__adminAccessLedger|atlas-admin-access-ledger" web/package.json web/scripts web/src/lib/admin-access-log.test.ts; then exit 1; else echo "No admin access ledger fake harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~1 |
| `web/plans/PR-Real-Adapter-Admin-Access-Ledger-Test.md` | ~79 |
| `web/scripts/test-admin-access-ledger.mjs` | ~194 |
| `web/src/lib/admin-access-log.test.ts` | ~192 |
| Total | ~467 |

This is over the 400-LOC soft cap because the old temp-file harness is deleted
and replaced with real-import Vitest coverage in the same slice.
