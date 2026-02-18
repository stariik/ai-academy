// ============================================================
// API: GET /api/recommendations - AI-scored recommended lessons
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRecommendedLessons } from '@/lib/supabase/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const { sessionId } = await getSession();
    const supabase = await createClient();
    const lessons = await getRecommendedLessons(supabase, sessionId, 5);
    return NextResponse.json(lessons);
  } catch (err) {
    console.error('Recommendations error:', err);
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 });
  }
}
