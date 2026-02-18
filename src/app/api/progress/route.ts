// ============================================================
// API: GET /api/progress - List all progress for session
//       POST /api/progress - Upsert lesson progress
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProgressForSession, upsertLessonProgress } from '@/lib/supabase/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const { sessionId } = await getSession();
    const supabase = await createClient();
    const progress = await getProgressForSession(supabase, sessionId);
    return NextResponse.json(progress);
  } catch (err) {
    console.error('Progress GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await getSession();
    const body = await request.json();
    const { lessonId, status, scrollPercentage, timeSpentSeconds, currentPage, completedPages } = body as {
      lessonId: string;
      status?: string;
      scrollPercentage?: number;
      timeSpentSeconds?: number;
      currentPage?: number;
      completedPages?: number[];
    };

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const progress = await upsertLessonProgress(supabase, {
      sessionId,
      lessonId,
      status,
      scrollPercentage,
      timeSpentSeconds,
      currentPage,
      completedPages,
    });

    return NextResponse.json(progress);
  } catch (err) {
    console.error('Progress POST error:', err);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
