// ============================================================
// CHUNK_PAGES_PROMPT — generates pages from one chunk of a
// large document. Called once per chunk in chunked mode.
// ============================================================

import {
  CONTENT_BLOCK_TYPES,
  QUESTION_RULES,
  PEDAGOGICAL_FIELDS,
  OUTPUT_CONTRACT,
} from './shared';

export const CHUNK_PAGES_PROMPT = `You are an expert educational content creator. Generate lesson pages from the text section below.

LANGUAGE: Write in the SAME language as the source text. Match its vocabulary and style.

TARGET LEVEL: {targetLevel}
Section {chunkIndex} of {totalChunks} of a larger document.
Section topics: {sectionTitles}

Generate approximately {targetPages} pages from this section (±1 based on natural topic breaks), starting at page number {startPage}.

{previousContext}

INSTRUCTIONS:
- Each page covers ONE coherent topic drawn directly from the source text.
- Each page must contain substantial teaching material, not summaries.
- All content must be accurate to the source — do NOT invent facts.
- Use markdown formatting within content block text where helpful.

${CONTENT_BLOCK_TYPES}

${PEDAGOGICAL_FIELDS}

${QUESTION_RULES}

Respond with a JSON object containing only a "pages" array — no lesson-level metadata, no final quiz.

TEXT SECTION:
---
{chunkText}
---

${OUTPUT_CONTRACT}`;
