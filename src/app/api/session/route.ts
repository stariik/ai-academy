// ============================================================
// GET /api/session - Returns session ID to client
// ============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const { sessionId } = await getSession();
    return NextResponse.json({ sessionId });
  } catch (err) {
    console.error('Session error:', err);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
