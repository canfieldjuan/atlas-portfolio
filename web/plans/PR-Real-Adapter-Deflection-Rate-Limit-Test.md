## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses and fake local
adapters. The deflection rate-limit test still compiles
`deflection-rate-limit.ts` and the audit route into temp CommonJS files while
writing fake `next/server`, audit-routing, audit-intake, and rate-limit modules
beside them.

This slice migrates that coverage to Vitest so the test imports the real
`@/lib/deflection-rate-limit` helper and real `/api/audit` route.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the deflection rate-limit temp transpile harness with a Vitest test.
2. Preserve coverage for per-IP/request buckets, forwarded IP parsing,
   identifier normalization, active-bucket fail-closed behavior, audit route IP
   lockout, audit route email lockout, and successful audit intake submission.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the deflection rate-limit test through Vitest.
- `web/plans/PR-Real-Adapter-Deflection-Rate-Limit-Test.md` — plan for this
  slice.
- `web/scripts/test-deflection-rate-limit.mjs` — remove the temp transpile and
  fake local-module harness.
- `web/src/lib/deflection-rate-limit.test.ts` — add real-import helper and
  route coverage.

## Mechanism

The new test imports `consumeDeflectionRateLimit` and
`consumeDeflectionIdentifierRateLimit` from the production
`@/lib/deflection-rate-limit` module. It imports the production audit route's
`POST` handler from `@/app/api/audit/route`.

Route coverage drives the real limiter behavior by consuming the real IP or
email buckets before calling the route. Request objects provide only the fields
the route consumes: `headers` and `json`.

## Intentional

- The route test mocks only `recordAuditIntake`, the external persistence /
  delivery boundary. The rate-limit helper, audit route, audit-routing
  validation, and Next response implementation resolve through the normal repo
  path.
- The old source-level scope assertion is replaced with behavior: the IP limit
  blocks before `json()` is called, and the email limit blocks after a valid body
  is parsed but before `recordAuditIntake` runs.
- The test body uses a real `projectInterest` value accepted by
  `@/lib/audit-routing` instead of the old permissive fake routing stub.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-rate-limit # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-rate-limit\\.mjs|atlas-deflection-rate-limit" web/package.json web/scripts web/src/lib/deflection-rate-limit.test.ts; then exit 1; else echo "No deflection rate-limit temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Deflection-Rate-Limit-Test.md` | ~86 |
| `web/scripts/test-deflection-rate-limit.mjs` | ~248 |
| `web/src/lib/deflection-rate-limit.test.ts` | ~250 |
| Total | ~586 |

This is over the 400-LOC soft cap because the old temp transpile harness is
deleted and replaced with parity helper and route coverage in one slice.
