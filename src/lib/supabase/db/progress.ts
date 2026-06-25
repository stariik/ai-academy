import { SupabaseClient } from '@supabase/supabase-js';
import type {
  LessonProgressRow,
  QuizAttemptRow,
  ChatHistoryRow,
} from '../types';
import type {
  LessonProgress,
} from '@/types';


// ============================================================
// Lesson Progress
// ============================================================

export async function upsertLessonProgress(
  supabase: SupabaseClient,
  progress: {
    sessionId: string;
    lessonId: string;
    status?: string;
    scrollPercentage?: number;
    timeSpentSeconds?: number;
    currentPage?: number;
    completedPages?: number[];
  }
): Promise<LessonProgress> {
  // Try to get existing first
  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('session_id', progress.sessionId)
    .eq('lesson_id', progress.lessonId)
    .single();

  if (existing) {
    const updates: Record<string, unknown> = {};
    if (progress.status) updates.status = progress.status;
    if (progress.scrollPercentage !== undefined) updates.scroll_percentage = progress.scrollPercentage;
    if (progress.timeSpentSeconds !== undefined) updates.time_spent_seconds = progress.timeSpentSeconds;
    if (progress.currentPage !== undefined) updates.current_page = progress.currentPage;
    if (progress.completedPages !== undefined) updates.completed_pages = progress.completedPages;

    const { data, error } = await supabase
      .from('lesson_progress')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to update progress: ${error?.message}`);
    const row = data as LessonProgressRow;
    return mapProgressRow(row);
  }

  // Create new
  const { data, error } = await supabase
    .from('lesson_progress')
    .insert({
      session_id: progress.sessionId,
      lesson_id: progress.lessonId,
      status: progress.status ?? 'in_progress',
      scroll_percentage: progress.scrollPercentage ?? 0,
      time_spent_seconds: progress.timeSpentSeconds ?? 0,
      current_page: progress.currentPage ?? 1,
      completed_pages: progress.completedPages ?? [],
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create progress: ${error?.message}`);
  return mapProgressRow(data as LessonProgressRow);
}

export async function getProgressForSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<LessonProgress[]> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('session_id', sessionId);

  if (error || !data) return [];
  return (data as LessonProgressRow[]).map(mapProgressRow);
}

export async function getProgressForLesson(
  supabase: SupabaseClient,
  sessionId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('session_id', sessionId)
    .eq('lesson_id', lessonId)
    .single();

  if (!data) return null;
  return mapProgressRow(data as LessonProgressRow);
}

function mapProgressRow(row: LessonProgressRow): LessonProgress {
  return {
    id: row.id,
    sessionId: row.session_id,
    lessonId: row.lesson_id,
    status: row.status,
    scrollPercentage: row.scroll_percentage,
    timeSpentSeconds: row.time_spent_seconds,
    currentPage: row.current_page,
    completedPages: row.completed_pages,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================
// Quiz Attempts
// ============================================================

export async function saveQuizAttempt(
  supabase: SupabaseClient,
  attempt: {
    sessionId: string;
    lessonId: string;
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    answers: { questionId: string; answer: string; isCorrect: boolean; feedback: string }[];
  }
): Promise<void> {
  const { error } = await supabase.from('quiz_attempts').insert({
    session_id: attempt.sessionId,
    lesson_id: attempt.lessonId,
    score: attempt.score,
    total_points: attempt.totalPoints,
    percentage: attempt.percentage,
    passed: attempt.passed,
    answers: attempt.answers,
  });
  if (error) throw new Error(`Failed to save quiz attempt: ${error.message}`);
}

export async function getQuizAttemptsForLesson(
  supabase: SupabaseClient,
  sessionId: string,
  lessonId: string
): Promise<QuizAttemptRow[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('session_id', sessionId)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as QuizAttemptRow[];
}

export type RecentQuizAttempt = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  createdAt: string;
};

export async function getRecentQuizAttempts(
  supabase: SupabaseClient,
  sessionId: string,
  limit = 5
): Promise<RecentQuizAttempt[]> {
  const { data } = await supabase
    .from('quiz_attempts')
    .select('id, lesson_id, score, total_points, percentage, passed, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const lessonIds = Array.from(new Set(data.map((r: { lesson_id: string }) => r.lesson_id)));
  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('id, title')
    .in('id', lessonIds);
  const titleById = new Map(
    (lessonRows ?? []).map((l: { id: string; title: string }) => [l.id, l.title])
  );

  return data.map((r: {
    id: string;
    lesson_id: string;
    score: number;
    total_points: number;
    percentage: number;
    passed: boolean;
    created_at: string;
  }) => ({
    id: r.id,
    lessonId: r.lesson_id,
    lessonTitle: titleById.get(r.lesson_id) ?? 'გაკვეთილი',
    score: r.score,
    totalPoints: r.total_points,
    percentage: r.percentage,
    passed: r.passed,
    createdAt: r.created_at,
  }));
}

// ============================================================
// Chat History
// ============================================================

export async function upsertChatHistory(
  supabase: SupabaseClient,
  sessionId: string,
  lessonId: string,
  messages: { id: string; role: string; content: string; timestamp: string }[]
): Promise<void> {
  const { data: existing } = await supabase
    .from('chat_history')
    .select('id')
    .eq('session_id', sessionId)
    .eq('lesson_id', lessonId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('chat_history')
      .update({ messages })
      .eq('id', existing.id);
    if (error) throw new Error(`Failed to update chat history: ${error.message}`);
  } else {
    const { error } = await supabase.from('chat_history').insert({
      session_id: sessionId,
      lesson_id: lessonId,
      messages,
    });
    if (error) throw new Error(`Failed to save chat history: ${error.message}`);
  }
}

export async function getChatHistory(
  supabase: SupabaseClient,
  sessionId: string,
  lessonId: string
): Promise<ChatHistoryRow | null> {
  const { data } = await supabase
    .from('chat_history')
    .select('*')
    .eq('session_id', sessionId)
    .eq('lesson_id', lessonId)
    .single();

  return (data as ChatHistoryRow) ?? null;
}

// ============================================================
// Page-scoped Chat History
// ============================================================

export async function getPageChatHistory(
  supabase: SupabaseClient,
  sessionId: string,
  lessonId: string,
  pageNumber: number
): Promise<ChatHistoryRow | null> {
  const { data } = await supabase
    .from('chat_history')
    .select('*')
    .eq('session_id', sessionId)
    .eq('lesson_id', lessonId)
    .eq('page_number', pageNumber)
    .single();

  return (data as ChatHistoryRow) ?? null;
}

export async function upsertPageChatHistory(
  supabase: SupabaseClient,
  sessionId: string,
  lessonId: string,
  pageNumber: number,
  messages: { id: string; role: string; content: string; timestamp: string }[]
): Promise<void> {
  const { data: existing } = await supabase
    .from('chat_history')
    .select('id')
    .eq('session_id', sessionId)
    .eq('lesson_id', lessonId)
    .eq('page_number', pageNumber)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('chat_history')
      .update({ messages })
      .eq('id', existing.id);
    if (error) throw new Error(`Failed to update page chat history: ${error.message}`);
  } else {
    const { error } = await supabase.from('chat_history').insert({
      session_id: sessionId,
      lesson_id: lessonId,
      page_number: pageNumber,
      messages,
    });
    if (error) throw new Error(`Failed to save page chat history: ${error.message}`);
  }
}
