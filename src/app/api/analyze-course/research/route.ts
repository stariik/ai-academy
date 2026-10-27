// ============================================================
// API Route: POST /api/analyze-course/research
// Tool name + field → web-researched course Markdown. The admin
// generator feeds the result through /api/analyze-outline (text mode)
// and the usual per-lesson generation queue — no PDF needed.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { researchCourse } from '@/lib/ai/research';
import { isAdmin } from '@/lib/admin-auth';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  try {
    const { tool, field, level, audience, lessons } = await request.json();
    if (!tool?.trim() || !field?.trim()) {
      return NextResponse.json({ error: 'tool and field are required' }, { status: 400 });
    }
    const result = await researchCourse({
      tool: tool.trim(),
      field: field.trim(),
      level: level || 'beginner',
      audience,
      lessons: Math.min(12, Math.max(3, Number(lessons) || 6)),
    });
    return NextResponse.json({ ...result, researchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[Research] Error:', err);
    const message = err instanceof Error ? err.message : 'Research failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
