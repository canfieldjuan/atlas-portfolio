import { del, list } from '@vercel/blob';
import {
  deleteGapReportSubmissions,
  gapReportDatabaseConfigured,
  listExpiredGapReportSubmissions,
} from './gap-report-intake-database';

const GAP_REPORT_BLOB_PREFIX = 'gap-report-csvs/';
const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_BATCH_LIMIT = 100;

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

function cutoffDate(retentionDays: number) {
  return new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function deleteBlob(url: string) {
  await del(url);
}

async function cleanupTrackedSubmissions(cutoffIso: string, limit: number) {
  const errors: string[] = [];
  const expired = await listExpiredGapReportSubmissions(cutoffIso, limit);
  const deletedRequestIds: string[] = [];
  let deletedTrackedBlobs = 0;

  for (const submission of expired) {
    try {
      await deleteBlob(submission.csvBlobUrl);
      deletedTrackedBlobs += 1;
      deletedRequestIds.push(submission.requestId);
    } catch (error) {
      errors.push(
        `Failed to delete blob for request ${submission.requestId}: ${errorMessage(error)}`
      );
    }
  }

  const deletedDatabaseRows = await deleteGapReportSubmissions(deletedRequestIds);

  return {
    expiredDatabaseRows: expired.length,
    deletedDatabaseRows,
    deletedTrackedBlobs,
    errors,
  };
}

async function cleanupOrphanedBlobs(cutoff: Date, limit: number) {
  const errors: string[] = [];
  let cursor: string | undefined;
  let deletedOrphanedBlobs = 0;

  do {
    const page = await list({
      prefix: GAP_REPORT_BLOB_PREFIX,
      limit,
      cursor,
    });

    for (const blob of page.blobs) {
      if (blob.uploadedAt >= cutoff) continue;

      try {
        await deleteBlob(blob.url);
        deletedOrphanedBlobs += 1;
      } catch (error) {
        errors.push(`Failed to delete orphaned blob ${blob.pathname}: ${errorMessage(error)}`);
      }
    }

    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return { deletedOrphanedBlobs, errors };
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
