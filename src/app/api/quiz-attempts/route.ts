// ============================================================
// GET /api/quiz-attempts — recent quiz attempts for the current session
// Used by the /profile dashboard (Task 7)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRecentQuizAttempts } from '@/lib/supabase/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const { sessionId } = await getSession();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') ?? '5')));

    const attempts = await getRecentQuizAttempts(supabase, sessionId, limit);
    return NextResponse.json(attempts);
  } catch (err) {
    console.error('Quiz-attempts GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
  }
}
