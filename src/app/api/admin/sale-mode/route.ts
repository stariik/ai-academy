// ============================================================
// /api/admin/sale-mode — one-click storefront-wide sale.
//
//   GET  — { active, createdAt }
//   POST { action: 'enable' }  — snapshot current prices into
//        price_snapshots, then set every paid course and every
//        category bundle to 1 tetri (0.01 ₾).
//   POST { action: 'restore' } — put the snapshotted prices back
//        exactly as they were and delete the snapshot.
//
// The snapshot is inserted and confirmed BEFORE any price changes, so
// the original prices can never be lost. Free (NULL-priced) courses
// stay free; retail (struck-through) prices are untouched.
// Admin-gated; writes via service role (price_snapshots is RLS deny-all).
// ============================================================

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminUser } from '@/lib/admin-auth';
import { adminDb } from '@/lib/admin/queries';
import { upsertCategoryImage } from '@/lib/supabase/db';
import { CATEGORY_VISUALS } from '@/lib/v2/data';

export const dynamic = 'force-dynamic';

const SALE_CENTS = 1; // 0.01 ₾

type Snapshot = {
  courses: { id: string; cents: number }[];
  categories: { slug: string; cents: number | null }[];
};

async function latestSnapshot(): Promise<{ id: string; created_at: string; prices: Snapshot } | null> {
  const { data, error } = await adminDb()
    .from('price_snapshots')
    .select('id, created_at, prices')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`price_snapshots read failed (migration run?): ${error.message}`);
  return (data ?? null) as { id: string; created_at: string; prices: Snapshot } | null;
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const snap = await latestSnapshot();
    return NextResponse.json({ active: snap !== null, createdAt: snap?.created_at ?? null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'failed' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let action = '';
  try {
    action = (await req.json()).action;
  } catch {
    // falls through to the action check below
  }
  if (action !== 'enable' && action !== 'restore') {
    return NextResponse.json({ error: 'action_must_be_enable_or_restore' }, { status: 400 });
  }

  const db = adminDb();
  try {
    const snap = await latestSnapshot();

    if (action === 'enable') {
      if (snap) return NextResponse.json({ error: 'sale_already_active' }, { status: 409 });

      // NULL price_cents (free courses) fail the > 0 filter and stay free.
      const { data: courses, error: cErr } = await db
        .from('courses')
        .select('id, price_cents')
        .gt('price_cents', 0);
      if (cErr) throw new Error(cErr.message);

      const slugs = Object.values(CATEGORY_VISUALS).map((v) => v.slug);
      const { data: cats, error: gErr } = await db
        .from('category_images')
        .select('slug, bundle_price_cents')
        .in('slug', slugs);
      if (gErr) throw new Error(gErr.message);
      const centsBySlug = new Map(
        ((cats ?? []) as { slug: string; bundle_price_cents: number | null }[]).map((c) => [
          c.slug,
          c.bundle_price_cents ?? null,
        ]),
      );

      const prices: Snapshot = {
        courses: ((courses ?? []) as { id: string; price_cents: number }[]).map((c) => ({
          id: c.id,
          cents: c.price_cents,
        })),
        categories: slugs.map((slug) => ({ slug, cents: centsBySlug.get(slug) ?? null })),
      };

      // Backup first — prices only change after the snapshot is confirmed saved.
      const { error: sErr } = await db.from('price_snapshots').insert({ prices });
      if (sErr) throw new Error(`snapshot insert failed, no prices were changed: ${sErr.message}`);

      const { error: uErr } = await db
        .from('courses')
        .update({ price_cents: SALE_CENTS })
        .gt('price_cents', 0);
      if (uErr) throw new Error(uErr.message);
      for (const slug of slugs) {
        await upsertCategoryImage(db, slug, { bundlePriceCents: SALE_CENTS });
      }

      revalidateTag('catalog', 'max');
      return NextResponse.json({
        active: true,
        courses: prices.courses.length,
        categories: slugs.length,
      });
    }

    // action === 'restore'
    if (!snap) return NextResponse.json({ error: 'no_snapshot_to_restore' }, { status: 409 });
    for (const c of snap.prices.courses) {
      const { error } = await db.from('courses').update({ price_cents: c.cents }).eq('id', c.id);
      if (error) throw new Error(error.message);
    }
    for (const cat of snap.prices.categories) {
      await upsertCategoryImage(db, cat.slug, { bundlePriceCents: cat.cents });
    }
    // Only forget the snapshot once every price is back.
    const { error: dErr } = await db.from('price_snapshots').delete().eq('id', snap.id);
    if (dErr) throw new Error(dErr.message);

    revalidateTag('catalog', 'max');
    return NextResponse.json({
      active: false,
      courses: snap.prices.courses.length,
      categories: snap.prices.categories.length,
    });
  } catch (err) {
    console.error('[sale-mode] failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'failed' },
      { status: 500 },
    );
  }
}
