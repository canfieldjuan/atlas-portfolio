export const DEFLECTION_CHECKOUT_DIAGNOSTIC_KEY = 'atlas:deflection-checkout:last';

export type DeflectionCheckoutDiagnosticPhase = 'checkout_response' | 'checkout_redirect';

export type DeflectionCheckoutDiagnosticInput = {
  phase: DeflectionCheckoutDiagnosticPhase;
  requestId: string;
  attemptId: string;
  elapsedMs?: number;
  responseOk?: boolean;
  responseStatus?: number;
  alreadyPaid?: boolean;
  error?: string;
  url?: string;
};

export type DeflectionCheckoutDiagnostic = {
  source: 'deflection_checkout';
  phase: DeflectionCheckoutDiagnosticPhase;
  requestIdTail: string;
  attemptIdTail: string;
  elapsedMs?: number;
  responseOk?: boolean;
  responseStatus?: number;
  alreadyPaid?: boolean;
  hasUrl: boolean;
  checkoutUrlOrigin?: string;
  checkoutUrlHost?: string;
  checkoutUrlPathPrefix?: string;
  isStripeCheckoutUrl?: boolean;
  error?: string;
};

type CheckoutUrlSummary = Pick<
  DeflectionCheckoutDiagnostic,
  'checkoutUrlOrigin' | 'checkoutUrlHost' | 'checkoutUrlPathPrefix' | 'isStripeCheckoutUrl'
>;

export function buildDeflectionCheckoutDiagnostic(
  input: DeflectionCheckoutDiagnosticInput,
): DeflectionCheckoutDiagnostic {
  const urlSummary = summarizeCheckoutUrl(input.url);
  return {
    source: 'deflection_checkout',
    phase: input.phase,
    requestIdTail: tail(input.requestId),
    attemptIdTail: tail(input.attemptId),
    elapsedMs: typeof input.elapsedMs === 'number' ? Math.max(0, Math.round(input.elapsedMs)) : undefined,
    responseOk: input.responseOk,
    responseStatus: input.responseStatus,
    alreadyPaid: input.alreadyPaid,
    hasUrl: typeof input.url === 'string' && input.url.length > 0,
    ...urlSummary,
    error: input.error ? bound(input.error, 120) : undefined,
  };
}

export function recordDeflectionCheckoutDiagnostic(
  diagnostic: DeflectionCheckoutDiagnostic,
): void {
  const label = `deflection_checkout:${diagnostic.phase}`;
  console.info(label, diagnostic);
  try {
    window.sessionStorage.setItem(DEFLECTION_CHECKOUT_DIAGNOSTIC_KEY, JSON.stringify(diagnostic));
  } catch {
    // Some locked-down browsers disable sessionStorage; the console checkpoint is enough.
  }
}

function summarizeCheckoutUrl(url: string | undefined): CheckoutUrlSummary {
  if (!url) return {};
  try {
    const parsed = new URL(url);
    return {
      checkoutUrlOrigin: parsed.origin,
      checkoutUrlHost: parsed.hostname,
      checkoutUrlPathPrefix: bound(parsed.pathname, 48),
      isStripeCheckoutUrl: parsed.hostname === 'checkout.stripe.com',
    };
  } catch {
    return {
      isStripeCheckoutUrl: false,
    };
  }
}

function tail(value: string): string {
  return value.slice(-8);
}

function bound(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}
