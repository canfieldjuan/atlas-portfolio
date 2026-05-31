import { get } from '@vercel/blob';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ADMIN_INTAKE_COOKIE,
  verifyAdminIntakeCookie,
} from '@/lib/admin-intake-auth';
import { gapReportBlobToken, gapReportBlobTokens } from '@/lib/gap-report-intake';
import { getGapReportSubmissionByRequestId } from '@/lib/gap-report-intake-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function attachmentFilename(filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'support-tickets.csv';
  return safe.toLowerCase().endsWith('.csv') ? safe : `${safe}.csv`;
}

async function getPrivateCsvBlob(url: string) {
  const tokens = gapReportBlobTokens();
  const readTokens = tokens.length > 0 ? tokens : [gapReportBlobToken()];
  let lastError: unknown;

  for (const token of readTokens) {
    try {
      const blob = await get(url, {
        access: 'private',
        token,
        useCache: false,
      });
      if (blob && blob.statusCode === 200 && blob.stream) return blob;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const isAuthorized = verifyAdminIntakeCookie(cookieStore.get(ADMIN_INTAKE_COOKIE)?.value);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { requestId } = await context.params;
  if (!UUID_RE.test(requestId)) {
    return NextResponse.json({ error: 'Invalid request id.' }, { status: 400 });
  }

  const submission = await getGapReportSubmissionByRequestId(requestId);
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
  }

  const blob = await getPrivateCsvBlob(submission.csvBlobUrl);

  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return NextResponse.json({ error: 'CSV blob not found.' }, { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', blob.blob.contentType || 'text/csv');
  headers.set(
    'Content-Disposition',
    `attachment; filename="${attachmentFilename(submission.csvFilename)}"`
  );
  headers.set('Cache-Control', 'no-store');

  return new Response(blob.stream, { status: 200, headers });
}
