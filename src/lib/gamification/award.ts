// ============================================================
// awardActivity() — unified entry point for XP / streak / badge updates.
//
// Use this from any API route that records meaningful student activity.
// It reads the current profile, applies XP for the event, rolls the daily
// streak forward (with gap detection), evaluates badges against the
// post-event state, and writes everything atomically-ish (one update + an
// insert). Returns a delta the UI can use to show "you gained X XP",
// "+1 day streak", "new badge!".
//
// Existing route /api/quiz/check still owns its own bespoke logic for
// historical reasons (it also writes quiz_attempts, weak/strong topic
// merging, etc.). New routes — and the new /v2 profile page surface —
// should funnel through here.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getOrCreateProfile,
  updateProfile,
  unlockBadges,
  getProgressForSession,
  getAllLessons,
} from '@/lib/supabase/db';
import { updateStreak } from './xp';
import { evaluateBadges, type BadgeCode } from './badges';

export type ActivityEvent =
  | { type: 'lesson_completed'; lessonId: string }
  | { type: 'quiz_passed'; lessonId: string; percentage: number; isFirstAttempt: boolean }
  | { type: 'quiz_perfect'; lessonId: string }
  | { type: 'review_correct' }
  | { type: 'review_incorrect' };

const XP_FOR: Record<ActivityEvent['type'], number> = {
  lesson_completed: 30,
  quiz_passed: 50,
  quiz_perfect: 100,
  review_correct: 10,
  review_incorrect: 2,
};

export type ActivityResult = {
  xpGained: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  streakChanged: boolean;
  newBadges: string[];
  tierBefore: number;
  tierAfter: number;
  tierChanged: boolean;
};

// XP → tier (0 indexed). Stay loose; tier names live in the dict.
export const TIER_THRESHOLDS = [0, 250, 1000, 3000, 7500] as const;
export const TIER_COUNT = TIER_THRESHOLDS.length;

export function tierFromXp(xp: number): number {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= TIER_THRESHOLDS[i]) return i;
  }
  return 0;
}

/** XP needed to reach the next tier; null if already at max. */
export function xpToNextTier(xp: number): { current: number; next: number; pct: number } | null {
  const tier = tierFromXp(xp);
  if (tier >= TIER_THRESHOLDS.length - 1) return null;
  const floor = TIER_THRESHOLDS[tier];
  const ceil = TIER_THRESHOLDS[tier + 1];
  const span = ceil - floor;
  const into = xp - floor;
  return { current: into, next: span, pct: Math.round((into / span) * 100) };
}

export async function awardActivity(
  supabase: SupabaseClient,
  sessionId: string,
  event: ActivityEvent,
): Promise<ActivityResult> {
  const profile = await getOrCreateProfile(supabase, sessionId);

  const xpGained = XP_FOR[event.type];
  const totalXpAfter = (profile.totalXp ?? 0) + xpGained;

  const profileUpdates: Parameters<typeof updateProfile>[2] = {
    totalXp: totalXpAfter,
  };

  // Streak: rolls forward by 1 if last activity was yesterday, resets to 1
  // if there's a gap, no-ops if last activity was today. updateStreak()
  // returns null for the no-op case so we don't bump the row needlessly.
  const streak = updateStreak({
    currentStreak: profile.currentStreak ?? 0,
    longestStreak: profile.longestStreak ?? 0,
    lastActivityDate: profile.lastActivityDate,
  });
  if (streak) {
    profileUpdates.currentStreak = streak.currentStreak;
    profileUpdates.longestStreak = streak.longestStreak;
    profileUpdates.lastActivityDate = streak.lastActivityDate;
  }

  const updated = await updateProfile(supabase, sessionId, profileUpdates);

  // Detect course completion (only meaningful for lesson_completed / quiz events).
  let justCompletedCourse = false;
  let completedLessons = 0;
  if (event.type === 'lesson_completed' || event.type === 'quiz_passed' || event.type === 'quiz_perfect') {
    const progressAfter = await getProgressForSession(supabase, sessionId);
    completedLessons = progressAfter.filter((p) => p.status === 'completed').length;

    const { data: lessonRow } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', event.lessonId)
      .single();
    const courseId = (lessonRow as { course_id: string | null } | null)?.course_id;
    if (courseId) {
      const courseLessons = await getAllLessons(supabase, { courseId });
      const completedInCourse = progressAfter.filter(
        (p) => p.status === 'completed' && courseLessons.some((cl) => cl.id === p.lessonId),
      ).length;
      justCompletedCourse =
        courseLessons.length > 0 && completedInCourse === courseLessons.length;
    }
  }

  const badgeCodes: BadgeCode[] = evaluateBadges({
    completedLessons,
    currentStreak: updated.currentStreak,
    totalXp: updated.totalXp,
    reviewAnswersCount: 0,
    justScoredPerfect: event.type === 'quiz_perfect',
    justCompletedCourse,
  });

  const newlyUnlocked = await unlockBadges(supabase, sessionId, badgeCodes, {
    event: event.type,
    ...('lessonId' in event ? { lessonId: event.lessonId } : {}),
  });

  const tierBefore = tierFromXp(profile.totalXp ?? 0);
  const tierAfter = tierFromXp(updated.totalXp);

  return {
    xpGained,
    totalXp: updated.totalXp,
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    streakChanged: streak !== null,
    newBadges: newlyUnlocked,
    tierBefore,
    tierAfter,
    tierChanged: tierAfter > tierBefore,
  };
}
