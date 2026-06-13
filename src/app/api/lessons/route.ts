import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllLessons, saveLesson, deleteAllLessons } from '@/lib/supabase/db';
import { isAdmin } from '@/lib/admin-auth';
import { Lesson } from '@/types';

// GET /api/lessons - Return all lessons
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const courseId = searchParams.get('courseId') ?? undefined;

  const lessons = await getAllLessons(supabase, { status, courseId });
  return NextResponse.json(lessons);
}

// POST /api/lessons - Save a new lesson
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const lesson = body as Lesson;

    if (!lesson.id || !lesson.title) {
      return NextResponse.json(
        { error: 'Lesson must have an id and title' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    await saveLesson(supabase, lesson);

    return NextResponse.json(lesson, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}

// DELETE /api/lessons - Delete all lessons
export async function DELETE() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const supabase = await createClient();
  const count = await deleteAllLessons(supabase);
  return NextResponse.json({ success: true, deleted: count });
}
