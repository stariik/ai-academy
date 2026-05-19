// ============================================================
// Enrollment helpers
//
// Backed by the `enrollments` table (see migrations/2026-05-19-promo-codes.sql).
// Use these from server components and route handlers — RLS lets a signed-in
// user read their own enrollments, but writes for source='free' / 'admin' go
// through the helpers here. Promo redemptions go through the
// redeem_promo_code() RPC and create their own enrollment row.
// ============================================================

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth';

export type EnrollmentSource = 'promo' | 'purchase' | 'free' | 'admin';

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  source: EnrollmentSource;
  promoCodeId: string | null;
  createdAt: string;
};

/** Return the course ids the current user is enrolled in. [] if not signed in. */
export async function getCurrentUserEnrollments(): Promise<string[]> {
  const user = await getAuthUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', user.id);
  if (error) {
    console.error('[enrollments] read failed:', error);
    return [];
  }
  return (data ?? []).map((r) => r.course_id as string);
}

/** Quick check for a single course. */
export async function isCurrentUserEnrolled(courseId: string): Promise<boolean> {
  const user = await getAuthUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();
  if (error) {
    console.error('[enrollments] check failed:', error);
    return false;
  }
  return Boolean(data);
}

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  source: EnrollmentSource;
  promo_code_id: string | null;
  created_at: string;
};

function mapEnrollmentRow(r: EnrollmentRow): Enrollment {
  return {
    id: r.id,
    userId: r.user_id,
    courseId: r.course_id,
    source: r.source,
    promoCodeId: r.promo_code_id,
    createdAt: r.created_at,
  };
}

/**
 * Idempotent enrol — returns existing row if the user is already enrolled,
 * otherwise inserts a new one. Avoids UPSERT (which would require an UPDATE
 * RLS policy we intentionally do not grant) by catching the unique-violation
 * (Postgres code 23505) and reading the existing row back.
 *
 * `source='free'` is the default for the existing "Enroll" button until a
 * real checkout exists. Promo flows hit redeem_promo_code() instead.
 */
export async function enrollCurrentUser(
  courseId: string,
  source: EnrollmentSource = 'free',
): Promise<{ ok: true; enrollment: Enrollment } | { ok: false; reason: string }> {
  const user = await getAuthUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };

  const supabase = await createClient();
  const columns = 'id, user_id, course_id, source, promo_code_id, created_at';

  const insertRes = await supabase
    .from('enrollments')
    .insert({ user_id: user.id, course_id: courseId, source })
    .select(columns)
    .single();

  if (!insertRes.error && insertRes.data) {
    return { ok: true, enrollment: mapEnrollmentRow(insertRes.data) };
  }

  // 23505 = unique_violation. Means the user already has an enrollment for
  // this course; read it back and return it so the caller still gets a row.
  if (insertRes.error?.code === '23505') {
    const existing = await supabase
      .from('enrollments')
      .select(columns)
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();
    if (existing.error || !existing.data) {
      console.error('[enrollments] read-after-conflict failed:', existing.error);
      return { ok: false, reason: 'db_error' };
    }
    return { ok: true, enrollment: mapEnrollmentRow(existing.data) };
  }

  console.error('[enrollments] insert failed:', insertRes.error);
  return { ok: false, reason: 'db_error' };
}
