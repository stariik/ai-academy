// ============================================================
// API: GET /api/progress/[lessonId] - Per-lesson progress
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProgressForLesson } from '@/lib/supabase/db';
import { getSession } from '@/lib/session';

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { lessonId } = await context.params;
    const { sessionId } = await getSession();
    const supabase = await createClient();
    const progress = await getProgressForLesson(supabase, sessionId, lessonId);
    return NextResponse.json(progress ?? { status: 'not_started', scrollPercentage: 0, timeSpentSeconds: 0 });
  } catch (err) {
    console.error('Progress GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
