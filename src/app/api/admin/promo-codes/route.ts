// ============================================================
// /api/admin/promo-codes
//   GET  — list (with ?filter=active|expired|exhausted|inactive|all)
//   POST — create a single code
// Admin-gated by src/lib/admin-auth.ts (env allowlist).
// ============================================================

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import {
  createPromoCode,
  listPromoCodes,
  type PromoCodeType,
  type PromoFilter,
} from '@/lib/promo-codes';

const VALID_FILTERS: PromoFilter[] = ['all', 'active', 'expired', 'exhausted', 'inactive'];
const VALID_TYPES: PromoCodeType[] = ['unlock', 'percent_off', 'amount_off'];

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const filterParam = (url.searchParams.get('filter') ?? 'all') as PromoFilter;
  const filter: PromoFilter = VALID_FILTERS.includes(filterParam) ? filterParam : 'all';

  try {
    const codes = await listPromoCodes(filter);
    return NextResponse.json({ codes });
  } catch (err) {
    console.error('[admin/promo-codes] list failed:', err);
    return NextResponse.json({ error: 'list_failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: {
    code?: string;
    type?: PromoCodeType;
    courseId?: string | null;
    percentOff?: number | null;
    amountOffCents?: number | null;
    maxRedemptions?: number | null;
    perUserLimit?: number;
    expiresAt?: string | null;
    notes?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }

  if (body.type === 'percent_off' && (body.percentOff == null || body.percentOff <= 0 || body.percentOff > 100)) {
    return NextResponse.json({ error: 'invalid_percent_off' }, { status: 400 });
  }
  if (body.type === 'amount_off' && (body.amountOffCents == null || body.amountOffCents <= 0)) {
    return NextResponse.json({ error: 'invalid_amount_off' }, { status: 400 });
  }

  try {
    const code = await createPromoCode({
      code: body.code ?? undefined,
      type: body.type,
      courseId: body.courseId ?? null,
      percentOff: body.percentOff ?? null,
      amountOffCents: body.amountOffCents ?? null,
      maxRedemptions: body.maxRedemptions ?? null,
      perUserLimit: body.perUserLimit ?? 1,
      expiresAt: body.expiresAt ?? null,
      notes: body.notes ?? null,
      createdBy: admin.id,
    });
    return NextResponse.json({ code });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'create_failed';
    // Unique-violation surfaces from postgres with code 23505
    if (typeof message === 'string' && message.includes('duplicate key')) {
      return NextResponse.json({ error: 'code_already_exists' }, { status: 409 });
    }
    console.error('[admin/promo-codes] create failed:', err);
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}
