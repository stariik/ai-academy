// ============================================================
// /api/admin/categories
//   GET — list all canonical categories with their saved cover image.
// Admin-gated by src/lib/admin-auth.ts (env allowlist).
// ============================================================

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import { getCategoryImages } from '@/lib/supabase/db';
import { CATEGORIES } from '@/lib/constants/categories';
import { CATEGORY_VISUALS } from '@/lib/v2/data';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = await createClient();
  const images = await getCategoryImages(supabase);

  const categories = CATEGORIES.map((nameKa) => {
    const visual = CATEGORY_VISUALS[nameKa];
    return {
      slug: visual.slug,
      nameKa,
      nameEn: visual.nameEn,
      icon: visual.icon,
      tone: visual.tone,
      imageUrl: images[visual.slug] ?? null,
    };
  });

  return NextResponse.json({ categories });
}
