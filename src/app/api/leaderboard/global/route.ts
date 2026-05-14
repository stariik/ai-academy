// ============================================================
// GET /api/leaderboard/global
// Public — anyone can hit this. Caller's rank is included only when a
// session cookie is present.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGlobalLeaderboard } from '@/lib/supabase/db';
import { getSessionId } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')));

    const supabase = await createClient();
    const sessionId = (await getSessionId()) ?? null;
    const result = await getGlobalLeaderboard(supabase, sessionId, limit);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Global leaderboard error:', err);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
