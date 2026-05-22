// ============================================================
// PUT /api/lesson-pages/[id]
//   Update a single lesson page (title, titleEn, pageNumber, keyConcepts).
//   Admin-gated. Page reorder lives at /api/lessons/[id]/pages/reorder.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateLessonPage } from '@/lib/supabase/db';
import { getAdminUser } from '@/lib/admin-auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await context.params;
  let body: {
    title?: string;
    titleEn?: string | null;
    pageNumber?: number;
    keyConcepts?: { term: string; definition: string }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    await updateLessonPage(supabase, id, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[lesson-pages PUT] failed:', err);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
}
