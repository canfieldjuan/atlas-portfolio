## Why this slice exists

#414 is moving the test suite away from temp `@/lib/*` stubs now that Vitest can
resolve the repo alias. `test-deflection-review-decisions-api.mjs` still
constructs fake `atlas-deflection-client`, `deflection-rate-limit`, and
`deflection-review-decisions-database` modules before testing the API route.

This slice migrates that harness to import the real
`@/app/api/deflection-review-decisions/route` module. The route keeps its real
ATLAS client, rate limiter, report-contract parser, and database module in the
call path while the test controls only the external ATLAS HTTP boundary and the
Neon database boundary.

## Scope (this PR)

Slice phase: Functional validation

1. Replace `test-deflection-review-decisions-api.mjs` with a Vitest route test.
2. Mock only external boundaries: ATLAS HTTP via `globalThis.fetch` and Neon via
   `@neondatabase/serverless`.
3. Preserve coverage parity for invalid input, locked report access, unknown
   review keys, successful writes, filtered reads, unconfigured storage, storage
   failures, and route rate limiting.
4. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the review-decisions API test through Vitest.
- `web/plans/PR-Real-Adapter-Review-Decisions-Test.md` — plan for this slice.
- `web/scripts/test-deflection-review-decisions-api.mjs` — remove the fake-module
  harness.
- `web/src/app/api/deflection-review-decisions/route.test.ts` — add real-import
  route coverage.

## Mechanism

The new test imports `GET` and `POST` from the production route. The route then
imports the real `atlas-deflection-client`, `deflection-rate-limit`,
`deflection-review-decisions-database`, and report-contract modules through the
normal `@/` path.

ATLAS is represented by queued `globalThis.fetch` responses that return the real
`/report-model` envelope parsed by `fetchDeflectionReportModel`. Neon is mocked
at the package boundary so the real database adapter still builds SQL, reads env
configuration, and maps rows through its production functions. The route's real
rate-limit store is reset between tests instead of being replaced.

## Intentional

- This slice migrates one API harness. Larger deflection harnesses remain
  deferred.
- The test uses a valid minimal `deflection.v1` report model because the real
  ATLAS client parses the contract before the route sees review keys. The old
  harness skipped that parser by stubbing the client.
- Neon is mocked because it is the external database boundary. The portfolio DB
  adapter itself is not mocked.

## Deferred

The remaining #414 fake-adapter harness migrations stay queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-review-decisions # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-review-decisions-api\\.mjs|atlas-deflection-review-decisions|__deflectionReviewDecisions" web/package.json web/scripts web/src/app/api/deflection-review-decisions/route.test.ts; then exit 1; else echo "No review-decisions fake harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~1 |
| `web/plans/PR-Real-Adapter-Review-Decisions-Test.md` | ~80 |
| `web/scripts/test-deflection-review-decisions-api.mjs` | ~221 |
| `web/src/app/api/deflection-review-decisions/route.test.ts` | ~360 |
| Total | ~662 |

This is over the 400-LOC soft cap because the old fake-module harness is deleted
and replaced with real-import route coverage in the same slice.
