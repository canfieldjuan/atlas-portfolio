// SERVER-ONLY by convention — import this only from route handlers / server
// components, never a client component. It reads `ATLAS_SAAS_STRIPE_RAK`
// (preferred), the test-mode fallback `ATLAS_SAAS_STRIPE_SECRET_KEY`, and
// `ATLAS_ACCOUNT_ID` (non-NEXT_PUBLIC_ env vars, never bundled for the
// browser even if mis-imported).
//
// Creates the one-time Backlog Report unlock as a Stripe Checkout
// Session, per ATLAS `content_ops_faq_deflection_checkout_contract.md`. The
// Stripe `checkout.session.completed` webhook (→ ATLAS) is the trust path that
// flips the report's paid flag; the portfolio never marks the report paid
// itself. We talk to Stripe's REST API directly (form-encoded) to avoid adding
// an SDK dependency, mirroring the fetch pattern in `atlas-deflection-client`.

import { SITE_URL } from '@/lib/seo';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT,
  type DeflectionPriceVariant,
  type DeflectionPriceVariantId,
  resolveDeflectionPriceVariant,
} from '@/lib/deflection-pricing';
import * as checkoutRequirements from '@/lib/deflection-checkout-requirements';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const ATTEMPT_ID_RE = /^[A-Za-z0-9._:-]{8,160}$/;
const FETCH_TIMEOUT_MS = 10_000;
const STRIPE_SESSIONS_URL = 'https://api.stripe.com/v1/checkout/sessions';
// Pin the Stripe API version so the response (and downstream event) shape can't
// drift when Stripe changes the account default. The official SDK pins this
// automatically; talking to the REST API directly, we set it ourselves.
const STRIPE_API_VERSION = '2026-05-27.dahlia';
const DEFAULT_PRICE_VARIANT = DEFLECTION_DEFAULT_PRICE_VARIANT;
const RESULTS_PATH = '/systems/support-ticket-deflection/results';

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'not_configured' | 'invalid_request' | 'error' };

type StripeCheckoutConfig = {
  apiKey: string;
  accountId: string;
  priceId: string | null;
  allowedAmountsCents: ReadonlySet<number>;
};

type StripeCheckoutSessionResponse = {
  url?: unknown;
  amount_total?: unknown;
  currency?: unknown;
};

function stripeConfig(priceVariant: DeflectionPriceVariant): StripeCheckoutConfig | null {
  const resolved = checkoutRequirements.resolveDeflectionCheckoutRuntimeConfig(
    process.env,
    priceVariant,
    {
      environment: process.env.VERCEL_ENV,
    },
  );
  if (!resolved.ok) {
    if (resolved.message) {
      console.error(`stripe checkout create: ${resolved.message}`);
    }
    return null;
  }
  if (!resolved.config) return null;
  return resolved.config;
}

function isAllowedCheckoutSession(
  session: StripeCheckoutSessionResponse,
  priceVariant: DeflectionPriceVariant,
): session is StripeCheckoutSessionResponse & { url: string } {
  if (typeof session.url !== 'string' || !session.url) {
    console.error('stripe checkout create: missing session url');
    return false;
  }
  const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : Number.NaN;
  if (!Number.isSafeInteger(amountTotal)) {
    console.error('stripe checkout create: missing session amount');
    return false;
  }
  if (amountTotal !== priceVariant.amountCents) {
    console.error('stripe checkout create: session amount does not match selected variant');
    return false;
  }
  if (typeof session.currency !== 'string' || session.currency.toLowerCase() !== 'usd') {
    console.error('stripe checkout create: session currency is not allowed');
    return false;
  }
  return true;
}

function checkoutReturnUrl(
  requestId: string,
  checkout: 'success' | 'cancel',
  priceVariant: DeflectionPriceVariant,
) {
  const params = new URLSearchParams({ checkout });
  if (priceVariant.id !== DEFAULT_PRICE_VARIANT.id) {
    params.set('priceVariant', priceVariant.id);
  }
  return `${SITE_URL}${RESULTS_PATH}/${encodeURIComponent(requestId)}?${params.toString()}`;
}

export async function createDeflectionCheckoutSession(
  requestId: string,
  attemptId: string,
  priceVariantId: DeflectionPriceVariantId = DEFAULT_PRICE_VARIANT.id,
): Promise<CheckoutResult> {
  const priceVariant = resolveDeflectionPriceVariant(priceVariantId);
  if (!priceVariant) return { ok: false, reason: 'invalid_request' };

  const config = stripeConfig(priceVariant);
  if (!config) return { ok: false, reason: 'not_configured' };
  if (!REQUEST_ID_RE.test(requestId) || !ATTEMPT_ID_RE.test(attemptId)) {
    return { ok: false, reason: 'invalid_request' };
  }

  // The webhook is the trust path, so we don't need the session id echoed back —
  // the results page only re-probes GET /artifact. (Dropping `session_id` also
  // avoids the `{CHECKOUT_SESSION_ID}` literal-template pitfall in success_url.)
  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', checkoutReturnUrl(requestId, 'success', priceVariant));
  form.set('cancel_url', checkoutReturnUrl(requestId, 'cancel', priceVariant));
  form.set('line_items[0][quantity]', '1');
  if (config.priceId) {
    form.set('line_items[0][price]', config.priceId);
  } else {
    form.set('line_items[0][price_data][currency]', 'usd');
    form.set('line_items[0][price_data][unit_amount]', String(priceVariant.amountCents));
    form.set(
      'line_items[0][price_data][product_data][name]',
      priceVariant.stripeProductName,
    );
  }
  // ATLAS reads source/account_id/request_id off the session in its webhook
  // handler. Price metadata is attribution for the variant selected here.
  form.set('metadata[source]', 'content_ops_deflection_report');
  form.set('metadata[account_id]', config.accountId);
  form.set('metadata[request_id]', requestId);
  form.set('metadata[price_variant]', priceVariant.metadataValue);
  setPriceMetadata(form, config, priceVariant);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(STRIPE_SESSIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': STRIPE_API_VERSION,
        // Scoped per click attempt: concurrent retries reuse the same session,
        // while later explicit retries can recover from a cached Stripe failure.
        'Idempotency-Key': `deflection-checkout-${requestId}-${attemptId}`,
      },
      body: form.toString(),
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) {
      // Log status only — never the secret key or Stripe's error body.
      console.error(`stripe checkout create failed: HTTP ${res.status}`);
      return { ok: false, reason: 'error' };
    }
    const session = (await res.json()) as StripeCheckoutSessionResponse;
    if (!isAllowedCheckoutSession(session, priceVariant)) {
      return { ok: false, reason: 'error' };
    }
    return { ok: true, url: session.url };
  } catch (err) {
    console.error('stripe checkout create error:', err instanceof Error ? err.message : err);
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

function setPriceMetadata(
  form: URLSearchParams,
  config: StripeCheckoutConfig,
  priceVariant: DeflectionPriceVariant,
) {
  if (config.priceId) {
    form.set('metadata[price_id]', config.priceId);
    return;
  }
  form.set('metadata[price_amount_cents]', String(priceVariant.amountCents));
}
