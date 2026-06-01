# Plan: Deflection browser upload result verify

## Why this slice exists

The production browser-upload smoke now passes: a real CSV upload creates an
ATLAS report id. The next manual step today is a separate hosted-results smoke
to prove the customer-facing redirect page renders the locked snapshot. That
extra command is easy to forget, and it is exactly the surface that made the
live upload feel like "nothing happened" when the browser flow previously
failed.

This slice closes that validation gap by letting the browser-upload smoke verify
the newly returned results page in the same run.

## Scope (this PR)

Slice phase: Functional validation

1. Add an opt-in `--verify-results` flag to the browser-upload smoke.
2. After `/record` returns a valid `reportRequestId`, fetch the hosted results
   page and require the existing locked snapshot markers.
3. Return a structured `stage: "results"` failure if the page fetch or marker
   check fails.
4. Add focused mocked tests for successful result verification and marker
   failure.

### Files touched

- `web/plans/PR-Deflection-Browser-Upload-Result-Verify.md` - this plan doc.
- `web/scripts/smoke-deflection-browser-upload.mjs` - optional results-page verification.
- `web/scripts/test-deflection-browser-upload-smoke.mjs` - focused result verification tests.

## Mechanism

The browser-upload smoke already runs:

```text
/api/gap-report-intake/upload -> Vercel Blob PUT -> /api/gap-report-intake/record
```

With `--verify-results`, the smoke then reuses
`runDeflectionHostedResultsSmoke()` against the returned `reportRequestId`.
That keeps the marker contract in one place:

- `YOUR DEFLECTION SNAPSHOT`
- `We found`
- `Unlock your full Backlog Report`

The flag is opt-in because the base upload smoke is already mutation-heavy and
some operator runs only need the returned id/artifact.

## Intentional

- This does not unlock the paid report, touch Stripe, or call ATLAS directly.
  The paid path stays covered by the paid-unlock smoke.
- Result verification is opt-in so existing smoke behavior and output remain
  stable unless the operator asks for the extra hosted-page check.
- The implementation reuses the hosted-results smoke instead of duplicating its
  marker list.

## Deferred

- Browser automation of the actual form interaction remains deferred. This smoke
  mirrors the client upload route contract from Node and now verifies the same
  redirect target the browser would load.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-browser-upload-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `npm --prefix web run smoke:deflection-browser-upload -- --csv /home/juan-canfield/Desktop/deflection-test-upload.csv --company "Effingham Office Maids" --email ops@example.com --platform helpscout --verify-results --json --output /tmp/deflection-browser-upload-result-verify.json` - passed against production; returned `reportRequestId` `content-ops-a3d17a11179b466d94cc207bd9e9375e` and verified locked results markers.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~85 |
| Smoke script | ~35 |
| Focused tests | ~65 |
| **Total** | ~185 |
