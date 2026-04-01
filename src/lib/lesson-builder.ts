// ============================================================
// Shared Lesson Builder - Transforms Gemini response into Lesson
// Used by both /api/analyze and /api/analyze-course
// ============================================================

import type { Lesson, ContentBlock, QuizQuestion, LessonPage, GeminiPagedLessonResponse } from '@/types';

export function generateLessonId(): string {
  return `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function normalizeBlockType(type: string): ContentBlock['type'] {
  const typeMap: Record<string, ContentBlock['type']> = {
    heading: 'heading',
    text: 'text',
    key_concepts: 'key_concepts',
    code: 'code',
    callout: 'callout',
    summary: 'summary',
    table: 'table',
    list: 'list',
    example: 'example',
    analogy: 'analogy',
    step_by_step: 'step_by_step',
    diagram_description: 'diagram_description',
    definition: 'definition',
    warning: 'warning',
    tip: 'tip',
    quote: 'quote',
    paragraph: 'text',
    note: 'callout',
    important: 'callout',
    concepts: 'key_concepts',
    overview: 'summary',
    numbered_list: 'list',
    bulleted_list: 'list',
    ordered_list: 'list',
    unordered_list: 'list',
    bullet_list: 'list',
    worked_example: 'example',
    comparison: 'analogy',
    procedure: 'step_by_step',
    steps: 'step_by_step',
    visual: 'diagram_description',
    diagram: 'diagram_description',
    illustration: 'diagram_description',
    caution: 'warning',
    danger: 'warning',
    best_practice: 'tip',
    hint: 'tip',
    advice: 'tip',
    blockquote: 'quote',
    citation: 'quote',
    data_table: 'table',
    glossary: 'definition',
    term: 'definition',
  };

  return typeMap[type.toLowerCase()] || 'text';
}

export function buildLessonFromGeminiResponse(
  geminiResponse: GeminiPagedLessonResponse,
  sourceFileName: string,
  courseId?: string,
  positionInCourse?: number
): Lesson {
  const lessonId = generateLessonId();

  const pages: LessonPage[] = geminiResponse.pages.map((page) => {
    const pageId = `${lessonId}-page-${page.page_number}`;

    const pageBlocks: ContentBlock[] = page.content_blocks.map((block, idx) => ({
      id: `${pageId}-cb-${idx}`,
      type: normalizeBlockType(block.type),
      content: block.content,
      metadata: block.metadata,
      order: idx,
      pageId,
    }));

    const checkQuestions: QuizQuestion[] = (page.check_questions || []).map((q, idx) => ({
      id: `${pageId}-cq-${idx}`,
      type: q.type as QuizQuestion['type'],
      question: q.question,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      points: q.points || 5,
      pageId,
      scope: 'check' as const,
      bloomLevel: q.bloom_level as QuizQuestion['bloomLevel'],
      metadata: q.metadata,
    }));

    return {
      id: pageId,
      lessonId,
      pageNumber: page.page_number,
      title: page.title,
      keyConcepts: page.key_concepts || [],
      contentBlocks: pageBlocks,
      checkQuestions,
      teachingFlow: page.teaching_flow ? {
        introduction: page.teaching_flow.introduction,
        coreExplanation: page.teaching_flow.core_explanation,
        practiceHint: page.teaching_flow.practice_hint,
        reflectionPrompt: page.teaching_flow.reflection_prompt,
      } : undefined,
      prerequisites: page.prerequisites,
      conceptsIntroduced: page.concepts_introduced,
      difficultyLevel: page.difficulty_level as LessonPage['difficultyLevel'],
      bridgeFromPrevious: page.bridge_from_previous,
      commonMisconceptions: page.common_misconceptions,
      realWorldApplications: page.real_world_applications,
    };
  });

  const quizQuestions: QuizQuestion[] = (geminiResponse.final_quiz_questions || []).map(
    (q, index) => ({
      id: `${lessonId}-fq-${index}`,
      type: q.type as QuizQuestion['type'],
      question: q.question,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      points: q.points || 10,
      scope: 'final' as const,
      bloomLevel: q.bloom_level as QuizQuestion['bloomLevel'],
      metadata: q.metadata,
    })
  );

  const allKeyConcepts = pages.flatMap((p) => p.keyConcepts);

  return {
    id: lessonId,
    title: geminiResponse.title,
    description: geminiResponse.description,
    learningObjectives: geminiResponse.learning_objectives,
    contentBlocks: [],
    keyConcepts: allKeyConcepts,
    summary: geminiResponse.summary,
    quizQuestions,
    sourceDocument: sourceFileName,
    difficulty: geminiResponse.difficulty,
    estimatedDurationMinutes: pages.length * 3, // ~3 min per page (reading + check questions)
    createdAt: new Date().toISOString(),
    status: 'draft',
    tags: [],
    courseId,
    positionInCourse,
    pages,
    totalPages: pages.length,
    conceptMap: geminiResponse.concept_map?.map(n => ({
      conceptId: n.concept_id,
      label: n.label,
      prerequisiteIds: n.prerequisite_ids,
    })),
    learningPath: geminiResponse.learning_path,
  };
}
