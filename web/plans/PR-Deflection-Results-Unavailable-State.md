# PR-Deflection-Results-Unavailable-State

## Why this slice exists

The #1440 live proof currently reaches the correct hosted buyer URL,
`/systems/support-ticket-deflection/results/content-ops-45c06a6950ec4677a214368d6e4dc44f`,
but the public page returns HTTP 500. A stale `/services/faq-deflection/...`
link also returns 404, but the current route failing as a framework error is
the higher-value root to close first: the result route treats expected
snapshot-fetch/config failures as uncaught exceptions.

Next.js 16's local docs say expected errors in Server Components should be
modeled as return values instead of thrown exceptions. This slice applies that
guidance to the deflection results route so buyer-facing snapshot unavailability
renders as an explicit state instead of a raw production 500.

## Scope (this PR)

Slice phase: Production hardening

1. Add a small deterministic route-state mapper for deflection snapshot fetch
   results.
2. Change the results route to render a buyer-safe unavailable state when the
   snapshot is temporarily unavailable or production config is missing.
3. Keep invalid/missing request IDs as real `notFound()` responses.
4. Keep local development fallback to the demo fixture for missing config.
5. Add focused tests for the route-state mapper and CI-enroll them.

### Files touched

- `web/plans/PR-Deflection-Results-Unavailable-State.md` - plan doc.
- `web/src/lib/deflection-results-state.ts` - snapshot fetch result to route-state mapper.
- `web/src/components/landing/DeflectionResultsUnavailablePage.tsx` - buyer-safe unavailable state.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` - route uses the expected-state mapper instead of throwing for expected failures.
- `web/scripts/smoke-deflection-hosted-results.mjs` - smoke names the unavailable state distinctly while keeping it failing.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - coverage for unavailable-state smoke detection.
- `web/scripts/test-deflection-results-state.mjs` - route-state mapper tests.
- `web/package.json` - test script enrollment.
- `.github/workflows/pre_push_audit.yml` - CI enrollment for the new test script.

## Mechanism

The new mapper receives the existing `SnapshotFetchResult` union and the current
environment name, then returns one of:

- `snapshot` - render the real ATLAS snapshot.
- `snapshot` with the demo fixture - local-only missing-config fallback.
- `not_found` - preserve `notFound()` for invalid or missing request IDs.
- `unavailable` - render a generic unavailable page for production
  `not_configured` and upstream `error` states.

The route keeps artifact fetching as the first branch: unlocked paid artifacts
still render immediately, and locked/missing artifacts fall through to the
snapshot state just as they do today. The unavailable component exposes no
upstream host, token, raw error, or request internals; it gives the buyer a
retry path and a return link.

## Intentional

- The live hosted smoke is still expected to fail until the page renders a real
  snapshot with the required result markers. This slice should move the failure
  from raw HTTP 500 toward an explicit unavailable state; it does not pretend the
  live proof is complete.
- No production fallback to demo data. Serving fake results for a real request
  would be worse than an unavailable state.
- The stale `/services/faq-deflection/...` URL is deferred because the current
  canonical `/systems/...` route is also failing and is the upstream buyer path
  to stabilize first.

## Deferred

- Live proof for the current request ID after deployed ATLAS snapshot config and
  data availability are confirmed.
- Stale `/services/faq-deflection/results/...` link cleanup or redirect, once
  the canonical route renders safely.
- Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-results-state` - passed.
- `npm --prefix web run test:deflection-hosted-results-smoke` - passed.
- `node web/scripts/audit-test-enrollment.mjs` - passed; all 27 `test:*`
  scripts enrolled in `.github/workflows/pre_push_audit.yml`.
- `npm --prefix web run lint -- src/lib/deflection-results-state.ts src/components/landing/DeflectionResultsUnavailablePage.tsx src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx scripts/smoke-deflection-hosted-results.mjs scripts/test-deflection-hosted-results-smoke.mjs scripts/test-deflection-results-state.mjs` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | Estimate |
|---|---:|
| `web/plans/PR-Deflection-Results-Unavailable-State.md` | ~80 |
| `web/src/lib/deflection-results-state.ts` | ~35 |
| `web/src/components/landing/DeflectionResultsUnavailablePage.tsx` | ~55 |
| `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` | ~20 |
| `web/scripts/smoke-deflection-hosted-results.mjs` | ~5 |
| `web/scripts/test-deflection-hosted-results-smoke.mjs` | ~15 |
| `web/scripts/test-deflection-results-state.mjs` | ~110 |
| `web/package.json` | ~1 |
| `.github/workflows/pre_push_audit.yml` | ~3 |
| Total | ~324 |
