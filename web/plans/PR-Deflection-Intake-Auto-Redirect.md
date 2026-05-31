# Plan: Deflection intake auto-redirect

## Why this slice exists

The live deflection upload path now fixes the Blob content type, submits the CSV
to ATLAS, shows a results link, and includes that link in emails. The browser
still lands on a success card and asks the customer to click the link manually.
For the go-live flow, a successful ATLAS submit should take the customer straight
to the free snapshot results page.

## Scope (this PR)

Slice phase: Product polish

1. After `/api/gap-report-intake/record` returns a real `reportRequestId`, build
   the existing support-ticket deflection results URL and navigate there.
2. Preserve the current success card fallback when ATLAS submit is unavailable
   or the response does not include a report id.
3. Extend the existing deflection intake submit contract test so this behavior is
   locked alongside the submit-link contract.

### Files touched

- `web/plans/PR-Deflection-Intake-Auto-Redirect.md` - this plan doc.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` - redirect after a
  successful ATLAS submit.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - focused contract
  assertions for redirect and fallback behavior.

## Mechanism

The page already computes the canonical results path from `reportRequestId` in
the success state. This slice moves that path construction into a small helper
used by both the redirect path and the fallback success card.

On a successful `/record` response:

```ts
const resultsHref = deflectionResultsHref(payload.reportRequestId);
if (resultsHref) {
  trackFaqReportCsvSubmitted(...);
  window.location.assign(resultsHref);
  return;
}
```

If no valid id is present, the current `setSubmission({ phase: 'success', ... })`
path remains unchanged, including warnings and the 24-hour manual fallback.

## Intentional

- The redirect only happens after the server returns a real `reportRequestId`.
  No client-generated or fallback URL is invented.
- `window.location.assign(...)` is used instead of Next router state so the
  dynamic server results route fetches the latest snapshot from ATLAS.
- The success card remains as a fallback and still renders the link if navigation
  is not taken for any reason.

## Deferred

- #168 owns the broad deflection copy sweep. This slice does not change intake
  page copy outside the redirect behavior.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-intake-atlas-submit` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~70 |
| Intake redirect helper + branch | ~25 |
| Focused test assertions | ~10 |
| **Total** | ~105 |
