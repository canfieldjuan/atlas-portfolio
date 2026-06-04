import { timingSafeEqual } from 'node:crypto';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT_ID,
  DEFLECTION_PARTNER_PRICE_VARIANT_ID,
  type DeflectionPriceVariantId,
  resolveDeflectionPriceVariant,
} from './deflection-pricing';
import * as checkoutRequirements from './deflection-checkout-requirements';

export const DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_ENV =
  'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN';
export const DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM = 'partnerToken';

function cleanToken(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function constantTimeEquals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function hasDeflectionPartnerPriceAccessToken(value: unknown) {
  const candidate = cleanToken(value);
  const configuredTokens =
    checkoutRequirements.configuredDeflectionPartnerAccessTokens(process.env);
  if (!configuredTokens.length || !candidate) return false;
  let matched = false;
  for (const configured of configuredTokens) {
    matched = constantTimeEquals(candidate, configured) || matched;
  }
  return matched;
}

export function resolveIntakePriceVariantId(
  requestedPriceVariant: unknown,
  partnerAccessToken: unknown,
): DeflectionPriceVariantId {
  const requested = resolveDeflectionPriceVariant(requestedPriceVariant);
  if (
    requested?.id === DEFLECTION_PARTNER_PRICE_VARIANT_ID &&
    hasDeflectionPartnerPriceAccessToken(partnerAccessToken)
  ) {
    return DEFLECTION_PARTNER_PRICE_VARIANT_ID;
  }
  return DEFLECTION_DEFAULT_PRICE_VARIANT_ID;
}
