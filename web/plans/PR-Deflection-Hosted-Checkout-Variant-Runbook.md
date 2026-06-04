## Why this slice exists

PR-Deflection-Hosted-Checkout-Variant-Smoke added `--price-variant` to the
hosted Checkout smoke, but the go-live paid-unlock runbook still shows only the
default Checkout-start command. That leaves the standard/partner live proof as
tribal knowledge even though the tooling now supports it.

This slice documents the exact no-payment Checkout-start commands for both the
standard and partner variants so the operator can prove each configured Stripe
Price ID creates the expected live Checkout Session before running any paid
unlock proof.

## Scope (this PR)

Slice phase: Functional validation

1. Update the paid-unlock go-live runbook with explicit standard and partner
   hosted Checkout smoke commands using `--price-variant`.
2. Keep the existing default command semantics clear: omitting the flag still
   exercises the standard route shape.
3. Name the expected partner failure mode when the request id was not persisted
   as a partner report.

### Files touched

- `web/plans/PR-Deflection-Hosted-Checkout-Variant-Runbook.md`
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md`

## Mechanism

The runbook keeps the production env preflight before any hosted Checkout smoke.
After redeploy, it now separates:

- standard checkout-start smoke: `--price-variant standard`
- partner checkout-start smoke: `--price-variant partner`

Both commands use `--require-checkout-session` and `--expect-mode live`, so they
fail if the report is already paid, if Checkout is not created, or if the
deployed env produces a test-mode session. The partner command explicitly
requires a report id whose intake metadata was persisted as `partner`; otherwise
the route should fail closed instead of proving the partner Price ID.

## Intentional

- Docs only. The smoke implementation and checkout route already landed in the
  prior slices.
- The runbook does not ask anyone to complete a live $1,000 or $1,500 payment.
  These commands only create hosted Checkout Sessions.
- The partner proof uses a separate `PARTNER_REQUEST_ID` variable so the standard
  and partner paths cannot be accidentally conflated.

## Deferred

- The actual live operator run remains external to this docs slice; it requires
  real locked standard/partner report ids and production envs.
- Generalized cohort/flag routing remains #194.

Parked hardening: none.

## Verification

- `npm --prefix web ci` -> pass; installed 378 packages, audited 379 packages,
  reported the existing npm audit state: 3 vulnerabilities (2 moderate, 1 high).
- `rg -n -- '--price-variant standard|--price-variant partner|PARTNER_REQUEST_ID|deflection-hosted-checkout-standard-prod|deflection-hosted-checkout-partner-prod|Omitting \`--price-variant\`' web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` -> pass; matched the standard command, partner command, separate partner request id, and both artifact paths.
- `bash scripts/local_pr_review.sh` -> pass after local dependencies were
  installed; plan audits, cross-session drift, full ESLint, Next build, and
  `git diff --check` all passed.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Hosted-Checkout-Variant-Runbook.md` | +75 / -0 |
| `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` | +24 / -3 |
| Total | 102 changed (+99 / -3 across 2 files) |
