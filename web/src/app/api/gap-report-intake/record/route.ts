import { head } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { parseGapReportMetadata, recordGapReportSubmission } from '@/lib/gap-report-intake';

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
  try {
    await head(blobUrl);
  } catch {
    return NextResponse.json({ ok: false, error: 'Upload not found.' }, { status: 400 });
  }

  try {
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
    });

    return NextResponse.json({
      ok: true,
      requestId: result.requestId,
      status: result.status,
      warnings: result.warnings,
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
