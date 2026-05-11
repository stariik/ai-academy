// ============================================================
// GET /api/leaderboard/[courseId] — per-course XP leaderboard
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCourseLeaderboard, getCourse } from '@/lib/supabase/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();

    const [course, entries] = await Promise.all([
      getCourse(supabase, courseId),
      getCourseLeaderboard(supabase, courseId, 20),
    ]);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      course: { id: course.id, title: course.title },
      entries,
    });
  } catch (err) {
    console.error('Leaderboard GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
