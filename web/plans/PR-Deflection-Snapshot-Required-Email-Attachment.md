# Deflection Snapshot Required Email Attachment

## Why this slice exists

ATLAS #1921 split the launch proof into a runbook plus automation/guards. The
runbook now says the free Snapshot email/PDF is a launch-blocking surface, but
the portfolio record route still logs `deflection.record.snapshot_pdf_attachment_skipped`
and then continues into `recordGapReportSubmission(...)` with no Snapshot. That
lets a support-deflection buyer receive a ready-link email without the required
Snapshot PDF attachment.

Root cause: the support-deflection route treats Snapshot fetch failure as an
operator warning while the customer email helper treats the Snapshot attachment
as optional. This PR fixes the root for the live route by failing closed before
local persistence/customer email when ATLAS accepted the CSV but the free
Snapshot cannot be fetched and attached.

## Scope (this PR)

Slice phase: Production hardening

1. Add a support-deflection Snapshot failure response for the record route.
2. Stop before `recordGapReportSubmission(...)` when `fetchDeflectionSnapshot(...)`
   fails after a successful ATLAS submit.
3. Add route-level coverage using the real imported record route, mocking only
   the Blob/DB/fetch boundaries.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Required-Email-Attachment.md` — slice contract.
- `web/src/app/api/gap-report-intake/record/route.ts` — fail closed on missing Snapshot attachment.
- `web/src/lib/deflection-partner-access.test.ts` — real-route regression coverage.

## Mechanism

`fetchDeflectionSnapshot(...)` already returns a typed failure reason. The route
will route those failures through a new `deflectionSnapshotFailureResponse(...)`
that:

1. logs `deflection.record.snapshot_pdf_attachment_skipped` with the reason and
   report request id;
2. returns a buyer-safe 502/503 JSON response with a distinct
   `status: 'failed_to_fetch_snapshot'`;
3. stops before `recordGapReportSubmission(...)`, so no local successful
   submission row and no link-only customer Snapshot email are created.

The existing no-`reportRequestId` email path remains unchanged for non-deflection
or pre-report cases. This guard only applies after a successful support-deflection
ATLAS submit, where the product promise is “Snapshot ready with PDF.”

## Intentional

- No production env/default changes. This only changes the fail-closed behavior
  when ATLAS submit succeeds but Snapshot fetch fails.
- No direct Resend/ATLAS/Blob calls in tests. The existing test imports the real
  route and mocks the external boundaries, matching the repo's real-adapter rule.
- The response does not expose upstream host, token, or low-level exception
  detail. It returns buyer-safe copy and logs the reason internally.

## Deferred

- ATLAS #1921 PR 4 still owns the deployed live proof that a real opted-in buyer
  receives the Snapshot email with its PDF attachment.
- Paid report PDF missing-attachment proof remains the next ATLAS-side/paid
  delivery guard.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-partner-access` — 12 passed.
- `bash scripts/pre_push_audit.sh` — passed.
- `bash scripts/local_pr_review.sh` — passed, including real-adapter audit,
  dead-code baseline, Snapshot landing smoke, ESLint, Next build, and
  `git diff --check`.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Snapshot-Required-Email-Attachment.md` | ~83 |
| `web/src/app/api/gap-report-intake/record/route.ts` | ~97 / -4 |
| `web/src/lib/deflection-partner-access.test.ts` | ~98 / -13 |
| Total | ~295 |
