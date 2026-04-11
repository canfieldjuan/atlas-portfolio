# Demo: Autonomous Operations

This demo shows how ATLAS runs itself: 81 scheduled tasks executing continuously for enrichment, intelligence synthesis, content generation, delivery, and monitoring — with quality gates, cost tracking, and operator review at every stage.

## Why This Demo Matters

- The system doesn't wait for a human to press "generate." It runs autonomously, produces artifacts, validates them, and surfaces issues.
- This is the difference between an AI tool and an AI platform: autonomous execution with operational controls.
- Content generation (blogs, campaigns, briefings) is one output of this system, not the system itself. The real product is the orchestration.

## What You'll See

### Pipeline Review Dashboard
- Real-time view of all 81 scheduled tasks: enrichment, scraping, campaign generation, blog generation, churn intelligence, reasoning synthesis, report delivery, and monitoring
- Task status with success/failure tracking, execution history, and cost attribution
- Quality signal validation showing extraction health, synthesis accuracy, and content readiness
- Per-task cost tracking across LLM providers and operations

### Blog Generation & Review
- ATLAS autonomously generates SEO blog content from real churn intelligence data
- Content types: vendor deep dives, migration guides, pricing analysis, vendor comparisons, competitive showdowns
- Each post is generated from evidence vault data — real review quotes, pain categories, competitor mentions, and pricing signals
- Blog Review queue shows drafts with:
  - Full HTML preview with rendered charts, CTAs, and affiliate link placement
  - Quality diagnostics and generation metadata
  - Bulk approve/reject before publishing
- Published posts appear on the live blog at [churnsignals.co/blog](https://churnsignals.co/blog)

### Campaign Generation & Delivery
- Campaigns are generated from prospect enrichment + evidence vault data
- Each campaign draft includes subject, body, CTA, quality score, and the reasoning chain that produced it
- Campaigns go through the review queue before sending — no blind auto-send
- Outcome tracking after send: meeting booked, deal opened, deal won, no opportunity

### Briefing Delivery
- Vendor briefings generated and delivered on schedule via email
- Subscription management with frequency, focus, and freshness controls
- Delivery audit log showing what was sent, when, and to whom

### Cost & Efficiency
- Token usage and cost per operation across Claude, GPT, Ollama, and other providers
- Cache hit rates and cost reduction metrics (60-75% reduction through caching and workload shaping)
- Model efficiency comparisons for different task types

## Screenshots

| | |
|---|---|
| ![Pipeline Review](../screenshots/screenshot-pipeline-review.png) | ![Blog](../screenshots/screenshot-blog.png) |
| Operations dashboard with task status and quality signals | AI-generated blog content from churn intelligence |
| ![Campaign Review](../screenshots/screenshot-campaign-review.png) | ![Reports](../screenshots/screenshot-reports.png) |
| Campaign approval queue with quality trends | Intelligence report library with trust panels |

## Live Product

- Pipeline Review: [churnsignals.co/pipeline-review](https://churnsignals.co/pipeline-review)
- Blog: [churnsignals.co/blog](https://churnsignals.co/blog)
- Campaign Review: [churnsignals.co/campaign-review](https://churnsignals.co/campaign-review)
- Reports: [churnsignals.co/reports](https://churnsignals.co/reports)

## What To Notice

- Blog posts aren't template-filled — they pull from the same evidence vault that feeds battle cards and campaigns, with real quotes and data
- The pipeline dashboard shows the full autonomous system, not just one task. Enrichment, scraping, reasoning, content, delivery, and monitoring all run on schedule
- Quality gates block weak outputs from reaching downstream workflows. Failed generations are tracked, retried, and surfaced — not silently dropped
- Cost tracking is per-operation, not just monthly bills. The system knows which tasks cost what and routes work to the most cost-effective model for each job
