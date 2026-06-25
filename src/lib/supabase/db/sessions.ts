import { SupabaseClient } from '@supabase/supabase-js';
import type {
  StudentSessionRow,
} from '../types';
import type {
  StudentSession,
} from '@/types';


// ============================================================
// Student Sessions
// ============================================================

export async function getOrCreateSession(
  supabase: SupabaseClient,
  sessionId?: string
): Promise<StudentSession> {
  if (sessionId) {
    const { data } = await supabase
      .from('student_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (data) {
      const row = data as StudentSessionRow;
      return {
        id: row.id,
        displayName: row.display_name,
        preferences: row.preferences,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
  }

  // Create new session
  const { data, error } = await supabase
    .from('student_sessions')
    .insert({
      display_name: `Student ${Math.floor(Math.random() * 10000)}`,
      preferences: {},
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create session: ${error?.message}`);
  const row = data as StudentSessionRow;
  return {
    id: row.id,
    displayName: row.display_name,
    preferences: row.preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Find the canonical session row for a Supabase auth user, if one exists. */
export async function findSessionForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<StudentSession | null> {
  const { data } = await supabase
    .from('student_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const row = data as StudentSessionRow;
  return {
    id: row.id,
    displayName: row.display_name,
    preferences: row.preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Link an existing anonymous session row to an auth.users id. Used on first
 * sign-in to merge the user's pre-auth XP/streak/badges into their account.
 * If the user already has a different linked session row, we don't clobber it
 * — the caller is expected to fall back to findSessionForUser() in that case.
 */
export async function linkSessionToUser(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<boolean> {
  // Refuse to clobber a different user's link.
  const { data: existing } = await supabase
    .from('student_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single();
  const linked = (existing as { user_id: string | null } | null)?.user_id ?? null;
  if (linked && linked !== userId) return false;

  const { error } = await supabase
    .from('student_sessions')
    .update({ user_id: userId })
    .eq('id', sessionId);
  if (error) throw new Error(`Failed to link session to user: ${error.message}`);
  return true;
}

// ============================================================
// Share Tokens (Task 10)
// Revocable public tokens for parent/teacher progress view.
// ============================================================

function generateShareToken(): string {
  // URL-safe random — 24 bytes → ~32 chars.
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getOrCreateShareToken(
  supabase: SupabaseClient,
  sessionId: string
): Promise<string> {
  const { data } = await supabase
    .from('student_sessions')
    .select('share_token')
    .eq('id', sessionId)
    .single();
  if (data?.share_token) return data.share_token as string;

  const token = generateShareToken();
  const { error } = await supabase
    .from('student_sessions')
    .update({ share_token: token })
    .eq('id', sessionId);
  if (error) throw new Error(`Failed to create share token: ${error.message}`);
  return token;
}

export async function rotateShareToken(
  supabase: SupabaseClient,
  sessionId: string
): Promise<string> {
  const token = generateShareToken();
  const { error } = await supabase
    .from('student_sessions')
    .update({ share_token: token })
    .eq('id', sessionId);
  if (error) throw new Error(`Failed to rotate share token: ${error.message}`);
  return token;
}

export async function revokeShareToken(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from('student_sessions')
    .update({ share_token: null })
    .eq('id', sessionId);
  if (error) throw new Error(`Failed to revoke share token: ${error.message}`);
}

export async function setSessionDisplayName(
  supabase: SupabaseClient,
  sessionId: string,
  displayName: string,
): Promise<void> {
  const trimmed = displayName.trim().slice(0, 60);
  if (trimmed.length === 0) throw new Error('Display name cannot be empty');
  const { error } = await supabase
    .from('student_sessions')
    .update({ display_name: trimmed })
    .eq('id', sessionId);
  if (error) throw new Error(`Failed to update display name: ${error.message}`);
}

export async function getSessionByShareToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ id: string; displayName: string } | null> {
  const { data } = await supabase
    .from('student_sessions')
    .select('id, display_name')
    .eq('share_token', token)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id as string, displayName: data.display_name as string };
}
