// ============================================================
// Admin gate (stop-gap)
//
// ROADMAP P0 #1 promises proper role-based auth; until that lands,
// admin routes are gated by an `ADMIN_EMAILS` env var allowlist
// (comma-separated). If the env is empty, admin access is denied for
// every authenticated user — production-safe by default.
//
// In local dev, set `ADMIN_EMAILS=you@example.com` in `.env.local`.
// ============================================================

import 'server-only';
import { getAuthUser, type AuthUser } from '@/lib/auth';

function allowedEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Returns the current admin AuthUser, or null if the caller is not an admin. */
export async function getAdminUser(): Promise<AuthUser | null> {
  const user = await getAuthUser();
  if (!user?.email) return null;
  const allow = allowedEmails();
  if (allow.length === 0) return null;
  return allow.includes(user.email.toLowerCase()) ? user : null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}
