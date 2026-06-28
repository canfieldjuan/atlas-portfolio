import { BlobNotFoundError, del, list } from '@vercel/blob';
import { deleteDeflectionReport } from './atlas-deflection-client';
import { deleteDeflectionReviewDecisions } from './deflection-review-decisions-database';
import { gapReportBlobToken, gapReportBlobTokens } from './gap-report-intake';
import {
  deleteGapReportSubmissions,
  gapReportDatabaseConfigured,
  getGapReportPurgeTargetByReportRequestId,
  listExpiredGapReportSubmissions,
} from './gap-report-intake-database';
import { structuredRuntimeError } from './structured-runtime-log';

const GAP_REPORT_BLOB_PREFIX = 'gap-report-csvs/';
const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_BATCH_LIMIT = 100;
const MAX_TRACKED_BATCH_LIMIT = 25;

export type GapReportCleanupResult = {
  cutoffIso: string;
  retentionDays: number;
  databaseConfigured: boolean;
  expiredDatabaseRows: number;
  deletedDatabaseRows: number;
  deletedTrackedBlobs: number;
  deletedOrphanedBlobs: number;
  errors: string[];
};

export type GapReportPurgeResult =
  | { ok: true; status: 'purged' }
  | {
      ok: false;
      reason: 'not_configured' | 'not_found' | 'blob_error' | 'atlas_error' | 'database_error';
    };

function cutoffDate(retentionDays: number) {
  return new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function deleteBlob(url: string) {
  const tokens = gapReportBlobTokens();
  if (tokens.length === 0) {
    try {
      await del(url, { token: undefined });
    } catch (error) {
      if (error instanceof BlobNotFoundError) return;
      throw error;
    }
    return;
  }

  let lastError: unknown;
  let sawMissingBlob = false;
  for (const token of tokens) {
    try {
      await del(url, { token });
      return;
    } catch (error) {
      if (error instanceof BlobNotFoundError) {
        sawMissingBlob = true;
        continue;
      }
      lastError = error;
    }
  }
  if (sawMissingBlob) return;
  throw lastError;
}

async function cleanupTrackedSubmissions(cutoffIso: string, limit: number) {
  const errors: string[] = [];
  let expiredDatabaseRows = 0;
  let deletedTrackedBlobs = 0;
  let deletedDatabaseRows = 0;
  const trackedLimit = Math.max(1, Math.min(limit, MAX_TRACKED_BATCH_LIMIT));
  let retainedOffset = 0;

  // Paginate until no more expired records exist. Retained failures stay in
  // Neon, so retainedOffset lets this cron run advance to newer expired rows
  // without losing the retry handle for failed rows.
  let hasMore = true;
  while (hasMore) {
    const expired = await listExpiredGapReportSubmissions(cutoffIso, trackedLimit, retainedOffset);
    if (expired.length === 0) break;

    expiredDatabaseRows += expired.length;
    const deletedRequestIds: string[] = [];
    let retainedRows = 0;

    for (const submission of expired) {
      try {
        await deleteBlob(submission.csvBlobUrl);
        deletedTrackedBlobs += 1;
        const atlasDelete = await deleteDeflectionReport(submission.reportRequestId);
        if (!atlasDelete.ok) {
          errors.push(
            `Failed to delete ATLAS report ${submission.reportRequestId} for request ${submission.requestId}: ${atlasDelete.reason}`
          );
          retainedRows += 1;
          continue;
        }
        await deleteDeflectionReviewDecisions(submission.reportRequestId);
        deletedRequestIds.push(submission.requestId);
      } catch (error) {
        errors.push(
          `Failed to delete tracked report data for request ${submission.requestId}: ${errorMessage(error)}`
        );
        retainedRows += 1;
      }
    }

    const batchDeleted = await deleteGapReportSubmissions(deletedRequestIds);
    deletedDatabaseRows += batchDeleted;
    retainedOffset += retainedRows;

    // Retained failures stay in Neon for retry, so advance past the retained
    // rows within this cron run to keep one stuck report from starving newer
    // expired rows.
    hasMore = expired.length === trackedLimit;
  }

  return {
    expiredDatabaseRows,
    deletedDatabaseRows,
    deletedTrackedBlobs,
    errors,
  };
}

async function cleanupOrphanedBlobs(cutoff: Date, limit: number) {
  const errors: string[] = [];
  let deletedOrphanedBlobs = 0;
  const seen = new Set<string>();
  const tokens = gapReportBlobTokens();
  const listTokens = tokens.length > 0 ? tokens : [gapReportBlobToken()];

  for (const token of listTokens) {
    let cursor: string | undefined;

    do {
      const page = await list({
        prefix: GAP_REPORT_BLOB_PREFIX,
        limit,
        cursor,
        token,
      });

      for (const blob of page.blobs) {
        if (blob.uploadedAt >= cutoff || seen.has(blob.url)) continue;
        seen.add(blob.url);

        try {
          await deleteBlob(blob.url);
          deletedOrphanedBlobs += 1;
        } catch (error) {
          errors.push(`Failed to delete orphaned blob ${blob.pathname}: ${errorMessage(error)}`);
        }
      }

      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }

  return { deletedOrphanedBlobs, errors };
}

export async function purgeGapReportSubmissionByReportRequestId(
  reportRequestId: string
): Promise<GapReportPurgeResult> {
  if (!gapReportDatabaseConfigured()) {
    return { ok: false, reason: 'not_configured' };
  }

  let target;
  try {
    target = await getGapReportPurgeTargetByReportRequestId(reportRequestId);
  } catch (error) {
    structuredRuntimeError('deflection.report_purge.lookup_failed', {
      reportRequestId,
      error,
    });
    return { ok: false, reason: 'database_error' };
  }

  if (!target) {
    return { ok: false, reason: 'not_found' };
  }

  try {
    await deleteBlob(target.csvBlobUrl);
  } catch (error) {
    structuredRuntimeError('deflection.report_purge.blob_delete_failed', {
      reportRequestId,
      requestId: target.requestId,
      error,
    });
    return { ok: false, reason: 'blob_error' };
  }

  const atlasDelete = await deleteDeflectionReport(target.reportRequestId);
  if (!atlasDelete.ok) {
    structuredRuntimeError('deflection.report_purge.atlas_delete_failed', {
      reportRequestId,
      requestId: target.requestId,
      reason: atlasDelete.reason,
    });
    return { ok: false, reason: 'atlas_error' };
  }

  try {
    await deleteDeflectionReviewDecisions(target.reportRequestId);
    const deletedRows = await deleteGapReportSubmissions([target.requestId]);
    if (deletedRows < 1) {
      structuredRuntimeError('deflection.report_purge.database_delete_missing', {
        reportRequestId,
        requestId: target.requestId,
      });
      return { ok: false, reason: 'database_error' };
    }
  } catch (error) {
    structuredRuntimeError('deflection.report_purge.database_delete_failed', {
      reportRequestId,
      requestId: target.requestId,
      error,
    });
    return { ok: false, reason: 'database_error' };
  }

  return { ok: true, status: 'purged' };
}

export async function cleanupExpiredGapReportData(options?: {
  retentionDays?: number;
  limit?: number;
}): Promise<GapReportCleanupResult> {
  const retentionDays = options?.retentionDays ?? DEFAULT_RETENTION_DAYS;
  const limit = options?.limit ?? DEFAULT_BATCH_LIMIT;
  const cutoff = cutoffDate(retentionDays);
  const cutoffIso = cutoff.toISOString();
  const databaseConfigured = gapReportDatabaseConfigured();
  const errors: string[] = [];

  let expiredDatabaseRows = 0;
  let deletedDatabaseRows = 0;
  let deletedTrackedBlobs = 0;
  let deletedOrphanedBlobs = 0;

  if (databaseConfigured) {
    try {
      const tracked = await cleanupTrackedSubmissions(cutoffIso, limit);
      expiredDatabaseRows = tracked.expiredDatabaseRows;
      deletedDatabaseRows = tracked.deletedDatabaseRows;
      deletedTrackedBlobs = tracked.deletedTrackedBlobs;
      errors.push(...tracked.errors);
    } catch (error) {
      errors.push(`Database-backed cleanup failed: ${errorMessage(error)}`);
    }
  }

  try {
    const orphaned = await cleanupOrphanedBlobs(cutoff, limit);
    deletedOrphanedBlobs = orphaned.deletedOrphanedBlobs;
    errors.push(...orphaned.errors);
  } catch (error) {
    errors.push(`Orphaned blob cleanup failed: ${errorMessage(error)}`);
  }

  return {
    cutoffIso,
    retentionDays,
    databaseConfigured,
    expiredDatabaseRows,
    deletedDatabaseRows,
    deletedTrackedBlobs,
    deletedOrphanedBlobs,
    errors,
  };
}
