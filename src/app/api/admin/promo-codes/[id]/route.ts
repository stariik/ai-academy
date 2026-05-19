// ============================================================
// /api/admin/promo-codes/[id]
//   GET    — single code + its redemption log
//   PATCH  — { isActive: boolean } to deactivate / reactivate
// ============================================================

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { getPromoCode, listRedemptions, setPromoActive } from '@/lib/promo-codes';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  try {
    const code = await getPromoCode(id);
    if (!code) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const redemptions = await listRedemptions(id);
    return NextResponse.json({ code, redemptions });
  } catch (err) {
    console.error('[admin/promo-codes/:id] get failed:', err);
    return NextResponse.json({ error: 'get_failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  let body: { isActive?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  if (typeof body.isActive !== 'boolean') {
    return NextResponse.json({ error: 'isActive_required' }, { status: 400 });
  }

  try {
    await setPromoActive(id, body.isActive);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/promo-codes/:id] patch failed:', err);
    return NextResponse.json({ error: 'patch_failed' }, { status: 500 });
  }
}
