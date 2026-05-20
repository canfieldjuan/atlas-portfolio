import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredGapReportData } from '@/lib/gap-report-cleanup';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not configured.' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const result = await cleanupExpiredGapReportData();
  return NextResponse.json({
    ok: result.errors.length === 0,
    ...result,
  });
}
