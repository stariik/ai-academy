# Plan 5: Better Quiz Quality and Variety

## Goal
Improve quiz generation quality by adding new question types, Bloom's taxonomy alignment, difficulty progression, a separate quiz generation pass, and richer final assessments.

---

## Current State

### Types (`src/types/index.ts`, lines 14-25)
```ts
export type QuizQuestion = {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  pageId?: string;
  scope?: 'check' | 'final';
};
```

### Quiz generation
- Check questions: generated inline with page content in `ANALYSIS_PROMPT` / `CHUNK_PAGES_PROMPT`
- Final quiz: generated from page summaries in `FINAL_QUIZ_PROMPT` (300-char previews)
- Check questions: 1-2 per page, mcq/true_false only
- Final quiz: 5-8 questions, mcq/true_false/short_answer

### Student page rendering (`src/app/student/lesson/[id]/page.tsx`, lines 783-900)
- Only renders `mcq` (radio buttons) and `true_false` (two buttons)
- No rendering for short_answer in check questions (only in final quiz)

---

## New Question Types

| Type | Description | Data Format |
|------|-------------|-------------|
| `ordering` | Put steps/items in correct order | `options: string[]` (items to order), `correctAnswer: string` (comma-separated correct order) |
| `fill_in_blank` | Complete a sentence with missing word(s) | `question` contains `___` placeholder, `correctAnswer` is the expected word(s) |
| `matching` | Match terms to definitions | `options: string[]` (terms), `metadata.matches: Record<string, string>` (term -> definition pairs), `correctAnswer: string` (JSON of correct mapping) |

---

## Implementation Plan

### Step 1: Expand `QuizQuestion.type` union

**File:** `src/types/index.ts`, line 15

Change:
```ts
type: 'mcq' | 'true_false' | 'short_answer';
```
To:
```ts
type: 'mcq' | 'true_false' | 'short_answer' | 'ordering' | 'fill_in_blank' | 'matching';
```

### Step 2: Add Bloom's taxonomy level to `QuizQuestion`

**File:** `src/types/index.ts`

Add a new optional field:

```ts
export type QuizQuestion = {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'ordering' | 'fill_in_blank' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  pageId?: string;
  scope?: 'check' | 'final';
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  metadata?: Record<string, unknown>;
};
```

### Step 3: Update `GeminiPagedLessonResponse` check question type

**File:** `src/types/index.ts`, lines 124-132

Change the `check_questions` type in the Gemini response to accept new question types:

```ts
check_questions: {
  question: string;
  type: 'mcq' | 'true_false' | 'ordering' | 'fill_in_blank' | 'matching';
  options?: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  bloom_level?: string;
  metadata?: Record<string, unknown>;
}[];
```

### Step 4: Update `QuizQuestionRow` for Supabase

**File:** `src/lib/supabase/types.ts`, lines 34-46

Add the new fields:

```ts
export type QuizQuestionRow = {
  id: string;
  lesson_id: string;
  page_id: string | null;
  type: 'mcq' | 'true_false' | 'short_answer' | 'ordering' | 'fill_in_blank' | 'matching';
  question: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  scope: 'check' | 'final';
  bloom_level: string | null;
  metadata: Record<string, unknown> | null;
};
```

**SQL migration:**
```sql
ALTER TABLE quiz_questions ADD COLUMN bloom_level text DEFAULT NULL;
ALTER TABLE quiz_questions ADD COLUMN metadata jsonb DEFAULT NULL;
-- Expand the type check constraint if one exists
```

### Step 5: Update `mapQuizQuestion` in db.ts

**File:** `src/lib/supabase/db.ts`, lines 36-49

```ts
function mapQuizQuestion(qq: QuizQuestionRow): QuizQuestion {
  return {
    id: qq.id,
    type: qq.type,
    question: qq.question,
    options: qq.options ?? undefined,
    correctAnswer: qq.correct_answer,
    explanation: qq.explanation,
    difficulty: qq.difficulty,
    points: qq.points,
    pageId: qq.page_id ?? undefined,
    scope: qq.scope,
    bloomLevel: qq.bloom_level as QuizQuestion['bloomLevel'] ?? undefined,
    metadata: qq.metadata ?? undefined,
  };
}
```

Also update the quiz question insert in `saveLesson` and `saveLessonPages` to include the new fields:

```ts
// In saveLessonPages (line 625-639)
const questions = page.checkQuestions.map((qq) => ({
  id: qq.id,
  lesson_id: lessonId,
  page_id: page.id,
  type: qq.type,
  question: qq.question,
  options: qq.options ?? null,
  correct_answer: qq.correctAnswer,
  explanation: qq.explanation,
  difficulty: qq.difficulty,
  points: qq.points,
  scope: 'check',
  bloom_level: qq.bloomLevel ?? null,
  metadata: qq.metadata ?? null,
}));
```

### Step 6: Separate check question generation into its own prompt

**File:** `src/lib/ai/gemini.ts`

Currently, check questions are generated in the same prompt as page content. This causes them to compete for tokens and results in low-quality questions. Separate them.

**New approach for single-call mode:**
Keep check questions in the main `ANALYSIS_PROMPT` but add much stronger guidance (Step 7). The token budget increase from Plan 1 gives enough room.

**New approach for chunked mode:**
After generating pages from a chunk, make a second call per chunk to generate check questions for those pages. This gives the quiz generator full focus.

Add a new prompt:

```ts
const CHECK_QUESTIONS_PROMPT = `You are an expert assessment designer. Generate check questions for the following lesson pages.

TARGET LEVEL: {targetLevel}

BLOOM'S TAXONOMY - Use a MIX of cognitive levels:
- REMEMBER: Recall facts, terms, definitions ("What is...?", "Which of the following is...?")
- UNDERSTAND: Explain concepts ("Why does...?", "What is the purpose of...?")
- APPLY: Use in a new context ("How would you use...?", "What would happen if...?")
- ANALYZE: Compare, contrast, break down ("How does X differ from Y?", "What is the relationship between...?")

QUESTION TYPES AVAILABLE:
- "mcq": Multiple choice with 4 options. One correct, three plausible distractors.
  CRITICAL: Distractors must be PLAUSIBLE (common misconceptions or related concepts), not obviously wrong.
- "true_false": True or false statement. The statement must be specific enough to be unambiguous.
- "ordering": Put items in the correct sequence. options = items in random order, correct_answer = items in correct order as comma-separated string.
- "fill_in_blank": Sentence with ___ blank(s). correct_answer = the expected word(s).
- "matching": Match terms to definitions. options = terms, metadata.matches = {"term": "definition"} for all pairs, correct_answer = JSON of {"term": "definition"} mapping.

For each page, generate {questionsPerPage} questions.

RULES:
- Questions MUST be answerable from the page content alone
- Each question must specify "bloom_level" (remember, understand, apply, or analyze)
- Use at least 2 different question types per page
- Use at least 2 different Bloom's levels per page
- Difficulty should match page position: earlier pages = easier, later pages = harder
- For mcq: all 4 options must be plausible. Never use "all of the above" or "none of the above"
- For ordering: provide 3-6 items
- For matching: provide 3-5 pairs
- For fill_in_blank: the blank should test a KEY term or concept, not a trivial word

PAGES:
{pagesContent}

Respond with JSON:
{
  "page_questions": [
    {
      "page_number": 1,
      "questions": [
        {
          "question": "...",
          "type": "mcq",
          "options": ["A", "B", "C", "D"],
          "correct_answer": "A",
          "explanation": "...",
          "difficulty": "easy",
          "points": 5,
          "bloom_level": "remember"
        }
      ]
    }
  ]
}

Respond ONLY with the JSON object.`;
```

### Step 7: Update `ANALYSIS_PROMPT` check question instructions

**File:** `src/lib/ai/gemini.ts`

For the single-call path, strengthen the check question instructions in `ANALYSIS_PROMPT`:

Replace the current check question rules (around lines 46-47):
```
- Check questions MUST be mcq or true_false only (quick verification, not deep assessment).
- Check questions test understanding of THAT page's content only.
```

With:
```
- Each page gets 2-4 check questions testing THAT page's content only.
- Check question types: mcq, true_false, ordering, fill_in_blank, or matching.
- Each question MUST include "bloom_level": one of "remember", "understand", "apply", "analyze".
- Use at least 2 different question types per page.
- For mcq: provide exactly 4 plausible options (distractors should be common misconceptions).
- For ordering: provide 3-6 items as options; correct_answer is comma-separated correct order.
- For fill_in_blank: use ___ in the question for the blank; correct_answer is the expected word(s).
- For matching: provide terms as options; include metadata.matches with {"term": "definition"} pairs.
- Difficulty progression: early pages get "easy" questions, later pages get "medium" or "hard".
```

### Step 8: Enhance final quiz generation

**File:** `src/lib/ai/gemini.ts`

Update `FINAL_QUIZ_PROMPT` (lines 200-255):

```ts
const FINAL_QUIZ_PROMPT = `You are an expert assessment designer. Generate a comprehensive final quiz for this lesson.

TARGET LEVEL: {targetLevel}
TOTAL PAGES: {totalPages}

LESSON PAGES OVERVIEW:
{pagesOverview}

BLOOM'S TAXONOMY DISTRIBUTION for the final quiz:
- 20% REMEMBER: Recall key terms and facts
- 25% UNDERSTAND: Explain concepts and relationships
- 25% APPLY: Use knowledge in new contexts or scenarios
- 15% ANALYZE: Compare, contrast, or break down complex topics
- 10% EVALUATE: Judge the merits of different approaches
- 5% CREATE: Synthesize multiple concepts into a new idea

REQUIREMENTS:
- Generate {quizQuestionCount} questions (at least 1 per page covered)
- Mix of question types: mcq, true_false, short_answer, ordering, matching
- Include at least 2 scenario-based questions that require applying multiple concepts
- Questions must span ALL pages -- do not cluster questions from one section
- Difficulty distribution: 30% easy, 40% medium, 30% hard
- Each question MUST specify "bloom_level"
- For short_answer: the expected answer should be 1-3 sentences, not a single word
- For mcq: distractors must be plausible (common misconceptions or related concepts)

Generate a JSON object with:
{
  "title": "Engaging lesson title",
  "description": "2-3 sentence description",
  "learning_objectives": ["..."],
  "summary": "3-5 sentence comprehensive summary",
  "difficulty": "beginner | intermediate | advanced",
  "estimated_duration_minutes": 30,
  "final_quiz_questions": [
    {
      "question": "...",
      "type": "mcq",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Detailed explanation referencing the lesson material",
      "difficulty": "medium",
      "points": 10,
      "bloom_level": "apply",
      "page_reference": 3
    }
  ]
}

RULES:
- Generate exactly {quizQuestionCount} final_quiz_questions
- Mix all question types
- For mcq: exactly 4 options. For true_false: ["True", "False"]. For short_answer/fill_in_blank: no options
- For ordering: options = items in random order, correct_answer = comma-separated correct order
- For matching: options = terms, include metadata.matches, correct_answer = JSON mapping
- difficulty must be "beginner", "intermediate", or "advanced"
- bloom_level must be one of: remember, understand, apply, analyze, evaluate, create

Respond ONLY with the JSON object.`;
```

### Step 9: Dynamic final quiz question count

**File:** `src/lib/ai/gemini.ts`, `generateFinalQuizAndMeta()`

Calculate the question count based on page count:

```ts
// In generateFinalQuizAndMeta:
const quizQuestionCount = Math.max(8, Math.min(15, Math.ceil(pages.length * 1.5)));
```

Then replace `{quizQuestionCount}` in the prompt.

### Step 10: Add separate check question generation for chunked mode

**File:** `src/lib/ai/gemini.ts`

Add a new function:

```ts
async function generateCheckQuestionsForPages(
  pages: GeminiPagedLessonResponse['pages'],
  targetLevel: string,
  questionsPerPage: number = 3
): Promise<Map<number, GeminiPagedLessonResponse['pages'][0]['check_questions']>> {
  // Build compact page content for the prompt
  const pagesContent = pages.map(p => {
    const content = p.content_blocks
      .map(b => `[${b.type}] ${b.content}`)
      .join('\n');
    const concepts = p.key_concepts.map(c => `${c.term}: ${c.definition}`).join('; ');
    return `--- Page ${p.page_number}: "${p.title}" ---\nKey concepts: ${concepts}\n${content}`;
  }).join('\n\n');

  const prompt = CHECK_QUESTIONS_PROMPT
    .replace('{targetLevel}', targetLevel)
    .replace('{questionsPerPage}', String(questionsPerPage))
    .replace('{pagesContent}', pagesContent);

  const responseText = await callGeminiWithRetry(prompt, 3, 'Gemini-CheckQuestions');
  const parsed = parseGeminiResponse(responseText);

  const questionsMap = new Map<number, typeof pages[0]['check_questions']>();
  for (const pageQ of parsed.page_questions || []) {
    questionsMap.set(pageQ.page_number, pageQ.questions);
  }

  return questionsMap;
}
```

Then in `analyzeDocumentChunked()`, after all pages are generated, run the check question generation pass:

```ts
// After generating all pages in chunked mode:
console.log(`[Gemini] Generating check questions for ${allPages.length} pages...`);

// Process in batches of ~5 pages to stay within token limits
const PAGES_PER_QUIZ_BATCH = 5;
for (let i = 0; i < allPages.length; i += PAGES_PER_QUIZ_BATCH) {
  const batch = allPages.slice(i, i + PAGES_PER_QUIZ_BATCH);
  try {
    const questionsMap = await generateCheckQuestionsForPages(
      batch, options.targetLevel, 3
    );
    for (const page of batch) {
      const newQuestions = questionsMap.get(page.page_number);
      if (newQuestions && newQuestions.length > 0) {
        page.check_questions = newQuestions;
      }
    }
  } catch (error) {
    console.error(`[Gemini] Check question generation failed for pages ${i+1}-${i+batch.length}:`, error);
    // Keep existing check questions (from chunk generation) as fallback
  }
  await sleep(500);
}
```

### Step 11: Render new question types in the student page

**File:** `src/app/student/lesson/[id]/page.tsx`

In the `CheckQuestions` component (lines 798-897), add rendering for the new types. After the existing `true_false` block:

**Ordering question renderer:**
```tsx
{q.type === 'ordering' && q.options && (
  <OrderingQuestion
    questionId={q.id}
    options={q.options}
    submitted={submitted}
    result={result}
    currentAnswer={answers[q.id]}
    onAnswer={(answer) =>
      !submitted && setAnswers((prev) => ({ ...prev, [q.id]: answer }))
    }
  />
)}
```

Add a new component:

```tsx
function OrderingQuestion({
  questionId,
  options,
  submitted,
  result,
  currentAnswer,
  onAnswer,
}: {
  questionId: string;
  options: string[];
  submitted: boolean;
  result?: { isCorrect: boolean; correctAnswer: string; explanation: string } | null;
  currentAnswer?: string;
  onAnswer: (answer: string) => void;
}) {
  const [items, setItems] = useState<string[]>(options);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Update answer whenever items order changes
  useEffect(() => {
    onAnswer(items.join(', '));
  }, [items, onAnswer]);

  const handleDragStart = (index: number) => {
    if (submitted) return;
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index || submitted) return;
    const newItems = [...items];
    const [dragged] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, dragged);
    setItems(newItems);
    setDragIndex(index);
  };

  const handleDragEnd = () => setDragIndex(null);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-2">Drag items into the correct order:</p>
      {items.map((item, i) => (
        <div
          key={`${questionId}-${item}`}
          draggable={!submitted}
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-3 rounded-lg border p-3 cursor-grab transition
            ${dragIndex === i ? 'border-blue-400 bg-blue-50 opacity-70' : 'border-gray-200'}
            ${submitted ? 'cursor-default' : 'hover:bg-gray-50'}`}
        >
          <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
          <span className="text-sm text-gray-700">{item}</span>
        </div>
      ))}
    </div>
  );
}
```

**Fill-in-the-blank renderer:**
```tsx
{q.type === 'fill_in_blank' && (
  <div className="space-y-2">
    <div className="text-sm text-gray-700 leading-relaxed">
      {q.question.split('___').map((part, i, arr) => (
        <span key={i}>
          {part}
          {i < arr.length - 1 && (
            <input
              type="text"
              value={answers[q.id] || ''}
              onChange={(e) =>
                !submitted &&
                setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
              disabled={submitted}
              className={`inline-block w-32 border-b-2 mx-1 px-1 py-0.5 text-center
                ${submitted
                  ? result?.isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-blue-300 focus:border-blue-500'
                } outline-none text-sm`}
              placeholder="..."
            />
          )}
        </span>
      ))}
    </div>
  </div>
)}
```

**Matching question renderer:**
```tsx
{q.type === 'matching' && q.options && q.metadata?.matches && (
  <MatchingQuestion
    questionId={q.id}
    terms={q.options}
    definitions={Object.values(q.metadata.matches as Record<string, string>)}
    submitted={submitted}
    result={result}
    onAnswer={(answer) =>
      !submitted && setAnswers((prev) => ({ ...prev, [q.id]: answer }))
    }
  />
)}
```

Add `MatchingQuestion` component:

```tsx
function MatchingQuestion({
  questionId,
  terms,
  definitions,
  submitted,
  result,
  onAnswer,
}: {
  questionId: string;
  terms: string[];
  definitions: string[];
  submitted: boolean;
  result?: { isCorrect: boolean } | null;
  onAnswer: (answer: string) => void;
}) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const shuffledDefs = useMemo(
    () => [...definitions].sort(() => Math.random() - 0.5),
    [definitions]
  );

  const handleMatch = (term: string, definition: string) => {
    if (submitted) return;
    const newMatches = { ...matches, [term]: definition };
    setMatches(newMatches);
    onAnswer(JSON.stringify(newMatches));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Match each term with its definition:</p>
      {terms.map((term) => (
        <div key={term} className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-800 w-1/3">{term}</span>
          <select
            value={matches[term] || ''}
            onChange={(e) => handleMatch(term, e.target.value)}
            disabled={submitted}
            className="flex-1 border border-gray-200 rounded-lg p-2 text-sm"
          >
            <option value="">Select...</option>
            {shuffledDefs.map((def) => (
              <option key={def} value={def}>{def}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
```

### Step 12: Update quiz check API for new types

**File:** `src/app/api/quiz/check-page/route.ts` (or wherever quiz grading happens)

Add grading logic for new types:

- **ordering**: Compare the submitted comma-separated order to `correctAnswer`. Grade as correct if the order matches exactly.
- **fill_in_blank**: Case-insensitive comparison. Accept minor spelling variations (Levenshtein distance <= 1).
- **matching**: Parse both JSON strings and compare key-value pairs. Grade as correct if all pairs match.

### Step 13: Update the analyze route transformation

**File:** `src/app/api/analyze/route.ts`, lines 132-143

Update the check question mapping to handle new fields:

```ts
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
```

Similarly for final quiz questions (lines 157-169).

---

## Before / After Summary

| Aspect | Before | After |
|--------|--------|-------|
| Check question types | mcq, true_false | mcq, true_false, ordering, fill_in_blank, matching |
| Check questions per page | 1-2 | 2-4 |
| Final quiz questions | 5-8 | 8-15 (scales with pages) |
| Bloom's taxonomy | Not tracked | Explicit level on every question |
| Question quality guidance | Minimal | Detailed distractor rules, bloom distribution, variety requirements |
| Quiz generation | Inline with content | Separate pass for chunked mode |
| Difficulty progression | None | Early pages easier, later pages harder |
| Final quiz coverage | Random | At least 1 question per page |
| Question metadata | None | Bloom level, page reference, matching metadata |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Gemini generates low-quality distractors for mcq | Medium | Explicit prompt instructions for plausible distractors; existing fallback to simpler question types |
| Ordering/matching question rendering is complex | Medium | Progressive enhancement: if metadata is missing, fall back to mcq rendering |
| Separate quiz generation adds API calls + latency | Medium | Only for chunked mode; single-call mode keeps questions inline. Batched processing (5 pages per call) |
| Fill-in-blank grading is fragile (spelling) | Low | Case-insensitive + Levenshtein tolerance; explanation always shown |
| Matching JSON comparison is strict | Low | Normalize whitespace + case before comparing |
| Old lessons with only mcq/true_false still render fine | None | New types are additive; old renderers unchanged |

---

## Dependencies

- **Plan 1 (Dynamic Page Count)** -- More pages means more check questions and a larger final quiz. The token budget must account for this.
- **Plan 2 (Richer Content Blocks)** -- Quiz questions can reference specific content block types (e.g., "Referring to the example on this page...").
- **Plan 3 (Pedagogical Structure)** -- `concepts_introduced` per page can be used to ensure quiz coverage. The `bloom_level` aligns with the pedagogical progression.
- **Plan 4 (Smart Chunking)** -- The separate check question generation pass (Step 10) happens after chunked page generation. Better chunks = better quiz context.

---

## Files Modified

1. **`src/types/index.ts`** -- Expanded `QuizQuestion` type (new types, bloomLevel, metadata)
2. **`src/lib/supabase/types.ts`** -- Updated `QuizQuestionRow` with new columns
3. **`src/lib/ai/gemini.ts`** -- New `CHECK_QUESTIONS_PROMPT`, updated `ANALYSIS_PROMPT` quiz instructions, updated `FINAL_QUIZ_PROMPT`, new `generateCheckQuestionsForPages()` function
4. **`src/app/api/analyze/route.ts`** -- Updated quiz question transformation with new fields
5. **`src/lib/supabase/db.ts`** -- Updated `mapQuizQuestion()`, quiz insert logic
6. **`src/app/student/lesson/[id]/page.tsx`** -- New `OrderingQuestion` and `MatchingQuestion` components, fill_in_blank renderer
7. **Quiz grading API** -- New grading logic for ordering, fill_in_blank, matching
8. **SQL migration** -- New columns on `quiz_questions` table
