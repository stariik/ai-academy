# Plan 4: Smarter Chunking for Large Documents

## Goal
Replace the naive paragraph-boundary chunking with structure-aware chunking that respects document sections, shares context between chunks, and produces coherent lessons from large documents.

---

## Current State

### `src/lib/ai/gemini.ts`
- **CHUNKED_THRESHOLD:** 80,000 chars (line 13)
- **MAX_CHUNK_SIZE:** 50,000 chars (line 15)
- **`splitTextIntoChunks()`** (lines 260-288): Splits at paragraph boundaries (`\n\n`), falling back to single newlines or hard splits. Drops chunks under 100 chars.
- **`analyzeDocumentChunked()`** (lines 429-502): Processes chunks sequentially, each independently, with fixed 3-4 pages per chunk, max 25 total. Joins page arrays. Final quiz gets only page titles + 300-char content previews.

### Problems
1. Section mid-split: A section about "Database Indexing" might get split across two chunks.
2. No inter-chunk context: Chunk 3 has no idea what was taught in chunks 1-2.
3. Fixed pages per chunk: A dense 50K-char chunk on one topic gets 3-4 pages, same as a sparse chunk.
4. Final quiz context is too thin: Only 300 chars of content preview per page.
5. No document outline pass: The system doesn't know the document structure before chunking.

---

## Implementation Plan

### Step 1: Add a document outline extraction pass

**File:** `src/lib/ai/gemini.ts`

Add a new function that runs BEFORE chunking. This uses a lightweight Gemini call to extract the document's structure.

```ts
interface DocumentOutline {
  sections: {
    title: string;
    startIndex: number;    // char offset in the document
    endIndex: number;       // char offset (exclusive)
    estimatedWordCount: number;
    topicSummary: string;  // 1-sentence summary
  }[];
  totalSections: number;
}

async function extractDocumentOutline(text: string): Promise<DocumentOutline> {
  // First try: structural detection from text itself (no AI call needed for well-structured docs)
  const sections = detectSections(text);

  if (sections.length >= 2) {
    return {
      sections: sections.map(s => ({
        ...s,
        topicSummary: '', // Will be filled by chunk processing
      })),
      totalSections: sections.length,
    };
  }

  // Fallback: Use a lightweight Gemini call with just the first and last parts of the doc
  // to understand structure. This is cheaper than processing the full document.
  const sampleText = text.length > 10000
    ? text.substring(0, 5000) + '\n\n[...]\n\n' + text.substring(text.length - 5000)
    : text;

  const prompt = `Analyze this document's structure and return a JSON array of sections.
Each section should have: "title" (string), "start_marker" (first ~20 chars of the section).
Only identify MAJOR sections (chapters, main headings), not every paragraph.

Document sample:
---
${sampleText}
---

Respond ONLY with JSON: {"sections": [{"title": "...", "start_marker": "..."}]}`;

  const response = await callGeminiWithRetry(prompt, 2, 'Gemini-Outline');
  const parsed = JSON.parse(response);

  // Map AI-detected sections back to char offsets in the full text
  const aiSections = parsed.sections || [];
  const mappedSections: DocumentOutline['sections'] = [];

  for (const section of aiSections) {
    const idx = text.indexOf(section.start_marker);
    if (idx >= 0) {
      mappedSections.push({
        title: section.title,
        startIndex: idx,
        endIndex: text.length, // Will be adjusted below
        estimatedWordCount: 0,
        topicSummary: '',
      });
    }
  }

  // Adjust endIndex to be start of next section
  for (let i = 0; i < mappedSections.length - 1; i++) {
    mappedSections[i].endIndex = mappedSections[i + 1].startIndex;
  }

  // Calculate word counts
  for (const section of mappedSections) {
    const sectionText = text.substring(section.startIndex, section.endIndex);
    section.estimatedWordCount = sectionText.split(/\s+/).filter(Boolean).length;
  }

  return {
    sections: mappedSections.length > 0 ? mappedSections : [{
      title: 'Full Document',
      startIndex: 0,
      endIndex: text.length,
      estimatedWordCount: text.split(/\s+/).filter(Boolean).length,
      topicSummary: '',
    }],
    totalSections: mappedSections.length || 1,
  };
}
```

### Step 2: Add structural section detection (no AI needed for markdown/well-formatted docs)

**File:** `src/lib/ai/gemini.ts`

```ts
interface DetectedSection {
  title: string;
  startIndex: number;
  endIndex: number;
  estimatedWordCount: number;
  level: number;  // heading depth (1 = #, 2 = ##, etc.)
}

function detectSections(text: string): DetectedSection[] {
  const sections: DetectedSection[] = [];
  const lines = text.split('\n');
  let charOffset = 0;

  // Patterns for section headings
  const headingPatterns = [
    { regex: /^#{1,3}\s+(.+)/, levelFn: (m: RegExpMatchArray) => m[0].indexOf(' ') },
    { regex: /^(\d+\.)+\s+([A-Z].{3,})/, levelFn: () => 2 },
    { regex: /^[A-Z][A-Z\s]{5,80}$/, levelFn: () => 1 },
    { regex: /^Chapter\s+\d+/i, levelFn: () => 1 },
    { regex: /^Section\s+\d+/i, levelFn: () => 2 },
    { regex: /^Part\s+\d+/i, levelFn: () => 1 },
  ];

  for (const line of lines) {
    const trimmed = line.trim();

    for (const pattern of headingPatterns) {
      const match = trimmed.match(pattern.regex);
      if (match) {
        const level = pattern.levelFn(match);
        // Only track top-level and second-level headings for chunking
        if (level <= 2) {
          sections.push({
            title: trimmed.replace(/^#+\s+/, '').replace(/^[\d.]+\s+/, ''),
            startIndex: charOffset,
            endIndex: text.length,
            estimatedWordCount: 0,
            level,
          });
        }
        break;
      }
    }
    charOffset += line.length + 1; // +1 for newline
  }

  // Adjust endIndex and calculate word counts
  for (let i = 0; i < sections.length - 1; i++) {
    sections[i].endIndex = sections[i + 1].startIndex;
  }
  for (const section of sections) {
    const sectionText = text.substring(section.startIndex, section.endIndex);
    section.estimatedWordCount = sectionText.split(/\s+/).filter(Boolean).length;
  }

  return sections;
}
```

### Step 3: Replace `splitTextIntoChunks()` with structure-aware chunking

**File:** `src/lib/ai/gemini.ts`

Replace `splitTextIntoChunks` (lines 260-288) with:

```ts
interface SmartChunk {
  text: string;
  sectionTitles: string[];     // Sections contained in this chunk
  chunkIndex: number;
  estimatedWordCount: number;
}

function buildSmartChunks(
  text: string,
  outline: DocumentOutline,
  maxChunkSize: number
): SmartChunk[] {
  const chunks: SmartChunk[] = [];

  // Strategy: group adjacent sections into chunks that fit within maxChunkSize
  // Never split a section across chunks unless a single section exceeds maxChunkSize
  let currentChunkText = '';
  let currentSectionTitles: string[] = [];
  let chunkIndex = 0;

  for (const section of outline.sections) {
    const sectionText = text.substring(section.startIndex, section.endIndex);

    // If adding this section would exceed max, flush current chunk
    if (currentChunkText.length > 0 &&
        currentChunkText.length + sectionText.length > maxChunkSize) {
      chunks.push({
        text: currentChunkText.trim(),
        sectionTitles: currentSectionTitles,
        chunkIndex: chunkIndex++,
        estimatedWordCount: currentChunkText.split(/\s+/).filter(Boolean).length,
      });
      currentChunkText = '';
      currentSectionTitles = [];
    }

    // If a single section exceeds maxChunkSize, split it at paragraph boundaries
    if (sectionText.length > maxChunkSize) {
      // Flush any existing content first
      if (currentChunkText.length > 0) {
        chunks.push({
          text: currentChunkText.trim(),
          sectionTitles: currentSectionTitles,
          chunkIndex: chunkIndex++,
          estimatedWordCount: currentChunkText.split(/\s+/).filter(Boolean).length,
        });
        currentChunkText = '';
        currentSectionTitles = [];
      }

      // Split the oversized section at paragraph boundaries
      const subChunks = splitAtParagraphs(sectionText, maxChunkSize);
      for (const sub of subChunks) {
        chunks.push({
          text: sub.trim(),
          sectionTitles: [section.title],
          chunkIndex: chunkIndex++,
          estimatedWordCount: sub.split(/\s+/).filter(Boolean).length,
        });
      }
      continue;
    }

    currentChunkText += (currentChunkText ? '\n\n' : '') + sectionText;
    currentSectionTitles.push(section.title);
  }

  // Flush remaining
  if (currentChunkText.trim().length > 100) {
    chunks.push({
      text: currentChunkText.trim(),
      sectionTitles: currentSectionTitles,
      chunkIndex: chunkIndex,
      estimatedWordCount: currentChunkText.split(/\s+/).filter(Boolean).length,
    });
  }

  return chunks;
}

// Helper: split at paragraph boundaries (used only for oversized sections)
function splitAtParagraphs(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining);
      break;
    }

    let splitAt = remaining.lastIndexOf('\n\n', maxSize);
    if (splitAt < maxSize * 0.5) {
      splitAt = remaining.lastIndexOf('\n', maxSize);
    }
    if (splitAt < maxSize * 0.5) {
      splitAt = maxSize;
    }

    chunks.push(remaining.substring(0, splitAt).trim());
    remaining = remaining.substring(splitAt).trim();
  }

  return chunks.filter(c => c.length > 100);
}
```

### Step 4: Add context overlap between chunks

**File:** `src/lib/ai/gemini.ts`

When processing chunk N, include a summary of what was generated from chunks 1 through N-1. This prevents topic repetition and enables bridging.

Update `CHUNK_PAGES_PROMPT` to include a `{previousContext}` placeholder:

```
{previousContext}

This is section {chunkIndex} of {totalChunks} of a larger document.
Section titles in this chunk: {sectionTitles}
```

Build the previousContext string from accumulated page summaries:

```ts
// In analyzeDocumentChunked():
let previousContext = '';

for (let i = 0; i < smartChunks.length; i++) {
  const chunk = smartChunks[i];

  // Build context from previously generated pages
  if (allPages.length > 0 && i > 0) {
    const prevSummary = allPages
      .map(p => `Page ${p.page_number} "${p.title}": ${
        p.content_blocks
          .filter(b => b.type === 'summary' || b.type === 'text')
          .map(b => b.content)
          .join(' ')
          .substring(0, 200)
      }`)
      .join('\n');

    previousContext = `CONTEXT FROM PREVIOUS SECTIONS (do NOT repeat this content, build on it):
${prevSummary}

`;
  }

  const result = await generatePagesFromChunk(
    chunk.text,
    i,
    smartChunks.length,
    nextPageNumber,
    chunkTarget,
    options.targetLevel,
    previousContext,       // new parameter
    chunk.sectionTitles    // new parameter
  );

  // ... accumulate pages ...
}
```

### Step 5: Update `generatePagesFromChunk()` signature

**File:** `src/lib/ai/gemini.ts`, lines 352-381

Add the new parameters:

```ts
async function generatePagesFromChunk(
  chunkText: string,
  chunkIndex: number,
  totalChunks: number,
  startPage: number,
  targetPages: number,
  targetLevel: string,
  previousContext: string = '',     // NEW
  sectionTitles: string[] = []      // NEW
): Promise<{ pages: GeminiPagedLessonResponse['pages'] }> {
  const prompt = CHUNK_PAGES_PROMPT
    .replace('{targetLevel}', targetLevel)
    .replace('{chunkIndex}', String(chunkIndex + 1))
    .replace('{totalChunks}', String(totalChunks))
    .replace(/\{startPage\}/g, String(startPage))
    .replace('{targetPages}', String(targetPages))
    .replace('{chunkText}', chunkText)
    .replace('{previousContext}', previousContext)
    .replace('{sectionTitles}', sectionTitles.join(', '));

  // ... rest unchanged ...
}
```

### Step 6: Improve final quiz context

**File:** `src/lib/ai/gemini.ts`, `generateFinalQuizAndMeta()` (lines 386-424)

The current `pagesOverview` only includes 300 chars of content. Increase this substantially:

Replace lines 399-409:

```ts
const pagesOverview = pages
  .map((p) => {
    const concepts = p.key_concepts.map((c) => `${c.term}: ${c.definition}`).join('; ');
    const contentPreview = p.content_blocks
      .filter((b) => b.type === 'text' || b.type === 'key_concepts' || b.type === 'summary')
      .map((b) => b.content)
      .join(' ')
      .substring(0, 800);  // Increased from 300 to 800

    const misconceptions = (p as any).common_misconceptions?.join(', ') || '';

    return `Page ${p.page_number}: "${p.title}"
Key concepts: ${concepts}
Content: ${contentPreview}
${misconceptions ? `Common misconceptions: ${misconceptions}` : ''}`;
  })
  .join('\n---\n');
```

This gives the final quiz generator much richer context to write meaningful questions.

### Step 7: Update `analyzeDocumentChunked()` to use smart chunking

**File:** `src/lib/ai/gemini.ts`, `analyzeDocumentChunked()` (lines 429-502)

Replace the function body:

```ts
async function analyzeDocumentChunked(
  text: string,
  options: { targetLevel: string }
): Promise<GeminiPagedLessonResponse> {
  // Truncate extremely long documents
  const maxChars = 500_000;
  const truncatedText =
    text.length > maxChars
      ? text.substring(0, maxChars) + '\n\n[Document truncated for processing]'
      : text;

  // Step 1: Extract document outline
  console.log('[Gemini] Extracting document outline...');
  const outline = await extractDocumentOutline(truncatedText);
  console.log(`[Gemini] Found ${outline.totalSections} sections`);

  // Step 2: Build smart chunks from outline
  const smartChunks = buildSmartChunks(truncatedText, outline, MAX_CHUNK_SIZE);
  console.log(`[Gemini] Split into ${smartChunks.length} structure-aware chunks`);

  // Step 3: Analyze each chunk for dynamic page count (from Plan 1)
  const chunkStructures = smartChunks.map(c => analyzeDocumentStructure(c.text));
  const chunkPageBudgets = chunkStructures.map(s => calculateDynamicPageCount(s));

  // Step 4: Generate pages for each chunk with context overlap
  const allPages: GeminiPagedLessonResponse['pages'] = [];
  let nextPageNumber = 1;
  let previousContext = '';

  for (let i = 0; i < smartChunks.length; i++) {
    const chunk = smartChunks[i];
    const chunkTarget = chunkPageBudgets[i].targetPages;

    console.log(`[Gemini] Processing chunk ${i + 1}/${smartChunks.length} ` +
      `(${chunk.text.length} chars, sections: ${chunk.sectionTitles.join(', ')}, ` +
      `target ${chunkTarget} pages)...`);

    try {
      const result = await generatePagesFromChunk(
        chunk.text,
        i,
        smartChunks.length,
        nextPageNumber,
        chunkTarget,
        options.targetLevel,
        previousContext,
        chunk.sectionTitles
      );

      allPages.push(...result.pages);
      nextPageNumber = allPages.length + 1;

      // Build context for next chunk
      previousContext = allPages
        .slice(-3) // Last 3 pages for context window
        .map(p => `Page ${p.page_number} "${p.title}": ${
          p.content_blocks
            .filter(b => b.type === 'summary')
            .map(b => b.content)
            .join(' ')
            .substring(0, 200)
        }`)
        .join('\n');

      // Rate limit delay
      if (i < smartChunks.length - 1) {
        await sleep(1000);
      }
    } catch (error) {
      console.error(`[Gemini] Chunk ${i + 1} failed:`, error);
      continue;
    }
  }

  if (allPages.length === 0) {
    throw new Error('Failed to generate any pages from the document');
  }

  // Re-number all pages sequentially
  allPages.forEach((page, i) => {
    page.page_number = i + 1;
  });

  console.log(`[Gemini] Generated ${allPages.length} pages total. Now generating final quiz...`);

  // Generate final quiz and metadata with rich context
  const meta = await generateFinalQuizAndMeta(allPages, options.targetLevel);

  return {
    title: meta.title,
    description: meta.description,
    learning_objectives: meta.learning_objectives,
    pages: allPages,
    summary: meta.summary,
    final_quiz_questions: meta.final_quiz_questions,
    difficulty: meta.difficulty,
    estimated_duration_minutes: meta.estimated_duration_minutes,
  };
}
```

### Step 8: Consider parallel chunk processing

For documents with many chunks, sequential processing is slow. We can process chunks in parallel batches while respecting rate limits:

```ts
// Process chunks in parallel batches of 2-3
const BATCH_SIZE = 2;

for (let batchStart = 0; batchStart < smartChunks.length; batchStart += BATCH_SIZE) {
  const batch = smartChunks.slice(batchStart, batchStart + BATCH_SIZE);

  const batchResults = await Promise.allSettled(
    batch.map((chunk, batchIdx) => {
      const globalIdx = batchStart + batchIdx;
      return generatePagesFromChunk(
        chunk.text,
        globalIdx,
        smartChunks.length,
        nextPageNumber + batchIdx * chunkPageBudgets[globalIdx].targetPages,
        chunkPageBudgets[globalIdx].targetPages,
        options.targetLevel,
        previousContext,
        chunk.sectionTitles
      );
    })
  );

  for (const result of batchResults) {
    if (result.status === 'fulfilled') {
      allPages.push(...result.pages);
    }
  }
  nextPageNumber = allPages.length + 1;

  // Update context after each batch
  previousContext = /* ... build from recent pages ... */;

  // Rate limit pause between batches
  if (batchStart + BATCH_SIZE < smartChunks.length) {
    await sleep(2000);
  }
}
```

**Trade-off:** Parallel processing means chunks in the same batch don't have context from each other. This is acceptable for non-adjacent sections but can cause issues if two sequential sections are in the same batch. Recommendation: use parallel processing only when chunks are from distinct sections (non-overlapping topics). For now, **keep sequential as default** with parallel as an optional optimization flag.

### Step 9: Adjust thresholds

**File:** `src/lib/ai/gemini.ts`

Update the constants:

```ts
// Lower the chunked threshold since smart chunking now handles medium docs well
const CHUNKED_THRESHOLD = 60_000;   // was 80,000

// Increase max chunk size since structure-aware chunking produces cleaner boundaries
const MAX_CHUNK_SIZE = 60_000;       // was 50,000
```

Rationale: With structure-aware chunking, chunks are cleaner and don't need as much buffer. Lowering the threshold means more documents benefit from the smarter chunking (instead of being crammed into a single oversized call).

---

## Before / After Summary

| Aspect | Before | After |
|--------|--------|-------|
| Chunking strategy | Paragraph-boundary split | Section-boundary split with outline detection |
| Section awareness | None | Full -- sections never split across chunks |
| Inter-chunk context | None | Previous page summaries included in each chunk's prompt |
| Pages per chunk | Fixed 3-4 | Dynamic per-chunk (from Plan 1) |
| Total page cap | 25 | None (content-driven) |
| Final quiz context | 300 chars per page | 800 chars per page + key concept definitions + misconceptions |
| Chunked threshold | 80K chars | 60K chars |
| Document outline | None | Pre-extracted before chunking |
| Oversized sections | Chopped at paragraph | Paragraph-split only within oversized sections |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Outline extraction Gemini call adds latency | Low | Only called for docs without clear heading structure; adds ~2-3s |
| Outline detection misidentifies headings | Medium | Falls back to paragraph-based splitting; outline is guidance, not critical |
| Context overlap increases token usage per chunk | Low | Context is compact (~200-400 tokens); well within budget |
| Parallel processing causes rate limits | Medium | Kept sequential by default; parallel is optional with explicit batching + delays |
| Very long docs (>500K chars) still truncated | Low | This is a hard limit from the existing system; unchanged |
| Structure detection regex misses non-standard formats | Low | AI-based outline extraction as fallback |

---

## Dependencies

- **Plan 1 (Dynamic Page Count)** -- This plan uses `analyzeDocumentStructure()` and `calculateDynamicPageCount()` from Plan 1 for per-chunk page budgets. Plan 1 must be implemented first.
- **Plan 3 (Pedagogical Structure)** -- Inter-chunk context (Step 4) enables better bridging between pages from different chunks, complementing Plan 3's bridge text feature.
- **Plan 6 (Token Budget)** -- If the model config changes (e.g., different model or higher token limits), the chunk size thresholds may need adjustment.
- **No dependency on Plan 2 or Plan 5.**

---

## Files Modified

1. **`src/lib/ai/gemini.ts`** -- Major changes: new `extractDocumentOutline()`, `detectSections()`, `buildSmartChunks()`, `splitAtParagraphs()` functions; updated `analyzeDocumentChunked()`, `generatePagesFromChunk()`, `generateFinalQuizAndMeta()`, `CHUNK_PAGES_PROMPT`; updated constants
