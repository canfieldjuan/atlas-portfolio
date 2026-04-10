# ATLAS

ATLAS is a solo-built applied AI platform focused on evidence-grounded workflows, autonomous operations, and business-facing software. The system combines data ingestion, LLM enrichment, retrieval, reasoning synthesis, operator review, and scheduled execution to turn raw external signals into usable product surfaces and downstream artifacts.

The current product focus is B2B churn intelligence and GTM automation, but the underlying work is broader than a single sales workflow. ATLAS is also a portfolio of production patterns for deterministic reasoning layers, retrieval-backed memory, evaluation loops, review tooling, and end-to-end AI system operations.

If you want a quick tour, start here:

- **Public product domain**: [churnsignals.co](https://churnsignals.co)
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

The live product at [churnsignals.co](https://churnsignals.co) includes Watchlists, Evidence Explorer, Opportunities Workbench, Prospects, Report Library with subscription management, Campaign Review, Pipeline Review, and more.

### Product Screenshots

| | |
|---|---|
| ![Dashboard](screenshots/screenshot-dashboard.png) | ![Watchlists](screenshots/screenshot-watchlists.png) |
| Dashboard — Overview with churn signals, pipeline health, and slow-burn watchlist | Watchlists — Vendor tracking, accounts in motion, competitive sets |
| ![Prospects](screenshots/screenshot-prospects.png) | ![Manual Queue](screenshots/screenshot-prospects-manual-queue.png) |
| Prospects — Enriched prospect table with tabs | Manual Queue — Error category badges with resolve actions |
| ![Evidence Witnesses](screenshots/screenshot-evidence-witnesses.png) | ![Evidence Vault](screenshots/screenshot-evidence-vault.png) |
| Evidence Explorer — Witness excerpts with signal tags | Evidence Vault — Weakness/strength claims with metrics |
| ![Reasoning Trace](screenshots/screenshot-evidence-reasoning-trace.png) | ![Reports](screenshots/screenshot-reports.png) |
| Reasoning Trace — Evidence diff and synthesis provenance | Reports — Intelligence report library with trust panels |
| ![Vendor Detail](screenshots/screenshot-vendor-detail.png) | ![Campaign Review](screenshots/screenshot-campaign-review.png) |
| Vendor Detail — HubSpot churn signal profile | Campaign Review — Draft approval queue with quality trends |
| ![Pipeline Review](screenshots/screenshot-pipeline-review.png) | ![Blog](screenshots/screenshot-blog.png) |
| Pipeline Review — Operations dashboard with quality signals | Blog — AI-generated SEO content from churn intelligence |

---

## The Numbers

Verified against the current local ATLAS repo and dataset snapshot:

| Metric | Value |
|--------|-------|
| Raw reviews stored | 48,270 |
| Reviews enriched | 25,061 |
| Vendors with churn signals | 56 |
| Intelligence reports | 1,133 |
| Cross-vendor reasoning records | 170 |
| v2 reasoning syntheses | 323 |
| Review sources | 15 |
| Autonomous scheduled tasks | 81 |
| Database migrations | 227 |
| Skill documents | 68 |
| MCP servers | 8 |
| MCP tools exposed | 130+ |
| LangGraph workflows | 12 |
| Product dashboards | 4 |
| Prospects enriched | 1,335 |
| Campaign sequences | 7 |
| Evidence vault entries | 497 |

---

## What Atlas Does

### Sales Enablement

- Scrapes reviews from 15 sources including G2, Capterra, TrustRadius, Reddit, Gartner, HackerNews, Twitter/X, GitHub, YouTube, and Stack Overflow.
- Extracts 47 structured fields per review including churn intent, urgency, pain categories, buying stage, budget signals, and competitor mentions.
- Generates battle cards with discovery questions, landmine questions, objection handlers, talk tracks, and recommended plays.
- Tracks vendor-to-vendor displacement dynamics with evidence-backed competitive flows.
- Resolves account-level signals including buyer role, company identity, contract timing, and opportunity context.

### Marketing Automation

- Generates SEO content from real churn intelligence data, including vendor alternatives, migration guides, pricing reality checks, and vendor showdowns.
- Produces personalized campaigns with subject lines, body copy, CTA, and audit trail grounded in real review evidence.
- Uses prospect enrichment and account matching to connect market pain patterns to named targets and relevant content.

### Internal Operations

- Runs 81 autonomous scheduled tasks (and growing) for enrichment, campaign generation, churn intelligence, blog generation, email triage, briefings, monitoring, and anomaly detection.
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
Raw reviews (15 sources)
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

## Other Projects

### FineTuneLab.ai | 2025–Present

A self-hosted fine-tuning platform for training and deploying language models on local hardware.

- GPU-accelerated training with Unsloth, web-based monitoring, and experiment management
- Dataset management, template-based training setup, training history, logs, and artifacts
- Deployment paths for vLLM, Ollama, Docker, and native Linux
- Stack: TypeScript, Next.js, Python, FastAPI, Supabase, Neo4j

### Coding Assistant SDK | 2024–Present

A unified AI developer platform spanning CLI, API, web IDE, code generators, and backend services.

- 17-model routing with generators for MCP, FastAPI, Express, agents, tools, and SDK workflows
- Persistent memory, context injection, project analysis, and validation workflows
- Go code-analysis backend + FastAPI LLM service
- Stack: Python, Go, TypeScript, FastAPI, Next.js

### ATLAS Edge Node | 2025–Present

A multi-modal AI edge device running on Orange Pi 5 Plus with RK3588 NPU.

- Real-time vision pipeline: YOLO World object detection (94ms NPU inference), face recognition (RetinaFace + MobileFaceNet), gait recognition (YOLOv8-pose)
- Speech pipeline: SenseVoice STT (16x realtime), Matcha-TTS synthesis, Silero VAD, speaker identification
- Person tracking with IoU-based matching and multi-modal identity fusion (face + gait + speaker)
- Bidirectional WebSocket sync with ATLAS Brain server for voice-to-voice AI interaction
- Stack: Python, RKNN, sherpa-onnx, OpenCV, asyncio

---

## Tech Stack

**Backend**: Python, FastAPI, asyncpg, PostgreSQL, APScheduler  
**LLM**: Ollama, vLLM, Claude API, OpenRouter, Groq, Together  
**Memory**: Neo4j, PostgreSQL  
**Agent Framework**: LangGraph, MCP  
**Scraping**: 15 review sources with proxy rotation, rate limiting, and dedup  
**CRM and GTM**: Apollo API, HubSpot, Salesforce, Pipedrive event ingestion  
**Telephony**: Twilio, SignalWire  
**Frontends**: React, Vite, TypeScript  
**Edge AI**: RKNN NPU inference, sherpa-onnx, OpenCV, YOLO World, RetinaFace, MobileFaceNet  
**Infrastructure**: Docker Compose, Tailscale mesh, Vercel, NVIDIA GPU, Orange Pi 5 Plus  
**Tools Used to Build**: Claude Code, Cursor

---

## Additional Links

- **Public product domain**: [churnsignals.co](https://churnsignals.co)
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
