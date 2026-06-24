## Why this slice exists

PR-Deflection-Review-Controls connected the suppressed repeat review queue to the review-decision API, but the validation stayed source-level. Issue #324 now depends on these controls being trustworthy in the browser: saved state must load, successful saves must update the row, failure states must stay retryable, and rows without hosted-safe handles must not silently look actionable.

This slice adds browser-level smoke coverage for that runtime behavior without widening the customer-facing report surface or depending on production report access and database configuration.

## Scope (this PR)

Slice phase: Functional validation

1. Allow the existing review-decision client island to receive an optional API path, defaulting to the production `/api/deflection-review-decisions` route.
2. Add a development-only smoke API that mimics saved, unconfigured, and failed decision states for deterministic local browser verification.
3. Add a development-only smoke page that renders the real review-decision control in success, missing-key, unconfigured, and save-failure scenarios.
4. Add an `agent-browser` smoke runner and npm script that opens the local smoke page, clicks the real controls, asserts runtime status text, verifies disabled states, and checks page errors.
5. Keep the existing source-level result-page smoke aligned with the production default endpoint.

### Files touched

- `web/package.json` - adds the local browser smoke script.
- `web/plans/PR-Deflection-Review-Control-Browser-Smoke.md` - slice contract.
- `web/scripts/smoke-deflection-review-control-browser.mjs` - drives `agent-browser` against the local smoke page.
- `web/src/app/api/deflection-review-control-smoke/route.ts` - dev-only smoke API for deterministic review-decision states.
- `web/src/app/systems/support-ticket-deflection/review-control-smoke/page.tsx` - dev-only smoke harness page.
- `web/src/components/landing/DeflectionReviewDecisionControl.tsx` - accepts an optional API path while keeping the production default.

## Mechanism

`DeflectionReviewDecisionControl` keeps using `/api/deflection-review-decisions` by default. The only product-code change is an optional `apiPath` prop used by the dev harness, and the cache key includes that path so smoke loads cannot poison production-route cached decisions.

The smoke API exists at `/api/deflection-review-control-smoke` and returns `404` outside development. In development it returns deterministic records for known smoke request IDs and a controlled save failure for one review key. The smoke page also returns `notFound()` outside development, so the harness cannot become a linked production page.

The smoke runner expects a running local dev server. It uses `agent-browser` with an isolated session, opens the smoke URL, evaluates DOM assertions in Chromium, clicks the actual rendered buttons, waits for status changes, checks no-key/unconfigured disabled states, checks the save-failure message, then fails if `agent-browser errors` reports page exceptions.

## Intentional

- This is a local smoke, not a CI-enrolled `test:*` script. `agent-browser` is an agent workstation tool, and the repo CI should not assume it exists.
- No network mocking in the browser runner. The smoke route gives us deterministic runtime behavior without relying on undocumented CLI route matching.
- No changes to the production review-decision API contract. The harness passes an alternate API path instead of special-casing production request IDs.

## Deferred

- CI-hosted browser coverage for these controls, if we later add a first-class browser-test dependency to the repo.
- Applying reviewer decisions to downstream regenerated exports or ATLAS-side report state.

Parked hardening: none

## Verification

- `npm --prefix web ci` - passed; npm reported the existing audit advisory set (6 vulnerabilities) without changing tracked files.
- `node --check web/scripts/smoke-deflection-review-control-browser.mjs` - passed.
- `npm --prefix web run test:deflection-report-model-result-page` - passed.
- `npm --prefix web run check:dead-code` - passed.
- `npm exec eslint -- scripts/smoke-deflection-review-control-browser.mjs src/app/api/deflection-review-control-smoke/route.ts src/app/systems/support-ticket-deflection/review-control-smoke/page.tsx src/components/landing/DeflectionReviewDecisionControl.tsx` from `web/` - passed.
- `npm --prefix web run smoke:deflection-review-control-browser -- --url http://127.0.0.1:3107/systems/support-ticket-deflection/review-control-smoke --json` - passed against a local `next dev --webpack` server on port 3107.
- `npm --prefix web run build` - passed.

## Estimated diff size

| File | Estimate |
|---|---:|
| `web/package.json` | ~1 |
| `web/plans/PR-Deflection-Review-Control-Browser-Smoke.md` | ~68 |
| `web/scripts/smoke-deflection-review-control-browser.mjs` | ~277 |
| `web/src/app/api/deflection-review-control-smoke/route.ts` | ~79 |
| `web/src/app/systems/support-ticket-deflection/review-control-smoke/page.tsx` | ~87 |
| `web/src/components/landing/DeflectionReviewDecisionControl.tsx` | ~32 |
| Total | ~544 |

Soft cap note: this is over 400 LOC because a real browser smoke needs a deterministic local API and harness page in addition to the runner. The runner is intentionally verbose enough to report failed browser states instead of returning an opaque click failure.
