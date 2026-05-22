// ============================================================
// POST /api/lesson-pages/[id]/blocks/reorder
//   Body: { order: [{ id, order }, ...] }
//   Reorders content blocks within a single page. content_blocks.order
//   has no uniqueness constraint, so a one-pass update is fine.
//   Admin-gated.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reorderContentBlocks } from '@/lib/supabase/db';
import { getAdminUser } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: { order?: { id: string; order: number }[] };
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
    await reorderContentBlocks(supabase, body.order);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[lesson-pages/blocks/reorder] failed:', err);
    return NextResponse.json({ error: 'reorder_failed' }, { status: 500 });
  }
}
