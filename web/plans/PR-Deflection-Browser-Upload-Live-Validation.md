# Plan: Deflection browser upload live validation

## Why this slice exists

The original intake failure happened in the browser: the direct Vercel Blob PUT
hit a CORS/client-upload failure and the page appeared to do nothing. The Node
browser-upload smoke now covers the route contract, but the final go-live check
still needs a real browser run because browser file inputs, CORS, Blob token
minting, and redirect behavior can fail outside Node.

This slice records the live browser validation procedure and the result from the
fresh production run so future sessions can reproduce the check without
rediscovering the agent-browser details.

## Scope (this PR)

Slice phase: Functional validation

1. Add a browser-upload live validation runbook for the production intake form.
2. Document the exact agent-browser command sequence, including the file upload
   and native `form.requestSubmit()` fallback used when automation click events
   do not fire the React submit path.
3. Record the expected network, redirect, marker, and console/error checks.
4. Capture the latest successful production validation evidence without storing
   secrets or customer data.

### Files touched

- `web/plans/PR-Deflection-Browser-Upload-Live-Validation.md` - this plan doc.
- `web/docs/landing-page-framework/deflection-browser-upload-live-validation.md` -
  operator runbook.

## Mechanism

The runbook is intentionally operational rather than a new dependency. It uses
the existing `agent-browser` CLI:

```bash
agent-browser --args "--no-sandbox" open https://juancanfield.com/systems/support-ticket-deflection/intake
agent-browser fill ...
agent-browser upload ...
agent-browser eval 'document.querySelector("form").requestSubmit()'
```

The pass condition is the same customer-facing path:

```text
browser form -> /api/gap-report-intake/upload 200
             -> /api/gap-report-intake/record 200
             -> /systems/support-ticket-deflection/results/<request_id>
             -> locked snapshot markers render
```

## Intentional

- This does not add Playwright or another browser-test dependency. The repo has
  no established E2E harness, and the immediate need is an operator go-live
  procedure for a mutation-heavy production smoke.
- The runbook uses synthetic CSV fixture data and does not include secrets.
- The `requestSubmit()` fallback is documented as an automation workaround, not
  a product workaround. Manual browser clicks remain the customer path.

## Deferred

- A committed E2E harness remains deferred until the repo adopts a browser-test
  framework. The current smoke suite plus this runbook cover the launch-critical
  browser upload path without adding dependency and CI weight.

Parked hardening: none.

## Verification

- Production browser validation with `agent-browser` - passed; `/upload` and
  `/record` returned 200, redirect landed on
  `content-ops-42af1d7eb1e14897bfb7f543c66464c5`, locked snapshot markers
  rendered, and browser console/page errors were empty.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~85 |
| Runbook | ~110 |
| **Total** | ~195 |
