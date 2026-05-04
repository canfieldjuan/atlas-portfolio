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

## Artifact Contract

The launch/reporting path is artifact-gated. Each handoff writes JSON with a per-type `artifactVersion` and `generatedAt`. Downstream commands refuse incompatible versions, and the performance/funnel reporting chain also refuses artifacts older than 48 hours. Versions and freshness windows are tracked in `scripts/google-ads-artifact-contracts.mjs`; only the type whose schema actually changed is bumped, so a tightening to one artifact does not invalidate unrelated ones.

The table below lists the operator-facing safety highlights, not the full validator schema. The authoritative contract lives in the producing/consuming scripts plus `scripts/test-google-ads-artifact-contracts.mjs`.

| Artifact | Producer | Consumed by | Current version | Safety highlights |
| --- | --- | --- | --- | --- |
| Preflight | `ads:google:preflight` | `ads:google:create-paused`, `ads:google:enable` | 2 | `mode=READ_ONLY_PREFLIGHT`, `mutations=false`, `targetCustomerFingerprint`, separate `oauthCallAttempted`/`googleAdsCallAttempted` flags |
| Create-paused result | `ads:google:create-paused` | `ads:google:enable-check` | 3 | `mode=CREATE_PAUSED`, `mutations=true`, `campaign.status=PAUSED`, numeric `campaign.id`, embedded `preflightResult` provenance object with matching `targetCustomerFingerprint`, created resource list |
| Status report | `ads:google:status` | `ads:google:enable-check` | 2 | `mode=GOOGLE_ADS_CAMPAIGN_STATUS_REPORT`, `mutations=false`, `campaign.status=PAUSED`, numeric `campaign.id` matching create-result, ad group/ad counts, `nextSteps.enableSafe` only when at least one ENABLED ad lives under an ENABLED ad group |
| Google Ads performance report | `ads:google:report` | `ads:report:combine` | 2 | `mode=GOOGLE_ADS_PERFORMANCE_REPORT` or dry-run mode, canonical UTC ISO `generatedAt` within 48h, date range, totals, numeric `campaignId` |
| GA4 performance report | `ads:ga4:report` | `ads:report:combine` | 2 | `mode=GA4_PERFORMANCE_REPORT` or dry-run mode, canonical UTC ISO `generatedAt` within 48h, date range, landing-page totals, conversion-event totals |
| Funnel report | `ads:report:combine` | `ads:google:enable-check` (optional) | 2 | `mode=ADVERTISING_FUNNEL_REPORT`, `apiCalls=false`, canonical UTC ISO `generatedAt` within 48h, aligned date ranges, numeric `campaignId` matching create-result (defends against duplicate-name collisions) |
| Enablement readiness | `ads:google:enable-check` | `ads:google:enable` | 2 | `mode=GOOGLE_ADS_ENABLEMENT_READINESS`, all four operator confirmations, create/status customer fingerprint match, create/status `campaign.id` match |
| Enable result | `ads:google:enable` | Operator audit log | 2 | `mode=GOOGLE_ADS_ENABLE`, `mutations=true`, `previousStatus=PAUSED`, `currentStatus=ENABLED` |

The checked-in offline harness pins this contract:

```bash
npm run test:google-ads-artifacts
```

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

## Implemented Command Surface

1. Campaign spec + validator. No API calls.
2. Google Ads read-only preflight. No mutations.
3. Google Ads API deployer that creates paused campaigns only.
4. Read-only Google Ads status report before enablement.
5. Google Ads reporting pull.
6. GA4 reporting pull.
7. Combined advertising funnel summary.
8. Manual approval gate for campaign enablement.
9. Guarded live enablement command.

## Local Commands

### Full Launch Order

Use this sequence for a real launch. Do not skip from create-paused to enablement without the status and readiness artifacts.

```bash
npm run ads:validate
npm run ads:google:plan
npm run ads:google:check-env
npm run ads:ga4:check-env
npm run ads:google:preflight -- --json --output /tmp/google-ads-preflight.json
npm run ads:google:create-paused -- --dry-run --json --output /tmp/google-ads-create-paused-plan.json
npm run ads:google:create-paused -- --preflight-result /tmp/google-ads-preflight.json --confirm-create-paused --output /tmp/google-ads-create-paused-result.json
npm run ads:google:status -- --output /tmp/google-ads-status.json
npm run ads:google:report -- --days 7 --output /tmp/google-ads-performance.json
npm run ads:ga4:report -- --days 7 --output /tmp/ga4-performance.json
npm run ads:report:combine -- --google-ads-report /tmp/google-ads-performance.json --ga4-report /tmp/ga4-performance.json --output /tmp/advertising-funnel.json
npm run ads:google:enable-check -- --create-result /tmp/google-ads-create-paused-result.json --status-result /tmp/google-ads-status.json --funnel-report /tmp/advertising-funnel.json --confirm-assets-reviewed --confirm-budget-reviewed --confirm-conversion-tracking-reviewed --confirm-negative-keywords-reviewed --output /tmp/google-ads-enable-readiness.json
npm run ads:google:enable -- --dry-run --readiness-result /tmp/google-ads-enable-readiness.json --output /tmp/google-ads-enable-plan.json
npm run ads:google:preflight -- --json --output /tmp/google-ads-preflight-fresh.json
npm run ads:google:enable -- --readiness-result /tmp/google-ads-enable-readiness.json --preflight-result /tmp/google-ads-preflight-fresh.json --confirm-enable-live-campaign --output /tmp/google-ads-enable-result.json
```

### Individual Commands

Validate the source-controlled campaign spec:

```bash
npm run ads:validate
```

Preview the Google Ads operations without making API calls:

```bash
npm run ads:google:plan
```

Check local Google Ads API credentials, customer-id format, and optional login-customer-id format only. This skips campaign spec validation and does not create anything:

```bash
npm run ads:google:check-env
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

Preview the exact paused-create mutation plan without credentials or API calls:

```bash
npm run ads:google:create-paused -- --dry-run --output /tmp/google-ads-create-paused-plan.json
```

Create the campaign in Google Ads in `PAUSED` state only. This is guarded by a successful preflight artifact, an exact customer fingerprint match, duplicate-campaign read check, and an explicit confirmation flag:

```bash
npm run ads:google:create-paused -- --preflight-result /tmp/google-ads-preflight.json --confirm-create-paused --output /tmp/google-ads-create-paused-result.json
```

Read the live Google Ads state for the source-controlled campaign — whether it exists, current status, ad group/ad counts and statuses as returned by the API, and whether at least one ENABLED ad lives under an ENABLED ad group (the `nextSteps.enableSafe` gate). This is read-only and the safest checkpoint after create-paused and before enablement. The command does **not** validate the API response against the source-controlled spec; it only reports what Google Ads currently has.

```bash
npm run ads:google:status -- --output /tmp/google-ads-status.json
```

Preview the Google Ads performance report query without credentials or API calls:

```bash
npm run ads:google:report -- --dry-run
```

Pull read-only Google Ads campaign performance after the campaign exists. The campaign is resolved by name → id (refused on duplicate-name collisions) and the report query then filters by id; pass `--campaign-id <id>` to bypass the lookup or disambiguate when two campaigns in the account share a name:

```bash
npm run ads:google:report -- --days 7 --output /tmp/google-ads-performance.json
```

Preview the GA4 landing-page and conversion-event report without credentials or API calls:

```bash
npm run ads:ga4:report -- --dry-run
```

Check local GA4 Data API credentials only. This does not load the campaign spec, refresh OAuth, or run GA4 reports:

```bash
npm run ads:ga4:check-env
```

Pull read-only GA4 campaign landing-page traffic and audit-request events:

```bash
npm run ads:ga4:report -- --days 7 --output /tmp/ga4-performance.json
```

Combine the Google Ads and GA4 artifacts into one funnel summary:

```bash
npm run ads:report:combine -- --google-ads-report /tmp/google-ads-performance.json --ga4-report /tmp/ga4-performance.json --output /tmp/advertising-funnel.json
```

Record the human enablement review. This now requires the live read-only status artifact so the enablement packet proves the campaign still exists in Google Ads, remains `PAUSED`, and has at least one ad group and ad:

```bash
npm run ads:google:enable-check -- --create-result /tmp/google-ads-create-paused-result.json --status-result /tmp/google-ads-status.json --funnel-report /tmp/advertising-funnel.json --confirm-assets-reviewed --confirm-budget-reviewed --confirm-conversion-tracking-reviewed --confirm-negative-keywords-reviewed --output /tmp/google-ads-enable-readiness.json
```

Preview the final enablement mutation without credentials or API calls:

```bash
npm run ads:google:enable -- --dry-run --readiness-result /tmp/google-ads-enable-readiness.json --output /tmp/google-ads-enable-plan.json
```

Enable the campaign only after the readiness artifact exists and a fresh preflight confirms the configured Google Ads customer:

```bash
npm run ads:google:enable -- --readiness-result /tmp/google-ads-enable-readiness.json --preflight-result /tmp/google-ads-preflight.json --confirm-enable-live-campaign --output /tmp/google-ads-enable-result.json
```
