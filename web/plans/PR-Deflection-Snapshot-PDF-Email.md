# Plan: Deflection snapshot PDF email

## Why this slice exists

Issue #1406 asks for both deflection email touchpoints to send attached PDF
deliverables. PR #1418 landed the ATLAS backend side for paid Full Report
delivery. The portfolio side still sends the free Snapshot email as plain text
with only the results link, so a buyer can reach the Snapshot page but does not
receive the share/export artifact the go-live lane now expects.

This is over the 400 LOC soft cap because the smallest complete slice needs the
renderer, the email attachment integration, and enrolled tests that prove both
the Resend payload and the free-content privacy boundary.

## Scope (this PR)

Slice phase: Production hardening

1. Generate a deterministic server-side PDF attachment from the already
   validated free `DeflectionSnapshot` shape.
2. Attach that PDF to the existing customer Snapshot email when the intake route
   has a live ATLAS `reportRequestId` and the free Snapshot can be fetched.
3. Keep the Snapshot PDF bounded to free content only: summary counts, top free
   questions, customer wording, Support Tax framing, the one free teaser answer,
   and locked rank/count placeholders.
4. Keep the existing Resend text email, results link, statuses, warnings,
   database payload shape, and paid Full Report delivery untouched.
5. Add focused transport and PDF-contract coverage, enrolling any new test in
   CI.

### Files touched

- `web/plans/PR-Deflection-Snapshot-PDF-Email.md` - plan contract for this slice.
- `web/src/lib/deflection-snapshot-pdf.ts` - deterministic PDF renderer and
  Resend attachment payload helper for the free Snapshot.
- `web/src/lib/gap-report-intake.ts` - accept an optional free Snapshot and add
  the PDF attachment to the customer Snapshot email payload.
- `web/src/app/api/gap-report-intake/record/route.ts` - fetch the validated
  Snapshot after ATLAS submit and pass it into the Snapshot email path.
- `web/scripts/test-deflection-email-results-link.mjs` - extend the Resend
  transport test to prove Snapshot emails include the attachment when available.
- `web/scripts/test-deflection-snapshot-pdf-email.mjs` - focused PDF contract
  test for free-only content, attachment shape, and fail-closed locked content.
- `web/package.json` - add the focused Snapshot PDF email test script.
- `.github/workflows/pre_push_audit.yml` - enroll the new test script in CI.

## Mechanism

The intake record route already submits support-ticket CSVs to ATLAS before it
calls `recordGapReportSubmission(...)`. This slice fetches the free Snapshot
from ATLAS after a successful submit, using the same validated
`fetchDeflectionSnapshot(...)` client that powers the results page. If the
fetch succeeds, the route passes the `DeflectionSnapshot` into the existing
customer Snapshot email function.

`createDeflectionSnapshotPdfAttachment(...)` builds a small valid PDF from
plain text sections. The text is derived only from the snapshot summary,
`top_questions`, `teaser.full_answer`, and locked rank/count placeholders. The
customer email adds a Resend `attachments` array only when that helper returns a
PDF attachment; otherwise the email stays link-only and the existing submission
flow remains non-blocking.

## Intentional

- The portfolio renderer is a deterministic TypeScript PDF helper rather than
  browser/HTML rendering or a new dependency. Portfolio does not have Python
  FPDF available, and this slice needs the email attachment, not pixel parity
  with the web page.
- Failed Snapshot fetches do not block the upload submission or existing email.
  They fail closed to no attachment, because the existing results link remains
  the authoritative live view and the email transport is already best-effort.
- No locked full-report artifact, source IDs, evidence quotes, raw ticket text,
  or answer bodies outside the free teaser are read or rendered.

## Deferred

- True visual parity between the Snapshot page and PDF remains out of scope
  until the operator chooses heavier HTML-to-PDF infrastructure.
- Paid Full Report PDF delivery remains in ATLAS and already landed in PR
  #1418.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-email-results-link` - passed.
- `npm --prefix web run test:deflection-snapshot-pdf-email` - passed.
- `node web/scripts/audit-test-enrollment.mjs` - passed; all 26 `test:*`
  scripts are enrolled in `.github/workflows/pre_push_audit.yml`.
- `npm --prefix web run test:test-enrollment-audit` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed after `npm --prefix web ci` installed
  this worktree's dependencies; the first build attempt failed before compiling
  app code because `web/node_modules` was absent in the new worktree.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Snapshot-PDF-Email.md` | ~105 |
| `web/src/lib/deflection-snapshot-pdf.ts` | ~206 |
| `web/src/lib/gap-report-intake.ts` | ~25 |
| `web/src/app/api/gap-report-intake/record/route.ts` | ~20 |
| `web/scripts/test-deflection-email-results-link.mjs` | ~57 |
| `web/scripts/test-deflection-snapshot-pdf-email.mjs` | ~141 |
| `web/package.json` | ~1 |
| `.github/workflows/pre_push_audit.yml` | ~3 |
| Total | ~558 |
