## Why this slice exists

PR-Deflection-Snapshot-Landing-Smoke added a fast mocked smoke for the short
Snapshot landing page, then explicitly deferred CI enrollment. The Snapshot page
has since become the primary offer surface for the Support Ticket Deflection
funnel, so the existing smoke should run with the rest of the deflection
pre-push audit tests.

This slice promotes that already-focused test into CI so future copy, routing,
or landing-page changes fail fast if the page stops rendering the free
Deflection Snapshot offer, the intake CTA, or the paid-report-first regression
guards.

## Scope (this PR)

Slice phase: Functional validation

1. Add `test:deflection-snapshot-landing-smoke` to the existing GitHub
   pre-push audit workflow.
2. Preserve the smoke implementation, package scripts, landing page component,
   route behavior, checkout, results page, and local review bundle.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Smoke-CI.md`
- `.github/workflows/pre_push_audit.yml`

## Mechanism

The workflow already installs `web` dependencies and runs the focused deflection
test scripts one by one. This slice adds a single step:

```yaml
- name: Deflection Snapshot landing smoke tests
  run: npm --prefix web run test:deflection-snapshot-landing-smoke
```

That script uses mocked fetch responses, so CI does not call production, ATLAS,
Stripe, Vercel Blob, or any private API. It only exercises the existing landing
smoke parser and its negative fixtures.

## Intentional

- `scripts/local_pr_review.sh` is not expanded here. In this repo it remains the
  mechanical local plan/lint/build/whitespace gate, while
  `.github/workflows/pre_push_audit.yml` owns the focused deflection test suite.
- No hosted scheduled monitor is added. This slice enrolls the mocked CI test
  only.

## Deferred

- A scheduled production monitor for
  `smoke:deflection-snapshot-landing -- --base-url https://juancanfield.com`
  remains a separate operations slice.
- Visual regression screenshots for the Snapshot landing route remain out of
  scope.
- The parked web dependency audit finding in `HARDENING.md` was considered but
  remains unrelated because this slice does not change dependencies.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed; printed
  `Deflection Snapshot landing smoke tests passed.`
- `bash scripts/pre_push_audit.sh origin/main` - passed; plan shape passed for
  this plan.
- `bash scripts/local_pr_review.sh` - initially failed in this fresh `/tmp`
  worktree because `web/node_modules` was missing (`eslint` and `next` not
  found).
- `npm --prefix web ci` - passed; added 378 packages, audited 379 packages, and
  reported the existing 3 dependency audit findings already parked in
  `HARDENING.md`.
- `bash scripts/local_pr_review.sh` - passed after dependency install; plan
  audits, drift advisory, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~82 |
| Workflow enrollment | ~3 |
| Total | ~85 |
