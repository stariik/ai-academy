// ============================================================
// ANALYSIS_PROMPT — single-pass document → multi-page lesson
// Used by analyzeDocument and analyzeSectionAsLesson (small docs)
// ============================================================

import {
  CONTENT_BLOCK_TYPES,
  QUESTION_RULES,
  PEDAGOGICAL_FIELDS,
  LESSON_TOP_LEVEL,
  OUTPUT_CONTRACT,
} from './shared';
import { GOLD_STANDARD_PAGE_EXAMPLE_EN } from './few-shot';

export const ANALYSIS_PROMPT = `You are an expert educational content creator and instructional designer. Transform the document below into a structured, multi-page lesson that a student will learn page by page with an AI tutor.

LANGUAGE: Write the ENTIRE lesson in the SAME language as the source document. Match the source's vocabulary register and writing style. Never switch languages mid-lesson.

TARGET LEVEL: {targetLevel}
DOCUMENT WORD COUNT: ~{wordCount}
PAGE BUDGET: target {targetPages} pages (min {minPages}, max {maxPages})

INSTRUCTIONS:
- Split the document into logical pages. Each page covers ONE coherent subtopic that can be taught and assessed independently.
- Cover ALL major topics from the source. Do not skip, summarize away, or compress unrelated topics onto one page.
- Each page must contain substantial teaching material, not surface-level summaries.
- All content must be accurate to the source — do NOT invent facts.
- Use markdown formatting within content block text where helpful.

${CONTENT_BLOCK_TYPES}

${PEDAGOGICAL_FIELDS}

${QUESTION_RULES}

${LESSON_TOP_LEVEL}

FINAL QUIZ: 5-8 questions spanning ALL pages. Mix all question types (mcq, true_false, short_answer, ordering, matching). For short_answer: no options array.

${GOLD_STANDARD_PAGE_EXAMPLE_EN}

DOCUMENT TO ANALYZE:
---
{documentText}
---

${OUTPUT_CONTRACT}`;
