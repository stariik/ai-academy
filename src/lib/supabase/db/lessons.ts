import { SupabaseClient } from '@supabase/supabase-js';
import type {
  LessonRow,
  ContentBlockRow,
  QuizQuestionRow,
  LessonPageRow,
} from '../types';
import type {
  Lesson,
  LessonPage,
  TranslatedPageOverlay,
} from '@/types';
import { sanitizeQuizQuestion, mapContentBlock, mapQuizQuestion } from './_shared';


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
        titleEn: pr.title_en ?? null,
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

/**
 * Lightweight lesson row — just the fields the storefront (landing / course
 * cards / course detail) needs. Unlike getAllLessons it does NOT fetch
 * content_blocks or quiz_questions or assemble full lessons, so it's an order
 * of magnitude cheaper for list views.
 */
export type LessonLite = {
  id: string;
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  learningObjectives: string[];
  learningObjectivesEn: string[] | null;
  difficulty: Lesson['difficulty'];
  estimatedDurationMinutes: number;
  courseId?: string;
  positionInCourse?: number;
  status: string;
};

export async function getAllLessonsLite(
  supabase: SupabaseClient,
  filters?: { status?: string; courseId?: string }
): Promise<LessonLite[]> {
  let query = supabase
    .from('lessons')
    .select(
      'id, course_id, difficulty, estimated_duration_minutes, title, title_en, description, description_en, learning_objectives, learning_objectives_en, position_in_course, status'
    )
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.courseId) query = query.eq('course_id', filters.courseId);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    title: (r.title as string) ?? '',
    titleEn: (r.title_en as string | null) ?? null,
    description: (r.description as string) ?? '',
    descriptionEn: (r.description_en as string | null) ?? null,
    learningObjectives: (r.learning_objectives as string[] | null) ?? [],
    learningObjectivesEn: (r.learning_objectives_en as string[] | null) ?? null,
    difficulty: r.difficulty as Lesson['difficulty'],
    estimatedDurationMinutes: (r.estimated_duration_minutes as number) ?? 0,
    courseId: (r.course_id as string | null) ?? undefined,
    positionInCourse: (r.position_in_course as number | null) ?? undefined,
    status: (r.status as string) ?? '',
  }));
}

export async function updateLesson(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Lesson>
): Promise<Lesson | null> {
  // Map camelCase to snake_case for the lesson row
  const rowUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) rowUpdates.title = updates.title;
  if (updates.titleEn !== undefined) rowUpdates.title_en = updates.titleEn;
  if (updates.description !== undefined) rowUpdates.description = updates.description;
  if (updates.descriptionEn !== undefined) rowUpdates.description_en = updates.descriptionEn;
  if (updates.learningObjectives !== undefined) rowUpdates.learning_objectives = updates.learningObjectives;
  if (updates.learningObjectivesEn !== undefined) rowUpdates.learning_objectives_en = updates.learningObjectivesEn;
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
// Lesson Pages CRUD (added 2026-05-20 for full-edit admin)
// ============================================================

export async function updateLessonPage(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<{
    title: string;
    titleEn: string | null;
    pageNumber: number;
    keyConcepts: { term: string; definition: string }[];
  }>
): Promise<boolean> {
  const rowUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) rowUpdates.title = updates.title;
  if (updates.titleEn !== undefined) rowUpdates.title_en = updates.titleEn;
  if (updates.pageNumber !== undefined) rowUpdates.page_number = updates.pageNumber;
  if (updates.keyConcepts !== undefined) rowUpdates.key_concepts = updates.keyConcepts;
  if (Object.keys(rowUpdates).length === 0) return true;

  const { error } = await supabase.from('lesson_pages').update(rowUpdates).eq('id', id);
  if (error) throw new Error(`Failed to update lesson page: ${error.message}`);
  return true;
}

/**
 * Batch-reorder pages within a lesson. Caller sends the desired final
 * (id, pageNumber) pairs. We write them in two passes (negative temp
 * numbers first, then the real numbers) so the unique(lesson_id,
 * page_number) constraint never trips mid-update.
 */
export async function reorderLessonPages(
  supabase: SupabaseClient,
  lessonId: string,
  order: { id: string; pageNumber: number }[],
): Promise<void> {
  for (let i = 0; i < order.length; i++) {
    const { error } = await supabase
      .from('lesson_pages')
      .update({ page_number: -(i + 1) })
      .eq('id', order[i].id)
      .eq('lesson_id', lessonId);
    if (error) throw new Error(`Failed to stage reorder: ${error.message}`);
  }
  for (const { id, pageNumber } of order) {
    const { error } = await supabase
      .from('lesson_pages')
      .update({ page_number: pageNumber })
      .eq('id', id)
      .eq('lesson_id', lessonId);
    if (error) throw new Error(`Failed to commit reorder: ${error.message}`);
  }
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
// Page translation cache
// ============================================================

export async function getPageTranslation(
  supabase: SupabaseClient,
  lessonId: string,
  pageNumber: number,
  locale: string
): Promise<{ sourceHash: string; payload: TranslatedPageOverlay } | null> {
  const { data } = await supabase
    .from('lesson_page_translations')
    .select('source_hash, payload')
    .eq('lesson_id', lessonId)
    .eq('page_number', pageNumber)
    .eq('locale', locale)
    .single();

  if (!data) return null;
  return {
    sourceHash: data.source_hash as string,
    payload: data.payload as TranslatedPageOverlay,
  };
}

export async function upsertPageTranslation(
  supabase: SupabaseClient,
  lessonId: string,
  pageNumber: number,
  locale: string,
  sourceHash: string,
  payload: TranslatedPageOverlay
): Promise<void> {
  const { error } = await supabase
    .from('lesson_page_translations')
    .upsert(
      {
        lesson_id: lessonId,
        page_number: pageNumber,
        locale,
        source_hash: sourceHash,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'lesson_id,page_number,locale' }
    );

  if (error) throw new Error(`Failed to cache page translation: ${error.message}`);
}
