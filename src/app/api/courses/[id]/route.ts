// ============================================================
// API: GET/PUT/DELETE /api/courses/[id]
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCourse, getLesson, updateCourse, deleteCourse, getAllLessons } from '@/lib/supabase/db';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const course = await getCourse(supabase, id);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // `?include=pages` returns lessons with full pages / content blocks / questions
  // expanded — used by the admin preview page to render the whole course as
  // one scrollable document. Default behavior (no query) omits pages to stay fast.
  const includePages = request.nextUrl.searchParams.get('include') === 'pages';

  const lessonSummaries = await getAllLessons(supabase, { courseId: id });
  const ordered = lessonSummaries.sort(
    (a, b) => (a.positionInCourse ?? 999) - (b.positionInCourse ?? 999)
  );

  if (!includePages) {
    return NextResponse.json({ ...course, lessons: ordered });
  }

  // Expand every lesson into its full tree (pages + content_blocks + quiz_questions)
  const fullLessons = await Promise.all(
    ordered.map((l) => getLesson(supabase, l.id))
  );

  return NextResponse.json({
    ...course,
    lessons: fullLessons.filter((l): l is NonNullable<typeof l> => l !== null),
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const supabase = await createClient();
    const updated = await updateCourse(supabase, id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const deleted = await deleteCourse(supabase, id);
  if (!deleted) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
