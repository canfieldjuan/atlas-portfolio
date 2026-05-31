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

## Scope (this PR)

Slice phase: Production hardening

1. Change `gapReportBlobToken()` so private CSV Blob operations prefer
   `BLOB_READ_WRITE_TOKEN` before the legacy prefixed public-store token.
2. Extend the existing CSV privacy contract test to lock the private-token
   precedence so this regression does not come back.

### Files touched

- `web/plans/PR-Deflection-Private-Blob-Token.md` - this plan doc.
- `web/src/lib/gap-report-intake.ts` - private Blob token resolver order.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` - resolver precedence contract.

## Mechanism

`gapReportBlobToken()` is the single token source used by `/upload`, `/record`,
admin CSV reads, ATLAS submit Blob reads, and cleanup. Reordering it to:

```ts
process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
process.env.ticke_deflection_blob_READ_WRITE_TOKEN?.trim() ||
undefined
```

makes every private CSV operation target the private-capable store. The prefixed
token remains as a legacy fallback for environments that only have that store
configured.

## Intentional

- The client keeps `access: 'private'`; reverting to public upload would reopen
  the raw-CSV PII issue.
- The prefixed token stays as fallback rather than being removed because some
  preview or older environments may still only have that token.
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
- `npm --prefix web run test:deflection-csv-privacy` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `rg -n -U "process\.env\.ticke_deflection_blob_READ_WRITE_TOKEN\?\.trim\(\) \|\|\n\s*process\.env\.BLOB_READ_WRITE_TOKEN\?\.trim\(\)" web/src web/scripts web/plans/PR-Deflection-Private-Blob-Token.md || true` - no stale old resolver order found.
- Pending: `bash scripts/local_pr_review.sh`

## Estimated diff size

| Area | LOC |
|---|---:|
| Plan doc | ~87 |
| Token resolver order | ~10 |
| CSV privacy contract assertion | ~5 |
| Total | ~102 |
