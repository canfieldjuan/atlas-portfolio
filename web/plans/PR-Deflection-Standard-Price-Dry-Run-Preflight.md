# PR-Deflection-Standard-Price-Dry-Run-Preflight

## Why this slice exists

Issue #458 follows the completed #194 standard price-change path. The full
standard price-chain smoke is the right final proof, but it creates a Stripe
Checkout Session and waits for the real webhook unlock. Operators need a lighter
dry-run before that step: confirm the hosted standard pricing terms and the
portfolio allowed amount mirror agree, without creating Checkout or touching a
report.

The diff is over the 400 LOC soft cap because the new CLI and its focused
negative tests need to land together: a price-change guard without tests would
be another prose-only promise in the money path.

## Scope (this PR)

Slice phase: Production hardening

1. Add a standard price-change dry-run preflight command that fetches hosted
   `/api/deflection-pricing/standard` and checks the returned amount against the
   local/candidate portfolio allowed amount set.
2. Document the price-change verification order as checkout env preflight,
   dry-run price preflight, then full standard price-chain smoke.
3. Add focused tests for pass, hosted terms failure, missing allowlist, malformed
   allowlist, and hosted amount mismatch.
4. Enroll the new test in the CI audit list.

### Files touched

- `.github/workflows/pre_push_audit.yml` -- enroll the focused dry-run preflight
  tests.
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` --
  place the new dry-run before the full price-chain smoke in the runbook.
- `web/package.json` -- expose the dry-run command and its focused test.
- `web/scripts/smoke-deflection-standard-price-preflight.mjs` -- new no-checkout
  standard price-change dry-run command.
- `web/src/lib/deflection-standard-price-preflight.test.mjs` -- focused tests
  for the dry-run command.
- `web/plans/PR-Deflection-Standard-Price-Dry-Run-Preflight.md` -- this plan.

## Mechanism

The new script loads local env unless `--no-local-env` is set, optionally overlays
an `--env-file`, fetches the hosted standard price terms route, validates the
response envelope, parses the configured portfolio allowlist, and fails closed
unless the hosted standard `amount_cents` is present in that allowlist.

It prints or writes a sanitized artifact containing only status, variant, amount,
currency, price label, allowed amount membership, and the checked URL. It does
not create Stripe Checkout Sessions, complete payment, fake a webhook, or unlock
reports.

## Intentional

- This is not a replacement for `smoke:deflection-standard-price-chain`. It is a
  cheap preflight that should run before the full money-path smoke.
- This checks the portfolio allowlist mirror only. The ATLAS endpoint remains the
  source for hosted display terms, and the full chain smoke still proves Stripe
  Checkout and webhook unlock.
- This does not add A/B or arbitrary multi-arm pricing; that remains parked in
  #457.

## Deferred

- A/B or multi-arm pricing (#457).
- Automatically changing Vercel or ATLAS env vars. This slice is verification
  only.
- Replacing the full price-chain smoke.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-standard-price-preflight` -- passed
  (6 tests).
- `node web/scripts/audit-test-enrollment.mjs` -- passed; all 41 `test:*`
  scripts are enrolled in `.github/workflows/pre_push_audit.yml`.
- `npm --prefix web run check:dead-code` -- passed; Knip baseline matches 14
  known findings.
- `npm --prefix web run lint` -- passed.
- `npm --prefix web run build` -- passed. Next emitted the existing
  edge-runtime static-generation warning while generating all 48 pages.
- `rg -n "smoke:deflection-standard-price-preflight|standard price preflight|standard price dry-run|standard price-chain smoke" web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md web/package.json .github/workflows/pre_push_audit.yml web/scripts web/src/lib web/plans/PR-Deflection-Standard-Price-Dry-Run-Preflight.md`
  -- passed; confirms the new dry-run command is documented/enrolled while the
  full standard price-chain smoke remains distinct.
- `git diff --check` -- passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `.github/workflows/pre_push_audit.yml` | ~3 |
| `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` | ~21 |
| `web/package.json` | ~2 |
| `web/scripts/smoke-deflection-standard-price-preflight.mjs` | ~297 |
| `web/src/lib/deflection-standard-price-preflight.test.mjs` | ~136 |
| `web/plans/PR-Deflection-Standard-Price-Dry-Run-Preflight.md` | ~83 |
| Total | ~542 |
