// ============================================================
// POST /api/enrollments — current user enrolls themselves in a course (free)
// GET  /api/enrollments — current user's enrolled course ids
//
// Promo redemptions go through /api/promo/redeem instead — that route
// creates its own enrollment row via the redeem_promo_code() RPC.
// ============================================================

import { NextResponse } from 'next/server';
import { enrollCurrentUser, getCurrentUserEnrollments } from '@/lib/enrollments';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ enrollments: [] });
  }
  const enrollments = await getCurrentUserEnrollments();
  return NextResponse.json({ enrollments });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: { courseId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const courseId = body.courseId?.trim();
  if (!courseId) {
    return NextResponse.json({ error: 'courseId_required' }, { status: 400 });
  }

  const result = await enrollCurrentUser(courseId, 'free');
  if (!result.ok) {
    const status = result.reason === 'unauthenticated' ? 401 : 500;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ enrollment: result.enrollment });
}
