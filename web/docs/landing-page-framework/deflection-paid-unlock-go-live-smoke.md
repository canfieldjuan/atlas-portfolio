# Deflection paid unlock go-live smoke

This runbook validates the customer trust boundary for the support-ticket
deflection funnel:

1. locked report snapshot
2. Checkout Session creation
3. verified Stripe webhook unlock in ATLAS
4. hosted results page renders the paid report

It is for test-mode go-live validation. Do not use a live Checkout Session for
this smoke.

## Prerequisites

- ATLAS is deployed with the current Stripe webhook signing secret. During
  rotation, ATLAS can accept a comma-separated list of old and new
  `ATLAS_SAAS_STRIPE_WEBHOOK_SECRET` values.
- Before adding or rotating the production Checkout env, validate the candidate
  values locally:

  ```bash
  npm --prefix web run check:deflection-checkout-env -- \
    --environment production \
    --env-file /tmp/atlas-portfolio-prod-candidate.env
  ```

  Production must have `ATLAS_SAAS_STRIPE_RAK=rk_live_...`,
  `ATLAS_ACCOUNT_ID`, and
  `STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD=price_...` for the current
  `standard` variant. `STRIPE_DEFLECTION_REPORT_PRICE_ID=price_...` remains a
  legacy fallback for that same variant. The partner URL variant also requires
  `STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER=price_...` and a `100000` allowed
  amount in both portfolio and ATLAS. Partner intake links must include a valid
  `partnerToken`; use
  `npm --prefix web run create:deflection-partner-token -- --partner <name> --ttl-days 30`
  to mint signed expiring tokens from
  the last/current `DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN` entry. Direct token links remain supported
  for compatibility while old outreach expires. Missing, expired, tampered, or
  invalid tokens fall back to the standard price before intake metadata is
  persisted. A legacy
  `ATLAS_SAAS_STRIPE_SECRET_KEY=sk_test_...` does not configure production
  checkout. If
  `ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS` is
  set, it must match the ATLAS amount allowlist; otherwise the portfolio
  defaults to the current full-report amount only. After the RAK is stored as a
  Vercel sensitive env var, `vercel env pull` will not reveal its value again;
  use the hosted Checkout smoke after redeploy to prove the deployed values can
  create the expected sessions. These commands stop at Checkout Session
  creation; they do not complete payment or unlock a report.

  ```bash
  npm --prefix web run smoke:deflection-hosted-checkout -- \
    --request-id "$REQUEST_ID" \
    --base-url https://juancanfield.com \
    --expect-mode live \
    --price-variant standard \
    --require-checkout-session \
    --json \
    --output /tmp/deflection-hosted-checkout-standard-prod.json
  ```

  Omitting `--price-variant` still exercises the standard/default request body.
  Passing it explicitly makes the smoke artifact unambiguous.

  For the partner path, use a separate locked report id whose intake metadata
  was persisted as `priceVariant=partner` through a valid partner-token intake
  link. Running the partner smoke against a standard report should fail closed;
  that does not prove the partner Stripe Price ID.

  ```bash
  npm --prefix web run smoke:deflection-hosted-checkout -- \
    --request-id "$PARTNER_REQUEST_ID" \
    --base-url https://juancanfield.com \
    --expect-mode live \
    --price-variant partner \
    --require-checkout-session \
    --json \
    --output /tmp/deflection-hosted-checkout-partner-prod.json
  ```
- The portfolio preview has:
  - `ATLAS_B2B_SERVICE_TOKEN`
  - `ATLAS_SAAS_STRIPE_SECRET_KEY` or a least-privilege test restricted key
  - no Preview-scoped live `ATLAS_SAAS_STRIPE_RAK`
- The old `ATLAS_B2B_JWT` fallback is retired for the deflection funnel; do not
  use it for new preview or production validation.
- Stripe CLI is authenticated or has a test key supplied through the local
  shell environment. Never paste the key into the fixture file or command
  history.
- The report has a real `request_id` and starts locked.

## Protected preview smoke

Use `vercel curl` for protected preview deployments:

```bash
npm --prefix web run smoke:deflection-paid-unlock -- \
  --request-id "$REQUEST_ID" \
  --base-url "$PREVIEW_URL" \
  --vercel-curl \
  --json \
  --output /tmp/deflection-paid-unlock-smoke.json
```

The smoke should either pass immediately when the report is already unlocked or
print a test-mode Checkout URL and keep polling for the webhook unlock. If it
returns a `cs_live_...` Checkout URL, stop and fix the preview Stripe env before
continuing.

## Stripe CLI fixture fallback

If browser automation stalls on Stripe-hosted Checkout, complete the unlock with
a Stripe CLI fixture against the same test-mode account. The important contract
is the Checkout Session metadata:

```json
{
  "source": "content_ops_deflection_report",
  "account_id": "<b2b-growth-account-id>",
  "request_id": "<content-ops-request-id>"
}
```

The fixture must create or confirm a Checkout Session for:

- amount: `150000` for the standard variant; `100000` for the partner variant
  when partner checkout is enabled
- currency: `usd`
- amount allowlist: default full-report amount only unless both ATLAS and
  portfolio are configured with the same comma-separated cent values
- API version: `2026-05-27.dahlia`
- event delivered to the deployed ATLAS `/webhooks/stripe` endpoint:
  `checkout.session.completed`

After the fixture runs, keep polling with the smoke command. It should observe:

```json
{ "status": "unlocked" }
```

## Render checks

The final results page must include all paid markers:

- `FULL DEFLECTION REPORT`
- `Your paid report is ready to review.`
- `Report summary`
- `Drill-down cards`

It must not include the locked CTA marker:

- `Unlock your full Backlog Report`

For production post-payment validation, use `--require-unlocked` so the smoke
fails closed if the webhook has not unlocked the report yet. This mode verifies
the hosted paid render and will not create another live Checkout Session:

```bash
npm --prefix web run smoke:deflection-paid-unlock -- \
  --request-id "$REQUEST_ID" \
  --base-url https://juancanfield.com \
  --require-unlocked \
  --json \
  --output /tmp/deflection-paid-unlock-prod-render.json
```

For lower-level manual inspection, verify both the protected preview and the
canonical production URL when the same report is expected to be visible on
production:

```bash
vercel curl "/systems/support-ticket-deflection/results/$REQUEST_ID" \
  --deployment "$PREVIEW_URL"
```

```bash
curl -fsS "https://juancanfield.com/systems/support-ticket-deflection/results/$REQUEST_ID"
```

## Cleanup

- Remove any temporary fixture JSON or smoke artifacts under `/tmp`.
- Close browser automation sessions after a stalled Checkout attempt.
- Disable stale Stripe test webhook endpoints that are still retrying with old
  signing secrets.
- Leave production Stripe env untouched unless the change is explicitly part of
  the release.
