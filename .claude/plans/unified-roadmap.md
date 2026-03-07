# Unified Implementation Roadmap

## Overview

This roadmap synthesizes Plans 1-6 into a conflict-free, ordered implementation guide. The six plans collectively upgrade the lesson generation system across five dimensions: dynamic page counts (Plan 1), richer content blocks (Plan 2), pedagogical structure (Plan 3), smarter chunking (Plan 4), better quizzes (Plan 5), and model optimization (Plan 6).

---

## Conflict Analysis

### Resolved Conflicts

1. **Token budget formula (Plans 1 vs 6):**
   - Plan 1 sets `tokensPerPage = 2000`, overhead = 500, min = 8192
   - Plan 6 updates to `tokensPerPage = 3000`, overhead = 1000, min = 16384
   - **Resolution:** Use Plan 6's values. They account for richer content (Plan 2) and pedagogical metadata (Plan 3). The `calculateDynamicPageCount()` function from Plan 1 is created with Plan 6's token formula from the start.

2. **`callGeminiWithRetry()` signature (Plans 4, 5, 6):**
   - Plan 6 changes the signature to accept a `GeminiConfig` object
   - Plans 4 and 5 add new call sites that use the old signature
   - **Resolution:** Implement Plan 6's config factory first. All new call sites (outline extraction from Plan 4, check question generation from Plan 5) use `getGeminiConfig()` from day one.

3. **`CHUNK_PAGES_PROMPT` modifications (Plans 1, 2, 3, 4):**
   - Plan 1: changes page count instructions to dynamic
   - Plan 2: adds block type catalog and variety rules
   - Plan 3: adds pedagogical structure fields
   - Plan 4: adds `{previousContext}` and `{sectionTitles}` placeholders
   - **Resolution:** All four sets of changes are additive (different sections of the prompt). Merge them into one unified prompt update.

4. **`ANALYSIS_PROMPT` modifications (Plans 1, 2, 3, 5):**
   - Plan 1: changes page range to dynamic target
   - Plan 2: adds block type catalog and variety rules
   - Plan 3: adds pedagogical structure requirements
   - Plan 5: strengthens check question instructions
   - **Resolution:** All additive. Merge into one unified prompt update.

5. **`normalizeBlockType()` return type (Plan 2):**
   - Currently returns the 6-type union literal
   - Plan 2 expands to 16 types
   - **Resolution:** The return type changes to `ContentBlock['type']` which expands with the type union. Single change point.

6. **`splitTextIntoChunks()` vs `buildSmartChunks()` (Plans 1, 4):**
   - Plan 1 modifies chunked mode to use `analyzeDocumentStructure()` per chunk
   - Plan 4 replaces `splitTextIntoChunks()` entirely with `buildSmartChunks()`
   - **Resolution:** Implement Plan 4's `buildSmartChunks()` which supersedes the old function. Plan 1's per-chunk structure analysis feeds into the page budget for each smart chunk.

7. **`generatePagesFromChunk()` signature (Plans 1, 4):**
   - Plan 1 passes dynamic per-chunk target
   - Plan 4 adds `previousContext` and `sectionTitles` parameters
   - **Resolution:** Merge both sets of new parameters into a single signature update.

8. **Chunked threshold constants (Plans 4, 6):**
   - Plan 4: `CHUNKED_THRESHOLD = 60_000`, `MAX_CHUNK_SIZE = 60_000`
   - Plan 6: defers to Plan 1's `targetPages > 12 || outputTokens > 32768` routing
   - **Resolution:** Use Plan 4's lowered char threshold AND Plan 1's dynamic routing. Whichever triggers first routes to chunked mode.

### Overlaps Merged

1. **`GeminiPagedLessonResponse` type extensions (Plans 3, 5):** Both add fields to the pages array type. Merged into a single type update.
2. **`LessonPage` type extensions (Plan 3):** New pedagogical fields. Combined with Plan 5's `bloomLevel` on questions.
3. **Final quiz context improvement:** Plan 4 increases preview from 300 to 800 chars; Plan 5 adds misconceptions. Combined.
4. **Quiz question transformation (Plans 3, 5):** Both modify the page mapping in analyze route. Combined into one mapping update.

---

## Implementation Order by Task

### Task #8: Types and Schema Updates

**Files modified:** `src/types/index.ts`

This is the foundation. All other tasks depend on these type definitions.

**Changes:**

1. **Expand `ContentBlock.type` union** (Plan 2, Step 1):
   - Add 10 new block types: `table`, `list`, `example`, `analogy`, `step_by_step`, `diagram_description`, `definition`, `warning`, `tip`, `quote`

2. **Expand `QuizQuestion` type** (Plan 5, Steps 1-2):
   - Add new question types: `ordering`, `fill_in_blank`, `matching`
   - Add `bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'`
   - Add `metadata?: Record<string, unknown>`

3. **Add pedagogical types** (Plan 3, Step 1):
   - Add `TeachingFlow` type
   - Add `ConceptNode` type

4. **Extend `LessonPage`** (Plan 3, Step 2):
   - Add optional fields: `teachingFlow`, `prerequisites`, `conceptsIntroduced`, `difficultyLevel`, `bridgeFromPrevious`, `commonMisconceptions`, `realWorldApplications`

5. **Extend `Lesson`** (Plan 3, Step 3):
   - Add optional fields: `conceptMap`, `learningPath`

6. **Extend `GeminiPagedLessonResponse`** (Plans 3, 5 merged):
   - Add pedagogical fields to the page type (teaching_flow, prerequisites, concepts_introduced, difficulty_level, bridge_from_previous, common_misconceptions, real_world_applications)
   - Expand check_questions type to include new question types, bloom_level, metadata
   - Add lesson-level concept_map and learning_path
   - Expand final_quiz_questions with bloom_level, metadata, page_reference

**Note:** Supabase types (`src/lib/supabase/types.ts`) and db functions (`src/lib/supabase/db.ts`) also need updating per Plan 3 Steps 5, 11 and Plan 5 Steps 4-5. A SQL migration is needed (Plan 3 Step 6, Plan 5 Step 4). These are part of this task since they are schema-level changes.

---

### Task #9: Gemini Model Config and Chunking Overhaul

**Files modified:** `src/lib/ai/gemini.ts`

This task covers Plans 1, 4, and 6 -- the engine-level changes.

**Changes (in order within the file):**

1. **Add `GeminiConfig` type and `getGeminiConfig()` factory** (Plan 6, Steps 1-2):
   - Four task-specific configs: content_generation, outline_extraction, quiz_generation, metadata_generation
   - Temperatures: 0.35, 0.2, 0.4, 0.3 respectively
   - Dynamic token budget support

2. **Add `DocumentStructure` interface and `analyzeDocumentStructure()` function** (Plan 1, Step 1):
   - Analyzes document text for word count, headings, topics, code blocks, lists, information density

3. **Replace `getPageRange()` with `calculateDynamicPageCount()`** (Plans 1+6 merged, Steps 2+5):
   - Returns `PageBudget` with targetPages, minPages, maxPages, outputTokens
   - Uses Plan 6's token formula: `tokensPerPage = 3000`, min = 16384, max = 65536
   - No hard cap on page count

4. **Add `DocumentOutline` type and `extractDocumentOutline()` function** (Plan 4, Step 1):
   - Lightweight pre-analysis of document structure before chunking
   - Falls back to AI-based outline extraction for unstructured docs

5. **Add `detectSections()` function** (Plan 4, Step 2):
   - Regex-based heading detection for markdown, numbered sections, all-caps headings

6. **Replace `splitTextIntoChunks()` with `buildSmartChunks()` and `splitAtParagraphs()`** (Plan 4, Step 3):
   - Structure-aware chunking that respects section boundaries
   - `SmartChunk` type with sectionTitles and metadata

7. **Update `callGeminiWithRetry()` signature** (Plan 6, Step 2):
   - Accept `GeminiConfig` as second parameter (instead of hardcoded config)
   - Remove internal model creation; use config-driven model

8. **Update `generatePagesFromChunk()` signature** (Plans 1+4 merged):
   - Add `previousContext` and `sectionTitles` parameters
   - Use `getGeminiConfig('content_generation', targetPages * 3000)` for model config

9. **Update `generateFinalQuizAndMeta()`** (Plans 4+5+6 merged):
   - Increase content preview from 300 to 800 chars (Plan 4, Step 6)
   - Add misconceptions to context (Plan 4)
   - Dynamic quiz question count: `Math.max(8, Math.min(15, Math.ceil(pages.length * 1.5)))` (Plan 5, Step 9)
   - Use `getGeminiConfig('metadata_generation', quizTokenBudget)` (Plan 6)

10. **Replace `analyzeDocumentChunked()`** (Plans 1+4 merged):
    - Use `extractDocumentOutline()` then `buildSmartChunks()`
    - Per-chunk `analyzeDocumentStructure()` + `calculateDynamicPageCount()`
    - Context overlap between chunks via `previousContext`
    - Sequential processing (parallel is deferred as optional optimization)

11. **Update `analyzeDocument()` single-call path** (Plans 1+6 merged):
    - Replace `getPageRange()` with `analyzeDocumentStructure()` + `calculateDynamicPageCount()`
    - Auto-route to chunked mode if `targetPages > 12 || outputTokens > 32768`
    - Use `getGeminiConfig('content_generation', outputTokens)` for model config

12. **Update constants** (Plan 4, Step 9):
    - `CHUNKED_THRESHOLD = 60_000` (was 80,000)
    - `MAX_CHUNK_SIZE = 60_000` (was 50,000)

13. **Add `CHECK_QUESTIONS_PROMPT`** (Plan 5, Step 6):
    - New prompt for separate check question generation in chunked mode
    - Includes Bloom's taxonomy, question type variety, difficulty progression

14. **Add `generateCheckQuestionsForPages()` function** (Plan 5, Step 10):
    - Generates check questions in batches of ~5 pages after chunk content generation
    - Uses `getGeminiConfig('quiz_generation', pages.length * 1500)`

---

### Task #10: Prompt Engineering Overhaul

**Files modified:** `src/lib/ai/gemini.ts` (prompt strings only)

This task updates all three existing prompts with the content from Plans 1, 2, 3, and 5.

**Changes:**

1. **Update `ANALYSIS_PROMPT`** (all four plans merged):
   - Replace fixed page range `{minPages}-{maxPages}` with dynamic `{targetPages}` (Plan 1, Step 3)
   - Add `{targetPages}` placeholder
   - Add content block type catalog (16 types) with variety rules (Plan 2, Step 4)
   - Add pedagogical structure requirements section (Plan 3, Step 7):
     - Page ordering / difficulty progression
     - Teaching flow requirements (introduction, core_explanation, practice_hint, reflection_prompt)
     - Prerequisites, concepts_introduced, bridge_from_previous
     - Common misconceptions, real-world applications
     - Difficulty level per page
     - Concept map and learning path at lesson level
   - Update JSON example to include all new fields (pedagogical + new block types)
   - Strengthen check question instructions (Plan 5, Step 7):
     - 2-4 questions per page (was 1-2)
     - New types: ordering, fill_in_blank, matching
     - Bloom's level required
     - Type and level variety per page
     - Difficulty progression

2. **Update `CHUNK_PAGES_PROMPT`** (Plans 1, 2, 3, 4 merged):
   - Add `{previousContext}` and `{sectionTitles}` placeholders (Plan 4, Step 4)
   - Replace fixed page target with dynamic guidance (Plan 1, Step 6)
   - Add condensed block type reference (Plan 2, Step 5)
   - Add pedagogical fields: teaching_flow, difficulty_level, bridge_from_previous, concepts_introduced (Plan 3, Step 8)
   - Update JSON example

3. **Update `FINAL_QUIZ_PROMPT`** (Plans 3, 5 merged):
   - Add Bloom's taxonomy distribution (Plan 5, Step 8)
   - Dynamic question count via `{quizQuestionCount}` placeholder
   - Add new question types: ordering, matching
   - Add scenario-based question requirement
   - Require bloom_level on every question
   - Add concept_map and learning_path generation for chunked mode (Plan 3, Step 9)
   - Difficulty distribution: 30% easy, 40% medium, 30% hard

---

### Task #11: Analyze Route Transformation Updates

**Files modified:** `src/app/api/analyze/route.ts`

This task depends on Tasks #8, #9, and #10.

**Changes:**

1. **Expand `normalizeBlockType()`** (Plan 2, Step 3):
   - Add 10 new canonical types + 20+ aliases
   - Update return type to use expanded `ContentBlock['type']`

2. **Update page mapping** (Plans 3+5 merged, Steps 10+13):
   - Map pedagogical fields from Gemini response to LessonPage:
     - `teachingFlow` (snake_case -> camelCase conversion)
     - `prerequisites`, `conceptsIntroduced`, `difficultyLevel`
     - `bridgeFromPrevious`, `commonMisconceptions`, `realWorldApplications`
   - Map new quiz fields:
     - `bloomLevel` from `bloom_level`
     - `metadata` passthrough

3. **Update check question mapping** (Plan 5, Step 13):
   - Accept expanded question types
   - Map `bloom_level` -> `bloomLevel`
   - Map `metadata`

4. **Update final quiz question mapping** (Plan 5, Step 13):
   - Same expanded types and bloom level mapping

5. **Update lesson object** (Plan 3, Step 10):
   - Map `concept_map` -> `conceptMap`
   - Map `learning_path` -> `learningPath`

---

### Task #12: Student Lesson Page Rendering for New Block Types

**Files modified:** `src/app/student/lesson/[id]/page.tsx`

This task depends on Tasks #8 and #11.

**Changes:**

1. **Add 10 new content block renderers** (Plan 2, Step 6):
   - `table`: Structured table with headers/rows from metadata, fallback to markdown
   - `list`: Rendered via ReactMarkdown
   - `example`: Blue-themed card with title from metadata
   - `analogy`: Teal-themed card with "Analogy" label
   - `step_by_step`: Indigo card with ordered steps from metadata, fallback to markdown
   - `diagram_description`: Gray dashed card with monospace text
   - `definition`: Violet card with bold term from metadata
   - `warning`: Red left-border card with "Warning" label
   - `tip`: Green left-border card with "Tip" label
   - `quote`: Blockquote with attribution from metadata

2. **Add pedagogical UI elements** (Plan 3, Step 12):
   - Bridge text banner at top of each page (after page 1)
   - Difficulty level badge near page title
   - Reflection prompt card before check questions
   - Common misconceptions section (orange-themed)
   - Real-world applications section (green-themed)

3. **Add new quiz question renderers** (Plan 5, Step 11):
   - `OrderingQuestion` component: drag-to-reorder interface
   - `fill_in_blank` renderer: inline text input in question text
   - `MatchingQuestion` component: term-definition dropdown matching

---

## Dependency Graph

```
Task #8  (Types & Schema)
  |
  +---> Task #9  (Gemini Config & Chunking)
  |       |
  |       +---> Task #10 (Prompt Engineering)
  |       |       |
  |       |       +---> Task #11 (Analyze Route)
  |       |               |
  |       +---------------+
  |                       |
  +---> Task #12 (Student Page Rendering)
                          |
                    (depends on #8, #11)
```

Execution order: **#8 -> #9 -> #10 -> #11 -> #12**

Task #12 can start after #8 is complete (for type information), but should wait for #11 to ensure the data transformation is correct.

---

## Missing Pieces Identified

1. **SQL Migration:** Plans 3 and 5 require database schema changes (new columns on `lesson_pages`, `lessons`, and `quiz_questions` tables). This should be part of Task #8 but needs explicit handling. If the team uses Supabase migrations, a migration file should be created.

2. **Quiz Grading API:** Plan 5 Step 12 mentions updating quiz grading for new question types (ordering, fill_in_blank, matching). The grading route file was not included in the plan scope. This needs to be identified and updated. Task #12 or a separate task should handle this.

3. **`src/lib/supabase/db.ts`:** Plans 3 and 5 require updates to `saveLessonPages()`, `assembleLesson()`, `saveLesson()`, and `mapQuizQuestion()`. These changes should be part of Task #8 (schema layer).

4. **`src/lib/supabase/types.ts`:** Plans 3 and 5 require updates to `LessonPageRow`, `LessonRow`, and `QuizQuestionRow`. Part of Task #8.

5. **Error handling for new Gemini calls:** Plan 4's `extractDocumentOutline()` makes an additional Gemini call. If it fails, the system should fall back to paragraph-based chunking (the old behavior). This fallback is described in Plan 4 but needs explicit implementation.

6. **JSON Schema enforcement (Plan 6 Step 6):** Deferred as optional. The existing `parseGeminiResponse` + `recoverTruncatedJson` approach is retained. Schema enforcement can be added later if JSON errors are frequent.

7. **Backward compatibility:** All new fields in LessonPage and Lesson are optional (`?`). Old lessons in the database will render correctly since all new UI elements use optional chaining (`?.`). No migration of existing data is needed.

---

## Risk Summary

| Risk | Plans | Severity | Mitigation |
|------|-------|----------|------------|
| Gemini ignores new block types / pedagogical fields | 2, 3 | Medium | Strong prompt instructions with examples; normalizeBlockType fallback; optional field handling |
| Token budget increase raises API costs | 1, 6 | Medium | Proportional to content quality; small docs still use ~16K tokens |
| Truncated JSON from large page counts | 1 | Medium | Dynamic token budget + existing recovery + auto-route to chunked mode for >12 pages |
| Separate quiz generation adds latency | 5 | Medium | Only in chunked mode; batched (5 pages per call); existing questions as fallback |
| Smart chunking misidentifies section boundaries | 4 | Medium | AI-based fallback for unstructured docs; paragraph-based fallback if outline extraction fails |
| New question types render poorly | 5 | Low | Progressive enhancement: fallback to mcq rendering if metadata missing |
| Schema migration breaks existing data | 3, 5 | Low | All new columns are nullable with defaults; fully backward-compatible |
| Lower temperature reduces content creativity | 6 | Low | 0.35 still allows variety; educational content benefits from consistency |

---

## Summary of Each Task's Scope

| Task | Plans Covered | Primary File(s) | Estimated Changes |
|------|--------------|-----------------|-------------------|
| **#8** | 2, 3, 5 (types only) | `src/types/index.ts`, `src/lib/supabase/types.ts`, `src/lib/supabase/db.ts`, SQL migration | ~200 lines added/changed |
| **#9** | 1, 4, 6 | `src/lib/ai/gemini.ts` (functions, config, chunking) | ~400 lines added/changed |
| **#10** | 1, 2, 3, 5 | `src/lib/ai/gemini.ts` (prompt strings only) | ~250 lines of prompt text |
| **#11** | 2, 3, 5 | `src/app/api/analyze/route.ts` | ~80 lines added/changed |
| **#12** | 2, 3, 5 | `src/app/student/lesson/[id]/page.tsx` | ~350 lines added |
