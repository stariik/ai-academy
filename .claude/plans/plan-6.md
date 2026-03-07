# Plan 6: Increase Token Budget and Model Optimization

## Goal
Optimize the Gemini model configuration -- token budget, temperature, schema enforcement, and model selection -- to produce deeper, more consistent, and more reliably structured lesson content.

---

## Current State

### `src/lib/ai/gemini.ts`

**`callGeminiWithRetry()`** (lines 300-308):
```ts
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 8_192,
    responseMimeType: 'application/json',
  },
});
```

**Single-call path** (lines 540-548): Same hardcoded config.

**`getPageRange()`** (lines 21-29): Always returns `outputTokens: 8192`.

### Problems
1. **8192 output tokens** is ~6K words of JSON. A 10-page lesson with rich content blocks, key concepts, and quiz questions easily exceeds this, causing truncation.
2. **Temperature 0.7** introduces variability in factual educational content. Lower temperatures produce more consistent, accurate output.
3. **topP 0.9** is overly permissive for structured JSON generation.
4. **No JSON schema enforcement**: The model can return malformed JSON or skip required fields. Gemini supports `responseSchema` for structural enforcement.
5. **One-size-fits-all config**: The same model/config is used for all tasks (content generation, outline extraction, quiz generation) when different tasks have different requirements.

---

## Implementation Plan

### Step 1: Create task-specific model configurations

**File:** `src/lib/ai/gemini.ts`

Replace the single hardcoded config with a configuration factory:

```ts
type GeminiTask =
  | 'content_generation'    // Main lesson content (single-call or chunk)
  | 'outline_extraction'    // Document structure analysis (Plan 4)
  | 'quiz_generation'       // Check questions and final quiz (Plan 5)
  | 'metadata_generation';  // Final quiz + metadata for chunked mode

interface GeminiConfig {
  model: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  responseMimeType: string;
}

function getGeminiConfig(task: GeminiTask, dynamicTokenBudget?: number): GeminiConfig {
  const configs: Record<GeminiTask, GeminiConfig> = {
    content_generation: {
      model: 'gemini-2.0-flash',
      temperature: 0.35,        // Lower for consistent, accurate content
      topP: 0.85,
      maxOutputTokens: dynamicTokenBudget ?? 16_384,
      responseMimeType: 'application/json',
    },
    outline_extraction: {
      model: 'gemini-2.0-flash',  // Could use flash-lite when available
      temperature: 0.2,           // Very low for deterministic structure analysis
      topP: 0.8,
      maxOutputTokens: 4_096,     // Outlines are small
      responseMimeType: 'application/json',
    },
    quiz_generation: {
      model: 'gemini-2.0-flash',
      temperature: 0.4,           // Slightly higher for creative distractors
      topP: 0.85,
      maxOutputTokens: dynamicTokenBudget ?? 8_192,
      responseMimeType: 'application/json',
    },
    metadata_generation: {
      model: 'gemini-2.0-flash',
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: dynamicTokenBudget ?? 8_192,
      responseMimeType: 'application/json',
    },
  };

  return configs[task];
}
```

### Step 2: Update `callGeminiWithRetry()` to accept config

**File:** `src/lib/ai/gemini.ts`, lines 293-347

Change the function signature and body:

```ts
async function callGeminiWithRetry(
  prompt: string,
  config: GeminiConfig,              // NEW: pass config instead of using hardcoded
  maxRetries: number = 3,
  label: string = 'Gemini'
): Promise<string> {
  let lastError: Error | null = null;

  const model = genAI.getGenerativeModel({
    model: config.model,
    generationConfig: {
      temperature: config.temperature,
      topP: config.topP,
      maxOutputTokens: config.maxOutputTokens,
      responseMimeType: config.responseMimeType,
    },
  });

  // ... rest of retry logic unchanged ...
}
```

### Step 3: Update all call sites to use task-specific configs

**`generatePagesFromChunk()`** (line 368):
```ts
// Before:
const responseText = await callGeminiWithRetry(prompt, 3, `Gemini-Chunk-${chunkIndex + 1}`);
// After:
const config = getGeminiConfig('content_generation', targetPages * 2500);
const responseText = await callGeminiWithRetry(prompt, config, 3, `Gemini-Chunk-${chunkIndex + 1}`);
```

**`generateFinalQuizAndMeta()`** (line 416):
```ts
// Before:
const responseText = await callGeminiWithRetry(prompt, 3, 'Gemini-FinalQuiz');
// After:
const quizTokenBudget = Math.max(4096, pages.length * 600); // ~600 tokens per quiz question
const config = getGeminiConfig('metadata_generation', quizTokenBudget);
const responseText = await callGeminiWithRetry(prompt, config, 3, 'Gemini-FinalQuiz');
```

**`extractDocumentOutline()`** (from Plan 4):
```ts
const config = getGeminiConfig('outline_extraction');
const response = await callGeminiWithRetry(prompt, config, 2, 'Gemini-Outline');
```

**`generateCheckQuestionsForPages()`** (from Plan 5):
```ts
const config = getGeminiConfig('quiz_generation', pages.length * 1500);
const responseText = await callGeminiWithRetry(prompt, config, 3, 'Gemini-CheckQuestions');
```

### Step 4: Update single-call path model config

**File:** `src/lib/ai/gemini.ts`, lines 540-548

Replace the hardcoded model creation:

```ts
// Before:
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: outputTokens,
    responseMimeType: 'application/json',
  },
});
```

```ts
// After:
const config = getGeminiConfig('content_generation', outputTokens);
const model = genAI.getGenerativeModel({
  model: config.model,
  generationConfig: {
    temperature: config.temperature,
    topP: config.topP,
    maxOutputTokens: config.maxOutputTokens,
    responseMimeType: config.responseMimeType,
  },
});
```

### Step 5: Integrate with Plan 1's dynamic token budget

Plan 1 introduces `calculateDynamicPageCount()` which returns `outputTokens` based on page count. This plan adjusts the formula:

**File:** `src/lib/ai/gemini.ts`, in `calculateDynamicPageCount()`

Update the token calculation (from Plan 1):

```ts
// Updated token formula accounting for richer content (Plan 2) and pedagogical metadata (Plan 3)
// ~2500 tokens per page for content blocks + key concepts + teaching flow
// ~500 tokens per page for check questions (Plan 5: 2-4 questions per page)
// ~1000 tokens overhead for lesson-level metadata
const tokensPerPage = 3000;
const overheadTokens = 1000;
const outputTokens = Math.min(65536, Math.max(16384, targetPages * tokensPerPage + overheadTokens));
```

Key change: minimum is now 16384 (was 8192), and per-page budget is 3000 (was 2000).

### Step 6: Add JSON schema enforcement (optional enhancement)

Gemini 2.0 Flash supports `responseSchema` for structured output validation. This would enforce the JSON shape at the model level, preventing malformed responses.

**File:** `src/lib/ai/gemini.ts`

For the content generation config, add a schema:

```ts
import { SchemaType } from '@google/generative-ai';

// Schema for the paged lesson response
const LESSON_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    learning_objectives: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    pages: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          page_number: { type: SchemaType.NUMBER },
          title: { type: SchemaType.STRING },
          content_blocks: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                type: { type: SchemaType.STRING },
                content: { type: SchemaType.STRING },
              },
              required: ['type', 'content'],
            },
          },
          key_concepts: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                term: { type: SchemaType.STRING },
                definition: { type: SchemaType.STRING },
              },
              required: ['term', 'definition'],
            },
          },
          check_questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                question: { type: SchemaType.STRING },
                type: { type: SchemaType.STRING },
                correct_answer: { type: SchemaType.STRING },
                explanation: { type: SchemaType.STRING },
                difficulty: { type: SchemaType.STRING },
                points: { type: SchemaType.NUMBER },
              },
              required: ['question', 'type', 'correct_answer', 'explanation'],
            },
          },
        },
        required: ['page_number', 'title', 'content_blocks'],
      },
    },
    summary: { type: SchemaType.STRING },
    final_quiz_questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
          correct_answer: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
          difficulty: { type: SchemaType.STRING },
          points: { type: SchemaType.NUMBER },
        },
        required: ['question', 'type', 'correct_answer', 'explanation'],
      },
    },
    difficulty: { type: SchemaType.STRING },
    estimated_duration_minutes: { type: SchemaType.NUMBER },
  },
  required: ['title', 'description', 'pages', 'summary', 'difficulty'],
};
```

Then in the model config for content generation:

```ts
const model = genAI.getGenerativeModel({
  model: config.model,
  generationConfig: {
    temperature: config.temperature,
    topP: config.topP,
    maxOutputTokens: config.maxOutputTokens,
    responseMimeType: 'application/json',
    responseSchema: LESSON_RESPONSE_SCHEMA,  // Enforce structure
  },
});
```

**Caveat:** Schema enforcement can be overly strict and may cause the model to fail on optional fields. Test thoroughly. If it causes issues, use `responseMimeType: 'application/json'` without `responseSchema` (the current approach) and rely on the existing `parseGeminiResponse` + `recoverTruncatedJson` for fault tolerance.

**Recommendation:** Start without schema enforcement. Add it as a follow-up if JSON parsing errors are frequent.

### Step 7: Lower the chunked-mode threshold

With better token budgets, single-call mode can handle more content. But conversely, chunked mode produces better quality (each chunk gets focused attention). The recommendation is:

**Keep the single-call/chunked threshold aligned with Plan 1:**
- Documents where `targetPages <= 12` and `outputTokens <= 32768`: single-call
- Everything else: chunked mode (from Plan 1, Step 4)

This effectively means:
- Small documents (2-5 pages): single call with 16K-20K output tokens
- Medium documents (6-12 pages): single call with 20K-32K output tokens
- Large documents (13+ pages): chunked mode with dynamic per-chunk budgets

### Step 8: Adjust chunk-level token budget

For chunked mode, each chunk's token budget should be:

```ts
// Per-chunk token budget for content generation
const chunkTokenBudget = Math.min(32768, Math.max(8192, chunkTarget * 3000));
```

This ensures each chunk has enough room for its pages without wasting tokens.

---

## Configuration Summary

| Task | Model | Temperature | topP | Max Output Tokens | Schema |
|------|-------|-------------|------|-------------------|--------|
| Content generation (single) | gemini-2.0-flash | 0.35 | 0.85 | 16K-65K (dynamic) | Optional |
| Content generation (chunk) | gemini-2.0-flash | 0.35 | 0.85 | 8K-32K (dynamic) | Optional |
| Outline extraction | gemini-2.0-flash | 0.2 | 0.8 | 4K (fixed) | No |
| Quiz generation | gemini-2.0-flash | 0.4 | 0.85 | 8K-16K (dynamic) | No |
| Metadata + final quiz | gemini-2.0-flash | 0.3 | 0.8 | 4K-8K (dynamic) | No |

---

## Before / After Summary

| Aspect | Before | After |
|--------|--------|-------|
| Output tokens | Always 8192 | 4K-65K, task-dependent |
| Temperature | Always 0.7 | 0.2-0.4, task-dependent |
| topP | Always 0.9 | 0.8-0.85, task-dependent |
| Model selection | Always gemini-2.0-flash | Same model, but config factory ready for model-per-task |
| Config management | Hardcoded in 3 places | Single `getGeminiConfig()` factory |
| Schema enforcement | None | Optional `responseSchema` for content generation |
| Tokens per page budget | ~800 effective (8192/10 pages) | ~3000 per page |
| Truncation frequency | High for >5 page lessons | Rare (dynamic budget + recovery) |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Higher token costs from larger output budgets | Medium | Token budget scales with content; small documents still use ~16K. Cost increase is proportional to value (better content). |
| Lower temperature reduces creativity | Low | Educational content benefits from consistency. Temperature 0.35-0.4 still allows variety in examples and analogies. |
| Schema enforcement is too rigid | Medium | Recommendation: start WITHOUT schema enforcement. Add as follow-up only if needed. |
| `gemini-2.0-flash-lite` availability | Low | Plan uses gemini-2.0-flash everywhere. Switching to lite for simple tasks is a future optimization. |
| Config factory adds indirection | Low | Small, well-typed function. Makes configs discoverable and auditable. |
| maxOutputTokens exceeds model limits | Low | Capped at 65536 (Gemini 2.0 Flash's documented limit). |

---

## Dependencies

- **Plan 1 (Dynamic Page Count)** -- This plan builds directly on Plan 1's `calculateDynamicPageCount()` to set the token budget. The two plans must be reconciled: Plan 1 creates the function, Plan 6 updates its token formula and wraps it in the config factory.
- **Plan 4 (Smart Chunking)** -- Chunk-level token budgets depend on per-chunk page targets from Plan 4.
- **Plan 5 (Quiz Quality)** -- Separate quiz generation calls use the `quiz_generation` config.
- **No dependency on Plan 2 or Plan 3** (though the per-page token estimate accounts for their richer content).

---

## Files Modified

1. **`src/lib/ai/gemini.ts`** -- New `GeminiConfig` type, `getGeminiConfig()` factory, updated `callGeminiWithRetry()` signature, updated all call sites, updated token formula, optional schema definition

## Files NOT Modified

- `src/types/index.ts` -- No type changes
- `src/app/api/analyze/route.ts` -- No changes (model config is internal to gemini.ts)
- `src/app/student/lesson/[id]/page.tsx` -- No changes (rendering is independent of model config)
- `src/lib/supabase/db.ts` -- No changes
