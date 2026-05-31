import { NextResponse } from 'next/server';
import { fetchDeflectionArtifact } from '@/lib/atlas-deflection-client';

export const runtime = 'nodejs';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;

export async function GET(request: Request) {
  const requestId = new URL(request.url).searchParams.get('requestId') ?? '';
  if (!REQUEST_ID_RE.test(requestId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const result = await fetchDeflectionArtifact(requestId);
  if (result.ok) return NextResponse.json({ status: 'unlocked' });
  if (result.reason === 'locked') return NextResponse.json({ status: 'locked' });
  if (result.reason === 'not_found') {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }
  return NextResponse.json({ error: 'Report status unavailable.' }, { status: 503 });
}
