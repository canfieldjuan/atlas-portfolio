import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_INTAKE_COOKIE } from '@/lib/admin-intake-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin/intake', request.url), { status: 303 });
  response.cookies.delete({
    name: ADMIN_INTAKE_COOKIE,
    path: '/admin',
  });

  return response;
}
