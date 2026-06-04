/* eslint-disable @typescript-eslint/no-require-imports */

const { createHmac, timingSafeEqual } = require('node:crypto');

const DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_ENV =
  'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN';
const DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX = 'partner_v1';

function cleanToken(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function configuredDeflectionPartnerAccessTokens(env = process.env) {
  return cleanToken(env[DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_ENV])
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

function constantTimeEquals(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodePayload(encoded) {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function signedTokenSignature(secret, encodedPayload) {
  return createHmac('sha256', secret)
    .update(`${DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX}.${encodedPayload}`)
    .digest('base64url');
}

function createDeflectionPartnerSignedAccessToken({
  secret,
  partner = 'partner',
  expiresAt,
} = {}) {
  const cleanedSecret = cleanToken(secret);
  const cleanedPartner = cleanToken(partner);
  const exp = Number(expiresAt);
  if (!cleanedSecret) {
    throw new Error('DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN is required.');
  }
  if (!cleanedPartner) {
    throw new Error('Partner name is required.');
  }
  if (!Number.isSafeInteger(exp) || exp <= nowSeconds()) {
    throw new Error('Expiration must be a future Unix timestamp in seconds.');
  }
  const encodedPayload = encodePayload({ partner: cleanedPartner, exp });
  const signature = signedTokenSignature(cleanedSecret, encodedPayload);
  return `${DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX}.${encodedPayload}.${signature}`;
}

function signedTokenMatches(candidate, configuredTokens, options = {}) {
  const parts = cleanToken(candidate).split('.');
  if (parts.length !== 3 || parts[0] !== DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX) {
    return false;
  }
  const [, encodedPayload, candidateSignature] = parts;
  if (!encodedPayload || !candidateSignature) {
    return false;
  }
  const payload = decodePayload(encodedPayload);
  const exp = Number(payload?.exp);
  const partner = cleanToken(payload?.partner);
  const currentSeconds = Number(options.nowSeconds ?? nowSeconds());
  if (!partner || !Number.isSafeInteger(exp) || exp <= currentSeconds) {
    return false;
  }

  let matched = false;
  for (const configured of configuredTokens) {
    const signature = signedTokenSignature(configured, encodedPayload);
    matched = constantTimeEquals(candidateSignature, signature) || matched;
  }
  return matched;
}

function directTokenMatches(candidate, configuredTokens) {
  let matched = false;
  for (const configured of configuredTokens) {
    matched = constantTimeEquals(candidate, configured) || matched;
  }
  return matched;
}

function hasDeflectionPartnerAccessToken(value, configuredTokens, options = {}) {
  const candidate = cleanToken(value);
  const tokens = Array.isArray(configuredTokens) ? configuredTokens.map(cleanToken).filter(Boolean) : [];
  if (!tokens.length || !candidate) {
    return false;
  }
  return directTokenMatches(candidate, tokens) || signedTokenMatches(candidate, tokens, options);
}

module.exports = {
  DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_ENV,
  DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX,
  configuredDeflectionPartnerAccessTokens,
  createDeflectionPartnerSignedAccessToken,
  hasDeflectionPartnerAccessToken,
};
