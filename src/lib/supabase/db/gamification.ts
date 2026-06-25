import { SupabaseClient } from '@supabase/supabase-js';
import type {
  UserBadgeRow,
} from '../types';
import type {
  UserBadge,
  LeaderboardEntry,
} from '@/types';


// ============================================================
// Badges (Task 6)
// ============================================================

export async function getUserBadges(
  supabase: SupabaseClient,
  sessionId: string
): Promise<UserBadge[]> {
  const { data } = await supabase
    .from('user_badges')
    .select('*')
    .eq('session_id', sessionId)
    .order('earned_at', { ascending: false });
  if (!data) return [];
  return (data as UserBadgeRow[]).map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    badgeCode: row.badge_code,
    metadata: row.metadata ?? {},
    earnedAt: row.earned_at,
  }));
}

// Insert badges the user has just earned, skipping any already owned.
// Returns the codes that were newly inserted.
export async function unlockBadges(
  supabase: SupabaseClient,
  sessionId: string,
  codes: string[],
  metadata: Record<string, unknown> = {}
): Promise<string[]> {
  if (codes.length === 0) return [];
  const { data: existing } = await supabase
    .from('user_badges')
    .select('badge_code')
    .eq('session_id', sessionId)
    .in('badge_code', codes);
  const owned = new Set((existing ?? []).map((r: { badge_code: string }) => r.badge_code));
  const toInsert = codes.filter((c) => !owned.has(c));
  if (toInsert.length === 0) return [];
  const { error } = await supabase.from('user_badges').insert(
    toInsert.map((c) => ({ session_id: sessionId, badge_code: c, metadata }))
  );
  if (error) throw new Error(`Failed to unlock badges: ${error.message}`);
  return toInsert;
}

// ============================================================
// Leaderboard (Task 6)
// Ranked by total XP earned from this course's lessons.
// ============================================================

export async function getCourseLeaderboard(
  supabase: SupabaseClient,
  courseId: string,
  limit = 20
): Promise<LeaderboardEntry[]> {
  const { data: lessonsInCourse } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId);

  const lessonIds = (lessonsInCourse ?? []).map((l: { id: string }) => l.id);
  if (lessonIds.length === 0) return [];

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('session_id, percentage, passed, lesson_id')
    .in('lesson_id', lessonIds);

  // Aggregate rough XP proxy per session from attempts.
  // (Canonical XP lives on student_profiles.total_xp, but that's global — this
  // slice is course-specific so we recompute from attempts against course lessons.)
  const bySession = new Map<
    string,
    { xp: number; lessonsCompleted: Set<string> }
  >();
  for (const a of (attempts ?? []) as {
    session_id: string;
    percentage: number;
    passed: boolean;
    lesson_id: string;
  }[]) {
    const entry = bySession.get(a.session_id) ?? { xp: 0, lessonsCompleted: new Set<string>() };
    entry.xp += Math.round(50 + a.percentage * 2);
    if (a.passed) entry.lessonsCompleted.add(a.lesson_id);
    bySession.set(a.session_id, entry);
  }

  if (bySession.size === 0) return [];

  const sessionIds = Array.from(bySession.keys());
  const { data: sessionRows } = await supabase
    .from('student_sessions')
    .select('id, display_name')
    .in('id', sessionIds);
  const nameById = new Map(
    (sessionRows ?? []).map((s: { id: string; display_name: string }) => [s.id, s.display_name])
  );

  const entries: Omit<LeaderboardEntry, 'rank'>[] = sessionIds.map((sid) => {
    const info = bySession.get(sid)!;
    return {
      sessionId: sid,
      displayName: nameById.get(sid) ?? 'Student',
      xp: info.xp,
      lessonsCompleted: info.lessonsCompleted.size,
    };
  });

  entries.sort((a, b) => b.xp - a.xp);

  return entries.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));
}

// ============================================================
// Global leaderboard — ranked by canonical total_xp on student_profiles
// ============================================================

export type GlobalLeaderboardResult = {
  top: LeaderboardEntry[];
  total: number;
  yourRank: number | null;
  yourXp: number;
};

export async function getGlobalLeaderboard(
  supabase: SupabaseClient,
  sessionId: string | null,
  limit = 50,
): Promise<GlobalLeaderboardResult> {
  // Pull every profile with non-zero XP, ranked. With realistic learner
  // counts this is fine; if it gets huge we'd add a server-side window
  // function. For now, ordering in the DB and slicing in JS is plenty.
  const { data: profileRows } = await supabase
    .from('student_profiles')
    .select('session_id, total_xp')
    .gt('total_xp', 0)
    .order('total_xp', { ascending: false });

  const profiles = (profileRows ?? []) as { session_id: string; total_xp: number }[];
  const total = profiles.length;
  if (total === 0) return { top: [], total: 0, yourRank: null, yourXp: 0 };

  const topSlice = profiles.slice(0, limit);
  const topSessionIds = topSlice.map((p) => p.session_id);

  // Display names + lesson-completed counts for the visible top slice.
  const { data: sessionRows } = await supabase
    .from('student_sessions')
    .select('id, display_name')
    .in('id', topSessionIds);
  const nameById = new Map(
    (sessionRows ?? []).map((s: { id: string; display_name: string }) => [s.id, s.display_name]),
  );

  const { data: progressRows } = await supabase
    .from('lesson_progress')
    .select('session_id')
    .in('session_id', topSessionIds)
    .eq('status', 'completed');
  const completedBySession = new Map<string, number>();
  for (const p of (progressRows ?? []) as { session_id: string }[]) {
    completedBySession.set(p.session_id, (completedBySession.get(p.session_id) ?? 0) + 1);
  }

  const top: LeaderboardEntry[] = topSlice.map((p, i) => ({
    sessionId: p.session_id,
    displayName: nameById.get(p.session_id) ?? 'Student',
    xp: p.total_xp,
    lessonsCompleted: completedBySession.get(p.session_id) ?? 0,
    rank: i + 1,
  }));

  // Find caller's row in the full ranked list.
  let yourRank: number | null = null;
  let yourXp = 0;
  if (sessionId) {
    const idx = profiles.findIndex((p) => p.session_id === sessionId);
    if (idx >= 0) {
      yourRank = idx + 1;
      yourXp = profiles[idx].total_xp;
    }
  }

  return { top, total, yourRank, yourXp };
}
