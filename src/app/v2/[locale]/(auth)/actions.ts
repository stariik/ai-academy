'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  linkSessionToUser,
  findSessionForUser,
  setSessionDisplayName,
} from '@/lib/supabase/db';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/lib/v2/i18n';

const SESSION_COOKIE = 'ai_academy_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export type AuthState = { error?: string } | null;

function resolveLocale(localeFromForm: string | null): Locale {
  if (localeFromForm && isLocale(localeFromForm)) return localeFromForm;
  return DEFAULT_LOCALE;
}

/** Best-effort merge of the cookie-anchored anonymous session into a user. */
async function attachCookieSessionToUser(userId: string) {
  const cookieStore = await cookies();
  const cookieSessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookieSessionId) return;

  const supabase = await createClient();
  try {
    await linkSessionToUser(supabase, cookieSessionId, userId);
  } catch {
    /* swallow — the next getSession() call will create / link a fresh row */
  }
}

/** Point the cookie at the user's canonical session (if linked elsewhere). */
async function ensureCookieMatchesLinkedSession(userId: string) {
  const supabase = await createClient();
  const linked = await findSessionForUser(supabase, userId);
  if (!linked) return;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, linked.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const locale = resolveLocale(formData.get('locale') as string | null);

  if (!email || !password) {
    return { error: 'EMPTY_FIELDS' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { error: 'INVALID_CREDENTIALS' };
  }

  // Merge anonymous cookie session if the user has none yet, otherwise
  // point the cookie at the canonical linked session.
  await attachCookieSessionToUser(data.user.id);
  await ensureCookieMatchesLinkedSession(data.user.id);

  redirect(`/v2/${locale}/profile`);
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('displayName') ?? '').trim();
  const locale = resolveLocale(formData.get('locale') as string | null);

  if (!email || !password || !displayName) {
    return { error: 'EMPTY_FIELDS' };
  }
  if (password.length < 8) {
    return { error: 'PASSWORD_TOO_SHORT' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });
  if (error || !data.user) {
    return { error: 'SIGNUP_FAILED' };
  }

  // If the project requires email confirmation, data.session will be null.
  // We still link the cookie session so that when the user confirms and
  // signs in for the first time, their guest XP comes with them.
  await attachCookieSessionToUser(data.user.id);

  // Try to write displayName onto the linked session too so it appears on
  // leaderboards immediately.
  const cookieStore = await cookies();
  const cookieSessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (cookieSessionId) {
    try {
      await setSessionDisplayName(supabase, cookieSessionId, displayName);
    } catch {
      /* non-fatal */
    }
  }

  // If session is present (no email confirmation required), go to profile.
  // Otherwise, route to login with a "check your email" hint.
  if (data.session) {
    redirect(`/v2/${locale}/profile`);
  }
  redirect(`/v2/${locale}/login?confirm=1`);
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(formData.get('locale') as string | null);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/v2/${locale}`);
}
