# Plan: Deflection checkout production preflight

## Why this slice exists

Production checkout creation broke after the service-token cutover because the
deployed env had no `ATLAS_SAAS_STRIPE_RAK`; it only had the legacy
`ATLAS_SAAS_STRIPE_SECRET_KEY=sk_test_...` value. The runtime correctly failed
closed in production, but the missing/misnamed live restricted key was not
caught before deploy, so the customer buy button returned HTTP 503.

This slice adds a focused env-contract checker for the deflection checkout
route so future production cutovers can validate the candidate live Stripe
restricted key, account id, and price id before shipping.

The diff is intentionally over the 400 LOC soft cap because this is detection
logic: each branch that can block checkout env drift needs a focused negative
fixture so the checker cannot silently false-green the exact outage shape.

## Scope (this PR)

Slice phase: Production hardening

1. Add a deflection checkout env checker for production and non-production
   deployment modes.
2. Prove the exact outage shape fails: production with no
   `ATLAS_SAAS_STRIPE_RAK` and only a legacy test secret.
3. Add focused negative fixtures for malformed key modes, missing account ids,
   missing price ids, and preview/live-key drift.
4. Document the preflight command in the paid-unlock go-live runbook.
5. Enroll the synthetic checker test in the pre-push audit workflow.

### Files touched

- `web/plans/PR-Deflection-Checkout-Prod-Preflight.md` - this plan doc.
- `web/scripts/check-deflection-checkout-env.mjs` - checkout env preflight.
- `web/scripts/test-deflection-checkout-env.mjs` - focused checker tests.
- `web/package.json` - npm script for the preflight and tests.
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` -
  operator preflight step.
- `.github/workflows/pre_push_audit.yml` - synthetic checker test enrollment.

## Mechanism

The checker validates the environment that `web/src/lib/deflection-checkout.ts`
expects:

```text
production  -> ATLAS_SAAS_STRIPE_RAK=rk_live_... + ATLAS_ACCOUNT_ID + STRIPE_DEFLECTION_REPORT_PRICE_ID=price_...
preview/dev -> ATLAS_ACCOUNT_ID + rk_test_... + price_..., or ATLAS_ACCOUNT_ID + legacy sk_test_... fallback
```

It reports only key mode classifications, never raw secret values. Operators can
run it against a local candidate env file before adding or replacing the
sensitive Vercel Production value:

```bash
npm --prefix web run check:deflection-checkout-env -- \
  --environment production \
  --env-file /tmp/atlas-portfolio-prod-candidate.env
```

After the value is stored as a Vercel sensitive env var, `vercel env pull` does
not reveal the secret value again. At that point the deployed hosted-checkout
smoke is the proof that the sensitive runtime value can create a session.

## Intentional

- This does not relax the runtime fail-closed behavior. Production still refuses
  legacy full secret keys and non-live restricted keys.
- This does not call Stripe. The live hosted-checkout smoke remains the
  end-to-end proof that Stripe can create a session after env validation passes.
- The checker warns when a legacy secret is present beside a production RAK, but
  does not fail that state because the runtime ignores the legacy value once the
  RAK is configured.

## Deferred

- CI enforcement for remote Vercel Production env is deferred; CI cannot read
  project secrets safely, and Vercel sensitive env values are intentionally not
  re-readable through `vercel env pull`. The synthetic checker test is enrolled
  in CI, but the live candidate-value preflight remains an operator release
  command before values are stored.
- Stripe permission-level validation for the RAK is deferred to the hosted
  checkout smoke, which actually creates a Checkout Session.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-checkout-env` - passed.
- `npm --prefix web run test:deflection-checkout` - passed.
- `ATLAS_SAAS_STRIPE_RAK="$(...local live RAK loader...)" ATLAS_ACCOUNT_ID="<account-id>" STRIPE_DEFLECTION_REPORT_PRICE_ID="price_1Tcw7bG8X3Vv8B9AZbJFTORr" npm --prefix web run check:deflection-checkout-env -- --environment production --no-local-env --json` - passed; output classified the RAK as `live_restricted`, the account id as configured, and the price as configured without printing secret values.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~110 |
| Checker script | ~260 |
| Focused tests | ~275 |
| Package/runbook/workflow updates | ~35 |
| **Total** | ~680 |

The estimate is over the soft cap because checker failure branches are covered
explicitly per `AGENTS.md` detection-logic requirements.
