import { head } from '@vercel/blob';
import { NextResponse } from 'next/server';
import {
  gapReportBlobToken,
  parseGapReportMetadata,
  recordGapReportSubmission,
} from '@/lib/gap-report-intake';
import { submitDeflectionReportCsv } from '@/lib/atlas-deflection-client';

export const runtime = 'nodejs';

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

  // head() uses our store's token, so it only resolves blobs we own; this is the
  // authoritative check that the reported URL is a real upload in our namespace.
  // Same explicit intake-store token as /upload, so the ownership check runs
  // against the store the private CSV was actually uploaded to.
  try {
    await head(blobUrl, { token: gapReportBlobToken() });
  } catch {
    return NextResponse.json({ ok: false, error: 'Upload not found.' }, { status: 400 });
  }

  try {
    const warnings: string[] = [];
    let reportRequestId: string | undefined;

    if (meta.value.sourceOffer === 'support-ticket-deflection-intake') {
      const submit = await submitDeflectionReportCsv({
        csvBlobUrl: blobUrl,
        csvFilename: meta.value.csvFilename,
        companyName: meta.value.companyName,
        contactEmail: meta.value.email,
        supportPlatform: meta.value.supportPlatform,
      });

      if (submit.ok) {
        reportRequestId = submit.requestId;
      } else {
        warnings.push('Deflection report was not generated immediately.');
      }
    }

    const result = await recordGapReportSubmission({
      name: meta.value.name,
      email: meta.value.email,
      companyName: meta.value.companyName,
      supportPlatform: meta.value.supportPlatform,
      csvBlobUrl: blobUrl,
      csvFilename: meta.value.csvFilename,
      csvSizeBytes: meta.value.csvSizeBytes,
      sourcePage: meta.value.sourcePage,
      sourceOffer: meta.value.sourceOffer,
      reportRequestId,
    });
    warnings.push(...result.warnings);

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
