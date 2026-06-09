# Plan: Deflection snapshot email

## Why this slice exists

The deflection funnel has two email touchpoints owned by two repos: the free
Snapshot email from `atlas-portfolio`, and the paid full-report delivery email
from the ATLAS backend. The backend full-report delivery path is proven, but the
portfolio upload path still names the customer email as a generic confirmation
and the browser-upload smoke can false-fail on real snapshots with zero drafted
answers. That makes it too easy to pass the paid email while missing the free
Snapshot email.

## Scope (this PR)

Slice phase: Production hardening

1. Make the portfolio customer email explicitly a Snapshot email in function
   names, status fields, warnings, and tests.
2. Keep the existing confirmation fields as compatibility aliases in the
   persisted payload so admin/backfill readers do not break.
3. Relax the hosted results smoke so a valid no-drafted-answer Snapshot still
   passes while real Next not-found pages still fail.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Email.md` - this plan doc.
- `web/src/lib/gap-report-intake.ts` - snapshot-email naming, payload status,
  and failure warning.
- `web/scripts/test-deflection-email-results-link.mjs` - focused transport test
  proving the Snapshot email body and status payload.
- `web/scripts/smoke-deflection-hosted-results.mjs` - accept no-drafted-answer
  locked snapshots and avoid false-positive Next payload markers.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - smoke fixture
  coverage for no-drafted-answer snapshots and true not-found pages.
- `web/scripts/test-deflection-browser-upload-smoke.mjs` - update the
  browser-upload result-marker assertion to the new Snapshot state marker.

## Mechanism

`recordGapReportSubmission(...)` still sends the internal operator notification
and the customer-facing email independently. The customer-facing send is renamed
to `sendSnapshotEmail(...)`, records `snapshotEmailStatus` /
`snapshotEmailError`, and preserves `confirmationStatus` /
`confirmationError` as compatibility aliases with the same values.

The hosted results smoke now treats the teaser answer as one of two acceptable
locked snapshot states: either the page has a drafted-answer teaser, or it has
the no-proven-answer copy produced by ATLAS when the upload has no proven
resolution evidence. It only reports a Next not-found marker when the actual
page marker is present and the required Snapshot markers are absent.

## Intentional

- This PR does not touch ATLAS full-report delivery. That email is the paid
  backend touchpoint and was already proven separately through the signed Stripe
  webhook and scheduled Resend delivery runner.
- The customer Snapshot email remains plain text and link-based. PDF
  attachments are deferred to issue #1406.
- The smoke still requires the public results page to render the Snapshot
  badge, headline, Support Tax projection, SEO targeting list, and unlock CTA.

## Deferred

- Issue #1408 waits until this Snapshot email proof is merged.
- PDF Snapshot/full-report attachments remain issue #1406.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-email-results-link` - passed.
- `npm --prefix web run test:deflection-hosted-results-smoke` - passed.
- `npm --prefix web run test:deflection-browser-upload-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh --allow-dirty` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| Snapshot email code | ~35 |
| Focused tests | ~105 |
| Hosted-results smoke | ~30 |
| **Total** | ~255 |
