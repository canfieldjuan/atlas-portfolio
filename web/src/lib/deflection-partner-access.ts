import { timingSafeEqual } from 'node:crypto';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT_ID,
  DEFLECTION_PARTNER_PRICE_VARIANT_ID,
  type DeflectionPriceVariantId,
  resolveDeflectionPriceVariant,
} from './deflection-pricing';

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
  const configured = cleanToken(process.env[DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_ENV]);
  const candidate = cleanToken(value);
  if (!configured || !candidate) return false;
  return constantTimeEquals(candidate, configured);
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
