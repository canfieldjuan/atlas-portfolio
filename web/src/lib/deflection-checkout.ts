// SERVER-ONLY by convention — import this only from route handlers / server
// components, never a client component. It reads `ATLAS_SAAS_STRIPE_RAK`
// (preferred), the test-mode fallback `ATLAS_SAAS_STRIPE_SECRET_KEY`, and
// `ATLAS_ACCOUNT_ID` (non-NEXT_PUBLIC_ env vars, never bundled for the
// browser even if mis-imported).
//
// Creates the one-time $1,500 Backlog Report unlock as a Stripe Checkout
// Session, per ATLAS `content_ops_faq_deflection_checkout_contract.md`. The
// Stripe `checkout.session.completed` webhook (→ ATLAS) is the trust path that
// flips the report's paid flag; the portfolio never marks the report paid
// itself. We talk to Stripe's REST API directly (form-encoded) to avoid adding
// an SDK dependency, mirroring the fetch pattern in `atlas-deflection-client`.

import { SITE_URL } from '@/lib/seo';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const ATTEMPT_ID_RE = /^[A-Za-z0-9._:-]{8,160}$/;
const PRICE_ID_RE = /^price_[A-Za-z0-9_]{8,}$/;
const FETCH_TIMEOUT_MS = 10_000;
const STRIPE_SESSIONS_URL = 'https://api.stripe.com/v1/checkout/sessions';
// Pin the Stripe API version so the response (and downstream event) shape can't
// drift when Stripe changes the account default. The official SDK pins this
// automatically; talking to the REST API directly, we set it ourselves.
const STRIPE_API_VERSION = '2026-05-27.dahlia';
// $1,500 one-time, in cents. The contract floor is 150000; we set exactly that.
// Server-set so the client can never lower the price.
const UNIT_AMOUNT_CENTS = 150_000;
const RESULTS_PATH = '/systems/support-ticket-deflection/results';

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'not_configured' | 'invalid_request' | 'error' };

type StripeCheckoutConfig = {
  apiKey: string;
  accountId: string;
  priceId: string | null;
};

function configuredPriceId() {
  const priceId = process.env.STRIPE_DEFLECTION_REPORT_PRICE_ID?.trim();
  if (!priceId) return null;
  if (!PRICE_ID_RE.test(priceId)) {
    console.error('stripe checkout create: configured price id is invalid');
    return null;
  }
  return priceId;
}

function stripeConfig(): StripeCheckoutConfig | null {
  const restrictedKey = process.env.ATLAS_SAAS_STRIPE_RAK?.trim();
  const legacyTestSecretKey = process.env.ATLAS_SAAS_STRIPE_SECRET_KEY?.trim();
  const accountId = process.env.ATLAS_ACCOUNT_ID?.trim();
  if (!accountId) return null;

  if (restrictedKey) {
    if (!restrictedKey.startsWith('rk_')) {
      console.error('stripe checkout create: restricted key must start with rk_');
      return null;
    }
    const priceId = configuredPriceId();
    if (!priceId) {
      console.error('stripe checkout create: configured price id is required for restricted keys');
      return null;
    }
    return { apiKey: restrictedKey, accountId, priceId };
  }

  if (!legacyTestSecretKey) return null;
  if (process.env.VERCEL_ENV === 'production') {
    console.error('stripe checkout create: restricted key is required in production');
    return null;
  }
  if (legacyTestSecretKey.startsWith('sk_live_')) {
    console.error('stripe checkout create: full live secret key is not accepted');
    return null;
  }
  if (!legacyTestSecretKey.startsWith('sk_test_')) {
    console.error('stripe checkout create: fallback secret key must be test-mode');
    return null;
  }

  return { apiKey: legacyTestSecretKey, accountId, priceId: configuredPriceId() };
}

export async function createDeflectionCheckoutSession(
  requestId: string,
  attemptId: string,
): Promise<CheckoutResult> {
  const config = stripeConfig();
  if (!config) return { ok: false, reason: 'not_configured' };
  if (!REQUEST_ID_RE.test(requestId) || !ATTEMPT_ID_RE.test(attemptId)) {
    return { ok: false, reason: 'invalid_request' };
  }

  const resultsUrl = `${SITE_URL}${RESULTS_PATH}/${encodeURIComponent(requestId)}`;

  // The webhook is the trust path, so we don't need the session id echoed back —
  // the results page only re-probes GET /artifact. (Dropping `session_id` also
  // avoids the `{CHECKOUT_SESSION_ID}` literal-template pitfall in success_url.)
  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', `${resultsUrl}?checkout=success`);
  form.set('cancel_url', `${resultsUrl}?checkout=cancel`);
  form.set('line_items[0][quantity]', '1');
  if (config.priceId) {
    form.set('line_items[0][price]', config.priceId);
  } else {
    form.set('line_items[0][price_data][currency]', 'usd');
    form.set('line_items[0][price_data][unit_amount]', String(UNIT_AMOUNT_CENTS));
    form.set(
      'line_items[0][price_data][product_data][name]',
      'Support Ticket Deflection — Backlog Report',
    );
  }
  // ATLAS reads these three off the session in its webhook handler.
  form.set('metadata[source]', 'content_ops_deflection_report');
  form.set('metadata[account_id]', config.accountId);
  form.set('metadata[request_id]', requestId);

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
    const session = (await res.json()) as { url?: unknown };
    if (typeof session.url !== 'string' || !session.url) {
      console.error('stripe checkout create: missing session url');
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
