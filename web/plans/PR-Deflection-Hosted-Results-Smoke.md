# Plan: Deflection hosted results smoke

## Why this slice exists

PR-Deflection-Live-Submit-Smoke proves the deployed ATLAS submit leg can create a
report id, hydrate the free snapshot, and keep the paid artifact locked. It does
not prove the deployed portfolio results route can render that live request id.
The go-live check needs that second leg too: hosted portfolio page `200`, free
snapshot visible, and unlock CTA present.

## Scope (this PR)

Slice phase: Functional validation

1. Add a no-secret hosted results smoke script that accepts a `request_id`, fetches
   the deployed portfolio results URL, and verifies snapshot/checkout markers.
2. Add focused transport-mocked tests for success, non-200, missing snapshot, and
   missing unlock CTA failure branches.
3. Enroll the smoke test in pre-push CI.

### Files touched

- `web/plans/PR-Deflection-Hosted-Results-Smoke.md` - this plan doc.
- `web/scripts/smoke-deflection-hosted-results.mjs` - hosted results smoke.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - focused checker tests.
- `web/package.json` - npm scripts for the smoke and its test.
- `.github/workflows/pre_push_audit.yml` - CI enrollment for the focused test.

## Mechanism

The command takes the ATLAS `request_id` produced by the live submit smoke:

```bash
npm --prefix web run smoke:deflection-hosted-results -- \
  --request-id content-ops-... \
  --base-url https://juancanfield.com
```

It validates the bounded request id, fetches
`{baseUrl}/systems/support-ticket-deflection/results/{request_id}`, requires HTTP
`200`, rejects common framework error markers, and requires the HTML to contain
the free snapshot badge and the "Unlock your full Backlog Report" CTA. The smoke
prints the URL and supports `--json` / `--output <path>`.

## Intentional

- No ATLAS or Stripe credentials are needed. This only validates the public
  hosted portfolio route after a live request id exists.
- The smoke uses durable route markers already rendered by the results page
  instead of brittle full-copy matching.
- This does not prove paid artifact rendering. It validates the free snapshot and
  locked checkout CTA state only.

## Deferred

- Paid artifact `200` render validation remains a separate Stripe/webhook smoke
  after a test-mode payment.
- Browser upload validation remains manual/live-preview work because it depends
  on Vercel Blob client-token minting and the deployed intake form.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-hosted-results-smoke` - passed.
- `npm --prefix web run smoke:deflection-hosted-results -- --request-id content-ops-b98ea1f8792f48399f0bbaed228f0f4d --json --output /tmp/deflection-hosted-results-smoke.json` - passed against `https://juancanfield.com`.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| Smoke script | ~150 |
| Focused tests | ~120 |
| Package/CI enrollment | ~4 |
| **Total** | ~349 |
