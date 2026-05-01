// ============================================================
// API Route: POST /api/analyze-course/create
// Creates the course record and returns section data.
// Fast endpoint (~5s) — actual lesson generation happens
// via /api/analyze-course/generate-lesson (one call per section).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCourse } from '@/lib/supabase/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseName, sections, tags } = body;

    if (!courseName?.trim()) {
      return NextResponse.json({ error: 'Course name is required' }, { status: 400 });
    }
    if (!sections || sections.length === 0) {
      return NextResponse.json({ error: 'No sections provided' }, { status: 400 });
    }

    const supabase = await createClient();
    const course = await createCourse(supabase, {
      title: courseName.trim(),
      description: '',
      tags: Array.isArray(tags) ? tags : [],
    });

    return NextResponse.json({
      courseId: course.id,
      courseName: course.title,
    });
  } catch (err) {
    console.error('[CreateCourse] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create course';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
