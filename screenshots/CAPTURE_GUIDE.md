# Screenshot Capture Guide

Take these screenshots from the running Atlas system. Save each as a PNG in this directory with the filename listed below.

---

## Primary Product Screens

### 1. `dashboard-overview.png`
- **URL**: Churn UI Dashboard page
- **What to capture**: Full page showing KPI cards (vendors tracked, high urgency, total reviews, enrichment rate), urgency bar chart, pipeline status widget, archetype distribution, slow-burn watchlist
- **Tip**: Make sure the pipeline status shows recent timestamps (last scrape, last enrichment)

### 2. `watchlists.png`
- **URL**: Watchlists page
- **What to capture**: Watchlist views, competitive sets, vendor feed, and at least one account-movement drawer or alert-related surface
- **Tip**: Show a saved view or competitive-set control plus one expanded account movement example

### 3. `vendor-detail.png`
- **URL**: Click into a vendor with good data (Salesforce, HubSpot, or Zendesk work well)
- **What to capture**: Vendor detail page showing urgency badge, archetype classification, charts, pain point breakdown, reasoning atoms or evidence-backed sections
- **Tip**: Pick a vendor with a clear archetype badge, multiple pain categories, and visible evidence-backed detail

### 4. `reviews-enriched.png`
- **URL**: Reviews page
- **What to capture**: The enriched review table with filters visible. Show urgency badges, pain categories, sentiment direction, authority level, competitor chips
- **Tip**: Filter to a high-urgency vendor so the data is rich. Show at least 5-10 rows

### 5. `evidence-explorer.png`
- **URL**: Evidence Explorer page
- **What to capture**: Witness search results, active filters, and either the evidence vault or trace tab
- **Tip**: Use a vendor with rich witness coverage and show one drawer or evidence detail panel if possible

### 6. `campaign-review.png`
- **URL**: Campaign Review page
- **What to capture**: Expanded campaign cards showing email subject + body preview, quality status badges, audit timeline. Show the stat cards at top (pending, ready to send, quality pass/fail)
- **Tip**: Expand at least one company group so the generated email content is visible

### 7. `opportunities.png`
- **URL**: Opportunities page
- **What to capture**: Opportunity cards or table rows with urgency, buying-stage context, reasoning summaries, and campaign actions
- **Tip**: Include the timeline or signal-effectiveness panel if visible

### 8. `blog-review.png`
- **URL**: Blog Review page
- **What to capture**: Blog draft cards with topic type badges (vendor_alternative, migration_guide, etc.), status indicators, titles
- **Tip**: Show a mix of topic types if possible

### 9. `reports-gallery.png`
- **URL**: Reports page
- **What to capture**: Report card grid showing different report types (weekly churn feed, vendor scorecard, battle card, etc.) with quality badges
- **Tip**: Use the report type filter dropdown to show it exists, but capture with "all" selected

### 10. `report-detail.png`
- **URL**: Open a report detail page
- **What to capture**: Executive summary, citations, evidence drawer hooks, and any structured/specialized report sections
- **Tip**: Prefer a battle card or reasoning-rich report with visible citations

### 11. `prospects.png`
- **URL**: Prospects page
- **What to capture**: Lead database table with company names, role context, prospect status, and signal-rich columns
- **Tip**: Show the stat cards at top (total, active, contacted)

### 12. `challengers.png`
- **URL**: Challengers page
- **What to capture**: Challenger lead funnel table with intent counts, buying stage breakdown, top incumbents being displaced

---

## Admin Cost Dashboard

### 13. `admin-costs.png`
- **URL**: Admin UI
- **What to capture**: Full dashboard showing LLM cost summary, daily usage chart, provider breakdown, system resources bar
- **Tip**: Use 30-day window for the most interesting chart data

### 14. `pipeline-review.png`
- **URL**: Pipeline Review page
- **What to capture**: Cost, queue, or delivery operations surfaces with recent runs, statuses, and operator controls
- **Tip**: Prefer the newer watchlist-delivery or B2B efficiency views over generic queue-only captures

---

## Terminal / Pipeline Logs (optional but powerful)

### 15. `pipeline-running.png`
- **What to capture**: Terminal output showing an autonomous task running -- enrichment processing reviews, or campaign generation scoring opportunities
- **Tip**: Run an enrichment cycle and capture the log output showing reviews being processed

### 16. `mcp-tools.png`
- **What to capture**: Claude Desktop or Cursor showing Atlas MCP tools available in the tool list
- **Tip**: Show the B2B churn server tools or CRM tools in the sidebar

---

## Tips

- Use full browser width for dashboard screenshots (1920px+ ideal)
- Dark theme screenshots tend to read more clearly in documentation
- If data is sparse on any page, mention it -- "system processes 48K+ reviews" covers it
- Redact any real customer emails or phone numbers if they appear in prospect views
- Prioritize Watchlists, Evidence Explorer, Opportunities, Report Detail, and Pipeline Review if you only refresh a few screenshots
