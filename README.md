# ATLAS

ATLAS is a solo-built applied AI platform focused on evidence-grounded workflows, autonomous operations, and business-facing software. The system combines data ingestion, LLM enrichment, retrieval, reasoning synthesis, operator review, and scheduled execution to turn raw external signals into usable product surfaces and downstream artifacts.

The current product focus is B2B churn intelligence and GTM automation, but the underlying work is broader than a single sales workflow. ATLAS is also a portfolio of production patterns for deterministic reasoning layers, retrieval-backed memory, evaluation loops, review tooling, and end-to-end AI system operations.

If you want a quick tour, start here:

- **Public product domain**: [churnsignal.co](https://churnsignal.co)
- **Curated terminal demo**: [`recordings/atlas-terminal-demo.cast`](recordings/atlas-terminal-demo.cast)
- **Raw review to evidence-backed campaign**: [`pipeline-walkthrough/WALKTHROUGH.md`](pipeline-walkthrough/WALKTHROUGH.md)
- **Full source code**: [github.com/canfieldjuan/ATLAS](https://github.com/canfieldjuan/ATLAS)

[![Curated Terminal Demo](recordings/gifs/atlas-terminal-demo.gif)](recordings/atlas-terminal-demo.cast)

---

## Flagship Demos

### 1. Churn Signal -> Evidence-Backed Campaign

**What it shows**
- A raw G2 review becomes structured intelligence, then turns into a personalized outbound campaign and a competitive battle card.
- The same evidence pipeline feeds multiple downstream artifacts instead of producing isolated one-off outputs.

**Why it matters**
- Shows how ATLAS turns noisy source material into reusable evidence, reasoning, and delivery layers.
- Demonstrates a production workflow instead of a one-shot demo.

**Open**
- Demo page: [`demos/churn-to-campaign.md`](demos/churn-to-campaign.md)
- Walkthrough: [`pipeline-walkthrough/WALKTHROUGH.md`](pipeline-walkthrough/WALKTHROUGH.md)
- Sample raw review: [`pipeline-walkthrough/01_raw_review.json`](pipeline-walkthrough/01_raw_review.json)
- Sample enriched review: [`pipeline-walkthrough/02_enriched_review.json`](pipeline-walkthrough/02_enriched_review.json)
- Sample churn signal: [`pipeline-walkthrough/03_churn_signal.json`](pipeline-walkthrough/03_churn_signal.json)
- Sample evidence vault: [`pipeline-walkthrough/04_evidence_vault.json`](pipeline-walkthrough/04_evidence_vault.json)
- Sample campaign output: [`pipeline-walkthrough/05_campaign_output.json`](pipeline-walkthrough/05_campaign_output.json)
- Sample battle card: [`pipeline-walkthrough/06_battle_card.json`](pipeline-walkthrough/06_battle_card.json)

### 2. Curated Terminal Demo

**What it shows**
- A short terminal walkthrough of the core Atlas story.
- Live scrape activity, structured enrichment, a generated campaign artifact, and a generated blog artifact in one short demo.

**Why it matters**
- It explains the business value quickly instead of requiring someone to infer it from raw logs.
- It still uses live data, but the flow is curated to show the strongest platform behaviors clearly.

**Open**
- Curated cast: [`recordings/atlas-terminal-demo.cast`](recordings/atlas-terminal-demo.cast)
- GIF preview: [`recordings/gifs/atlas-terminal-demo.gif`](recordings/gifs/atlas-terminal-demo.gif)
- Local replay: `asciinema play recordings/atlas-terminal-demo.cast`
- Curated script: [`recordings/atlas-terminal-demo.sh`](recordings/atlas-terminal-demo.sh)
- Live ops version: [`recordings/pipeline-demo.cast`](recordings/pipeline-demo.cast)
- Live ops script: [`recordings/demo.sh`](recordings/demo.sh)

### 3. AI Review, QA, and Publishing Workflow

**What it shows**
- Atlas does not stop at generation. It validates outputs, tracks retries, surfaces quality issues, and provides review flows before publish or downstream use.
- The same platform powers blog review, prepublish preview, artifact validation, and reasoning provenance.

**Why it matters**
- This is the difference between AI demos and production AI software.
- It shows operator tooling, auditability, and workflow safety around model-generated outputs.

**Open**
- Demo page: [`demos/ai-review-console.md`](demos/ai-review-console.md)
- Blog review page: [`demos/blog-review-preview.md`](demos/blog-review-preview.md)
- Source code: [github.com/canfieldjuan/ATLAS](https://github.com/canfieldjuan/ATLAS)
- Architecture overview: [`architecture/system-overview.md`](architecture/system-overview.md)

### Quick Visual Demos

**Blog Review / Prepublish Preview**

[![Blog Review Preview](recordings/gifs/blog-review-preview.gif)](recordings/ui/blog-review-preview-demo.webm)

**Pipeline Review / Quality Signals**

[![Pipeline Review](recordings/gifs/pipeline-review.gif)](recordings/ui/pipeline-review-demo.webm)

The current ATLAS UI has moved forward most in Watchlists, Evidence Explorer, Opportunities, Report Detail, and Pipeline Review. The portfolio recordings still show real product flows, but they do not yet capture every newer review and evidence surface.

---

## The Numbers

Verified against the current local ATLAS repo and dataset snapshot:

| Metric | Value |
|--------|-------|
| Raw reviews stored | 48,270 |
| Reviews enriched | 25,071 |
| Vendors with churn signals | 56 |
| Intelligence reports | 79 |
| Cross-vendor reasoning records | 170 |
| v2 reasoning syntheses | 323 |
| Review sources | 19 |
| Autonomous scheduled tasks | 81 |
| Database migrations | 222 |
| Skill documents | 68 |

---

## What Atlas Does

### Sales Enablement

- Scrapes reviews from 19 sources including G2, Capterra, TrustRadius, Reddit, Gartner, HackerNews, Twitter/X, GitHub, YouTube, and Stack Overflow.
- Extracts 47 structured fields per review including churn intent, urgency, pain categories, buying stage, budget signals, and competitor mentions.
- Generates battle cards with discovery questions, landmine questions, objection handlers, talk tracks, and recommended plays.
- Tracks vendor-to-vendor displacement dynamics with evidence-backed competitive flows.
- Resolves account-level signals including buyer role, company identity, contract timing, and opportunity context.

### Marketing Automation

- Generates SEO content from real churn intelligence data, including vendor alternatives, migration guides, pricing reality checks, and vendor showdowns.
- Produces personalized campaigns with subject lines, body copy, CTA, and audit trail grounded in real review evidence.
- Uses prospect enrichment and account matching to connect market pain patterns to named targets and relevant content.

### Internal Operations

- Runs 81 autonomous scheduled tasks for enrichment, campaign generation, churn intelligence, blog generation, email triage, briefings, monitoring, and anomaly detection.
- Uses LangGraph workflows for stateful agent behavior across email, calls, scheduling, monitoring, and automation.
- Exposes MCP servers across CRM, email, telephony, calendar, invoicing, intelligence, B2B churn, and memory.
- Routes work across multiple model providers depending on task type and cost profile.

### Research and Knowledge Systems

- Builds deterministic evidence pools that serve as canonical intermediate layers for every downstream artifact.
- Runs reasoning synthesis to convert those evidence pools into structured, cited reasoning contracts.
- Maintains graph-backed memory and conversation history for retrieval and continuity.

---

## Pipeline Snapshot

```text
Raw reviews (19 sources)
  -> LLM enrichment (47 structured fields per review)
  -> Churn signal aggregation
  -> Evidence pools and witness extraction
  -> Reasoning synthesis with validation and citations
  -> Output artifacts:
       - Personalized campaigns
       - SEO blog posts
       - Competitive battle cards
       - Vendor briefings
       - Intelligence reports
       - Product and account views
```

For the narrated version, open [`pipeline-walkthrough/WALKTHROUGH.md`](pipeline-walkthrough/WALKTHROUGH.md).

---

## Tech Stack

**Backend**: Python, FastAPI, asyncpg, PostgreSQL, APScheduler  
**LLM**: Ollama, vLLM, Claude API, OpenRouter, Groq, Together  
**Memory**: Neo4j, PostgreSQL  
**Agent Framework**: LangGraph, MCP  
**Scraping**: 19 review sources with proxy rotation, rate limiting, and dedup  
**CRM and GTM**: Apollo API, HubSpot, Salesforce, Pipedrive event ingestion  
**Telephony**: Twilio, SignalWire  
**Frontends**: React, Next.js  
**Infrastructure**: Docker Compose, Tailscale mesh, NVIDIA GPU  
**Tools Used to Build**: Claude Code, Cursor

---

## Additional Links

- **Public product domain**: [churnsignal.co](https://churnsignal.co)
- **Full source code**: [github.com/canfieldjuan/ATLAS](https://github.com/canfieldjuan/ATLAS)
- **Churn-to-campaign demo**: [`demos/churn-to-campaign.md`](demos/churn-to-campaign.md)
- **Blog review demo**: [`demos/blog-review-preview.md`](demos/blog-review-preview.md)
- **AI review and QA demo**: [`demos/ai-review-console.md`](demos/ai-review-console.md)
- **Architecture overview**: [`architecture/system-overview.md`](architecture/system-overview.md)
- **Pipeline walkthrough**: [`pipeline-walkthrough/WALKTHROUGH.md`](pipeline-walkthrough/WALKTHROUGH.md)
- **Recording assets**: [`recordings/`](recordings/)
- **Curated terminal demo**: [`recordings/atlas-terminal-demo.cast`](recordings/atlas-terminal-demo.cast)
- **Terminal GIF preview**: [`recordings/gifs/atlas-terminal-demo.gif`](recordings/gifs/atlas-terminal-demo.gif)
- **Blog review clip**: [`recordings/ui/blog-review-preview-demo.webm`](recordings/ui/blog-review-preview-demo.webm)
- **Pipeline review clip**: [`recordings/ui/pipeline-review-demo.webm`](recordings/ui/pipeline-review-demo.webm)
- **Campaign review clip**: [`recordings/ui/campaign-review-demo.webm`](recordings/ui/campaign-review-demo.webm)
- **Reports gallery clip**: [`recordings/ui/reports-gallery-demo.webm`](recordings/ui/reports-gallery-demo.webm)
- **Screenshot guide**: [`screenshots/CAPTURE_GUIDE.md`](screenshots/CAPTURE_GUIDE.md)
