// ============================================================
// POST /api/admin/payments/[id]/refund — one-click refund
//
// Keeps money and access in sync in one action:
//   1. refund the full amount at Bank of Georgia
//   2. mark the payment status='refunded'
//   3. revoke the matching source='purchase' enrollment
//
// BOG is called first: if the money can't move, nothing local changes.
// If a local step fails AFTER the BOG refund succeeded, we return 500
// with the partial state spelled out so the admin can finish by hand.
// Admin-gated by src/lib/admin-auth.ts.
// ============================================================

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { adminDb } from '@/lib/admin/queries';
import { refundOrder } from '@/lib/bog';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await context.params;
  const db = adminDb();

  const { data: payment } = await db
    .from('payments')
    .select('id, user_id, course_id, bog_order_id, amount_cents, status')
    .eq('id', id)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });
  if (payment.status !== 'paid') {
    return NextResponse.json({ error: 'not_refundable', status: payment.status }, { status: 409 });
  }
  if (!payment.bog_order_id) {
    return NextResponse.json({ error: 'no_bog_order' }, { status: 409 });
  }

  try {
    await refundOrder(payment.bog_order_id, payment.amount_cents / 100);
  } catch (err) {
    console.error('[admin/refund] BOG refund failed:', err);
    return NextResponse.json({ error: 'bog_refund_failed' }, { status: 502 });
  }

  // Money has moved — everything below must be reported honestly if it fails.
  const upd = await db
    .from('payments')
    .update({ status: 'refunded', updated_at: new Date().toISOString() })
    .eq('id', payment.id);
  if (upd.error) {
    console.error('[admin/refund] refunded at BOG but status update failed:', upd.error);
    return NextResponse.json(
      { error: 'refunded_but_status_update_failed' },
      { status: 500 },
    );
  }

  // Only pull a purchase enrollment — never an admin/promo/free grant.
  const del = await db
    .from('enrollments')
    .delete()
    .eq('user_id', payment.user_id)
    .eq('course_id', payment.course_id)
    .eq('source', 'purchase');
  if (del.error) {
    console.error('[admin/refund] refunded but enrollment revoke failed:', del.error);
    return NextResponse.json(
      { error: 'refunded_but_revoke_failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
