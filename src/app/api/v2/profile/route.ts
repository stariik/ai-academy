// ============================================================
// POST /api/v2/profile
// Profile-settings mutations driven from the /v2 profile Settings tab.
// Discriminated by `action`: setDisplayName | ensureShareToken | rotateShareToken
// All actions are scoped to the current session cookie — no impersonation
// is possible because we never trust a session id from the request body.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import {
  setSessionDisplayName,
  getOrCreateShareToken,
  rotateShareToken,
} from '@/lib/supabase/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await getSession();
    const supabase = await createClient();
    const body = await request.json();
    const action = body?.action as string | undefined;

    switch (action) {
      case 'setDisplayName': {
        const name = String(body?.displayName ?? '').trim();
        if (!name) {
          return NextResponse.json({ error: 'displayName required' }, { status: 400 });
        }
        await setSessionDisplayName(supabase, sessionId, name);
        return NextResponse.json({ ok: true, displayName: name });
      }
      case 'ensureShareToken': {
        const token = await getOrCreateShareToken(supabase, sessionId);
        return NextResponse.json({ ok: true, token });
      }
      case 'rotateShareToken': {
        const token = await rotateShareToken(supabase, sessionId);
        return NextResponse.json({ ok: true, token });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('v2/profile POST error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
