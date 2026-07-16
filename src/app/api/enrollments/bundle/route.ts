// ============================================================
// POST /api/enrollments/bundle — enrol the current user in every course of
// a FREE category, like the single-course /api/enrollments route.
//
// A category with an admin-set bundle price is not free and must go through
// /api/checkout instead — this route rejects it. Without that check this is a
// giveaway: it grants the whole category with no payment.
//
// Body: { categoryId: string }. Course ids are resolved server-side from the
// category so the client can't enrol an arbitrary set. Idempotent — already
// owned courses are returned as-is.
// ============================================================

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { enrollCurrentUser } from '@/lib/enrollments';
import { getCourses } from '@/lib/v2/db';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: { categoryId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const categoryId = body.categoryId?.trim();
  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId_required' }, { status: 400 });
  }

  // Paid bundles must go through BOG checkout — never granted for free here.
  const supabase = await createClient();
  const { data: meta } = await supabase
    .from('category_images')
    .select('bundle_price_cents')
    .eq('slug', categoryId)
    .maybeSingle();
  if ((meta?.bundle_price_cents ?? 0) > 0) {
    return NextResponse.json({ error: 'bundle_requires_payment' }, { status: 402 });
  }

  // Course ids are locale-independent — any locale resolves the same set.
  const courses = await getCourses('ka');
  const ids = courses.filter((c) => c.categoryId === categoryId).map((c) => c.id);
  if (ids.length === 0) {
    return NextResponse.json({ error: 'empty_category' }, { status: 404 });
  }

  const enrolled: string[] = [];
  for (const id of ids) {
    const res = await enrollCurrentUser(id, 'free');
    if (res.ok) enrolled.push(id);
  }

  if (enrolled.length === 0) {
    return NextResponse.json({ error: 'enroll_failed' }, { status: 500 });
  }
  return NextResponse.json({ enrolled });
}
