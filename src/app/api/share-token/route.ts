// ============================================================
// Share tokens for parent/teacher progress views (Task 10)
// GET  — return existing token (creates one if missing)
// POST — rotate: issue a new token (invalidates the old URL)
// DELETE — revoke
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getOrCreateShareToken,
  rotateShareToken,
  revokeShareToken,
} from '@/lib/supabase/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const { sessionId } = await getSession();
    const supabase = await createClient();
    const token = await getOrCreateShareToken(supabase, sessionId);
    return NextResponse.json({ token });
  } catch (err) {
    console.error('share-token GET error:', err);
    return NextResponse.json({ error: 'Failed to load share token' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { sessionId } = await getSession();
    const supabase = await createClient();
    const token = await rotateShareToken(supabase, sessionId);
    return NextResponse.json({ token });
  } catch (err) {
    console.error('share-token POST error:', err);
    return NextResponse.json({ error: 'Failed to rotate share token' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { sessionId } = await getSession();
    const supabase = await createClient();
    await revokeShareToken(supabase, sessionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('share-token DELETE error:', err);
    return NextResponse.json({ error: 'Failed to revoke share token' }, { status: 500 });
  }
}
