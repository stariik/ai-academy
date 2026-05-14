// ============================================================
// /v2 profile data — bundles everything the profile page needs into a
// single fetch so the server component stays thin. Server-only.
// ============================================================

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import {
  getOrCreateProfile,
  getUserBadges,
  getGlobalLeaderboard,
  getProgressForSession,
  getAllCourses,
  getAllLessons,
  getSessionByShareToken,
} from '@/lib/supabase/db';
import {
  tierFromXp,
  xpToNextTier,
  TIER_THRESHOLDS,
} from '@/lib/gamification/award';
import type { StudentProfile, UserBadge, Course, Lesson } from '@/types';
import type { GlobalLeaderboardResult } from '@/lib/supabase/db';

export type ActivityDay = {
  /** ISO date yyyy-mm-dd in the user's local-equivalent UTC slice. */
  date: string;
  /** 0–4 — UI maps this to color intensity. */
  level: 0 | 1 | 2 | 3 | 4;
  /** raw event count for tooltip purposes */
  count: number;
};

export type CourseProgress = {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  pct: number;
  nextLessonId: string | null;
};

export type ProfilePayload = {
  sessionId: string;
  displayName: string;
  shareToken: string | null;
  profile: StudentProfile;
  badges: UserBadge[];
  rank: GlobalLeaderboardResult;
  tier: {
    index: number;
    /** unlocks needed to reach the next tier; null at max */
    toNext: { current: number; next: number; pct: number } | null;
    thresholds: readonly number[];
  };
  activity: ActivityDay[];
  completedToday: boolean;
  totalCompletedLessons: number;
  courseProgress: CourseProgress[];
};

const HEATMAP_WEEKS = 14;
const HEATMAP_DAYS = HEATMAP_WEEKS * 7;

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function activityLevel(count: number): ActivityDay['level'] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export async function getProfilePayload(): Promise<ProfilePayload> {
  const { sessionId } = await getSession();
  const supabase = await createClient();

  const [profile, badges, rank, progress] = await Promise.all([
    getOrCreateProfile(supabase, sessionId),
    getUserBadges(supabase, sessionId),
    getGlobalLeaderboard(supabase, sessionId, 50),
    getProgressForSession(supabase, sessionId),
  ]);

  const { data: sessionRow } = await supabase
    .from('student_sessions')
    .select('display_name, share_token')
    .eq('id', sessionId)
    .single();

  const displayName = (sessionRow as { display_name?: string } | null)?.display_name ?? 'Student';
  const shareToken = (sessionRow as { share_token?: string | null } | null)?.share_token ?? null;

  // Tier
  const tierIndex = tierFromXp(profile.totalXp);
  const toNext = xpToNextTier(profile.totalXp);

  // Activity heatmap: bucket all lesson_progress rows by updated_at date,
  // then walk back HEATMAP_DAYS days and emit a row for each. Days with no
  // activity get level 0 so the grid is always visually complete.
  const eventsByDate = new Map<string, number>();
  for (const p of progress) {
    if (!p.updatedAt) continue;
    const date = p.updatedAt.slice(0, 10);
    eventsByDate.set(date, (eventsByDate.get(date) ?? 0) + 1);
  }

  const today = new Date();
  const activity: ActivityDay[] = [];
  // Anchor on the Sunday-of-this-week so columns stack cleanly in the grid.
  // We render N full weeks ending today. The legend has no week labels yet,
  // so day-anchored is fine for now.
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const iso = toIsoDate(d);
    const count = eventsByDate.get(iso) ?? 0;
    activity.push({ date: iso, level: activityLevel(count), count });
  }

  const todayIso = toIsoDate(today);
  const completedToday = (eventsByDate.get(todayIso) ?? 0) > 0;
  const totalCompletedLessons = progress.filter((p) => p.status === 'completed').length;

  // Course progress for the Progress tab. We bucket by course_id.
  let courses: Course[] = [];
  let allLessons: Lesson[] = [];
  try {
    [courses, allLessons] = await Promise.all([
      getAllCourses(supabase),
      getAllLessons(supabase, { status: 'published' }),
    ]);
  } catch {
    /* progress tab degrades gracefully */
  }

  const completedIds = new Set(progress.filter((p) => p.status === 'completed').map((p) => p.lessonId));
  const lessonsByCourse = new Map<string, Lesson[]>();
  for (const l of allLessons) {
    if (!l.courseId) continue;
    const arr = lessonsByCourse.get(l.courseId) ?? [];
    arr.push(l);
    lessonsByCourse.set(l.courseId, arr);
  }

  const courseProgress: CourseProgress[] = courses
    .map((c) => {
      const lessons = (lessonsByCourse.get(c.id) ?? []).sort(
        (a, b) => (a.positionInCourse ?? 0) - (b.positionInCourse ?? 0),
      );
      const completed = lessons.filter((l) => completedIds.has(l.id)).length;
      if (completed === 0 && lessons.length > 0) {
        // Not started — exclude from "your courses" so the list is just
        // courses with measurable progress. The Catalog handles discovery.
        return null;
      }
      const next = lessons.find((l) => !completedIds.has(l.id));
      return {
        courseId: c.id,
        courseTitle: c.title,
        totalLessons: lessons.length,
        completedLessons: completed,
        pct: lessons.length === 0 ? 0 : Math.round((completed / lessons.length) * 100),
        nextLessonId: next?.id ?? null,
      };
    })
    .filter((c): c is CourseProgress => c !== null)
    // Most-progressed first; ties broken by remaining lessons (small fav first).
    .sort((a, b) => b.pct - a.pct || a.totalLessons - b.totalLessons);

  return {
    sessionId,
    displayName,
    shareToken,
    profile,
    badges,
    rank,
    tier: { index: tierIndex, toNext, thresholds: TIER_THRESHOLDS },
    activity,
    completedToday,
    totalCompletedLessons,
    courseProgress,
  };
}

/** Public read-only view via share token — no session cookie required. */
export async function getPublicProfileByToken(
  token: string,
): Promise<Omit<ProfilePayload, 'sessionId' | 'shareToken' | 'courseProgress'> | null> {
  const supabase = await createClient();
  const session = await getSessionByShareToken(supabase, token);
  if (!session) return null;

  const sid = session.id;
  const [profile, badges, rank, progress] = await Promise.all([
    getOrCreateProfile(supabase, sid),
    getUserBadges(supabase, sid),
    getGlobalLeaderboard(supabase, sid, 50),
    getProgressForSession(supabase, sid),
  ]);

  const tierIndex = tierFromXp(profile.totalXp);
  const toNext = xpToNextTier(profile.totalXp);

  const eventsByDate = new Map<string, number>();
  for (const p of progress) {
    if (!p.updatedAt) continue;
    const date = p.updatedAt.slice(0, 10);
    eventsByDate.set(date, (eventsByDate.get(date) ?? 0) + 1);
  }
  const today = new Date();
  const activity: ActivityDay[] = [];
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const iso = toIsoDate(d);
    const count = eventsByDate.get(iso) ?? 0;
    activity.push({ date: iso, level: activityLevel(count), count });
  }

  const completedToday = (eventsByDate.get(toIsoDate(today)) ?? 0) > 0;
  const totalCompletedLessons = progress.filter((p) => p.status === 'completed').length;

  return {
    displayName: session.displayName,
    profile,
    badges,
    rank,
    tier: { index: tierIndex, toNext, thresholds: TIER_THRESHOLDS },
    activity,
    completedToday,
    totalCompletedLessons,
  };
}
