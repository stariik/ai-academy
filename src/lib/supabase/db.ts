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
} from './types';
import type { Lesson, ContentBlock, QuizQuestion, LessonPage, Course, StudentSession, LessonProgress, StudentProfile } from '@/types';

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
    description: row.description,
    learningObjectives: row.learning_objectives,
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
        prerequisites: pr.prerequisites ?? undefined,
        conceptsIntroduced: pr.concepts_introduced ?? undefined,
        difficultyLevel: pr.difficulty_level as LessonPage['difficultyLevel'],
        bridgeFromPrevious: pr.bridge_from_previous ?? undefined,
        commonMisconceptions: pr.common_misconceptions ?? undefined,
        realWorldApplications: pr.real_world_applications ?? undefined,
      }));
    lesson.totalPages = lesson.pages.length;
  }

  // Map lesson-level pedagogical fields
  if (row.concept_map) {
    lesson.conceptMap = row.concept_map.map(n => ({
      conceptId: n.concept_id,
      label: n.label,
      prerequisiteIds: n.prerequisite_ids,
    }));
  }
  if (row.learning_path) {
    lesson.learningPath = row.learning_path;
  }

  return lesson;
}

// ============================================================
// Lessons CRUD
// ============================================================

export async function saveLesson(supabase: SupabaseClient, lesson: Lesson): Promise<void> {
  // Insert lesson row
  // Build insert data — concept_map and learning_path may not exist in all schemas
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

  // Try with concept_map/learning_path first, fallback without them
  const conceptMapData = lesson.conceptMap?.map(n => ({
    concept_id: n.conceptId,
    label: n.label,
    prerequisite_ids: n.prerequisiteIds,
  })) ?? null;

  const { error: lessonError } = await supabase.from('lessons').insert({
    ...insertData,
    concept_map: conceptMapData,
    learning_path: lesson.learningPath ?? null,
  });

  if (lessonError) {
    // Retry without concept_map/learning_path if column doesn't exist
    if (lessonError.message.includes('concept_map') || lessonError.message.includes('learning_path')) {
      const { error: retryError } = await supabase.from('lessons').insert(insertData);
      if (retryError) throw new Error(`Failed to save lesson: ${retryError.message}`);
    } else if (lessonError.message.includes('fetch failed') || lessonError.message.includes('TIMEOUT')) {
      // Network error — retry after delay
      await new Promise(r => setTimeout(r, 3000));
      const { error: retryError } = await supabase.from('lessons').insert({
        ...insertData,
        concept_map: conceptMapData,
        learning_path: lesson.learningPath ?? null,
      });
      if (retryError) {
        // Final attempt without optional fields
        await new Promise(r => setTimeout(r, 2000));
        const { error: finalError } = await supabase.from('lessons').insert(insertData);
        if (finalError) throw new Error(`Failed to save lesson: ${finalError.message}`);
      }
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
    description: row.description,
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
    description: row.description,
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
    description: row.description,
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
    prerequisites: p.prerequisites ?? null,
    concepts_introduced: p.conceptsIntroduced ?? null,
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
    prerequisites: pr.prerequisites ?? undefined,
    conceptsIntroduced: pr.concepts_introduced ?? undefined,
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
  }>
): Promise<StudentProfile> {
  const rowUpdates: Record<string, unknown> = {};
  if (updates.weakTopics !== undefined) rowUpdates.weak_topics = updates.weakTopics;
  if (updates.strongTopics !== undefined) rowUpdates.strong_topics = updates.strongTopics;
  if (updates.preferredStyle !== undefined) rowUpdates.preferred_style = updates.preferredStyle;
  if (updates.totalQuizzes !== undefined) rowUpdates.total_quizzes = updates.totalQuizzes;
  if (updates.averageScore !== undefined) rowUpdates.average_score = updates.averageScore;
  if (updates.totalTimeSpent !== undefined) rowUpdates.total_time_spent = updates.totalTimeSpent;

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
