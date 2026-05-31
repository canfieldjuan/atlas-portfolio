# Plan: Deflection intake ATLAS submit

## Why this slice exists

The support-ticket deflection intake now uploads the CSV to a private Vercel Blob
and records the lead, but it still stops there. It does not submit the uploaded
CSV to ATLAS, so a successful upload cannot produce the `content-ops-*`
`request_id` that the existing results page, snapshot fetch, checkout CTA, and
paid artifact render all consume.

This slice is slightly over the 400 LOC soft cap because the smallest useful
vertical path needs all four pieces together: server-side Blob read, ATLAS
multipart submit, record-route response wiring, customer-visible results link,
and a focused transport-boundary test. Splitting before the UI link would leave
the upload still looking inert; splitting before the helper test would ship an
untested raw-CSV handoff.

## Scope (this PR)

Slice phase: Vertical slice
Ownership lane: `atlas-portfolio` deflection CSV intake

1. Add a server-only ATLAS submit helper that reads the private Blob server-side
   and posts the raw CSV bytes to ATLAS as multipart form data.
2. Call that helper from `/api/gap-report-intake/record` after Blob ownership is
   verified, returning the ATLAS report request id when submit succeeds.
3. Update the intake success state to show a results-page link when the report id
   exists, while keeping the existing manual 24-hour fallback when submit is not
   available.
4. Add focused contract coverage for the multipart submit request and the
   customer-facing success link.

### Files touched

- `web/plans/PR-Deflection-Intake-Atlas-Submit.md` — plan for this slice.
- `web/src/lib/atlas-deflection-client.ts` — ATLAS multipart submit helper.
- `web/src/app/api/gap-report-intake/record/route.ts` — wire private Blob upload
  records to ATLAS submit.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — render the
  results link when the submit returns an ATLAS report id.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` — focused helper and UI
  contract tests.
- `web/package.json` — npm script for the focused test.
- `.github/workflows/pre_push_audit.yml` — enroll the focused submit test in CI.

## Mechanism

The record route already validates metadata, checks the Blob URL namespace, and
uses `head()` with the private store token to prove the Blob belongs to this app.
This slice keeps those gates, then calls `submitDeflectionReportCsv(...)`.

The helper uses `get(..., { access: 'private', token: gapReportBlobToken(),
useCache: false })` to read the private CSV without exposing it through a public
proxy. It builds a `FormData` body with `csv_file`, `support_platform`,
`company_name`, and `contact_email`, maps local platform values to ATLAS's
accepted set (`helpscout -> help_scout`, `freshdesk -> other`), and posts to
`/api/v1/content-ops/deflection-reports/submit` with the existing
`ATLAS_API_BASE_URL` + `ATLAS_B2B_JWT` server-only credentials. A valid response
must include a bounded `request_id`; otherwise the submit is treated as failed.

The customer still gets a successful intake record if ATLAS submit is
misconfigured or temporarily unavailable, but the response carries a warning and
does not invent a results URL. Only a real ATLAS `request_id` produces a link to
`/systems/support-ticket-deflection/results/{request_id}`.

## Intentional

- This does not expose the private Blob through a public signed URL. The
  portfolio reads the Blob server-side and sends raw CSV bytes to ATLAS, matching
  the PII-safe handoff contract.
- This does not change the paid trust boundary. The results page and checkout
  flow still hydrate from ATLAS; Stripe webhook verification still owns unlock.
- This keeps the existing lead-record/email path as a fallback. A transient
  ATLAS submit failure should not discard the uploaded CSV or lead metadata.

## Deferred

- Automatic redirect after upload is deferred. The first vertical slice gives
  the customer an explicit results link once ATLAS returns a real report id.
- Customer confirmation email copy can include the results link in a follow-up;
  this slice keeps the email path untouched to avoid broadening the delivery
  contract.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-intake-atlas-submit` — passed.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~102 |
| ATLAS submit helper | ~100 |
| Record route wiring | ~24 |
| Intake success UI | ~55 |
| Focused test script + package script | ~205 |
| CI enrollment | ~3 |
| **Total** | ~489 |
