# Juan Canfield Portfolio Site

Next.js app for the public portfolio and AI automation consulting site.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks before committing:

```bash
npm run lint
npm run build
```

## Vercel Deployment

Import the GitHub repository into Vercel and set the project root to:

```text
web
```

Recommended Vercel settings:

```text
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

## Required Production Intake Configuration

The `/audit` form must have a production delivery path before the site is promoted. Do not rely on local file fallback on Vercel; serverless `/tmp` storage is ephemeral.

Recommended production setup:

```text
Persistent sink: Dedicated Audit Intake Database
Notification: Resend Email Notification
```

Email is useful for alerts, but it should not be treated as the system of record. If the app successfully sends email but no database, webhook, or Atlas CRM sink is configured, the API response includes a warning so operators know submissions are inbox-only.

Configure at least one delivery path before promoting the site:

### Option 1: Resend Email Notification

```text
AUDIT_NOTIFICATION_RESEND_API_KEY=
AUDIT_NOTIFICATION_FROM_EMAIL=
AUDIT_NOTIFICATION_TO_EMAIL=
```

The app also accepts these fallback sender env names:

```text
ATLAS_CAMPAIGN_SEQ_RESEND_API_KEY=
ATLAS_CAMPAIGN_SEQ_RESEND_FROM_EMAIL=
ATLAS_EMAIL_DEFAULT_FROM=
```

### Option 2: Dedicated Audit Intake Database (Persistent Sink)

Use a separate Postgres database or schema for portfolio intake so public audit requests do not pollute Atlas B2B CRM event streams.

Run the schema in `sql/001_portfolio_audit_requests.sql`, then configure:

```text
AUDIT_INTAKE_DATABASE_URL=
```

Vercel Marketplace Postgres integrations commonly inject `DATABASE_URL`; the app will use that as a fallback if `AUDIT_INTAKE_DATABASE_URL` is not set. Keep `AUDIT_INTAKE_DATABASE_URL` when you want an explicit audit-only connection string.

### Option 3: Generic Webhook (Persistent Sink)

```text
AUDIT_INTAKE_WEBHOOK_URL=
```

### Option 4: Atlas CRM Event Sink (Persistent Sink)

This is supported for compatibility, but it should only be used if downstream Atlas CRM consumers explicitly ignore portfolio audit events where `event_data.intake_type = "audit_request"`.

```text
AUDIT_INTAKE_ATLAS_BASE_URL=
AUDIT_INTAKE_ATLAS_AUTH_TOKEN=
```

## Local Fallback

Outside production, audit submissions can fall back to a local NDJSON file:

```text
AUDIT_INTAKE_FILE_PATH=/tmp/atlas-portfolio-audit-requests.ndjson
```

Production file fallback is disabled by default. It can be explicitly enabled only if you have a durable filesystem target:

```text
AUDIT_INTAKE_ALLOW_FILE_FALLBACK=true
```

Do not enable that on Vercel.

## Pre-Launch Smoke Test

After deploying a preview, check:

```text
/
/services
/ai-automation-consultant
/resources
/resources/how-to-scope-ai-automation-project
/audit
/sitemap.xml
/robots.txt
```

Submit one test `/audit` request and confirm the selected delivery path receives it.

## Analytics

Google Analytics 4 uses the live site measurement ID by default. Set this public environment variable to override it:

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Google Ads tagging is optional and enabled when this public environment variable is configured:

```text
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXXX
```

When enabled, the site tracks page views and safe conversion events after successful form submissions:

```text
audit_request_submitted
faq_report_csv_submitted
```

The events include only routing metadata and non-personal operational dimensions such as source page, source offer, submission status, delivery path, or support platform. They do not include names, emails, company URLs, free-text form answers, CSV filenames, or request IDs.

## Private Audit Intake Viewer

The read-only `/admin/intake` page shows recent rows from `portfolio_audit_requests`. It is hidden from navigation and requires an HTTP-only cookie set by a shared admin token.

Configure this secret in Production and Preview before using the page:

```text
ADMIN_INTAKE_TOKEN=
```

## Support Ticket Deflection Checkout

The deflection results page creates one-time Stripe Checkout Sessions from a
server route. Configure a restricted Stripe API key with the minimum Checkout
Sessions permission needed for the hosted route:

```text
ATLAS_SAAS_STRIPE_RAK=
ATLAS_ACCOUNT_ID=
STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER=
STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD=
STRIPE_DEFLECTION_REPORT_PRICE_ID=
ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS=
DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN=
DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS=
```

`ATLAS_SAAS_STRIPE_SECRET_KEY` remains a test-mode fallback for local/preview
validation. For the standard public checkout, ATLAS authorization supplies the
actual Stripe `price_...` ID, amount, and currency used to create the Checkout
Session; portfolio then verifies the authorized amount against the allowed
amount set and verifies Stripe's returned Session amount/currency before
returning the redirect URL. `STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD` and
`STRIPE_DEFLECTION_REPORT_PRICE_ID` are legacy/local-preflight values for the
old standard catalog path, not the source of the standard charge. Keep them set
until the final #194 runbook/smoke slice retires or renames the old preflight.
`STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER` configures the `$1,000` partner URL
variant. Full live `sk_live_` keys are rejected; production should use an
`rk_live_` restricted key.
Production deployments reject test-mode fallback keys and require an `rk_live_`
restricted key path.

The ATLAS-authorized standard Price must be active, `usd`, and have a
`unit_amount` in the comma-separated cent allowlist configured on both sides:
`ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS`. If the
partner variant is enabled later, configure both portfolio and ATLAS with each
live amount before traffic sees the partner Price ID. If the allowlist env is
omitted, the portfolio defaults to the historical standard amount only. The
checkout route validates Stripe's returned `amount_total` and `currency` against
ATLAS authorization before returning the Stripe redirect URL, so a mismatched
Price fails closed before the customer leaves the results page.

Partner pricing is eligibility-gated with
`DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN` for legacy direct bearer links, or
`DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS` for signed expiring links. Each env
accepts one value or a comma-separated rotation list such as
`old-token,current-token`. Prefer signed expiring partner tokens for new
outreach:

```bash
npm --prefix web run create:deflection-partner-token -- --partner acme --ttl-days 30
```

The command signs with the last `DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS`
entry, so keep signing-secret env order `old,current`. The generated
`partner_v1...` value goes in the URL as `partnerToken=<token>`. Existing
direct-token links still work for compatibility; send new links with signed
tokens, then remove old direct tokens after their outreach window closes. A
partner intake link must include both `priceVariant=partner` and a valid
`partnerToken` before the server will persist the partner variant. Missing,
expired, tampered, or invalid tokens fall back to the standard public price;
partner-tagged checkout fails closed if the saved intake variant is missing.
