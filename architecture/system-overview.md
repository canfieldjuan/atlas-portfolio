# Atlas System Architecture

This diagram is a high-level system view, not a strict inventory snapshot. Exact counts change as workflows, tasks, and product surfaces evolve.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          ATLAS BRAIN                                  │
│                    (FastAPI service layer)                           │
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
│  │                     LangGraph Workflows                       │    │
│  │  Voice · Email · Calendar · Booking · Reminder · Call         │    │
│  │  Security · Presence · Receptionist · Home · Streaming        │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                  Autonomous Tasks (APScheduler)               │    │
│  │  Enrichment · Campaigns · Briefings · Intelligence · Alerts   │    │
│  │  Memory Sync · Pattern Learning · Anomaly Detection           │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                        MCP Servers                            │    │
│  │  CRM · Email · Twilio · Calendar · Invoicing                 │    │
│  │  Intelligence · B2B Churn · Memory                            │    │
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
│  Edge Node   │   │  Telephony   │   │     Product UIs       │
│  Orange Pi   │   │  Twilio      │   │  Main · Intel · Churn │
│  RK3588      │   │  SignalWire  │   │  Admin Ops            │
│  YOLO·Piper  │   │  Call/SMS    │   │  React + Next.js      │
└──────────────┘   └──────────────┘   └──────────────────────┘
```

## Data Flow: Review to Evidence-Backed Artifacts

```
19 Review Sources ──► Scraping ──► Raw Reviews (PostgreSQL)
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
              Synthesis        (competitive intel)    (targeted
                                                        outreach)
                    │                   │                   │
                    ▼                   ▼                   ▼
              Blog Posts          Intelligence         Vendor
          (multiple formats)        Reports            Briefings
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
