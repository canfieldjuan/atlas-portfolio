# Atlas

A solo-built AI platform that automates B2B sales intelligence, marketing content generation, and internal operations. Atlas scrapes 16 review sources, enriches reviews with LLMs, detects vendor churn signals, generates personalized sales campaigns, writes SEO blog content, and runs 57 autonomous tasks on schedule — all orchestrated through 8 MCP servers exposing 130+ tools.

**Source code**: [github.com/canfieldjuan/ATLAS](https://github.com/canfieldjuan/ATLAS)

---

## How This Maps to the Role

Everything below was designed, built, and deployed by me as a single developer. Atlas runs on a local GPU server (RTX 3090) with edge nodes for distributed processing.

### Marketing Automation

- **Blog content pipeline** — Auto-generates 10 types of SEO articles (vendor alternatives, migration guides, pricing reality checks, vendor showdowns, switching stories) from real churn intelligence data. Role-aware topic boosting: CFO readers get pricing content, CTOs get migration guides.
- **Campaign generation** — Scrapes and enriches reviews, scores opportunities, then generates personalized cold emails, follow-ups, and LinkedIn messages per prospect. Each campaign includes subject line, body, CTA, and audit trail.
- **Prospect enrichment** — Apollo API integration for firmographic backfill (headcount, revenue, funding, departments). Automated prospect matching and email validation.
- **Content from data** — Every piece of content is grounded in real evidence: customer quotes, pain category distributions, displacement metrics. No generic filler.

### Sales Enablement & Lead Qualification

- **Churn signal detection** — Ingests reviews from 16 sources (G2, Capterra, TrustRadius, Reddit, Gartner, HackerNews, Twitter/X, etc.). LLM extracts 47 structured fields per review including churn intent, urgency score, buying stage, budget signals, and competitor mentions.
- **Opportunity scoring** — Composite score from role weight + buying stage + urgency + seat count + pain categories. Calibrated from real CRM outcomes (deal won/lost/meeting booked) via closed-loop feedback.
- **Battle cards** — Competitive positioning documents with discovery questions, landmine questions, objection handlers (acknowledge/pivot/proof point), talk tracks, and recommended plays per target segment.
- **Displacement graph** — Tracks vendor-to-vendor competitive flows (e.g., Salesforce -> HubSpot) with mention counts, signal strength, switch drivers, and velocity tracking.
- **Account resolution** — Matches reviews to canonical company identities. Builds witness packets with decision-maker counts, contract end dates, seat counts, and buying stage.

### Internal Ops & Workflow Automation

- **57 autonomous tasks** — APScheduler-managed jobs: review enrichment (every 5 min), campaign generation (daily), churn intelligence (weekly), blog generation, vendor briefings, email triage, morning briefings, device health checks, anomaly detection, and more.
- **12 LangGraph workflows** — Stateful multi-turn conversations for email composition, appointment booking, calendar queries, call handling, security monitoring, presence-based automation. Each can interrupt, resume, and persist state to PostgreSQL.
- **8 MCP servers (130+ tools)** — Model Context Protocol servers for CRM (10 tools), Email (8), Twilio telephony (10), Calendar (8), Invoicing (15), Intelligence (17), B2B Churn (61), and Memory (13). Compatible with Claude Desktop, Cursor, and custom agents.
- **Multi-model LLM routing** — 6 backends (Ollama, vLLM, Claude, OpenRouter, Groq, Together). Automatic routing by workload type: local models for enrichment, cloud for reasoning synthesis, Haiku for triage classification.
- **Cost monitoring dashboard** — Real-time LLM token usage, per-model costs, provider breakdown, daily trends, error rates. Auto-refreshes every 60 seconds.

### Research & Knowledge Systems

- **Evidence pools** — Deterministic intermediate representations (Evidence Vault, Segment Intelligence, Temporal Intelligence, Account Intelligence, Displacement Dynamics, Category Dynamics). Computed once, consumed by all downstream artifacts. Schema-versioned for evolution.
- **Reasoning synthesis** — Claude-powered compression of evidence pools into structured reasoning contracts (vendor core, displacement, category, account reasoning). Schema-validated with citation tracing back to source reviews.
- **GraphRAG memory** — Neo4j knowledge graph + PostgreSQL conversation history. Semantic search, entity traversal, shortest path analysis, temporal filtering, query decomposition with reranking.
- **68 skill documents** — Injectable domain-specific markdown prompts that enrich LLM system messages at runtime. Organized by domain: email (7), B2B (1), call handling (4), invoicing (3), intelligence (6), digest/analysis (46).

### Content & Research Pipelines

The core pipeline transforms raw unstructured reviews into actionable business intelligence:

```
Raw reviews (16 sources)
  -> LLM enrichment (47 structured fields per review)
  -> Churn signal aggregation (per-vendor metrics + archetype classification)
  -> Evidence pools (canonical intermediate representations)
  -> Reasoning synthesis (Claude-generated contracts with citations)
  -> Output artifacts:
       - Personalized sales campaigns
       - SEO blog posts with chart specs
       - Competitive battle cards
       - Vendor briefing emails
       - Intelligence reports (PDF export)
       - Product profile knowledge cards
```

See [`pipeline-walkthrough/WALKTHROUGH.md`](pipeline-walkthrough/WALKTHROUGH.md) for a step-by-step example with real data.

### AI Agent Orchestration

- **Voice assistant** — Wake word detection -> streaming STT (Nemotron 0.6B) -> semantic intent routing (sentence-transformers) -> LLM reasoning with tool access -> TTS response (Piper). Runs on brain server or edge node.
- **Edge node** — Orange Pi RK3588 running YOLO-World (object detection), RetinaFace (face recognition), MobileFaceNet (face embedding), SenseVoice (local STT), Piper (local TTS). Connected to brain via Tailscale mesh network.
- **Telephony** — Twilio/SignalWire integration: inbound/outbound calls, call transcription, receptionist routing, business-hours logic, multi-context phone numbers, SMS auto-reply via LLM.
- **Home automation** — Home Assistant WebSocket integration for real-time device state. Natural language device control ("turn off the TV", "dim the bedroom lights to 30%"). Presence-based automation.

---

## The Numbers

| Metric | Value |
|--------|-------|
| Reviews enriched | 38,881 |
| Intelligence reports generated | 2,113 |
| Cross-vendor competitive analyses | 1,732 |
| Reasoning synthesis contracts | 481 |
| Displacement edges tracked | 500+ |
| Review sources | 16 |
| Autonomous scheduled tasks | 57 |
| MCP tools | 130+ |
| LangGraph workflows | 12 |
| Database migrations | 248 |
| Skill documents | 68 |
| API endpoints | 55+ |

---

## Tech Stack

**Backend**: Python, FastAPI, asyncpg, PostgreSQL (50+ tables), APScheduler
**LLM**: Ollama (qwen3:14b), vLLM, Claude API, OpenRouter, Groq, Together
**ASR/TTS**: NVIDIA Nemotron 0.6B, SenseVoice, Piper, Kokoro
**Memory**: Neo4j (GraphRAG with Graphiti), PostgreSQL (conversations)
**Agent Framework**: LangGraph (stateful workflows), MCP (Model Context Protocol)
**Scraping**: 16 sources with proxy rotation, rate limiting, dedup
**CRM**: Apollo API, HubSpot/Salesforce/Pipedrive event ingestion
**Telephony**: Twilio, SignalWire
**Home Automation**: Home Assistant (WebSocket)
**Edge**: Orange Pi RK3588 (YOLO, RetinaFace, MobileFaceNet)
**Frontends**: React, Next.js (4 dashboards)
**Infrastructure**: Docker Compose, Tailscale mesh, NVIDIA GPU (RTX 3090)
**Tools Used to Build**: Claude Code, Cursor

---

## Screenshots

> Screenshots are in the [`screenshots/`](screenshots/) directory. See [`screenshots/CAPTURE_GUIDE.md`](screenshots/CAPTURE_GUIDE.md) for what each shows.

*Coming soon — will include: churn dashboard, vendor detail pages, enriched review views, campaign review, blog content management, cost monitoring, and voice interface.*

---

## Pipeline Demo (Live Recording)

[![Pipeline Demo](https://asciinema.org/a/PjhDP7w45UoEkvqH.svg)](https://asciinema.org/a/PjhDP7w45UoEkvqH)

Watch the full pipeline in action: system status, scrape execution (24 targets, 950 reviews found), LLM enrichment before/after, and downstream output counts. Or replay locally: `asciinema play recordings/pipeline-demo.cast`

---

## Pipeline Walkthrough

See [`pipeline-walkthrough/WALKTHROUGH.md`](pipeline-walkthrough/WALKTHROUGH.md) for a narrated example showing how a single raw G2 review gets transformed through every stage of the pipeline into a personalized sales campaign and competitive battle card.

---

## Links

- **Full source code**: [github.com/canfieldjuan/ATLAS](https://github.com/canfieldjuan/ATLAS)
- **Pipeline walkthrough**: [pipeline-walkthrough/WALKTHROUGH.md](pipeline-walkthrough/WALKTHROUGH.md)
- **Pipeline demo**: [asciinema.org/a/PjhDP7w45UoEkvqH](https://asciinema.org/a/PjhDP7w45UoEkvqH)
