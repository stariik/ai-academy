# Plan 1: Dynamic Page Count Based on Document Content

## Goal
Replace the fixed page-range system (`getPageRange()`) with a dynamic page count that scales based on document structure, topic density, and information complexity -- so the lesson generates **as many pages as the content actually needs**.

---

## Current State

### `src/lib/ai/gemini.ts` (lines 21-29)
```ts
function getPageRange(wordCount: number): { min: number; max: number; outputTokens: number } {
  if (wordCount < 2_000)  return { min: 3, max: 5, outputTokens: 8_192 };
  if (wordCount < 10_000) return { min: 5, max: 8, outputTokens: 8_192 };
  return { min: 6, max: 10, outputTokens: 8_192 };
}
```

### Problems
1. A 9,000-word document with 20 distinct topics still gets capped at 5-8 pages.
2. A 500-word document with 2 topics is forced into 3-5 pages (overinflated).
3. `outputTokens` is always 8192, which truncates JSON for large page counts.
4. Chunked mode hardcodes `~3-4 pages per chunk` and caps at 25 total (line 444).

---

## Implementation Plan

### Step 1: Add a `analyzeDocumentStructure()` pre-analysis function

**File:** `src/lib/ai/gemini.ts`
**Location:** Add after line 29 (after `getPageRange`)

```ts
interface DocumentStructure {
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  headingCount: number;           // lines starting with # or all-caps short lines
  estimatedTopicCount: number;    // heading-based or thematic shift detection
  avgWordsPerSection: number;     // words between headings
  hasCodeBlocks: boolean;
  codeBlockCount: number;
  listCount: number;              // numbered/bulleted lists
  informationDensity: 'low' | 'medium' | 'high'; // derived metric
}

function analyzeDocumentStructure(text: string): DocumentStructure {
  const lines = text.split('\n');
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;

  // Count paragraphs (blocks separated by blank lines)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // Detect headings: markdown-style (#), all-caps short lines, or lines ending with ':'
  const headingPatterns = /^(?:#{1,6}\s+.+|[A-Z][A-Z\s]{4,80}$|(?:\d+\.)+\s+[A-Z].{5,})/;
  const headings = lines.filter(l => headingPatterns.test(l.trim()));
  const headingCount = Math.max(headings.length, 1); // at least 1

  // Estimated topic count: use heading count, but also detect thematic shifts
  // (paragraphs that start a new subject without an explicit heading)
  const estimatedTopicCount = Math.max(headingCount, Math.ceil(paragraphCount / 6));

  // Average words per section
  const avgWordsPerSection = Math.round(wordCount / headingCount);

  // Code detection
  const codeBlockRegex = /```[\s\S]*?```|`[^`]+`/g;
  const codeBlocks = text.match(codeBlockRegex) || [];
  const codeBlockCount = codeBlocks.length;
  const hasCodeBlocks = codeBlockCount > 0;

  // List detection
  const listLines = lines.filter(l => /^\s*[-*]\s+|^\s*\d+\.\s+/.test(l));
  const listCount = listLines.length;

  // Information density heuristic
  // High: many headings per word, code blocks, dense paragraphs
  // Low: few headings, lots of fluff/repetition, short doc
  const topicDensity = estimatedTopicCount / (wordCount / 1000); // topics per 1K words
  let informationDensity: 'low' | 'medium' | 'high' = 'medium';
  if (topicDensity > 3 || hasCodeBlocks) informationDensity = 'high';
  if (topicDensity < 1 && !hasCodeBlocks) informationDensity = 'low';

  return {
    wordCount,
    charCount,
    paragraphCount,
    headingCount,
    estimatedTopicCount,
    avgWordsPerSection,
    hasCodeBlocks,
    codeBlockCount,
    listCount,
    informationDensity,
  };
}
```

### Step 2: Replace `getPageRange()` with `calculateDynamicPageCount()`

**File:** `src/lib/ai/gemini.ts`
**Replace** lines 21-29 with:

```ts
interface PageBudget {
  targetPages: number;
  minPages: number;
  maxPages: number;
  outputTokens: number;
}

function calculateDynamicPageCount(structure: DocumentStructure): PageBudget {
  // Base: 1 page per major topic, with a floor of 2 and no hard ceiling
  let targetPages = structure.estimatedTopicCount;

  // Adjust for word count: very dense sections may need 2 pages per topic
  if (structure.avgWordsPerSection > 1500) {
    targetPages = Math.ceil(targetPages * 1.3);
  }

  // Adjust for code-heavy content: code blocks need their own space
  if (structure.codeBlockCount > 5) {
    targetPages += Math.ceil(structure.codeBlockCount / 4);
  }

  // Adjust for information density
  if (structure.informationDensity === 'high') {
    targetPages = Math.ceil(targetPages * 1.2);
  } else if (structure.informationDensity === 'low') {
    targetPages = Math.ceil(targetPages * 0.8);
  }

  // Floor: at least 2 pages for any document
  targetPages = Math.max(2, targetPages);

  // Soft guidance range: allow 20% flex in either direction
  const minPages = Math.max(2, Math.floor(targetPages * 0.8));
  const maxPages = Math.ceil(targetPages * 1.2);

  // Token budget: ~2000 tokens per page (content blocks + questions + metadata)
  // plus ~500 tokens overhead for lesson-level fields
  const outputTokens = Math.min(65536, Math.max(8192, targetPages * 2000 + 500));

  return { targetPages, minPages, maxPages, outputTokens };
}
```

**Key design decisions:**
- No hard cap on page count. A 50-topic document can get 50+ pages.
- Token budget scales linearly with pages: ~2K tokens per page.
- Max output tokens capped at 65536 (Gemini 2.0 Flash limit).
- For documents that would exceed the single-call token budget, the system automatically falls through to chunked mode (see Step 4).

### Step 3: Update `ANALYSIS_PROMPT` to use dynamic values

**File:** `src/lib/ai/gemini.ts` (lines 31-138)

Update the prompt instructions section. Change:
```
- Split the content into {minPages}-{maxPages} pages.
```
To:
```
- Split the content into approximately {targetPages} pages (minimum {minPages}, maximum {maxPages}).
  Each page should cover ONE coherent topic or subtopic. If the document has more topics,
  create more pages. If fewer, create fewer. The target is driven by the document's own structure,
  not an arbitrary limit.
- Do NOT compress multiple unrelated topics onto a single page just to stay within a page count.
  It is better to have more pages with focused content than fewer pages with mixed content.
```

Also update the RULES section at line 122:
```
- Generate approximately {targetPages} pages (between {minPages} and {maxPages}) with logical progression
```

And add a new placeholder `{targetPages}` to the prompt template.

### Step 4: Update `analyzeDocument()` single-call path to use dynamic calculation

**File:** `src/lib/ai/gemini.ts` (lines 508-610)

Replace lines 537-538:
```ts
const wordCount = truncatedText.split(/\s+/).length;
const { min: minPages, max: maxPages, outputTokens } = getPageRange(wordCount);
```
With:
```ts
const structure = analyzeDocumentStructure(truncatedText);
const { targetPages, minPages, maxPages, outputTokens } = calculateDynamicPageCount(structure);

console.log(`[Gemini] Document structure: ${structure.estimatedTopicCount} topics, ` +
  `${structure.wordCount} words, density=${structure.informationDensity}`);
console.log(`[Gemini] Page budget: target=${targetPages}, range=${minPages}-${maxPages}, ` +
  `outputTokens=${outputTokens}`);

// If the page budget requires more tokens than a single call can handle well,
// route to chunked mode even for smaller documents
if (targetPages > 12 || outputTokens > 32768) {
  console.log(`[Gemini] High page count (${targetPages}). Routing to chunked generation.`);
  return analyzeDocumentChunked(truncatedText, { targetLevel: options.targetLevel });
}
```

Update the model config (line 540-548) to use the dynamic `outputTokens`:
```ts
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: outputTokens,  // now dynamic, not fixed 8192
    responseMimeType: 'application/json',
  },
});
```

Update prompt replacement (lines 550-555) to include `{targetPages}`:
```ts
const prompt = ANALYSIS_PROMPT
  .replace('{targetLevel}', options.targetLevel)
  .replace('{documentText}', truncatedText)
  .replace(/\{wordCount\}/g, String(structure.wordCount))
  .replace(/\{targetPages\}/g, String(targetPages))
  .replace(/\{minPages\}/g, String(minPages))
  .replace(/\{maxPages\}/g, String(maxPages));
```

### Step 5: Update chunked mode for dynamic pages-per-chunk

**File:** `src/lib/ai/gemini.ts`, `analyzeDocumentChunked()` (lines 429-502)

Replace lines 443-445:
```ts
const targetPagesPerChunk = Math.max(2, Math.min(4, Math.floor(25 / chunks.length)));
```
With:
```ts
// Analyze each chunk independently to determine its page budget
const chunkStructures = chunks.map(chunk => analyzeDocumentStructure(chunk));
const chunkPageBudgets = chunkStructures.map(s => calculateDynamicPageCount(s));

// Each chunk gets pages proportional to its topic count
const totalTargetPages = chunkPageBudgets.reduce((sum, b) => sum + b.targetPages, 0);
console.log(`[Gemini] Chunked mode: ${chunks.length} chunks, ` +
  `total target pages: ${totalTargetPages}`);
```

Then in the loop (line 451-476), replace the fixed `targetPagesPerChunk`:
```ts
for (let i = 0; i < chunks.length; i++) {
  const chunkTarget = chunkPageBudgets[i].targetPages;
  console.log(`[Gemini] Processing chunk ${i + 1}/${chunks.length} ` +
    `(${chunks[i].length} chars, target ${chunkTarget} pages)...`);

  try {
    const result = await generatePagesFromChunk(
      chunks[i],
      i,
      chunks.length,
      nextPageNumber,
      chunkTarget,         // <-- dynamic per-chunk target
      options.targetLevel
    );
    // ... rest unchanged
  }
}
```

### Step 6: Update `CHUNK_PAGES_PROMPT` to be less rigid

**File:** `src/lib/ai/gemini.ts` (lines 142-198)

Change the instruction:
```
Generate exactly {targetPages} pages from this section
```
To:
```
Generate approximately {targetPages} pages from this section (you may generate
{targetPages - 1} to {targetPages + 1} pages depending on the natural topic breaks
in the text). Each page should cover one coherent subtopic.
```

### Step 7: Remove the 25-page hard cap

**File:** `src/lib/ai/gemini.ts`

The old line 444 calculated `Math.floor(25 / chunks.length)` which capped at 25 total. This is removed entirely in Step 5 above. No replacement cap -- the page count is now fully driven by content.

---

## Before / After Summary

| Aspect | Before | After |
|--------|--------|-------|
| Page count | Fixed ranges: 3-5, 5-8, 6-10 | Dynamic: scales with topic count |
| Max pages | 25 (chunked hard cap) | No hard cap (content-driven) |
| Output tokens | Always 8192 | 8192-65536, scales with pages |
| Chunked routing | Only if >80K chars | Also if targetPages > 12 |
| Pages per chunk | Fixed ~3-4 | Dynamic per-chunk analysis |
| Pre-analysis | None | `analyzeDocumentStructure()` |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Very long documents producing 50+ pages | Medium | Token budget formula ensures each page is well-budgeted; chunked mode handles these naturally |
| `analyzeDocumentStructure()` miscounting topics | Low | The count is a heuristic used as guidance, not a hard mandate; the LLM can still merge/split as it sees fit |
| Gemini truncating JSON for high page counts | Medium | Dynamic token budget + existing truncated-JSON recovery + auto-routing to chunked mode for >12 pages |
| Single-call hitting rate limits with larger `maxOutputTokens` | Low | Retry logic already in place; larger output tokens don't increase rate limit risk |
| Heading detection regex missing non-standard headings | Low | Falls back to paragraph-count-based estimate; sufficient for most documents |

---

## Dependencies

- **Plan 6 (Token Budget & Model Optimization)** -- This plan introduces dynamic `outputTokens` but Plan 6 may further optimize the model config. The two plans should be reconciled: Plan 6 should build on the dynamic token formula from this plan, not replace it with another fixed value.
- **Plan 4 (Smarter Chunking)** -- This plan modifies chunked routing and per-chunk page budgets. Plan 4 will further improve how text is split into chunks (semantic boundaries). The two plans should be applied in sequence: Plan 1 first (dynamic page counts), then Plan 4 (smarter chunk boundaries).
- **Plan 2 (Richer Content Blocks)** -- More block types means more tokens per page. The `~2000 tokens per page` estimate in `calculateDynamicPageCount` may need to increase to `~2500` if Plan 2 adds significantly more content per page.

---

## Files Modified

1. `src/lib/ai/gemini.ts` -- Primary changes (new functions, updated prompts, updated routing logic)

## Files NOT Modified

- `src/types/index.ts` -- No type changes needed for this plan
- `src/app/api/analyze/route.ts` -- No changes; it already calls `analyzeDocument()` generically
- `src/app/student/lesson/[id]/page.tsx` -- No changes; already handles variable page counts
