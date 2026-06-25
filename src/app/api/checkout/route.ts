// ============================================================
// POST /api/checkout  { courseId, returnPath? }
//
// Starts a Bank of Georgia payment for a single paid course:
//   1. snapshot the course price into a `payments` row (status=created)
//   2. create a BOG order → get the hosted-payment redirect link
//   3. return { redirectUrl } for the client to send the browser to
//
// Access is granted later by /api/bog/callback, NOT here. Free courses
// (price_cents null/0) go through /api/enrollments instead.
// ============================================================

import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createOrder } from '@/lib/bog';

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

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: { courseId?: string; returnPath?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const courseId = body.courseId?.trim();
  if (!courseId) {
    return NextResponse.json({ error: 'courseId_required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, price_cents')
    .eq('id', courseId)
    .single();
  if (!course) {
    return NextResponse.json({ error: 'course_not_found' }, { status: 404 });
  }

  const cents = course.price_cents as number | null;
  if (!cents || cents <= 0) {
    // Free course — caller should use /api/enrollments.
    return NextResponse.json({ error: 'course_is_free' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'already_enrolled' }, { status: 409 });
  }

  const svc = serviceClient();
  const { data: payment, error: pErr } = await svc
    .from('payments')
    .insert({ user_id: user.id, course_id: courseId, amount_cents: cents })
    .select('id')
    .single();
  if (pErr || !payment) {
    console.error('[checkout] payment insert failed:', pErr);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  const origin = new URL(req.url).origin;
  const returnPath = safePath(body.returnPath, `/courses/${courseId}`);

  try {
    const { orderId, redirectUrl } = await createOrder({
      externalOrderId: payment.id,
      amountGel: cents / 100,
      callbackUrl: `${origin}/api/bog/callback`,
      successUrl: `${origin}${returnPath}?payment=success`,
      failUrl: `${origin}${returnPath}?payment=failed`,
      product: { id: course.id, title: course.title },
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
