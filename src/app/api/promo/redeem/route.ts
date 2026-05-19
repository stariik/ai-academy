// ============================================================
// POST /api/promo/redeem  { code, courseId? }
//
// Atomic redemption via the redeem_promo_code() RPC. Auth required.
// Returns the RPC's single-row status. UI maps `status` → friendly i18n.
//
// Rate limiting hooks live in src/lib/security-patterns.ts but are not
// applied yet (ROADMAP P0 #2 covers this and will be wired in step 5).
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth';
import { RateLimiters } from '@/lib/security-patterns';

export const dynamic = 'force-dynamic';

type RpcRow = {
  status: string;
  course_id: string | null;
  promo_id: string | null;
  message: string;
};

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ status: 'unauthenticated', message: 'Sign in to redeem.' }, { status: 401 });
  }

  // Rate limit on both the user id AND the source IP. The user-id bucket
  // catches authed-account brute force; the IP bucket catches a single
  // attacker rotating accounts. Take the more restrictive of the two.
  const userLimit = RateLimiters.promoRedeem(`promo:user:${user.id}`);
  const ipLimit = RateLimiters.promoRedeem(`promo:ip:${clientIp(req)}`);
  if (!userLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(
      { status: 'rate_limited', message: 'Too many attempts. Try again later.' },
      { status: 429 },
    );
  }

  let body: { code?: string; courseId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ status: 'not_found', message: 'Enter a code.' }, { status: 400 });
  }
  if (code.length > 64) {
    // Migration's CHECK constraint caps at 32, but be defensive at the boundary.
    return NextResponse.json({ status: 'not_found', message: 'Code is too long.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('redeem_promo_code', {
    p_code: code,
    p_course_id: body.courseId ?? null,
  });

  if (error) {
    console.error('[promo/redeem] RPC error:', error);
    return NextResponse.json({ status: 'error', message: 'Something went wrong.' }, { status: 500 });
  }

  // Supabase returns an array for SETOF/TABLE-returning functions.
  const row: RpcRow | undefined = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json({ status: 'error', message: 'No response from server.' }, { status: 500 });
  }

  const okStatuses = new Set(['ok', 'already_enrolled']);
  const statusCode = okStatuses.has(row.status) ? 200 : 400;

  return NextResponse.json(
    {
      status: row.status,
      message: row.message,
      courseId: row.course_id,
      promoId: row.promo_id,
    },
    { status: statusCode },
  );
}
