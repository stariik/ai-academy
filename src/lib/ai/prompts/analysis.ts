// ============================================================
// ANALYSIS prompts — single-pass section → multi-page lesson.
//
// Split into two pieces so Anthropic prompt caching can kick in:
//
//   ANALYSIS_SYSTEM_PROMPT   — stable across every call in a course
//                              (instructions + content-block types +
//                              question rules + few-shot example).
//                              Cached with cache_control=ephemeral.
//
//   buildAnalysisUserPrompt  — variable per section (target level,
//                              word count, page budget, previous
//                              context, the section text itself).
//                              NOT cached.
//
// Caching cuts input cost ~40% on Claude and saves ~200-500ms per
// call. Gemini ignores the split and concatenates before sending.
// ============================================================

import {
  CONTENT_BLOCK_TYPES,
  QUESTION_RULES,
  PEDAGOGICAL_FIELDS,
  LESSON_TOP_LEVEL,
  OUTPUT_CONTRACT,
} from './shared';
import {
  GOLD_STANDARD_PAGE_EXAMPLE_EN,
  GOLD_STANDARD_PAGE_EXAMPLE_KA,
} from './few-shot';

function pickFewShotExample(language: string): string {
  const lower = language.toLowerCase();
  if (lower.includes('georgian') || lower.includes('ქართულ') || lower === 'ka') {
    return GOLD_STANDARD_PAGE_EXAMPLE_KA;
  }
  return GOLD_STANDARD_PAGE_EXAMPLE_EN;
}

/**
 * Build the stable, cacheable system prompt for section analysis.
 * Same bytes every call within a course → high cache hit rate.
 */
export function buildAnalysisSystemPrompt(language: string): string {
  const fewShot = pickFewShotExample(language);

  return `You are an expert educational content creator and instructional designer. Transform the section text provided by the user into a structured, multi-page lesson that a student will learn page by page with an AI tutor.

LANGUAGE: Write the ENTIRE lesson in the SAME language as the source text. Match the source's vocabulary register and writing style. Never switch languages mid-lesson.

INSTRUCTIONS:
- Split the section into logical pages. Each page covers ONE coherent subtopic that can be taught and assessed independently.
- Cover ALL major topics from the source. Do not skip, summarize away, or compress unrelated topics onto one page.
- Each page must contain substantial teaching material, not surface-level summaries.
- All content must be accurate to the source — do NOT invent facts.
- Use markdown formatting within content block text where helpful.

${CONTENT_BLOCK_TYPES}

${PEDAGOGICAL_FIELDS}

${QUESTION_RULES}

${LESSON_TOP_LEVEL}

FINAL QUIZ: 5-8 questions spanning ALL pages. Mix all question types (mcq, true_false, short_answer, ordering, matching). For short_answer: no options array.

${fewShot}

${OUTPUT_CONTRACT}`;
}

/**
 * Build the variable per-section user message.
 * Changes every call → not cached.
 */
export function buildAnalysisUserPrompt(params: {
  targetLevel: string;
  wordCount: number;
  targetPages: number;
  minPages: number;
  maxPages: number;
  documentText: string;
}): string {
  return `TARGET LEVEL: ${params.targetLevel}
DOCUMENT WORD COUNT: ~${params.wordCount}
PAGE BUDGET: target ${params.targetPages} pages (min ${params.minPages}, max ${params.maxPages})

SECTION TO ANALYZE:
---
${params.documentText}
---`;
}

// ============================================================
// Legacy combined-string export. Kept for any caller that still
// uses the old template-with-placeholders pattern. Prefer the
// two-part system/user split above for new code.
// ============================================================
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
