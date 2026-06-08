# Plan: Deflection Blob write token cutover

## Why this slice exists

Issue #198 tracks legacy-path cleanup with a verify-before-delete gate. The
legacy Blob token fallback is now safe to remove from new CSV writes because
`vercel env ls` confirms `BLOB_READ_WRITE_TOKEN` is configured for Production,
Preview, and Development. Leaving `gapReportBlobToken()` backed by the ordered
read-token list means a missing private token could still fall through to the
legacy public-store token on the browser upload path, which is the wrong
fail-closed behavior for private CSV intake.

This slice does not remove the legacy token from URL-based reads and deletes.
Older CSV rows may still live in the legacy store during the 30-day retention
window, so admin download, ATLAS submit, ownership checks, and cleanup still
need the explicit ordered token list until those historical blobs age out.

## Scope (this PR)

Slice phase: Production hardening

1. Cut `gapReportBlobToken()` over to `BLOB_READ_WRITE_TOKEN` only, so new
   private CSV uploads fail closed when the private-capable token is absent.
2. Keep `gapReportBlobTokens()` as the historical read/delete token list for
   legacy CSV blobs created before the private-store switch.
3. Extend the existing CSV privacy contract test so it distinguishes the
   write-token resolver from the legacy read/delete fallback list.

### Files touched

- `web/plans/PR-Deflection-Blob-Write-Token-Cutover.md` - this plan doc.
- `web/src/lib/gap-report-intake.ts` - new-write Blob token resolver.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` - source-level privacy contract assertion.

## Mechanism

`gapReportBlobToken()` remains the single-token helper used by
`/api/gap-report-intake/upload` when minting browser upload tokens. It now
returns:

```ts
cleanBlobToken(process.env.BLOB_READ_WRITE_TOKEN)
```

instead of the first entry from `gapReportBlobTokens()`. The ordered plural
helper keeps returning the private token plus the legacy prefixed token for
server-side URL operations that may need to read or delete older blobs.

## Intentional

- The legacy `ticke_deflection_blob_READ_WRITE_TOKEN` remains in
  `gapReportBlobTokens()` for read/delete cleanup only. Removing it from every
  Blob operation would risk stranding historical CSV rows before retention
  cleanup finishes.
- This slice does not touch Stripe fallback cleanup, calculator consolidation,
  or the ATLAS `portfolio-ui/` investigation from #198.
- No runtime Blob smoke is added here; the existing CSV privacy contract already
  covers the token-order invariant this slice changes.

## Deferred

- Remove the legacy prefixed Blob token from `gapReportBlobTokens()` after the
  oldest legacy-store CSV rows have aged past the 30-day retention window and
  cleanup/admin access no longer need to read that store.
- Legacy Stripe `sk_test_` fallback cleanup remains gated on Preview/test mode
  using an `rk_test_` restricted key.
- Calculator redundancy remains a product consolidation decision; #198 was
  updated on 2026-06-07 with verification that the current calculators are
  actively rendered.
- ATLAS `portfolio-ui/` remains hard-gated on investigation plus explicit
  operator sign-off.

Parked hardening: none.

## Verification

- `vercel env ls | rg -n "BLOB_READ_WRITE_TOKEN|ticke_deflection_blob_READ_WRITE_TOKEN"` -
  passed; `BLOB_READ_WRITE_TOKEN` is configured for Production, Preview, and
  Development, while the legacy prefixed token remains scoped to Production and
  Preview for historical Blob access. No secret values were printed.
- `npm --prefix web run test:deflection-csv-privacy` - passed; the contract now
  asserts `gapReportBlobToken()` uses only `BLOB_READ_WRITE_TOKEN` and that the
  plural URL fallback list still prefers the private token before the legacy
  prefixed token.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC |
|---|---:|
| Plan doc | ~96 |
| Token resolver comment/code | ~22 |
| CSV privacy contract assertion | ~26 |
| Total | ~144 |
