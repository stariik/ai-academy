// ============================================================
// Payment fulfillment — the single place that turns a resolved BOG
// order status into our `payments` + `enrollments` state.
//
// Called from two places, and must stay idempotent for both:
//   1. /api/bog/callback   — the webhook (primary, fast path)
//   2. reconcileCoursePurchase() — the success-return fallback, for when
//      the webhook was missed (BOG's docs recommend get-payment-details
//      as the callback fallback)
//
// Writes use the service role (enrollments RLS grants no client INSERT).
// ============================================================

import 'server-only';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPaymentDetails } from '@/lib/bog';

export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing — required for payment fulfillment');
  }
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type PaymentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
};

/**
 * Apply a resolved BOG order status to our records. Idempotent.
 *
 * Returns `ok:false` when the status is 'completed' but the enrollment grant
 * failed — the caller (webhook) must then NOT ack with 200, so BOG retries,
 * and we never leave a payment marked 'paid' without access behind it.
 */
export async function fulfillOrder(
  svc: SupabaseClient,
  payment: PaymentRow,
  statusKey: string | undefined,
): Promise<{ ok: boolean; granted: boolean }> {
  if (statusKey === 'completed') {
    if (payment.status === 'paid') return { ok: true, granted: true };

    const ins = await svc
      .from('enrollments')
      .insert({ user_id: payment.user_id, course_id: payment.course_id, source: 'purchase' });
    // 23505 = already enrolled (retried callback / earlier reconcile). Success.
    if (ins.error && ins.error.code !== '23505') {
      // Grant genuinely failed — leave status untouched so a retry can grant.
      console.error('[fulfill] enrollment insert failed:', ins.error);
      return { ok: false, granted: false };
    }
    await svc
      .from('payments')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', payment.id);
    return { ok: true, granted: true };
  }

  if (statusKey === 'rejected') {
    if (payment.status !== 'paid') {
      await svc
        .from('payments')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', payment.id);
    }
    return { ok: true, granted: false };
  }

  // Refund observed on the order — most importantly refunds issued from BOG's
  // own Business Manager, which never touch our admin refund route. Keep access
  // in sync by revoking the purchase enrollment.
  // ponytail: 'refunded_partially' treated like a full refund — our product is
  // one all-or-nothing course, so a partial refund of it isn't a real case.
  if (statusKey === 'refunded' || statusKey === 'refunded_partially') {
    await svc
      .from('enrollments')
      .delete()
      .eq('user_id', payment.user_id)
      .eq('course_id', payment.course_id)
      .eq('source', 'purchase');
    await svc
      .from('payments')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', payment.id);
    return { ok: true, granted: false };
  }

  // created / processing / anything transient — nothing to do yet.
  return { ok: true, granted: payment.status === 'paid' };
}

/**
 * Fallback used when the browser returns from BOG with ?payment=success.
 * Finds the user's most recent not-yet-paid payment for this course, asks BOG
 * for the real status, and grants access if it completed. No-op (returns the
 * webhook's result) if the webhook already handled it. Never throws.
 */
export async function reconcileCoursePurchase(
  userId: string,
  courseId: string,
): Promise<boolean> {
  try {
    const svc = serviceClient();
    const { data: payment } = await svc
      .from('payments')
      .select('id, user_id, course_id, status, bog_order_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .neq('status', 'paid')
      .not('bog_order_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.bog_order_id) return false;

    const { statusKey, externalOrderId } = await getPaymentDetails(payment.bog_order_id);
    // Guard: the receipt must be for this exact payment row.
    if (externalOrderId && externalOrderId !== payment.id) return false;

    const res = await fulfillOrder(svc, payment as PaymentRow, statusKey);
    return res.granted;
  } catch (err) {
    console.error('[reconcile] failed:', err);
    return false;
  }
}
