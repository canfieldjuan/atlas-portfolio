# Plan: Deflection live submit smoke

## Why this slice exists

The intake funnel now uploads CSVs, submits them to ATLAS, redirects to the
results page, and carries the results link in email. The remaining go-live need
is repeatable functional validation against the deployed ATLAS host with a real
CSV: submit should return a `request_id`, the free snapshot should hydrate, and
the paid artifact should remain locked until Stripe/webhook unlocks it.

This slice is over the 400 LOC soft cap because the checker must ship with
failure-branch tests. Splitting the script from its tests would leave a live
smoke that can silently regress, and shortening by dropping the CLI wrapper would
make the smoke less useful for the operator's live CSV checks.

## Scope (this PR)

Slice phase: Functional validation

1. Add a Node smoke script that reads local env, submits a CSV to deployed ATLAS,
   validates the returned request id, verifies snapshot `200`, and verifies
   artifact `403` locked.
2. Add focused transport-mocked tests for the smoke checker: happy path, missing
   env, malformed submit response, snapshot failure, and artifact-unlocked drift.
3. Enroll the smoke checker tests in the existing pre-push audit workflow.

### Files touched

- `web/plans/PR-Deflection-Live-Submit-Smoke.md` - this plan doc.
- `web/scripts/smoke-deflection-live-submit.mjs` - live ATLAS submit smoke.
- `web/scripts/test-deflection-live-submit-smoke.mjs` - focused checker tests.
- `web/package.json` - npm scripts for the smoke and its test.
- `.github/workflows/pre_push_audit.yml` - CI enrollment for the focused test.

## Mechanism

The smoke command is intentionally direct-to-ATLAS rather than browser-driven:

```bash
npm --prefix web run smoke:deflection-live-submit -- \
  --csv /path/to/export.csv \
  --company "Effingham Office Maids" \
  --email ops@example.com \
  --platform helpscout
```

It loads `.env.local` / `.env`, requires `ATLAS_API_BASE_URL` and
`ATLAS_B2B_JWT`, posts multipart form data to
`/api/v1/content-ops/deflection-reports/submit`, validates the bounded
`request_id`, then fetches:

- `/snapshot` and requires `200` plus a minimal renderable snapshot shape.
- `/artifact` and requires `403`, proving the free report is still paid-gated.

The script prints the results URL and exits non-zero on drift. `--json` and
`--output <path>` are supported for automation.

## Intentional

- The smoke does not use Stripe or mark reports paid. It validates the free
  submit/snapshot/locked-artifact path only.
- The JWT stays in env; errors include HTTP status and bounded context only, not
  token values or upstream response bodies.
- `freshdesk` maps to `other`, matching the production intake helper and ATLAS's
  accepted submit values.

## Deferred

- Browser upload and redirect validation remains manual/live-preview work because
  direct browser Blob upload depends on Vercel Blob client token minting and the
  deployed page. This smoke validates the deployed ATLAS leg that determines
  whether a report id can render.
- Paid artifact `200` render validation remains a separate Stripe/webhook smoke
  after a test-mode payment.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-live-submit-smoke` - passed.
- `npm --prefix web run test:deflection-intake-atlas-submit` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.
- Reviewer P2 follow-up: post-submit snapshot/artifact transport failures now
  return stage-specific results with `requestId`, `apiCalls: true`, and
  `mutations: true`; regression covered in
  `test:deflection-live-submit-smoke`.
- Reviewer P2 follow-up 2: submit transport failures now return structured
  `stage: "submit"` results with `apiCalls: true` / `mutations: true`, and
  snapshot `top_questions[]` elements are shape-validated before the smoke can
  pass; both branches are covered in `test:deflection-live-submit-smoke`.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~90 |
| Smoke script | ~332 |
| Focused tests | ~184 |
| Package/CI enrollment | ~4 |
| **Total** | ~610 |
