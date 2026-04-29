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

The `/audit` form must have a durable delivery path in production. Do not rely on local file fallback on Vercel; serverless `/tmp` storage is ephemeral.

Configure at least one of these delivery paths before promoting the site:

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

### Option 2: Generic Webhook

```text
AUDIT_INTAKE_WEBHOOK_URL=
```

### Option 3: Atlas CRM Event Sink

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
