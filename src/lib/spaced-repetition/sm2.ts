// ============================================================
// SM-2 Spaced Repetition Scheduler
// Reference: https://super-memory.com/english/ol/sm2.htm
// Quality scale: 0 (total blackout) .. 5 (perfect recall)
// ============================================================

export type Sm2State = {
  ease: number;
  intervalDays: number;
  repetitions: number;
};

export type Sm2Result = Sm2State & {
  nextDueAt: Date;
};

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

// A quality below 3 resets repetition count — the learner failed recall.
const LAPSE_THRESHOLD = 3;

export function applySm2(prior: Sm2State, quality: number, now: Date = new Date()): Sm2Result {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let { ease, intervalDays, repetitions } = prior;

  // Ease update — same formula for pass or fail; clamped to MIN_EASE.
  ease = Math.max(MIN_EASE, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  if (q < LAPSE_THRESHOLD) {
    repetitions = 0;
    intervalDays = 0;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ease);
    repetitions += 1;
  }

  const nextDueAt = new Date(now);
  if (intervalDays === 0) {
    // Lapsed: re-show in ~10 minutes so it's still part of the current session.
    nextDueAt.setMinutes(nextDueAt.getMinutes() + 10);
  } else {
    nextDueAt.setDate(nextDueAt.getDate() + intervalDays);
  }

  return { ease, intervalDays, repetitions, nextDueAt };
}

// Map quiz grading outcome to an SM-2 quality score.
// We don't have explicit confidence, so use difficulty + correctness as a proxy.
export function qualityFromQuiz(isCorrect: boolean, difficulty: 'easy' | 'medium' | 'hard'): number {
  if (!isCorrect) {
    // Lapses are rough — harder item = more catastrophic forgetting.
    if (difficulty === 'hard') return 0;
    if (difficulty === 'medium') return 1;
    return 2;
  }
  if (difficulty === 'hard') return 5;
  if (difficulty === 'medium') return 4;
  return 3;
}
