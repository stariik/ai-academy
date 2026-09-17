// ============================================================
// GET /api/lessons/[id]/translate?pageNumber=N&locale=en
// Returns an English translation overlay for a lesson page's material.
// Prefers human EN columns (title_en / content_en) where present and
// AI-translates the rest. Results are cached in lesson_page_translations
// and invalidated via a source hash when the Georgian content changes.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLesson } from '@/lib/supabase/db';
import { isCurrentUserEnrolled } from '@/lib/enrollments';
import { isAdmin } from '@/lib/admin-auth';
import { FREE_LESSON_ID } from '@/lib/v2/db';
import { translatePageCached } from '@/lib/ai/page-translation';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const pageNumber = Number(searchParams.get('pageNumber'));
  const locale = searchParams.get('locale') ?? 'en';

  if (!Number.isFinite(pageNumber)) {
    return NextResponse.json({ error: 'Invalid pageNumber' }, { status: 400 });
  }
  if (locale !== 'en') {
    // Only EN translation is supported; Georgian is the source language.
    return NextResponse.json({ error: 'Unsupported locale' }, { status: 400 });
  }

  const supabase = await createClient();
  const lesson = await getLesson(supabase, id);
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  // Same paywall as GET /api/lessons/[id] — this returns the page material in
  // English, so leaving it open would hand out the paid content verbatim. It
  // also spends AI credits, which is reason enough not to serve strangers.
  if (id !== FREE_LESSON_ID) {
    const allowed =
      (lesson.courseId ? await isCurrentUserEnrolled(lesson.courseId) : false) ||
      (await isAdmin());
    if (!allowed) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  const page = lesson.pages?.find((p) => p.pageNumber === pageNumber);
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  try {
    const { overlay } = await translatePageCached(supabase, id, page, locale);
    return NextResponse.json(overlay);
  } catch (err) {
    console.error('Page translation failed:', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 502 });
  }
}
