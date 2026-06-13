import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLesson, updateLesson, deleteLesson } from '@/lib/supabase/db';
import { isAdmin } from '@/lib/admin-auth';
import { Lesson } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/lessons/[id] - Return a single lesson
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const lesson = await getLesson(supabase, id);

  if (!lesson) {
    return NextResponse.json(
      { error: 'Lesson not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(lesson);
}

// PUT /api/lessons/[id] - Update a lesson
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { id } = await context.params;

  try {
    const body = await request.json();
    const updates = body as Partial<Lesson>;
    const supabase = await createClient();
    const updated = await updateLesson(supabase, id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}

// DELETE /api/lessons/[id] - Delete a lesson
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { id } = await context.params;
  const supabase = await createClient();
  const deleted = await deleteLesson(supabase, id);

  if (!deleted) {
    return NextResponse.json(
      { error: 'Lesson not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
