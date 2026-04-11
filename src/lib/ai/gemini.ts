// ============================================================
// Gemini AI Client — Document Analysis for Lesson Generation
// Single entry points:
//   - analyzeDocument            PDF → multi-page lesson
//   - analyzeSectionAsLesson     section of a larger course
//   - generateLessonFromOutline  topic + key points → lesson
//   - extractDocumentOutline     detect sections for course flow
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { GeminiPagedLessonResponse } from '@/types';
import {
  ANALYSIS_PROMPT,
  CHUNK_PAGES_PROMPT,
  FINAL_QUIZ_PROMPT,
  GENERATIVE_LESSON_PROMPT,
  REVIEW_PROMPT,
  SYLLABUS_PARSER_PROMPT,
  LESSON_EXPANDER_PROMPT,
  GOLD_STANDARD_PAGE_EXAMPLE_EN,
  GOLD_STANDARD_PAGE_EXAMPLE_KA,
} from './prompts';
import {
  geminiLessonResponseSchema,
  geminiChunkResponseSchema,
  geminiFinalQuizResponseSchema,
  geminiOutlineResponseSchema,
  geminiReviewResponseSchema,
  geminiSyllabusResponseSchema,
  geminiLessonExpansionResponseSchema,
  type GeminiSyllabusResponseZ,
  type GeminiLessonExpansionResponseZ,
  type SubLessonSpec,
} from './gemini-schema';

export type { GeminiSyllabusResponseZ, GeminiLessonExpansionResponseZ, SubLessonSpec };

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const anthropic = new Anthropic();

// ============================================================
// LLM provider selection
// Course generation supports two providers so the admin can
// compare quality head-to-head. All pipeline functions accept
// an `LLMProvider` arg that routes the underlying API call.
// ============================================================
export type LLMProvider = 'gemini' | 'claude';
const DEFAULT_PROVIDER: LLMProvider = 'gemini';

const CLAUDE_CONTENT_MODEL = process.env.CLAUDE_CONTENT_MODEL ?? 'claude-sonnet-4-5-20250929';
const CLAUDE_FAST_MODEL = process.env.CLAUDE_FAST_MODEL ?? 'claude-sonnet-4-5-20250929';

const CHUNKED_THRESHOLD = 60_000;
const MAX_CHUNK_SIZE = 60_000;
const MAX_DOCUMENT_CHARS = 500_000;

// Quality review: if generated lesson scores below this, regenerate once.
const QUALITY_THRESHOLD = 9;
// Set GEMINI_SKIP_REVIEW=1 to disable the self-review pass (faster, cheaper).
const SKIP_REVIEW = process.env.GEMINI_SKIP_REVIEW === '1';

// Few-shot example picker: select the example in the target language
// so Gemini sees native-language output as the gold standard to imitate.
function pickFewShotExample(language: string): string {
  const lower = language.toLowerCase();
  if (lower.includes('georgian') || lower.includes('ქართულ') || lower === 'ka') {
    return GOLD_STANDARD_PAGE_EXAMPLE_KA;
  }
  return GOLD_STANDARD_PAGE_EXAMPLE_EN;
}

// ============================================================
// Config
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

// gemini-2.0-flash caps output at ~8192 tokens, which is not enough for a
// 5-page Georgian lesson (Georgian uses ~2-3x more tokens per char than
// English, so content gets truncated mid-string). Content generation uses
// gemini-2.5-flash which supports up to 65536 output tokens. Other tasks
// (outline extraction, review, quiz) stay on the cheaper 2.0-flash.
// Override either via env if needed.
const CONTENT_MODEL = process.env.GEMINI_CONTENT_MODEL ?? 'gemini-2.5-flash';
const FAST_MODEL = process.env.GEMINI_FAST_MODEL ?? 'gemini-2.0-flash';

function getGeminiConfig(task: GeminiTask, dynamicTokenBudget?: number): GeminiConfig {
  switch (task) {
    case 'content_generation':
      return {
        model: CONTENT_MODEL,
        temperature: 0.35,
        topP: 0.85,
        maxOutputTokens: dynamicTokenBudget ?? 32_768,
        responseMimeType: 'application/json',
      };
    case 'outline_extraction':
      return {
        model: FAST_MODEL,
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 4_096,
        responseMimeType: 'application/json',
      };
    case 'quiz_generation':
      return {
        model: CONTENT_MODEL,
        temperature: 0.4,
        topP: 0.85,
        maxOutputTokens: dynamicTokenBudget ?? 16_384,
        responseMimeType: 'application/json',
      };
    case 'metadata_generation':
      return {
        model: FAST_MODEL,
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: dynamicTokenBudget ?? 8_192,
        responseMimeType: 'application/json',
      };
  }
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
  informationDensity: 'low' | 'medium' | 'high';
}

function analyzeDocumentStructure(text: string): DocumentStructure {
  const lines = text.split('\n');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // Rough heading detection — script-agnostic (markdown # or numbered multi-level)
  const headingPatterns = /^(?:#{1,6}\s+.+|(?:\d+\.){1,}\s+.{3,})/;
  const headings = lines.filter((l) => headingPatterns.test(l.trim()));
  const headingCount = Math.max(headings.length, 1);

  const estimatedTopicCount = Math.max(headingCount, Math.ceil(paragraphCount / 6));
  const avgWordsPerSection = Math.round(wordCount / headingCount);

  const codeBlocks = text.match(/```[\s\S]*?```|`[^`]+`/g) || [];
  const codeBlockCount = codeBlocks.length;
  const hasCodeBlocks = codeBlockCount > 0;

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
    informationDensity,
  };
}

interface PageBudget {
  targetPages: number;
  minPages: number;
  maxPages: number;
  outputTokens: number;
}

function calculateDynamicPageCount(structure: DocumentStructure): PageBudget {
  const wordBasedPages = Math.ceil(structure.wordCount / 200);
  let targetPages = Math.min(structure.estimatedTopicCount, wordBasedPages);

  if (structure.avgWordsPerSection > 1500) targetPages = Math.ceil(targetPages * 1.3);
  if (structure.codeBlockCount > 5) targetPages += Math.ceil(structure.codeBlockCount / 4);
  if (structure.informationDensity === 'high') targetPages = Math.ceil(targetPages * 1.2);
  else if (structure.informationDensity === 'low') targetPages = Math.ceil(targetPages * 0.8);

  targetPages = Math.max(2, Math.min(15, targetPages));
  const minPages = Math.max(2, Math.floor(targetPages * 0.8));
  const maxPages = Math.min(25, Math.ceil(targetPages * 1.2));

  const tokensPerPage = 3000;
  const overheadTokens = 1000;
  const outputTokens = Math.min(65_536, Math.max(16_384, targetPages * tokensPerPage + overheadTokens));

  return { targetPages, minPages, maxPages, outputTokens };
}

// ============================================================
// Document Outline (Gemini-only, script-agnostic)
// ============================================================

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
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const sampleText =
    text.length > 10_000
      ? text.substring(0, 5_000) + '\n\n[...]\n\n' + text.substring(text.length - 5_000)
      : text;

  const prompt = `Analyze this document's structure and return a JSON array of sections.
Each section: { "title": string, "start_marker": first ~20 chars of the section }.
Identify MAJOR sections only (chapters, main headings), not every paragraph.
Write titles in the SAME language as the source document.

Document:
---
${sampleText}
---

Respond ONLY with: {"sections": [{"title": "...", "start_marker": "..."}]}`;

  try {
    const config = getGeminiConfig('outline_extraction');
    const parsed = await callGeminiForJson(
      prompt,
      config,
      geminiOutlineResponseSchema,
      'Gemini-Outline',
      2
    );

    const mapped: DocumentOutline['sections'] = [];
    for (const s of parsed.sections) {
      const idx = text.indexOf(s.start_marker);
      if (idx >= 0) {
        mapped.push({
          title: s.title,
          startIndex: idx,
          endIndex: text.length,
          estimatedWordCount: 0,
          topicSummary: '',
        });
      }
    }
    for (let i = 0; i < mapped.length - 1; i++) {
      mapped[i].endIndex = mapped[i + 1].startIndex;
    }
    for (const s of mapped) {
      s.estimatedWordCount = text.substring(s.startIndex, s.endIndex).split(/\s+/).filter(Boolean).length;
    }

    if (mapped.length > 0) {
      return { sections: mapped, totalSections: mapped.length };
    }
  } catch (error) {
    console.warn('[Gemini] Outline extraction failed, using single-section fallback:', error);
  }

  return {
    sections: [
      {
        title: 'Full Document',
        startIndex: 0,
        endIndex: text.length,
        estimatedWordCount: text.split(/\s+/).filter(Boolean).length,
        topicSummary: '',
      },
    ],
    totalSections: 1,
  };
}

// ============================================================
// Paragraph-based Chunking
// ============================================================

function splitIntoChunks(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf('\n\n', maxSize);
    if (splitAt < maxSize * 0.5) splitAt = remaining.lastIndexOf('\n', maxSize);
    if (splitAt < maxSize * 0.5) splitAt = maxSize;
    chunks.push(remaining.substring(0, splitAt).trim());
    remaining = remaining.substring(splitAt).trim();
  }

  return chunks.filter((c) => c.length > 100);
}

// ============================================================
// Core Gemini Call — with JSON parse + Zod validation + retry
// ============================================================

function stripFences(text: string): string {
  let t = text.trim();
  if (t.startsWith('```json')) t = t.slice(7);
  else if (t.startsWith('```')) t = t.slice(3);
  if (t.endsWith('```')) t = t.slice(0, -3);
  return t.trim();
}

// ------------------------------------------------------------
// Lesson response normalizer
// Gemini (esp. 2.5) sometimes formats the JSON in ways that are
// valid JSON but don't match our strict schema:
//   - `content_blocks[].content` arrives as an array or object
//   - `correct_answer` on matching questions arrives as a raw object
//   - fields get omitted entirely
// This helper walks the parsed JSON and coerces common deviations into
// the expected shape BEFORE Zod validation so a single model quirk
// doesn't kill the whole generation.
// ------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

function normalizeContentBlock(block: any): any {
  if (!block || typeof block !== 'object') return block;

  // Content MUST be a string. Handle the common deviations.
  if (Array.isArray(block.content)) {
    const items = block.content.map((x: any) =>
      typeof x === 'string' ? x : typeof x === 'object' && x !== null ? JSON.stringify(x) : String(x)
    );
    if (block.type === 'step_by_step') {
      block.metadata = { ...(block.metadata || {}), steps: items };
      block.content = block.metadata?.title || 'Follow these steps:';
    } else if (block.type === 'list') {
      const ordered = block.metadata?.ordered ?? false;
      block.metadata = { ...(block.metadata || {}), items, ordered };
      block.content = items.map((s: string, i: number) => (ordered ? `${i + 1}. ${s}` : `- ${s}`)).join('\n');
    } else {
      block.content = items.map((s: string) => `- ${s}`).join('\n');
    }
  } else if (typeof block.content === 'object' && block.content !== null) {
    block.content = JSON.stringify(block.content);
  } else if (block.content == null) {
    block.content = '';
  } else if (typeof block.content !== 'string') {
    block.content = String(block.content);
  }

  return block;
}

function normalizeQuizQuestion(q: any): any | null {
  if (!q || typeof q !== 'object') return null;

  // correct_answer: stringify non-strings. Drop the question entirely if missing.
  if (q.correct_answer == null) {
    // Try to salvage matching questions from metadata.matches if present
    if (q.type === 'matching' && q.metadata?.matches && typeof q.metadata.matches === 'object') {
      q.correct_answer = JSON.stringify(q.metadata.matches);
    } else {
      return null; // unanswerable — drop it
    }
  } else if (typeof q.correct_answer === 'object') {
    q.correct_answer = JSON.stringify(q.correct_answer);
  } else if (typeof q.correct_answer !== 'string') {
    q.correct_answer = String(q.correct_answer);
  }

  // explanation: default if missing or wrong type
  if (typeof q.explanation !== 'string') {
    q.explanation = q.explanation != null ? String(q.explanation) : '';
  }

  // question: required — drop if missing
  if (typeof q.question !== 'string' || !q.question.trim()) return null;

  // type: default to mcq if missing
  if (typeof q.type !== 'string') q.type = 'mcq';

  // difficulty: enum — default to medium
  if (!['easy', 'medium', 'hard'].includes(q.difficulty)) q.difficulty = 'medium';

  // points: number — default to 5
  if (typeof q.points !== 'number') q.points = 5;

  return q;
}

function normalizePage(page: any): any {
  if (!page || typeof page !== 'object') return page;

  if (Array.isArray(page.content_blocks)) {
    page.content_blocks = page.content_blocks
      .map(normalizeContentBlock)
      .filter((b: any) => b && b.content); // drop blocks that are completely empty
  }

  if (Array.isArray(page.check_questions)) {
    page.check_questions = page.check_questions
      .map(normalizeQuizQuestion)
      .filter((q: any) => q !== null);
  }

  // bridge_from_previous: some responses use empty string; schema allows null
  if (page.bridge_from_previous === '') page.bridge_from_previous = null;

  return page;
}

function normalizeLessonResponse(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const obj = raw as Record<string, any>;

  if (Array.isArray(obj.pages)) {
    obj.pages = obj.pages.map(normalizePage);
  }

  if (Array.isArray(obj.final_quiz_questions)) {
    obj.final_quiz_questions = obj.final_quiz_questions
      .map(normalizeQuizQuestion)
      .filter((q: any) => q !== null);
  }

  return obj;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ------------------------------------------------------------
// Truncation recovery for lesson responses
// When Gemini hits its output-token ceiling mid-string, the JSON
// ends in an unterminated string and JSON.parse fails. This helper
// walks the `pages` array from the start and salvages every COMPLETE
// page object (matched braces), then builds a minimal valid lesson
// response around them so downstream code keeps working.
// ------------------------------------------------------------

function recoverTruncatedLessonJson(rawText: string): unknown | null {
  const cleaned = stripFences(rawText);

  // Locate the "pages" array opening bracket
  const pagesMatch = cleaned.match(/"pages"\s*:\s*\[/);
  if (!pagesMatch || pagesMatch.index === undefined) return null;

  const pagesStart = pagesMatch.index + pagesMatch[0].length;
  const pageObjects: unknown[] = [];
  let depth = 0;
  let currentStart = -1;
  let inStr = false;
  let esc = false;

  for (let i = pagesStart; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;

    if (ch === '{') {
      if (depth === 0) currentStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && currentStart >= 0) {
        const objStr = cleaned.substring(currentStart, i + 1);
        try {
          pageObjects.push(JSON.parse(objStr));
        } catch {
          // incomplete page object — skip it
        }
        currentStart = -1;
      }
    } else if (depth === 0 && ch === ']') {
      // end of pages array
      break;
    }
  }

  if (pageObjects.length === 0) return null;

  // Extract lesson-level metadata that appears BEFORE the pages array
  // using simple regex — since these are early in the JSON, they're
  // almost always present even in a truncated response.
  const titleMatch = cleaned.match(/"title"\s*:\s*"([^"]+)"/);
  const descMatch = cleaned.match(/"description"\s*:\s*"([^"]+)"/);
  const objectivesMatch = cleaned.match(/"learning_objectives"\s*:\s*\[([^\]]*)\]/);
  let learningObjectives: string[] = ['Master the concepts covered in this lesson'];
  if (objectivesMatch) {
    const strs = objectivesMatch[1].match(/"([^"]+)"/g);
    if (strs && strs.length > 0) {
      learningObjectives = strs.map((s) => s.slice(1, -1));
    }
  }

  console.warn(
    `[recoverTruncatedLessonJson] Salvaged ${pageObjects.length} complete pages from ` +
      `${cleaned.length}-char truncated response`
  );

  return {
    title: titleMatch?.[1] ?? 'Recovered lesson',
    description: descMatch?.[1] ?? 'Recovered from a truncated generation response.',
    learning_objectives: learningObjectives,
    pages: pageObjects,
    summary: 'Lesson recovered from a truncated Gemini response — final quiz will be regenerated separately if needed.',
    final_quiz_questions: [],
    difficulty: 'intermediate',
    estimated_duration_minutes: pageObjects.length * 3,
  };
}

async function callGeminiForJson<T>(
  prompt: string,
  config: GeminiConfig,
  schema: z.ZodType<T>,
  label: string,
  maxRetries = 3,
  recoveryFn?: (rawText: string) => unknown | null,
  normalizeFn?: (parsed: unknown) => unknown
): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: config.model,
    generationConfig: {
      temperature: config.temperature,
      topP: config.topP,
      maxOutputTokens: config.maxOutputTokens,
      responseMimeType: config.responseMimeType,
    },
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${label}] Attempt ${attempt}/${maxRetries}...`);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      if (!responseText) throw new Error('Gemini returned an empty response');

      console.log(`[${label}] Received response (${responseText.length} chars)`);
      const cleaned = stripFences(responseText);

      // Parse, with optional truncation recovery as a safety net.
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        if (recoveryFn) {
          const recovered = recoveryFn(cleaned);
          if (recovered) {
            console.warn(`[${label}] Used truncation recovery (attempt ${attempt})`);
            parsed = recovered;
          } else {
            throw parseErr;
          }
        } else {
          throw parseErr;
        }
      }

      // Optional normalization pass — coerce common shape deviations into
      // the strict schema shape. Must run BEFORE Zod so validation sees
      // the cleaned-up structure.
      if (normalizeFn) {
        parsed = normalizeFn(parsed);
      }

      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        throw new Error(`Schema validation failed: ${validated.error.message.substring(0, 500)}`);
      }
      return validated.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[${label}] Attempt ${attempt} failed:`, lastError.message);

      if (attempt >= maxRetries) break;

      const isRateLimit = /429|RATE_LIMIT|Resource has been exhausted/i.test(lastError.message);
      const waitTime = isRateLimit ? Math.pow(2, attempt) * 1000 : 1000 * attempt;
      console.log(`[${label}] Retrying in ${waitTime}ms...`);
      await sleep(waitTime);
    }
  }

  throw new Error(`[${label}] Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

// ============================================================
// Claude JSON caller — same contract as callGeminiForJson so
// both providers are drop-in swappable via callLLMForJson().
// ============================================================

type ClaudeTaskHint = 'heavy' | 'light';

function pickClaudeModel(task: ClaudeTaskHint): string {
  return task === 'heavy' ? CLAUDE_CONTENT_MODEL : CLAUDE_FAST_MODEL;
}

async function callClaudeForJson<T>(
  prompt: string,
  maxOutputTokens: number,
  schema: z.ZodType<T>,
  label: string,
  taskHint: ClaudeTaskHint,
  maxRetries = 3,
  recoveryFn?: (rawText: string) => unknown | null,
  normalizeFn?: (parsed: unknown) => unknown
): Promise<T> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
  }

  const model = pickClaudeModel(taskHint);
  // Claude Sonnet 4.5 supports up to 64k output tokens. Clamp to be safe.
  const maxTokens = Math.min(64_000, Math.max(1024, maxOutputTokens));

  const systemPrompt =
    'You respond ONLY with a single valid JSON object. No markdown code fences. ' +
    'No commentary before or after. Your entire response must be parseable as JSON.';

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${label}] (claude/${model}) Attempt ${attempt}/${maxRetries}...`);
      // Use the streaming helper to bypass the SDK's 10-minute non-streaming
      // cap (triggered automatically when max_tokens is high). `.finalMessage()`
      // still returns the complete Message object once streaming finishes, so
      // downstream parsing logic is unchanged.
      const stream = anthropic.messages.stream({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });
      const response = await stream.finalMessage();

      const firstBlock = response.content[0];
      const responseText =
        firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
      if (!responseText) throw new Error('Claude returned an empty response');

      console.log(`[${label}] Received response (${responseText.length} chars)`);
      const cleaned = stripFences(responseText);

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        if (recoveryFn) {
          const recovered = recoveryFn(cleaned);
          if (recovered) {
            console.warn(`[${label}] Used truncation recovery (attempt ${attempt})`);
            parsed = recovered;
          } else {
            throw parseErr;
          }
        } else {
          throw parseErr;
        }
      }

      if (normalizeFn) {
        parsed = normalizeFn(parsed);
      }

      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        throw new Error(`Schema validation failed: ${validated.error.message.substring(0, 500)}`);
      }
      return validated.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[${label}] Attempt ${attempt} failed:`, lastError.message);

      if (attempt >= maxRetries) break;

      const isRateLimit = /429|rate_limit|rate limit|overloaded/i.test(lastError.message);
      const waitTime = isRateLimit ? Math.pow(2, attempt) * 1000 : 1000 * attempt;
      console.log(`[${label}] Retrying in ${waitTime}ms...`);
      await sleep(waitTime);
    }
  }

  throw new Error(`[${label}] Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

// ============================================================
// Provider dispatcher — the one entry point pipeline code uses.
// Routes to Gemini or Claude based on the `provider` argument
// while presenting a single contract.
// ============================================================

async function callLLMForJson<T>(
  provider: LLMProvider,
  prompt: string,
  geminiConfig: GeminiConfig,
  schema: z.ZodType<T>,
  label: string,
  maxRetries = 3,
  recoveryFn?: (rawText: string) => unknown | null,
  normalizeFn?: (parsed: unknown) => unknown,
  claudeTaskHint: ClaudeTaskHint = 'heavy'
): Promise<T> {
  const providerLabel = `${label}/${provider}`;
  if (provider === 'claude') {
    return callClaudeForJson(
      prompt,
      geminiConfig.maxOutputTokens,
      schema,
      providerLabel,
      claudeTaskHint,
      maxRetries,
      recoveryFn,
      normalizeFn
    );
  }
  return callGeminiForJson(
    prompt,
    geminiConfig,
    schema,
    providerLabel,
    maxRetries,
    recoveryFn,
    normalizeFn
  );
}

// ============================================================
// Quality Review Pass (self-review)
// Gemini rates its own output on a 0-10 rubric. If score <
// QUALITY_THRESHOLD, the caller regenerates once.
// ============================================================

function detectLanguage(text: string): string {
  const sample = text.substring(0, 1000);
  const georgianChars = (sample.match(/[\u10A0-\u10FF]/g) || []).length;
  const cyrillicChars = (sample.match(/[\u0400-\u04FF]/g) || []).length;
  const latinChars = (sample.match(/[A-Za-z]/g) || []).length;

  if (georgianChars > latinChars && georgianChars > 20) return 'Georgian';
  if (cyrillicChars > latinChars && cyrillicChars > 20) return 'Russian or another Cyrillic language';
  return 'English';
}

async function reviewLessonQuality(
  lesson: GeminiPagedLessonResponse,
  language: string,
  provider: LLMProvider = DEFAULT_PROVIDER
): Promise<{ score: number; issues: string[] }> {
  const lessonSummary = lesson.pages.map((p) => ({
    page: p.page_number,
    title: p.title,
    concepts: p.key_concepts.map((c) => c.term),
    block_types: [...new Set(p.content_blocks.map((b) => b.type))],
    word_count: p.content_blocks.reduce((sum, b) => sum + b.content.split(/\s+/).length, 0),
    check_questions: p.check_questions.length,
  }));

  const contentSamples = lesson.pages
    .slice(0, 3)
    .map((p) =>
      p.content_blocks
        .filter((b) => b.type === 'text' || b.type === 'example' || b.type === 'definition')
        .map((b) => b.content)
        .join('\n')
    )
    .join('\n\n---\n\n')
    .substring(0, 3500);

  const prompt = REVIEW_PROMPT.replace('{language}', language)
    .replace('{lessonTitle}', lesson.title)
    .replace('{lessonSummary}', JSON.stringify(lessonSummary, null, 2))
    .replace('{contentSamples}', contentSamples);

  const config = getGeminiConfig('metadata_generation', 2048);
  return callLLMForJson(
    provider,
    prompt,
    config,
    geminiReviewResponseSchema,
    'Review',
    2,
    undefined,
    undefined,
    'light'
  );
}

async function withQualityCheck(
  generate: () => Promise<GeminiPagedLessonResponse>,
  language: string,
  label: string,
  provider: LLMProvider = DEFAULT_PROVIDER
): Promise<GeminiPagedLessonResponse> {
  const lesson = await generate();
  if (SKIP_REVIEW) return lesson;

  try {
    const review = await reviewLessonQuality(lesson, language, provider);
    console.log(
      `[${label}] Quality review: ${review.score}/10` +
        (review.issues.length > 0 ? ` — issues: ${review.issues.join('; ')}` : '')
    );
    if (review.score < QUALITY_THRESHOLD) {
      console.log(`[${label}] Score below ${QUALITY_THRESHOLD}, regenerating once...`);
      return await generate();
    }
  } catch (error) {
    console.warn(`[${label}] Quality review failed, keeping original lesson:`, error);
  }
  return lesson;
}

// ============================================================
// Single-Document Analysis (unified entry point)
// ============================================================

export async function analyzeDocument(
  text: string,
  options: { targetLevel: string; provider?: LLMProvider }
): Promise<GeminiPagedLessonResponse> {
  const provider = options.provider ?? DEFAULT_PROVIDER;
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to .env.local');
  }
  if (!text || text.trim().length < 50) {
    throw new Error('Document text is too short to analyze.');
  }

  const truncated =
    text.length > MAX_DOCUMENT_CHARS
      ? text.substring(0, MAX_DOCUMENT_CHARS) + '\n\n[Document truncated for processing]'
      : text;

  const structure = analyzeDocumentStructure(truncated);
  const budget = calculateDynamicPageCount(structure);
  const sourceLanguage = detectLanguage(truncated);

  console.log(
    `[Gemini] Document: ${structure.wordCount} words, density=${structure.informationDensity}, ` +
      `target ${budget.targetPages} pages (${budget.minPages}-${budget.maxPages}), lang=${sourceLanguage}`
  );

  if (truncated.length > CHUNKED_THRESHOLD || budget.targetPages > 12 || budget.outputTokens > 32_768) {
    console.log('[Gemini] Routing to chunked generation.');
    return withQualityCheck(
      () => analyzeDocumentChunked(truncated, { targetLevel: options.targetLevel, provider }),
      sourceLanguage,
      'Analyze',
      provider
    );
  }

  const runSingleCall = async () => {
    const prompt = ANALYSIS_PROMPT.replace('{targetLevel}', options.targetLevel)
      .replace('{documentText}', truncated)
      .replace(/\{wordCount\}/g, String(structure.wordCount))
      .replace(/\{targetPages\}/g, String(budget.targetPages))
      .replace(/\{minPages\}/g, String(budget.minPages))
      .replace(/\{maxPages\}/g, String(budget.maxPages));

    const config = getGeminiConfig('content_generation', budget.outputTokens);
    const validated = await callLLMForJson(
      provider,
      prompt,
      config,
      geminiLessonResponseSchema,
      'Analyze',
      3,
      recoverTruncatedLessonJson,
      normalizeLessonResponse
    );
    return validated as GeminiPagedLessonResponse;
  };

  return withQualityCheck(runSingleCall, sourceLanguage, 'Analyze', provider);
}

// ============================================================
// Section → Lesson (course flow, one section at a time)
// ============================================================

export async function analyzeSectionAsLesson(
  sectionText: string,
  options: {
    targetLevel: string;
    sectionTitle: string;
    sectionIndex: number;
    totalSections: number;
    previousSectionContext?: string;
    provider?: LLMProvider;
  }
): Promise<GeminiPagedLessonResponse> {
  const provider = options.provider ?? DEFAULT_PROVIDER;
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const structure = analyzeDocumentStructure(sectionText);
  const budget = calculateDynamicPageCount(structure);
  const sourceLanguage = detectLanguage(sectionText);
  const label = `Section-${options.sectionIndex + 1}`;

  console.log(
    `[${label}] "${options.sectionTitle}" — ` +
      `${structure.wordCount} words, target ${budget.targetPages} pages, lang=${sourceLanguage}, provider=${provider}`
  );

  if (sectionText.length > CHUNKED_THRESHOLD || budget.targetPages > 12) {
    return withQualityCheck(
      () => analyzeDocumentChunked(sectionText, { targetLevel: options.targetLevel, provider }),
      sourceLanguage,
      label,
      provider
    );
  }

  const contextPreamble = options.previousSectionContext
    ? `\nCONTEXT: This is section ${options.sectionIndex + 1} of ${options.totalSections} in a larger course. ` +
      `Previous section context (do NOT repeat, build on it):\n${options.previousSectionContext}\n`
    : '';

  const runSingleCall = async () => {
    const prompt = ANALYSIS_PROMPT.replace('{targetLevel}', options.targetLevel)
      .replace('{documentText}', contextPreamble + sectionText)
      .replace(/\{wordCount\}/g, String(structure.wordCount))
      .replace(/\{targetPages\}/g, String(budget.targetPages))
      .replace(/\{minPages\}/g, String(budget.minPages))
      .replace(/\{maxPages\}/g, String(budget.maxPages));

    const config = getGeminiConfig('content_generation', budget.outputTokens);
    const validated = await callLLMForJson(
      provider,
      prompt,
      config,
      geminiLessonResponseSchema,
      label,
      3,
      recoverTruncatedLessonJson,
      normalizeLessonResponse
    );
    return validated as GeminiPagedLessonResponse;
  };

  return withQualityCheck(runSingleCall, sourceLanguage, label, provider);
}

// ============================================================
// Chunked Generation (for large documents)
// ============================================================

async function analyzeDocumentChunked(
  text: string,
  options: { targetLevel: string; provider?: LLMProvider }
): Promise<GeminiPagedLessonResponse> {
  const provider = options.provider ?? DEFAULT_PROVIDER;
  const truncated =
    text.length > MAX_DOCUMENT_CHARS
      ? text.substring(0, MAX_DOCUMENT_CHARS) + '\n\n[Document truncated for processing]'
      : text;

  const rawChunks = splitIntoChunks(truncated, MAX_CHUNK_SIZE);
  console.log(`[Gemini] Split into ${rawChunks.length} chunks`);

  const chunkStructures = rawChunks.map((c) => analyzeDocumentStructure(c));
  const chunkBudgets = chunkStructures.map((s) => calculateDynamicPageCount(s));

  const totalTargetPages = chunkBudgets.reduce((sum, b) => sum + b.targetPages, 0);
  console.log(`[Gemini] Chunked mode: ${rawChunks.length} chunks, total target pages: ${totalTargetPages}`);

  const allPages: GeminiPagedLessonResponse['pages'] = [];
  let nextPageNumber = 1;
  let previousContext = '';

  for (let i = 0; i < rawChunks.length; i++) {
    const chunkText = rawChunks[i];
    const chunkTarget = chunkBudgets[i].targetPages;

    console.log(
      `[Gemini] Processing chunk ${i + 1}/${rawChunks.length} ` +
        `(${chunkText.length} chars, target ${chunkTarget} pages)...`
    );

    try {
      const prompt = CHUNK_PAGES_PROMPT.replace('{targetLevel}', options.targetLevel)
        .replace('{chunkIndex}', String(i + 1))
        .replace('{totalChunks}', String(rawChunks.length))
        .replace(/\{startPage\}/g, String(nextPageNumber))
        .replace('{targetPages}', String(chunkTarget))
        .replace('{chunkText}', chunkText)
        .replace('{previousContext}', previousContext)
        .replace('{sectionTitles}', 'N/A');

      const config = getGeminiConfig('content_generation', chunkTarget * 3000);
      const validated = await callLLMForJson(
        provider,
        prompt,
        config,
        geminiChunkResponseSchema,
        `Chunk-${i + 1}`,
        3
      );

      validated.pages.forEach((page, idx: number) => {
        page.page_number = nextPageNumber + idx;
      });

      allPages.push(...(validated.pages as GeminiPagedLessonResponse['pages']));
      nextPageNumber = allPages.length + 1;

      previousContext = allPages
        .slice(-3)
        .map(
          (p) =>
            `Page ${p.page_number} "${p.title}": ${p.content_blocks
              .filter((b) => b.type === 'summary' || b.type === 'text')
              .map((b) => b.content)
              .join(' ')
              .substring(0, 200)}`
        )
        .join('\n');
      if (previousContext) {
        previousContext = `CONTEXT FROM PREVIOUS SECTIONS (do NOT repeat, build on it):\n${previousContext}\n`;
      }

      if (i < rawChunks.length - 1) await sleep(1000);
    } catch (error) {
      console.error(`[Gemini] Chunk ${i + 1} failed:`, error);
      continue;
    }
  }

  if (allPages.length === 0) {
    throw new Error('Failed to generate any pages from the document');
  }

  allPages.forEach((page, i) => {
    page.page_number = i + 1;
  });

  console.log(`[Gemini] Generated ${allPages.length} pages. Generating final quiz + metadata...`);

  const meta = await generateFinalQuizAndMeta(allPages, options.targetLevel, provider);

  return {
    title: meta.title,
    description: meta.description,
    learning_objectives: meta.learning_objectives,
    pages: allPages,
    summary: meta.summary,
    final_quiz_questions: meta.final_quiz_questions as GeminiPagedLessonResponse['final_quiz_questions'],
    difficulty: meta.difficulty,
    estimated_duration_minutes: meta.estimated_duration_minutes,
  };
}

async function generateFinalQuizAndMeta(
  pages: GeminiPagedLessonResponse['pages'],
  targetLevel: string,
  provider: LLMProvider = DEFAULT_PROVIDER
) {
  const quizQuestionCount = Math.max(8, Math.min(15, Math.ceil(pages.length * 1.5)));

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

  const prompt = FINAL_QUIZ_PROMPT.replace('{targetLevel}', targetLevel)
    .replace('{totalPages}', String(pages.length))
    .replace('{pagesOverview}', pagesOverview)
    .replace(/\{quizQuestionCount\}/g, String(quizQuestionCount));

  const quizTokenBudget = Math.max(4096, pages.length * 600);
  const config = getGeminiConfig('metadata_generation', quizTokenBudget);
  return callLLMForJson(
    provider,
    prompt,
    config,
    geminiFinalQuizResponseSchema,
    'FinalQuiz',
    3,
    undefined,
    undefined,
    'light'
  );
}

// ============================================================
// Generative Lesson (topic + key points → lesson, no document)
// ============================================================

export async function generateLessonFromOutline(options: {
  lessonTitle: string;
  keyPoints: string[];
  language: string;
  lessonIndex: number;
  totalLessons: number;
  previousLessonContext?: string;
  targetPages?: number; // 3-5, defaults to 5 if not specified
  provider?: LLMProvider;
}): Promise<GeminiPagedLessonResponse> {
  const provider = options.provider ?? DEFAULT_PROVIDER;
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const keyPointsFormatted = options.keyPoints.map((kp, i) => `${i + 1}. ${kp}`).join('\n');

  const contextBlock = options.previousLessonContext
    ? `\nCONTEXT: This is lesson ${options.lessonIndex + 1} of ${options.totalLessons} in a course.\n` +
      `Previous lessons covered (do NOT repeat — build on this knowledge):\n${options.previousLessonContext}\n`
    : '';

  const targetPages = Math.max(3, Math.min(5, options.targetPages ?? 5));
  const label = `Generate-${options.lessonIndex + 1}`;
  console.log(
    `[${label}] "${options.lessonTitle}" — ` +
      `${options.keyPoints.length} key points, language=${options.language}, pages=${targetPages}, provider=${provider}`
  );

  const runGenerate = async () => {
    const fewShotExample = pickFewShotExample(options.language);
    const prompt = GENERATIVE_LESSON_PROMPT.replace(/\{lessonTitle\}/g, options.lessonTitle)
      .replace(/\{keyPoints\}/g, keyPointsFormatted)
      .replace(/\{language\}/g, options.language)
      .replace(/\{previousContext\}/g, contextBlock)
      .replace(/\{targetPages\}/g, String(targetPages))
      .replace('{fewShotExample}', fewShotExample);

    // Generous budget — Georgian uses ~2.5 tokens/char, so 5 pages of
    // content + quiz + metadata can exceed 20k tokens easily. Cap at
    // 65536 which is the gemini-2.5-flash / claude-sonnet hard limit.
    const outputTokens = Math.min(65_536, targetPages * 12_000 + 8_000);
    const config = getGeminiConfig('content_generation', outputTokens);

    const validated = await callLLMForJson(
      provider,
      prompt,
      config,
      geminiLessonResponseSchema,
      label,
      3,
      recoverTruncatedLessonJson,
      normalizeLessonResponse
    );
    return validated as GeminiPagedLessonResponse;
  };

  return withQualityCheck(runGenerate, options.language, label, provider);
}

// ============================================================
// Syllabus Pipeline — Stage 0: Parse
// Extract the course structure from a raw syllabus PDF text.
// ============================================================

export async function parseSyllabus(
  documentText: string,
  provider: LLMProvider = DEFAULT_PROVIDER
): Promise<GeminiSyllabusResponseZ> {
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }
  if (!documentText || documentText.trim().length < 100) {
    throw new Error('Syllabus document is too short to parse.');
  }

  // Syllabi are small — cap to 40k chars to be safe
  const truncated = documentText.length > 40_000
    ? documentText.substring(0, 40_000) + '\n\n[Truncated]'
    : documentText;

  const prompt = SYLLABUS_PARSER_PROMPT.replace('{documentText}', truncated);
  const config = getGeminiConfig('metadata_generation', 8192);

  console.log(`[SyllabusParse] Parsing syllabus (${truncated.length} chars, provider=${provider})...`);
  const parsed = await callLLMForJson(
    provider,
    prompt,
    config,
    geminiSyllabusResponseSchema,
    'SyllabusParse',
    3,
    undefined,
    undefined,
    'light'
  );

  // Renumber modules and lessons sequentially to ensure consistency
  parsed.modules.forEach((module, mIdx) => {
    module.number = mIdx + 1;
    module.lessons.forEach((lesson, lIdx) => {
      lesson.number = lIdx + 1;
    });
  });

  const totalLessons = parsed.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  console.log(
    `[SyllabusParse] "${parsed.courseTitle}" — ${parsed.modules.length} modules, ` +
      `${totalLessons} lessons, language=${parsed.language}`
  );

  return parsed;
}

// ============================================================
// Syllabus Pipeline — Stage 1: Expand
// Turn ONE syllabus lesson into 1-3 sub-lessons with detailed key points.
// ============================================================

export async function expandLessonToSubLessons(input: {
  courseTitle: string;
  audience: string[];
  finalOutcomes: string[];
  tools: string[];
  moduleTitle: string;
  moduleOutcome: string;
  lessonNumber: number;
  lessonTitle: string;
  lessonSubtitle: string;
  previousLessonsList: string;
  language: string;
  provider?: LLMProvider;
}): Promise<GeminiLessonExpansionResponseZ> {
  const provider = input.provider ?? DEFAULT_PROVIDER;
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const formattedFinalOutcomes = input.finalOutcomes.length > 0
    ? input.finalOutcomes.map((o) => `- ${o}`).join('\n')
    : '- (none specified)';

  const formattedTools = input.tools.length > 0
    ? input.tools.join(', ')
    : '(none specified)';

  const formattedAudience = input.audience.length > 0
    ? input.audience.join(', ')
    : '(general audience)';

  const prompt = LESSON_EXPANDER_PROMPT
    .replace(/\{language\}/g, input.language)
    .replace('{courseTitle}', input.courseTitle)
    .replace('{audience}', formattedAudience)
    .replace('{finalOutcomes}', formattedFinalOutcomes)
    .replace('{tools}', formattedTools)
    .replace('{moduleTitle}', input.moduleTitle)
    .replace('{moduleOutcome}', input.moduleOutcome || '(no explicit outcome — infer from lesson)')
    .replace('{lessonNumber}', String(input.lessonNumber))
    .replace('{lessonTitle}', input.lessonTitle)
    .replace('{lessonSubtitle}', input.lessonSubtitle || '(none)')
    .replace('{previousLessonsList}', input.previousLessonsList || '(this is the first lesson)');

  const label = `Expand-L${input.lessonNumber}`;
  const config = getGeminiConfig('metadata_generation', 4096);

  console.log(`[${label}] Expanding "${input.lessonTitle}" (provider=${provider})...`);
  const expansion = await callLLMForJson(
    provider,
    prompt,
    config,
    geminiLessonExpansionResponseSchema,
    label,
    3,
    undefined,
    undefined,
    'light'
  );

  const splitNote = expansion.subLessons.length > 1
    ? ` (split into ${expansion.subLessons.length})`
    : '';
  console.log(`[${label}] Produced ${expansion.subLessons.length} sub-lesson(s)${splitNote}`);

  return expansion;
}

// ============================================================
// Utilities
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
