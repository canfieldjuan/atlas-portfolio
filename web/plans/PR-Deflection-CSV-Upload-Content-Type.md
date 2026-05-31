# Plan: Deflection CSV upload content type

## Why this slice exists

The live support-ticket deflection intake can validate the form, request a
scoped Vercel Blob client token, and then fail at the browser-to-Blob `PUT`
with a CORS-hidden `400 Bad Request`. The upload token is intentionally
restricted to CSV content types, but the client upload call does not currently
send a `contentType` option, so the Blob request can arrive without the
`x-content-type` header that the token constraint needs.

## Scope (this PR)

Slice phase: Production hardening
Ownership lane: `atlas-portfolio` deflection CSV intake

1. Normalize accepted `.csv` browser uploads to an allow-listed Blob content
   type before calling `@vercel/blob/client.upload`.
2. Keep the existing private Blob access, path prefix, metadata, and size gates
   unchanged.
3. Extend the existing CSV privacy contract test so this direct-upload contract
   cannot silently regress.

### Files touched

- `web/plans/PR-Deflection-CSV-Upload-Content-Type.md` — plan for this live
  upload fix.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — send an allowed
  CSV `contentType` with the private client upload.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` — assert the client
  upload includes the Blob content-type option.

## Mechanism

The client form already rejects non-`.csv` filenames and the token route already
authorizes only `text/csv`, `application/csv`, and `application/vnd.ms-excel`.
This slice adds the same allow-list to the browser upload path. If the browser
provides one of those MIME types, the upload forwards it. If the browser leaves
`File.type` blank or supplies a generic type for a validated `.csv` file, the
upload falls back to `text/csv`, which is already accepted by the token route.

## Intentional

- This does not loosen the server token route. The server still mints tokens
  only for the `gap-report-csvs/` prefix, the existing size cap, and the existing
  CSV content-type allow-list.
- This does not proxy the CSV through a Next route. The direct browser-to-Blob
  path is still required for large support-ticket exports.
- This does not change Blob store selection or Vercel environment variables.
  The observed failure occurs after token minting, at the constrained Blob PUT.

## Deferred

- No retry/backoff UI polish is included. The immediate live blocker is the Blob
  request contract, not the form presentation.
- No app-level rate limiter is added; the existing WAF-backed hardening entry is
  already resolved outside the app code.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-csv-privacy` — passed.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed.
- `bash scripts/local_pr_review.sh --allow-dirty` — passed. (`--allow-dirty`
  was needed because this checkout has unrelated untracked local config files.)

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~65 |
| Intake upload content type | ~5 |
| Contract test assertion | ~3 |
| **Total** | ~73 |
