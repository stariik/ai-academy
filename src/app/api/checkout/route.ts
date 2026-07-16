// ============================================================
// POST /api/checkout  { courseId | categoryId, returnPath? }
//
// Starts a Bank of Georgia payment for one paid course, or for a whole
// category bundle (every course in the category, bought together):
//   1. snapshot the price into a `payments` row (status=created)
//   2. create a BOG order → get the hosted-payment redirect link
//   3. return { redirectUrl } for the client to send the browser to
//
// Prices are always read from the DB here — never taken from the body — so a
// crafted request can't pick its own amount. Access is granted later by
// /api/bog/callback, NOT here. Free courses (price_cents null/0) go through
// /api/enrollments instead.
// ============================================================

import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createOrder } from '@/lib/bog';
import { CATEGORY_VISUALS } from '@/lib/v2/data';
import { categoryCourseIds, categoryNameForSlug } from '@/lib/payments-fulfill';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing — required for checkout writes');
  }
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Only accept a same-site relative path for the post-payment return, so a
// crafted body can't turn the BOG redirect into an open redirect.
function safePath(p: unknown, fallback: string): string {
  if (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//')) return p;
  return fallback;
}

type Target = {
  /** The payments-row column identifying what's being bought. */
  insert: { course_id: string } | { category_slug: string };
  cents: number;
  product: { id: string; title: string };
  defaultReturnPath: string;
  /** Extra query appended to the success url, so the return page can reconcile. */
  successQuery: string;
};
type Fail = { error: string; status: number };

type Db = Awaited<ReturnType<typeof createClient>>;

async function courseTarget(db: Db, userId: string, courseId: string): Promise<Target | Fail> {
  const { data: course } = await db
    .from('courses')
    .select('id, title, price_cents')
    .eq('id', courseId)
    .single();
  if (!course) return { error: 'course_not_found', status: 404 };

  const cents = course.price_cents as number | null;
  if (!cents || cents <= 0) {
    // Free course — caller should use /api/enrollments.
    return { error: 'course_is_free', status: 400 };
  }

  const { data: existing } = await db
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  if (existing) return { error: 'already_enrolled', status: 409 };

  return {
    insert: { course_id: courseId },
    cents,
    product: { id: course.id, title: course.title },
    defaultReturnPath: `/courses/${courseId}`,
    successQuery: '',
  };
}

async function bundleTarget(db: Db, userId: string, slug: string): Promise<Target | Fail> {
  const nameKa = categoryNameForSlug(slug);
  if (!nameKa) return { error: 'category_not_found', status: 404 };

  const { data: meta } = await db
    .from('category_images')
    .select('bundle_price_cents')
    .eq('slug', slug)
    .maybeSingle();
  const cents = (meta?.bundle_price_cents ?? null) as number | null;
  if (!cents || cents <= 0) {
    // The catalog's derived fallback price is a display convenience only — we
    // won't charge a number no admin ever set. Price the bundle in /admin.
    return { error: 'bundle_not_priced', status: 400 };
  }

  const ids = await categoryCourseIds(db, slug);
  if (ids.length === 0) return { error: 'empty_category', status: 404 };

  // Only block when they already own the entire category. Owning part of it is
  // still a valid buy — the bundle price is for the category, and the grant
  // skips what they have.
  const { data: owned } = await db
    .from('enrollments')
    .select('course_id')
    .eq('user_id', userId)
    .in('course_id', ids);
  if ((owned?.length ?? 0) >= ids.length) {
    return { error: 'already_enrolled', status: 409 };
  }

  return {
    insert: { category_slug: slug },
    cents,
    product: { id: slug, title: `${CATEGORY_VISUALS[nameKa].nameEn} — full bundle` },
    defaultReturnPath: '/',
    successQuery: `&category=${encodeURIComponent(slug)}`,
  };
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: { courseId?: string; categoryId?: string; returnPath?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const courseId = body.courseId?.trim();
  const categoryId = body.categoryId?.trim();
  if (Boolean(courseId) === Boolean(categoryId)) {
    return NextResponse.json({ error: 'courseId_xor_categoryId_required' }, { status: 400 });
  }

  const supabase = await createClient();
  const target = courseId
    ? await courseTarget(supabase, user.id, courseId)
    : await bundleTarget(supabase, user.id, categoryId!);
  if ('error' in target) {
    return NextResponse.json({ error: target.error }, { status: target.status });
  }

  const svc = serviceClient();
  const { data: payment, error: pErr } = await svc
    .from('payments')
    .insert({ user_id: user.id, ...target.insert, amount_cents: target.cents })
    .select('id')
    .single();
  if (pErr || !payment) {
    console.error('[checkout] payment insert failed:', pErr);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // BOG rejects non-https callback urls, so localhost can't be used directly:
  // point PUBLIC_SITE_URL at a tunnel in dev, at the real domain in prod.
  const origin = process.env.PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const returnPath = safePath(body.returnPath, target.defaultReturnPath);

  try {
    const { orderId, redirectUrl } = await createOrder({
      externalOrderId: payment.id,
      amountGel: target.cents / 100,
      callbackUrl: `${origin}/api/bog/callback`,
      successUrl: `${origin}${returnPath}?payment=success${target.successQuery}`,
      failUrl: `${origin}${returnPath}?payment=failed`,
      product: target.product,
    });
    await svc
      .from('payments')
      .update({ bog_order_id: orderId, status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', payment.id);
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    await svc
      .from('payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', payment.id);
    console.error('[checkout] BOG order failed:', err);
    return NextResponse.json({ error: 'payment_init_failed' }, { status: 502 });
  }
}
