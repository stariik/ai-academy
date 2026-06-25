import { SupabaseClient } from '@supabase/supabase-js';
import type {
  QuizQuestionRow,
  ReviewItemRow,
} from '../types';
import type {
  ReviewItem,
  ReviewQueueItem,
} from '@/types';
import { applySm2, DEFAULT_EASE, qualityFromQuiz } from '@/lib/spaced-repetition/sm2';
import { mapQuizQuestion } from './_shared';


// ============================================================
// Review Items (Spaced Repetition — Task 5)
// ============================================================

function mapReviewItemRow(row: ReviewItemRow): ReviewItem {
  return {
    id: row.id,
    sessionId: row.session_id,
    questionId: row.question_id,
    lessonId: row.lesson_id,
    ease: row.ease,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    nextDueAt: row.next_due_at,
    lastReviewedAt: row.last_reviewed_at,
    lastQuality: row.last_quality,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Seed an item on first wrong answer or bump an existing item's state after a review.
export async function applyQuizReviewUpdate(
  supabase: SupabaseClient,
  sessionId: string,
  questionId: string,
  lessonId: string,
  isCorrect: boolean,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<void> {
  const { data: existing } = await supabase
    .from('review_items')
    .select('*')
    .eq('session_id', sessionId)
    .eq('question_id', questionId)
    .maybeSingle();

  // Wrong answer with no prior item → seed a new one due immediately.
  if (!existing && !isCorrect) {
    const quality = qualityFromQuiz(false, difficulty);
    const sm2 = applySm2({ ease: DEFAULT_EASE, intervalDays: 0, repetitions: 0 }, quality);
    const { error } = await supabase.from('review_items').insert({
      session_id: sessionId,
      question_id: questionId,
      lesson_id: lessonId,
      ease: sm2.ease,
      interval_days: sm2.intervalDays,
      repetitions: sm2.repetitions,
      next_due_at: sm2.nextDueAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
      last_quality: quality,
    });
    if (error) throw new Error(`Failed to seed review item: ${error.message}`);
    return;
  }

  // Correct answer with no prior item → nothing to track.
  if (!existing) return;

  // Prior item exists → update it based on this outcome.
  const quality = qualityFromQuiz(isCorrect, difficulty);
  const sm2 = applySm2(
    { ease: existing.ease, intervalDays: existing.interval_days, repetitions: existing.repetitions },
    quality
  );
  const { error } = await supabase
    .from('review_items')
    .update({
      ease: sm2.ease,
      interval_days: sm2.intervalDays,
      repetitions: sm2.repetitions,
      next_due_at: sm2.nextDueAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
      last_quality: quality,
    })
    .eq('id', existing.id);
  if (error) throw new Error(`Failed to update review item: ${error.message}`);
}

export async function getDueReviewItems(
  supabase: SupabaseClient,
  sessionId: string,
  limit = 10
): Promise<ReviewQueueItem[]> {
  const nowIso = new Date().toISOString();
  const { data: rows } = await supabase
    .from('review_items')
    .select('*')
    .eq('session_id', sessionId)
    .lte('next_due_at', nowIso)
    .order('next_due_at', { ascending: true })
    .limit(limit);

  if (!rows || rows.length === 0) return [];

  const questionIds = (rows as ReviewItemRow[]).map((r) => r.question_id);
  const lessonIds = Array.from(new Set((rows as ReviewItemRow[]).map((r) => r.lesson_id)));

  const [{ data: qRows }, { data: lRows }] = await Promise.all([
    supabase.from('quiz_questions').select('*').in('id', questionIds),
    supabase.from('lessons').select('id, title').in('id', lessonIds),
  ]);

  const byQuestion = new Map((qRows ?? []).map((q) => [q.id, q as QuizQuestionRow]));
  const titleByLesson = new Map((lRows ?? []).map((l: { id: string; title: string }) => [l.id, l.title]));

  const queue: ReviewQueueItem[] = [];
  for (const r of rows as ReviewItemRow[]) {
    const q = byQuestion.get(r.question_id);
    if (!q) continue;
    queue.push({
      reviewItem: mapReviewItemRow(r),
      question: mapQuizQuestion(q),
      lessonId: r.lesson_id,
      lessonTitle: titleByLesson.get(r.lesson_id) ?? '',
    });
  }
  return queue;
}

export async function countDueReviewItems(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  const nowIso = new Date().toISOString();
  const { count } = await supabase
    .from('review_items')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .lte('next_due_at', nowIso);
  return count ?? 0;
}

export async function countReviewAnswers(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  // Rough proxy — reps across all items is how many times the user has reviewed.
  const { data } = await supabase
    .from('review_items')
    .select('repetitions')
    .eq('session_id', sessionId);
  if (!data) return 0;
  return (data as { repetitions: number }[]).reduce((sum, r) => sum + (r.repetitions ?? 0), 0);
}

export async function getReviewItem(
  supabase: SupabaseClient,
  sessionId: string,
  questionId: string
): Promise<ReviewItem | null> {
  const { data } = await supabase
    .from('review_items')
    .select('*')
    .eq('session_id', sessionId)
    .eq('question_id', questionId)
    .maybeSingle();
  return data ? mapReviewItemRow(data as ReviewItemRow) : null;
}
