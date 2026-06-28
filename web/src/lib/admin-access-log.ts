import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { structuredRuntimeError } from '@/lib/structured-runtime-log';

type AdminAccessSql = NeonQueryFunction<false, false>;

export type AdminAccessAction = 'admin_intake_view' | 'gap_report_csv_download';

export type AdminAccessEventInput = {
  action: AdminAccessAction;
  targetType: string;
  targetRequestId?: string | null;
  headers: Headers;
  metadata?: Record<string, unknown>;
};

export type AdminAccessEventResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'error' };

const ACTOR_ID = 'shared-admin-token';
const ACTOR_KIND = 'shared_admin_token';
const MAX_METADATA_KEYS = 20;
const MAX_METADATA_STRING_LENGTH = 240;

function adminAccessLogDatabaseUrl() {
  return (
    process.env.ADMIN_ACCESS_LOG_DATABASE_URL?.trim() ||
    process.env.AUDIT_INTAKE_DATABASE_URL?.trim() ||
    process.env.GAP_REPORT_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    ''
  );
}

const neonClientGlobalKey = Symbol.for('atlas-portfolio.admin-access-log.neon-clients');
type NeonClientCache = Map<string, unknown>;
const globalScope = globalThis as unknown as { [neonClientGlobalKey]?: NeonClientCache };
function neonClientCache(): NeonClientCache {
  if (!globalScope[neonClientGlobalKey]) {
    globalScope[neonClientGlobalKey] = new Map();
  }
  return globalScope[neonClientGlobalKey];
}

function getAdminAccessSql(): AdminAccessSql | null {
  const databaseUrl = adminAccessLogDatabaseUrl();
  if (!databaseUrl) return null;

  const cache = neonClientCache();
  const cached = cache.get(databaseUrl);
  if (cached) return cached as AdminAccessSql;

  const client: AdminAccessSql = neon(databaseUrl);
  cache.set(databaseUrl, client);
  return client;
}

function requestIp(headers: Headers) {
  return (
    headers.get('x-real-ip')?.trim() ||
    headers.get('cf-connecting-ip')?.trim() ||
    'unknown'
  ).slice(0, 120);
}

function requestUserAgent(headers: Headers) {
  return headers.get('user-agent')?.trim().slice(0, 500) || null;
}

function safeMetadataValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return typeof value === 'string' ? value.slice(0, MAX_METADATA_STRING_LENGTH) : value;
  }
  return undefined;
}

function safeMetadata(metadata: Record<string, unknown> | undefined) {
  const safe: Record<string, unknown> = {};
  let count = 0;
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (count >= MAX_METADATA_KEYS) break;
    if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(key)) continue;
    const safeValue = safeMetadataValue(value);
    if (safeValue === undefined) continue;
    safe[key] = safeValue;
    count += 1;
  }
  return safe;
}

export function adminAccessLogConfigured() {
  return adminAccessLogDatabaseUrl().length > 0;
}

export async function recordAdminAccessEvent(
  input: AdminAccessEventInput,
): Promise<AdminAccessEventResult> {
  const sql = getAdminAccessSql();
  if (!sql) return { ok: false, reason: 'not_configured' };

  try {
    await sql.query(
      `
        INSERT INTO portfolio_admin_access_events (
          actor_id,
          actor_kind,
          action,
          target_type,
          target_request_id,
          ip_address,
          user_agent,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5::uuid, $6, $7, $8::jsonb)
      `,
      [
        ACTOR_ID,
        ACTOR_KIND,
        input.action,
        input.targetType,
        input.targetRequestId || null,
        requestIp(input.headers),
        requestUserAgent(input.headers),
        JSON.stringify(safeMetadata(input.metadata)),
      ],
    );
    return { ok: true };
  } catch (error) {
    structuredRuntimeError('admin.access_log.write_failed', {
      action: input.action,
      targetType: input.targetType,
      error,
    });
    return { ok: false, reason: 'error' };
  }
}
