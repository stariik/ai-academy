# Plan 3: Better Pedagogical Structure

## Goal
Transform the lesson generation from a flat "split by topic" approach into a pedagogically structured teaching flow with prerequisite tracking, concept bridging, difficulty progression, and metacognitive prompts.

---

## Current State

### Page structure (`src/types/index.ts`, lines 27-35)
```ts
export type LessonPage = {
  id: string;
  lessonId: string;
  pageNumber: number;
  title: string;
  keyConcepts: { term: string; definition: string }[];
  contentBlocks: ContentBlock[];
  checkQuestions: QuizQuestion[];
};
```

No pedagogical metadata. No prerequisites. No teaching flow. No concept dependencies.

### Prompt (`src/lib/ai/gemini.ts`, line 44)
```
- Each page covers ONE coherent topic or subtopic that can be taught and assessed independently.
```
No guidance on ordering, scaffolding, or inter-page connections.

---

## Implementation Plan

### Step 1: Add pedagogical metadata types

**File:** `src/types/index.ts`

Add new types before the `LessonPage` type:

```ts
export type TeachingFlow = {
  introduction: string;    // Bridge from previous + hook for this page
  coreExplanation: string; // Main concept/topic label for this page
  practiceHint: string;    // What students should try/think about
  reflectionPrompt: string; // Metacognitive question at end of page
};

export type ConceptNode = {
  conceptId: string;       // e.g., "variables", "loops", "recursion"
  label: string;           // Human-readable name
  prerequisiteIds: string[]; // Concepts that must be understood first
};
```

### Step 2: Extend `LessonPage` type

**File:** `src/types/index.ts`, lines 27-35

Add new optional fields to `LessonPage`:

```ts
export type LessonPage = {
  id: string;
  lessonId: string;
  pageNumber: number;
  title: string;
  keyConcepts: { term: string; definition: string }[];
  contentBlocks: ContentBlock[];
  checkQuestions: QuizQuestion[];
  // New pedagogical fields
  teachingFlow?: TeachingFlow;
  prerequisites?: string[];          // conceptIds from previous pages needed here
  conceptsIntroduced?: string[];     // conceptIds first introduced on this page
  difficultyLevel?: 'foundational' | 'intermediate' | 'advanced' | 'synthesis';
  bridgeFromPrevious?: string;       // Short text connecting to previous page
  commonMisconceptions?: string[];   // Misconceptions relevant to this page's topic
  realWorldApplications?: string[];  // Practical applications of this page's concepts
};
```

### Step 3: Add `LearningPath` to `Lesson` type

**File:** `src/types/index.ts`, lines 37-56

Add to the `Lesson` type:

```ts
export type Lesson = {
  // ... existing fields ...
  pages?: LessonPage[];
  totalPages?: number;
  // New pedagogical fields
  conceptMap?: ConceptNode[];        // DAG of concept dependencies across the lesson
  learningPath?: string[];           // Ordered list of conceptIds showing learning progression
};
```

### Step 4: Update `GeminiPagedLessonResponse` type

**File:** `src/types/index.ts`, lines 111-146

Add the new fields to the Gemini response type so the AI output can include them:

```ts
export type GeminiPagedLessonResponse = {
  // ... existing fields ...
  pages: {
    page_number: number;
    title: string;
    content_blocks: { type: string; content: string; metadata?: Record<string, unknown> }[];
    key_concepts: { term: string; definition: string }[];
    check_questions: { /* existing */ }[];
    // New pedagogical fields from Gemini
    teaching_flow?: {
      introduction: string;
      core_explanation: string;
      practice_hint: string;
      reflection_prompt: string;
    };
    prerequisites?: string[];
    concepts_introduced?: string[];
    difficulty_level?: string;
    bridge_from_previous?: string;
    common_misconceptions?: string[];
    real_world_applications?: string[];
  }[];
  // New lesson-level fields
  concept_map?: { concept_id: string; label: string; prerequisite_ids: string[] }[];
  learning_path?: string[];
};
```

### Step 5: Update `LessonPageRow` and `saveLessonPages`

**File:** `src/lib/supabase/types.ts`, lines 48-55

Add new columns to match:

```ts
export type LessonPageRow = {
  id: string;
  lesson_id: string;
  page_number: number;
  title: string;
  key_concepts: { term: string; definition: string }[];
  teaching_flow: Record<string, string> | null;
  prerequisites: string[] | null;
  concepts_introduced: string[] | null;
  difficulty_level: string | null;
  bridge_from_previous: string | null;
  common_misconceptions: string[] | null;
  real_world_applications: string[] | null;
  created_at: string;
};
```

**File:** `src/lib/supabase/db.ts`, `saveLessonPages()` (line 597-603)

Update the page row mapping:

```ts
const pageRows = pages.map((p) => ({
  id: p.id,
  lesson_id: lessonId,
  page_number: p.pageNumber,
  title: p.title,
  key_concepts: p.keyConcepts,
  teaching_flow: p.teachingFlow ?? null,
  prerequisites: p.prerequisites ?? null,
  concepts_introduced: p.conceptsIntroduced ?? null,
  difficulty_level: p.difficultyLevel ?? null,
  bridge_from_previous: p.bridgeFromPrevious ?? null,
  common_misconceptions: p.commonMisconceptions ?? null,
  real_world_applications: p.realWorldApplications ?? null,
}));
```

**File:** `src/lib/supabase/db.ts`, `assembleLesson()` (lines 84-97)

Update the page assembly mapping:

```ts
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
    // New fields
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
```

### Step 6: Add Supabase migration for new columns

A SQL migration is needed:

```sql
ALTER TABLE lesson_pages ADD COLUMN teaching_flow jsonb DEFAULT NULL;
ALTER TABLE lesson_pages ADD COLUMN prerequisites text[] DEFAULT NULL;
ALTER TABLE lesson_pages ADD COLUMN concepts_introduced text[] DEFAULT NULL;
ALTER TABLE lesson_pages ADD COLUMN difficulty_level text DEFAULT NULL;
ALTER TABLE lesson_pages ADD COLUMN bridge_from_previous text DEFAULT NULL;
ALTER TABLE lesson_pages ADD COLUMN common_misconceptions text[] DEFAULT NULL;
ALTER TABLE lesson_pages ADD COLUMN real_world_applications text[] DEFAULT NULL;

-- Lesson-level concept map stored in lessons table
ALTER TABLE lessons ADD COLUMN concept_map jsonb DEFAULT NULL;
ALTER TABLE lessons ADD COLUMN learning_path text[] DEFAULT NULL;
```

### Step 7: Update `ANALYSIS_PROMPT` for pedagogical structure

**File:** `src/lib/ai/gemini.ts`

Add a new section to the ANALYSIS_PROMPT (after the existing instructions, before RULES):

```
PEDAGOGICAL STRUCTURE REQUIREMENTS:

1. PAGE ORDERING - Structure pages with deliberate difficulty progression:
   - Page 1: Always "foundational" - introduce the topic, set context, define basic terms
   - Middle pages: Progress from "intermediate" to "advanced" concepts
   - Final page(s): "synthesis" - connect concepts together, show big picture

2. TEACHING FLOW - Each page MUST include a "teaching_flow" object:
   - "introduction": 1-2 sentences that hook the student and connect to what they learned on the previous page. For page 1, introduce the overall topic.
   - "core_explanation": A label for the main concept taught on this page (e.g., "Understanding Variables")
   - "practice_hint": A suggestion for what the student should try or think about (e.g., "Try to identify three variables in the code example above")
   - "reflection_prompt": A metacognitive question at the end (e.g., "How would you explain this concept to a friend?")

3. PREREQUISITES - Each page should declare "prerequisites": an array of concept_ids from previous pages that a student needs to understand before this page makes sense. Page 1 has no prerequisites.

4. CONCEPTS INTRODUCED - Each page should declare "concepts_introduced": an array of concept_ids that are first taught on this page. These should be short lowercase identifiers (e.g., "variables", "for_loops", "recursion").

5. BRIDGE FROM PREVIOUS - Each page (except page 1) MUST include "bridge_from_previous": a 1-2 sentence transition that references what was just learned and previews what comes next. Example: "Now that you understand how variables store data, let's look at how to make decisions based on that data using conditionals."

6. COMMON MISCONCEPTIONS - Include "common_misconceptions" (array of strings) where relevant. These are typical misunderstandings students have about this page's topic. Example: ["Variables are not the same as mathematical variables - they can change value", "Assignment (=) is not the same as equality (==)"]

7. REAL-WORLD APPLICATIONS - Include "real_world_applications" (array of strings) connecting the theory to practical use. Example: ["E-commerce sites use conditionals to show different prices based on user location"]

8. DIFFICULTY LEVEL - Each page MUST include "difficulty_level": one of "foundational", "intermediate", "advanced", "synthesis"

9. CONCEPT MAP - At the lesson level, include a "concept_map" array showing how concepts relate:
   [{"concept_id": "variables", "label": "Variables", "prerequisite_ids": []},
    {"concept_id": "conditionals", "label": "Conditionals", "prerequisite_ids": ["variables"]},
    {"concept_id": "loops", "label": "Loops", "prerequisite_ids": ["variables", "conditionals"]}]

10. LEARNING PATH - Include a "learning_path" array listing concept_ids in the order they should be learned: ["variables", "conditionals", "loops"]
```

Update the JSON example structure in the prompt to include these new fields in the page object and at the lesson level.

### Step 8: Update `CHUNK_PAGES_PROMPT` similarly

**File:** `src/lib/ai/gemini.ts`

Add pedagogical fields to the chunk prompt. Since chunks don't have full lesson context, simplify:
- Include `teaching_flow`, `difficulty_level`, `bridge_from_previous`, `concepts_introduced`
- Skip `concept_map` and `learning_path` (generated in `FINAL_QUIZ_PROMPT`)

### Step 9: Update `FINAL_QUIZ_PROMPT` to generate concept map

**File:** `src/lib/ai/gemini.ts`

Add to the final quiz/meta prompt for chunked mode:

```
In addition to the quiz, generate:
- "concept_map": an array of concept nodes showing how concepts taught across all pages relate to each other. Each node has concept_id, label, and prerequisite_ids.
- "learning_path": an ordered array of concept_ids showing the recommended learning sequence.
```

### Step 10: Update `analyzeDocument()` transformation in the analyze route

**File:** `src/app/api/analyze/route.ts`, lines 120-154

Update the page mapping (line 120) to include new fields:

```ts
const pages: LessonPage[] = geminiResponse.pages.map((page) => {
  const pageId = `${lessonId}-page-${page.page_number}`;

  // ... existing content block and question mapping ...

  return {
    id: pageId,
    lessonId,
    pageNumber: page.page_number,
    title: page.title,
    keyConcepts: page.key_concepts || [],
    contentBlocks: pageBlocks,
    checkQuestions,
    // New pedagogical fields
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
```

Update the lesson object (line 174) to include concept map:

```ts
const lesson: Lesson = {
  // ... existing fields ...
  conceptMap: geminiResponse.concept_map?.map(n => ({
    conceptId: n.concept_id,
    label: n.label,
    prerequisiteIds: n.prerequisite_ids,
  })),
  learningPath: geminiResponse.learning_path,
};
```

### Step 11: Update `LessonRow` type

**File:** `src/lib/supabase/types.ts`

Add to `LessonRow`:
```ts
concept_map: { concept_id: string; label: string; prerequisite_ids: string[] }[] | null;
learning_path: string[] | null;
```

Update `saveLesson` in db.ts to include these fields.

### Step 12: Render pedagogical elements on the student page

**File:** `src/app/student/lesson/[id]/page.tsx`

Add rendering for the new pedagogical metadata on each page. These are additions to the existing page content area:

1. **Bridge text** -- Render `bridgeFromPrevious` as a subtle connection banner at the top of each page (after page 1):
```tsx
{currentPageData.bridgeFromPrevious && currentPage > 1 && (
  <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 mb-4 text-sm text-blue-800 italic">
    {currentPageData.bridgeFromPrevious}
  </div>
)}
```

2. **Difficulty badge** -- Show the page's difficulty level as a small badge near the page title:
```tsx
{currentPageData.difficultyLevel && (
  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-2">
    {currentPageData.difficultyLevel}
  </span>
)}
```

3. **Reflection prompt** -- Render at the bottom of the page content, before check questions:
```tsx
{currentPageData.teachingFlow?.reflectionPrompt && (
  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mt-6">
    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700 mb-1">
      Reflect
    </p>
    <p className="text-sm text-yellow-900 italic">
      {currentPageData.teachingFlow.reflectionPrompt}
    </p>
  </div>
)}
```

4. **Common misconceptions** -- Render as a collapsible warning section:
```tsx
{currentPageData.commonMisconceptions && currentPageData.commonMisconceptions.length > 0 && (
  <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4 mt-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-2">
      Common Misconceptions
    </p>
    <ul className="list-disc list-inside text-sm text-orange-900 space-y-1">
      {currentPageData.commonMisconceptions.map((m, i) => (
        <li key={i}>{m}</li>
      ))}
    </ul>
  </div>
)}
```

5. **Real-world applications** -- Render after main content:
```tsx
{currentPageData.realWorldApplications && currentPageData.realWorldApplications.length > 0 && (
  <div className="rounded-lg bg-green-50 border border-green-200 p-4 mt-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
      Real-World Applications
    </p>
    <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
      {currentPageData.realWorldApplications.map((app, i) => (
        <li key={i}>{app}</li>
      ))}
    </ul>
  </div>
)}
```

---

## Content Block Ordering Within a Page

The prompt should instruct Gemini to follow this teaching flow order for content blocks on each page:

1. `heading` -- Page title
2. (Bridge from previous is rendered separately, not as a content block)
3. `text` / `definition` / `analogy` -- Introduction and context
4. `text` / `example` / `code` / `table` -- Core explanation with examples
5. `step_by_step` / `diagram_description` -- Procedural or visual content
6. `tip` / `warning` -- Practical guidance
7. `summary` -- Page summary
8. (Reflection prompt rendered separately)
9. (Check questions rendered separately)

This ordering instruction goes into the prompt as a guideline, not enforced by code.

---

## Before / After Summary

| Aspect | Before | After |
|--------|--------|-------|
| Inter-page connections | None | Bridge text, prerequisites, concept map |
| Difficulty progression | Implicit | Explicit per-page difficulty levels |
| Teaching flow | None | Introduction, core, practice, reflection per page |
| Metacognition | None | Reflection prompts on every page |
| Misconception awareness | None | Common misconceptions per page |
| Real-world connection | None | Applications per page |
| Concept dependencies | None | Concept map + learning path |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Gemini ignores pedagogical fields | Medium | Make fields required in the prompt with explicit examples; validate and provide defaults in transformation |
| Token budget increase from extra fields | Medium | Plan 1's dynamic budget + these fields are compact (short strings/arrays); ~200 extra tokens per page |
| Supabase schema migration needed | Low | All new columns are nullable with defaults; fully backward-compatible |
| Concept map quality is poor | Low | Concept map is a best-effort enrichment; the lesson is useful without it. Validation can drop malformed entries |
| Bridge text is generic/repetitive | Low | Prompt instructs specific connections; tutor (Claude) can supplement dynamically |
| Old lessons without these fields render fine | Low | All new fields are optional (?.) with graceful fallbacks in the renderer |

---

## Dependencies

- **Plan 2 (Richer Content Blocks)** -- The teaching flow ordering (Step 12) assumes the new block types exist. Plan 2 should be implemented first or simultaneously.
- **Plan 1 (Dynamic Page Count)** -- The token budget needs to account for extra pedagogical metadata (~200 tokens/page). Plan 1's `~2000 tokens per page` should increase to ~2200-2500.
- **Plan 5 (Quiz Quality)** -- Check questions on each page could reference the `concepts_introduced` field for targeted assessment. Plan 5 can leverage this data.
- **No dependency on Plan 4 or Plan 6.**

---

## Files Modified

1. **`src/types/index.ts`** -- New types (`TeachingFlow`, `ConceptNode`), extended `LessonPage` and `Lesson`, extended `GeminiPagedLessonResponse`
2. **`src/lib/supabase/types.ts`** -- Extended `LessonPageRow` and `LessonRow` with new columns
3. **`src/lib/ai/gemini.ts`** -- Major prompt updates for pedagogical structure in all 3 prompts
4. **`src/app/api/analyze/route.ts`** -- Updated page/lesson transformation to map new fields
5. **`src/lib/supabase/db.ts`** -- Updated `saveLessonPages()`, `assembleLesson()`, `saveLesson()` for new fields
6. **`src/app/student/lesson/[id]/page.tsx`** -- Render bridge text, difficulty badge, reflection prompt, misconceptions, applications
7. **New SQL migration** -- Add columns to `lesson_pages` and `lessons` tables
