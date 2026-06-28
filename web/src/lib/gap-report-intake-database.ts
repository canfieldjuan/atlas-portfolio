import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { GapReportSubmissionRecord } from './gap-report-intake';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT_ID,
  type DeflectionPriceVariantId,
  resolveDeflectionPriceVariant,
} from './deflection-pricing';

type GapReportSql = NeonQueryFunction<false, false>;

export type GapReportSummaryRow = {
  requestId: string;
  submittedAt: string;
  email: string;
  companyName: string;
  supportPlatform: string | null;
  csvBlobUrl: string;
  csvFilename: string;
  csvSizeBytes: number | null;
  sourcePage: string | null;
  sourceOffer: string | null;
  notificationStatus: string;
  notificationError: string | null;
};

export type GapReportCleanupCandidate = {
  requestId: string;
  reportRequestId: string;
  submittedAt: string;
  csvBlobUrl: string;
};

export type GapReportRecentDuplicateRow = {
  requestId: string;
  reportRequestId: string;
  submittedAt: string;
};

function gapReportDatabaseUrl() {
  // Vercel's Neon/Postgres integration injects POSTGRES_URL by default, so falling
  // back to it lets persistence work on Vercel without a separate env-var alias.
  // Mirrors the resolution chain used by audit-intake-database.ts.
  return (
    process.env.GAP_REPORT_DATABASE_URL?.trim() ||
    process.env.AUDIT_INTAKE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    ''
  );
}

// Cache the Neon client per database URL across requests + Next dev HMR.
const neonClientGlobalKey = Symbol.for('atlas-portfolio.gap-report-intake.neon-clients');
type NeonClientCache = Map<string, unknown>;
const globalScope = globalThis as unknown as { [neonClientGlobalKey]?: NeonClientCache };
function neonClientCache(): NeonClientCache {
  if (!globalScope[neonClientGlobalKey]) {
    globalScope[neonClientGlobalKey] = new Map();
  }
  return globalScope[neonClientGlobalKey];
}

function getGapReportSql(): GapReportSql | null {
  const databaseUrl = gapReportDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  const cache = neonClientCache();
  const cached = cache.get(databaseUrl);
  if (cached) {
    return cached as GapReportSql;
  }
  const client: GapReportSql = neon(databaseUrl);
  cache.set(databaseUrl, client);
  return client;
}

export function gapReportDatabaseConfigured() {
  return gapReportDatabaseUrl().length > 0;
}

export async function persistGapReportSubmission(record: GapReportSubmissionRecord) {
  const sql = getGapReportSql();
  if (!sql) {
    return false;
  }

  await sql.query(
    `
      INSERT INTO portfolio_gap_report_submissions (
        request_id,
        submitted_at,
        email,
        company_name,
        support_platform,
        csv_blob_url,
        csv_filename,
        csv_size_bytes,
        source_page,
        source_offer,
        notification_status,
        notification_error,
        payload
      )
      VALUES (
        $1::uuid,
        $2::timestamptz,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13::jsonb
      )
      ON CONFLICT (request_id) DO UPDATE SET
        submitted_at = EXCLUDED.submitted_at,
        email = EXCLUDED.email,
        company_name = EXCLUDED.company_name,
        support_platform = EXCLUDED.support_platform,
        csv_blob_url = EXCLUDED.csv_blob_url,
        csv_filename = EXCLUDED.csv_filename,
        csv_size_bytes = EXCLUDED.csv_size_bytes,
        source_page = EXCLUDED.source_page,
        source_offer = EXCLUDED.source_offer,
        notification_status = EXCLUDED.notification_status,
        notification_error = EXCLUDED.notification_error,
        payload = EXCLUDED.payload
    `,
    [
      record.requestId,
      record.submittedAt,
      record.email,
      record.companyName,
      record.supportPlatform || null,
      record.csvBlobUrl,
      record.csvFilename,
      record.csvSizeBytes ?? null,
      record.sourcePage || null,
      record.sourceOffer || null,
      record.notificationStatus,
      record.notificationError || null,
      JSON.stringify(record),
    ]
  );

  return true;
}

export async function listGapReportSubmissions(limit = 50): Promise<GapReportSummaryRow[]> {
  const sql = getGapReportSql();
  if (!sql) {
    return [];
  }

  const boundedLimit = Math.max(1, Math.min(limit, 100));
  const rows = await sql.query(
    `
      SELECT
        request_id::text AS request_id,
        to_char(submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS submitted_at,
        email,
        company_name,
        support_platform,
        csv_blob_url,
        csv_filename,
        csv_size_bytes,
        source_page,
        source_offer,
        notification_status,
        notification_error
      FROM portfolio_gap_report_submissions
      ORDER BY submitted_at DESC
      LIMIT $1
    `,
    [boundedLimit]
  );

  return rows.map((row) => ({
    requestId: String(row.request_id),
    submittedAt: String(row.submitted_at),
    email: String(row.email),
    companyName: String(row.company_name),
    supportPlatform: typeof row.support_platform === 'string' ? row.support_platform : null,
    csvBlobUrl: String(row.csv_blob_url),
    csvFilename: String(row.csv_filename),
    csvSizeBytes:
      typeof row.csv_size_bytes === 'number'
        ? row.csv_size_bytes
        : row.csv_size_bytes != null
          ? Number(row.csv_size_bytes)
          : null,
    sourcePage: typeof row.source_page === 'string' ? row.source_page : null,
    sourceOffer: typeof row.source_offer === 'string' ? row.source_offer : null,
    notificationStatus: String(row.notification_status),
    notificationError:
      typeof row.notification_error === 'string' ? row.notification_error : null,
  }));
}

export async function getGapReportSubmissionByRequestId(
  requestId: string
): Promise<GapReportSummaryRow | null> {
  const sql = getGapReportSql();
  if (!sql) {
    return null;
  }

  const rows = await sql.query(
    `
      SELECT
        request_id::text AS request_id,
        to_char(submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS submitted_at,
        email,
        company_name,
        support_platform,
        csv_blob_url,
        csv_filename,
        csv_size_bytes,
        source_page,
        source_offer,
        notification_status,
        notification_error
      FROM portfolio_gap_report_submissions
      WHERE request_id = $1::uuid
      LIMIT 1
    `,
    [requestId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    requestId: String(row.request_id),
    submittedAt: String(row.submitted_at),
    email: String(row.email),
    companyName: String(row.company_name),
    supportPlatform: typeof row.support_platform === 'string' ? row.support_platform : null,
    csvBlobUrl: String(row.csv_blob_url),
    csvFilename: String(row.csv_filename),
    csvSizeBytes:
      typeof row.csv_size_bytes === 'number'
        ? row.csv_size_bytes
        : row.csv_size_bytes != null
          ? Number(row.csv_size_bytes)
          : null,
    sourcePage: typeof row.source_page === 'string' ? row.source_page : null,
    sourceOffer: typeof row.source_offer === 'string' ? row.source_offer : null,
    notificationStatus: String(row.notification_status),
    notificationError:
      typeof row.notification_error === 'string' ? row.notification_error : null,
  };
}

export async function getRecentGapReportSubmissionByEmailAndBlob(
  email: string,
  csvBlobUrl: string,
  submittedAfterIso: string,
): Promise<GapReportRecentDuplicateRow | null> {
  const sql = getGapReportSql();
  if (!sql) {
    return null;
  }

  const rows = await sql.query(
    `
      SELECT
        request_id::text AS request_id,
        payload->>'reportRequestId' AS report_request_id,
        to_char(submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS submitted_at
      FROM portfolio_gap_report_submissions
      WHERE lower(email) = lower($1)
        AND csv_blob_url = $2
        AND source_offer = 'support-ticket-deflection-intake'
        AND submitted_at >= $3::timestamptz
        AND payload->>'reportRequestId' IS NOT NULL
        AND payload->>'reportRequestId' <> ''
      ORDER BY submitted_at DESC
      LIMIT 1
    `,
    [email, csvBlobUrl, submittedAfterIso]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    requestId: String(row.request_id),
    reportRequestId: String(row.report_request_id),
    submittedAt: String(row.submitted_at),
  };
}

export async function getGapReportSubmittedAtByReportRequestId(
  reportRequestId: string
): Promise<string | null> {
  const sql = getGapReportSql();
  if (!sql) {
    return null;
  }

  const rows = await sql.query(
    `
      SELECT
        to_char(submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS submitted_at
      FROM portfolio_gap_report_submissions
      WHERE payload->>'reportRequestId' = $1
      ORDER BY submitted_at DESC
      LIMIT 1
    `,
    [reportRequestId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return String(row.submitted_at);
}

export async function getGapReportPriceVariantByReportRequestId(
  reportRequestId: string
): Promise<DeflectionPriceVariantId | null> {
  const sql = getGapReportSql();
  if (!sql) {
    return null;
  }

  const rows = await sql.query(
    `
      SELECT
        payload->>'priceVariant' AS price_variant
      FROM portfolio_gap_report_submissions
      WHERE payload->>'reportRequestId' = $1
      ORDER BY submitted_at DESC
      LIMIT 1
    `,
    [reportRequestId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }
  const variant =
    typeof row.price_variant === 'string'
      ? resolveDeflectionPriceVariant(row.price_variant)
      : null;
  return variant?.id ?? DEFLECTION_DEFAULT_PRICE_VARIANT_ID;
}

export async function listExpiredGapReportSubmissions(
  cutoffIso: string,
  limit = 100,
  offset = 0
): Promise<GapReportCleanupCandidate[]> {
  const sql = getGapReportSql();
  if (!sql) {
    return [];
  }

  const boundedLimit = Math.max(1, Math.min(limit, 500));
  const boundedOffset = Math.max(0, offset);
  const rows = await sql.query(
    `
      SELECT
        request_id::text AS request_id,
        payload->>'reportRequestId' AS report_request_id,
        to_char(submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS submitted_at,
        csv_blob_url
      FROM portfolio_gap_report_submissions
      WHERE submitted_at < $1::timestamptz
        AND payload->>'reportRequestId' IS NOT NULL
        AND payload->>'reportRequestId' <> ''
      ORDER BY submitted_at ASC
      LIMIT $2
      OFFSET $3
    `,
    [cutoffIso, boundedLimit, boundedOffset]
  );

  return rows.map((row) => ({
    requestId: String(row.request_id),
    reportRequestId: String(row.report_request_id),
    submittedAt: String(row.submitted_at),
    csvBlobUrl: String(row.csv_blob_url),
  }));
}

export async function deleteGapReportSubmissions(requestIds: string[]) {
  const sql = getGapReportSql();
  if (!sql || requestIds.length === 0) {
    return 0;
  }

  const rows = await sql.query(
    `
      DELETE FROM portfolio_gap_report_submissions
      WHERE request_id = ANY($1::uuid[])
      RETURNING request_id
    `,
    [requestIds]
  );

  return rows.length;
}
