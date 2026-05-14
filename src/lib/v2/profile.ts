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
import { CATEGORY_VISUALS, type Tone, type AudienceTag } from '@/lib/v2/data';
import { CATEGORIES as CANONICAL_CATEGORIES } from '@/lib/constants/categories';

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
  categorySlug: string | null;
};

export type CategoryProgress = {
  categorySlug: string;
  nameKa: string;
  icon: string;
  tone: Tone;
  audience: AudienceTag;
  totalLessons: number;
  completedLessons: number;
  pct: number;
};

export type RecommendedNext = {
  lessonId: string;
  courseId: string;
  courseTitle: string;
  categorySlug: string | null;
  pct: number;
} | null;

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
  categoryProgress: CategoryProgress[];
  recommendedNext: RecommendedNext;
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

  // First canonical-tag lookup so we can attach categorySlug to each course.
  const firstCanonicalTag = (tags: string[]): string | null => {
    for (const tag of tags) {
      if (CATEGORY_VISUALS[tag]) return tag;
    }
    return null;
  };

  const allCourseProgress = courses.map((c) => {
    const lessons = (lessonsByCourse.get(c.id) ?? []).sort(
      (a, b) => (a.positionInCourse ?? 0) - (b.positionInCourse ?? 0),
    );
    const completed = lessons.filter((l) => completedIds.has(l.id)).length;
    const next = lessons.find((l) => !completedIds.has(l.id));
    const tag = firstCanonicalTag(c.tags ?? []);
    const slug = tag ? CATEGORY_VISUALS[tag].slug : null;
    return {
      courseId: c.id,
      courseTitle: c.title,
      totalLessons: lessons.length,
      completedLessons: completed,
      pct: lessons.length === 0 ? 0 : Math.round((completed / lessons.length) * 100),
      nextLessonId: next?.id ?? null,
      categorySlug: slug,
      tag,
    };
  });

  const courseProgress: CourseProgress[] = allCourseProgress
    .filter((c) => c.completedLessons > 0)
    .map(({ tag: _tag, ...c }) => c)
    .sort((a, b) => b.pct - a.pct || a.totalLessons - b.totalLessons);

  // Per-canonical-category aggregation (always emit all 9 so the UI is stable).
  const categoryProgress: CategoryProgress[] = CANONICAL_CATEGORIES.map((nameKa) => {
    const visual = CATEGORY_VISUALS[nameKa];
    const inCat = allCourseProgress.filter((c) => c.tag === nameKa);
    const totalLessons = inCat.reduce((sum, c) => sum + c.totalLessons, 0);
    const completedLessons = inCat.reduce((sum, c) => sum + c.completedLessons, 0);
    return {
      categorySlug: visual.slug,
      nameKa,
      icon: visual.icon,
      tone: visual.tone,
      audience: visual.audience,
      totalLessons,
      completedLessons,
      pct: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
    };
  });

  // Recommended next: the in-progress course closest to completion (highest pct
  // under 100), or the lowest-progress untouched category's first course.
  let recommendedNext: RecommendedNext = null;
  const partial = courseProgress.find((c) => c.pct < 100 && c.nextLessonId !== null);
  if (partial) {
    recommendedNext = {
      lessonId: partial.nextLessonId!,
      courseId: partial.courseId,
      courseTitle: partial.courseTitle,
      categorySlug: partial.categorySlug,
      pct: partial.pct,
    };
  } else {
    // No partials → suggest a category the user hasn't touched yet.
    const untouched = allCourseProgress.find(
      (c) => c.completedLessons === 0 && c.nextLessonId !== null,
    );
    if (untouched) {
      recommendedNext = {
        lessonId: untouched.nextLessonId!,
        courseId: untouched.courseId,
        courseTitle: untouched.courseTitle,
        categorySlug: untouched.categorySlug,
        pct: 0,
      };
    }
  }

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
    categoryProgress,
    recommendedNext,
  };
}

export type PublicProfilePayload = Omit<
  ProfilePayload,
  'sessionId' | 'shareToken' | 'courseProgress' | 'categoryProgress' | 'recommendedNext'
>;

/** Public read-only view via share token — no session cookie required. */
export async function getPublicProfileByToken(
  token: string,
): Promise<PublicProfilePayload | null> {
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
