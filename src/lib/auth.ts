// ============================================================
// Server-side auth helpers (Supabase Auth).
// Use these in server components / route handlers / server actions.
// ============================================================

import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type AuthUser = {
  id: string;
  email: string | null;
  /** From user_metadata.display_name, falls back to email's local-part. */
  displayName: string | null;
};

/** Returns the currently authenticated Supabase user, or null. */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const displayName =
    (u.user_metadata as { display_name?: string } | null)?.display_name ??
    u.email?.split('@')[0] ??
    null;
  return { id: u.id, email: u.email ?? null, displayName };
}

/** Convenience: throw / redirect-friendly. Throws if not authed. */
export async function requireAuthUser(): Promise<AuthUser> {
  const u = await getAuthUser();
  if (!u) throw new Error('Not authenticated');
  return u;
}
