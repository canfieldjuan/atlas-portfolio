type DeflectionRateLimitConfig = {
  scope: string;
  limit: number;
  windowMs: number;
};

type DeflectionRateLimitEntry = {
  count: number;
  resetAt: number;
};

type DeflectionRateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

const MAX_ACTIVE_RATE_LIMIT_BUCKETS = 1000;

declare global {
  // Best-effort, per-process throttle for public paid-flow endpoints.
  // Serverless can run many instances, so edge/KV rate limiting remains stronger.
  var __atlasDeflectionRateLimitStore: Map<string, DeflectionRateLimitEntry> | undefined;
}

function store() {
  globalThis.__atlasDeflectionRateLimitStore ??= new Map<string, DeflectionRateLimitEntry>();
  return globalThis.__atlasDeflectionRateLimitStore;
}

function clientIdentifier(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const candidate =
    forwardedFor ||
    headers.get('x-real-ip')?.trim() ||
    headers.get('cf-connecting-ip')?.trim() ||
    'unknown';
  return candidate.slice(0, 128);
}

function pruneExpired(limitStore: Map<string, DeflectionRateLimitEntry>, now: number) {
  if (limitStore.size < MAX_ACTIVE_RATE_LIMIT_BUCKETS) return;
  for (const [key, entry] of limitStore) {
    if (entry.resetAt <= now) limitStore.delete(key);
  }
}

function nextRetryAfterSeconds(limitStore: Map<string, DeflectionRateLimitEntry>, now: number) {
  let resetAt = Number.POSITIVE_INFINITY;
  for (const entry of limitStore.values()) {
    resetAt = Math.min(resetAt, entry.resetAt);
  }
  if (!Number.isFinite(resetAt)) return 1;
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

export function consumeDeflectionRateLimit(
  headers: Headers,
  requestId: string,
  config: DeflectionRateLimitConfig,
): DeflectionRateLimitResult {
  const now = Date.now();
  const limitStore = store();
  pruneExpired(limitStore, now);

  const key = `${config.scope}:${clientIdentifier(headers)}:${requestId}`;
  const current = limitStore.get(key);
  if (!current || current.resetAt <= now) {
    if (limitStore.size >= MAX_ACTIVE_RATE_LIMIT_BUCKETS) {
      return { ok: false, retryAfterSeconds: nextRetryAfterSeconds(limitStore, now) };
    }
    limitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { ok: true };
  }

  if (current.count >= config.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { ok: true };
}
