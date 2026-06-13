// ============================================================
// /api/admin/students/[id]/enrollments
//   POST   — grant a course to the student (source='admin')
//   DELETE — revoke an enrollment by id
//
// [id] is a student_sessions.id. Enrollments are keyed by the session's
// linked auth user, so both verbs resolve user_id first and 404 for guest
// sessions. Service-role writes (enrollments RLS grants no client INSERT).
// Admin-gated by src/lib/admin-auth.ts.
// ============================================================

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { adminDb } from '@/lib/admin/queries';

type RouteContext = { params: Promise<{ id: string }> };

async function resolveUserId(sessionId: string): Promise<string | null> {
  const { data } = await adminDb()
    .from('student_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .maybeSingle();
  return (data as { user_id: string | null } | null)?.user_id ?? null;
}

export async function POST(req: Request, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await context.params;

  let body: { courseId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const courseId = body.courseId?.trim();
  if (!courseId) return NextResponse.json({ error: 'courseId_required' }, { status: 400 });

  const userId = await resolveUserId(id);
  if (!userId) return NextResponse.json({ error: 'no_account_linked' }, { status: 409 });

  const db = adminDb();

  // Confirm the course exists so we don't create a dangling-looking grant.
  const course = await db.from('courses').select('id').eq('id', courseId).maybeSingle();
  if (course.error || !course.data) {
    return NextResponse.json({ error: 'course_not_found' }, { status: 404 });
  }

  const { error } = await db
    .from('enrollments')
    .insert({ user_id: userId, course_id: courseId, source: 'admin' });

  // 23505 = already enrolled — treat as success (idempotent grant).
  if (error && error.code !== '23505') {
    console.error('[admin/enrollments] grant failed:', error);
    return NextResponse.json({ error: 'grant_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await context.params;

  let body: { enrollmentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const enrollmentId = body.enrollmentId?.trim();
  if (!enrollmentId) return NextResponse.json({ error: 'enrollmentId_required' }, { status: 400 });

  const userId = await resolveUserId(id);
  if (!userId) return NextResponse.json({ error: 'no_account_linked' }, { status: 409 });

  // Scope the delete to this user's enrollment so an id from another user
  // can't be revoked through this session's route.
  const { error } = await adminDb()
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId)
    .eq('user_id', userId);

  if (error) {
    console.error('[admin/enrollments] revoke failed:', error);
    return NextResponse.json({ error: 'revoke_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
