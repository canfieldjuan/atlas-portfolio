# Plan: Deflection email results link

## Why this slice exists

PR-Deflection-Intake-Atlas-Submit gave the customer an on-page results link when
ATLAS returns a real deflection `request_id`, but it intentionally left the email
handoff untouched. If the customer closes the tab, misses the success state, or
an operator checks the admin notification first, the generated snapshot link is
not present in the email record even though the report id exists.

## Scope (this PR)

Slice phase: Product polish

1. Submit deflection CSVs to ATLAS before sending/persisting the intake record,
   so a real `reportRequestId` can travel with the notification and confirmation.
2. Add optional `reportRequestId` support to the intake record copy, including
   the public results URL only when ATLAS actually returns a bounded id.
3. Add focused email-copy coverage that mocks the Resend transport and proves
   both the report-link and no-link fallback paths.

### Files touched

- `web/plans/PR-Deflection-Email-Results-Link.md` - this plan doc.
- `web/src/app/api/gap-report-intake/record/route.ts` - submit before record
  email/persist so the report id can be included.
- `web/src/lib/gap-report-intake.ts` - optional report id field and email copy.
- `web/scripts/test-deflection-email-results-link.mjs` - focused email-copy
  transport test.
- `web/package.json` - npm script for the focused test.
- `.github/workflows/pre_push_audit.yml` - CI enrollment for the focused test.

## Mechanism

The record route keeps the existing Blob ownership check. For support-ticket
deflection submissions only, it calls `submitDeflectionReportCsv(...)` before
`recordGapReportSubmission(...)`. A successful ATLAS submit sets
`reportRequestId`; a failed submit preserves the current fallback behavior by
recording the lead and adding the existing warning.

`recordGapReportSubmission(...)` accepts the optional id as part of the record.
The notification and customer confirmation text render
`/systems/support-ticket-deflection/results/{reportRequestId}` only when the id is
present. No synthetic URL is produced on submit failure.

The focused test compiles the TypeScript intake module with a stubbed database
writer, mocks the real `fetch` transport boundary used by Resend, and asserts the
two sent email bodies for with-link and without-link submissions.

## Intentional

- The email still uses plain text only. That matches the existing intake email
  contract and keeps the slice narrow.
- The route does not move or expose private Blob URLs. Only the ATLAS report id
  and public portfolio results path are included.
- This does not make the report paid or trusted. The results page still fetches
  from ATLAS, and the paid artifact still unlocks only after the Stripe webhook.

## Deferred

- Automatic browser redirect after upload remains deferred because #168 is
  touching the intake page copy and this slice avoids that overlap.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-email-results-link` - passed.
- `npm --prefix web run test:deflection-intake-atlas-submit` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| Record route ordering | ~25 |
| Intake email copy | ~35 |
| Focused test + package/CI enrollment | ~125 |
| **Total** | ~260 |
