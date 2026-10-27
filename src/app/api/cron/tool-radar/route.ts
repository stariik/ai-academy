// ============================================================
// API Route: GET /api/cron/tool-radar
// Daily Vercel cron (vercel.json). Vercel sends
// `Authorization: Bearer $CRON_SECRET`; anything else is rejected.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runToolRadar } from '@/lib/admin/tool-radar';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const added = await runToolRadar();
    return NextResponse.json({ added });
  } catch (err) {
    console.error('[ToolRadar] Error:', err);
    const message = err instanceof Error ? err.message : 'Radar failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
