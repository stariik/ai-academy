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
import { CATEGORY_VISUALS } from '@/lib/v2/data';

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

// A payment targets exactly one of these (enforced by payments_target_ck).
export type PaymentRow = {
  id: string;
  user_id: string;
  course_id: string | null;
  category_slug: string | null;
  status: string;
};

/** Canonical KA category name for a storefront slug, or null if unknown. */
export function categoryNameForSlug(slug: string): string | null {
  for (const [nameKa, visual] of Object.entries(CATEGORY_VISUALS)) {
    if (visual.slug === slug) return nameKa;
  }
  return null;
}

/** Every course tagged with a category, by storefront slug. */
export async function categoryCourseIds(
  svc: SupabaseClient,
  slug: string,
): Promise<string[]> {
  const nameKa = categoryNameForSlug(slug);
  if (!nameKa) return [];
  const { data, error } = await svc.from('courses').select('id').contains('tags', [nameKa]);
  if (error) {
    console.error('[fulfill] category course lookup failed:', error);
    return [];
  }
  return (data ?? []).map((r) => r.id as string);
}

/**
 * The courses a payment grants: one for a single-course buy, the whole
 * category for a bundle. A bundle is a bulk course purchase — the set is
 * resolved at fulfillment time, so it's whatever the category holds when the
 * money lands, and courses added later are not retroactively included.
 */
export async function paymentCourseIds(
  svc: SupabaseClient,
  payment: PaymentRow,
): Promise<string[]> {
  if (payment.course_id) return [payment.course_id];
  if (payment.category_slug) return categoryCourseIds(svc, payment.category_slug);
  return [];
}

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

    const courseIds = await paymentCourseIds(svc, payment);
    if (courseIds.length === 0) {
      // Paid for something we can't resolve to courses (unknown slug, emptied
      // category). Don't mark it paid — a retry can still grant once fixed.
      console.error('[fulfill] payment grants no courses:', payment.id);
      return { ok: false, granted: false };
    }

    // ignoreDuplicates so a retried callback, an earlier reconcile, or a
    // bundle overlapping a course the user already owns all no-op cleanly
    // instead of failing the whole grant on one conflict.
    const ins = await svc.from('enrollments').upsert(
      courseIds.map((course_id) => ({ user_id: payment.user_id, course_id, source: 'purchase' })),
      { onConflict: 'user_id,course_id', ignoreDuplicates: true },
    );
    if (ins.error) {
      // Grant genuinely failed — leave status untouched so a retry can grant.
      console.error('[fulfill] enrollment upsert failed:', ins.error);
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
  // in sync by revoking the purchase enrollments this payment granted.
  // ponytail: 'refunded_partially' revokes the whole payment. A part-refunded
  // bundle is the only real case, and BOG's payload doesn't say which course
  // the money came off — so we revoke it all rather than guess. Revisit if
  // per-course bundle refunds ever become a thing we offer.
  if (statusKey === 'refunded' || statusKey === 'refunded_partially') {
    const courseIds = await paymentCourseIds(svc, payment);
    if (courseIds.length > 0) {
      await svc
        .from('enrollments')
        .delete()
        .eq('user_id', payment.user_id)
        .in('course_id', courseIds)
        .eq('source', 'purchase');
    }
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
 * Finds the user's most recent not-yet-paid payment for this target, asks BOG
 * for the real status, and grants access if it completed. No-op (returns the
 * webhook's result) if the webhook already handled it. Never throws.
 */
async function reconcile(
  userId: string,
  target: { courseId: string } | { categorySlug: string },
): Promise<boolean> {
  try {
    const svc = serviceClient();
    const base = svc
      .from('payments')
      .select('id, user_id, course_id, category_slug, status, bog_order_id')
      .eq('user_id', userId)
      .neq('status', 'paid')
      .not('bog_order_id', 'is', null);

    const { data: payment } = await ('courseId' in target
      ? base.eq('course_id', target.courseId)
      : base.eq('category_slug', target.categorySlug)
    )
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.bog_order_id) return false;

    const { statusKey, externalOrderId } = await getPaymentDetails(
      payment.bog_order_id,
      payment.id,
    );
    // Guard: the receipt must be for this exact payment row.
    if (externalOrderId && externalOrderId !== payment.id) return false;

    const res = await fulfillOrder(svc, payment as PaymentRow, statusKey);
    return res.granted;
  } catch (err) {
    console.error('[reconcile] failed:', err);
    return false;
  }
}

/** Reconcile a single-course purchase on return from BOG. */
export function reconcileCoursePurchase(userId: string, courseId: string): Promise<boolean> {
  return reconcile(userId, { courseId });
}

/** Reconcile a category bundle purchase on return from BOG. */
export function reconcileBundlePurchase(userId: string, categorySlug: string): Promise<boolean> {
  return reconcile(userId, { categorySlug });
}
