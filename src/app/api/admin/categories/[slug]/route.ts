// ============================================================
// /api/admin/categories/[slug]
//   PUT — set or clear a category's cover image.
//         Body: { imageUrl: string | null }
// Admin-gated by src/lib/admin-auth.ts (env allowlist).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import { upsertCategoryImage } from '@/lib/supabase/db';
import { getCategoryBySlug } from '@/lib/v2/data';

type RouteContext = { params: Promise<{ slug: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { slug } = await context.params;
  if (!getCategoryBySlug(slug)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  let body: { imageUrl?: string | null } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const supabase = await createClient();
  const updated = await upsertCategoryImage(supabase, slug, {
    imageUrl: body.imageUrl ?? null,
  });
  return NextResponse.json(updated);
}
