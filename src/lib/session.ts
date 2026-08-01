// ============================================================
// Server-side session management.
//
// There are two layers:
//   1. Anonymous student_sessions row + cookie. Created on first visit.
//      Tracks XP / progress / badges for guests.
//   2. Optional link to a Supabase auth.users via student_sessions.user_id.
//      Once a user signs in, the anonymous session is linked, and on
//      subsequent visits we always resolve to the linked session row.
//
// getSession() handles both paths transparently — callers just get a
// sessionId that scopes their data.
// ============================================================

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  getOrCreateSession,
  findSessionForUser,
  linkSessionToUser,
} from '@/lib/supabase/db';
import { getAuthUser } from '@/lib/auth';

const SESSION_COOKIE = 'ai_academy_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// ponytail: Server Components can't write cookies (Next throws). getSession()
// runs from both RSC and route handlers, so the write is best-effort — the
// sessionId is resolved from the DB either way, and the next API call (a route
// handler) persists the cookie. Move this into middleware only if the extra
// findSessionForUser() lookup per RSC render shows up in profiling.
function writeSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  id: string,
) {
  try {
    cookieStore.set(SESSION_COOKIE, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
  } catch {
    /* read-only cookie store (Server Component render) */
  }
}

export async function getSession(): Promise<{ sessionId: string }> {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get(SESSION_COOKIE)?.value;
  const supabase = await createClient();

  const authUser = await getAuthUser();

  // Auth case: prefer the user's canonical session row.
  if (authUser) {
    const linked = await findSessionForUser(supabase, authUser.id);
    if (linked) {
      // Make sure the cookie points at the canonical row in case the user
      // signed in on a fresh browser with no cookie or a different one.
      if (cookieId !== linked.id) writeSessionCookie(cookieStore, linked.id);
      return { sessionId: linked.id };
    }

    // No linked session yet. If we have an anonymous one in the cookie,
    // link it (merge progress). Otherwise create a fresh one for this user.
    const anon = await getOrCreateSession(supabase, cookieId);
    try {
      const linkedOk = await linkSessionToUser(supabase, anon.id, authUser.id);
      if (!linkedOk) {
        // Cookie session is linked to a DIFFERENT auth user (e.g. shared
        // browser). Fall back to a new session for this user.
        const fresh = await getOrCreateSession(supabase);
        await linkSessionToUser(supabase, fresh.id, authUser.id);
        writeSessionCookie(cookieStore, fresh.id);
        return { sessionId: fresh.id };
      }
    } catch {
      /* link error — fall through and still return anon.id */
    }
    if (cookieId !== anon.id) writeSessionCookie(cookieStore, anon.id);
    return { sessionId: anon.id };
  }

  // Anonymous case: cookie-based.
  const session = await getOrCreateSession(supabase, cookieId);
  writeSessionCookie(cookieStore, session.id);

  return { sessionId: session.id };
}

export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}
