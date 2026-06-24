# PR-Deflection-Standard-Price-Chain-Smoke

## Why this slice exists

Issue #194's remaining Milestone 1 work is the operator proof for changing the
standard deflection audit price. The display path now consumes ATLAS pricing
terms, and checkout creation uses ATLAS authorization, but the operator still
needs one runbook and one smoke that prove the configured standard amount is
safe across every money boundary before traffic sees it.

This slice closes that gap without widening into partner checkout, A/B pricing,
or arbitrary multi-arm pricing.

The diff is over the 400 LOC soft cap because the runbook, the reusable
paid-unlock hook, the new full-chain smoke, checkout preflight alignment, and
focused tests need to land together for the operator proof to be meaningful.

## Scope (this PR)

Slice phase: Production hardening

1. Add a standard price-chain smoke that proves the hosted display terms,
   portfolio allowed amount set, created Stripe Checkout Session, and paid
   unlock/render path agree for the same standard request.
2. Let the existing paid-unlock smoke wait on an already-created Checkout URL so
   the new chain smoke does not create a second Session after verifying the
   first one.
3. Update the go-live runbook with the exact standard price-change procedure:
   reuse an existing one-time Stripe Price when possible, create a new Price ID
   for a new amount, update ATLAS charge terms plus the portfolio allowed amount
   set, then run the preflight/smoke.
4. Align checkout env preflight with the ATLAS-authorized standard price path so
   it no longer rejects a new standard amount just because legacy local standard
   env/default values still exist.
5. Enroll the focused smoke tests in the CI audit list.

### Files touched

- `.github/workflows/pre_push_audit.yml` -- enroll the focused standard
  price-chain smoke tests.
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` --
  add the standard price-change runbook and retire stale fixed-amount guidance.
- `web/package.json` -- expose the standard price-chain smoke and its focused
  test script.
- `web/README.md` -- clarify that legacy standard Price envs are optional
  diagnostics and the standard smoke requires an explicit amount mirror.
- `web/src/lib/deflection-checkout-requirements.js` -- stop requiring legacy
  local standard Price ID / amount membership in checkout env preflight.
- `web/scripts/check-deflection-checkout-env.mjs` -- update preflight usage text
  for ATLAS-authorized standard pricing.
- `web/scripts/test-deflection-checkout-env.mjs` -- cover standard preflight
  without legacy local standard price config.
- `web/scripts/smoke-deflection-paid-unlock.mjs` -- allow waiting on a supplied
  Checkout URL without creating another Session.
- `web/scripts/smoke-deflection-standard-price-chain.mjs` -- new consolidated
  smoke for ATLAS terms, portfolio allowlist, Stripe Session amount, and paid
  unlock/render verification.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` -- cover supplied
  Checkout URL reuse.
- `web/scripts/test-deflection-standard-price-chain-smoke.mjs` -- focused
  tests for the consolidated smoke.
- `web/plans/PR-Deflection-Standard-Price-Chain-Smoke.md` -- this plan.

## Mechanism

The new smoke reads the public portfolio standard pricing proxy, requires the
portfolio allowed amount set env to be present locally, and fails before
Checkout creation if the ATLAS terms amount is not in that set. It also checks
the local Stripe Session read key before creating Checkout so a missing local
credential cannot leave an unnecessary hosted Checkout Session behind. It then
reuses `runDeflectionHostedCheckoutSmoke()` with `priceVariant=standard` and
`--require-checkout-session` to create the hosted Checkout Session.

After extracting the `cs_test_...` or `cs_live_...` Session ID from the returned
Stripe Checkout URL, the smoke retrieves the Session directly from Stripe with
the configured restricted key or test fallback key. It asserts:

- Stripe `amount_total` equals the ATLAS standard terms `amount_cents`;
- Stripe `currency` equals the ATLAS terms currency;
- Session metadata records the same request id, amount, and currency;
- the terms amount is present in the portfolio allowed amount set.

Finally, the smoke hands that same Checkout URL to the paid-unlock smoke. The
paid-unlock smoke keeps its existing safety posture: it refuses live Checkout
URLs unless explicitly allowed, waits for the real webhook unlock, then verifies
the paid hosted result page markers.

The checkout env preflight still validates Stripe key mode, ATLAS connectivity
env, partner Price ID config, partner eligibility config, allowed amount syntax,
and partner amount membership. It no longer treats the legacy local standard
Price ID or local standard display amount as required for the standard charge
path because ATLAS now supplies the standard `price_id`, amount, and currency.

## Intentional

- This smoke requires the portfolio allowed amount env to be explicit. The
  runtime can default to the historical amount, but a price-change proof should
  verify the two-place sync the operator actually controls: ATLAS charge terms
  and the portfolio allowed amount set.
- This does not complete payment automatically. The operator still completes the
  test-mode Stripe Checkout in a browser, and the smoke waits for the real
  webhook path.
- This does not make partner checkout public or add variant-aware ATLAS
  authorization. Partner and A/B pricing stay deferred.
- Legacy standard price env names are not deleted. If present, malformed values
  still fail preflight, but the standard path no longer requires them or uses
  them as the standard charge authority.

## Deferred

- Generic A/B or cohort pricing.
- Public partner checkout until ATLAS exposes variant-aware authorization.
- Optional cleanup of legacy local standard price env naming after old operator
  artifacts no longer reference those names.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-paid-unlock-smoke` -- passed
  (`Deflection paid unlock smoke tests passed.`).
- `npm --prefix web run test:deflection-checkout-env` -- passed
  (`Deflection checkout env tests passed.`).
- `npm --prefix web run test:deflection-checkout` -- passed
  (`Deflection checkout tests passed.`).
- `npm --prefix web run test:deflection-standard-price-chain-smoke` -- passed
  (`Deflection standard price-chain smoke tests passed.`).
- `node web/scripts/audit-test-enrollment.mjs` -- passed; all 33 `test:*`
  scripts are enrolled in `.github/workflows/pre_push_audit.yml`.
- `npm --prefix web run check:dead-code` -- passed; Knip baseline matches 16
  known findings.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` -- passed
  (`Deflection Snapshot landing smoke tests passed.`).
- `npm --prefix web run lint` -- passed.
- `npm --prefix web run build` -- passed. Next emitted the existing
  edge-runtime static-generation warning while generating all 45 pages.
- `git diff --check` -- passed.
- `bash scripts/local_pr_review.sh` -- passed.
- `rg -n "150000 for the standard variant|100000 for the partner variant|displayed amount \\(from item 3\\)|Your paid report is ready to review|Unlock your full Backlog Report" web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md web/scripts`
  -- passed; no stale fixed-amount or old paid-render guidance remains in the
  updated runbook/smoke surfaces.

## Estimated diff size

| File | LOC |
|---|---:|
| `.github/workflows/pre_push_audit.yml` | ~3 |
| `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` | ~90 |
| `web/package.json` | ~2 |
| `web/README.md` | ~14 |
| `web/src/lib/deflection-checkout-requirements.js` | ~38 |
| `web/scripts/check-deflection-checkout-env.mjs` | ~10 |
| `web/scripts/smoke-deflection-paid-unlock.mjs` | ~30 |
| `web/scripts/smoke-deflection-standard-price-chain.mjs` | ~616 |
| `web/scripts/test-deflection-checkout-env.mjs` | ~61 |
| `web/scripts/test-deflection-paid-unlock-smoke.mjs` | ~21 |
| `web/scripts/test-deflection-standard-price-chain-smoke.mjs` | ~252 |
| `web/plans/PR-Deflection-Standard-Price-Chain-Smoke.md` | ~150 |
| **Total** | **~1,287** |
