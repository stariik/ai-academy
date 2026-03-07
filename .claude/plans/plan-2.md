# Plan 2: Richer Content Block Types

## Goal
Expand the content block type system from 6 types to 16 types, enabling Gemini to produce richer, more varied, and more pedagogically effective lesson content.

---

## Current State

### `src/types/index.ts` (lines 5-12)
```ts
export type ContentBlock = {
  id: string;
  type: 'heading' | 'text' | 'key_concepts' | 'code' | 'callout' | 'summary';
  content: string;
  metadata?: Record<string, unknown>;
  order: number;
  pageId?: string;
};
```

### `src/app/api/analyze/route.ts` (lines 237-258) -- `normalizeBlockType()`
Maps unknown types to the 6 known types.

### `src/app/student/lesson/[id]/page.tsx` (lines 1237-1320) -- `ContentBlockRenderer`
Renders only the 6 known types.

---

## New Block Types

| Type | Purpose | Metadata Schema |
|------|---------|-----------------|
| `table` | Structured data with headers and rows | `{ headers: string[], rows: string[][] }` |
| `list` | Ordered or unordered list items | `{ ordered: boolean }` |
| `example` | Worked example with title and walkthrough | `{ title: string }` |
| `analogy` | Relatable comparison to clarify concepts | (none -- content is the analogy text) |
| `step_by_step` | Numbered procedural instructions | `{ steps: string[] }` |
| `diagram_description` | Text description of a visual concept | `{ alt: string }` |
| `definition` | Formal term + definition | `{ term: string }` |
| `warning` | Important pitfall or common mistake | (none -- content is the warning text) |
| `tip` | Helpful best-practice suggestion | (none -- content is the tip text) |
| `quote` | Notable quote from source material | `{ attribution?: string }` |

---

## Implementation Plan

### Step 1: Update `ContentBlock` type

**File:** `src/types/index.ts`, line 6

Change:
```ts
type: 'heading' | 'text' | 'key_concepts' | 'code' | 'callout' | 'summary';
```
To:
```ts
type:
  | 'heading'
  | 'text'
  | 'key_concepts'
  | 'code'
  | 'callout'
  | 'summary'
  | 'table'
  | 'list'
  | 'example'
  | 'analogy'
  | 'step_by_step'
  | 'diagram_description'
  | 'definition'
  | 'warning'
  | 'tip'
  | 'quote';
```

### Step 2: Update `GeminiPagedLessonResponse` type

**File:** `src/types/index.ts`, lines 118-120

The `content_blocks` type uses `type: string` so it already accepts any string. No change needed here -- but it is worth noting that the type is loose. A future improvement could tighten it.

### Step 3: Update `normalizeBlockType()` in the analyze route

**File:** `src/app/api/analyze/route.ts`, lines 237-258

Replace the entire function:

```ts
function normalizeBlockType(
  type: string
): ContentBlock['type'] {
  const typeMap: Record<string, ContentBlock['type']> = {
    // Original 6 types (direct match)
    heading: 'heading',
    text: 'text',
    key_concepts: 'key_concepts',
    code: 'code',
    callout: 'callout',
    summary: 'summary',

    // New 10 types (direct match)
    table: 'table',
    list: 'list',
    example: 'example',
    analogy: 'analogy',
    step_by_step: 'step_by_step',
    diagram_description: 'diagram_description',
    definition: 'definition',
    warning: 'warning',
    tip: 'tip',
    quote: 'quote',

    // Aliases that map to the canonical types
    paragraph: 'text',
    note: 'callout',
    important: 'callout',
    concepts: 'key_concepts',
    overview: 'summary',
    caution: 'warning',
    danger: 'warning',
    hint: 'tip',
    best_practice: 'tip',
    comparison: 'analogy',
    procedure: 'step_by_step',
    steps: 'step_by_step',
    worked_example: 'example',
    illustration: 'diagram_description',
    diagram: 'diagram_description',
    visual: 'diagram_description',
    blockquote: 'quote',
    citation: 'quote',
    data_table: 'table',
    ordered_list: 'list',
    unordered_list: 'list',
    bullet_list: 'list',
    glossary: 'definition',
    term: 'definition',
  };

  return typeMap[type.toLowerCase()] || 'text';
}
```

### Step 4: Update `ANALYSIS_PROMPT` to teach Gemini about new block types

**File:** `src/lib/ai/gemini.ts`, lines 31-138

In the JSON example structure within the prompt (around line 64-71), replace the content_blocks example:

```json
"content_blocks": [
  {"type": "heading", "content": "Section Title"},
  {"type": "text", "content": "Detailed explanation paragraph..."},
  {"type": "definition", "content": "A clear explanation of what this term means", "metadata": {"term": "Technical Term"}},
  {"type": "example", "content": "Step-by-step worked example showing the concept in action", "metadata": {"title": "Example: Applying the concept"}},
  {"type": "analogy", "content": "Think of [concept] like [relatable comparison]..."},
  {"type": "code", "content": "code example if relevant"},
  {"type": "table", "content": "Comparison of approaches", "metadata": {"headers": ["Approach", "Pros", "Cons"], "rows": [["Method A", "Fast", "Less accurate"], ["Method B", "Accurate", "Slower"]]}},
  {"type": "list", "content": "Key benefits:\n- Benefit 1\n- Benefit 2\n- Benefit 3", "metadata": {"ordered": false}},
  {"type": "step_by_step", "content": "How to perform this task", "metadata": {"steps": ["First, do X", "Then, do Y", "Finally, do Z"]}},
  {"type": "tip", "content": "Pro tip: This technique works best when..."},
  {"type": "warning", "content": "Common mistake: Don't confuse X with Y because..."},
  {"type": "diagram_description", "content": "Imagine a flowchart: Input -> Process A -> Decision -> Output 1 or Output 2"},
  {"type": "quote", "content": "As the document states: '...'", "metadata": {"attribution": "Source Author"}},
  {"type": "callout", "content": "Important note or additional context..."},
  {"type": "key_concepts", "content": "Important concept explanation..."},
  {"type": "summary", "content": "Brief page summary..."}
]
```

Add a new instruction block to the prompt (before RULES section):

```
CONTENT BLOCK TYPES - Use a VARIETY of these types to create engaging lessons:
- "heading": Section titles and subtitles
- "text": Standard explanatory paragraphs (use markdown formatting)
- "definition": Formal definitions. Set metadata.term to the term being defined
- "example": Worked examples demonstrating concepts. Set metadata.title to a descriptive title
- "analogy": Relatable comparisons that make abstract concepts concrete
- "code": Code snippets, commands, or technical syntax
- "table": Structured comparisons or data. Set metadata.headers and metadata.rows
- "list": Ordered or unordered lists. Set metadata.ordered to true/false
- "step_by_step": Procedural instructions. Set metadata.steps as an array of step strings
- "tip": Helpful tips and best practices
- "warning": Common mistakes, pitfalls, or important cautions
- "diagram_description": Text description of a visual/diagram/flowchart
- "quote": Notable quotes from the source document. Set metadata.attribution if known
- "callout": General important notes
- "key_concepts": Inline concept explanations
- "summary": Page or section summaries

VARIETY RULES:
- Each page MUST use at least 3 DIFFERENT block types (not just heading + text + summary)
- Use "example" blocks frequently - worked examples are the most effective teaching tool
- Use "analogy" blocks to explain abstract concepts
- Use "warning" blocks for common misconceptions
- Use "table" blocks when comparing multiple items
- Use "step_by_step" for any procedural or sequential content
- Use "definition" blocks for important terms instead of embedding definitions in text blocks
```

### Step 5: Update `CHUNK_PAGES_PROMPT` similarly

**File:** `src/lib/ai/gemini.ts`, lines 142-198

Add the same block type reference list and variety rules to the chunk generation prompt. Add after the "INSTRUCTIONS" section and before "Respond with a JSON object":

```
CONTENT BLOCK TYPES AVAILABLE:
heading, text, definition, example, analogy, code, table, list, step_by_step,
tip, warning, diagram_description, quote, callout, key_concepts, summary

Use at least 3 different block types per page. Prefer "example", "analogy", and
"definition" blocks over plain "text" blocks when the content naturally fits those types.
```

### Step 6: Update `ContentBlockRenderer` in the student lesson page

**File:** `src/app/student/lesson/[id]/page.tsx`, lines 1263-1318

Add rendering for each new block type. Insert after the existing `summary` block (before the closing `</div>`):

```tsx
{block.type === 'table' && (
  <div className="rounded-lg border border-gray-200 overflow-hidden">
    <table className="w-full text-sm">
      {block.metadata?.headers && (
        <thead className="bg-gray-50">
          <tr>
            {(block.metadata.headers as string[]).map((header, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200">
                {header}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {(block.metadata?.rows as string[][] || []).map((row, ri) => (
          <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
            {row.map((cell, ci) => (
              <td key={ci} className="px-4 py-2 text-gray-700 border-b border-gray-100">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

{block.type === 'list' && (
  <div className="lesson-prose text-[0.9375rem] text-gray-700 leading-relaxed pl-2">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {block.content}
    </ReactMarkdown>
  </div>
)}

{block.type === 'example' && (
  <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
    {block.metadata?.title && (
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1.5">
        {block.metadata.title as string}
      </p>
    )}
    <div className="lesson-prose text-sm text-blue-900">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {block.content}
      </ReactMarkdown>
    </div>
  </div>
)}

{block.type === 'analogy' && (
  <div className="rounded-lg border-l-4 border-teal-400 bg-teal-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-1.5">
      Analogy
    </p>
    <div className="lesson-prose text-sm text-teal-900 italic">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {block.content}
      </ReactMarkdown>
    </div>
  </div>
)}

{block.type === 'step_by_step' && (
  <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">
      Step by Step
    </p>
    {block.metadata?.steps ? (
      <ol className="list-decimal list-inside space-y-1.5 text-sm text-indigo-900">
        {(block.metadata.steps as string[]).map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    ) : (
      <div className="lesson-prose text-sm text-indigo-900">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {block.content}
        </ReactMarkdown>
      </div>
    )}
  </div>
)}

{block.type === 'diagram_description' && (
  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
      Diagram
    </p>
    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
      {block.content}
    </pre>
  </div>
)}

{block.type === 'definition' && (
  <div className="rounded-lg bg-violet-50 border border-violet-200 p-4">
    {block.metadata?.term && (
      <p className="font-bold text-violet-800 mb-1">
        {block.metadata.term as string}
      </p>
    )}
    <div className="lesson-prose text-sm text-violet-900">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {block.content}
      </ReactMarkdown>
    </div>
  </div>
)}

{block.type === 'warning' && (
  <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1.5">
      Warning
    </p>
    <div className="lesson-prose text-sm text-red-900">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {block.content}
      </ReactMarkdown>
    </div>
  </div>
)}

{block.type === 'tip' && (
  <div className="rounded-lg border-l-4 border-green-400 bg-green-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-1.5">
      Tip
    </p>
    <div className="lesson-prose text-sm text-green-900">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {block.content}
      </ReactMarkdown>
    </div>
  </div>
)}

{block.type === 'quote' && (
  <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-2">
    <div className="lesson-prose text-sm text-gray-700 italic">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {block.content}
      </ReactMarkdown>
    </div>
    {block.metadata?.attribution && (
      <footer className="text-xs text-gray-500 mt-1">
        -- {block.metadata.attribution as string}
      </footer>
    )}
  </blockquote>
)}
```

### Step 7: Handle metadata for table and step_by_step gracefully

When Gemini returns a `table` block, the data may be in metadata OR the content may contain a markdown table. The renderer should handle both:

**File:** `src/app/student/lesson/[id]/page.tsx`

For the `table` block, add a fallback: if `metadata.headers` and `metadata.rows` are missing, render `block.content` through ReactMarkdown (which already handles markdown tables via remarkGfm):

```tsx
{block.type === 'table' && (
  <div className="rounded-lg border border-gray-200 overflow-hidden">
    {block.metadata?.headers && block.metadata?.rows ? (
      <table className="w-full text-sm">
        {/* ... structured rendering as above ... */}
      </table>
    ) : (
      <div className="lesson-prose text-sm p-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {block.content}
        </ReactMarkdown>
      </div>
    )}
  </div>
)}
```

Similarly for `step_by_step`, the fallback already exists in Step 6's code (falls back to rendering `block.content` as markdown if `metadata.steps` is missing).

---

## Visual Design Summary

| Block Type | Color Scheme | Left Border | Icon/Label |
|------------|-------------|-------------|------------|
| `example` | Blue 50/400 | Blue | Example title from metadata |
| `analogy` | Teal 50/400 | Teal | "Analogy" |
| `definition` | Violet 50/200 | -- | Bold term from metadata |
| `warning` | Red 50/400 | Red | "Warning" |
| `tip` | Green 50/400 | Green | "Tip" |
| `quote` | Gray 300 | Gray | Attribution from metadata |
| `table` | Gray 200 border | -- | -- |
| `list` | -- | -- | -- |
| `step_by_step` | Indigo 50/200 | -- | "Step by Step" |
| `diagram_description` | Gray 50, dashed border | -- | "Diagram" |

---

## Before / After Summary

| Aspect | Before | After |
|--------|--------|-------|
| Content block types | 6 | 16 |
| Prompt block guidance | Minimal example | Full type catalog + variety rules |
| Visual differentiation | 3 styled blocks (callout, key_concepts, summary) | 13 distinctly styled blocks |
| Metadata usage | None actively used | table, list, example, step_by_step, definition, quote use metadata |
| normalizeBlockType aliases | 8 aliases | 20+ aliases |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Gemini ignores new types and keeps using heading/text/summary | Medium | Strong prompt instructions with variety rules; explicit instruction "at least 3 different types per page" |
| Metadata fields missing from Gemini output | Medium | Every renderer has fallback: renders `block.content` via ReactMarkdown if metadata is absent |
| Table metadata malformed (wrong types) | Low | Type-check in renderer; fallback to markdown table rendering |
| Increased token usage per page | Low | Plan 1's dynamic token budget already accounts for richer content |
| New types render poorly on mobile | Low | All new renderers use responsive Tailwind classes; tables get `overflow-hidden` |
| Gemini returns types not in our list | Low | `normalizeBlockType()` maps unknowns to 'text'; already handled |

---

## Dependencies

- **Plan 1 (Dynamic Page Count)** -- Plan 1's token-per-page estimate (~2000) may need to increase to ~2500 to accommodate richer block types. This plan should be implemented after Plan 1 so the token budget can be adjusted.
- **Plan 3 (Pedagogical Structure)** -- Plan 3 may prescribe which block types should appear in which position (e.g., every page starts with a heading, ends with summary). This plan provides the type system; Plan 3 provides the structural rules.
- **No dependency on Plan 4, 5, or 6.**

---

## Files Modified

1. **`src/types/index.ts`** -- Expand `ContentBlock.type` union (line 6)
2. **`src/lib/ai/gemini.ts`** -- Update `ANALYSIS_PROMPT` and `CHUNK_PAGES_PROMPT` with new block type catalog and variety rules
3. **`src/app/api/analyze/route.ts`** -- Expand `normalizeBlockType()` with new types and aliases
4. **`src/app/student/lesson/[id]/page.tsx`** -- Add 10 new rendering branches in `ContentBlockRenderer`
