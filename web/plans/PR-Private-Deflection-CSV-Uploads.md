# Plan: Private deflection CSV uploads

## Why this slice exists

The deflection CSV intake currently uploads raw support-ticket exports to Vercel
Blob with `access: 'public'`. Those exports can contain names, emails, phone
numbers, and ticket text. The page copy no longer claims redaction, but the
storage path still exposes the raw file behind an unguessable public URL. The
parked `DEFLECTION-INTAKE-PII-1` hardening item needs to be promoted now because
it is the remaining real privacy risk in the intake flow.

## Scope (this PR)

Slice phase: Production hardening

1. Change the browser-to-Blob CSV upload to create a private blob instead of a
   public blob.
2. Keep the existing `/upload` token validation and `/record` ownership check,
   but update comments and verification around the private storage contract.
3. Stop treating the stored blob URL as a public email download link.
4. Add an authenticated admin CSV download route that streams the private blob
   with the server-side Blob token.
5. Show recent deflection CSV submissions on the existing private admin intake
   page with a download link for each persisted submission.
6. Mark the promoted `DEFLECTION-INTAKE-PII-1` hardening item resolved.

### Files touched

- `HARDENING.md` — mark the promoted PII hardening item resolved.
- `web/plans/PR-Private-Deflection-CSV-Uploads.md` — plan for this slice.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — switch client upload access to private.
- `web/src/app/api/gap-report-intake/upload/route.ts` — update upload-route comments to the private storage contract.
- `web/src/app/api/gap-report-intake/record/route.ts` — update record-route comments for private blob ownership checks.
- `web/src/app/admin/intake/gap-report/[requestId]/csv/route.ts` — authenticated private CSV download route.
- `web/src/app/admin/intake/page.tsx` — render recent deflection CSV submissions in the private admin queue.
- `web/src/lib/gap-report-intake.ts` — update Blob token comments and notification email wording.
- `web/src/lib/gap-report-intake-database.ts` — add request-id lookup for admin download.
- `web/src/lib/gap-report-cleanup.ts` — update cleanup comments for private Blob storage.

## Mechanism

`SupportTicketCsvIntakePage` continues using `@vercel/blob/client` so the browser
can upload 3-6 month CSV exports without hitting serverless body limits, but the
upload option changes from `access: 'public'` to `access: 'private'`. The
existing `/api/gap-report-intake/upload` route still mints a scoped upload token
only after validating metadata, content type, size, and pathname prefix. The
existing `/record` route still re-validates metadata and calls `head()` with the
server-side Blob token to prove the reported blob belongs to our store before
persisting it.

Because private Blob URLs are not useful as public download links, notification
email text stops saying `Download:` and instead records the private blob
reference plus a note to use the admin queue. The new
`/admin/intake/gap-report/[requestId]/csv` route validates the existing
`ADMIN_INTAKE_COOKIE`, looks up the persisted submission by request id, fetches
the private blob with `get(..., { access: 'private', token: gapReportBlobToken(),
useCache: false })`, and streams it back as a CSV attachment. The admin intake
page adds a second read-only section for recent deflection CSV submissions and
links each row to that authenticated download route.

## Intentional

- This does not add client-side PII redaction. The narrow fix is storage access:
  raw CSVs should not be public while the customer and operator still control
  what is uploaded.
- This keeps the direct browser upload architecture. Routing the CSV through a
  Next route would reintroduce serverless body-size limits for the same
  3-6-month exports this flow was built to accept.
- The admin download depends on database persistence. If persistence is not
  configured, the upload can still be recorded by notification email as before,
  but there is no request-id lookup route for a private blob. That is acceptable
  because production already needs the database for the 30-day retention job.
- The existing Blob token helper name stays `gapReportBlobToken()` to avoid a
  broad rename; its comment is updated so it no longer describes a public-only
  store.

## Deferred

- Client-side or server-side PII redaction before storage remains out of scope.
  Private storage closes the public exposure; redaction can be a later defense in
  depth slice if the offer needs a stronger privacy promise.
- Expiring/signed one-time admin download links are not added. The route is
  gated by the existing admin intake cookie and streams server-side.
- The separate parked `DEFLECTION-BADGE-1` demo badge polish item is unrelated to
  intake security and remains parked.

Parked hardening: DEFLECTION-INTAKE-PII-1 — resolved by this slice.

## Verification

- `rg -n "access: 'public'|access: \"public\"" web/src || true` — no active
  source matches remain.
- `rg -n "Private blob reference|Download: \\$\\{record\\.csvBlobUrl\\}|access: 'private'|get\\(submission\\.csvBlobUrl|gap-report/\\[requestId\\]/csv|public deflection Blob store|public-store" web/src HARDENING.md web/plans/PR-Private-Deflection-CSV-Uploads.md`
  — confirmed the private upload, private admin download route, and notification
  wording are present; the stale public-store phrases are absent from active
  source.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed; route table includes
  `ƒ /admin/intake/gap-report/[requestId]/csv`.
- Browser check at `http://127.0.0.1:3003/admin/intake` — unauthenticated login
  state renders, body has content, and no framework error overlay is present.
- Browser check at
  `http://127.0.0.1:3003/systems/support-ticket-deflection/intake` — upload form
  renders, body has content, and no framework error overlay is present.
- `curl -i http://127.0.0.1:3003/admin/intake/gap-report/00000000-0000-4000-8000-000000000000/csv`
  — returned `HTTP/1.1 401 Unauthorized` without an admin cookie.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~121 |
| Intake upload/comment updates | ~20 |
| Notification wording | ~8 |
| Database lookup helper | ~57 |
| Admin page deflection section | ~129 |
| Admin private CSV route | ~62 |
| Hardening update | ~8 |
| Total | ~398 |
