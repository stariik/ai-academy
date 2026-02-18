// ============================================================
// API: GET /api/courses - List courses
//       POST /api/courses - Create course
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllCourses, createCourse } from '@/lib/supabase/db';

export async function GET() {
  const supabase = await createClient();
  const courses = await getAllCourses(supabase);
  return NextResponse.json(courses);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, tags } = body as {
      title: string;
      description?: string;
      tags?: string[];
    };

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Course title is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const course = await createCourse(supabase, {
      title: title.trim(),
      description: description?.trim() ?? '',
      tags: tags ?? [],
    });

    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    console.error('Create course error:', err);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
