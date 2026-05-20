import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { isSupportPlatform, recordGapReportSubmission } from '@/lib/gap-report-intake';

export const runtime = 'nodejs';

// Vercel serverless body limit is ~4.5MB by default. We accept up to 4 MB of CSV
// to leave headroom for form fields. Typical B2B SaaS support-ticket exports for
// 90 days fit comfortably under this; larger spans (180+ days) may not. Buyers
// who hit this are directed to email us directly.
const MAX_CSV_BYTES = 4 * 1024 * 1024;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requiredText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid form submission — could not parse.' },
      { status: 400 }
    );
  }

  const name = requiredText(formData.get('name'));
  const email = requiredText(formData.get('email'));
  const companyName = requiredText(formData.get('companyName'));
  const supportPlatformRaw = requiredText(formData.get('supportPlatform'));
  const supportPlatform = isSupportPlatform(supportPlatformRaw) ? supportPlatformRaw : undefined;
  const csvEntry = formData.get('csv');

  if (!name) {
    return NextResponse.json(
      { ok: false, error: 'Your name is required.' },
      { status: 400 }
    );
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'A valid work email is required.' },
      { status: 400 }
    );
  }

  if (!companyName) {
    return NextResponse.json(
      { ok: false, error: 'Company name is required.' },
      { status: 400 }
    );
  }

  if (!supportPlatform) {
    return NextResponse.json(
      { ok: false, error: 'Support platform is required.' },
      { status: 400 }
    );
  }

  if (!(csvEntry instanceof File)) {
    return NextResponse.json(
      { ok: false, error: 'CSV file is required.' },
      { status: 400 }
    );
  }

  const csvFile = csvEntry;

  if (csvFile.size === 0) {
    return NextResponse.json(
      { ok: false, error: 'CSV file is empty.' },
      { status: 400 }
    );
  }

  if (csvFile.size > MAX_CSV_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `CSV file is too large (${(csvFile.size / (1024 * 1024)).toFixed(2)} MB). Maximum is 4 MB. Reduce the date range or column count, or email us directly.`,
      },
      { status: 413 }
    );
  }

  const lowerName = csvFile.name.toLowerCase();
  const looksLikeCsv =
    lowerName.endsWith('.csv') ||
    csvFile.type === 'text/csv' ||
    csvFile.type === 'application/csv' ||
    csvFile.type === 'application/vnd.ms-excel'; // some platforms tag CSVs this way
  if (!looksLikeCsv) {
    return NextResponse.json(
      { ok: false, error: 'File must be a CSV (.csv extension).' },
      { status: 400 }
    );
  }

  const sourcePage = optionalText(formData.get('sourcePage'));
  const sourceOffer = optionalText(formData.get('sourceOffer'));

  // Upload to Vercel Blob. Public blob URLs are unguessable, but anyone with the
  // URL can download the file until the cleanup job deletes it. Keep the cache
  // short because these are customer support exports, not public assets.
  const safeCompanySlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'unknown';
  const safeFilename = csvFile.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
  const blobPath = `gap-report-csvs/${Date.now()}-${safeCompanySlug}/${safeFilename}`;

  let blobUrl: string;
  try {
    const blob = await put(blobPath, csvFile, {
      access: 'public',
      addRandomSuffix: true,
      cacheControlMaxAge: 60,
      contentType: 'text/csv',
    });
    blobUrl = blob.url;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        error: `Upload failed. ${detail.slice(0, 240)}`,
      },
      { status: 500 }
    );
  }

  try {
    const result = await recordGapReportSubmission({
      name,
      email,
      companyName,
      supportPlatform,
      csvBlobUrl: blobUrl,
      csvFilename: csvFile.name,
      csvSizeBytes: csvFile.size,
      sourcePage,
      sourceOffer,
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
      {
        ok: false,
        error: `Submission recorded but notification failed. ${detail.slice(0, 240)}`,
      },
      { status: 500 }
    );
  }
}
