// ============================================================
// POST /api/content-blocks — create a new content block on a page
//   Body: { lessonId, pageId?, type, content, contentEn?, order }
//   Admin-gated.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createContentBlock } from '@/lib/supabase/db';
import { getAdminUser } from '@/lib/admin-auth';
import type { ContentBlock } from '@/types';

const VALID_TYPES: ContentBlock['type'][] = [
  'heading', 'text', 'key_concepts', 'code', 'callout', 'summary',
  'table', 'list', 'example', 'analogy', 'step_by_step',
  'diagram_description', 'definition', 'warning', 'tip', 'quote',
];

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: {
    lessonId?: string;
    pageId?: string | null;
    type?: ContentBlock['type'];
    content?: string;
    contentEn?: string | null;
    order?: number;
    metadata?: Record<string, unknown> | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (!body.lessonId || !body.type || !VALID_TYPES.includes(body.type) || typeof body.order !== 'number') {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const block = await createContentBlock(supabase, {
      lessonId: body.lessonId,
      pageId: body.pageId ?? null,
      type: body.type,
      content: body.content ?? '',
      contentEn: body.contentEn ?? null,
      order: body.order,
      metadata: body.metadata ?? null,
    });
    return NextResponse.json({ block });
  } catch (err) {
    console.error('[content-blocks POST] failed:', err);
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}
