# Screenshot Capture Guide

Take these screenshots from the running Atlas system. Save each as a PNG in this directory with the filename listed below.

---

## Primary Product Dashboard

### 1. `dashboard-overview.png`
- **URL**: Churn UI Dashboard page
- **What to capture**: Full page showing KPI cards (vendors tracked, high urgency, total reviews, enrichment rate), urgency bar chart, pipeline status widget, archetype distribution, slow-burn watchlist
- **Tip**: Make sure the pipeline status shows recent timestamps (last scrape, last enrichment)

### 2. `vendor-detail.png`
- **URL**: Click into a vendor with good data (Salesforce, HubSpot, or Zendesk work well)
- **What to capture**: Full vendor detail page showing urgency badge, archetype classification, charts (urgency trends, review volume), pain point breakdown, recent reviews
- **Tip**: Pick a vendor with a clear archetype badge and multiple pain categories

### 3. `reviews-enriched.png`
- **URL**: Reviews page
- **What to capture**: The enriched review table with filters visible. Show urgency badges, pain categories, sentiment direction, authority level, competitor chips
- **Tip**: Filter to a high-urgency vendor so the data is rich. Show at least 5-10 rows

### 4. `campaign-review.png`
- **URL**: Campaign Review page
- **What to capture**: Expanded campaign cards showing email subject + body preview, quality status badges, audit timeline. Show the stat cards at top (pending, ready to send, quality pass/fail)
- **Tip**: Expand at least one company group so the generated email content is visible

### 5. `blog-review.png`
- **URL**: Blog Review page
- **What to capture**: Blog draft cards with topic type badges (vendor_alternative, migration_guide, etc.), status indicators, titles
- **Tip**: Show a mix of topic types if possible

### 6. `reports-gallery.png`
- **URL**: Reports page
- **What to capture**: Report card grid showing different report types (weekly churn feed, vendor scorecard, battle card, etc.) with quality badges
- **Tip**: Use the report type filter dropdown to show it exists, but capture with "all" selected

### 7. `prospects.png`
- **URL**: Prospects page
- **What to capture**: Lead database table with company names, job titles, seniority badges, email addresses, prospect status
- **Tip**: Show the stat cards at top (total, active, contacted)

### 8. `challengers.png`
- **URL**: Challengers page
- **What to capture**: Challenger lead funnel table with intent counts, buying stage breakdown, top incumbents being displaced

---

## Admin Cost Dashboard

### 9. `admin-costs.png`
- **URL**: Admin UI
- **What to capture**: Full dashboard showing LLM cost summary, daily usage chart, provider breakdown, system resources bar
- **Tip**: Use 30-day window for the most interesting chart data

---

## Atlas Voice Interface

### 10. `voice-ui.png`
- **URL**: Atlas voice or assistant UI
- **What to capture**: The sci-fi interface with the central avatar orb, system stats panel (left), and system feed (right) if possible
- **Tip**: Capture in "standing by" state with both side panels visible

---

## Terminal / Pipeline Logs (optional but powerful)

### 11. `pipeline-running.png`
- **What to capture**: Terminal output showing an autonomous task running -- enrichment processing reviews, or campaign generation scoring opportunities
- **Tip**: Run an enrichment cycle and capture the log output showing reviews being processed

### 12. `mcp-tools.png`
- **What to capture**: Claude Desktop or Cursor showing Atlas MCP tools available in the tool list
- **Tip**: Show the B2B churn server tools or CRM tools in the sidebar

---

## Tips

- Use full browser width for dashboard screenshots (1920px+ ideal)
- Dark theme screenshots tend to read more clearly in documentation
- If data is sparse on any page, mention it -- "system processes 48K+ reviews" covers it
- Redact any real customer emails or phone numbers if they appear in prospect views
