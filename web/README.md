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
AUDIT_INTAKE_DATABASE_SSL=true
```

`AUDIT_INTAKE_DATABASE_SSL` is optional if the connection string already includes `sslmode=require`.

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

Google Analytics 4 is optional and disabled unless this public environment variable is configured:

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

When enabled, the site tracks page views and one safe conversion event after a successful audit submission:

```text
audit_request_submitted
```

The event includes only routing metadata such as project interest, source page, source offer, submission status, and delivery path. It does not include names, emails, company URLs, free-text form answers, or request IDs.
