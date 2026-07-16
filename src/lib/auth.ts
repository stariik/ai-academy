// ============================================================
// Server-side auth helpers (Supabase Auth).
// Use these in server components / route handlers / server actions.
// ============================================================

import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type AuthUser = {
  id: string;
  email: string | null;
  /** From user_metadata.display_name, falls back to email's local-part. */
  displayName: string | null;
};

/**
 * Returns the currently authenticated Supabase user, or null.
 * Wrapped in React cache() so repeated calls within one render dedupe to a
 * single auth round-trip.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  // No auth cookie → definitely logged out. Skip the network round-trip that
  // auth.getUser() makes to validate the token.
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));
  if (!hasAuthCookie) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const displayName =
    (u.user_metadata as { display_name?: string } | null)?.display_name ??
    u.email?.split('@')[0] ??
    null;
  return { id: u.id, email: u.email ?? null, displayName };
});

/** Convenience: throw / redirect-friendly. Throws if not authed. */
export async function requireAuthUser(): Promise<AuthUser> {
  const u = await getAuthUser();
  if (!u) throw new Error('Not authenticated');
  return u;
}
