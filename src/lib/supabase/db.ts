// ============================================================
// Supabase Database Layer - All query functions
// Replaces the in-memory store.ts entirely
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  LessonRow,
  ContentBlockRow,
  QuizQuestionRow,
  LessonPageRow,
  CourseRow,
  StudentSessionRow,
  LessonProgressRow,
  QuizAttemptRow,
  ChatHistoryRow,
  StudentProfileRow,
  ReviewItemRow,
  UserBadgeRow,
} from './types';
import type {
  Lesson,
  ContentBlock,
  QuizQuestion,
  LessonPage,
  Course,
  StudentSession,
  LessonProgress,
  StudentProfile,
  ReviewItem,
  ReviewQueueItem,
  UserBadge,
  LeaderboardEntry,
} from '@/types';
import { applySm2, DEFAULT_EASE, qualityFromQuiz } from '@/lib/spaced-repetition/sm2';

// ============================================================
// Quiz Question Sanitizer — ensures all NOT NULL fields have defaults
// Gemini responses (especially truncated/recovered) often have missing fields
// ============================================================

function sanitizeQuizQuestion(qq: QuizQuestion, lessonId: string, pageId: string | null, scope: string) {
  return {
    id: qq.id,
    lesson_id: lessonId,
    page_id: pageId,
    type: qq.type || 'mcq',
    question: qq.question || 'Question not available',
    options: qq.options ?? null,
    correct_answer: qq.correctAnswer || String(qq.options?.[0] ?? 'N/A'),
    explanation: qq.explanation || 'No explanation available.',
    difficulty: qq.difficulty || 'medium',
    points: qq.points || 5,
    scope,
    bloom_level: qq.bloomLevel ?? null,
    metadata: qq.metadata ?? null,
  };
}

// ============================================================
// Lesson Assembly - joins rows into frontend Lesson type
// ============================================================

function mapContentBlock(cb: ContentBlockRow): ContentBlock {
  return {
    id: cb.id,
    type: cb.type as ContentBlock['type'],
    content: cb.content,
    metadata: cb.metadata ?? undefined,
    order: cb.order,
    pageId: cb.page_id ?? undefined,
  };
}

function mapQuizQuestion(qq: QuizQuestionRow): QuizQuestion {
  return {
    id: qq.id,
    type: qq.type as QuizQuestion['type'],
    question: qq.question,
    options: qq.options ?? undefined,
    correctAnswer: qq.correct_answer,
    explanation: qq.explanation,
    difficulty: qq.difficulty,
    points: qq.points,
    pageId: qq.page_id ?? undefined,
    scope: qq.scope,
    bloomLevel: (qq.bloom_level as QuizQuestion['bloomLevel']) ?? undefined,
    metadata: qq.metadata ?? undefined,
  };
}

export function assembleLesson(
  row: LessonRow,
  contentBlocks: ContentBlockRow[],
  quizQuestions: QuizQuestionRow[],
  pageRows: LessonPageRow[] = []
): Lesson {
  const lesson: Lesson = {
    id: row.id,
    title: row.title,
    titleEn: row.title_en ?? null,
    description: row.description,
    descriptionEn: row.description_en ?? null,
    learningObjectives: row.learning_objectives,
    learningObjectivesEn: row.learning_objectives_en ?? null,
    contentBlocks: contentBlocks
      .filter((cb) => !cb.page_id)
      .sort((a, b) => a.order - b.order)
      .map(mapContentBlock),
    keyConcepts: row.key_concepts,
    summary: row.summary,
    quizQuestions: quizQuestions
      .filter((qq) => qq.scope === 'final' || !qq.page_id)
      .map(mapQuizQuestion),
    sourceDocument: row.source_document,
    difficulty: row.difficulty,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    createdAt: row.created_at,
    status: row.status,
    tags: row.tags,
    courseId: row.course_id ?? undefined,
    positionInCourse: row.position_in_course ?? undefined,
  };

  if (pageRows.length > 0) {
    lesson.pages = pageRows
      .sort((a, b) => a.page_number - b.page_number)
      .map((pr): LessonPage => ({
        id: pr.id,
        lessonId: pr.lesson_id,
        pageNumber: pr.page_number,
        title: pr.title,
        keyConcepts: pr.key_concepts,
        contentBlocks: contentBlocks
          .filter((cb) => cb.page_id === pr.id)
          .sort((a, b) => a.order - b.order)
          .map(mapContentBlock),
        checkQuestions: quizQuestions
          .filter((qq) => qq.page_id === pr.id && qq.scope === 'check')
          .map(mapQuizQuestion),
        teachingFlow: pr.teaching_flow ? {
          introduction: pr.teaching_flow.introduction ?? '',
          coreExplanation: pr.teaching_flow.core_explanation ?? '',
          practiceHint: pr.teaching_flow.practice_hint ?? '',
          reflectionPrompt: pr.teaching_flow.reflection_prompt ?? '',
        } : undefined,
        difficultyLevel: pr.difficulty_level as LessonPage['difficultyLevel'],
        bridgeFromPrevious: pr.bridge_from_previous ?? undefined,
        commonMisconceptions: pr.common_misconceptions ?? undefined,
        realWorldApplications: pr.real_world_applications ?? undefined,
      }));
    lesson.totalPages = lesson.pages.length;
  }

  return lesson;
}

// ============================================================
// Lessons CRUD
// ============================================================

export async function saveLesson(supabase: SupabaseClient, lesson: Lesson): Promise<void> {
  const insertData: Record<string, unknown> = {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    learning_objectives: lesson.learningObjectives,
    key_concepts: lesson.keyConcepts,
    summary: lesson.summary,
    source_document: lesson.sourceDocument,
    difficulty: lesson.difficulty,
    estimated_duration_minutes: lesson.estimatedDurationMinutes,
    status: lesson.status,
    tags: lesson.tags ?? [],
    course_id: lesson.courseId ?? null,
    position_in_course: lesson.positionInCourse ?? null,
  };

  const { error: lessonError } = await supabase.from('lessons').insert(insertData);

  if (lessonError) {
    if (lessonError.message.includes('fetch failed') || lessonError.message.includes('TIMEOUT')) {
      await new Promise(r => setTimeout(r, 3000));
      const { error: retryError } = await supabase.from('lessons').insert(insertData);
      if (retryError) throw new Error(`Failed to save lesson: ${retryError.message}`);
    } else {
      throw new Error(`Failed to save lesson: ${lessonError.message}`);
    }
  }

  // Insert content blocks (only non-paged blocks; paged blocks are saved via saveLessonPages)
  const nonPagedBlocks = lesson.contentBlocks.filter((cb) => !cb.pageId);
  if (nonPagedBlocks.length > 0) {
    const blocks = nonPagedBlocks.map((cb) => ({
      id: cb.id,
      lesson_id: lesson.id,
      page_id: null,
      type: cb.type,
      content: cb.content,
      metadata: cb.metadata ?? null,
      order: cb.order,
    }));
    const { error: blocksError } = await supabase.from('content_blocks').insert(blocks);
    if (blocksError) throw new Error(`Failed to save content blocks: ${blocksError.message}`);
  }

  // Insert quiz questions (final quiz only; check questions are saved via saveLessonPages)
  if (lesson.quizQuestions.length > 0) {
    const questions = lesson.quizQuestions.map((qq) =>
      sanitizeQuizQuestion(qq, lesson.id, null, qq.scope ?? 'final')
    );
    const { error: questionsError } = await supabase.from('quiz_questions').insert(questions);
    if (questionsError && questionsError.message.includes('schema cache')) {
      // Try without bloom_level only
      const withoutBloom = questions.map(({ bloom_level, ...rest }) => rest);
      const { error: retry1 } = await supabase.from('quiz_questions').insert(withoutBloom);
      if (retry1 && retry1.message.includes('schema cache')) {
        const minimal = withoutBloom.map(({ metadata, ...rest }) => rest);
        const { error: retry2 } = await supabase.from('quiz_questions').insert(minimal);
        if (retry2) throw new Error(`Failed to save quiz questions: ${retry2.message}`);
      } else if (retry1) {
        throw new Error(`Failed to save quiz questions: ${retry1.message}`);
      }
    } else if (questionsError) {
      if (questionsError.message.includes('fetch failed') || questionsError.message.includes('TIMEOUT')) {
        // Network error — retry after delay
        await new Promise(r => setTimeout(r, 3000));
        const { error: retryFetch } = await supabase.from('quiz_questions').insert(questions);
        if (retryFetch) throw new Error(`Failed to save quiz questions: ${retryFetch.message}`);
      } else {
        throw new Error(`Failed to save quiz questions: ${questionsError.message}`);
      }
    }
  }

  // Insert pages if present
  if (lesson.pages && lesson.pages.length > 0) {
    await saveLessonPages(supabase, lesson.id, lesson.pages);
  }
}

export async function getLesson(supabase: SupabaseClient, id: string): Promise<Lesson | null> {
  const { data: lessonRow, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !lessonRow) return null;

  const [{ data: blocks }, { data: questions }, { data: pageRows }] = await Promise.all([
    supabase.from('content_blocks').select('*').eq('lesson_id', id).order('order'),
    supabase.from('quiz_questions').select('*').eq('lesson_id', id),
    supabase.from('lesson_pages').select('*').eq('lesson_id', id).order('page_number'),
  ]);

  return assembleLesson(
    lessonRow as LessonRow,
    (blocks ?? []) as ContentBlockRow[],
    (questions ?? []) as QuizQuestionRow[],
    (pageRows ?? []) as LessonPageRow[]
  );
}

export async function getAllLessons(
  supabase: SupabaseClient,
  filters?: { status?: string; courseId?: string }
): Promise<Lesson[]> {
  let query = supabase.from('lessons').select('*').order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.courseId) {
    query = query.eq('course_id', filters.courseId);
  }

  const { data: lessonRows, error } = await query;
  if (error || !lessonRows) return [];

  const lessonIds = lessonRows.map((r: LessonRow) => r.id);
  if (lessonIds.length === 0) return [];

  const [{ data: allBlocks }, { data: allQuestions }] = await Promise.all([
    supabase.from('content_blocks').select('*').in('lesson_id', lessonIds).order('order'),
    supabase.from('quiz_questions').select('*').in('lesson_id', lessonIds),
  ]);

  return lessonRows.map((row: LessonRow) =>
    assembleLesson(
      row,
      ((allBlocks ?? []) as ContentBlockRow[]).filter((b) => b.lesson_id === row.id),
      ((allQuestions ?? []) as QuizQuestionRow[]).filter((q) => q.lesson_id === row.id)
    )
  );
}

export async function updateLesson(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Lesson>
): Promise<Lesson | null> {
  // Map camelCase to snake_case for the lesson row
  const rowUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) rowUpdates.title = updates.title;
  if (updates.description !== undefined) rowUpdates.description = updates.description;
  if (updates.learningObjectives !== undefined) rowUpdates.learning_objectives = updates.learningObjectives;
  if (updates.keyConcepts !== undefined) rowUpdates.key_concepts = updates.keyConcepts;
  if (updates.summary !== undefined) rowUpdates.summary = updates.summary;
  if (updates.sourceDocument !== undefined) rowUpdates.source_document = updates.sourceDocument;
  if (updates.difficulty !== undefined) rowUpdates.difficulty = updates.difficulty;
  if (updates.estimatedDurationMinutes !== undefined) rowUpdates.estimated_duration_minutes = updates.estimatedDurationMinutes;
  if (updates.status !== undefined) rowUpdates.status = updates.status;
  if (updates.tags !== undefined) rowUpdates.tags = updates.tags;
  if (updates.courseId !== undefined) rowUpdates.course_id = updates.courseId;
  if (updates.positionInCourse !== undefined) rowUpdates.position_in_course = updates.positionInCourse;

  if (Object.keys(rowUpdates).length > 0) {
    const { error } = await supabase.from('lessons').update(rowUpdates).eq('id', id);
    if (error) throw new Error(`Failed to update lesson: ${error.message}`);
  }

  return getLesson(supabase, id);
}

export async function deleteLesson(supabase: SupabaseClient, id: string): Promise<boolean> {
  // content_blocks and quiz_questions cascade delete via FK
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  return !error;
}

// ============================================================
// Courses CRUD
// ============================================================

export async function createCourse(
  supabase: SupabaseClient,
  course: { title: string; description: string; tags?: string[] }
): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: course.title,
      description: course.description,
      tags: course.tags ?? [],
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create course: ${error?.message}`);
  const row = data as CourseRow;
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en ?? null,
    description: row.description,
    descriptionEn: row.description_en ?? null,
    tags: row.tags,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllCourses(supabase: SupabaseClient): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as CourseRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    titleEn: row.title_en ?? null,
    description: row.description,
    descriptionEn: row.description_en ?? null,
    tags: row.tags,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getCourse(supabase: SupabaseClient, id: string): Promise<Course | null> {
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
  if (error || !data) return null;
  const row = data as CourseRow;
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en ?? null,
    description: row.description,
    descriptionEn: row.description_en ?? null,
    tags: row.tags,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateCourse(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<{ title: string; description: string; tags: string[] }>
): Promise<Course | null> {
  const { error } = await supabase.from('courses').update(updates).eq('id', id);
  if (error) throw new Error(`Failed to update course: ${error.message}`);
  return getCourse(supabase, id);
}

export async function deleteCourse(supabase: SupabaseClient, id: string): Promise<boolean> {
  // Delete all lessons belonging to this course (cascade deletes their content_blocks, quiz_questions, lesson_pages)
  const { data: lessons } = await supabase.from('lessons').select('id').eq('course_id', id);
  if (lessons && lessons.length > 0) {
    for (const lesson of lessons) {
      await deleteLesson(supabase, lesson.id);
    }
  }
  const { error } = await supabase.from('courses').delete().eq('id', id);
  return !error;
}

export async function deleteAllLessons(supabase: SupabaseClient): Promise<number> {
  const { data: lessons } = await supabase.from('lessons').select('id');
  if (!lessons || lessons.length === 0) return 0;
  for (const lesson of lessons) {
    await deleteLesson(supabase, lesson.id);
  }
  return lessons.length;
}

// ============================================================
// Student Sessions
// ============================================================

export async function getOrCreateSession(
  supabase: SupabaseClient,
  sessionId?: string
): Promise<StudentSession> {
  if (sessionId) {
    const { data } = await supabase
      .from('student_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (data) {
      const row = data as StudentSessionRow;
      return {
        id: row.id,
        displayName: row.display_name,
        preferences: row.preferences,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
  }

  // Create new session
  const { data, error } = await supabase
    .from('student_sessions')
    .insert({
      display_name: `Student ${Math.floor(Math.random() * 10000)}`,
      preferences: {},
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create session: ${error?.message}`);
  const row = data as StudentSessionRow;
  return {
    id: row.id,
    displayName: row.display_name,
    preferences: row.preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
// Lesson Pages
// ============================================================

export async function saveLessonPages(
  supabase: SupabaseClient,
  lessonId: string,
  pages: LessonPage[]
): Promise<void> {
  // Insert page rows — with fallback for schemas missing newer columns
  const fullPageRows = pages.map((p) => ({
    id: p.id,
    lesson_id: lessonId,
    page_number: p.pageNumber,
    title: p.title,
    key_concepts: p.keyConcepts,
    teaching_flow: p.teachingFlow ? {
      introduction: p.teachingFlow.introduction,
      core_explanation: p.teachingFlow.coreExplanation,
      practice_hint: p.teachingFlow.practiceHint,
      reflection_prompt: p.teachingFlow.reflectionPrompt,
    } : null,
    difficulty_level: p.difficultyLevel ?? null,
    bridge_from_previous: p.bridgeFromPrevious ?? null,
    common_misconceptions: p.commonMisconceptions ?? null,
    real_world_applications: p.realWorldApplications ?? null,
  }));
  const { error: pagesError } = await supabase.from('lesson_pages').insert(fullPageRows);
  if (pagesError) {
    // Retry with only core columns if newer columns don't exist
    if (pagesError.message.includes('column') && pagesError.message.includes('schema cache')) {
      const corePageRows = pages.map((p) => ({
        id: p.id,
        lesson_id: lessonId,
        page_number: p.pageNumber,
        title: p.title,
        key_concepts: p.keyConcepts,
      }));
      const { error: retryError } = await supabase.from('lesson_pages').insert(corePageRows);
      if (retryError) throw new Error(`Failed to save lesson pages: ${retryError.message}`);
    } else {
      throw new Error(`Failed to save lesson pages: ${pagesError.message}`);
    }
  }

  // Insert content blocks per page (filter out blocks with null/empty content)
  for (const page of pages) {
    const validBlocks = page.contentBlocks.filter((cb) => cb.content != null && String(cb.content).trim() !== '');
    if (validBlocks.length > 0) {
      const blocks = validBlocks.map((cb) => ({
        id: cb.id,
        lesson_id: lessonId,
        page_id: page.id,
        type: cb.type,
        content: String(cb.content),
        metadata: cb.metadata ?? null,
        order: cb.order,
      }));
      const { error } = await supabase.from('content_blocks').insert(blocks);
      if (error) throw new Error(`Failed to save page content blocks: ${error.message}`);
    }

    // Insert check questions per page
    if (page.checkQuestions.length > 0) {
      const questions = page.checkQuestions.map((qq) =>
        sanitizeQuizQuestion(qq, lessonId, page.id, 'check')
      );
      const { error } = await supabase.from('quiz_questions').insert(questions);
      if (error && error.message.includes('schema cache')) {
        const withoutBloom = questions.map(({ bloom_level, ...rest }) => rest);
        const { error: retry1 } = await supabase.from('quiz_questions').insert(withoutBloom);
        if (retry1 && retry1.message.includes('schema cache')) {
          const minimal = withoutBloom.map(({ metadata, ...rest }) => rest);
          const { error: retry2 } = await supabase.from('quiz_questions').insert(minimal);
          if (retry2) throw new Error(`Failed to save check questions: ${retry2.message}`);
        } else if (retry1) {
          throw new Error(`Failed to save check questions: ${retry1.message}`);
        }
      } else if (error) {
        if (error.message.includes('fetch failed') || error.message.includes('TIMEOUT')) {
          await new Promise(r => setTimeout(r, 3000));
          const { error: retryFetch } = await supabase.from('quiz_questions').insert(questions);
          if (retryFetch) throw new Error(`Failed to save check questions: ${retryFetch.message}`);
        } else {
          throw new Error(`Failed to save check questions: ${error.message}`);
        }
      }
    }
  }
}

export async function getLessonPage(
  supabase: SupabaseClient,
  lessonId: string,
  pageNumber: number
): Promise<LessonPage | null> {
  const { data: pageRow } = await supabase
    .from('lesson_pages')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('page_number', pageNumber)
    .single();

  if (!pageRow) return null;
  const pr = pageRow as LessonPageRow;

  const [{ data: blocks }, { data: questions }] = await Promise.all([
    supabase.from('content_blocks').select('*').eq('page_id', pr.id).order('order'),
    supabase.from('quiz_questions').select('*').eq('page_id', pr.id).eq('scope', 'check'),
  ]);

  return {
    id: pr.id,
    lessonId: pr.lesson_id,
    pageNumber: pr.page_number,
    title: pr.title,
    keyConcepts: pr.key_concepts,
    contentBlocks: ((blocks ?? []) as ContentBlockRow[]).map(mapContentBlock),
    checkQuestions: ((questions ?? []) as QuizQuestionRow[]).map(mapQuizQuestion),
    teachingFlow: pr.teaching_flow ? {
      introduction: pr.teaching_flow.introduction ?? '',
      coreExplanation: pr.teaching_flow.core_explanation ?? '',
      practiceHint: pr.teaching_flow.practice_hint ?? '',
      reflectionPrompt: pr.teaching_flow.reflection_prompt ?? '',
    } : undefined,
    difficultyLevel: pr.difficulty_level as LessonPage['difficultyLevel'],
    bridgeFromPrevious: pr.bridge_from_previous ?? undefined,
    commonMisconceptions: pr.common_misconceptions ?? undefined,
    realWorldApplications: pr.real_world_applications ?? undefined,
  };
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

// ============================================================
// Student Profiles
// ============================================================

export async function getOrCreateProfile(
  supabase: SupabaseClient,
  sessionId: string
): Promise<StudentProfile> {
  const { data } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (data) return mapProfileRow(data as StudentProfileRow);

  const { data: newProfile, error } = await supabase
    .from('student_profiles')
    .insert({
      session_id: sessionId,
      weak_topics: [],
      strong_topics: [],
      preferred_style: 'socratic',
      total_quizzes: 0,
      average_score: 0,
      total_time_spent: 0,
    })
    .select()
    .single();

  if (error?.code === '23505') {
    // Race condition: another request already created the profile — just fetch it
    const { data: existing } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    if (existing) return mapProfileRow(existing as StudentProfileRow);
  }
  if (error || !newProfile) throw new Error(`Failed to create profile: ${error?.message}`);
  return mapProfileRow(newProfile as StudentProfileRow);
}

export async function updateProfile(
  supabase: SupabaseClient,
  sessionId: string,
  updates: Partial<{
    weakTopics: { topic: string; score: number }[];
    strongTopics: { topic: string; score: number }[];
    preferredStyle: string;
    totalQuizzes: number;
    averageScore: number;
    totalTimeSpent: number;
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
  }>
): Promise<StudentProfile> {
  const rowUpdates: Record<string, unknown> = {};
  if (updates.weakTopics !== undefined) rowUpdates.weak_topics = updates.weakTopics;
  if (updates.strongTopics !== undefined) rowUpdates.strong_topics = updates.strongTopics;
  if (updates.preferredStyle !== undefined) rowUpdates.preferred_style = updates.preferredStyle;
  if (updates.totalQuizzes !== undefined) rowUpdates.total_quizzes = updates.totalQuizzes;
  if (updates.averageScore !== undefined) rowUpdates.average_score = updates.averageScore;
  if (updates.totalTimeSpent !== undefined) rowUpdates.total_time_spent = updates.totalTimeSpent;
  if (updates.totalXp !== undefined) rowUpdates.total_xp = updates.totalXp;
  if (updates.currentStreak !== undefined) rowUpdates.current_streak = updates.currentStreak;
  if (updates.longestStreak !== undefined) rowUpdates.longest_streak = updates.longestStreak;
  if (updates.lastActivityDate !== undefined) rowUpdates.last_activity_date = updates.lastActivityDate;

  const { data, error } = await supabase
    .from('student_profiles')
    .update(rowUpdates)
    .eq('session_id', sessionId)
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to update profile: ${error?.message}`);
  return mapProfileRow(data as StudentProfileRow);
}

function mapProfileRow(row: StudentProfileRow): StudentProfile {
  return {
    id: row.id,
    sessionId: row.session_id,
    weakTopics: row.weak_topics,
    strongTopics: row.strong_topics,
    preferredStyle: row.preferred_style,
    totalQuizzes: row.total_quizzes,
    averageScore: row.average_score,
    totalTimeSpent: row.total_time_spent,
    totalXp: row.total_xp ?? 0,
    currentStreak: row.current_streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    lastActivityDate: row.last_activity_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================
// Recommendations
// ============================================================

export async function getRecommendedLessons(
  supabase: SupabaseClient,
  sessionId: string,
  limit = 5
): Promise<Lesson[]> {
  // Get profile and completed lesson IDs
  const [profile, progress] = await Promise.all([
    getOrCreateProfile(supabase, sessionId),
    getProgressForSession(supabase, sessionId),
  ]);

  const completedIds = progress
    .filter((p) => p.status === 'completed')
    .map((p) => p.lessonId);

  // Get all published lessons
  const allLessons = await getAllLessons(supabase, { status: 'published' });

  // Score and sort
  const scored = allLessons
    .filter((l) => !completedIds.includes(l.id))
    .map((lesson) => {
      let score = 0;

      // Weak topic overlap
      const weakTopicNames = profile.weakTopics.map((t) => t.topic.toLowerCase());
      const lessonTopics = [
        ...lesson.keyConcepts.filter((c) => c.term).map((c) => c.term.toLowerCase()),
        ...(lesson.tags ?? []).map((t) => t.toLowerCase()),
      ];
      const overlap = lessonTopics.filter((t) =>
        weakTopicNames.some((wt) => t.includes(wt) || wt.includes(t))
      ).length;
      score += overlap * 10;

      // Difficulty match
      if (profile.averageScore < 50 && lesson.difficulty === 'beginner') score += 5;
      else if (profile.averageScore >= 50 && profile.averageScore < 85 && lesson.difficulty === 'intermediate') score += 5;
      else if (profile.averageScore >= 85 && lesson.difficulty === 'advanced') score += 5;

      // Course progression bonus
      if (lesson.courseId && lesson.positionInCourse !== undefined) {
        const inProgressInCourse = progress.find(
          (p) => p.status === 'in_progress' && allLessons.find((l) => l.id === p.lessonId)?.courseId === lesson.courseId
        );
        if (inProgressInCourse) score += 8;
      }

      return { lesson, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.lesson);
}

// ============================================================
// Admin Analytics (Task 14)
// ============================================================

export type LessonPassRate = {
  lessonId: string;
  lessonTitle: string;
  courseId: string | null;
  attempts: number;
  passed: number;
  passRate: number; // 0–100
  averagePercentage: number;
};

export async function getLessonPassRates(
  supabase: SupabaseClient,
  limit = 50
): Promise<LessonPassRate[]> {
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('lesson_id, passed, percentage');
  if (!attempts || attempts.length === 0) return [];

  type Row = { lesson_id: string; passed: boolean; percentage: number };
  const by = new Map<string, { attempts: number; passed: number; sumPct: number }>();
  for (const a of attempts as Row[]) {
    const agg = by.get(a.lesson_id) ?? { attempts: 0, passed: 0, sumPct: 0 };
    agg.attempts += 1;
    if (a.passed) agg.passed += 1;
    agg.sumPct += a.percentage ?? 0;
    by.set(a.lesson_id, agg);
  }

  const lessonIds = Array.from(by.keys());
  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('id, title, course_id')
    .in('id', lessonIds);
  const byLesson = new Map(
    ((lessonRows ?? []) as { id: string; title: string; course_id: string | null }[]).map((l) => [l.id, l])
  );

  const entries: LessonPassRate[] = lessonIds.map((id) => {
    const agg = by.get(id)!;
    const lesson = byLesson.get(id);
    return {
      lessonId: id,
      lessonTitle: lesson?.title ?? id,
      courseId: lesson?.course_id ?? null,
      attempts: agg.attempts,
      passed: agg.passed,
      passRate: agg.attempts > 0 ? Math.round((agg.passed / agg.attempts) * 100) : 0,
      averagePercentage: agg.attempts > 0 ? Math.round(agg.sumPct / agg.attempts) : 0,
    };
  });

  // Most-attempted first, then worst pass-rate — the combo surfaces "tough lessons with real traffic".
  entries.sort((a, b) => {
    if (b.attempts !== a.attempts) return b.attempts - a.attempts;
    return a.passRate - b.passRate;
  });
  return entries.slice(0, limit);
}

export type PageDropOff = {
  lessonId: string;
  lessonTitle: string;
  totalStudents: number;
  completedLesson: number;
  stuckOnPage: { page: number; count: number }[]; // most-common last pages
};

export async function getPageDropOff(
  supabase: SupabaseClient,
  limit = 20
): Promise<PageDropOff[]> {
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status, current_page');
  if (!progress || progress.length === 0) return [];

  type Row = { lesson_id: string; status: string; current_page: number };
  const byLesson = new Map<string, { students: number; completed: number; pages: Map<number, number> }>();
  for (const p of progress as Row[]) {
    const agg =
      byLesson.get(p.lesson_id) ?? { students: 0, completed: 0, pages: new Map<number, number>() };
    agg.students += 1;
    if (p.status === 'completed') agg.completed += 1;
    else {
      // Only count the non-completed students against the stuck-on-page histogram.
      const pg = p.current_page ?? 1;
      agg.pages.set(pg, (agg.pages.get(pg) ?? 0) + 1);
    }
    byLesson.set(p.lesson_id, agg);
  }

  const lessonIds = Array.from(byLesson.keys());
  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('id, title')
    .in('id', lessonIds);
  const titleById = new Map(
    ((lessonRows ?? []) as { id: string; title: string }[]).map((l) => [l.id, l.title])
  );

  const entries: PageDropOff[] = lessonIds.map((id) => {
    const agg = byLesson.get(id)!;
    const pages = Array.from(agg.pages.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return {
      lessonId: id,
      lessonTitle: titleById.get(id) ?? id,
      totalStudents: agg.students,
      completedLesson: agg.completed,
      stuckOnPage: pages,
    };
  });

  // Lessons with the most non-completion count first.
  entries.sort((a, b) => {
    const aStuck = a.totalStudents - a.completedLesson;
    const bStuck = b.totalStudents - b.completedLesson;
    return bStuck - aStuck;
  });
  return entries.slice(0, limit);
}

export type CourseCompletionStat = {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  fullCompleters: number;
  averageMinutes: number | null;
};

export async function getCourseCompletionStats(
  supabase: SupabaseClient
): Promise<CourseCompletionStat[]> {
  const [{ data: courses }, { data: lessons }, { data: progress }] = await Promise.all([
    supabase.from('courses').select('id, title'),
    supabase.from('lessons').select('id, course_id'),
    supabase.from('lesson_progress').select('session_id, lesson_id, status, time_spent_seconds'),
  ]);
  if (!courses || courses.length === 0) return [];

  type Lsn = { id: string; course_id: string | null };
  type Prog = { session_id: string; lesson_id: string; status: string; time_spent_seconds: number };

  const lessonsByCourse = new Map<string, string[]>();
  for (const l of (lessons ?? []) as Lsn[]) {
    if (!l.course_id) continue;
    const arr = lessonsByCourse.get(l.course_id) ?? [];
    arr.push(l.id);
    lessonsByCourse.set(l.course_id, arr);
  }

  // Group progress rows by session+course
  const bySessionCourse = new Map<string, { completedLessons: Set<string>; totalSeconds: number }>();
  const lessonToCourse = new Map<string, string>();
  for (const l of (lessons ?? []) as Lsn[]) {
    if (l.course_id) lessonToCourse.set(l.id, l.course_id);
  }
  for (const p of (progress ?? []) as Prog[]) {
    const courseId = lessonToCourse.get(p.lesson_id);
    if (!courseId) continue;
    const key = `${p.session_id}::${courseId}`;
    const entry = bySessionCourse.get(key) ?? { completedLessons: new Set<string>(), totalSeconds: 0 };
    if (p.status === 'completed') entry.completedLessons.add(p.lesson_id);
    entry.totalSeconds += p.time_spent_seconds ?? 0;
    bySessionCourse.set(key, entry);
  }

  return (courses as { id: string; title: string }[]).map((c) => {
    const lessonIds = lessonsByCourse.get(c.id) ?? [];
    const totalLessons = lessonIds.length;

    let fullCompleters = 0;
    const completionSeconds: number[] = [];
    for (const [key, entry] of bySessionCourse.entries()) {
      if (!key.endsWith(`::${c.id}`)) continue;
      if (totalLessons > 0 && entry.completedLessons.size === totalLessons) {
        fullCompleters += 1;
        completionSeconds.push(entry.totalSeconds);
      }
    }

    const averageMinutes =
      completionSeconds.length > 0
        ? Math.round(
            completionSeconds.reduce((a, b) => a + b, 0) / completionSeconds.length / 60
          )
        : null;

    return {
      courseId: c.id,
      courseTitle: c.title,
      totalLessons,
      fullCompleters,
      averageMinutes,
    };
  });
}

// ============================================================
// Share Tokens (Task 10)
// Revocable public tokens for parent/teacher progress view.
// ============================================================

function generateShareToken(): string {
  // URL-safe random — 24 bytes → ~32 chars.
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getOrCreateShareToken(
  supabase: SupabaseClient,
  sessionId: string
): Promise<string> {
  const { data } = await supabase
    .from('student_sessions')
    .select('share_token')
    .eq('id', sessionId)
    .single();
  if (data?.share_token) return data.share_token as string;

  const token = generateShareToken();
  const { error } = await supabase
    .from('student_sessions')
    .update({ share_token: token })
    .eq('id', sessionId);
  if (error) throw new Error(`Failed to create share token: ${error.message}`);
  return token;
}

export async function rotateShareToken(
  supabase: SupabaseClient,
  sessionId: string
): Promise<string> {
  const token = generateShareToken();
  const { error } = await supabase
    .from('student_sessions')
    .update({ share_token: token })
    .eq('id', sessionId);
  if (error) throw new Error(`Failed to rotate share token: ${error.message}`);
  return token;
}

export async function revokeShareToken(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from('student_sessions')
    .update({ share_token: null })
    .eq('id', sessionId);
  if (error) throw new Error(`Failed to revoke share token: ${error.message}`);
}

export async function getSessionByShareToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ id: string; displayName: string } | null> {
  const { data } = await supabase
    .from('student_sessions')
    .select('id, display_name')
    .eq('share_token', token)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id as string, displayName: data.display_name as string };
}

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
