// ============================================================
// API: GET /api/profile - Student learning profile
//       PUT /api/profile - Update profile
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateProfile, updateProfile } from '@/lib/supabase/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const { sessionId } = await getSession();
    const supabase = await createClient();
    const profile = await getOrCreateProfile(supabase, sessionId);
    return NextResponse.json(profile);
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId } = await getSession();
    const body = await request.json();
    const supabase = await createClient();
    const profile = await updateProfile(supabase, sessionId, body);
    return NextResponse.json(profile);
  } catch (err) {
    console.error('Profile PUT error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
