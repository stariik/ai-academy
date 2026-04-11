// ============================================================
// Syllabus Pipeline Orchestrator
//
// Converts a raw syllabus PDF into a full course of 10-15 minute
// lessons, each with detailed content generated from expanded
// key points. Three stages:
//
//   Stage 0: parseSyllabus           — PDF text → structured outline
//   Stage 1: expandLessonToSubLessons — one lesson → 1-3 sub-lessons
//                                       with 6-8 detailed key points
//   Stage 2: generateLessonFromOutline — each sub-lesson → full lesson
//                                        content + check questions + quiz
//
// Stage 1 runs UPFRONT for ALL lessons so we know the true total
// sub-lesson count before starting Stage 2 (accurate progress bar).
//
// Each Stage 2 call carries context from previously generated
// lessons so the course stays coherent and non-repetitive.
// ============================================================

import {
  parseSyllabus,
  expandLessonToSubLessons,
  generateLessonFromOutline,
  type GeminiSyllabusResponseZ,
  type SubLessonSpec,
  type LLMProvider,
} from './gemini';
import type { GeminiPagedLessonResponse } from '@/types';

export type { LLMProvider };

// ------------------------------------------------------------
// Cancellation support
// Thrown from inside the pipeline when the caller's AbortSignal
// fires (e.g. client clicks "Stop" mid-generation). The route
// handler catches this specifically and deletes any partial course.
// ------------------------------------------------------------

export class PipelineAbortError extends Error {
  constructor(stage: string) {
    super(`Pipeline aborted by client during ${stage}`);
    this.name = 'PipelineAbortError';
  }
}

function checkAbort(signal: AbortSignal | undefined, stage: string): void {
  if (signal?.aborted) {
    throw new PipelineAbortError(stage);
  }
}

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export type ExpandedSubLesson = SubLessonSpec & {
  // Which module in the syllabus this sub-lesson belongs to
  moduleNumber: number;
  moduleTitle: string;
  // The original syllabus lesson this was derived from
  originSyllabusLessonNumber: number;
  originSyllabusLessonTitle: string;
  // Final sequential position in the generated course (1-indexed)
  coursePosition: number;
};

export type SyllabusPipelineEvents = {
  onParsingStart?: () => void;
  onParsed?: (outline: GeminiSyllabusResponseZ) => void;
  onExpansionStart?: (totalSyllabusLessons: number) => void;
  onExpansionProgress?: (current: number, total: number, lessonTitle: string) => void;
  onExpansionComplete?: (expandedLessons: ExpandedSubLesson[]) => void;
  onGenerationStart?: (totalSubLessons: number) => void;
  onLessonStart?: (subLesson: ExpandedSubLesson, position: number, total: number) => void;
  onLessonComplete?: (subLesson: ExpandedSubLesson, generated: GeminiPagedLessonResponse) => void;
  onLessonFailed?: (subLesson: ExpandedSubLesson, error: Error) => void;
};

export type SyllabusPipelineResult = {
  outline: GeminiSyllabusResponseZ;
  expandedLessons: ExpandedSubLesson[];
  // Each entry is one successfully-generated lesson aligned with expandedLessons by index
  generatedLessons: (GeminiPagedLessonResponse | null)[];
};

// ------------------------------------------------------------
// Stage 0: Parse
// ------------------------------------------------------------

export async function runStageParse(
  documentText: string,
  events?: SyllabusPipelineEvents,
  signal?: AbortSignal,
  provider: LLMProvider = 'gemini'
): Promise<GeminiSyllabusResponseZ> {
  checkAbort(signal, 'stage-0-parse');
  events?.onParsingStart?.();
  const outline = await parseSyllabus(documentText, provider);
  checkAbort(signal, 'stage-0-parse-post');
  events?.onParsed?.(outline);
  return outline;
}

// ------------------------------------------------------------
// Stage 1: Expand ALL syllabus lessons into sub-lesson specs
// Runs sequentially so each expansion sees all previous lessons.
// ------------------------------------------------------------

export async function runStageExpand(
  outline: GeminiSyllabusResponseZ,
  events?: SyllabusPipelineEvents,
  signal?: AbortSignal,
  provider: LLMProvider = 'gemini'
): Promise<ExpandedSubLesson[]> {
  checkAbort(signal, 'stage-1-expand');
  const flatSyllabusLessons: {
    syllabusModule: GeminiSyllabusResponseZ['modules'][number];
    lesson: GeminiSyllabusResponseZ['modules'][number]['lessons'][number];
    overallIndex: number;
  }[] = [];

  let overallIdx = 0;
  for (const syllabusModule of outline.modules) {
    for (const lesson of syllabusModule.lessons) {
      flatSyllabusLessons.push({ syllabusModule, lesson, overallIndex: overallIdx++ });
    }
  }

  const totalSyllabusLessons = flatSyllabusLessons.length;
  events?.onExpansionStart?.(totalSyllabusLessons);

  // All tools flattened for the expander prompt
  const allTools = outline.toolsUsed.flatMap((t) => t.tools);

  // Accumulating list of previous lesson titles for context
  const previousLessonTitles: string[] = [];
  const expanded: ExpandedSubLesson[] = [];
  let nextCoursePosition = 1;

  for (const { syllabusModule, lesson, overallIndex } of flatSyllabusLessons) {
    checkAbort(signal, `stage-1-expand lesson ${overallIndex + 1}`);

    const previousList = previousLessonTitles.length > 0
      ? previousLessonTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')
      : '';

    try {
      const expansion = await expandLessonToSubLessons({
        courseTitle: outline.courseTitle,
        audience: outline.audience,
        finalOutcomes: outline.finalOutcomes,
        tools: allTools,
        moduleTitle: syllabusModule.title,
        moduleOutcome: syllabusModule.outcome,
        lessonNumber: overallIndex + 1,
        lessonTitle: lesson.title,
        lessonSubtitle: lesson.subtitle,
        previousLessonsList: previousList,
        language: outline.language,
        provider,
      });

      for (const sub of expansion.subLessons) {
        expanded.push({
          ...sub,
          moduleNumber: syllabusModule.number,
          moduleTitle: syllabusModule.title,
          originSyllabusLessonNumber: overallIndex + 1,
          originSyllabusLessonTitle: lesson.title,
          coursePosition: nextCoursePosition++,
        });
        previousLessonTitles.push(sub.title);
      }
    } catch (error) {
      // Abort errors must propagate up so the route can clean up the course.
      if (error instanceof PipelineAbortError) throw error;
      console.error(
        `[SyllabusPipeline] Stage 1 failed for lesson ${overallIndex + 1} "${lesson.title}":`,
        error
      );
      // On failure, emit a single fallback sub-lesson with minimal key points
      // derived from the original title/subtitle. Generation will still run on it.
      const fallback: ExpandedSubLesson = {
        title: lesson.title,
        keyPoints: [
          lesson.title + (lesson.subtitle ? ' — ' + lesson.subtitle : ''),
          'Cover the main concepts suggested by the lesson title',
          'Give practical, concrete examples relevant to the course audience',
        ],
        estimatedPages: 5,
        estimatedMinutes: 15,
        splitReason: null,
        moduleNumber: syllabusModule.number,
        moduleTitle: syllabusModule.title,
        originSyllabusLessonNumber: overallIndex + 1,
        originSyllabusLessonTitle: lesson.title,
        coursePosition: nextCoursePosition++,
      };
      expanded.push(fallback);
      previousLessonTitles.push(fallback.title);
    }

    events?.onExpansionProgress?.(overallIndex + 1, totalSyllabusLessons, lesson.title);
  }

  events?.onExpansionComplete?.(expanded);
  return expanded;
}

// ------------------------------------------------------------
// Stage 2: Generate full content for each sub-lesson
// Carries a rolling summary of previous lessons for coherence.
// Uses generateLessonFromOutline which has quality review + retry.
// ------------------------------------------------------------

export async function runStageGenerate(
  outline: GeminiSyllabusResponseZ,
  expanded: ExpandedSubLesson[],
  events?: SyllabusPipelineEvents,
  onGeneratedLesson?: (
    subLesson: ExpandedSubLesson,
    lesson: GeminiPagedLessonResponse
  ) => Promise<void> | void,
  signal?: AbortSignal,
  provider: LLMProvider = 'gemini'
): Promise<(GeminiPagedLessonResponse | null)[]> {
  checkAbort(signal, 'stage-2-generate');
  events?.onGenerationStart?.(expanded.length);

  const results: (GeminiPagedLessonResponse | null)[] = [];
  const lessonSummaries: {
    position: number;
    title: string;
    summary: string;
    keyConcepts: string[];
  }[] = [];

  for (let i = 0; i < expanded.length; i++) {
    const sub = expanded[i];

    // Bail cleanly at loop top — before any work for this iteration
    checkAbort(signal, `stage-2-generate lesson ${i + 1}`);

    events?.onLessonStart?.(sub, i + 1, expanded.length);

    const previousContext = buildPreviousContext(lessonSummaries);

    try {
      const generated = await generateLessonFromOutline({
        lessonTitle: sub.title,
        keyPoints: sub.keyPoints,
        language: outline.language,
        lessonIndex: i,
        totalLessons: expanded.length,
        previousLessonContext: previousContext,
        targetPages: sub.estimatedPages,
        provider,
      });

      // Bail BEFORE saving — so an abort mid-generation doesn't persist
      // a lesson the user never sees in the UI.
      checkAbort(signal, `stage-2-post-generate lesson ${i + 1}`);

      results.push(generated);
      events?.onLessonComplete?.(sub, generated);

      // Accumulate structured summary for next lesson's context
      lessonSummaries.push({
        position: i,
        title: generated.title,
        summary: generated.summary || generated.description,
        keyConcepts: generated.pages.flatMap((p) => p.key_concepts.map((c) => c.term)),
      });

      if (onGeneratedLesson) {
        await onGeneratedLesson(sub, generated);
      }

      // Small delay between calls to avoid rate limits
      if (i < expanded.length - 1) {
        await sleep(1500);
      }
    } catch (error) {
      // Abort errors must propagate up so the route can clean up the course.
      if (error instanceof PipelineAbortError) throw error;

      const err = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[SyllabusPipeline] Stage 2 failed for sub-lesson ${i + 1} "${sub.title}":`,
        err.message
      );
      results.push(null);
      events?.onLessonFailed?.(sub, err);
    }
  }

  return results;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function buildPreviousContext(
  summaries: { position: number; title: string; summary: string; keyConcepts: string[] }[]
): string {
  if (summaries.length === 0) return '';

  const lines = summaries.map((s) => {
    const concepts =
      s.keyConcepts.length > 0 ? ` | Concepts taught: ${s.keyConcepts.slice(0, 8).join(', ')}` : '';
    const shortSummary = s.summary.length > 200 ? s.summary.substring(0, 200) + '...' : s.summary;
    return `Lesson ${s.position + 1} "${s.title}": ${shortSummary}${concepts}`;
  });

  return `PREVIOUS LESSONS IN THIS COURSE (do NOT repeat their content — build on it, reference their concepts):
${lines.join('\n')}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ------------------------------------------------------------
// Full pipeline (convenience wrapper)
// ------------------------------------------------------------

export async function runFullSyllabusPipeline(
  documentText: string,
  events?: SyllabusPipelineEvents,
  onGeneratedLesson?: (
    subLesson: ExpandedSubLesson,
    lesson: GeminiPagedLessonResponse
  ) => Promise<void> | void,
  signal?: AbortSignal,
  provider: LLMProvider = 'gemini'
): Promise<SyllabusPipelineResult> {
  console.log(`[SyllabusPipeline] Starting full pipeline with provider=${provider}`);
  const outline = await runStageParse(documentText, events, signal, provider);
  const expanded = await runStageExpand(outline, events, signal, provider);
  const generatedLessons = await runStageGenerate(
    outline,
    expanded,
    events,
    onGeneratedLesson,
    signal,
    provider
  );
  return { outline, expandedLessons: expanded, generatedLessons };
}
