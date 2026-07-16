// ============================================================
// POST /api/bog/callback — Bank of Georgia payment webhook
//
// BOG calls this server-to-server after a payment (or refund) resolves. We:
//   1. verify the RSA-SHA256 `Callback-Signature` over the RAW body
//   2. look up our payment by BOG's order_id
//   3. hand the order_status to fulfillOrder() (grant / fail / revoke)
//
// We ack 200 once handled so BOG stops retrying. The one case we do NOT
// ack is a 'completed' order whose enrollment grant failed — then we
// return 500 so BOG retries rather than leaving a paid-but-no-access row.
// All writes are idempotent, so a retried callback is harmless.
// ============================================================

import { NextResponse } from 'next/server';
import { verifyCallback } from '@/lib/bog';
import { fulfillOrder, serviceClient, type PaymentRow } from '@/lib/payments-fulfill';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('Callback-Signature') ?? '';

  if (!verifyCallback(raw, signature)) {
    console.warn('[bog/callback] signature verification failed');
    return NextResponse.json({ error: 'bad_signature' }, { status: 401 });
  }

  let payload: {
    event?: string;
    body?: { order_id?: string; order_status?: { key?: string } };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  // We only act on payment events; ack anything else so BOG stops retrying.
  if (payload.event !== 'order_payment') {
    return NextResponse.json({ ok: true });
  }

  const orderId = payload.body?.order_id;
  const statusKey = payload.body?.order_status?.key; // 'completed' on success
  if (!orderId) {
    return NextResponse.json({ ok: true });
  }

  const svc = serviceClient();
  const { data: payment } = await svc
    .from('payments')
    .select('id, user_id, course_id, status')
    .eq('bog_order_id', orderId)
    .maybeSingle();

  if (!payment) {
    console.warn('[bog/callback] no payment for order', orderId);
    return NextResponse.json({ ok: true });
  }

  // Amount isn't re-checked here: we set it on the order and BOG enforces it,
  // and the verified signature proves the payload is genuinely BOG's.
  const { ok } = await fulfillOrder(svc, payment as PaymentRow, statusKey);
  if (!ok) {
    // 'completed' but the grant failed — don't ack, so BOG retries.
    return NextResponse.json({ error: 'grant_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
