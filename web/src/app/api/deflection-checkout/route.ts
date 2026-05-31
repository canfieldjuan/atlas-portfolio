import { NextResponse } from 'next/server';
import { createDeflectionCheckoutSession } from '@/lib/deflection-checkout';
import { fetchDeflectionArtifact } from '@/lib/atlas-deflection-client';

export const runtime = 'nodejs';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const ATTEMPT_ID_RE = /^[A-Za-z0-9._:-]{8,160}$/;

// Creates a Stripe Checkout Session for the $1,500 Backlog Report unlock and
// returns its hosted URL for the client to redirect to. Before charging, we
// probe the paid-gated artifact:
//   200 (already unlocked) -> { alreadyPaid: true }  (don't double-charge)
//   404 (no such report)   -> 404                    (don't sell a phantom)
//   403 (exists, unpaid)   -> create the session     (the expected path)
//   error/not_configured   -> 503                    (could be already paid but
//     unparsable; fail closed rather than risk a duplicate charge)
export async function POST(request: Request) {
  let requestId: string;
  let attemptId: string;
  try {
    const body = (await request.json()) as { requestId?: unknown; attemptId?: unknown };
    if (
      typeof body.requestId !== 'string' ||
      !REQUEST_ID_RE.test(body.requestId) ||
      typeof body.attemptId !== 'string' ||
      !ATTEMPT_ID_RE.test(body.attemptId)
    ) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    requestId = body.requestId;
    attemptId = body.attemptId;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const artifact = await fetchDeflectionArtifact(requestId);
  if (artifact.ok) return NextResponse.json({ alreadyPaid: true });
  if (artifact.reason === 'not_found') {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }
  if (artifact.reason !== 'locked') {
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 503 },
    );
  }

  const result = await createDeflectionCheckoutSession(requestId, attemptId);
  if (!result.ok) {
    const status = result.reason === 'invalid_request' ? 400 : 500;
    return NextResponse.json({ error: 'Could not start checkout.' }, { status });
  }
  return NextResponse.json({ url: result.url });
}
