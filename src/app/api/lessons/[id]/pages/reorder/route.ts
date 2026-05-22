// ============================================================
// POST /api/lessons/[id]/pages/reorder
//   Body: { order: [{ id, pageNumber }, ...] }
//   Two-phase update so the unique(lesson_id, page_number) constraint
//   never trips. Admin-gated.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reorderLessonPages } from '@/lib/supabase/db';
import { getAdminUser } from '@/lib/admin-auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id: lessonId } = await context.params;
  let body: { order?: { id: string; pageNumber: number }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  if (!Array.isArray(body.order) || body.order.length === 0) {
    return NextResponse.json({ error: 'order_required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    await reorderLessonPages(supabase, lessonId, body.order);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[lessons/pages/reorder] failed:', err);
    return NextResponse.json({ error: 'reorder_failed' }, { status: 500 });
  }
}
