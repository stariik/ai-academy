// ============================================================
// API: GET/PUT/DELETE /api/courses/[id]
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCourse, updateCourse, deleteCourse, getAllLessons } from '@/lib/supabase/db';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const course = await getCourse(supabase, id);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Include ordered lessons
  const lessons = await getAllLessons(supabase, { courseId: id });
  const orderedLessons = lessons.sort(
    (a, b) => (a.positionInCourse ?? 999) - (b.positionInCourse ?? 999)
  );

  return NextResponse.json({ ...course, lessons: orderedLessons });
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
