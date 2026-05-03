# Advertising Plan

## Operating Rule

Advertise the smallest sellable decision product, not the unfinished system.

For the AI Content Ops lane, the paid offer is the **AI Content Workflow Audit**. The full product can remain the landing-page system name, but search ads should lead with the concrete buying problem:

> Your team has useful source material, but turning it into approved content is still manual.

## First Campaign

| Field | Value |
| --- | --- |
| Campaign | AI Content Workflow Audit - Search - US |
| Channel | Google Search |
| Status | Paused by default |
| Initial budget | $35/day, capped below $50/day |
| Geography | United States |
| Landing page | `https://juancanfield.com/systems/ai-content-ops` |
| Conversion | `audit_request_submitted` |
| Primary offer | $1,500 fixed-fee audit |
| Downstream ladder | $7,500+ pilot, then $15,000+ full system |

## Positioning

Use:

- AI content workflow audit
- AI content automation audit
- AI content pipeline review
- Source-to-content automation
- Approval-ready AI content
- Content approval workflow
- Source material readiness

Avoid:

- AI blog generator
- Replace your writers
- Unlimited content
- Rank faster with AI
- Fully automated content machine
- Generic AI writer
- Social media caption generator
- SEO content tool

## API Sequence

1. Keep campaign specs in source control.
2. Validate specs locally before any API call.
3. Run a read-only Google Ads preflight against the intended customer account.
4. Create campaigns through Google Ads API in `PAUSED` state only.
5. Inspect assets, keywords, negatives, and budget in Google Ads UI.
6. Enable manually or through a separate approval command.
7. Pull daily performance from Google Ads + GA4 into a report.

## Environment

Use local/operator env only. Do not expose advertising secrets to browser code.
The local operator scripts load `.env.local` first, then `.env`, without overriding already-exported shell variables.

```text
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_API_VERSION=v22
GA4_PROPERTY_ID=
GA4_CLIENT_ID=
GA4_CLIENT_SECRET=
GA4_REFRESH_TOKEN=
GA4_API_VERSION=v1beta
```

## Next Build Slices

1. Campaign spec + validator. No API calls.
2. Google Ads read-only preflight. No mutations.
3. Google Ads API deployer that creates paused campaigns only.
4. Google Ads reporting pull.
5. GA4 reporting pull.
6. Manual approval gate for campaign enablement.

## Local Commands

Validate the source-controlled campaign spec:

```bash
npm run ads:validate
```

Preview the Google Ads operations without making API calls:

```bash
npm run ads:google:plan
```

Check local Google Ads API credentials only. This skips campaign spec validation and does not create anything:

```bash
npm run ads:google:plan -- --check-env
```

Run the read-only Google Ads API preflight. This refreshes OAuth, lists accessible customers, and verifies the configured customer can be queried without creating or changing campaigns:

```bash
npm run ads:google:preflight
```

Use JSON output for operator logs:

```bash
npm run ads:google:preflight -- --json
```

Write a reusable preflight artifact for the create-paused guard:

```bash
npm run ads:google:preflight -- --json --output /tmp/google-ads-preflight.json
```

The future paused-create command must be guarded by a successful preflight artifact and an explicit confirmation flag. It currently stops before any mutation calls:

```bash
npm run ads:google:create-paused -- --preflight-result /tmp/google-ads-preflight.json --confirm-create-paused
```

Preview the Google Ads performance report query without credentials or API calls:

```bash
npm run ads:google:report -- --dry-run
```

Pull read-only Google Ads campaign performance after the campaign exists:

```bash
npm run ads:google:report -- --days 7 --output /tmp/google-ads-performance.json
```

Preview the GA4 landing-page and conversion-event report without credentials or API calls:

```bash
npm run ads:ga4:report -- --dry-run
```

Pull read-only GA4 campaign landing-page traffic and audit-request events:

```bash
npm run ads:ga4:report -- --days 7 --output /tmp/ga4-performance.json
```
