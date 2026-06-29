# Deflection paid unlock go-live smoke

This runbook validates the customer trust boundary for the support-ticket
deflection funnel:

1. locked report snapshot
2. Checkout Session creation
3. verified Stripe webhook unlock in ATLAS
4. hosted results page renders the paid report

It is for test-mode go-live validation. Do not use a live Checkout Session for
this smoke.

## Standard price-change runbook

Use this path when changing the standard Resolution Audit price. Stripe Price
amounts are effectively immutable for this funnel: if the desired amount already
has a one-time Stripe Price, reuse that `price_...` ID; if the amount is new,
create one new one-time Price and switch config to that new ID. Do not plan on
editing an existing Stripe Price amount.

Update the two places that must agree:

1. ATLAS standard charge terms:
   - `ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_PRICE_ID`
   - `ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_AMOUNT_CENTS`
   - `ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_CURRENCY`
   - `ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS`
2. Portfolio amount safety mirror:
   - `ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS`

Do not edit portfolio copy or `NEXT_PUBLIC...` display amounts for a standard
price change. The public display reads the non-secret ATLAS pricing terms, and
checkout creation uses the ATLAS-authorized `price_id`, amount, and currency.
The portfolio allowed amount set is still required as the local fail-closed
mirror of the ATLAS webhook gate.

After deploying the config change, run the no-Checkout standard price preflight
first. This fetches the hosted standard price terms and confirms that the amount
is present in the portfolio allowed amount mirror before any Checkout Session is
created:

```bash
npm --prefix web run smoke:deflection-standard-price-preflight -- \
  --base-url "$PREVIEW_URL" \
  --json \
  --output /tmp/deflection-standard-price-preflight.json
```

For a candidate env file that has not been deployed yet, add
`--env-file /tmp/atlas-portfolio-prod-candidate.env`. The hosted terms still
come from `--base-url`; the env file only supplies the portfolio allowlist being
checked.

Once the dry-run passes, run the standard price-chain smoke against a locked
report in the same Stripe mode you intend to validate:

```bash
npm --prefix web run smoke:deflection-standard-price-chain -- \
  --request-id "$REQUEST_ID" \
  --base-url "$PREVIEW_URL" \
  --expect-mode test \
  --json \
  --output /tmp/deflection-standard-price-chain.json
```

For protected Vercel previews, add `--vercel-curl --vercel-deployment "$PREVIEW_URL"`.
The smoke reads the hosted standard pricing terms, verifies that amount is in
the local portfolio allowlist env, creates one hosted Checkout Session,
retrieves that same Session from Stripe, confirms its amount/currency/metadata,
then waits for the real webhook unlock and paid render. If the smoke returns a
Checkout URL, complete the test-mode payment in a browser while the command
polls.

Only use `--allow-live-checkout` for an explicit production live-purchase
validation that you intend to complete. Without that flag, the smoke refuses
`cs_live_...` URLs before polling.

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
  access to ATLAS checkout authorization. The standard checkout charge comes
  from ATLAS `price_id` / amount terms; the older
  `STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD=price_...` and
  `STRIPE_DEFLECTION_REPORT_PRICE_ID=price_...` env names remain legacy
  preflight values until the old local catalog path is retired. The partner URL
  variant also requires
  `STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER=price_...` and a `100000` allowed
  amount in both portfolio and ATLAS. Partner intake links must include a valid
  `partnerToken`; use
  `npm --prefix web run create:deflection-partner-token -- --partner <name> --ttl-days 30`
  to mint signed expiring tokens from the last/current
  `DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS` entry. Direct token links using
  `DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN` remain supported for compatibility
  while old outreach expires. Missing, expired, tampered, or invalid tokens fall
  back to the standard price before intake metadata is persisted. A legacy
  `ATLAS_SAAS_STRIPE_SECRET_KEY=sk_test_...` does not configure production
  checkout. If
  `ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS` is
  set, it must match the ATLAS amount allowlist; otherwise the portfolio
  defaults to the historical full-report amount only. The standard price-chain
  smoke requires this env to be explicit so a price-change proof cannot pass on
  an implicit default. After the RAK is stored as a Vercel sensitive env var,
  `vercel env pull` will not reveal its value again; run the smoke from a secure
  shell that has the restricted key or test fallback key available.

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

- amount: the active ATLAS standard pricing terms `amount_cents`
- currency: the active ATLAS standard pricing terms currency
- amount allowlist: the same comma-separated cent values in ATLAS and portfolio
- API version: `2026-05-27.dahlia`
- event delivered to the deployed ATLAS `/webhooks/stripe` endpoint:
  `checkout.session.completed`

After the fixture runs, keep polling with the smoke command. It should observe:

```json
{ "status": "unlocked" }
```

## Render checks

The final results page must include all paid markers:

- `FULL RESOLUTION AUDIT` or `FULL DEFLECTION REPORT`
- `Your Resolution Audit is ready.` or `Your Deflection Report is ready.`
- `Full audit contents`, `Full report contents`, `Full audit dashboard`, or
  `Full report dashboard`
- `Your Help-Desk SEO Targeting List` or `Help-desk SEO targeting list`
- `Publishable Help-Center Copy` or `Ranked question opportunities`
- `Reviewer guidance` or `Top publishable answers and gaps`

It must not include the locked CTA marker:

- `Unlock your full Resolution Audit`

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
