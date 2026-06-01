# Plan: Deflection public reachability smoke

## Why this slice exists

The live checkout and paid-unlock smokes prove the downstream report path, but
the customer entry point still lacks a hosted smoke. A production customer must
be able to reach the public Support Ticket Deflection page, click through to CSV
intake, and see the upload form before the existing upload and checkout smokes
matter.

## Scope (this PR)

Ownership lane: content-ops/faq-deflection
Slice phase: Functional validation

1. Add a hosted smoke for the public landing and CSV intake pages.
2. Fail closed on a missing intake href or missing render markers.
3. Add focused tests for the validation branches.
4. Enroll the synthetic smoke tests in the pre-push audit workflow.

### Files touched

- `web/plans/PR-Deflection-Public-Reachability-Smoke.md` - this plan doc.
- `web/scripts/smoke-deflection-public-reachability.mjs` - public path smoke.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - tests.
- `web/package.json` - npm smoke and test scripts.
- `.github/workflows/pre_push_audit.yml` - CI enrollment for the synthetic test.

## Mechanism

The smoke fetches two hosted pages without submitting data:

```bash
npm --prefix web run smoke:deflection-public-reachability -- --base-url https://juancanfield.com --json
```

It checks `/systems/support-ticket-deflection` for stable offer copy plus the
intake href, then checks intake for upload-form markers. It performs public GET
requests only.

## Intentional

- This is a reachability smoke, not a browser interaction test.
- The smoke checks stable text and href markers so it can run in production.
- This does not submit a CSV. Browser upload remains covered by the existing
  protected-preview browser-upload smoke.

## Deferred

- Full browser click-through remains in the browser-upload validation lane.
- Real live charge automation remains out of scope.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-public-reachability-smoke` - passed.
- `npm --prefix web run smoke:deflection-public-reachability -- --base-url https://juancanfield.com --json --output /tmp/deflection-public-reachability.json` - passed; confirmed the hosted landing page links to intake and the hosted intake page renders the upload form markers.
- `npm --prefix web run lint` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Total | ~398 |
