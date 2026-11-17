// ============================================================
// Lesson access + free trial
//
// Every signed-in user gets one tutor token budget they can spend in the
// opening lesson of any course. It's metered on the tutor's output tokens
// (feature 'tutor_trial' in ai_usage), not on lesson count, so the trial
// ends partway through a lesson and the tutor asks them to buy the course.
//
// Used by the lesson page, GET /api/lessons/[id], its /translate route,
// and POST /api/chat — keep those four in agreement by going through here.
// ============================================================

import 'server-only';
import { getAuthUser } from '@/lib/auth';
import { isCurrentUserEnrolled } from '@/lib/enrollments';
import { isAdmin } from '@/lib/admin-auth';
import { isOpeningLesson } from '@/lib/v2/db';
import { sumOutputTokens } from '@/lib/ai/usage';

/**
 * ~5 tutor replies (avg ≈ 610 output tokens), a bit under half of a median
 * 2-page lesson, ≈ $0.18 per user at current Sonnet pricing.
 */
export const TRIAL_OUTPUT_TOKENS = 3000;

/**
 * full   — enrolled or admin: whole lesson, unmetered tutor
 * trial  — signed in, opening lesson of a course: tutor metered by the budget
 * signin — guest on an opening lesson: needs an account to start the trial
 * none   — anything else: buy the course
 */
export type LessonAccess = 'full' | 'trial' | 'signin' | 'none';

export async function getLessonAccess(
  lessonId: string,
  courseId: string | null | undefined,
): Promise<LessonAccess> {
  if ((courseId && (await isCurrentUserEnrolled(courseId))) || (await isAdmin())) return 'full';
  if (!(await isOpeningLesson(lessonId))) return 'none';
  return (await getAuthUser()) ? 'trial' : 'signin';
}

/**
 * True once the current user's trial budget is used up. Fails closed: if
 * usage can't be read, the trial is treated as spent rather than unlimited.
 *
 * ponytail: usage is logged after each reply finishes, so a reply already in
 * flight can overshoot the cap by one. Fine at this size; move to an atomic
 * per-user counter if the budget grows or abuse shows up.
 */
export async function isTrialSpent(): Promise<boolean> {
  const user = await getAuthUser();
  if (!user) return true;
  const used = await sumOutputTokens(user.id, 'tutor_trial');
  return used === null || used >= TRIAL_OUTPUT_TOKENS;
}
