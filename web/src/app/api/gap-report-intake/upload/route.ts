import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { parseGapReportMetadata } from '@/lib/gap-report-intake';

export const runtime = 'nodejs';

// 50 MB is an honest bound for 3-6 month support-ticket exports (vs the old
// 4 MB serverless-body ceiling); generous for the offer, still capped against
// abuse on this open endpoint. Vercel Blob supports far larger, but we don't.
const MAX_CSV_BYTES = 50 * 1024 * 1024;
// The metadata JSON is tiny; reject anything that isn't, before JSON.parse.
const MAX_CLIENT_PAYLOAD_BYTES = 4 * 1024;
const CSV_CONTENT_TYPES = ['text/csv', 'application/csv', 'application/vnd.ms-excel'];

// Issues a short-lived client-upload token for a direct browser -> Vercel Blob
// upload. Validation happens HERE (before a token is minted) so we never mint a
// token for an invalid submission; the file is recorded separately by /record.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith('gap-report-csvs/')) {
          throw new Error('Unexpected upload path.');
        }
        if (clientPayload && clientPayload.length > MAX_CLIENT_PAYLOAD_BYTES) {
          throw new Error('Submission metadata is too large.');
        }
        let parsed: unknown;
        try {
          parsed = clientPayload ? JSON.parse(clientPayload) : null;
        } catch {
          throw new Error('Invalid submission metadata.');
        }
        const meta = parseGapReportMetadata(parsed);
        if (!meta.ok) throw new Error(meta.error);

        return {
          allowedContentTypes: CSV_CONTENT_TYPES,
          maximumSizeInBytes: MAX_CSV_BYTES,
          addRandomSuffix: true,
          // Carried to /record via the client; re-validated there before persisting.
          tokenPayload: JSON.stringify(meta.value),
        };
      },
    });

    return NextResponse.json(json);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Upload authorization failed.';
    return NextResponse.json({ error: detail }, { status: 400 });
  }
}
