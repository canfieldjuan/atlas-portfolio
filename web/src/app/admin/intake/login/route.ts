import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_INTAKE_COOKIE, verifyAdminIntakeToken } from '@/lib/admin-intake-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = String(formData.get('token') || '');
  const destination = new URL('/admin/intake', request.url);

  if (!verifyAdminIntakeToken(token)) {
    destination.searchParams.set('error', 'invalid');
    return NextResponse.redirect(destination, { status: 303 });
  }

  const response = NextResponse.redirect(destination, { status: 303 });
  response.cookies.set(ADMIN_INTAKE_COOKIE, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: '/admin',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
