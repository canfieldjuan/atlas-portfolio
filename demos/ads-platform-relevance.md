# Atlas — ML Platform Engineering Work Sample

**Juan Canfield** | canfieldjuan24@gmail.com | github.com/canfieldjuan/atlas-portfolio

---

## What Atlas Is

Atlas is a 370K-line distributed AI platform I built solo. It ingests raw signals from 15 external sources, enriches them with tiered ML extraction, aggregates scored evidence pools, runs LLM reasoning synthesis, and generates downstream artifacts (reports, battle cards, campaigns, predictions) served through a React frontend and REST API.

The engineering problems are the same ones ads platforms solve: scoring and ranking at scale, real-time inference, batch processing orchestration, multi-provider model routing with cost optimization, and multi-tenant data isolation.

---

## Scoring, Ranking & Prediction

### Win/Loss Predictor

Predicts competitive displacement probability (0-1) with calibrated factor weighting:

- 6 weighted scoring factors: displacement momentum, pricing pressure, feature gap severity, churn intent density, buyer authority, support sentiment
- Calibration from outcome data via `score_calibration_weights` with lift-adjusted weighting (clamped non-negative)
- Data gates suppress predictions when coverage is insufficient — returns `null` instead of false signals
- Confidence tiers (high/medium/low) based on data completeness

**Ads parallel**: Same pattern as campaign effectiveness prediction, bid scoring, or conversion probability estimation.

### Multi-Pool Signal Aggregation

6 independent scoring pools built deterministically from 25K+ enriched records across 56 vendors:

| Pool | What It Scores | Output |
|---|---|---|
| Evidence | Review salience, specificity, quote quality | Ranked witness selection |
| Segment | Role distribution, buying stage, pain breakdown | Segment-level targeting |
| Temporal | Renewal windows, budget cycles, keyword spikes | Timing intelligence |
| Displacement | Vendor-to-vendor win/loss flows | Competitive dynamics |
| Category | Market consolidation, buyer center shifts | Category trends |
| Account | Named company signals, decision-maker identification | Account-level urgency (0-100 scale) |

**Ads parallel**: These pools are analogous to audience segments, behavioral signals, contextual targeting data, and inventory attributes that feed ad decisioning.

### Account-in-Motion Scoring (0-100)

Weighted composite score for prioritizing accounts:

```
Urgency:        6-30 points (mapped from 0-10 urgency scale)
Role authority:  0-20 points (executive > economic buyer > champion > evaluator)
Buying stage:    0-25 points (active purchase > evaluation > renewal > post-purchase)
Seat count:      0-15 points (enterprise > mid-market > SMB)
Alternatives:    0-10 points (active evaluation of competitors)
```

**Ads parallel**: Same scoring pattern as yield optimization, dynamic allocation, or impression value estimation.

---

## ML Model Deployment & Inference

### Multi-Provider Model Routing

Production model routing with automatic fallback:

```
Request arrives
  |
  +-- Check exact-match cache (namespace-isolated per pipeline stage)
  |     Hit? Return cached response (~0ms)
  |
  +-- Try primary provider (OpenRouter / vLLM / Anthropic Batch)
  |     Success? Cache response, return
  |
  +-- Fallback chain (configurable per workload):
        synthesis:  OpenRouter -> Anthropic reasoning -> Anthropic triage
        enrichment: OpenRouter -> Anthropic Batch (50% discount)
        prediction: OpenRouter -> cache only (no fallback)
```

- Exact-match LLM response caching with content-hash keys, reducing redundant calls 40-60%
- Anthropic Message Batch API integration for bulk inference with artifact reconciliation and deferred row handling
- Model A/B comparison tooling: validated Haiku 4.5 vs GPT-OSS-120B side-by-side (2x faster, better output, switched)
- Cost attribution per pipeline stage and per model provider

**Ads parallel**: Same infrastructure pattern as multi-bidder routing, SSP/DSP fallback chains, and cached creative decisioning.

### Edge Inference (Orange Pi 5 Plus + RK3588 NPU)

5 models deployed on a $90 ARM board with 3 NPU cores:

| Model | NPU Core | Latency | Task |
|---|---|---|---|
| YOLO World | Core 0 | 94ms | Object detection (motion-gated) |
| RetinaFace | Core 1 | 3ms | Face detection |
| MobileFaceNet | Core 2 | 3-5ms | Face recognition (512-dim embeddings) |
| YOLOv8n-pose | Core 1 (timeshared) | 40ms | Gait estimation (256-dim embeddings) |
| Phi-3-mini Q4 | CPU | 2.4s/token | Offline LLM fallback |

Concurrent multi-model scheduling with core pinning. All results streamed to brain server via bidirectional WebSocket.

---

## Real-Time Systems

### Voice Pipeline (<300ms end-to-end)

```
Microphone -> Silero VAD (voice activity detection)
  -> SenseVoice STT (streaming ASR, 16x realtime on CPU)
  -> WebSocket to brain server (<50ms)
  -> LLM inference
  -> Matcha-TTS synthesis
  -> Audio playback with barge-in handling
```

- Wake word detection with echo cancellation (reset model + drop 1 frame after TTS)
- Speaker identification via 192-dim embeddings with cosine similarity matching
- Sentence buffering with streaming partial results

### Vision Pipeline (94ms per frame)

```
Camera (1280x720 @15fps) -> RTSP via MediaMTX
  -> Motion detection (MOG2, 320x240, ~2ms CPU)
  -> [if motion] YOLO World on NPU (94ms)
  -> Multi-object tracking (IoU greedy matching)
  -> Face detection + recognition (3-5ms per face)
  -> Gait recognition (40ms, 256-dim embedding)
  -> Identity fusion (0.6*face + 0.4*gait similarity)
  -> Security events via WebSocket to brain
```

Motion gating skips expensive NPU inference when the scene is static — saves power and compute on the edge device.

### Bidirectional WebSocket Architecture

```
Edge Node                          Brain Server
  send_loop  -----> [WS] ----->  handler dispatch
  recv_loop  <----- [WS] <-----  response + TTS queue
```

- asyncio.wait(FIRST_COMPLETED) pattern for concurrent send/receive
- Handler registration: vision_ack, health_ack, identity_sync, response, error
- Automatic reconnection with exponential backoff
- Non-blocking TTS: async queue + dedicated worker

---

## Batch Processing & Pipeline Orchestration

### 5-Layer Reasoning Pipeline

```
Layer 0: Raw Ingestion         15 sources, all vendors (global)
Layer 1: Tiered LLM Enrichment 47 fields per review (global)
Layer 2: Signal Aggregation    6 deterministic pools (global)
Layer 3: Reasoning Synthesis   LLM expert reasoning (scoped to competitive sets)
Layer 4: Downstream Artifacts  Battle cards, reports, briefs (follows scope)
```

- Layer 3 scoping reduces LLM spend 70-90% by targeting competitive sets instead of full vendor universe
- Evidence hash caching: synthesis only re-runs when upstream pool data changes
- Circuit breaker: stops repair loops after 3 consecutive rounds with zero promotions or >50% failure rate

### Autonomous Task Scheduler

APScheduler + PostgreSQL with 36 active scheduled tasks:

- Configurable intervals and cron schedules (staggered to prevent API contention)
- Orphan recovery with time-guarded claiming (30-minute threshold, configurable)
- Anthropic Batch API integration with artifact reconciliation for completed/pending/failed items
- Per-task metadata overrides for batch size, concurrency, model selection, and scope strategy

---

## Cross-Source Identity Resolution

### Review Deduplication

Same reviewer, same review, different sources — detected and linked:

| Method | Threshold | Match Type |
|---|---|---|
| Content hash | Exact | Identical review text across sources |
| Identity key | vendor + reviewer + date + rating | Same person, same day, same score |
| Fuzzy match | 0.82-0.90 similarity | Reviewer stem + date tolerance + rating tolerance |

Canonical review selection: enriched > no_signal > quarantined, then source weight, then import order.

**Ads parallel**: Same pattern as identity resolution across devices, cross-platform user matching, and audience deduplication.

---

## Scale Numbers

| Metric | Value |
|---|---|
| Total codebase | 370K lines (Python + TypeScript + React) |
| Reviews ingested | 48,270 |
| Reviews enriched (47 fields each) | 25,061 |
| Vendors tracked | 56 |
| Intelligence reports generated | 1,133 |
| Evidence vault entries | 497 |
| Witness records | 3,271 |
| Database migrations | 280+ |
| Scheduled tasks | 36 active |
| MCP servers | 11 |
| LLM skill prompts | 68 |
| Product dashboards | 8 pages |
| NPU models deployed | 5 concurrent |

---

## Links

- **Portfolio**: github.com/canfieldjuan/atlas-portfolio
- **Product**: churnsignals.co
- **Architecture diagram**: atlas-portfolio/architecture/system-overview.md
- **Pipeline walkthrough**: atlas-portfolio/pipeline-walkthrough/WALKTHROUGH.md
