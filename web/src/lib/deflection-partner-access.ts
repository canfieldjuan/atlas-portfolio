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
export const DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS_ENV =
  'DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS';
export const DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM = 'partnerToken';

export function hasDeflectionPartnerPriceAccessToken(value: unknown) {
  const configuredTokens =
    checkoutRequirements.configuredDeflectionPartnerAccessTokens(process.env);
  const configuredSigningSecrets =
    checkoutRequirements.configuredDeflectionPartnerSigningSecrets(process.env);
  const signingSecrets = configuredSigningSecrets.length
    ? configuredSigningSecrets
    : configuredTokens;
  return partnerToken.hasDeflectionPartnerAccessToken(value, configuredTokens, {
    signingSecrets,
  });
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
