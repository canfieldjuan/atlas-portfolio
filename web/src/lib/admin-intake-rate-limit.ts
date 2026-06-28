type AdminIntakeLoginAttemptEntry = {
  failedCount: number;
  resetAt: number;
};

type AdminIntakeLoginRateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export const ADMIN_INTAKE_LOGIN_RATE_LIMIT = {
  failureLimit: 5,
  windowMs: 15 * 60 * 1000,
};

const MAX_ACTIVE_ADMIN_LOGIN_BUCKETS = 1000;

declare global {
  // No-cost, per-process lockout for the private admin intake login.
  // Serverless can run many instances; a distributed store is a separate infrastructure decision.
  var __atlasAdminIntakeLoginRateLimitStore: Map<string, AdminIntakeLoginAttemptEntry> | undefined;
}

function store() {
  globalThis.__atlasAdminIntakeLoginRateLimitStore ??= new Map<string, AdminIntakeLoginAttemptEntry>();
  return globalThis.__atlasAdminIntakeLoginRateLimitStore;
}

function clientIdentifier(headers: Headers) {
  const candidate =
    headers.get('x-real-ip')?.trim() ||
    headers.get('cf-connecting-ip')?.trim() ||
    'unknown';
  return candidate.slice(0, 128);
}

function pruneExpired(limitStore: Map<string, AdminIntakeLoginAttemptEntry>, now: number) {
  if (limitStore.size < MAX_ACTIVE_ADMIN_LOGIN_BUCKETS) return;
  for (const [key, entry] of limitStore) {
    if (entry.resetAt <= now) limitStore.delete(key);
  }
}

function ensureStoreCapacity(limitStore: Map<string, AdminIntakeLoginAttemptEntry>) {
  if (limitStore.size < MAX_ACTIVE_ADMIN_LOGIN_BUCKETS) return;
  const oldestKey = limitStore.keys().next().value;
  if (oldestKey) limitStore.delete(oldestKey);
}

function retryAfterSeconds(resetAt: number, now: number) {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

export function checkAdminIntakeLoginRateLimit(headers: Headers): AdminIntakeLoginRateLimitResult {
  const now = Date.now();
  const limitStore = store();
  pruneExpired(limitStore, now);

  const current = limitStore.get(clientIdentifier(headers));
  if (!current || current.resetAt <= now || current.failedCount < ADMIN_INTAKE_LOGIN_RATE_LIMIT.failureLimit) {
    return { ok: true };
  }

  return { ok: false, retryAfterSeconds: retryAfterSeconds(current.resetAt, now) };
}

export function recordAdminIntakeLoginFailure(headers: Headers) {
  const now = Date.now();
  const limitStore = store();
  pruneExpired(limitStore, now);

  const key = clientIdentifier(headers);
  const current = limitStore.get(key);
  if (!current || current.resetAt <= now) {
    ensureStoreCapacity(limitStore);
    limitStore.set(key, { failedCount: 1, resetAt: now + ADMIN_INTAKE_LOGIN_RATE_LIMIT.windowMs });
    return;
  }

  current.failedCount += 1;
}

export function clearAdminIntakeLoginFailures(headers: Headers) {
  store().delete(clientIdentifier(headers));
}
