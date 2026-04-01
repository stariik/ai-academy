// ============================================================
// Gemini AI Client - Document Analysis for Lesson Generation
// Uses gemini-2.0-flash for fast structured output
// Supports chunked generation for large documents
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiPagedLessonResponse } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Threshold above which we use chunked generation (chars)
const CHUNKED_THRESHOLD = 60_000;
// Max chars per chunk for chunked generation
const MAX_CHUNK_SIZE = 60_000;

// ============================================================
// Gemini Model Configuration
// ============================================================

type GeminiTask =
  | 'content_generation'
  | 'outline_extraction'
  | 'quiz_generation'
  | 'metadata_generation';

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
      temperature: 0.35,
      topP: 0.85,
      maxOutputTokens: dynamicTokenBudget ?? 16_384,
      responseMimeType: 'application/json',
    },
    outline_extraction: {
      model: 'gemini-2.0-flash',
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 4_096,
      responseMimeType: 'application/json',
    },
    quiz_generation: {
      model: 'gemini-2.0-flash',
      temperature: 0.4,
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

// ============================================================
// Document Structure Analysis
// ============================================================

interface DocumentStructure {
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  headingCount: number;
  estimatedTopicCount: number;
  avgWordsPerSection: number;
  hasCodeBlocks: boolean;
  codeBlockCount: number;
  listCount: number;
  informationDensity: 'low' | 'medium' | 'high';
}

function analyzeDocumentStructure(text: string): DocumentStructure {
  const lines = text.split('\n');
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  const headingPatterns = /^(?:#{1,6}\s+.+|[A-Z][A-Z\s]{4,80}$|(?:\d+\.)+\s+[A-Z].{5,})/;
  const headings = lines.filter(l => headingPatterns.test(l.trim()));
  const headingCount = Math.max(headings.length, 1);

  const estimatedTopicCount = Math.max(headingCount, Math.ceil(paragraphCount / 6));
  const avgWordsPerSection = Math.round(wordCount / headingCount);

  const codeBlockRegex = /```[\s\S]*?```|`[^`]+`/g;
  const codeBlocks = text.match(codeBlockRegex) || [];
  const codeBlockCount = codeBlocks.length;
  const hasCodeBlocks = codeBlockCount > 0;

  const listLines = lines.filter(l => /^\s*[-*]\s+|^\s*\d+\.\s+/.test(l));
  const listCount = listLines.length;

  const topicDensity = estimatedTopicCount / (wordCount / 1000);
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

// ============================================================
// Dynamic Page Count Calculation
// ============================================================

interface PageBudget {
  targetPages: number;
  minPages: number;
  maxPages: number;
  outputTokens: number;
}

function calculateDynamicPageCount(structure: DocumentStructure): PageBudget {
  // Base: roughly 1 page per 200 words, capped by topic count
  const wordBasedPages = Math.ceil(structure.wordCount / 200);
  let targetPages = Math.min(structure.estimatedTopicCount, wordBasedPages);

  if (structure.avgWordsPerSection > 1500) {
    targetPages = Math.ceil(targetPages * 1.3);
  }

  if (structure.codeBlockCount > 5) {
    targetPages += Math.ceil(structure.codeBlockCount / 4);
  }

  if (structure.informationDensity === 'high') {
    targetPages = Math.ceil(targetPages * 1.2);
  } else if (structure.informationDensity === 'low') {
    targetPages = Math.ceil(targetPages * 0.8);
  }

  targetPages = Math.max(2, Math.min(15, targetPages));

  const minPages = Math.max(2, Math.floor(targetPages * 0.8));
  const maxPages = Math.min(25, Math.ceil(targetPages * 1.2));

  const tokensPerPage = 3000;
  const overheadTokens = 1000;
  const outputTokens = Math.min(65536, Math.max(16384, targetPages * tokensPerPage + overheadTokens));

  return { targetPages, minPages, maxPages, outputTokens };
}

// ============================================================
// Section Detection and Document Outline
// ============================================================

interface DetectedSection {
  title: string;
  startIndex: number;
  endIndex: number;
  estimatedWordCount: number;
  level: number;
}

function detectSections(text: string): DetectedSection[] {
  const sections: DetectedSection[] = [];
  const lines = text.split('\n');
  let charOffset = 0;

  const headingPatterns = [
    { regex: /^#{1,3}\s+(.+)/, levelFn: (m: RegExpMatchArray) => m[0].indexOf(' ') },
    // Multi-level numbered sections only (e.g., "1.1 Introduction", "2.3.1 Details")
    // Single-level numbers (1., 2., 3.) are almost always list items, not headings
    {
      regex: /^(\d+\.){2,}\s+([A-Z].{3,60})$/,
      levelFn: () => 2,
    },
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
    charOffset += line.length + 1;
  }

  for (let i = 0; i < sections.length - 1; i++) {
    sections[i].endIndex = sections[i + 1].startIndex;
  }
  for (const section of sections) {
    const sectionText = text.substring(section.startIndex, section.endIndex);
    section.estimatedWordCount = sectionText.split(/\s+/).filter(Boolean).length;
  }

  return sections;
}

interface DocumentOutline {
  sections: {
    title: string;
    startIndex: number;
    endIndex: number;
    estimatedWordCount: number;
    topicSummary: string;
  }[];
  totalSections: number;
}

export async function extractDocumentOutline(text: string): Promise<DocumentOutline> {
  // First try: structural detection from text itself
  const sections = detectSections(text);

  if (sections.length >= 2) {
    return {
      sections: sections.map(s => ({
        title: s.title,
        startIndex: s.startIndex,
        endIndex: s.endIndex,
        estimatedWordCount: s.estimatedWordCount,
        topicSummary: '',
      })),
      totalSections: sections.length,
    };
  }

  // Fallback: Use a lightweight Gemini call for unstructured docs
  try {
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

    const config = getGeminiConfig('outline_extraction');
    const response = await callGeminiWithRetry(prompt, config, 2, 'Gemini-Outline');
    const parsed = JSON.parse(response);

    const aiSections = parsed.sections || [];
    const mappedSections: DocumentOutline['sections'] = [];

    for (const section of aiSections) {
      const idx = text.indexOf(section.start_marker);
      if (idx >= 0) {
        mappedSections.push({
          title: section.title,
          startIndex: idx,
          endIndex: text.length,
          estimatedWordCount: 0,
          topicSummary: '',
        });
      }
    }

    for (let i = 0; i < mappedSections.length - 1; i++) {
      mappedSections[i].endIndex = mappedSections[i + 1].startIndex;
    }

    for (const section of mappedSections) {
      const sectionText = text.substring(section.startIndex, section.endIndex);
      section.estimatedWordCount = sectionText.split(/\s+/).filter(Boolean).length;
    }

    if (mappedSections.length > 0) {
      return {
        sections: mappedSections,
        totalSections: mappedSections.length,
      };
    }
  } catch (error) {
    console.warn('[Gemini] Outline extraction failed, falling back to single-section:', error);
  }

  // Final fallback: treat entire document as one section
  return {
    sections: [{
      title: 'Full Document',
      startIndex: 0,
      endIndex: text.length,
      estimatedWordCount: text.split(/\s+/).filter(Boolean).length,
      topicSummary: '',
    }],
    totalSections: 1,
  };
}

// ============================================================
// Smart Chunking
// ============================================================

interface SmartChunk {
  text: string;
  sectionTitles: string[];
  chunkIndex: number;
  estimatedWordCount: number;
}

function buildSmartChunks(
  text: string,
  outline: DocumentOutline,
  maxChunkSize: number
): SmartChunk[] {
  const chunks: SmartChunk[] = [];

  let currentChunkText = '';
  let currentSectionTitles: string[] = [];
  let chunkIndex = 0;

  for (const section of outline.sections) {
    const sectionText = text.substring(section.startIndex, section.endIndex);

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

    if (sectionText.length > maxChunkSize) {
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

// getPageRange() has been replaced by analyzeDocumentStructure() + calculateDynamicPageCount()

const ANALYSIS_PROMPT = `You are an expert educational content creator and instructional designer. Your task is to analyze the following document and transform it into a structured, multi-page lesson that a student will learn page by page with an AI tutor.

IMPORTANT: Split the document into logical PAGES. Each page covers ONE coherent topic or subtopic that can be taught and assessed independently. A student will read one page at a time, discuss it with an AI tutor, answer check questions, then move to the next page.

TARGET LEVEL: {targetLevel}

This document contains approximately {wordCount} words.

INSTRUCTIONS:
- Split the content into approximately {targetPages} pages (minimum {minPages}, maximum {maxPages}).
  Each page should cover ONE coherent topic or subtopic. If the document has more topics,
  create more pages. If fewer, create fewer. The target is driven by the document's own structure,
  not an arbitrary limit.
- Do NOT compress multiple unrelated topics onto a single page just to stay within a page count.
  It is better to have more pages with focused content than fewer pages with mixed content.
- Cover ALL major topics and sections from the document. Do not skip or summarize away important content.
- Each page should contain substantial teaching material, not just surface-level summaries.
- Each page covers one coherent subtopic - do NOT mix unrelated ideas on a single page.
- Each page gets its own content_blocks, key_concepts, and 2-4 check_questions.
- All content must be accurate to the source document - do NOT invent facts.
- Use markdown formatting within content block text where helpful.

CONTENT BLOCK TYPES - Use a VARIETY of these types to create engaging lessons:
- "heading": Section titles and subtitles
- "text": Standard explanatory paragraphs (use markdown formatting)
- "definition": Formal definitions. Set metadata.term to the term being defined
- "example": Worked examples demonstrating concepts. Set metadata.title to a descriptive title
- "analogy": Relatable comparisons that make abstract concepts concrete
- "code": Code snippets, commands, or technical syntax
- "table": Structured comparisons or data. Set metadata.headers (string[]) and metadata.rows (string[][])
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
- Use "example" blocks frequently -- worked examples are the most effective teaching tool
- Use "analogy" blocks to explain abstract concepts
- Use "warning" blocks for common misconceptions
- Use "table" blocks when comparing multiple items
- Use "step_by_step" for any procedural or sequential content
- Use "definition" blocks for important terms instead of embedding definitions in text blocks

RECOMMENDED CONTENT BLOCK ORDER PER PAGE:
1. "heading" -- Page title
2. "text" / "definition" / "analogy" -- Introduction and context
3. "text" / "example" / "code" / "table" -- Core explanation with examples
4. "step_by_step" / "diagram_description" -- Procedural or visual content
5. "tip" / "warning" -- Practical guidance
6. "summary" -- Page summary

PEDAGOGICAL STRUCTURE REQUIREMENTS:

1. PAGE ORDERING - Structure pages with deliberate difficulty progression:
   - Page 1: Always "foundational" -- introduce the topic, set context, define basic terms
   - Middle pages: Progress from "intermediate" to "advanced" concepts
   - Final page(s): "synthesis" -- connect concepts together, show big picture

2. TEACHING FLOW - Each page MUST include a "teaching_flow" object:
   - "introduction": 1-2 sentences that hook the student and connect to what they learned on the previous page. For page 1, introduce the overall topic.
   - "core_explanation": A label for the main concept taught on this page (e.g., "Understanding Variables")
   - "practice_hint": A suggestion for what the student should try or think about (e.g., "Try to identify three variables in the code example above")
   - "reflection_prompt": A metacognitive question at the end (e.g., "How would you explain this concept to a friend?")

3. PREREQUISITES - Each page should declare "prerequisites": an array of concept_ids from previous pages that a student needs to understand before this page makes sense. Page 1 has no prerequisites (empty array).

4. CONCEPTS INTRODUCED - Each page should declare "concepts_introduced": an array of concept_ids that are first taught on this page. These should be short lowercase identifiers (e.g., "variables", "for_loops", "recursion").

5. BRIDGE FROM PREVIOUS - Each page (except page 1) MUST include "bridge_from_previous": a 1-2 sentence transition that references what was just learned and previews what comes next.

6. COMMON MISCONCEPTIONS - Include "common_misconceptions" (array of strings) where relevant. These are typical misunderstandings students have about this page's topic.

7. REAL-WORLD APPLICATIONS - Include "real_world_applications" (array of strings) connecting the theory to practical use.

8. DIFFICULTY LEVEL - Each page MUST include "difficulty_level": one of "foundational", "intermediate", "advanced", "synthesis"

CHECK QUESTIONS (per page):
- Each page gets 2-4 check questions testing THAT page's content only.
- Question types allowed: mcq, true_false, ordering, fill_in_blank, matching.
- Each question MUST include "bloom_level": one of "remember", "understand", "apply", "analyze".
- Use at least 2 different question types per page.
- For mcq: provide exactly 4 plausible options (distractors should be common misconceptions, not obviously wrong).
- For true_false: provide ["True", "False"] as options. Statement must be unambiguous.
- For ordering: provide 3-6 items as options; correct_answer is comma-separated correct order.
- For fill_in_blank: use ___ in the question for the blank; correct_answer is the expected word(s).
- For matching: provide terms as options; include metadata.matches with {"term": "definition"} pairs; correct_answer is JSON of the correct mapping.
- Difficulty progression: early pages get "easy" questions, later pages get "medium" or "hard".

CONCEPT MAP AND LEARNING PATH (lesson level):
- "concept_map": an array of concept nodes showing how concepts relate across the lesson.
- "learning_path": an ordered array of concept_ids in the order they should be learned.

You MUST respond with a valid JSON object matching this exact structure:
{
  "title": "A clear, engaging title for the lesson",
  "description": "A 2-3 sentence description of what the lesson covers",
  "learning_objectives": [
    "Students will be able to [verb] [specific skill/knowledge]",
    "Students will understand [concept]"
  ],
  "pages": [
    {
      "page_number": 1,
      "title": "Clear topic name for this page",
      "content_blocks": [
        {"type": "heading", "content": "Section Title"},
        {"type": "text", "content": "Detailed explanation paragraph..."},
        {"type": "definition", "content": "A clear explanation of what this term means", "metadata": {"term": "Technical Term"}},
        {"type": "example", "content": "Step-by-step worked example showing the concept in action", "metadata": {"title": "Example: Applying the concept"}},
        {"type": "analogy", "content": "Think of [concept] like [relatable comparison]..."},
        {"type": "code", "content": "code example if relevant"},
        {"type": "table", "content": "Comparison of approaches", "metadata": {"headers": ["Approach", "Pros", "Cons"], "rows": [["Method A", "Fast", "Less accurate"], ["Method B", "Accurate", "Slower"]]}},
        {"type": "list", "content": "Key benefits:\\n- Benefit 1\\n- Benefit 2\\n- Benefit 3", "metadata": {"ordered": false}},
        {"type": "step_by_step", "content": "How to perform this task", "metadata": {"steps": ["First, do X", "Then, do Y", "Finally, do Z"]}},
        {"type": "tip", "content": "Pro tip: This technique works best when..."},
        {"type": "warning", "content": "Common mistake: Don't confuse X with Y because..."},
        {"type": "diagram_description", "content": "Imagine a flowchart: Input -> Process A -> Decision -> Output 1 or Output 2"},
        {"type": "quote", "content": "As the document states: '...'", "metadata": {"attribution": "Source Author"}},
        {"type": "callout", "content": "Important note or additional context..."},
        {"type": "key_concepts", "content": "Important concept explanation..."},
        {"type": "summary", "content": "Brief page summary..."}
      ],
      "key_concepts": [
        {"term": "Technical Term", "definition": "Clear definition"}
      ],
      "teaching_flow": {
        "introduction": "Welcome to this lesson! We will explore...",
        "core_explanation": "Understanding the Basics",
        "practice_hint": "Try to identify three examples in the text above",
        "reflection_prompt": "How would you explain this concept to a friend?"
      },
      "prerequisites": [],
      "concepts_introduced": ["basic_concept"],
      "difficulty_level": "foundational",
      "bridge_from_previous": null,
      "common_misconceptions": ["Common wrong assumption about this topic"],
      "real_world_applications": ["How this concept is used in industry"],
      "check_questions": [
        {
          "question": "What is the primary purpose of X?",
          "type": "mcq",
          "options": ["Correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correct_answer": "Correct answer",
          "explanation": "Why this answer is correct",
          "difficulty": "easy",
          "points": 5,
          "bloom_level": "remember"
        },
        {
          "question": "Put these steps in the correct order",
          "type": "ordering",
          "options": ["Step B", "Step A", "Step C"],
          "correct_answer": "Step A, Step B, Step C",
          "explanation": "The correct order is A then B then C because...",
          "difficulty": "medium",
          "points": 5,
          "bloom_level": "understand"
        },
        {
          "question": "The process of ___ allows data to be stored temporarily.",
          "type": "fill_in_blank",
          "correct_answer": "caching",
          "explanation": "Caching stores data temporarily for faster access",
          "difficulty": "easy",
          "points": 5,
          "bloom_level": "remember"
        }
      ]
    }
  ],
  "summary": "A comprehensive 3-5 sentence summary of the entire lesson",
  "final_quiz_questions": [
    {
      "question": "Comprehensive question covering the full lesson?",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation",
      "difficulty": "medium",
      "points": 10,
      "bloom_level": "apply"
    },
    {
      "question": "True or false: Statement?",
      "type": "true_false",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "Explanation",
      "difficulty": "easy",
      "points": 5,
      "bloom_level": "remember"
    },
    {
      "question": "Open-ended question?",
      "type": "short_answer",
      "correct_answer": "Expected key points",
      "explanation": "Full explanation",
      "difficulty": "hard",
      "points": 15,
      "bloom_level": "analyze"
    }
  ],
  "concept_map": [
    {"concept_id": "basic_concept", "label": "Basic Concept", "prerequisite_ids": []},
    {"concept_id": "advanced_concept", "label": "Advanced Concept", "prerequisite_ids": ["basic_concept"]}
  ],
  "learning_path": ["basic_concept", "advanced_concept"],
  "difficulty": "beginner | intermediate | advanced",
  "estimated_duration_minutes": 30
}

RULES:
- Generate approximately {targetPages} pages (between {minPages} and {maxPages}) with logical progression from foundational to synthesis
- Each page MUST have 2-4 check questions with a mix of types (mcq, true_false, ordering, fill_in_blank, matching) and bloom_level on each
- Each page MUST have at least 3 content_blocks using at least 3 different block types
- Each page MUST have at least 1 key_concept
- Each page MUST have a teaching_flow, difficulty_level, prerequisites, and concepts_introduced
- Each page after page 1 MUST have bridge_from_previous
- Generate 5-8 final_quiz_questions with a mix of mcq, true_false, short_answer, ordering, and matching types
- Each final quiz question MUST include bloom_level
- For mcq: provide exactly 4 options with one correct answer
- For true_false: provide ["True", "False"] as options
- For short_answer: do NOT include an options array
- For ordering: provide 3-6 items as options; correct_answer is comma-separated correct order
- For matching: options = terms, include metadata.matches, correct_answer = JSON mapping
- The difficulty field must be exactly one of: "beginner", "intermediate", or "advanced"
- estimated_duration_minutes should be realistic (typically 15-60)
- Include concept_map and learning_path at the lesson level

DOCUMENT TO ANALYZE:
---
{documentText}
---

Respond ONLY with the JSON object. No additional text before or after.`;

// ---- Chunk generation prompt (generates pages for a text chunk) ----

const CHUNK_PAGES_PROMPT = `You are an expert educational content creator. Generate lesson pages from the following text section.

TARGET LEVEL: {targetLevel}
This is section {chunkIndex} of {totalChunks} of a larger document.
Section topics: {sectionTitles}

Generate approximately {targetPages} pages from this section (you may generate {targetPages} +/- 1 pages depending on natural topic breaks), starting at page number {startPage}.

{previousContext}

INSTRUCTIONS:
- Each page covers ONE coherent topic or subtopic.
- Each page should contain substantial teaching material from the source text.
- Each page gets content_blocks, key_concepts, and 2-4 check_questions.
- All content must be accurate to the source text.
- Use markdown formatting within content block text where helpful.

CONTENT BLOCK TYPES AVAILABLE:
heading, text, definition, example, analogy, code, table, list, step_by_step,
tip, warning, diagram_description, quote, callout, key_concepts, summary

Use at least 3 different block types per page. Prefer "example", "analogy", and
"definition" blocks over plain "text" blocks when the content naturally fits those types.
Set metadata for: definition (term), example (title), table (headers, rows),
list (ordered), step_by_step (steps), quote (attribution).

PEDAGOGICAL FIELDS - Each page MUST include:
- "teaching_flow": {"introduction": "...", "core_explanation": "...", "practice_hint": "...", "reflection_prompt": "..."}
- "difficulty_level": one of "foundational", "intermediate", "advanced", "synthesis"
- "bridge_from_previous": 1-2 sentence transition from the previous page (null for first page of section if startPage is 1)
- "concepts_introduced": array of short lowercase concept_ids first taught on this page
- "prerequisites": array of concept_ids from previous pages needed for this page
- "common_misconceptions": array of strings (common misunderstandings about this topic)
- "real_world_applications": array of strings (practical applications)

CHECK QUESTIONS:
- 2-4 questions per page testing THAT page's content only
- Types: mcq, true_false, ordering, fill_in_blank, matching
- Each question MUST include "bloom_level": remember, understand, apply, or analyze
- Use at least 2 different question types per page
- For mcq: exactly 4 plausible options. For ordering: 3-6 items. For matching: include metadata.matches

Respond with a JSON object:
{
  "pages": [
    {
      "page_number": {startPage},
      "title": "Clear topic name",
      "content_blocks": [
        {"type": "heading", "content": "Section Title"},
        {"type": "text", "content": "Detailed explanation..."},
        {"type": "definition", "content": "Clear definition of the term", "metadata": {"term": "Key Term"}},
        {"type": "example", "content": "Worked example...", "metadata": {"title": "Example: Concept in action"}},
        {"type": "warning", "content": "Common mistake to avoid..."},
        {"type": "summary", "content": "Brief summary..."}
      ],
      "key_concepts": [
        {"term": "Term", "definition": "Definition"}
      ],
      "teaching_flow": {
        "introduction": "Building on what we learned...",
        "core_explanation": "Main Concept Label",
        "practice_hint": "Try applying this to...",
        "reflection_prompt": "Why do you think this matters?"
      },
      "prerequisites": [],
      "concepts_introduced": ["concept_id"],
      "difficulty_level": "intermediate",
      "bridge_from_previous": "Previously we covered X, now let's explore Y...",
      "common_misconceptions": ["A common mistake is thinking..."],
      "real_world_applications": ["This is used in..."],
      "check_questions": [
        {
          "question": "Question about this page?",
          "type": "mcq",
          "options": ["A", "B", "C", "D"],
          "correct_answer": "A",
          "explanation": "Why",
          "difficulty": "easy",
          "points": 5,
          "bloom_level": "remember"
        },
        {
          "question": "The ___ pattern is used to...",
          "type": "fill_in_blank",
          "correct_answer": "observer",
          "explanation": "The observer pattern allows...",
          "difficulty": "medium",
          "points": 5,
          "bloom_level": "understand"
        }
      ]
    }
  ]
}

RULES:
- Each page MUST have at least 3 content_blocks using at least 3 different block types, 1 key_concept, and 2 check_questions
- Each page MUST have teaching_flow, difficulty_level, concepts_introduced, and prerequisites
- For mcq: exactly 4 options. For true_false: ["True", "False"]. For ordering: 3-6 items. For matching: include metadata.matches
- Each check question MUST have bloom_level
- Be thorough -- include details from the source text, not just summaries

TEXT SECTION:
---
{chunkText}
---

Respond ONLY with the JSON object.`;

// ---- Final quiz + metadata prompt (generates quiz from page summaries) ----

const FINAL_QUIZ_PROMPT = `You are an expert assessment designer and educational content creator. Based on the following lesson outline, generate the lesson metadata, a comprehensive final quiz, and a concept map.

TARGET LEVEL: {targetLevel}
TOTAL PAGES: {totalPages}

LESSON PAGES OVERVIEW:
{pagesOverview}

BLOOM'S TAXONOMY DISTRIBUTION for the final quiz:
- 15% REMEMBER: Recall key terms and facts
- 25% UNDERSTAND: Explain concepts and relationships
- 25% APPLY: Use knowledge in new contexts or scenarios
- 20% ANALYZE: Compare, contrast, or break down complex topics
- 10% EVALUATE: Judge the merits of different approaches
- 5% CREATE: Synthesize multiple concepts into a new idea

REQUIREMENTS:
- Generate {quizQuestionCount} final quiz questions (at least 1 per page covered)
- Mix of question types: mcq, true_false, short_answer, ordering, matching
- Include at least 2 scenario-based questions that require applying multiple concepts
- Questions must span ALL pages -- do not cluster questions from one section
- Difficulty distribution: 30% easy, 40% medium, 30% hard
- Each question MUST specify "bloom_level"
- Each question SHOULD include "page_reference" (the page number most relevant to the question)
- For short_answer: the expected answer should be 1-3 sentences, not a single word
- For mcq: distractors must be plausible (common misconceptions or related concepts)

Generate a JSON object with:
{
  "title": "Engaging lesson title covering the full document",
  "description": "2-3 sentence description of the full lesson",
  "learning_objectives": ["Students will be able to...", "Students will understand..."],
  "summary": "Comprehensive 3-5 sentence summary of the entire lesson",
  "difficulty": "beginner | intermediate | advanced",
  "estimated_duration_minutes": 30,
  "final_quiz_questions": [
    {
      "question": "Scenario: Given situation X, how would you apply concept Y?",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation referencing the lesson material",
      "difficulty": "medium",
      "points": 10,
      "bloom_level": "apply",
      "page_reference": 3
    },
    {
      "question": "True or false: Statement about a key concept?",
      "type": "true_false",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "Explanation with reference to specific lesson content",
      "difficulty": "easy",
      "points": 5,
      "bloom_level": "remember",
      "page_reference": 1
    },
    {
      "question": "Explain why approach A is preferred over approach B in context Z.",
      "type": "short_answer",
      "correct_answer": "Expected key points covering...",
      "explanation": "Full explanation",
      "difficulty": "hard",
      "points": 15,
      "bloom_level": "evaluate",
      "page_reference": 5
    },
    {
      "question": "Arrange these concepts in order from most fundamental to most advanced",
      "type": "ordering",
      "options": ["Concept C", "Concept A", "Concept B"],
      "correct_answer": "Concept A, Concept B, Concept C",
      "explanation": "A is foundational, B builds on A, and C requires both",
      "difficulty": "medium",
      "points": 10,
      "bloom_level": "analyze",
      "page_reference": 4
    },
    {
      "question": "Match each term with its correct definition",
      "type": "matching",
      "options": ["Term 1", "Term 2", "Term 3"],
      "correct_answer": "{\\"Term 1\\": \\"Definition 1\\", \\"Term 2\\": \\"Definition 2\\", \\"Term 3\\": \\"Definition 3\\"}",
      "explanation": "Each term maps to its definition as taught in the lesson",
      "difficulty": "easy",
      "points": 10,
      "bloom_level": "remember",
      "metadata": {"matches": {"Term 1": "Definition 1", "Term 2": "Definition 2", "Term 3": "Definition 3"}},
      "page_reference": 2
    }
  ],
  "concept_map": [
    {"concept_id": "basic_concept", "label": "Basic Concept", "prerequisite_ids": []},
    {"concept_id": "intermediate_concept", "label": "Intermediate Concept", "prerequisite_ids": ["basic_concept"]},
    {"concept_id": "advanced_concept", "label": "Advanced Concept", "prerequisite_ids": ["basic_concept", "intermediate_concept"]}
  ],
  "learning_path": ["basic_concept", "intermediate_concept", "advanced_concept"]
}

RULES:
- Generate exactly {quizQuestionCount} final_quiz_questions covering material from across ALL pages
- Mix all question types: mcq, true_false, short_answer, ordering, matching
- Each question MUST have bloom_level: remember, understand, apply, analyze, evaluate, or create
- For mcq: exactly 4 plausible options. For true_false: ["True", "False"]. For short_answer: no options array
- For ordering: provide 3-6 items as options; correct_answer is comma-separated correct order
- For matching: options = terms, include metadata.matches, correct_answer = JSON mapping
- difficulty must be "beginner", "intermediate", or "advanced" (for the lesson-level field)
- Question difficulty must be "easy", "medium", or "hard"
- The quiz should test comprehensive understanding, not just recall from a single page
- concept_map should show how the key concepts from ALL pages relate to each other
- learning_path should list concept_ids in recommended learning order

Respond ONLY with the JSON object.`;

// ---- Check questions prompt (separate pass for chunked mode) ----

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

// splitTextIntoChunks() has been replaced by buildSmartChunks() + splitAtParagraphs()

/**
 * Call Gemini with retries and rate-limit handling.
 */
async function callGeminiWithRetry(
  prompt: string,
  config: GeminiConfig,
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

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${label}] Attempt ${attempt}/${maxRetries}...`);

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (!responseText) {
        throw new Error('Gemini returned an empty response');
      }

      console.log(`[${label}] Received response (${responseText.length} chars)`);
      return responseText;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[${label}] Attempt ${attempt} failed:`, lastError.message);

      if (
        lastError.message.includes('429') ||
        lastError.message.includes('RATE_LIMIT') ||
        lastError.message.includes('Resource has been exhausted')
      ) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[${label}] Rate limited. Waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt;
        console.log(`[${label}] Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      }
    }
  }

  throw new Error(`[${label}] Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

/**
 * Generate pages from a text chunk.
 */
async function generatePagesFromChunk(
  chunkText: string,
  chunkIndex: number,
  totalChunks: number,
  startPage: number,
  targetPages: number,
  targetLevel: string,
  previousContext: string = '',
  sectionTitles: string[] = []
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

  const config = getGeminiConfig('content_generation', targetPages * 3000);
  const responseText = await callGeminiWithRetry(prompt, config, 3, `Gemini-Chunk-${chunkIndex + 1}`);
  const parsed = parseGeminiResponse(responseText);

  if (!parsed.pages || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    throw new Error(`Chunk ${chunkIndex + 1} returned no pages`);
  }

  // Re-number pages to ensure correct sequence
  parsed.pages.forEach((page: GeminiPagedLessonResponse['pages'][0], i: number) => {
    page.page_number = startPage + i;
  });

  return { pages: parsed.pages };
}

/**
 * Generate final quiz and metadata from all page summaries.
 */
async function generateFinalQuizAndMeta(
  pages: GeminiPagedLessonResponse['pages'],
  targetLevel: string
): Promise<{
  title: string;
  description: string;
  learning_objectives: string[];
  summary: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  final_quiz_questions: GeminiPagedLessonResponse['final_quiz_questions'];
}> {
  // Dynamic quiz question count based on page count
  const quizQuestionCount = Math.max(8, Math.min(15, Math.ceil(pages.length * 1.5)));

  // Build a rich overview of all pages for the quiz prompt
  const pagesOverview = pages
    .map((p) => {
      const concepts = p.key_concepts.map((c) => `${c.term}: ${c.definition}`).join('; ');
      const contentPreview = p.content_blocks
        .filter((b) => b.type === 'text' || b.type === 'key_concepts' || b.type === 'summary')
        .map((b) => b.content)
        .join(' ')
        .substring(0, 800);

      const misconceptions = p.common_misconceptions?.join(', ') || '';

      return `Page ${p.page_number}: "${p.title}"
Key concepts: ${concepts}
Content: ${contentPreview}
${misconceptions ? `Common misconceptions: ${misconceptions}` : ''}`;
    })
    .join('\n---\n');

  const prompt = FINAL_QUIZ_PROMPT
    .replace('{targetLevel}', targetLevel)
    .replace('{totalPages}', String(pages.length))
    .replace('{pagesOverview}', pagesOverview)
    .replace(/\{quizQuestionCount\}/g, String(quizQuestionCount));

  const quizTokenBudget = Math.max(4096, pages.length * 600);
  const config = getGeminiConfig('metadata_generation', quizTokenBudget);
  const responseText = await callGeminiWithRetry(prompt, config, 3, 'Gemini-FinalQuiz');
  const parsed = parseGeminiResponse(responseText);

  if (!parsed.title || !parsed.final_quiz_questions) {
    throw new Error('Final quiz generation returned incomplete data');
  }

  return parsed;
}

/**
 * Generate check questions for a batch of pages (separate pass for better quality).
 */
async function generateCheckQuestionsForPages(
  pages: GeminiPagedLessonResponse['pages'],
  targetLevel: string,
  questionsPerPage: number = 3
): Promise<Map<number, GeminiPagedLessonResponse['pages'][0]['check_questions']>> {
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

  const config = getGeminiConfig('quiz_generation', pages.length * 1500);
  const responseText = await callGeminiWithRetry(prompt, config, 3, 'Gemini-CheckQuestions');
  const parsed = parseGeminiResponse(responseText);

  const questionsMap = new Map<number, GeminiPagedLessonResponse['pages'][0]['check_questions']>();
  for (const pageQ of parsed.page_questions || []) {
    questionsMap.set(pageQ.page_number, pageQ.questions);
  }

  return questionsMap;
}

/**
 * Analyze a large document using smart chunked generation.
 */
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

  // Step 3: Analyze each chunk for dynamic page count
  const chunkStructures = smartChunks.map(c => analyzeDocumentStructure(c.text));
  const chunkPageBudgets = chunkStructures.map(s => calculateDynamicPageCount(s));

  const totalTargetPages = chunkPageBudgets.reduce((sum, b) => sum + b.targetPages, 0);
  console.log(`[Gemini] Chunked mode: ${smartChunks.length} chunks, total target pages: ${totalTargetPages}`);

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

      // Build context for next chunk (last 3 pages)
      previousContext = allPages
        .slice(-3)
        .map(p => `Page ${p.page_number} "${p.title}": ${
          p.content_blocks
            .filter(b => b.type === 'summary' || b.type === 'text')
            .map(b => b.content)
            .join(' ')
            .substring(0, 200)
        }`)
        .join('\n');

      if (previousContext) {
        previousContext = `CONTEXT FROM PREVIOUS SECTIONS (do NOT repeat this content, build on it):\n${previousContext}\n`;
      }

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

  // Step 5: Generate check questions in batches (separate pass for better quality)
  console.log(`[Gemini] Generating check questions for ${allPages.length} pages...`);
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
      console.error(`[Gemini] Check question generation failed for pages ${i + 1}-${i + batch.length}:`, error);
      // Keep existing check questions from chunk generation as fallback
    }
    if (i + PAGES_PER_QUIZ_BATCH < allPages.length) {
      await sleep(500);
    }
  }

  console.log(`[Gemini] Generated ${allPages.length} pages total. Now generating final quiz...`);

  // Step 6: Generate final quiz and metadata with rich context
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

/**
 * Analyze a single section of a larger document and generate a complete lesson.
 * Used by the course generation endpoint to create one lesson per section.
 */
export async function analyzeSectionAsLesson(
  sectionText: string,
  options: {
    targetLevel: string;
    sectionTitle: string;
    sectionIndex: number;
    totalSections: number;
    previousSectionContext?: string;
  }
): Promise<GeminiPagedLessonResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const structure = analyzeDocumentStructure(sectionText);
  const { targetPages, minPages, maxPages, outputTokens } = calculateDynamicPageCount(structure);

  console.log(`[Gemini-Section-${options.sectionIndex + 1}] "${options.sectionTitle}" - ` +
    `${structure.wordCount} words, target ${targetPages} pages`);

  // For large sections, use chunked generation
  if (sectionText.length > CHUNKED_THRESHOLD || targetPages > 12) {
    return analyzeDocumentChunked(sectionText, { targetLevel: options.targetLevel });
  }

  // Single-call generation with section context
  const contextPreamble = options.previousSectionContext
    ? `\nCONTEXT: This is section ${options.sectionIndex + 1} of ${options.totalSections} in a larger course. ` +
      `Previous section context (do NOT repeat, build on it):\n${options.previousSectionContext}\n`
    : '';

  const prompt = ANALYSIS_PROMPT
    .replace('{targetLevel}', options.targetLevel)
    .replace('{documentText}', contextPreamble + sectionText)
    .replace(/\{wordCount\}/g, String(structure.wordCount))
    .replace(/\{targetPages\}/g, String(targetPages))
    .replace(/\{minPages\}/g, String(minPages))
    .replace(/\{maxPages\}/g, String(maxPages));

  const config = getGeminiConfig('content_generation', outputTokens);
  const responseText = await callGeminiWithRetry(
    prompt, config, 3, `Gemini-Section-${options.sectionIndex + 1}`
  );
  const parsed = parseGeminiResponse(responseText);
  validateResponse(parsed);
  return parsed;
}

/**
 * Analyze a document and generate a multi-page lesson using Gemini AI.
 * Automatically uses chunked generation for large documents.
 */
export async function analyzeDocument(
  text: string,
  options: { targetLevel: string }
): Promise<GeminiPagedLessonResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. Please add it to .env.local'
    );
  }

  if (!text || text.trim().length < 50) {
    throw new Error(
      'Document text is too short to analyze. Please provide a document with more content.'
    );
  }

  // ---- Analyze document structure and calculate page budget ----
  const maxChars = 500_000;
  const truncatedText =
    text.length > maxChars
      ? text.substring(0, maxChars) + '\n\n[Document truncated for processing]'
      : text;

  const structure = analyzeDocumentStructure(truncatedText);
  const { targetPages, minPages, maxPages, outputTokens } = calculateDynamicPageCount(structure);

  console.log(`[Gemini] Document structure: ${structure.estimatedTopicCount} topics, ` +
    `${structure.wordCount} words, density=${structure.informationDensity}`);
  console.log(`[Gemini] Page budget: target=${targetPages}, range=${minPages}-${maxPages}, ` +
    `outputTokens=${outputTokens}`);

  // Route to chunked mode for large documents or high page counts
  if (text.length > CHUNKED_THRESHOLD || targetPages > 12 || outputTokens > 32768) {
    console.log(`[Gemini] Routing to chunked generation (chars=${text.length}, targetPages=${targetPages}).`);
    return analyzeDocumentChunked(text, options);
  }

  // ---- Single-call approach for small/medium documents ----
  const geminiConfig = getGeminiConfig('content_generation', outputTokens);
  const model = genAI.getGenerativeModel({
    model: geminiConfig.model,
    generationConfig: {
      temperature: geminiConfig.temperature,
      topP: geminiConfig.topP,
      maxOutputTokens: geminiConfig.maxOutputTokens,
      responseMimeType: geminiConfig.responseMimeType,
    },
  });

  const prompt = ANALYSIS_PROMPT
    .replace('{targetLevel}', options.targetLevel)
    .replace('{documentText}', truncatedText)
    .replace(/\{wordCount\}/g, String(structure.wordCount))
    .replace(/\{targetPages\}/g, String(targetPages))
    .replace(/\{minPages\}/g, String(minPages))
    .replace(/\{maxPages\}/g, String(maxPages));

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Gemini] Attempt ${attempt}/${maxRetries} - Analyzing document (${truncatedText.length} chars)...`
      );

      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error('Gemini returned an empty response');
      }

      console.log(`[Gemini] Received response (${responseText.length} chars)`);

      // Parse the JSON response
      const parsed = parseGeminiResponse(responseText);

      // Validate the parsed response has required fields
      validateResponse(parsed);

      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Gemini] Attempt ${attempt} failed:`, lastError.message);

      if (
        lastError.message.includes('429') ||
        lastError.message.includes('RATE_LIMIT') ||
        lastError.message.includes('Resource has been exhausted')
      ) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[Gemini] Rate limited. Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
        continue;
      }

      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt;
        console.log(`[Gemini] Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
    }
  }

  throw new Error(
    `Failed to analyze document after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGeminiResponse(responseText: string): any {
  let cleanText = responseText.trim();

  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }

  cleanText = cleanText.trim();

  // First try direct parsing
  try {
    return JSON.parse(cleanText);
  } catch {
    // JSON is truncated — try to recover
    console.warn('[Gemini] JSON parse failed, attempting truncated JSON recovery...');
  }

  // Recovery: try to fix common truncation issues
  const recovered = recoverTruncatedJson(cleanText);
  if (recovered) {
    console.log('[Gemini] Successfully recovered truncated JSON');
    return recovered;
  }

  console.error('[Gemini] JSON recovery failed. First 500 chars:', cleanText.substring(0, 500));
  throw new Error('Failed to parse Gemini response as JSON (truncated output, recovery failed)');
}

/**
 * Attempt to recover a truncated JSON response by closing open structures.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recoverTruncatedJson(text: string): any | null {
  // Strategy 1: Try recoverLastCompletePage first (most reliable for truncated pages)
  const pageRecovery = recoverLastCompletePage(text);
  if (pageRecovery && pageRecovery.pages && pageRecovery.pages.length > 0) {
    return pageRecovery;
  }

  // Strategy 2: remove the last incomplete element, then close all open brackets
  let attempt = text;

  // Remove trailing incomplete string (unterminated)
  // Find the last complete key-value pair or array element
  const lastCompleteComma = attempt.lastIndexOf(',');
  const lastCompleteBrace = Math.max(attempt.lastIndexOf('}'), attempt.lastIndexOf(']'));

  if (lastCompleteComma > lastCompleteBrace) {
    // Truncated mid-element, cut at the last comma
    attempt = attempt.substring(0, lastCompleteComma);
  } else if (lastCompleteBrace > 0) {
    // Cut after the last complete brace
    attempt = attempt.substring(0, lastCompleteBrace + 1);
  }

  // Count open/close brackets and close any open ones
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of attempt) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }

  // Close any unclosed strings
  if (inString) {
    attempt += '"';
  }

  // Close open brackets/braces
  while (openBrackets > 0) {
    attempt += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    attempt += '}';
    openBraces--;
  }

  try {
    return JSON.parse(attempt);
  } catch {
    // Try a more aggressive recovery: find the last complete page
    return recoverLastCompletePage(text);
  }
}

/**
 * Last-resort recovery: extract whatever complete pages exist from truncated JSON.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recoverLastCompletePage(text: string): any | null {
  try {
    // Try to find the "pages" array and extract complete page objects
    const pagesMatch = text.match(/"pages"\s*:\s*\[/);
    if (!pagesMatch || pagesMatch.index === undefined) return null;

    const pagesStart = pagesMatch.index + pagesMatch[0].length;

    // Find complete page objects (each ends with })
    const pageObjects: string[] = [];
    let depth = 0;
    let currentStart = pagesStart;
    let inStr = false;
    let esc = false;

    for (let i = pagesStart; i < text.length; i++) {
      const ch = text[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;

      if (ch === '{') {
        if (depth === 0) currentStart = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          pageObjects.push(text.substring(currentStart, i + 1));
        }
      }
    }

    if (pageObjects.length === 0) return null;

    // Parse each complete page
    const pages = pageObjects
      .map((po) => {
        try { return JSON.parse(po); } catch { return null; }
      })
      .filter(Boolean);

    if (pages.length === 0) return null;

    console.log(`[Gemini] Recovered ${pages.length} complete pages from truncated response`);

    // Build a minimal valid response with what we have
    // Extract title/description if available
    const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/);
    const descMatch = text.match(/"description"\s*:\s*"([^"]+)"/);

    return {
      title: titleMatch?.[1] ?? 'Generated Lesson',
      description: descMatch?.[1] ?? 'Lesson generated from uploaded document.',
      learning_objectives: ['Understand the key concepts covered in this lesson'],
      pages,
      summary: 'This lesson covers the topics from the uploaded document.',
      final_quiz_questions: [],
      difficulty: 'intermediate',
      estimated_duration_minutes: pages.length * 5,
    };
  } catch {
    return null;
  }
}

function validateResponse(response: GeminiPagedLessonResponse): void {
  if (!response.title) throw new Error('Missing required field: title');
  if (!response.description) throw new Error('Missing required field: description');
  if (!Array.isArray(response.learning_objectives) || response.learning_objectives.length === 0) {
    throw new Error('Must include at least one learning objective');
  }
  if (!Array.isArray(response.pages) || response.pages.length < 1) {
    throw new Error('Must include at least 1 page');
  }
  // Filter out invalid pages and patch missing fields (common in recovered truncated responses)
  response.pages = response.pages.filter((page, idx) => {
    if (!page || typeof page !== 'object') return false;
    if (!page.title) page.title = `Page ${idx + 1}`;
    if (!page.page_number) page.page_number = idx + 1;
    if (!Array.isArray(page.content_blocks) || page.content_blocks.length < 1) return false;
    if (!Array.isArray(page.check_questions)) page.check_questions = [];
    if (!Array.isArray(page.key_concepts)) page.key_concepts = [];
    if (!page.teaching_flow) page.teaching_flow = { introduction: '', core_explanation: '', practice_hint: '', reflection_prompt: '' };
    if (!page.difficulty_level) page.difficulty_level = 'intermediate';
    if (!Array.isArray(page.prerequisites)) page.prerequisites = [];
    if (!Array.isArray(page.concepts_introduced)) page.concepts_introduced = [];
    if (!Array.isArray(page.common_misconceptions)) page.common_misconceptions = [];
    if (!Array.isArray(page.real_world_applications)) page.real_world_applications = [];
    return true;
  });
  if (response.pages.length < 1) {
    throw new Error('No valid pages after filtering');
  }
  if (!response.summary) throw new Error('Missing required field: summary');
  // Final quiz can be empty for chunked responses (generated separately)
  if (!Array.isArray(response.final_quiz_questions)) {
    response.final_quiz_questions = [];
  }
  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (!validDifficulties.includes(response.difficulty)) {
    response.difficulty = 'intermediate'; // Default if missing
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Generative Lesson Creation — from outline (topic + key points)
// ============================================================

const GENERATIVE_LESSON_PROMPT = `You are an expert educational content creator and instructional designer. Your task is to CREATE a complete, detailed lesson from scratch based on a topic and detailed key points provided below.

IMPORTANT: You are NOT analyzing an existing document. You are GENERATING original educational content. The lesson should be comprehensive, accurate, well-structured, and engaging for adult learners.

LESSON TOPIC: {lessonTitle}

DETAILED KEY POINTS TO COVER:
{keyPoints}

IMPORTANT — KEY POINTS CONTAIN CONTEXT: Each key point may include specific details, frameworks, tool names, examples, or angles that MUST be reflected in your lesson content. Do NOT ignore the details after the colon — they tell you exactly what to teach and how to frame it. For example:
- "Common mistakes: being vague, no context, asking multiple things" means you MUST cover these specific mistakes, not generic ones.
- "Key tools: ChatGPT, Claude" means you MUST mention and explain these specific tools.
- If a key point says "RCTF framework" you MUST teach that specific framework.
Use the details as your content blueprint — expand on them with explanations, examples, and practice exercises.

LANGUAGE: Write the ENTIRE lesson in {language}. All content, questions, explanations, titles — everything must be in {language}.

TARGET DURATION: exactly 15 minutes of learning time.

CRITICAL PAGE LIMIT: Generate EXACTLY 5 pages. Not more, not less. Do NOT exceed 5 pages under any circumstances.
Each page takes ~3 minutes (reading + understanding + answering check questions). 5 pages × 3 min = 15 min.

{previousContext}

INSTRUCTIONS:
- Create EXACTLY 5 pages. This is a hard limit — never generate more than 5 pages.
- Each page covers ONE coherent subtopic derived from the key points.
- Distribute ALL the key points across exactly 5 pages — combine related points on the same page if needed.
- Each page should have 200-300 words of teaching material (not more).
- HONOR THE SPECIFICS in key points — if they mention specific tools, frameworks, numbers, or examples, USE them. Do not substitute with generic alternatives.
- Use real-world examples, practical scenarios, and concrete explanations.
- Build knowledge progressively — start with foundations, end with synthesis.
- Make the content engaging and practical, not dry textbook material.
- Keep content concise and focused — quality over quantity.

CONTENT BLOCK TYPES — Use a VARIETY (at least 3 different types per page):
- "heading": Page/section title
- "text": Explanatory paragraphs (use markdown formatting)
- "definition": Key terms. Set metadata.term
- "example": Worked examples. Set metadata.title
- "analogy": Relatable comparisons for abstract concepts
- "code": Code/commands if relevant
- "table": Comparisons. Set metadata.headers (string[]) and metadata.rows (string[][])
- "list": Lists. Set metadata.ordered (boolean)
- "step_by_step": Procedures. Set metadata.steps (string[])
- "tip": Best practices
- "warning": Common mistakes/pitfalls
- "diagram_description": Visual descriptions
- "callout": Important notes
- "summary": Page summaries

PEDAGOGICAL REQUIREMENTS per page:
- "teaching_flow": {"introduction": "hook + connection to previous", "core_explanation": "main concept label", "practice_hint": "what to try", "reflection_prompt": "metacognitive question"}
- "difficulty_level": "foundational" | "intermediate" | "advanced" | "synthesis"
- "prerequisites": concept_ids from previous pages (empty for page 1)
- "concepts_introduced": new concept_ids taught on this page
- "bridge_from_previous": transition from prior page (null for page 1)
- "common_misconceptions": typical misunderstandings
- "real_world_applications": practical uses

CHECK QUESTIONS (per page):
- 2 questions per page testing THAT page's content.
- Types: mcq, true_false, ordering, fill_in_blank, matching
- Each MUST include "bloom_level": remember | understand | apply | analyze
- For mcq: exactly 4 plausible options. For true_false: ["True", "False"]. For ordering: 3-6 items, correct_answer comma-separated.
- For matching: options = terms, metadata.matches = {"term": "definition"}, correct_answer = JSON mapping.

FINAL QUIZ: 5-8 questions covering the whole lesson.
- Mix of types. Each with bloom_level. Points: 10.
- Bloom distribution: 15% remember, 25% understand, 25% apply, 20% analyze, 15% evaluate/create.

Respond with this exact JSON structure:
{
  "title": "Lesson title in {language}",
  "description": "2-3 sentence description",
  "learning_objectives": ["Students will be able to..."],
  "pages": [
    {
      "page_number": 1,
      "title": "Page title",
      "content_blocks": [
        {"type": "heading", "content": "..."},
        {"type": "text", "content": "..."},
        {"type": "example", "content": "...", "metadata": {"title": "..."}}
      ],
      "key_concepts": [{"term": "...", "definition": "..."}],
      "teaching_flow": {"introduction": "...", "core_explanation": "...", "practice_hint": "...", "reflection_prompt": "..."},
      "prerequisites": [],
      "concepts_introduced": ["concept_id"],
      "difficulty_level": "foundational",
      "bridge_from_previous": null,
      "common_misconceptions": ["..."],
      "real_world_applications": ["..."],
      "check_questions": [
        {"question": "...", "type": "mcq", "options": ["A","B","C","D"], "correct_answer": "A", "explanation": "...", "difficulty": "easy", "points": 5, "bloom_level": "remember"}
      ]
    }
  ],
  "summary": "3-5 sentence lesson summary",
  "final_quiz_questions": [
    {"question": "...", "type": "mcq", "options": ["A","B","C","D"], "correct_answer": "A", "explanation": "...", "difficulty": "medium", "points": 10, "bloom_level": "apply"}
  ],
  "concept_map": [{"concept_id": "...", "label": "...", "prerequisite_ids": []}],
  "learning_path": ["concept_id_1", "concept_id_2"],
  "difficulty": "beginner",
  "estimated_duration_minutes": 15
}

Respond ONLY with the JSON object. No additional text.`;

/**
 * Generate a lesson from scratch given a topic and key points.
 * Used for the outline-based course creation flow.
 */
export async function generateLessonFromOutline(options: {
  lessonTitle: string;
  keyPoints: string[];
  language: string;
  lessonIndex: number;
  totalLessons: number;
  previousLessonContext?: string;
}): Promise<GeminiPagedLessonResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const keyPointsFormatted = options.keyPoints
    .map((kp, i) => `${i + 1}. ${kp}`)
    .join('\n');

  const contextBlock = options.previousLessonContext
    ? `\nCONTEXT: This is lesson ${options.lessonIndex + 1} of ${options.totalLessons} in a course.\n` +
      `Previous lessons covered (do NOT repeat — build on this knowledge):\n${options.previousLessonContext}\n`
    : '';

  const prompt = GENERATIVE_LESSON_PROMPT
    .replace(/\{lessonTitle\}/g, options.lessonTitle)
    .replace(/\{keyPoints\}/g, keyPointsFormatted)
    .replace(/\{language\}/g, options.language)
    .replace(/\{previousContext\}/g, contextBlock);

  // 5 pages with pedagogical fields, check questions, examples, final quiz.
  // Georgian/non-Latin text uses ~2x more tokens per word.
  // ~5000 tokens per page + 4000 for quiz/metadata = ~29k. Cap at 32k to prevent over-generation.
  const outputTokens = 32_768;
  const config = getGeminiConfig('content_generation', outputTokens);

  console.log(`[Gemini-Generate-${options.lessonIndex + 1}] "${options.lessonTitle}" — ` +
    `${options.keyPoints.length} key points, language=${options.language}, tokens=${outputTokens}`);

  const responseText = await callGeminiWithRetry(
    prompt, config, 3, `Gemini-Generate-${options.lessonIndex + 1}`
  );

  const parsed = parseGeminiResponse(responseText);
  validateResponse(parsed);
  return parsed;
}
