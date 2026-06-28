## Why this slice exists

#313's deletion item is now unblocked because ATLAS PR #1806 added
`DELETE /api/v1/content-ops/deflection-reports/{request_id}` and ATLAS PR #1809
added backend TTL defense-in-depth. Portfolio cleanup still deletes only the
uploaded CSV Blob and Neon intake row, so an expired uploaded report can leave
the ATLAS-derived report behind.

This slice wires the existing 30-day portfolio cleanup cron to the ATLAS delete
endpoint so the portfolio side honors the end-to-end retention path for new
submissions.

## Scope (this PR)

Slice phase: Production hardening

1. Add a server-only ATLAS delete helper for deflection reports.
2. During tracked submission cleanup, delete the raw CSV Blob first, then delete
   the ATLAS report by `reportRequestId`, then delete the Neon row only after
   both external stores are cleared.
3. Treat ATLAS 204 and 404 as successful/idempotent cleanup; fail soft on other
   ATLAS errors so the cron keeps processing other submissions but does not
   remove the Neon row for that failed report.
4. Extend the enrolled CSV privacy/cleanup test to cover delete ordering,
   ATLAS failure retention, and 404 idempotency.

### Files touched

- `web/plans/PR-Deflection-Cleanup-Atlas-Delete.md` — plan for this slice.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` — extend cleanup coverage for ATLAS report deletion.
- `web/src/lib/atlas-deflection-client.ts` — add the server-only report delete helper.
- `web/src/lib/gap-report-cleanup.ts` — call the ATLAS delete helper before removing expired Neon rows.
- `web/src/lib/gap-report-intake-database.ts` — expose expired rows' ATLAS report request ids to cleanup.

## Mechanism

`deleteDeflectionReport(requestId)` reuses `atlasConfig()`, validates the request
id with the existing `REQUEST_ID_RE`, sends an authenticated `DELETE` to
`/api/v1/content-ops/deflection-reports/{request_id}`, and returns a compact
result instead of throwing. It treats missing ATLAS config as `not_configured`,
204 and 404 as `ok`, and all other HTTP/network outcomes as `error` with a
structured runtime log.

`cleanupTrackedSubmissions()` keeps its existing blob-first behavior, then calls
the ATLAS delete helper for the expired submission's `reportRequestId`. Only
submissions whose Blob delete and ATLAS delete both succeed are added to the
`deleteGapReportSubmissions()` batch. A failed ATLAS delete records an error and
leaves the Neon row in place so the next cron can retry.

`listExpiredGapReportSubmissions()` now projects `payload->>'reportRequestId'`
and limits this path to rows with a non-empty ATLAS report id. Rows without that
payload cannot be deleted from ATLAS by this cron path and remain deferred rather
than being silently marked complete.

## Intentional

- Orphaned Blob cleanup cannot delete ATLAS reports because orphaned blobs have
  no Neon payload and therefore no `reportRequestId`. This slice only guarantees
  end-to-end cleanup for tracked submissions.
- Missing ATLAS config fails soft but keeps the Neon row. That avoids data loss
  and surfaces a cleanup error instead of silently claiming the report was purged.
- The portfolio does not inspect whether ATLAS deleted or returned 404; both are
  retention-success states because the row is absent afterward.

## Deferred

- Customer self-service purge remains a separate M5 slice.
- Existing historical rows, if any, are not backfilled or manually purged in this
  code slice.
- Parked hardening: NPM-AUDIT-WEB-1 — web dependency audit findings.

## Verification

```bash
npm --prefix web run test:deflection-csv-privacy # PASS
npm --prefix web run lint # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Plan doc | ~90 |
| ATLAS delete helper | ~45 |
| Cleanup and database wiring | ~45 |
| Tests | ~90 |
| Total | ~270 |
