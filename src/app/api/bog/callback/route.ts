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
//
// Every callback lands in `payment_logs`, including the ones we reject:
// a bad signature or an unknown order is exactly what you want a record of.
// ============================================================

import { NextResponse } from 'next/server';
import { verifyCallback } from '@/lib/bog';
import { logPaymentEvent } from '@/lib/payment-log';
import { fulfillOrder, serviceClient, type PaymentRow } from '@/lib/payments-fulfill';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const started = Date.now();
  const raw = await req.text();
  const signature = req.headers.get('Callback-Signature') ?? '';

  // Store the body as JSON when it parses, verbatim otherwise — an
  // unparseable body is itself the interesting part of that log row.
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  const request = {
    signature: signature || '(none)',
    contentType: req.headers.get('Content-Type'),
    body: parsed ?? raw,
  };

  /** Log this callback with our verdict, then answer BOG. */
  const record = async (
    outcome: { ok: boolean; error?: string; details?: Record<string, unknown> },
    body: Record<string, unknown>,
    status: number,
    bogOrderId?: string | null,
    paymentId?: string | null,
  ) => {
    await logPaymentEvent({
      event: 'callback',
      paymentId,
      bogOrderId,
      ok: outcome.ok,
      httpStatus: status,
      request,
      response: { ...outcome.details, weAnswered: { status, body } },
      error: outcome.error ?? null,
      durationMs: Date.now() - started,
    });
    return NextResponse.json(body, { status });
  };

  if (!verifyCallback(raw, signature)) {
    console.warn('[bog/callback] signature verification failed');
    return record(
      { ok: false, error: 'signature_verification_failed' },
      { error: 'bad_signature' },
      401,
    );
  }

  if (parsed === null) {
    return record({ ok: false, error: 'body_is_not_json' }, { error: 'invalid_body' }, 400);
  }

  const payload = parsed as {
    event?: string;
    body?: { order_id?: string; order_status?: { key?: string } };
  };

  // We only act on payment events; ack anything else so BOG stops retrying.
  if (payload.event !== 'order_payment') {
    return record(
      { ok: true, details: { ignored: `event=${payload.event ?? '(none)'}` } },
      { ok: true },
      200,
    );
  }

  const orderId = payload.body?.order_id;
  const statusKey = payload.body?.order_status?.key; // 'completed' on success
  if (!orderId) {
    return record({ ok: false, error: 'no_order_id_in_payload' }, { ok: true }, 200);
  }

  const svc = serviceClient();
  const { data: payment } = await svc
    .from('payments')
    .select('id, user_id, course_id, category_slug, status')
    .eq('bog_order_id', orderId)
    .maybeSingle();

  if (!payment) {
    console.warn('[bog/callback] no payment for order', orderId);
    return record({ ok: false, error: 'no_payment_for_order' }, { ok: true }, 200, orderId);
  }

  const statusBefore = payment.status;

  // Amount isn't re-checked here: we set it on the order and BOG enforces it,
  // and the verified signature proves the payload is genuinely BOG's.
  const { ok, granted } = await fulfillOrder(svc, payment as PaymentRow, statusKey);
  const details = { statusKey: statusKey ?? null, statusBefore, granted };

  if (!ok) {
    // 'completed' but the grant failed — don't ack, so BOG retries.
    return record(
      { ok: false, error: 'enrollment_grant_failed', details },
      { error: 'grant_failed' },
      500,
      orderId,
      payment.id,
    );
  }

  return record({ ok: true, details }, { ok: true }, 200, orderId, payment.id);
}
