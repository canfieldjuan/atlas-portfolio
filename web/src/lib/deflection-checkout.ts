// SERVER-ONLY by convention — import this only from route handlers / server
// components, never a client component. It reads `ATLAS_SAAS_STRIPE_SECRET_KEY`
// and `ATLAS_ACCOUNT_ID` (non-NEXT_PUBLIC_ env vars, never bundled for the
// browser even if mis-imported).
//
// Creates the one-time $1,500 Backlog Report unlock as a Stripe Checkout
// Session, per ATLAS `content_ops_faq_deflection_checkout_contract.md`. The
// Stripe `checkout.session.completed` webhook (→ ATLAS) is the trust path that
// flips the report's paid flag; the portfolio never marks the report paid
// itself. We talk to Stripe's REST API directly (form-encoded) to avoid adding
// an SDK dependency, mirroring the fetch pattern in `atlas-deflection-client`.

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
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

function stripeConfig(): { secretKey: string; accountId: string } | null {
  const secretKey = process.env.ATLAS_SAAS_STRIPE_SECRET_KEY?.trim();
  const accountId = process.env.ATLAS_ACCOUNT_ID?.trim();
  if (!secretKey || !accountId) return null;
  return { secretKey, accountId };
}

// `origin` is the absolute site origin the route derives from the inbound
// request (e.g. https://juancanfield.com); used to build the post-checkout
// return URLs back to this report's results page.
export async function createDeflectionCheckoutSession(
  requestId: string,
  origin: string,
): Promise<CheckoutResult> {
  const config = stripeConfig();
  if (!config) return { ok: false, reason: 'not_configured' };
  if (!REQUEST_ID_RE.test(requestId)) return { ok: false, reason: 'invalid_request' };

  let base: string;
  try {
    base = new URL(origin).origin;
  } catch {
    return { ok: false, reason: 'invalid_request' };
  }
  const resultsUrl = `${base}${RESULTS_PATH}/${encodeURIComponent(requestId)}`;

  // The webhook is the trust path, so we don't need the session id echoed back —
  // the results page only re-probes GET /artifact. (Dropping `session_id` also
  // avoids the `{CHECKOUT_SESSION_ID}` literal-template pitfall in success_url.)
  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', `${resultsUrl}?checkout=success`);
  form.set('cancel_url', `${resultsUrl}?checkout=cancel`);
  form.set('line_items[0][quantity]', '1');
  form.set('line_items[0][price_data][currency]', 'usd');
  form.set('line_items[0][price_data][unit_amount]', String(UNIT_AMOUNT_CENTS));
  form.set(
    'line_items[0][price_data][product_data][name]',
    'Support Ticket Deflection — Backlog Report',
  );
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
        Authorization: `Bearer ${config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': STRIPE_API_VERSION,
        // Scoped per request id: a double-click or retry reuses the same session
        // instead of creating duplicates. (Stripe idempotency keys live ~24h.)
        'Idempotency-Key': `deflection-checkout-${requestId}`,
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
