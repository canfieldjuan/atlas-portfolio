import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

type DeflectionReviewDecisionSql = NeonQueryFunction<false, false>;

export const DEFLECTION_REVIEW_DECISIONS = [
  'keep_suppressed',
  'promote_to_review',
] as const;

export type DeflectionReviewDecision = (typeof DEFLECTION_REVIEW_DECISIONS)[number];

export type DeflectionReviewDecisionRecord = {
  requestId: string;
  reviewKey: string;
  decision: DeflectionReviewDecision;
  updatedAt: string;
};

export type DeflectionReviewDecisionInput = {
  requestId: string;
  reviewKey: string;
  decision: DeflectionReviewDecision;
};

function deflectionReviewDecisionDatabaseUrl() {
  return (
    process.env.DEFLECTION_REVIEW_DECISIONS_DATABASE_URL?.trim() ||
    process.env.GAP_REPORT_DATABASE_URL?.trim() ||
    process.env.AUDIT_INTAKE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    ''
  );
}

const neonClientGlobalKey = Symbol.for('atlas-portfolio.deflection-review-decisions.neon-clients');
type NeonClientCache = Map<string, unknown>;
const globalScope = globalThis as unknown as { [neonClientGlobalKey]?: NeonClientCache };

function neonClientCache(): NeonClientCache {
  if (!globalScope[neonClientGlobalKey]) {
    globalScope[neonClientGlobalKey] = new Map();
  }
  return globalScope[neonClientGlobalKey];
}

function getDeflectionReviewDecisionSql(): DeflectionReviewDecisionSql | null {
  const databaseUrl = deflectionReviewDecisionDatabaseUrl();
  if (!databaseUrl) return null;

  const cache = neonClientCache();
  const cached = cache.get(databaseUrl);
  if (cached) return cached as DeflectionReviewDecisionSql;

  const client: DeflectionReviewDecisionSql = neon(databaseUrl);
  cache.set(databaseUrl, client);
  return client;
}

export function deflectionReviewDecisionDatabaseConfigured() {
  return deflectionReviewDecisionDatabaseUrl().length > 0;
}

function isDeflectionReviewDecision(value: unknown): value is DeflectionReviewDecision {
  return typeof value === 'string' && DEFLECTION_REVIEW_DECISIONS.includes(value as DeflectionReviewDecision);
}

function decisionRecordFromRow(row: Record<string, unknown>): DeflectionReviewDecisionRecord | null {
  if (!isDeflectionReviewDecision(row.decision)) return null;
  return {
    requestId: String(row.request_id || ''),
    reviewKey: String(row.review_key || ''),
    decision: row.decision,
    updatedAt: String(row.updated_at || ''),
  };
}

export async function listDeflectionReviewDecisions(
  requestId: string,
): Promise<DeflectionReviewDecisionRecord[]> {
  const sql = getDeflectionReviewDecisionSql();
  if (!sql) return [];

  const rows = await sql.query(
    `
      SELECT
        request_id,
        review_key,
        decision,
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at
      FROM portfolio_deflection_review_decisions
      WHERE request_id = $1
      ORDER BY updated_at DESC
    `,
    [requestId],
  );

  return rows
    .map((row) => decisionRecordFromRow(row as Record<string, unknown>))
    .filter((row): row is DeflectionReviewDecisionRecord => row !== null);
}

export async function upsertDeflectionReviewDecision(
  input: DeflectionReviewDecisionInput,
): Promise<DeflectionReviewDecisionRecord | null> {
  const sql = getDeflectionReviewDecisionSql();
  if (!sql) return null;

  const rows = await sql.query(
    `
      INSERT INTO portfolio_deflection_review_decisions (
        request_id,
        review_key,
        decision
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (request_id, review_key) DO UPDATE SET
        decision = EXCLUDED.decision,
        updated_at = now()
      RETURNING
        request_id,
        review_key,
        decision,
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at
    `,
    [input.requestId, input.reviewKey, input.decision],
  );

  const row = rows[0];
  return row ? decisionRecordFromRow(row as Record<string, unknown>) : null;
}
