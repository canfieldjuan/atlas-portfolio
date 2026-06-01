# Plan: Deflection paid unlock protected preview

## Why this slice exists

The paid-unlock smoke can prove the public hosted path, but the actual go-live
validation had to run against a Vercel-protected preview. That exposed an
operator gap: normal `fetch` cannot read protected preview APIs/pages, while
`vercel curl` can. The same validation also needed a documented Stripe CLI
fixture fallback because browser automation can stall on Stripe-hosted Checkout.

This slice makes the already-existing paid-unlock smoke usable for protected
previews and records the no-secret fixture procedure so future sessions can
repeat the exact trust-boundary validation without rediscovering it.

## Scope (this PR)

Slice phase: Production hardening

1. Add an opt-in `vercel curl` transport to the existing paid-unlock smoke for
   protected preview deployments.
2. Keep the default smoke path unchanged for public production/staging URLs.
3. Add focused mocked coverage for the `vercel curl` transport, including POST
   body/header forwarding and non-2xx status capture.
4. Add a short runbook for the paid-unlock go-live validation path, including
   the Stripe CLI fixture fallback and required marker checks.

### Files touched

- `web/plans/PR-Deflection-Paid-Unlock-Protected-Preview.md` - this plan doc.
- `web/scripts/smoke-deflection-paid-unlock.mjs` - protected-preview transport.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` - focused transport tests.
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` -
  operator runbook.

## Mechanism

The normal smoke keeps using `globalThis.fetch`. When the operator passes
`--vercel-curl`, the CLI injects a fetch-compatible transport that shells out to:

```bash
vercel curl <path> --deployment <deployment-url> -- \
  --request <method> \
  --header "Content-Type: application/json" \
  --data '<body>' \
  --silent --show-error --write-out ...
```

The smoke still performs the same contract checks:

1. `GET /api/deflection-report-status?requestId=...`
2. `POST /api/deflection-checkout` if the report is locked
3. wait for `unlocked`
4. fetch the results page and require paid-report markers while rejecting the
   locked CTA marker

The runbook documents the test-mode Stripe CLI fixture leg outside the Node
smoke because it depends on an operator-held test key and a real ATLAS webhook
endpoint. The document names the metadata and amount contract without storing or
printing secrets.

## Intentional

- `--vercel-curl` is opt-in. Public URLs continue to use normal `fetch`, which
  keeps local mocked tests and production smoke behavior unchanged.
- The script does not automate Stripe secret use or write fixture JSON itself.
  The Stripe fixture remains an operator step with an environment-held test key.
- The runbook says to prefer a restricted key for production automation, while
  allowing the operator's existing test secret key for manual test-mode fixture
  validation.

## Deferred

- Fully automating the Stripe CLI fixture in the smoke is deferred. That would
  mix Vercel transport, Stripe secret handling, temporary fixture generation,
  and webhook polling in one command. This slice closes the repeatability gap
  without expanding the smoke's secret boundary.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-paid-unlock-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `npm --prefix web run smoke:deflection-paid-unlock -- --request-id content-ops-e13a12594e29439db454a203403a2523 --base-url https://atlas-portfolio-otxg2euyf-juan-canfields-projects.vercel.app --vercel-curl --json --output /tmp/deflection-paid-unlock-protected-preview-smoke.json` - passed against protected preview; initial status was `unlocked` and all paid markers were present.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~90 |
| Smoke transport | ~85 |
| Focused tests | ~75 |
| Runbook | ~85 |
| **Total** | ~335 |
