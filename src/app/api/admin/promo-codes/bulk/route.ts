// ============================================================
// POST /api/admin/promo-codes/bulk
// Body: { count, courseId?, expiresAt?, notes? }
// Returns: { codes: PromoCode[], csv: string }
//
// Bulk-generates single-use unlock codes (max_redemptions=1, per_user_limit=1).
// CSV is returned inline so the admin UI can download without a second request.
// ============================================================

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createBulkUnlockCodes, type PromoCode } from '@/lib/promo-codes';

function toCsv(codes: PromoCode[]): string {
  const header = 'code,course_id,expires_at,notes';
  const rows = codes.map((c) =>
    [c.code, c.courseId ?? '', c.expiresAt ?? '', csvEscape(c.notes ?? '')].join(','),
  );
  return [header, ...rows].join('\n');
}

function csvEscape(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: {
    count?: number;
    courseId?: string | null;
    expiresAt?: string | null;
    notes?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const count = Number(body.count);
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    return NextResponse.json({ error: 'invalid_count' }, { status: 400 });
  }

  try {
    const codes = await createBulkUnlockCodes({
      courseId: body.courseId ?? null,
      count,
      expiresAt: body.expiresAt ?? null,
      notes: body.notes ?? null,
      createdBy: admin.id,
    });
    return NextResponse.json({ codes, csv: toCsv(codes) });
  } catch (err) {
    console.error('[admin/promo-codes/bulk] failed:', err);
    return NextResponse.json({ error: 'bulk_failed' }, { status: 500 });
  }
}
