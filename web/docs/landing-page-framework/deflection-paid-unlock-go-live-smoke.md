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
- The portfolio preview has:
  - `ATLAS_B2B_SERVICE_TOKEN`
  - `ATLAS_SAAS_STRIPE_SECRET_KEY` or a least-privilege test restricted key
  - no Preview-scoped live `ATLAS_SAAS_STRIPE_RAK`
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

- amount: `150000`
- currency: `usd`
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

Verify both the protected preview and the canonical production URL when the same
report is expected to be visible on production:

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
