// ============================================================
// Server-side session management
// Anonymous cookie-based sessions (30-day expiry)
// ============================================================

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateSession } from '@/lib/supabase/db';

const SESSION_COOKIE = 'ai_academy_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function getSession(): Promise<{ sessionId: string }> {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(SESSION_COOKIE)?.value;

  const supabase = await createClient();
  const session = await getOrCreateSession(supabase, existingId);

  // Set/refresh the cookie
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return { sessionId: session.id };
}

export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}
