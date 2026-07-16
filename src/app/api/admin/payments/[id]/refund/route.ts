// ============================================================
// POST /api/admin/payments/[id]/refund — one-click refund
//
// Keeps money and access in sync in one action:
//   1. refund the full amount at Bank of Georgia
//   2. mark the payment status='refunded'
//   3. revoke the source='purchase' enrollments this payment granted —
//      one course, or every course of a category bundle
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
import { paymentCourseIds, type PaymentRow } from '@/lib/payments-fulfill';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await context.params;
  const db = adminDb();

  const { data: payment } = await db
    .from('payments')
    .select('id, user_id, course_id, category_slug, bog_order_id, amount_cents, status')
    .eq('id', id)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });
  if (payment.status !== 'paid') {
    return NextResponse.json({ error: 'not_refundable', status: payment.status }, { status: 409 });
  }
  if (!payment.bog_order_id) {
    return NextResponse.json({ error: 'no_bog_order' }, { status: 409 });
  }

  // Work out what to revoke BEFORE moving money: if we can't resolve what this
  // payment granted, refuse outright rather than refund and leave access behind.
  const courseIds = await paymentCourseIds(db, payment as PaymentRow);
  if (courseIds.length === 0) {
    return NextResponse.json({ error: 'nothing_to_revoke' }, { status: 409 });
  }

  try {
    await refundOrder(payment.bog_order_id);
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

  // Only pull purchase enrollments — never an admin/promo/free grant.
  const del = await db
    .from('enrollments')
    .delete()
    .eq('user_id', payment.user_id)
    .in('course_id', courseIds)
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
