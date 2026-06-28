## Why this slice exists

#414 asks the test suite to stop proving behavior through hand-built local
stubs when the repo already has real modules and adapters. The uploaded-search
harness is the clearest remaining example: it writes fake `@/lib/*` modules into
a temporary `node_modules`, transpiles the route, and verifies the fake seam
instead of the real `@/` import graph.

This slice migrates that harness onto the real Vitest runner introduced by the
previous slice, so uploaded-search route tests import the production route and
exercise the real local matcher, config gate, rate limiter, and ATLAS client.

## Scope (this PR)

Slice phase: Functional validation

1. Replace `test-deflection-uploaded-search.mjs` with a Vitest test that imports
   the real `@/app/api/demo/deflection-search/route` module.
2. Mock only external boundaries: ATLAS HTTP via `globalThis.fetch`, clock/rate
   bucket state, and runtime logging side effects.
3. Keep the existing uploaded-search guard, error, and CLI smoke helper behavior
   coverage on the real-import path.
4. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the uploaded-search test through Vitest.
- `web/plans/PR-Real-Adapter-Uploaded-Search-Test.md` — plan for this slice.
- `web/scripts/test-deflection-uploaded-search.mjs` — remove the fake-module
  harness.
- `web/src/app/api/demo/deflection-search/route.test.ts` — add the real-import
  uploaded-search route test.

## Mechanism

The new test imports `GET` and `POST` from the production route via the `@/`
alias. The route then imports the real `deflection-demo`, `atlas-deflection-client`,
`deflection-rate-limit`, `deflection-uploaded-search-config`, and
`structured-runtime-log` modules through the normal application path.

The test provides route-shaped request fixtures and a queued `globalThis.fetch`
implementation that stands in for the ATLAS HTTP boundary. The queued responses
use the real ATLAS client response envelope: report-model access checks are
served from `/report-model`, and uploaded-search results are served from
`/search`. Rate-limit state is reset through the real global store between
tests; it is not replaced.

The migration also preserves coverage parity for the old guard/error cases:
the explicit uploaded-search kill switch, production default gate, upstream
search failures, and smoke-helper failure branches are asserted through the real
route or smoke helper instead of through temp-module stubs.

## Intentional

- This PR migrates one harness. `test-deflection-report-model-result-page.mjs`
  is much larger and remains a follow-up so review can focus on one real-adapter
  conversion.
- ATLAS HTTP is mocked because it is the external service boundary. The internal
  route, config, rate-limit, local matcher, and ATLAS client code remain in the
  call path.
- A few component-wiring source checks from the old harness are not carried
  forward here. This slice focuses on route behavior that Vitest can exercise
  through real imports; broad component rendering belongs in a separate UI test
  slice if needed.

## Deferred

The remaining #414 harness migrations stay queued after this one, especially
the larger report-model result-page migration.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-uploaded-search # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "__uploadedSearch|node scripts/test-deflection-uploaded-search|test-deflection-uploaded-search\\.mjs" web/package.json web/scripts web/src; then exit 1; else echo "No uploaded-search fake harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~1 |
| `web/plans/PR-Real-Adapter-Uploaded-Search-Test.md` | ~75 |
| `web/scripts/test-deflection-uploaded-search.mjs` | ~458 |
| `web/src/app/api/demo/deflection-search/route.test.ts` | ~320 |
| Total | ~854 |

This is over the 400-LOC soft cap because the old standalone harness is deleted
and replaced with a real-import test in the same slice.
