# Plan: Deflection record idempotency

## Why this slice exists

#294 Finding 3 is the next launch blocker after #295: now that `/record` fails
closed on ATLAS submit failures, retries must not create duplicate ATLAS submits
or rows for the same email and CSV blob.

This lands just over the 400-line soft cap because the slice needs behavioral
coverage for both duplicate short-circuiting and 429-before-side-effects.

## Scope (this PR)

Slice phase: Production hardening
Ownership lane: deflection/go-live

1. Rate-limit support-ticket-deflection `/record` submissions by client IP and
   normalized email without charging email buckets for unowned blob URLs.
2. Before `submitDeflectionReportCsv(...)`, look up an existing
   support-ticket-deflection row for the same `email + csvBlobUrl` within one
   hour.
3. If that row already has a valid `reportRequestId`, return it as
   `status: "already_submitted"` without calling ATLAS or persisting again.
4. Keep the existing success path and partner durable-persistence guard intact.
5. Disable the intake submit button while the current attempt is in flight.

### Files touched

- `web/plans/PR-Deflection-Record-Idempotency.md` - this plan doc.
- `web/src/lib/deflection-rate-limit.ts` - add identifier-only email buckets.
- `web/scripts/test-deflection-rate-limit.mjs` - cover email bucket behavior.
- `web/src/lib/gap-report-intake-database.ts` - add the recent duplicate lookup.
- `web/src/app/api/gap-report-intake/record/route.ts` - apply record throttling
  and duplicate short-circuiting.
- `web/scripts/test-deflection-partner-access.mjs` - compiled route regression
  for duplicate short-circuit and record-route rate limit.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - source assertions for
  the record route and submit button hooks.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` - disable
  in-flight submit.

### Review Contract

Acceptance criteria:
- Exhausted IP buckets return `429` before Blob ownership; exhausted email
  buckets return `429` only after Blob ownership is confirmed and before ATLAS
  submit or persistence.
- A duplicate support-ticket-deflection record request for the same email and
  blob URL within one hour returns the existing `requestId` and `reportRequestId`
  with `ok: true` and `status: "already_submitted"`.
- The duplicate branch does not call `submitDeflectionReportCsv(...)` and does
  not call `recordGapReportSubmission(...)`.
- Non-duplicate submissions still call ATLAS once and return the generated
  `reportRequestId`.
- The partner durable-persistence failure branch remains fail-closed.
- The submit button is disabled while a submission is in flight.

Affected surfaces:
- Support Ticket Deflection CSV intake `/record` route, DB lookup helper, shared
  deflection rate-limit helper, and intake submit button state.

Risk areas:
- Overbroad idempotency could return stale reports; tight buckets could block
  legitimate retries; DB lookup must fail open when persistence is absent.

Triggered reviewer rules:
- R1 Requirements match; R2 Test evidence; R3 Security/privacy; R7 UI/copy
  truthfulness; R11 Scope control.

## Mechanism

After metadata validation, the route consumes the client-IP bucket before Blob
ownership. After `hasOwnedBlob(...)` confirms the upload belongs to our store,
it consumes the normalized-email bucket before duplicate lookup or ATLAS submit.

For support-ticket-deflection records, the route then asks the database helper
for a recent row matching lowercased email, exact CSV blob URL, the support
deflection source offer, a one-hour cutoff, and a non-empty `reportRequestId`.

If found, `/record` returns the existing `requestId` and `reportRequestId`
before ATLAS submit. Otherwise it follows the existing submit/persistence flow.

## Intentional

- This PR fixes #294 Finding 3 only. Findings 2, 4, 9, 10, and 11 stay separate.
- Idempotency is DB-backed and active when production persistence is configured.
  It does not make standard deflection persistence mandatory in local/dev
  fallback mode.
- The rate limiter remains in-memory best-effort; #294 Finding 4 is the
  distributed/KV follow-up.
- The idempotency key is `email + csvBlobUrl`, matching the audit finding. The
  one-hour window prevents very old uploads from permanently owning a buyer's
  future attempts.

## Deferred

- #294 Findings 2, 4, 9, 10, and 11 remain separate slices.

Parked hardening: none.

## Verification

- Passed: `npm --prefix web run test:deflection-rate-limit`,
  `test:deflection-partner-access`, `test:deflection-intake-atlas-submit`,
  `test:deflection-browser-upload-smoke`, `test:deflection-csv-privacy`, and
  `test:deflection-email-results-link`. The partner harness covers duplicate
  no-ATLAS/no-persistence, forged-unowned-blob no-email-quota, and
  429-before-side-effects branches.
- `npm --prefix web run check:dead-code` - passed; Knip baseline still matches
  16 known findings.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed; plan audits, drift check, Knip,
  ESLint, Next build, and `git diff --check` all passed.
- `rg -n "already_submitted|Too many submission attempts|getRecentGapReportSubmissionByEmailAndBlob|consumeRecordClientRateLimit|consumeRecordEmailRateLimit|disabled=\\{isSubmitting\\}|submitDeflectionReportCsv" web/src web/scripts web/plans/PR-Deflection-Record-Idempotency.md`
  - confirmed new duplicate, rate-limit, and in-flight button hooks.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +128 |
| Rate-limit helper and focused test | +55 / -5 |
| DB duplicate lookup | +45 |
| Record route hook | +50 |
| Route harness regressions | +110 / -10 |
| Intake button state | +10 |
| Total | ~445 changed |
