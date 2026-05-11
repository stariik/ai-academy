// ============================================================
// GET /api/badges — user's earned badges (Task 6)
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserBadges } from '@/lib/supabase/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const { sessionId } = await getSession();
    const supabase = await createClient();
    const badges = await getUserBadges(supabase, sessionId);
    return NextResponse.json(badges);
  } catch (err) {
    console.error('Badges GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
