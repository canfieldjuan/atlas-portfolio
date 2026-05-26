# Plan: Direct-to-blob CSV upload for the deflection intake

The intake POSTs the CSV through the serverless function, capped at 4 MB by
Vercel's ~4.5 MB body limit. The offer now asks for **3–6 months** of tickets,
whose larger exports exceed that. Switch the upload to **direct-to-blob**
(browser → Vercel Blob), so the function never carries the file and large
exports upload natively.

## Why this slice exists

- `gap-report-intake/route.ts` caps CSV at 4 MB; 3–6-month exports (esp. 6-month
  / higher-volume) exceed it and fall to an "email us" fallback — friction on a
  free-snapshot lead form. Direct-to-blob (`@vercel/blob/client`) uploads the
  file straight to Blob (up to 5 TB), removing the body-limit ceiling.

## Scope (this PR)

Slice phase: Functional validation

1. **Token route** `/api/gap-report-intake/upload` (new): `handleUpload` —
   `onBeforeGenerateToken` parses + **validates the metadata** (`clientPayload`)
   before minting a token, caps the payload length, requires the
   `gap-report-csvs/` pathname prefix, and sets `allowedContentTypes` (the 3 CSV
   types) + `maximumSizeInBytes` (**50 MB**) + `addRandomSuffix` +
   `tokenPayload` (the validated metadata). Throws on invalid → 400.
2. **Record route** `/api/gap-report-intake/record` (new): POST
   `{ ...metadata, blobUrl }`; re-validate metadata, confirm the blob is **ours**
   via `head(blobUrl)` (scoped to our store; throws if not), then
   `recordGapReportSubmission`. Returns `{ ok, requestId, status, warnings }`.
3. **Client** (`SupportTicketCsvIntakePage`): `upload()` the file straight to
   Blob (`handleUploadUrl` = the token route, `clientPayload` = metadata), then
   POST `{ metadata, blobUrl }` to the record route. Bump the client size hint to
   50 MB; surface upload errors (size/network).
4. **Shared validator** (`lib/gap-report-intake.ts`): `parseGapReportMetadata`
   (+ `EMAIL_RE`, `GapReportMetadata`) used by both new routes — one source of
   truth, no drift.
5. **Old route message fix** (`gap-report-intake/route.ts`): drop "reduce the
   date range" from the 413 (it contradicts the 3–6-month ask). The old POST
   route is **kept as a one-cycle fallback**; a follow-up removes it once the new
   flow is verified on a deploy.
6. **HARDENING.md**: entry — the open `/upload` + `/record` endpoints have no
   rate limit (acceptable at this stage; revisit).

### Files touched

- `web/plans/PR-Intake-Direct-Blob.md` — this plan doc (new)
- `web/src/lib/gap-report-intake.ts` — shared `parseGapReportMetadata` validator
- `web/src/app/api/gap-report-intake/upload/route.ts` — token route (new)
- `web/src/app/api/gap-report-intake/record/route.ts` — record route (new)
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — client upload flow
- `web/src/app/api/gap-report-intake/route.ts` — 413 message fix (fallback kept)
- `HARDENING.md` — rate-limit entry for the new endpoints

## Mechanism

- `upload(pathname, file, { access:'public', handleUploadUrl, clientPayload })`
  hits the token route only for a short-lived token, then streams the file
  browser→Blob. The function bytes are just the token request — no 4.5 MB cap.
- **Recording uses client→`/record`, not `onUploadCompleted`** — the latter
  can't fire on localhost and leaves the buyer unsure recording happened. The
  client knows the upload succeeded, POSTs `{metadata, blobUrl}`, and `/record`
  re-validates: metadata via the shared validator + `head(blobUrl)` proves the
  blob is in our store (the token scopes `head` to our store), so a forged
  foreign URL fails. `recordGapReportSubmission` is unchanged.

## Intentional

- **client→/record over onUploadCompleted** — chosen for local testability + no
  silent-failure UX; the forge-a-different-URL threat is low-value on a free,
  anonymous lead form and `head()` bounds it to our store.
- **50 MB cap** — an honest bound (not 5 TB); covers realistic 3–6-month exports
  while limiting abuse on an open endpoint.
- **Old route kept this cycle** — fallback in case the new flow has a
  preview-only issue; removed in a follow-up once verified (don't delete here).

## Deferred

- **Remove the old `/api/gap-report-intake` POST** once the new flow is verified
  on a deploy (follow-up PR).
- **Rate-limiting** the open `/upload` + `/record` endpoints (HARDENING entry).
- Acq-pack message templates "90 days"; hero "self-serve" vs "self-service".

Parked hardening: `HARDENING.md` — "Deflection intake upload/record endpoints
are unauthenticated and unthrottled".

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 7 == 7 + diff-size).
- `npm run lint` / `tsc --noEmit` clean; **`npm run build` succeeds** and emits
  the two new API routes.
- **Verification gap (stated up front, operator-acknowledged):** the live
  upload→record round-trip needs `BLOB_READ_WRITE_TOKEN` + a browser, so it is
  **not exercised locally** — it's verified on the Vercel preview/prod deploy
  (prod already has the Blob token; previews need it). The PR ships
  tsc/lint/build-green with behavior verified post-deploy.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `upload/route.ts` (new) | ~55 |
| `record/route.ts` (new) | ~55 |
| `SupportTicketCsvIntakePage.tsx` (upload flow) | ~45 |
| `gap-report-intake.ts` (validator) | ~35 |
| `route.ts` (message fix) | ~3 |
| `HARDENING.md` (entry) | ~6 |
| this plan doc | ~115 |
| **Total** | ~314 |

Under the 400-LOC soft cap.
