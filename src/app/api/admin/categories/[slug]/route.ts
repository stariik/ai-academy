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

  let body: {
    imageUrl?: string | null;
    bundlePriceCents?: number | null;
    bundleRetailCents?: number | null;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // Build a partial update so a price-only save doesn't clear the image
  // (and vice-versa).
  const updates: {
    imageUrl?: string | null;
    bundlePriceCents?: number | null;
    bundleRetailCents?: number | null;
  } = {};
  if ('imageUrl' in body) updates.imageUrl = body.imageUrl ?? null;
  if ('bundlePriceCents' in body) {
    const v = body.bundlePriceCents;
    if (v != null && (!Number.isFinite(v) || v < 0)) {
      return NextResponse.json({ error: 'invalid_price' }, { status: 400 });
    }
    updates.bundlePriceCents = v ?? null;
  }
  if ('bundleRetailCents' in body) {
    const v = body.bundleRetailCents;
    if (v != null && (!Number.isFinite(v) || v < 0)) {
      return NextResponse.json({ error: 'invalid_price' }, { status: 400 });
    }
    updates.bundleRetailCents = v ?? null;
  }

  const supabase = await createClient();
  const updated = await upsertCategoryImage(supabase, slug, updates);
  return NextResponse.json(updated);
}
