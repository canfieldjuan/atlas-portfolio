# Atlas System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          ATLAS BRAIN                                  │
│                   (FastAPI + 55+ API routes)                         │
│                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │
│  │  LLM Pool  │  │    STT     │  │    TTS     │  │   Intent     │   │
│  │ Ollama     │  │ Nemotron   │  │ Piper      │  │   Router     │   │
│  │ vLLM       │  │ SenseVoice │  │ Kokoro     │  │ (Embeddings) │   │
│  │ Claude     │  └────────────┘  └────────────┘  └──────────────┘   │
│  │ OpenRouter │                                                       │
│  └────────────┘                                                       │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    12 LangGraph Workflows                     │    │
│  │  Voice · Email · Calendar · Booking · Reminder · Call         │    │
│  │  Security · Presence · Receptionist · Home · Streaming        │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                  57 Autonomous Tasks (APScheduler)            │    │
│  │  Enrichment · Campaigns · Briefings · Intelligence · Alerts   │    │
│  │  Memory Sync · Pattern Learning · Anomaly Detection           │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                  8 MCP Servers (130+ tools)                   │    │
│  │  CRM · Email · Twilio · Calendar · Invoicing                 │    │
│  │  Intelligence · B2B Churn (61 tools) · Memory                 │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐       │
│  │  PostgreSQL    │  │  Neo4j         │  │  68 Skill Docs   │       │
│  │  (50+ tables)  │  │  (GraphRAG)    │  │  (LLM Prompts)   │       │
│  └────────────────┘  └────────────────┘  └──────────────────┘       │
└──────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐
│  Edge Node   │   │  Telephony   │   │    4 Web Dashboards   │
│  Orange Pi   │   │  Twilio      │   │  Main · Intel · Churn │
│  RK3588      │   │  SignalWire  │   │  Admin Ops            │
│  YOLO·Piper  │   │  Call/SMS    │   │  React + Next.js      │
└──────────────┘   └──────────────┘   └──────────────────────┘
```

## Data Flow: Review to Revenue

```
16 Review Sources ──► Scraping ──► Raw Reviews (PostgreSQL)
                                        │
                                        ▼
                                  LLM Enrichment
                              (47 fields per review)
                                        │
                                        ▼
                              Churn Signal Aggregation
                              (per-vendor metrics)
                                        │
                                        ▼
                               Evidence Pools
                     (6 canonical intermediate representations)
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              Reasoning           Battle Cards         Campaigns
              Synthesis        (competitive intel)    (personalized
           (Claude-powered)                           cold outreach)
                    │                   │                   │
                    ▼                   ▼                   ▼
              Blog Posts          Intelligence         Vendor
           (10 topic types)        Reports            Briefings
                                  (PDF export)      (email delivery)
```

## LLM Routing

```
Query arrives
    │
    ├─ Enrichment workload ──► vLLM (local, fast, deterministic)
    │
    ├─ Triage/classification ──► Claude Haiku (cheap, fast)
    │
    ├─ Email drafting ──► Claude Sonnet (quality writing)
    │
    ├─ Reasoning synthesis ──► Claude Opus / OpenRouter (deep analysis)
    │
    ├─ Conversation ──► Ollama qwen3:14b (local, private)
    │
    └─ Tool calling ──► Ollama qwen3:14b + tool registry
```
