// ============================================================
// POST /api/bog/callback — Bank of Georgia payment webhook
//
// BOG calls this server-to-server after a payment resolves. We:
//   1. verify the RSA-SHA256 `Callback-Signature` over the RAW body
//   2. look up our payment by BOG's order_id
//   3. on order_status 'completed' → grant the enrollment (purchase)
//
// Always returns 200 once the signature checks out, so BOG stops
// retrying. The enrollment insert is idempotent (unique user+course),
// so a retried callback is harmless.
// ============================================================

import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { verifyCallback } from '@/lib/bog';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing — required for the BOG callback');
  }
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

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

  if (statusKey === 'completed' && payment.status !== 'paid') {
    // Grant access. Amount isn't re-checked here: we set it on the order and
    // BOG enforces it, and the signature above proves the payload is BOG's.
    const ins = await svc
      .from('enrollments')
      .insert({ user_id: payment.user_id, course_id: payment.course_id, source: 'purchase' });
    // 23505 = already enrolled (e.g. retried callback); not an error for us.
    if (ins.error && ins.error.code !== '23505') {
      console.error('[bog/callback] enrollment insert failed:', ins.error);
    }
    await svc
      .from('payments')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', payment.id);
  } else if (statusKey === 'rejected') {
    await svc
      .from('payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', payment.id);
  }

  return NextResponse.json({ ok: true });
}
