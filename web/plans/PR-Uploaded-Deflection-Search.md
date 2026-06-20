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
   `POST /api/v1/content-ops/deflection-reports/{request_id}/search`.
2. Extend the existing same-origin demo search route so `requestId` means
   uploaded-report search, while no `requestId` keeps the local demo behavior.
3. Make the demo search component configurable and mount it on the unlocked
   report-model page with chips from that report.
4. Keep uploaded customer searches out of browser URLs by using a POST body,
   rate-limit the uploaded proxy with both IP-wide and per-report buckets, and
   require the report to be unlocked before returning full `TicketFAQItem` data.
5. Add focused tests for local mode, uploaded mode, no-match, locked reports,
   rate limiting, upstream failure, query capping, and test enrollment.

### Files touched

- `web/plans/PR-Uploaded-Deflection-Search.md` — this plan doc.
- `web/src/lib/atlas-deflection-client.ts` — request-scoped uploaded report search client and shape validation.
- `web/src/app/api/demo/deflection-search/route.ts` — route switch between local demo search and uploaded report search.
- `web/src/lib/deflection-demo.ts` — optional request id in the client-side search helper.
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — configurable copy/chips/search scope for reused report workbench.
- `web/src/components/landing/DeflectionReportModelPage.tsx` — uploaded-report search panel on the unlocked report page.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` — pass `requestId` into the unlocked report page.
- `web/scripts/test-deflection-uploaded-search.mjs` — focused route/client/source test.
- `web/package.json` — test script registration.
- `.github/workflows/pre_push_audit.yml` — CI enrollment for the new test.

## Mechanism

The same-origin route keeps `GET /api/demo/deflection-search?q=...` for the
public sample demo only. Uploaded report search uses `POST
/api/demo/deflection-search` with `{ requestId, q }`, so customer phrases from a
ticket export are not placed in browser history or URL logs. Before proxying to
Atlas, the route first applies an IP-wide client bucket, then a per-report
bucket, then verifies the report is unlocked by probing the paid report
model/artifact path. Only then does it call Atlas with the server-only
`ATLAS_API_BASE_URL` and `ATLAS_B2B_SERVICE_TOKEN` credentials:

`POST /api/v1/content-ops/deflection-reports/{request_id}/search`
with JSON `{ q, limit }`.

The uploaded path never falls back to the local sample dataset. Locked reports
return a generic 403, rate-limited calls return 429, empty Atlas results return
`{ match: null, source: 'atlas' }`, and upstream/config/shape failures return a
generic non-OK response so the client renders a retryable unavailable state.

The Atlas response parser accepts an envelope with `results[]`. A non-empty
result must contain a valid `TicketFAQItem` directly or under `item`/`faq_item`.
The portfolio does not adapt compact search rows into fake report items.

## Intentional

- The public landing/demo search stays sample-backed until the visitor unlocks a
  report.
- Uploaded-report search has no local fallback because mixing sample answers
  into a real uploaded report would be misleading.
- The new route assumes an Atlas request-scoped search endpoint. If Atlas returns
  only compact rows, the parser rejects the shape instead of fabricating fields.
- The free Snapshot remains bounded. Full answer/evidence search is mounted only
  on the unlocked report-model page, not on the free Snapshot page.

## Deferred

- Atlas may still need the matching POST endpoint/indexing slice if
  `/deflection-reports/{request_id}/search` is not deployed yet.
- No changes to checkout, artifact unlock, or Snapshot generation.
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
| Plan doc | ~105 |
| Atlas search client + parser | ~130 |
| API route/helper wiring | ~105 |
| Demo component configurability | ~65 |
| Unlocked report-page mount | ~45 |
| Test + enrollment | ~215 |
| Total | ~620 |

This is over the 400-LOC soft cap because the vertical slice needs route,
server-only Atlas validation, reusable UI, and enrolled tests together. Splitting
the UI from the route would leave the uploaded search unexercised.
