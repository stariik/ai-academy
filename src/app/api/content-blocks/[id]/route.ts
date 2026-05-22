// ============================================================
// PUT /api/content-blocks/[id] — update content / contentEn / type / order
// DELETE /api/content-blocks/[id] — delete a single block
// Both admin-gated.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateContentBlock, deleteContentBlock } from '@/lib/supabase/db';
import { getAdminUser } from '@/lib/admin-auth';
import type { ContentBlock } from '@/types';

type RouteContext = { params: Promise<{ id: string }> };

const VALID_TYPES: ContentBlock['type'][] = [
  'heading', 'text', 'key_concepts', 'code', 'callout', 'summary',
  'table', 'list', 'example', 'analogy', 'step_by_step',
  'diagram_description', 'definition', 'warning', 'tip', 'quote',
];

export async function PUT(request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await context.params;
  let body: {
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
  if (body.type !== undefined && !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    await updateContentBlock(supabase, id, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[content-blocks PUT] failed:', err);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await context.params;
  try {
    const supabase = await createClient();
    const ok = await deleteContentBlock(supabase, id);
    if (!ok) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[content-blocks DELETE] failed:', err);
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }
}
