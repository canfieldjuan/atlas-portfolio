# Plan: Deflection browser upload smoke

## Why this slice exists

The hosted submit/results/Checkout smokes cover ATLAS submit, hosted result
rendering, and paid-entry creation, but they did not exercise the browser CSV
upload path. The live failure on the intake form happened specifically in that
path:

`/api/gap-report-intake/upload` -> direct Vercel Blob PUT -> `/api/gap-report-intake/record`

PR-Deflection-Private-Blob-Token fixed the private Blob token preference. This
slice adds the missing smoke so the direct browser-upload leg can be validated
repeatably after deploy.

## Scope (this PR)

Slice phase: Functional validation

1. Add a no-secret hosted browser-upload smoke script that reads a local CSV,
   calls the deployed upload-token route through `@vercel/blob/client.upload`,
   then posts the returned Blob URL to the deployed `/record` route.
2. Validate the returned `reportRequestId` and produce the hosted results URL
   the intake page would redirect to.
3. Add focused mocked tests for success and failure branches.
4. Enroll the mocked test in package scripts and pre-push audit CI.

### Files touched

- `web/plans/PR-Deflection-Browser-Upload-Smoke.md` - this plan doc.
- `web/scripts/smoke-deflection-browser-upload.mjs` - hosted browser-upload smoke.
- `web/scripts/test-deflection-browser-upload-smoke.mjs` - mocked smoke tests.
- `web/package.json` - smoke/test scripts.
- `.github/workflows/pre_push_audit.yml` - CI enrollment for the mocked test.

## Mechanism

The smoke mirrors `SupportTicketCsvIntakePage` outside a browser:

```js
const blob = await upload(pathname, fileBlob, {
  access: 'private',
  contentType: 'text/csv',
  handleUploadUrl: `${baseUrl}/api/gap-report-intake/upload`,
  clientPayload: JSON.stringify(metadata),
});
await fetch(`${baseUrl}/api/gap-report-intake/record`, {
  method: 'POST',
  body: JSON.stringify({ ...metadata, blobUrl: blob.url }),
});
```

The deployed portfolio route owns Blob, ATLAS, database, and email credentials.
The local smoke only supplies a CSV and public lead metadata.

## Intentional

- The live smoke mutates production-like state: it can upload a CSV, record an
  intake submission, and trigger the deployed ATLAS submit/email path. It is a
  manual smoke script, not a CI step.
- The CI-enrolled test is mocked and no-secret; it verifies the route contract
  and failure envelopes without touching Vercel Blob or ATLAS.
- The smoke validates `reportRequestId` rather than fetching the hosted results
  page; that render path is already covered by the hosted-results smoke.
- A bare `--base-url` fails instead of falling back to production because this
  smoke can create deployed intake side effects.

## Deferred

- Re-running the live smoke after the WAF window clears remains an
  operator-triggered validation step with the real CSV fixture. The first live
  attempt during this slice hit the existing `/api/gap-report-intake/` WAF
  rate-limit rule after repeated probes.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-browser-upload-smoke` - passed after
  adding the bare `--base-url` regression case.
- `npm --prefix web run smoke:deflection-browser-upload -- --csv /home/juan-canfield/Desktop/deflection-test-upload.csv --company "Effingham Office Maids" --email ops@example.com --platform helpscout --json --output /tmp/deflection-browser-upload-smoke.json` - attempted against `https://juancanfield.com`; the smoke reached the upload-token leg but failed with `Vercel Blob: Failed to retrieve the client token`. A direct safe probe to `/api/gap-report-intake/upload` then returned HTTP 429 from the existing Vercel WAF rate-limit rule after repeated attempts.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC |
|---|---:|
| Plan doc | ~105 |
| Smoke script | ~326 |
| Mocked test | ~269 |
| Package/workflow enrollment | ~6 |
| Total | ~706 |

This is over the 400-LOC soft cap because the smoke needs CLI validation,
structured failure envelopes, and mocked branch coverage in the same slice that
adds the live command.
