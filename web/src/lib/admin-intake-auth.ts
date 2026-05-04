import { createHash, timingSafeEqual } from 'node:crypto';

export const ADMIN_INTAKE_COOKIE = 'atlas_admin_intake';

// Context prefix on the cookie hash so the persisted value is bound to this auth surface
// and cannot be conflated with a generic SHA-256 of the same token used elsewhere.
const ADMIN_INTAKE_COOKIE_HASH_CONTEXT = 'atlas-admin-intake-cookie:v1:';

export function adminIntakeToken() {
  return process.env.ADMIN_INTAKE_TOKEN?.trim() || '';
}

export function adminIntakeConfigured() {
  return adminIntakeToken().length > 0;
}

// Used by the login route to validate the raw token submitted via form post.
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

// Returns the value to persist in the auth cookie. SHA-256 of a context-prefixed token,
// hex-encoded. One-way derived so an exfiltrated cookie does not reveal the underlying
// shared admin token. Bumping the context version (v1 → v2) invalidates all existing
// sessions on next deploy.
export function adminIntakeCookieValue() {
  const token = adminIntakeToken();
  if (!token) {
    return '';
  }
  return createHash('sha256').update(ADMIN_INTAKE_COOKIE_HASH_CONTEXT + token).digest('hex');
}

// Used by /admin/intake to validate the cookie value against the expected hash. The
// cookie carries the hash, never the raw token, so leaking the cookie does not leak the
// shared secret. Cookie still grants session access until expiry/logout — defense in
// depth; not a replacement for revocation.
export function verifyAdminIntakeCookie(candidate: string | undefined | null) {
  const expected = adminIntakeCookieValue();
  const actual = candidate?.trim() || '';
  if (!expected || !actual) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');
  if (expectedBuffer.length === 0 || expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
