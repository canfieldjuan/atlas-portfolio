#!/usr/bin/env node

import partnerTokens from '../src/lib/deflection-partner-token.js';
import { failCommand, isBareFlag, parseArgs } from './ads-cli-helpers.mjs';
import { loadLocalEnv } from './local-env.mjs';

const {
  DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS_ENV,
  createDeflectionPartnerSignedAccessToken,
  configuredDeflectionPartnerSigningSecrets,
} = partnerTokens;
const DEFAULT_TTL_DAYS = 30;

function usage() {
  console.log(`Usage: npm --prefix web run create:deflection-partner-token -- --partner acme --ttl-days ${DEFAULT_TTL_DAYS}`);
}

function parsePositiveNumber(value, name) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return parsed;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const outputJson = parsed.flags.has('--json');
  if (parsed.flags.has('--help') || parsed.flags.has('-h')) {
    usage();
    return;
  }
  for (const name of ['--partner', '--ttl-days', '--expires-at']) {
    if (isBareFlag(parsed, name)) {
      failCommand(`Refusing to continue without ${name} <value>.`, outputJson);
    }
  }
  if (!parsed.flags.has('--no-local-env')) {
    await loadLocalEnv();
  }

  const partner = String(parsed.values.get('--partner') || 'partner').trim();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = parsed.values.has('--expires-at')
    ? Math.floor(parsePositiveNumber(parsed.values.get('--expires-at'), '--expires-at'))
    : nowSeconds +
      Math.round(parsePositiveNumber(parsed.values.get('--ttl-days') || DEFAULT_TTL_DAYS, '--ttl-days') * 86400);
  const secrets = configuredDeflectionPartnerSigningSecrets(process.env);
  if (!secrets.length) {
    failCommand(
      `Missing ${DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS_ENV}; configure at least one signing secret.`,
      outputJson,
    );
  }

  try {
    const token = createDeflectionPartnerSignedAccessToken({
      secret: secrets[secrets.length - 1],
      partner,
      expiresAt,
    });
    if (outputJson) {
      console.log(JSON.stringify({ ok: true, partner, expiresAt, token }, null, 2));
    } else {
      console.log(token);
    }
  } catch (error) {
    failCommand(error instanceof Error ? error.message : String(error), outputJson);
  }
}

await main();
