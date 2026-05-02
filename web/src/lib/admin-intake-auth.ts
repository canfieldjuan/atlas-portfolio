import { timingSafeEqual } from 'node:crypto';

export const ADMIN_INTAKE_COOKIE = 'atlas_admin_intake';

export function adminIntakeToken() {
  return process.env.ADMIN_INTAKE_TOKEN?.trim() || '';
}

export function adminIntakeConfigured() {
  return adminIntakeToken().length > 0;
}

export function verifyAdminIntakeToken(candidate: string | undefined | null) {
  const expected = adminIntakeToken();
  const actual = candidate?.trim() || '';
  if (!expected || !actual) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
