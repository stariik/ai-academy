// ============================================================
// XP + streak rules (Task 6)
// ============================================================

// Quiz XP scales with percentage so perfect quizzes feel rewarding.
export const XP_LESSON_BASE = 50;
export const XP_QUIZ_PERCENTAGE_MULTIPLIER = 2;
export const XP_FIRST_TRY_BONUS = 50;

export const XP_REVIEW_CORRECT = 10;
export const XP_REVIEW_INCORRECT = 2;

export type LessonXpInput = {
  percentage: number;
  questionPoints: number;
  isFirstAttempt: boolean;
};

export function calculateLessonXp({ percentage, questionPoints, isFirstAttempt }: LessonXpInput): number {
  const base = XP_LESSON_BASE;
  const quizBonus = Math.max(0, percentage) * XP_QUIZ_PERCENTAGE_MULTIPLIER;
  const pointsBonus = Math.max(0, questionPoints);
  const firstTry = isFirstAttempt && percentage >= 70 ? XP_FIRST_TRY_BONUS : 0;
  return Math.round(base + quizBonus + pointsBonus + firstTry);
}

export type StreakUpdate = {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // ISO date yyyy-mm-dd
};

// Return null if the existing streak already covers today (no change).
export function updateStreak(
  prior: { currentStreak: number; longestStreak: number; lastActivityDate: string | null },
  today: Date = new Date()
): StreakUpdate | null {
  const todayStr = toIsoDate(today);
  if (prior.lastActivityDate === todayStr) return null;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toIsoDate(yesterday);

  const continuing = prior.lastActivityDate === yesterdayStr;
  const currentStreak = continuing ? prior.currentStreak + 1 : 1;
  const longestStreak = Math.max(prior.longestStreak, currentStreak);

  return { currentStreak, longestStreak, lastActivityDate: todayStr };
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
