import {
  DEFLECTION_DEFAULT_PRICE_VARIANT_ID,
  DEFLECTION_PARTNER_PRICE_VARIANT_ID,
  type DeflectionPriceVariantId,
  resolveDeflectionPriceVariant,
} from './deflection-pricing';
import * as checkoutRequirements from './deflection-checkout-requirements';
import * as partnerToken from './deflection-partner-token';

export const DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_ENV =
  'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN';
export const DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM = 'partnerToken';

export function hasDeflectionPartnerPriceAccessToken(value: unknown) {
  const configuredTokens =
    checkoutRequirements.configuredDeflectionPartnerAccessTokens(process.env);
  return partnerToken.hasDeflectionPartnerAccessToken(value, configuredTokens);
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
