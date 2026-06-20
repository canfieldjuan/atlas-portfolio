# Plan: Uploaded CSV search workbench

## Why this slice exists

Issue #311 was originally phrased as flipping the public deflection demo search
from local sample data to Atlas. That is too broad and a little misleading for
the current product shape: the useful buyer experience is searching the report
created from the CSV they just uploaded, not searching a generic demo corpus.

This slice adds the portfolio side of that uploaded-report search workbench. It
keeps the public demo illustrative before upload, and uses Atlas only when a real
`reportRequestId` scopes the query to one generated report.

## Scope (this PR)

Slice phase: Vertical slice

1. Add a request-scoped Atlas search client for
   `/api/v1/content-ops/deflection-reports/{request_id}/search`.
2. Extend the existing same-origin demo search route so `requestId` means
   uploaded-report search, while no `requestId` keeps the local demo behavior.
3. Make the demo search component configurable and mount it on the Snapshot
   results page with chips from the uploaded Snapshot's top questions.
4. Add focused tests for local mode, uploaded mode, no-match, upstream failure,
   query capping, and test enrollment.

### Files touched

- `web/plans/PR-Uploaded-Deflection-Search.md` — this plan doc.
- `web/src/lib/atlas-deflection-client.ts` — request-scoped uploaded report search client and shape validation.
- `web/src/app/api/demo/deflection-search/route.ts` — route switch between local demo search and uploaded report search.
- `web/src/lib/deflection-demo.ts` — optional request id in the client-side search helper.
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — configurable copy/chips/search scope for reused results-page workbench.
- `web/src/components/landing/DeflectionResultsPage.tsx` — uploaded-report search panel on the Snapshot results page.
- `web/scripts/test-deflection-uploaded-search.mjs` — focused route/client/source test.
- `web/package.json` — test script registration.
- `.github/workflows/pre_push_audit.yml` — CI enrollment for the new test.

## Mechanism

The same-origin route remains `GET /api/demo/deflection-search?q=...`. When no
`requestId` query param is supplied, it returns the current local
`matchLocal(q)` response with `source: 'local'`. When `requestId` is supplied, it
calls Atlas with the server-only `ATLAS_API_BASE_URL` and
`ATLAS_B2B_SERVICE_TOKEN` credentials:

`GET /api/v1/content-ops/deflection-reports/{request_id}/search?q=<query>&limit=5`

The uploaded path never falls back to the local sample dataset. Empty Atlas
results return `{ match: null, source: 'atlas' }`; upstream/config/shape failures
return a generic non-OK response so the client renders a retryable unavailable
state.

The Atlas response parser accepts an envelope with `results[]`. A non-empty
result must contain a valid `TicketFAQItem` directly or under `item`/`faq_item`.
The portfolio does not adapt compact search rows into fake report items.

## Intentional

- The public landing/demo search stays sample-backed until the visitor uploads a
  CSV.
- Uploaded-report search has no local fallback because mixing sample answers
  into a real uploaded report would be misleading.
- The new route assumes an Atlas request-scoped search endpoint. If Atlas returns
  only compact rows, the parser rejects the shape instead of fabricating fields.
- The Snapshot remains bounded; this adds an interactive search affordance scoped
  to Atlas-approved uploaded search output, not a hidden bypass around paid full
  report gates.

## Deferred

- Atlas may still need the matching endpoint/indexing slice if
  `/deflection-reports/{request_id}/search` is not deployed yet.
- No changes to checkout, report-model rendering, artifact unlock, or Snapshot
  generation.
- No landing-page copy changes beyond reused configurable demo labels.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-uploaded-search` — passed.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all `test:*`
  scripts are enrolled in `.github/workflows/pre_push_audit.yml`.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~90 |
| Atlas search client + parser | ~130 |
| API route/helper wiring | ~45 |
| Demo component configurability | ~65 |
| Results-page mount | ~25 |
| Test + enrollment | ~157 |
| Total | ~475 |

This is over the 400-LOC soft cap because the vertical slice needs route,
server-only Atlas validation, reusable UI, and enrolled tests together. Splitting
the UI from the route would leave the uploaded search unexercised.
