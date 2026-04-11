# Demo: Prospects & Campaign Workflow

This demo shows the end-to-end GTM automation pipeline: from prospect enrichment through manual review, campaign generation, and approval.

## Why This Demo Matters

- It shows a complete commercial workflow, not just data display. Prospects become campaigns that get reviewed, edited, and sent.
- The manual queue and company overrides demonstrate that AI-assisted pipelines need human-in-the-loop controls for real business operations.
- Campaign generation is grounded in evidence — every outreach email ties back to real churn signals and competitive intelligence.

## What You'll See

### All Prospects Tab
- 1,335 enriched prospects with company, title, seniority, location, email, LinkedIn
- Sequence enrollment status showing which prospects are in active outreach
- Churning-from vendor badges showing which competitor's customers these are
- Buying signal column parsed from reasoning context
- Click any row to open the detail drawer with full contact, company, sequence, and reasoning data

### Manual Queue Tab
- 20 companies that failed automatic enrichment and need human review
- Error category badges: "No Results," "No People," "No Emails," "Apollo Exhausted"
- Per-entry resolve actions: retry with a new domain or dismiss
- Shows the search names that were attempted, so operators can diagnose and fix

### Company Overrides Tab
- Domain and name overrides for companies where automatic resolution fails
- Inline CRUD: create, edit, delete overrides with comma-separated search names and domains
- Bootstrap from settings to bulk-import overrides

### Campaign Review (linked workflow)
- Generated campaign drafts grouped by company
- Inline editing of subject, body, and CTA directly in the review queue
- Quality validation with blocker/warning counts and failure explanations
- Approve, reject, or edit before any campaign is sent
- Outcome tracking for sent campaigns (meeting booked, deal won, etc.)

## Screenshots

| | |
|---|---|
| ![Prospects](../screenshots/screenshot-prospects.png) | ![Manual Queue](../screenshots/screenshot-prospects-manual-queue.png) |
| Prospects table with tabs and badge counts | Manual queue with error category badges |
| ![Campaign Review](../screenshots/screenshot-campaign-review.png) | |
| Campaign approval queue with quality trends | |

## Video Demo

**Watch**: [`../recordings/ui/prospects-demo.webm`](../recordings/ui/prospects-demo.webm)

## What To Notice

- The tab badge counts update live as data changes — "Manual Queue (20)" shows exactly how many items need attention
- Error categories parse the raw JSON error detail into human-readable badges, turning opaque failures into actionable information
- The detail drawer shows reasoning context (scope summary, atom context, delta summary) when available — the same evidence that feeds campaign generation
- Campaign editing happens inline in the review queue, not in a separate editor — operators stay in context
