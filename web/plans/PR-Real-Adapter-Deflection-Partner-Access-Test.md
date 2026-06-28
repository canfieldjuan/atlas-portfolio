## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses and fake local
adapters. The deflection partner-access test still compiles
`deflection-partner-access.ts`, the rate limiter, gap-report intake, and the
record route into temp CommonJS files while writing fake `@/lib/*`, Blob, and
Next modules beside them.

This slice migrates that coverage to Vitest so the test imports the real
partner access helper, real token helper, real `/gap-report-intake/record`
route, and real local dependencies.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the partner-access temp transpile harness with a Vitest test.
2. Preserve coverage for direct partner tokens, signed token rotation, CLI token
   generation, intake/partner page wiring, partner copy guards, forged partner
   metadata rejection, duplicate submission idempotency, blob ownership checks,
   record rate limiting, ATLAS submit failure mapping, and partner persistence
   enforcement.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the partner-access test through Vitest.
- `web/plans/PR-Real-Adapter-Deflection-Partner-Access-Test.md` — plan for this
  slice.
- `web/scripts/test-deflection-partner-access.mjs` — remove the temp transpile
  and fake local-module harness.
- `web/src/lib/deflection-partner-access.test.ts` — add real-import helper,
  route, CLI, and wiring coverage.

## Mechanism

The new test imports `hasDeflectionPartnerPriceAccessToken` and
`resolveIntakePriceVariantId` from `@/lib/deflection-partner-access`, and imports
the token helper from the real CommonJS module. The record-route tests import the
production `@/app/api/gap-report-intake/record/route` handler.

External boundaries stay mocked: `@vercel/blob` for private Blob ownership/read
checks, `@neondatabase/serverless` for duplicate/persistence storage, and
`globalThis.fetch` for ATLAS submit/snapshot responses. Local route/helper
modules are not faked.

## Intentional

- No local product dependency is mocked. Partner access, partner token parsing,
  pricing, gap-report intake validation/persistence wrapper, rate limiting, the
  record route, and structured logging resolve through normal repo imports.
- The remaining source reads are wiring/copy guards from the old harness; they
  stay as source assertions because they are about page composition rather than
  helper behavior.
- The CLI token generation check still runs the real script in a child process,
  matching the old coverage.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-partner-access # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-partner-access\\.mjs|atlas-deflection-partner-access-" web/package.json web/scripts web/src/lib/deflection-partner-access.test.ts; then exit 1; else echo "No deflection partner-access temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Deflection-Partner-Access-Test.md` | ~90 |
| `web/scripts/test-deflection-partner-access.mjs` | ~659 |
| `web/src/lib/deflection-partner-access.test.ts` | ~605 |
| Total | ~1356 |

This is over the 400-LOC soft cap because the old temp transpile harness is
large and coverage parity keeps helper, CLI, route, and wiring assertions
together.
