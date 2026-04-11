# Atlas — Distributed Systems Engineering Work Sample

**Juan Canfield** | canfieldjuan24@gmail.com | github.com/canfieldjuan/atlas-portfolio

---

## What Atlas Is

Atlas is a 370K-line distributed platform I built solo. It spans a cloud brain server, a React frontend, and an ARM edge node with 5 concurrent ML models — connected via encrypted mesh networking with bidirectional WebSocket streaming. The engineering problems are connection lifecycle management, protocol design, fault tolerance, multi-tenant API security, and keeping real-time pipelines running reliably across unreliable networks and hardware.

---

## Connection Engineering & Protocol Work

### Bidirectional WebSocket Architecture

The edge node and brain server communicate over a persistent WebSocket connection carrying vision events, voice transcripts, identity sync, health checks, and TTS audio — all multiplexed on a single connection.

```
Edge Node                              Brain Server
  send_loop  -------> [WS] ------->  handler dispatch
       |                                    |
       |    asyncio.wait(FIRST_COMPLETED)   |
       |                                    |
  recv_loop  <------- [WS] <-------  response queue
                                          |
                                     TTS worker (async, non-blocking)
```

**Design decisions:**

- `asyncio.wait(FIRST_COMPLETED)` over `asyncio.gather` — either direction can progress independently without blocking the other. A slow TTS response doesn't stall outbound vision events.
- Handler dispatch by message type: registered callbacks for `vision`, `transcript`, `health_ack`, `identity_sync`, `identity_update`, `identity_delete`, `response`, `error`. New message types added without touching the transport layer.
- Dedicated TTS worker on a separate async queue — LLM responses are queued for speech synthesis without blocking the receive loop.

### Connection Churn — Diagnosed and Fixed

**Problem:** WebSocket connections dropped every 190 seconds.

**Root cause:** The brain server sent `vision_ack` messages for every vision event. The original edge client was send-only — it never read from the socket. Unread acks accumulated in the receive buffer until the server-side write buffer filled, triggering a connection reset.

**Fix:** Redesigned the client from send-only to full-duplex with the send_loop + recv_loop architecture above. The recv_loop drains all server messages including acks, preventing buffer accumulation.

**Prevention:** Added heartbeat ping/pong monitoring. If the recv_loop detects no messages for the configured timeout, it triggers reconnection rather than waiting for a TCP-level timeout.

### RTSP Streaming Pipeline

Camera video flows through a multi-protocol chain:

```
USB Camera (/dev/video0)
  -> FFmpeg capture (1280x720 @15fps, libx264 ultrafast, ~1500kbps)
  -> RTSP publish to MediaMTX (Docker, host networking)
  -> Consumers:
       RTSP :8554 (vision pipeline reads frames)
       WebRTC :8889 (browser preview)
       HLS :8888 (recording)
  -> Recording: fMP4 segments, 5-minute chunks, 7-day retention
```

MediaMTX handles multi-consumer fan-out — the vision pipeline and the recording system both read from the same RTSP source without duplicating the capture or encoding.

---

## API Security

### JWT Authentication Layer

Three token extraction methods for different client types:

```
1. Authorization: Bearer <token>    (API clients, frontend)
2. HTTP-only cookie                 (browser sessions)
3. ?token=<jwt> query param         (file downloads, CSV export)
```

Validation: signature verification, expiration check, account_id extraction, plan-gated feature access. Admin bypass for operator endpoints.

### Multi-Tenant Data Isolation

Every query touching tenant data passes through a scoping predicate:

```python
def _vendor_scope_sql(param_idx, user):
    if is_admin(user):
        return "TRUE"  # No filtering
    return f"vendor_name IN (SELECT vendor_name FROM tracked_vendors
                             WHERE account_id = ${param_idx})"
```

Applied to all 48K lines of API endpoints. FK-enforced cascade deletion — deleting a tenant removes all watchlist views, alert events, email logs, and predictions. No orphaned data.

### Idempotent Delivery with Durable Claim Locks

Scheduled email deliveries use a PostgreSQL unique partial index as a distributed lock:

```sql
CREATE UNIQUE INDEX ON b2b_watchlist_alert_email_log
    (watchlist_view_id, scheduled_for, delivery_mode)
    WHERE scheduled_for IS NOT NULL;
```

The INSERT claims the delivery slot. Concurrent workers get a unique constraint violation and back off. Stale claims (processing > 15 minutes, configurable) are reclaimed. No duplicate emails, no lost deliveries.

---

## Resilience Engineering

### Circuit Breakers

Batch processing loops have two circuit breaker mechanisms:

```
Breaker 1: Failure rate
  if round_failed > round_total * failure_rate_threshold:  # default 0.5
      break

Breaker 2: No-progress detection
  if consecutive_no_progress >= no_progress_max_rounds:    # default 3
      break
```

All thresholds are configurable via settings, not hardcoded. The circuit breaker reason is emitted in telemetry and recorded in the execution log for post-mortem analysis.

**Edge case handled:** All-deferred rounds (pending batch items from a third-party API) have `round_total = 0`. The no-progress check requires `round_total > 0` to avoid false-tripping on rounds where work was queued but not yet complete.

### Graceful Degradation on Hardware Failure

When the GPU disconnected (broken PCIe retention clip), the system detected the failure through the model routing layer:

```
Request arrives for local inference (vLLM)
  -> vLLM activation fails (GPU not found)
  -> Fallback: Anthropic Batch API (50% cost discount)
  -> Service continues without manual intervention
  -> Cost attribution logs the provider switch
```

The system ran for days on the fallback path before the elevated API costs were noticed — the degradation was invisible to end users.

### Orphan Recovery

When a worker claims a row for processing and crashes, the row stays in `processing` state forever. Recovery:

```sql
UPDATE b2b_reviews
SET repair_status = CASE
    WHEN attempts + 1 >= max_attempts THEN 'failed'
    ELSE NULL  -- available for retry
END
WHERE repair_status = 'repairing'
  AND (
    repaired_at IS NULL                              -- legacy rows
    OR repaired_at < NOW() - INTERVAL '30 minutes'   -- stale claims
  )
```

The `IS NULL` branch catches pre-existing orphans from before the timestamp was added. The time guard prevents recovering rows that another worker is actively processing.

---

## Real-Time Systems

### Voice Pipeline (<300ms end-to-end)

```
Microphone
  -> Silero VAD (frame-level voice activity detection)
  -> SenseVoice STT (streaming, 16x realtime on ARM CPU)
  -> WebSocket to brain (<50ms transport)
  -> LLM inference
  -> Matcha-TTS synthesis (22kHz -> 24kHz resample for codec compatibility)
  -> Audio playback
```

**Barge-in handling:** When the user speaks during TTS playback, the audio output is interrupted, the TTS queue is flushed, and the new utterance is processed immediately.

**Wake word echo fix:** After TTS stops, the wake word model hears its own output reflected through the room. Fix: reset the wake word model state and drop 1 audio frame after TTS completes.

**Speaker identification:** 192-dimensional embeddings extracted per utterance, matched against a registered speaker database via cosine similarity. Enables per-speaker personalization without cloud dependency.

### Vision Pipeline (94ms inference, motion-gated)

```
Camera (15fps RTSP)
  -> Motion detection (MOG2 background subtractor, 320x240, ~2ms CPU)
  -> [if motion detected]:
       YOLO World on NPU Core 0 (94ms, 640x640 letterboxed)
       -> Multi-object tracking (IoU greedy matching)
       -> Per-track face detection on NPU Core 1 (3ms per face)
       -> Per-track face recognition on NPU Core 2 (3-5ms, 512-dim)
       -> Per-track gait recognition on NPU Core 1 (40ms, 256-dim, timeshared)
       -> Identity fusion: combined_sim = 0.6 * face + 0.4 * gait
       -> Security events streamed to brain via WebSocket
  -> [if no motion]: skip all NPU inference (power savings)
```

5 models running concurrently on 3 NPU cores with explicit core pinning to prevent inference contention.

---

## Edge-to-Cloud Identity Sync

Biometric embeddings (face, gait, speaker) are registered on the edge node and synced to the brain server for cross-device recognition:

```
Edge registers face  ->  .npy saved locally
  -> File watcher detects new embedding (10s poll)
  -> WebSocket: identity_register message to brain
  -> Brain: PostgreSQL upsert with dimension validation
       face: 512-dim, gait: 256-dim, speaker: 192-dim
  -> Brain: broadcast identity_update to all connected edges
  -> Other edges: receive and save .npy locally

Periodic re-sync every 5 minutes as safety net.
Deletions are push-only via REST API (prevents empty-brain wiping edge data).
```

---

## Scale Numbers

| Metric | Value |
|---|---|
| Total codebase | 370K lines (Python + TypeScript + React) |
| Brain server | 286K lines, 48K lines of API endpoints |
| Concurrent NPU models | 5 (3 NPU cores, core-pinned) |
| Voice pipeline latency | <300ms end-to-end |
| Face detection latency | 3ms (NPU) |
| WebSocket transport | <50ms |
| Scheduled tasks | 36 active, staggered cron |
| Database migrations | 280+ |
| API security | JWT + tenant scoping across all endpoints |
| Uptime through hardware failure | Days (automatic provider failover) |

---

## Links

- **Portfolio**: github.com/canfieldjuan/atlas-portfolio
- **Product**: churnsignals.co
- **Architecture**: atlas-portfolio/architecture/system-overview.md
