import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_INTAKE_COOKIE,
  adminIntakeCookieValue,
  verifyAdminIntakeCredentials,
} from '@/lib/admin-intake-auth';
import {
  checkAdminIntakeLoginRateLimit,
  clearAdminIntakeLoginFailures,
  recordAdminIntakeLoginFailure,
} from '@/lib/admin-intake-rate-limit';

export const runtime = 'nodejs';

function redirectToIntake(request: NextRequest, error?: 'invalid' | 'rate_limited', retryAfterSeconds?: number) {
  const destination = new URL('/admin/intake', request.url);
  if (error) {
    destination.searchParams.set('error', error);
  }

  const response = NextResponse.redirect(destination, { status: 303 });
  if (retryAfterSeconds) {
    response.headers.set('Retry-After', String(retryAfterSeconds));
  }
  return response;
}

export async function POST(request: NextRequest) {
  const rateLimit = checkAdminIntakeLoginRateLimit(request.headers);
  if (!rateLimit.ok) {
    return redirectToIntake(request, 'rate_limited', rateLimit.retryAfterSeconds);
  }

  recordAdminIntakeLoginFailure(request.headers);
  const formData = await request.formData();
  const adminId = String(formData.get('adminId') || '');
  const token = String(formData.get('token') || '');
  const session = verifyAdminIntakeCredentials(adminId, token);

  if (!session) {
    return redirectToIntake(request, 'invalid');
  }

  clearAdminIntakeLoginFailures(request.headers);
  const response = redirectToIntake(request);
  const cookieValue = adminIntakeCookieValue(session);
  if (!cookieValue) {
    return redirectToIntake(request, 'invalid');
  }

  // Persist a signed named-admin session, not the submitted token.
  response.cookies.set(ADMIN_INTAKE_COOKIE, cookieValue, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: '/admin',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
