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

/**
 * Where to send the user after a successful sign-in/up.
 *
 * If they arrived from `/redeem/CODE`, the form carries the code through
 * as a hidden field. We send them back to the redeem page so the auto-
 * apply client fires. The code is normalised + length-capped to avoid
 * abusing the redirect with arbitrary payloads.
 */
function postAuthDestination(locale: Locale, rawRedeem: string | null): string {
  if (rawRedeem) {
    const code = rawRedeem.trim().toUpperCase();
    if (/^[A-Z0-9-]{4,32}$/.test(code)) {
      return `/${locale}/redeem/${encodeURIComponent(code)}`;
    }
  }
  return `/${locale}`;
}

function onboardingDestination(locale: Locale, rawRedeem: string | null): string {
  if (rawRedeem) {
    const code = rawRedeem.trim().toUpperCase();
    if (/^[A-Z0-9-]{4,32}$/.test(code)) {
      return `/${locale}/welcome?redeem=${encodeURIComponent(code)}`;
    }
  }
  return `/${locale}/welcome`;
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
  const redeem = (formData.get('redeem') as string | null) ?? null;

  if (!email || !password) {
    return { error: 'EMPTY_FIELDS' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    console.error('[auth.signIn] failed', {
      message: error?.message,
      status: error?.status,
    });
    return { error: 'INVALID_CREDENTIALS' };
  }

  // Merge anonymous cookie session if the user has none yet, otherwise
  // point the cookie at the canonical linked session.
  await attachCookieSessionToUser(data.user.id);
  await ensureCookieMatchesLinkedSession(data.user.id);

  const metadata = data.user.user_metadata as {
    onboarding_required?: boolean;
    onboarding_completed?: boolean;
  } | null;
  if (metadata?.onboarding_required === true && metadata.onboarding_completed !== true) {
    redirect(onboardingDestination(locale, redeem));
  }
  redirect(postAuthDestination(locale, redeem));
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('displayName') ?? '').trim();
  const locale = resolveLocale(formData.get('locale') as string | null);
  const redeem = (formData.get('redeem') as string | null) ?? null;

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
      data: {
        display_name: displayName,
        onboarding_required: true,
        onboarding_completed: false,
      },
    },
  });
  if (error || !data.user) {
    console.error('[auth.signUp] failed', {
      message: error?.message,
      status: error?.status,
      name: error?.name,
      code: (error as { code?: string } | null)?.code,
      hasUser: Boolean(data?.user),
    });
    if (error?.message?.toLowerCase().includes('already registered')) {
      return { error: 'EMAIL_TAKEN' };
    }
    if (error?.message?.toLowerCase().includes('rate')) {
      return { error: 'RATE_LIMITED' };
    }
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

  // If session is present (no email confirmation required), go to profile
  // (or auto-apply redeem if they arrived from /redeem/CODE).
  // Otherwise, route to login with a "check your email" hint — preserving
  // the redeem code so they can pick up where they left off after confirming.
  if (data.session) {
    redirect(onboardingDestination(locale, redeem));
  }
  const confirmDest = redeem
    ? `/${locale}/login?confirm=1&redeem=${encodeURIComponent(redeem)}`
    : `/${locale}/login?confirm=1`;
  redirect(confirmDest);
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(formData.get('locale') as string | null);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}
