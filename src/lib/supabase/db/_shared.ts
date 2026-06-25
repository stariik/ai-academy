import type {
  ContentBlockRow,
  QuizQuestionRow,
} from '../types';
import type {
  ContentBlock,
  QuizQuestion,
} from '@/types';


// ============================================================
// Quiz Question Sanitizer — ensures all NOT NULL fields have defaults
// Gemini responses (especially truncated/recovered) often have missing fields
// ============================================================

export function sanitizeQuizQuestion(qq: QuizQuestion, lessonId: string, pageId: string | null, scope: string) {
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

export function mapContentBlock(cb: ContentBlockRow): ContentBlock {
  return {
    id: cb.id,
    type: cb.type as ContentBlock['type'],
    content: cb.content,
    contentEn: cb.content_en ?? null,
    metadata: cb.metadata ?? undefined,
    order: cb.order,
    pageId: cb.page_id ?? undefined,
  };
}

export function mapQuizQuestion(qq: QuizQuestionRow): QuizQuestion {
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
