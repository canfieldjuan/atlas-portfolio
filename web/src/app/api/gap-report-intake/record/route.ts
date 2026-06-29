import { head } from '@vercel/blob';
import { NextResponse } from 'next/server';
import {
  gapReportBlobToken,
  gapReportBlobTokens,
  parseGapReportMetadata,
  recordGapReportSubmission,
} from '@/lib/gap-report-intake';
import { getRecentGapReportSubmissionByEmailAndBlob } from '@/lib/gap-report-intake-database';
import {
  deleteDeflectionReport,
  fetchDeflectionSnapshot,
  submitDeflectionReportCsv,
  type DeflectionSubmitResult,
  type SnapshotFetchResult,
} from '@/lib/atlas-deflection-client';
import type { DeflectionSnapshot } from '@/lib/deflection-snapshot';
import {
  DEFLECTION_PARTNER_PRICE_VARIANT_ID,
  type DeflectionPriceVariantId,
} from '@/lib/deflection-pricing';
import {
  consumeDeflectionIdentifierRateLimit,
  consumeDeflectionRateLimit,
  type DeflectionRateLimitConfig,
} from '@/lib/deflection-rate-limit';
import { structuredRuntimeError } from '@/lib/structured-runtime-log';

export const runtime = 'nodejs';
// The deflection submit forwards up to 50 MB of CSV to ATLAS and waits for
// the full deterministic report build (~52s measured at 35k rows) plus the
// snapshot fetch and email send, so the default function duration is far too
// short for a real full-volume export.
export const maxDuration = 300;

const SUPPORT_DEFLECTION_SOURCE_OFFER = 'support-ticket-deflection-intake';
const RECORD_CLIENT_RATE_LIMIT = {
  scope: 'gap-report-record-ip',
  limit: 3,
  windowMs: 10 * 60 * 1000,
} satisfies DeflectionRateLimitConfig;
const RECORD_EMAIL_RATE_LIMIT = {
  scope: 'gap-report-record-email',
  limit: 3,
  windowMs: 10 * 60 * 1000,
} satisfies DeflectionRateLimitConfig;
const RECENT_RECORD_DUPLICATE_WINDOW_MS = 60 * 60 * 1000;

type DeflectionSubmitFailureReason = Extract<DeflectionSubmitResult, { ok: false }>['reason'];
type DeflectionSnapshotFailureReason = Extract<SnapshotFetchResult, { ok: false }>['reason'];

const DEFLECTION_SUBMIT_PUBLIC_FAILURE_COPY: Record<
  DeflectionSubmitFailureReason,
  { httpStatus: number; error: string }
> = {
  not_configured: {
    httpStatus: 503,
    error:
      'Resolution Audit generation is temporarily unavailable. Please try again in a moment or email us directly.',
  },
  blob_not_found: {
    httpStatus: 400,
    error: 'We could not read the uploaded CSV. Please retry the upload.',
  },
  invalid_response: {
    httpStatus: 502,
    error:
      'Resolution Audit generation returned an unexpected response. Please try again or email us directly.',
  },
  rejected: {
    httpStatus: 502,
    error:
      'Resolution Audit generation rejected this CSV. Please check the export and try again, or email us directly.',
  },
  error: {
    httpStatus: 503,
    error:
      'Resolution Audit generation failed. Please try again in a moment or email us directly.',
  },
};

const DEFLECTION_SUBMIT_PARTNER_FAILURE_COPY: Record<
  DeflectionSubmitFailureReason,
  { httpStatus: number; error: string }
> = {
  not_configured: {
    httpStatus: 503,
    error:
      'Deflection Report generation is temporarily unavailable. Please try again in a moment or email us directly.',
  },
  blob_not_found: {
    httpStatus: 400,
    error: 'We could not read the uploaded CSV. Please retry the upload.',
  },
  invalid_response: {
    httpStatus: 502,
    error:
      'Deflection Report generation returned an unexpected response. Please try again or email us directly.',
  },
  rejected: {
    httpStatus: 502,
    error:
      'Deflection Report generation rejected this CSV. Please check the export and try again, or email us directly.',
  },
  error: {
    httpStatus: 503,
    error:
      'Deflection Report generation failed. Please try again in a moment or email us directly.',
  },
};

const DEFLECTION_SNAPSHOT_PUBLIC_FAILURE_COPY: Record<
  DeflectionSnapshotFailureReason,
  { httpStatus: number; error: string }
> = {
  not_configured: {
    httpStatus: 503,
    error:
      'Resolution Audit Snapshot delivery is temporarily unavailable. Please try again in a moment or email us directly.',
  },
  not_found: {
    httpStatus: 502,
    error:
      'Resolution Audit generation finished, but the Snapshot was not available yet. Please try again in a moment or email us directly.',
  },
  error: {
    httpStatus: 502,
    error:
      'Resolution Audit Snapshot delivery failed. Please try again in a moment or email us directly.',
  },
};

const DEFLECTION_SNAPSHOT_PARTNER_FAILURE_COPY: Record<
  DeflectionSnapshotFailureReason,
  { httpStatus: number; error: string }
> = {
  not_configured: {
    httpStatus: 503,
    error:
      'Deflection Snapshot delivery is temporarily unavailable. Please try again in a moment or email us directly.',
  },
  not_found: {
    httpStatus: 502,
    error:
      'Deflection Report generation finished, but the Snapshot was not available yet. Please try again in a moment or email us directly.',
  },
  error: {
    httpStatus: 502,
    error:
      'Deflection Snapshot delivery failed. Please try again in a moment or email us directly.',
  },
};

function deflectionSubmitFailureResponse(
  reason: DeflectionSubmitFailureReason,
  priceVariant: DeflectionPriceVariantId | undefined,
) {
  const copy =
    priceVariant === DEFLECTION_PARTNER_PRICE_VARIANT_ID
      ? DEFLECTION_SUBMIT_PARTNER_FAILURE_COPY
      : DEFLECTION_SUBMIT_PUBLIC_FAILURE_COPY;
  const failure = copy[reason];
  structuredRuntimeError('deflection.record.atlas_submit_failed', { reason, priceVariant });
  return NextResponse.json(
    {
      ok: false,
      status: 'failed_to_submit',
      reason,
      error: failure.error,
    },
    { status: failure.httpStatus },
  );
}

function deflectionSnapshotFailureResponse(
  reason: DeflectionSnapshotFailureReason,
  reportRequestId: string,
  priceVariant: DeflectionPriceVariantId | undefined,
) {
  const copy =
    priceVariant === DEFLECTION_PARTNER_PRICE_VARIANT_ID
      ? DEFLECTION_SNAPSHOT_PARTNER_FAILURE_COPY
      : DEFLECTION_SNAPSHOT_PUBLIC_FAILURE_COPY;
  const failure = copy[reason];
  structuredRuntimeError('deflection.record.snapshot_pdf_attachment_skipped', {
    reason,
    reportRequestId,
    priceVariant,
  });
  return NextResponse.json(
    {
      ok: false,
      status: 'failed_to_fetch_snapshot',
      reason,
      error: failure.error,
    },
    { status: failure.httpStatus },
  );
}

async function deleteUnattachedDeflectionReport(
  reportRequestId: string,
  snapshotReason: DeflectionSnapshotFailureReason,
  priceVariant: DeflectionPriceVariantId | undefined,
) {
  const deleted = await deleteDeflectionReport(reportRequestId);
  if (!deleted.ok) {
    structuredRuntimeError('deflection.record.snapshot_failure_cleanup_failed', {
      reportRequestId,
      snapshotReason,
      cleanupReason: deleted.reason,
      priceVariant,
    });
  }
}

function recordRateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { ok: false, error: 'Too many submission attempts. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  );
}

function consumeRecordClientRateLimit(headers: Headers) {
  return consumeDeflectionRateLimit(headers, 'record', RECORD_CLIENT_RATE_LIMIT);
}

function consumeRecordEmailRateLimit(email: string) {
  return consumeDeflectionIdentifierRateLimit(email, RECORD_EMAIL_RATE_LIMIT);
}

async function findRecentDuplicateSubmission(email: string, blobUrl: string) {
  const submittedAfterIso = new Date(Date.now() - RECENT_RECORD_DUPLICATE_WINDOW_MS).toISOString();
  try {
    return await getRecentGapReportSubmissionByEmailAndBlob(email, blobUrl, submittedAfterIso);
  } catch (error) {
    structuredRuntimeError('deflection.record.duplicate_lookup_failed', { error });
    return null;
  }
}

function duplicateRecordResponse(existing: { requestId: string; reportRequestId: string }) {
  return NextResponse.json({
    ok: true,
    requestId: existing.requestId,
    reportRequestId: existing.reportRequestId,
    status: 'already_submitted',
    warnings: [],
    estimatedResponseHours: 24,
  });
}

async function hasOwnedBlob(blobUrl: string) {
  const tokens = gapReportBlobTokens();
  const readTokens = tokens.length > 0 ? tokens : [gapReportBlobToken()];

  for (const token of readTokens) {
    try {
      await head(blobUrl, { token });
      return true;
    } catch {
      // Try the next configured store token before rejecting the upload.
    }
  }

  return false;
}

// Records a deflection-intake submission after the client has uploaded the CSV
// directly to Vercel Blob (see /upload). The client reports the blob URL; we
// re-validate the metadata and confirm the blob is in OUR store via head()
// (scoped to our token) before persisting — a forged or foreign URL fails here.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const fields = (body ?? {}) as Record<string, unknown>;
  const blobUrl = typeof fields.blobUrl === 'string' ? fields.blobUrl : '';

  const meta = parseGapReportMetadata(fields);
  if (!meta.ok) {
    return NextResponse.json({ ok: false, error: meta.error }, { status: 400 });
  }

  if (!blobUrl.startsWith('https://') || !blobUrl.includes('/gap-report-csvs/')) {
    return NextResponse.json({ ok: false, error: 'Invalid upload reference.' }, { status: 400 });
  }

  if (meta.value.sourceOffer === SUPPORT_DEFLECTION_SOURCE_OFFER) {
    const rateLimit = consumeRecordClientRateLimit(request.headers);
    if (!rateLimit.ok) {
      return recordRateLimitResponse(rateLimit.retryAfterSeconds);
    }
  }

  // head() uses our store's token, so it only resolves blobs we own; this is the
  // authoritative check that the reported URL is a real upload in our namespace.
  // Same explicit intake-store token as /upload, so the ownership check runs
  // against the store the private CSV was actually uploaded to.
  if (!(await hasOwnedBlob(blobUrl))) {
    return NextResponse.json({ ok: false, error: 'Upload not found.' }, { status: 400 });
  }

  if (meta.value.sourceOffer === SUPPORT_DEFLECTION_SOURCE_OFFER) {
    const rateLimit = consumeRecordEmailRateLimit(meta.value.email);
    if (!rateLimit.ok) {
      return recordRateLimitResponse(rateLimit.retryAfterSeconds);
    }
  }

  try {
    const warnings: string[] = [];
    let reportRequestId: string | undefined;
    let snapshot: DeflectionSnapshot | undefined;

    if (meta.value.sourceOffer === SUPPORT_DEFLECTION_SOURCE_OFFER) {
      const duplicate = await findRecentDuplicateSubmission(meta.value.email, blobUrl);
      if (duplicate) {
        return duplicateRecordResponse(duplicate);
      }

      const submit = await submitDeflectionReportCsv({
        csvBlobUrl: blobUrl,
        csvFilename: meta.value.csvFilename,
        companyName: meta.value.companyName,
        contactEmail: meta.value.email,
        supportPlatform: meta.value.supportPlatform,
      });

      if (submit.ok) {
        reportRequestId = submit.requestId;
        const snapshotResult = await fetchDeflectionSnapshot(submit.requestId);
        if (snapshotResult.ok) {
          snapshot = snapshotResult.snapshot;
        } else {
          await deleteUnattachedDeflectionReport(
            submit.requestId,
            snapshotResult.reason,
            meta.value.priceVariant,
          );
          return deflectionSnapshotFailureResponse(
            snapshotResult.reason,
            submit.requestId,
            meta.value.priceVariant,
          );
        }
      } else {
        return deflectionSubmitFailureResponse(submit.reason, meta.value.priceVariant);
      }
    }

    const requiresDurableVariantPersistence =
      meta.value.priceVariant === DEFLECTION_PARTNER_PRICE_VARIANT_ID;
    const result = await recordGapReportSubmission(
      {
        name: meta.value.name,
        email: meta.value.email,
        companyName: meta.value.companyName,
        supportPlatform: meta.value.supportPlatform,
        csvBlobUrl: blobUrl,
        csvFilename: meta.value.csvFilename,
        csvSizeBytes: meta.value.csvSizeBytes,
        sourcePage: meta.value.sourcePage,
        sourceOffer: meta.value.sourceOffer,
        priceVariant: meta.value.priceVariant,
        reportRequestId,
      },
      {
        requirePersistence: requiresDurableVariantPersistence,
        snapshot,
      },
    );
    warnings.push(...result.warnings);

    if (requiresDurableVariantPersistence && !result.persisted) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Partner price could not be saved. Please retry your upload.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      requestId: result.requestId,
      reportRequestId,
      status: warnings.length > 0 ? 'submitted_with_warnings' : result.status,
      warnings,
      estimatedResponseHours: 24,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: `Submission recorded but notification failed. ${detail.slice(0, 240)}` },
      { status: 500 }
    );
  }
}
