// ============================================================
// GET /api/review — fetch due spaced-repetition items for the session
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDueReviewItems, countDueReviewItems } from '@/lib/supabase/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const { sessionId } = await getSession();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Number(searchParams.get('limit') ?? '10'));
    const countOnly = searchParams.get('count') === '1';

    if (countOnly) {
      const dueCount = await countDueReviewItems(supabase, sessionId);
      return NextResponse.json({ dueCount });
    }

    const items = await getDueReviewItems(supabase, sessionId, limit);
    return NextResponse.json({ items });
  } catch (err) {
    console.error('Review GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch review queue' }, { status: 500 });
  }
}
