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
3. Create campaigns through Google Ads API in `PAUSED` state only.
4. Inspect assets, keywords, negatives, and budget in Google Ads UI.
5. Enable manually or through a separate approval command.
6. Pull daily performance from Google Ads + GA4 into a report.

## Environment

Use local/operator env only. Do not expose advertising secrets to browser code.

```text
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
GOOGLE_ADS_CUSTOMER_ID=
GA4_PROPERTY_ID=
```

## Next Build Slices

1. Campaign spec + validator. No API calls.
2. Google Ads API deployer that creates paused campaigns only.
3. GA4 + Google Ads reporting pull.
4. Manual approval gate for campaign enablement.
