## Why this slice exists

#313 asks for a self-service purge path so a customer can delete uploaded
Resolution Audit data without waiting for the 30-day retention cron. The
scheduled cleanup now removes tracked CSV Blobs, ATLAS reports, and Neon rows,
but customers still have no immediate control from the hosted results page.

This slice adds a narrow, capability-link purge path keyed by the existing
unguessable report request id in the hosted results URL.

The slice is slightly over the 400-LOC soft cap because the endpoint, shared
delete helper, all hosted result surfaces, and the enrolled privacy contract
test need to land together for the customer-facing purge path to be truthful.

## Scope (this PR)

Slice phase: Production hardening

1. Add a public, rate-limited purge endpoint for hosted deflection report
   request ids.
2. Add a server-side purge helper that deletes the tracked CSV Blob, the ATLAS
   report, and then the Neon tracking row.
3. Add a small two-step deletion control to free and paid hosted result views.
4. Extend the enrolled CSV privacy/cleanup contract test to cover the endpoint,
   purge sequencing, and result-view control wiring.
5. Update the hosted report-model result-page contract for the artifact page's
   new purge `requestId` prop.
6. Keep the uploaded-search contract focused on the paid search component now
   that the free Snapshot can pass `requestId` to the purge control.

### Files touched

- `web/plans/PR-Deflection-Self-Service-Purge.md` — plan for this slice.
- `web/scripts/test-deflection-report-model-result-page.mjs` — keep artifact result-page prop coverage aligned with the purge control.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` — extend privacy contract coverage for self-service purge.
- `web/scripts/test-deflection-uploaded-search.mjs` — keep uploaded-search result-page assertions scoped to the search component.
- `web/src/app/api/deflection-report-purge/route.ts` — add the rate-limited purge endpoint.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` — pass the request id into paid artifact rendering.
- `web/src/components/landing/DeflectionReportArtifactPage.tsx` — render the purge control on legacy paid artifact results.
- `web/src/components/landing/DeflectionReportModelPage.tsx` — render the purge control on structured paid report results.
- `web/src/components/landing/DeflectionReportPurgeControl.tsx` — add the reusable client-side purge control.
- `web/src/components/landing/DeflectionResultsPage.tsx` — render the purge control on free Snapshot results.
- `web/src/lib/gap-report-cleanup.ts` — add the reusable tracked-submission purge helper.
- `web/src/lib/gap-report-intake-database.ts` — look up purge targets by ATLAS report request id.

## Mechanism

`POST /api/deflection-report-purge` accepts `{ requestId }`, validates it with
the same request-id shape as report status polling, and rate-limits by request
id plus caller headers. The route calls a server-side purge helper and returns
generic customer-safe errors.

`purgeGapReportSubmissionByReportRequestId()` looks up the tracked submission
whose payload contains the ATLAS `reportRequestId`. It deletes the uploaded CSV
Blob first, then deletes the ATLAS report through the existing ATLAS delete
helper, then deletes the Neon row. The database row is removed only after Blob
and ATLAS deletion have succeeded, preserving retry handles if an external
delete fails.

The hosted result pages render one reusable client component. The control is
low-prominence and two-step: first click reveals confirmation copy, second click
posts to the purge endpoint. On success, it tells the customer the upload and
report were deleted instead of auto-redirecting into a confusing 404.

## Intentional

- This is capability-link deletion, not email-verified deletion. The existing
  result URL already contains the unguessable report request id; adding a new
  email verification flow is larger and remains outside this slice.
- The purge path requires a tracked Neon submission. Historical reports without
  a tracking row cannot be proven to have a CSV Blob in portfolio storage and
  are not silently claimed as purged by this endpoint.
- The endpoint returns generic errors to the browser and logs structured
  server-side detail through the purge helper.

## Deferred

- Email-verified deletion for customers who no longer have the hosted result URL.
- Historical backfill/manual purge for reports that predate tracked submission
  storage.
- Parked hardening: NPM-AUDIT-WEB-1 — web dependency audit findings.

## Verification

```bash
npm --prefix web run test:deflection-csv-privacy # PASS
npm --prefix web run test:deflection-report-model-result-page # PASS
npm --prefix web run test:deflection-uploaded-search # PASS
npm --prefix web run lint # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Plan doc | ~95 |
| Purge endpoint and library wiring | ~130 |
| Result-page purge control | ~125 |
| Tests | ~140 |
| Total | ~490 |
