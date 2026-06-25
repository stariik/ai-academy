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
// ============================================================

import 'server-only';
import { createVerify } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';
const ORDERS_URL = 'https://api.bog.ge/payments/v1/ecommerce/orders';

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

// ponytail: fetch a fresh token per checkout. Caching the ~1h token only
// matters at volume we don't have; add it when token calls show up hot.
async function getToken(): Promise<string> {
  const { id, secret } = creds();
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    throw new Error(`BOG token failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('BOG token: no access_token in response');
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
  const token = await getToken();
  const res = await fetch(ORDERS_URL, {
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
  });
  if (!res.ok) {
    throw new Error(`BOG create order failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    id?: string;
    _links?: { redirect?: { href?: string } };
  };
  const redirectUrl = data._links?.redirect?.href;
  if (!data.id || !redirectUrl) throw new Error('BOG create order: missing id/redirect link');
  return { orderId: data.id, redirectUrl };
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
