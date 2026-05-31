# Plan: Deflection private Blob token

## Why this slice exists

The browser CSV intake still stalls during the direct-to-Blob PUT even though
the deployed project has Blob tokens configured. Live reproduction against
`https://juancanfield.com` showed the upload token is minted, then the Blob API
rejects the private upload with:

`Cannot use private access on a public store. The store must be configured with private access.`

The current resolver prefers `ticke_deflection_blob_READ_WRITE_TOKEN`, which is
the public-only store from the earlier public-upload fix. Since the intake now
uses `access: 'private'`, the resolver must prefer the private-capable default
`BLOB_READ_WRITE_TOKEN` store. This is production hardening because it restores
the private PII upload contract already marked resolved in `HARDENING.md`.

The final diff is 412 LOC, just over the 400-LOC soft cap, because the review
fix has to keep legacy-store access for every URL-based Blob path in the same
slice: `/record` ownership checks, admin reads, ATLAS submit reads, tracked
cleanup deletes, orphan cleanup listing, and the regression fixture.

## Scope (this PR)

Slice phase: Production hardening

1. Change `gapReportBlobToken()` so private CSV Blob operations prefer
   `BLOB_READ_WRITE_TOKEN` before the legacy prefixed public-store token.
2. Add `gapReportBlobTokens()` so URL-based reads, ownership checks, and deletes
   can retry the legacy prefixed token for rows/blobs created before the switch.
3. Update `/record`, admin CSV reads, ATLAS submit reads, and cleanup to use the
   ordered token list for Blob URL operations.
4. Extend the existing CSV privacy contract test to lock the private-token
   precedence so this regression does not come back.

### Files touched

- `web/plans/PR-Deflection-Private-Blob-Token.md` - this plan doc.
- `web/src/lib/gap-report-intake.ts` - private Blob token resolver order.
- `web/src/app/api/gap-report-intake/record/route.ts` - ownership-check token fallback.
- `web/src/app/admin/intake/gap-report/[requestId]/csv/route.ts` - admin CSV read token fallback.
- `web/src/lib/atlas-deflection-client.ts` - ATLAS submit CSV read token fallback.
- `web/src/lib/gap-report-cleanup.ts` - tracked/orphaned Blob cleanup token fallback.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` - resolver precedence and cleanup fallback contract.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - ATLAS submit test stub for the plural token helper.

## Mechanism

`gapReportBlobToken()` remains the single-token source for new writes. Reordering
it to:

```ts
gapReportBlobTokens()[0]
```

makes new private CSV uploads target the private-capable store. The ordered
`gapReportBlobTokens()` helper returns the private token first and the prefixed
legacy token second. URL-based operations (`head`, `get`, `del`, `list`) iterate
that list so existing legacy-store rows can still be verified, read, and deleted
without making new uploads public.

## Intentional

- The client keeps `access: 'private'`; reverting to public upload would reopen
  the raw-CSV PII issue.
- The prefixed token stays as fallback rather than being removed because some
  preview or older environments may still only have that token, and existing
  legacy-store rows still need cleanup access.
- This slice does not add a browser automation smoke; the immediate production
  break is the wrong store token, and the live Blob capability probe already
  identified the failing edge.

## Deferred

- A full browser-upload smoke that runs the three-leg flow
  `/upload` -> Blob PUT -> `/record` remains the next validation slice after
  this fix is deployed.

Parked hardening: none.

## Verification

- `vercel env ls production | rg -n "BLOB|ticke_deflection"` - passed; confirmed
  both Blob tokens are configured in Production/Preview without printing secret
  values.
- Temporary production-env Blob capability probe - passed; private `put()` with
  `ticke_deflection_blob_READ_WRITE_TOKEN` fails as public-only, while private
  `put()` with `BLOB_READ_WRITE_TOKEN` succeeds.
- `npm --prefix web run test:deflection-csv-privacy` - passed after adding the
  cleanup fallback regression fixture.
- `npm --prefix web run test:deflection-intake-atlas-submit` - passed after
  adding the plural token helper to the test stub.
- `npm --prefix web run lint` - passed after the review fix.
- `npm --prefix web run build` - passed after the review fix.
- `rg -n -U "process\.env\.ticke_deflection_blob_READ_WRITE_TOKEN\?\.trim\(\) \|\|\n\s*process\.env\.BLOB_READ_WRITE_TOKEN\?\.trim\(\)" web/src web/scripts web/plans/PR-Deflection-Private-Blob-Token.md || true` - no stale old resolver order found.
- `bash scripts/local_pr_review.sh` - passed after the review fix.

## Estimated diff size

| Area | LOC |
|---|---:|
| Plan doc | ~98 |
| Token resolver/list helper | ~28 |
| URL operation fallback call sites | ~155 |
| CSV privacy fallback fixture | ~126 |
| ATLAS submit test stub | ~5 |
| Total | ~412 |
