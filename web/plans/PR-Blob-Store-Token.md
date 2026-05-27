# Plan: Target the public deflection Blob store explicitly (#88 deploy fix)

The #88 deploy verification found the intake's direct-to-blob upload broken in
prod: the project now has **two** Vercel Blob stores, the default
`BLOB_READ_WRITE_TOKEN` resolves to the old **private** store, and the client's
`upload({ access: 'public' })` fails with "Cannot use public access on a private
store." Operator added a public store but can't remove the old one. This points
the two intake routes at the public store's token explicitly.

## Why this slice exists

- Verified on `https://juancanfield.com` (2026-05-27): `/upload`'s `handleUpload`
  and `/record`'s `head()` both read the default `BLOB_READ_WRITE_TOKEN`, which is
  wired to the private store → every upload fails. The public store's token is the
  prefixed `ticke_deflection_blob_READ_WRITE_TOKEN` (set for Production), which our
  code never reads. Operator chose to fix in code rather than re-juggle the
  dashboard (the old store can't be deleted).

## Scope (this PR)

Slice phase: Bug fix (deploy config)

1. **`gap-report-intake.ts`** — add `gapReportBlobToken()`: returns
   `ticke_deflection_blob_READ_WRITE_TOKEN ?? BLOB_READ_WRITE_TOKEN ?? undefined`.
   One source of truth so the two routes can't drift (same rationale as the shared
   `parseGapReportMetadata`).
2. **`/upload/route.ts`** — pass `token: gapReportBlobToken()` to `handleUpload`,
   so the minted client token (and thus the upload) targets the public store.
3. **`/record/route.ts`** — pass `token: gapReportBlobToken()` to `head()`, so the
   ownership check runs against the store the CSV was uploaded to.

### Files touched

- `web/plans/PR-Blob-Store-Token.md` — this plan doc (new)
- `web/src/lib/gap-report-intake.ts` — `gapReportBlobToken()` helper
- `web/src/app/api/gap-report-intake/upload/route.ts` — pass token to `handleUpload`
- `web/src/app/api/gap-report-intake/record/route.ts` — pass token to `head()`

## Mechanism

- `handleUpload` and `head` both accept an explicit `token` (BlobCommandOptions);
  passing the public store's token overrides the default-env resolution. The
  client `upload()` is unchanged — it gets the minted client token from `/upload`,
  which now belongs to the public store, so `access: 'public'` succeeds.

## Intentional

- **Fallback to the default** (`?? BLOB_READ_WRITE_TOKEN`) so the code keeps
  working if the store setup is later consolidated to one default store.
- **Returns `undefined`, not `''`, when neither is set** — so the SDK surfaces its
  own "no token" error instead of us masking it with an empty string.
- **No client change** — the access mismatch is resolved entirely by which store's
  token mints the upload credential.

## Deferred

- Once verified green: the standing #88 follow-ups — remove the old
  `/api/gap-report-intake` POST fallback, and rate-limit `/upload` + `/record`
  (`HARDENING.md` DEFLECTION-INTAKE-RATELIMIT-1).
- Cleaning up the orphaned private Blob store (operator, when deletable).

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean; `npm run build` succeeds.
- `pre_push_audit` green (plan shape + files-touched 4 == 4 + diff-size).
- Post-merge (Production picks up the env var on deploy): re-run the marked
  end-to-end upload → expect a real blob + `/record` `ok`, and read `warnings[]`
  to confirm whether the Resend email + Postgres lead-capture are configured.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `gapReportBlobToken()` helper | ~14 |
| `/upload` import + token arg | ~4 |
| `/record` import + token arg | ~8 |
| this plan doc | ~70 |
| **Total** | ~96 |

Well under the 400-LOC soft cap.
