// ============================================================
// /api/admin/categories
//   GET — list all canonical categories with their saved cover image.
// Admin-gated by src/lib/admin-auth.ts (env allowlist).
// ============================================================

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import { getCategoryMeta } from '@/lib/supabase/db';
import { CATEGORIES } from '@/lib/constants/categories';
import { CATEGORY_VISUALS } from '@/lib/v2/data';
import { getAllCourses } from '@/lib/supabase/db';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = await createClient();
  const [meta, courses] = await Promise.all([
    getCategoryMeta(supabase),
    getAllCourses(supabase),
  ]);

  // Count courses tagged into each canonical category (by KA name).
  const courseCounts = new Map<string, number>();
  for (const c of courses) {
    for (const tag of c.tags ?? []) {
      if (CATEGORY_VISUALS[tag]) {
        courseCounts.set(tag, (courseCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  const categories = CATEGORIES.map((nameKa) => {
    const visual = CATEGORY_VISUALS[nameKa];
    const m = meta[visual.slug];
    return {
      slug: visual.slug,
      nameKa,
      nameEn: visual.nameEn,
      icon: visual.icon,
      tone: visual.tone,
      imageUrl: m?.imageUrl ?? null,
      bundlePriceCents: m?.bundlePriceCents ?? null,
      bundleRetailCents: m?.bundleRetailCents ?? null,
      courseCount: courseCounts.get(nameKa) ?? 0,
    };
  });

  return NextResponse.json({ categories });
}
