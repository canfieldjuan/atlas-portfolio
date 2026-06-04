## Why this slice exists

atlas-portfolio#197 now has the additive short Snapshot landing page promoted
and refocused around one offer: upload a CSV and get the free Deflection
Snapshot. The route has been verified manually in browser checks, but there is
no reusable hosted smoke that protects the page contract after the copy and
positioning work.

This slice adds a small public-page smoke so future changes fail fast if the
route stops rendering the Snapshot-first promise, before/after proof, final
Snapshot CTA, or intake link.

## Scope (this PR)

Slice phase: Functional validation

1. Add a `smoke:deflection-snapshot-landing` script that fetches the public
   `/systems/support-ticket-deflection/snapshot` route.
2. Require the core #197 markers: free Snapshot badge, promise headline,
   before/after proof, Snapshot action framing, final Snapshot-only ask, and
   intake CTA target.
3. Fail if old paid-report-first phrases return on the landing page.
4. Add focused mocked tests for success, bad base URL, HTTP failure, missing
   required marker, forbidden phrase, and CLI missing-output cases.
5. Preserve the page implementation, intake route, checkout, results page, and
   paid report behavior.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Landing-Smoke.md`
- `web/package.json`
- `web/scripts/smoke-deflection-snapshot-landing.mjs`
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs`

## Mechanism

The smoke follows the existing deflection hosted-smoke pattern: normalize a
public base URL, fetch a single HTML page with `cache: 'no-store'`, reject bad
HTTP responses, and inspect the returned HTML for exact markers.

Required markers prove the route is still the short Snapshot landing page rather
than a generic error page or the older full-report-first framing. Forbidden
markers fail closed if the high-pressure paid-report language removed in
PR-Deflection-Snapshot-Offer-Focus comes back.

## Intentional

- This does not use a browser. Browser layout checks remain manual for visual
  slices; this smoke is a fast hosted render contract for CI/local use.
- This does not test the intake upload flow. It only proves the landing page
  links to intake.
- This does not close #197 by itself; it locks the route contract so future
  product slices can move faster.

## Deferred

- Adding this smoke to CI or a scheduled production monitor remains a separate
  workflow slice.
- Visual regression screenshots for the landing route remain out of scope.
- Parked hardening: none.

## Verification

Ran before push:

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed
- `rg -n "smoke:deflection-snapshot-landing|test:deflection-snapshot-landing-smoke|Snapshot landing page is missing required render markers|paid-report-first" web/package.json web/scripts web/plans/PR-Deflection-Snapshot-Landing-Smoke.md -S` - expected script, test, and failure markers present
- `npm --prefix web run lint` - passed
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Total | ~399 |
