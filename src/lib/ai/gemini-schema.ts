// ============================================================
// Zod schemas for Gemini responses
// Used for runtime validation of LLM output. Bad JSON or missing
// fields → one retry, then fail loudly.
// ============================================================

import { z } from 'zod';

const contentBlockSchema = z.object({
  type: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const keyConceptSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

const difficultyEnum = z.enum(['easy', 'medium', 'hard']);

const quizQuestionSchema = z.object({
  question: z.string(),
  type: z.string(),
  options: z.array(z.string()).optional(),
  correct_answer: z.string(),
  explanation: z.string(),
  difficulty: difficultyEnum,
  points: z.number(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const teachingFlowSchema = z.object({
  reflection_prompt: z.string(),
});

const pageSchema = z.object({
  page_number: z.number(),
  title: z.string(),
  content_blocks: z.array(contentBlockSchema).min(1),
  key_concepts: z.array(keyConceptSchema).default([]),
  check_questions: z.array(quizQuestionSchema).default([]),
  teaching_flow: teachingFlowSchema.optional(),
  difficulty_level: z.string().optional(),
  bridge_from_previous: z.string().nullable().optional(),
  common_misconceptions: z.array(z.string()).optional(),
  real_world_applications: z.array(z.string()).optional(),
});

// Full lesson response (single-pass analyze + generative flows)
export const geminiLessonResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  learning_objectives: z.array(z.string()).min(1),
  pages: z.array(pageSchema).min(1),
  summary: z.string(),
  final_quiz_questions: z.array(quizQuestionSchema).default([]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_duration_minutes: z.number(),
});

// Chunked mode: one chunk only produces pages
export const geminiChunkResponseSchema = z.object({
  pages: z.array(pageSchema).min(1),
});

// Final-quiz + metadata pass (chunked mode stage 2)
export const geminiFinalQuizResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  learning_objectives: z.array(z.string()).min(1),
  summary: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_duration_minutes: z.number(),
  final_quiz_questions: z.array(quizQuestionSchema).min(1),
});

// Outline extraction (used by course flow)
export const geminiOutlineResponseSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      start_marker: z.string(),
    })
  ),
});

// Self-review pass (quality scoring)
export const geminiReviewResponseSchema = z.object({
  score: z.number().min(0).max(10),
  issues: z.array(z.string()).default([]),
});

// Syllabus parser (Stage 0 of the syllabus pipeline)
const syllabusLessonSchema = z.object({
  number: z.number().int().min(1),
  title: z.string().min(1),
  subtitle: z.string().default(''),
});

const syllabusModuleSchema = z.object({
  number: z.number().int().min(1),
  title: z.string().min(1),
  weekNumber: z.number().int().nullable().optional(),
  outcome: z.string(),
  lessons: z.array(syllabusLessonSchema).min(1),
});

export const geminiSyllabusResponseSchema = z.object({
  courseTitle: z.string().min(1),
  courseSubtitle: z.string().default(''),
  courseDescription: z.string().default(''),
  language: z.string().default('English'),
  audience: z.array(z.string()).default([]),
  durationLabel: z.string().default(''),
  totalLessonsLabel: z.string().default(''),
  modules: z.array(syllabusModuleSchema).min(1),
  finalOutcomes: z.array(z.string()).default([]),
  toolsUsed: z
    .array(
      z.object({
        category: z.string(),
        tools: z.array(z.string()),
      })
    )
    .default([]),
});

// Lesson expander (Stage 1 of the syllabus pipeline)
const subLessonSpecSchema = z.object({
  title: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(3).max(10),
  estimatedPages: z.number().int().min(3).max(5),
  estimatedMinutes: z.number().int().min(8).max(20),
  splitReason: z.string().nullable().default(null),
});

export const geminiLessonExpansionResponseSchema = z.object({
  subLessons: z.array(subLessonSpecSchema).min(1).max(3),
});

export type GeminiLessonResponseZ = z.infer<typeof geminiLessonResponseSchema>;
export type GeminiChunkResponseZ = z.infer<typeof geminiChunkResponseSchema>;
export type GeminiFinalQuizResponseZ = z.infer<typeof geminiFinalQuizResponseSchema>;
export type GeminiReviewResponseZ = z.infer<typeof geminiReviewResponseSchema>;
export type GeminiSyllabusResponseZ = z.infer<typeof geminiSyllabusResponseSchema>;
export type GeminiLessonExpansionResponseZ = z.infer<typeof geminiLessonExpansionResponseSchema>;
export type SubLessonSpec = z.infer<typeof subLessonSpecSchema>;
