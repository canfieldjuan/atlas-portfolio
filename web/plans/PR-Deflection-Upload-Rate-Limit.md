# Plan: Deflection upload rate limit

## Why this slice exists

#294 Finding 2 is the remaining portfolio launch blocker: the public
`/api/gap-report-intake/upload` route can mint Blob client-upload tokens without
an app-side throttle. That endpoint is the first paid-flow hop and the only one
that can lead directly to 50 MB private Blob writes.

## Scope (this PR)

Slice phase: Production hardening
Ownership lane: deflection/go-live

1. Add a strict per-IP throttle before `handleUpload(...)` runs.
2. Add a normalized-email throttle inside `onBeforeGenerateToken(...)` after
   metadata parsing and before the client upload token is minted.
3. Return `429` with `Retry-After` and generic copy for either exhausted bucket.
4. Keep existing metadata, path, content-type, size, private-store token, and
   `/record` behavior unchanged.

### Files touched

- `web/plans/PR-Deflection-Upload-Rate-Limit.md` - this plan doc.
- `web/src/app/api/gap-report-intake/upload/route.ts` - apply IP and email
  throttles before token minting.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` - compiled upload-route
  regression for IP and email buckets plus existing source contract assertions.

### Review Contract

Acceptance criteria:
- The 6th same-IP upload-token request within 60 seconds returns `429` before
  `handleUpload(...)` runs.
- The 6th same-email upload-token request within 60 seconds returns `429` from
  `onBeforeGenerateToken(...)` before a client token payload is returned.
- Both `429` responses include `Retry-After` and bounded client copy.
- Existing invalid metadata/path/content-type/size gates stay in place.
- No distributed/KV rate-limit implementation is introduced in this slice.

Affected surfaces:
- Direct-to-Blob CSV upload token route.
- Existing CSV privacy/source contract smoke.

Risk areas:
- Throwing from `onBeforeGenerateToken(...)` could accidentally collapse email
  throttles into a generic `400` if the custom error is not caught correctly.
- IP throttling before `handleUpload(...)` must not parse or store CSV contents.
- The in-memory limiter remains best-effort on Vercel serverless.

Triggered reviewer rules:
- R1 Requirements match; R2 Test evidence; R3 Security/privacy; R11 Scope
  control.

## Mechanism

The route consumes an IP bucket immediately after `request.json()` succeeds and
before `handleUpload(...)` is called:

```ts
consumeDeflectionRateLimit(request.headers, 'upload', UPLOAD_CLIENT_RATE_LIMIT)
```

The email bucket is consumed only after `parseGapReportMetadata(...)` succeeds
inside `onBeforeGenerateToken(...)`, then the existing token payload is returned.
The callback throws a custom `UploadRateLimitError`; the route catch maps that
specific error to `429` while preserving existing `400` behavior for validation
failures.

## Intentional

- This PR fixes #294 Finding 2 only. Finding 4 remains the distributed/KV-backed
  replacement for in-memory limits.
- The email limiter runs after metadata parsing because the route does not know
  the buyer email until Blob's token-generation callback receives
  `clientPayload`.
- The route still relies on Vercel Blob's existing content-type and size gates;
  this slice only prevents unbounded token minting.

## Deferred

- #294 Finding 4: distributed/KV-backed rate limiting.
- #294 Finding 9: generic client copy for the record route's outer catch block.
- #294 Finding 10: JSON-LD `</script>` escaping.
- #294 Finding 11: live hosted proof rerun.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-csv-privacy` - passed; compiled
  upload-route regression covers IP 429 before `handleUpload(...)` and email
  429 before token payload generation.
- `npm --prefix web run test:deflection-browser-upload-smoke` - passed.
- `npm --prefix web run test:deflection-rate-limit` - passed.
- `npm --prefix web run test:deflection-intake-atlas-submit` - passed.
- `npm --prefix web run check:dead-code` - passed; Knip baseline still matches
  16 known findings.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `git diff --check` - passed.
- `rg -n "Too many upload attempts|UploadRateLimitError|gap-report-upload-ip|gap-report-upload-email|consumeDeflectionRateLimit|consumeDeflectionIdentifierRateLimit|handleUpload" web/src/app/api/gap-report-intake/upload/route.ts web/scripts/test-deflection-csv-privacy-contract.mjs web/plans/PR-Deflection-Upload-Rate-Limit.md`
  - confirmed new upload-limit route hooks and regression coverage.
- `bash scripts/local_pr_review.sh` - passed; plan audits, drift check, Knip
  baseline, ESLint, Next build, and `git diff --check` passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +114 |
| Upload route throttles | +52 |
| CSV privacy compiled route tests | +119 |
| Total | ~285 changed |
