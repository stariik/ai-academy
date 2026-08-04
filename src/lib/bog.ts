// ============================================================
// Bank of Georgia — e-commerce payments client
//
// Three calls, per https://api.bog.ge/docs/en/payments :
//   1. getToken()        — OAuth client_credentials → Bearer token
//   2. createOrder()     — hosted-payment order → redirect link
//   3. verifyCallback()  — RSA-SHA256 check of the webhook signature
//
// Credentials come from BOG_CLIENT_ID / BOG_CLIENT_SECRET. For the
// test environment use the Test Public Key (client_id) + Test Secret
// Key (client_secret).
//
// Every call here goes through bogFetch(), which records the request and
// the response in `payment_logs` — success or failure — so /admin/payments
// can show what we sent and what came back for any payment.
// ============================================================

import 'server-only';
import { createVerify } from 'node:crypto';
import { logPaymentEvent, type PaymentEvent } from '@/lib/payment-log';

const TOKEN_URL = 'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';
const ORDERS_URL = 'https://api.bog.ge/payments/v1/ecommerce/orders';
const RECEIPT_URL = 'https://api.bog.ge/payments/v1/receipt'; // GET :order_id

// BOG's published callback-signing public key (SHA256withRSA). Static.
const BOG_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQhzHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrrTYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhxtcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPnPwIDAQAB
-----END PUBLIC KEY-----`;

function creds() {
  const id = process.env.BOG_CLIENT_ID;
  const secret = process.env.BOG_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error('BOG_CLIENT_ID / BOG_CLIENT_SECRET missing — required for checkout');
  }
  return { id, secret };
}

/** What a logged call belongs to, so the admin view can group by payment. */
export type BogLogCtx = { paymentId?: string | null; bogOrderId?: string | null };

/** BOG speaks JSON, but error bodies are sometimes plain text — keep either. */
function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Short, safe response excerpt for the thrown Error message. */
function excerpt(value: unknown): string {
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  return !s ? '' : s.length > 300 ? `${s.slice(0, 300)}…` : s;
}

/**
 * One BOG HTTP call, logged both ways. Returns the parsed response body on
 * 2xx and throws on anything else — the log row is written before the throw,
 * so a failure is never invisible. Logging itself can't throw.
 *
 * Auth headers are redacted by src/lib/payment-log.ts, not here.
 */
async function bogFetch(
  event: PaymentEvent,
  ctx: BogLogCtx,
  url: string,
  init: { method?: string; headers: Record<string, string>; body?: string },
): Promise<unknown> {
  const started = Date.now();
  const request = {
    method: init.method ?? 'GET',
    url,
    headers: init.headers,
    body: init.body === undefined ? null : parseBody(init.body),
  };

  let httpStatus: number | null = null;
  let response: unknown = null;
  let error: string | null = null;

  try {
    const res = await fetch(url, init);
    httpStatus = res.status;
    response = parseBody(await res.text());
    if (!res.ok) error = `HTTP ${res.status} ${excerpt(response)}`.trim();
  } catch (err) {
    // Network-level failure — no status, no body.
    error = err instanceof Error ? err.message : String(err);
  }

  await logPaymentEvent({
    event,
    paymentId: ctx.paymentId,
    bogOrderId: ctx.bogOrderId,
    ok: error === null,
    httpStatus,
    request,
    response,
    error,
    durationMs: Date.now() - started,
  });

  if (error) throw new Error(`BOG ${event} failed: ${error}`);
  return response;
}

// ponytail: fetch a fresh token per checkout. Caching the ~1h token only
// matters at volume we don't have; add it when token calls show up hot.
async function getToken(ctx: BogLogCtx): Promise<string> {
  const { id, secret } = creds();
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const data = (await bogFetch('token', ctx, TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: 'grant_type=client_credentials',
  })) as { access_token?: string } | null;

  if (!data?.access_token) throw new Error('BOG token: no access_token in response');
  return data.access_token;
}

export type CreateOrderInput = {
  externalOrderId: string; // our payments.id
  amountGel: number; // major units, e.g. 0.77
  callbackUrl: string;
  successUrl: string;
  failUrl: string;
  product: { id: string; title: string };
};

export async function createOrder(
  input: CreateOrderInput,
): Promise<{ orderId: string; redirectUrl: string }> {
  // externalOrderId IS our payments.id, so both calls below attribute to it.
  const ctx: BogLogCtx = { paymentId: input.externalOrderId };
  const token = await getToken(ctx);

  const data = (await bogFetch('create_order', ctx, ORDERS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Accept-Language': 'ka',
    },
    body: JSON.stringify({
      callback_url: input.callbackUrl,
      external_order_id: input.externalOrderId,
      purchase_units: {
        currency: 'GEL',
        total_amount: input.amountGel,
        basket: [
          { quantity: 1, unit_price: input.amountGel, product_id: input.product.id },
        ],
      },
      redirect_urls: { success: input.successUrl, fail: input.failUrl },
    }),
  })) as { id?: string; _links?: { redirect?: { href?: string } } } | null;

  const redirectUrl = data?._links?.redirect?.href;
  if (!data?.id || !redirectUrl) throw new Error('BOG create order: missing id/redirect link');
  return { orderId: data.id, redirectUrl };
}

/**
 * Read the current status of an order. Used to reconcile a payment when the
 * webhook was missed (BOG's docs recommend this as the callback fallback).
 * Returns order_status.key ('completed' | 'rejected' | 'refunded' | …) and
 * external_order_id so the caller can confirm it's the payment it expects.
 */
export async function getPaymentDetails(
  orderId: string,
  paymentId?: string | null,
): Promise<{ statusKey?: string; externalOrderId?: string }> {
  const ctx: BogLogCtx = { paymentId, bogOrderId: orderId };
  const token = await getToken(ctx);

  const data = (await bogFetch('status_lookup', ctx, `${RECEIPT_URL}/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })) as { external_order_id?: string; order_status?: { key?: string } } | null;

  return { statusKey: data?.order_status?.key, externalOrderId: data?.external_order_id };
}

/**
 * Full refund of a completed order.
 * Per https://api.bog.ge/docs/payments/refund — POST /payment/refund/:order_id.
 * We intentionally omit `amount`: the docs require omitting it for a full
 * refund, and sending our requested amount would exceed transfer_amount (and
 * be rejected) whenever a bank/network discount reduced what the card paid.
 * Throws on any BOG error; caller must not touch local state if this throws.
 */
export async function refundOrder(orderId: string, paymentId?: string | null): Promise<void> {
  const ctx: BogLogCtx = { paymentId, bogOrderId: orderId };
  const token = await getToken(ctx);

  await bogFetch('refund', ctx, `https://api.bog.ge/payments/v1/payment/refund/${orderId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: '{}',
  });
}

/**
 * Verify the `Callback-Signature` header against the raw (unparsed) request
 * body. Must run before JSON.parse so the byte order is exactly what BOG
 * signed. Returns false on any error — caller rejects unverified callbacks.
 */
export function verifyCallback(rawBody: string, signatureB64: string): boolean {
  if (!signatureB64) return false;
  try {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(rawBody);
    verifier.end();
    return verifier.verify(BOG_PUBLIC_KEY, signatureB64, 'base64');
  } catch {
    return false;
  }
}
