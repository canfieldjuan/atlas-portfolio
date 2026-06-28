## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses now that Vitest can
load TypeScript directly. The legacy deflection results redirect test still
compiles `next.config.ts` into a temporary CommonJS file before requiring it.

This slice migrates that redirect coverage to Vitest so the test imports the
real Next config module directly.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the legacy results redirect temp transpile harness with a Vitest test.
2. Preserve coverage for the permanent legacy FAQ-deflection result redirect.
3. Preserve the uniqueness checks that prevent duplicate legacy sources or a
   second redirect into the canonical result route.
4. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/next.config.test.ts` — add direct-import redirect coverage.
- `web/package.json` — run the legacy redirect test through Vitest.
- `web/plans/PR-Real-Adapter-Legacy-Results-Redirect-Test.md` — plan for this
  slice.
- `web/scripts/test-deflection-legacy-results-redirect.mjs` — remove the temp
  transpile harness.

## Mechanism

The new test imports the default export from `next.config.ts` and calls its
`redirects()` function directly. That keeps the real config shape in the call
path without compiling a copy into a temp directory.

The assertions are a direct carryover from the old harness: the legacy source
must permanently redirect to the canonical support-ticket-deflection result
route, appear exactly once, and be the only redirect targeting that result route.

## Intentional

- This slice tests config behavior only. It does not exercise a running Next
  server because the existing harness asserted the config contract, not HTTP
  redirect execution.
- No external service is mocked because the config has no external service
  boundary.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-legacy-results-redirect # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-legacy-results-redirect\\.mjs|atlas-deflection-legacy-redirect" web/package.json web/scripts web/next.config.test.ts; then exit 1; else echo "No legacy redirect temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/next.config.test.ts` | ~34 |
| `web/package.json` | ~1 |
| `web/plans/PR-Real-Adapter-Legacy-Results-Redirect-Test.md` | ~74 |
| `web/scripts/test-deflection-legacy-results-redirect.mjs` | ~57 |
| Total | ~166 |
