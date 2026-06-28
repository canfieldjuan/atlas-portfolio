import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_INTAKE_COOKIE = 'atlas_admin_intake';

export type AdminIntakeSession = {
  actorId: string;
  actorKind: 'named_admin';
};

type AdminIntakeUser = {
  id: string;
  tokenHash: string;
};

const ADMIN_ID_RE = /^[a-zA-Z0-9_.-]{1,80}$/;
const SHA256_HEX_RE = /^[a-f0-9]{64}$/i;
const COOKIE_VERSION = 'v2';
const COOKIE_SIGNING_CONTEXT = 'atlas-admin-intake-cookie-signing:v2:';
const MIN_SESSION_SIGNING_SECRET_LENGTH = 32;

function adminIntakeUsersConfig() {
  return process.env.ADMIN_INTAKE_USERS?.trim() || '';
}

function adminSessionSigningSecret() {
  return process.env.ADMIN_SESSION_SIGNING_SECRET?.trim() || '';
}

function parseAdminIntakeUsers() {
  const config = adminIntakeUsersConfig();
  const users: AdminIntakeUser[] = [];
  if (!config) return users;

  for (const entry of config.split(/[,\n]+/)) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex <= 0) continue;

    const id = trimmed.slice(0, separatorIndex).trim();
    const tokenHash = trimmed.slice(separatorIndex + 1).trim().toLowerCase();
    if (!ADMIN_ID_RE.test(id) || !SHA256_HEX_RE.test(tokenHash)) continue;

    users.push({ id, tokenHash });
  }

  return users;
}

function findAdminIntakeUser(actorId: string) {
  const requestedId = actorId.trim();
  return parseAdminIntakeUsers().find((user) => user.id === requestedId) || null;
}

function tokenHash(candidate: string) {
  return createHash('sha256').update(candidate.trim()).digest('hex');
}

function safeEqualHex(expectedHex: string, actualHex: string) {
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');
  if (expected.length === 0 || expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function cookieSigningSecret() {
  const signingSecret = adminSessionSigningSecret();
  const material = parseAdminIntakeUsers()
    .map((user) => `${user.id}:${user.tokenHash}`)
    .sort()
    .join('|');
  if (!material || signingSecret.length < MIN_SESSION_SIGNING_SECRET_LENGTH) return null;
  return createHmac('sha256', signingSecret).update(COOKIE_SIGNING_CONTEXT + material).digest();
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload: string) {
  const secret = cookieSigningSecret();
  if (!secret) return '';
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqualString(expectedValue: string, actualValue: string) {
  const expected = Buffer.from(expectedValue);
  const actual = Buffer.from(actualValue);
  if (expected.length === 0 || expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function adminIntakeConfigured() {
  return parseAdminIntakeUsers().length > 0 &&
    adminSessionSigningSecret().length >= MIN_SESSION_SIGNING_SECRET_LENGTH;
}

// Used by the login route to validate the raw admin id + token submitted via form post.
export function verifyAdminIntakeCredentials(
  actorId: string | undefined | null,
  candidateToken: string | undefined | null,
): AdminIntakeSession | null {
  const user = actorId ? findAdminIntakeUser(actorId) : null;
  const actualToken = candidateToken?.trim() || '';
  if (!user || !actualToken) return null;

  if (!safeEqualHex(user.tokenHash, tokenHash(actualToken))) return null;

  return {
    actorId: user.id,
    actorKind: 'named_admin',
  };
}

// Returns the signed session cookie value. The cookie carries the admin id, never
// the submitted token, and is invalidated when configured admin hashes rotate.
export function adminIntakeCookieValue(session: AdminIntakeSession) {
  if (!ADMIN_ID_RE.test(session.actorId) || session.actorKind !== 'named_admin') return '';

  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = signPayload(payload);
  if (!signature) return '';

  return `${COOKIE_VERSION}.${payload}.${signature}`;
}

// Used by admin routes to validate the cookie and recover the named admin actor.
export function verifyAdminIntakeCookie(candidate: string | undefined | null): AdminIntakeSession | null {
  const actual = candidate?.trim() || '';
  const [version, payload, signature] = actual.split('.');
  if (version !== COOKIE_VERSION || !payload || !signature) return null;

  const expectedSignature = signPayload(payload);
  if (!safeEqualString(expectedSignature, signature)) return null;

  let parsed: Partial<AdminIntakeSession>;
  try {
    parsed = JSON.parse(base64UrlDecode(payload)) as Partial<AdminIntakeSession>;
  } catch {
    return null;
  }

  if (parsed.actorKind !== 'named_admin' || !parsed.actorId || !ADMIN_ID_RE.test(parsed.actorId)) {
    return null;
  }

  const user = findAdminIntakeUser(parsed.actorId);
  if (!user) return null;

  return {
    actorId: user.id,
    actorKind: 'named_admin',
  };
}
