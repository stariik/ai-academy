// ============================================================
// Badge catalog + eligibility rules (Task 6)
// Badge codes are stable identifiers; display strings are in Georgian.
// ============================================================

export type BadgeCode =
  | 'first_lesson'
  | 'streak_7'
  | 'streak_30'
  | 'perfect_quiz'
  | 'course_complete'
  | 'xp_1000'
  | 'xp_5000'
  | 'review_warrior';

export type BadgeDefinition = {
  code: BadgeCode;
  title: string;
  description: string;
  icon: string; // emoji fallback for now
};

export const BADGES: Record<BadgeCode, BadgeDefinition> = {
  first_lesson: {
    code: 'first_lesson',
    title: 'პირველი ნაბიჯი',
    description: 'დაასრულე პირველი გაკვეთილი',
    icon: '🎓',
  },
  streak_7: {
    code: 'streak_7',
    title: '7 დღე ზედიზედ',
    description: 'ისწავლე ყოველდღე 7 დღის განმავლობაში',
    icon: '🔥',
  },
  streak_30: {
    code: 'streak_30',
    title: 'დისციპლინის ოსტატი',
    description: '30 დღიანი სერია',
    icon: '💎',
  },
  perfect_quiz: {
    code: 'perfect_quiz',
    title: 'სრულყოფილი ქულა',
    description: 'ჩააბარე ქვიზი 100%-ით',
    icon: '🌟',
  },
  course_complete: {
    code: 'course_complete',
    title: 'კურსი დასრულებული',
    description: 'დაასრულე მთელი კურსი',
    icon: '🏆',
  },
  xp_1000: {
    code: 'xp_1000',
    title: '1000 XP',
    description: 'დააგროვე 1000 XP',
    icon: '⚡',
  },
  xp_5000: {
    code: 'xp_5000',
    title: '5000 XP',
    description: 'დააგროვე 5000 XP',
    icon: '🚀',
  },
  review_warrior: {
    code: 'review_warrior',
    title: 'გამეორების მეომარი',
    description: 'გაიარე 50 გამეორებითი სავარჯიშო',
    icon: '🗡️',
  },
};

export type BadgeContext = {
  completedLessons: number;
  currentStreak: number;
  totalXp: number;
  reviewAnswersCount: number;
  justScoredPerfect: boolean;
  justCompletedCourse: boolean;
};

// Given the user's post-event state, return every badge they now qualify for.
// Callers are expected to de-dup against already-owned badges before writing.
export function evaluateBadges(ctx: BadgeContext): BadgeCode[] {
  const earned: BadgeCode[] = [];
  if (ctx.completedLessons >= 1) earned.push('first_lesson');
  if (ctx.currentStreak >= 7) earned.push('streak_7');
  if (ctx.currentStreak >= 30) earned.push('streak_30');
  if (ctx.justScoredPerfect) earned.push('perfect_quiz');
  if (ctx.justCompletedCourse) earned.push('course_complete');
  if (ctx.totalXp >= 1000) earned.push('xp_1000');
  if (ctx.totalXp >= 5000) earned.push('xp_5000');
  if (ctx.reviewAnswersCount >= 50) earned.push('review_warrior');
  return earned;
}
