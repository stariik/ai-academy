// ============================================================
// API Route: POST /api/analyze-course
// Accepts a PDF + section definitions, generates a lesson per
// section, and assigns all to a course. Streams progress via SSE.
// Supports pre-defined sections from outline preview or auto-detection.
// ============================================================

import { NextRequest } from 'next/server';
import { extractText } from '@/lib/document-parser';
import { extractDocumentOutline, analyzeSectionAsLesson } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import { saveLesson, createCourse } from '@/lib/supabase/db';
import { buildLessonFromGeminiResponse } from '@/lib/lesson-builder';
import type { CourseGenerationProgress, Lesson } from '@/types';

export const maxDuration = 600;

const MIN_SECTION_WORDS = 200;

type SectionInput = {
  title: string;
  startIndex: number;
  endIndex: number;
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetLevel = (formData.get('targetLevel') as string) || 'intermediate';
    let courseId = formData.get('courseId') as string | null;
    const newCourseName = formData.get('newCourseName') as string | null;
    // Pre-defined sections from outline preview (JSON string)
    const sectionsJson = formData.get('sections') as string | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `Unsupported file type: ${file.type}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File is too large. Maximum 25MB.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extraction = await extractText(buffer, file.type);

    if (extraction.wordCount < 50) {
      return new Response(
        JSON.stringify({ error: 'Document has too little text.' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        function emit(progress: CourseGenerationProgress) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
        }

        try {
          // Step 1: Resolve sections (pre-defined or auto-detect)
          let mergedSections: { title: string; text: string }[];

          if (sectionsJson) {
            // Use admin-provided sections from outline preview
            const inputSections: SectionInput[] = JSON.parse(sectionsJson);
            mergedSections = inputSections.map((s) => ({
              title: s.title,
              text: extraction.text.substring(s.startIndex, s.endIndex),
            }));
            console.log(`[AnalyzeCourse] Using ${mergedSections.length} pre-defined sections`);
          } else {
            // Auto-detect sections
            emit({
              status: 'extracting_outline',
              totalLessons: 0,
              currentLesson: 0,
              currentLessonTitle: '',
              lessons: [],
            });

            const outline = await extractDocumentOutline(extraction.text);
            console.log(`[AnalyzeCourse] Auto-detected ${outline.totalSections} sections`);

            mergedSections = [];
            for (const section of outline.sections) {
              const sectionText = extraction.text.substring(section.startIndex, section.endIndex);
              const wordCount = sectionText.split(/\s+/).filter(Boolean).length;

              if (mergedSections.length > 0 && wordCount < MIN_SECTION_WORDS) {
                const prev = mergedSections[mergedSections.length - 1];
                prev.title = `${prev.title} & ${section.title}`;
                prev.text += '\n\n' + sectionText;
              } else {
                mergedSections.push({ title: section.title, text: sectionText });
              }
            }

            if (mergedSections.length > 1) {
              const last = mergedSections[mergedSections.length - 1];
              const lastWordCount = last.text.split(/\s+/).filter(Boolean).length;
              if (lastWordCount < MIN_SECTION_WORDS) {
                const prev = mergedSections[mergedSections.length - 2];
                prev.title = `${prev.title} & ${last.title}`;
                prev.text += '\n\n' + last.text;
                mergedSections.pop();
              }
            }
          }

          const totalLessons = mergedSections.length;
          console.log(`[AnalyzeCourse] Processing ${totalLessons} sections`);

          if (totalLessons === 0) {
            emit({ status: 'error', totalLessons: 0, currentLesson: 0, currentLessonTitle: '', lessons: [], error: 'No sections detected in the document.' });
            controller.close();
            return;
          }

          // Step 2: Create or resolve course
          const supabase = await createClient();
          let courseName = newCourseName?.trim() || '';

          if (!courseId && courseName) {
            const course = await createCourse(supabase, { title: courseName, description: '', tags: [] });
            courseId = course.id;
          } else if (!courseId) {
            courseName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
            const course = await createCourse(supabase, { title: courseName, description: '', tags: [] });
            courseId = course.id;
          }

          // Step 3: Generate lessons with rich context accumulation
          const completedLessons: CourseGenerationProgress['lessons'] = [];

          // Accumulate structured context from ALL previous lessons
          const lessonSummaries: {
            position: number;
            title: string;
            summary: string;
            keyConcepts: string[];
          }[] = [];

          for (let i = 0; i < totalLessons; i++) {
            const section = mergedSections[i];

            emit({
              status: 'generating_lesson',
              totalLessons,
              currentLesson: i + 1,
              currentLessonTitle: section.title,
              courseId: courseId!,
              courseName,
              lessons: completedLessons,
            });

            try {
              // Build rich context from ALL previous lessons
              const previousContext = buildPreviousContext(lessonSummaries);

              const geminiResponse = await analyzeSectionAsLesson(section.text, {
                targetLevel,
                sectionTitle: section.title,
                sectionIndex: i,
                totalSections: totalLessons,
                previousSectionContext: previousContext,
              });

              let lesson = buildLessonFromGeminiResponse(
                geminiResponse,
                file.name,
                courseId!,
                i
              );

              // Quiz recovery: if final quiz is missing/empty, regenerate separately
              if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) {
                console.warn(`[AnalyzeCourse] Lesson ${i + 1} has no final quiz — attempting recovery`);
                lesson = await recoverMissingQuiz(lesson, section.text, targetLevel);
              }

              emit({
                status: 'saving',
                totalLessons,
                currentLesson: i + 1,
                currentLessonTitle: section.title,
                courseId: courseId!,
                courseName,
                lessons: completedLessons,
              });

              await saveLesson(supabase, lesson);

              completedLessons.push({
                id: lesson.id,
                title: lesson.title,
                pages: lesson.totalPages ?? lesson.pages?.length ?? 0,
                position: i,
              });

              // Accumulate structured context
              lessonSummaries.push({
                position: i,
                title: lesson.title,
                summary: lesson.summary || lesson.description,
                keyConcepts: lesson.keyConcepts.map((c) => c.term),
              });

              if (i < totalLessons - 1) {
                await new Promise((r) => setTimeout(r, 1500));
              }
            } catch (err) {
              console.error(`[AnalyzeCourse] Section ${i + 1} failed:`, err);
              completedLessons.push({
                id: 'failed',
                title: `${section.title} (failed)`,
                pages: 0,
                position: i,
              });
            }
          }

          const processingTimeMs = Date.now() - startTime;
          console.log(`[AnalyzeCourse] Course generated: ${completedLessons.length} lessons in ${processingTimeMs}ms`);

          emit({
            status: 'complete',
            totalLessons,
            currentLesson: totalLessons,
            currentLessonTitle: '',
            courseId: courseId!,
            courseName,
            lessons: completedLessons,
          });

          controller.close();
        } catch (err) {
          console.error('[AnalyzeCourse] Fatal error:', err);
          const message = err instanceof Error ? err.message : 'Course generation failed';
          emit({ status: 'error', totalLessons: 0, currentLesson: 0, currentLessonTitle: '', lessons: [], error: message });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[AnalyzeCourse] Request error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================================
// Rich context builder - sends structured summaries from ALL
// previous lessons so Gemini can maintain course coherence
// ============================================================

function buildPreviousContext(
  summaries: { position: number; title: string; summary: string; keyConcepts: string[] }[]
): string {
  if (summaries.length === 0) return '';

  const lines = summaries.map((s) => {
    const concepts = s.keyConcepts.length > 0 ? ` | Concepts taught: ${s.keyConcepts.join(', ')}` : '';
    // Truncate individual summaries to keep total context manageable
    const shortSummary = s.summary.length > 200 ? s.summary.substring(0, 200) + '...' : s.summary;
    return `Lesson ${s.position + 1} "${s.title}": ${shortSummary}${concepts}`;
  });

  return `PREVIOUS LESSONS IN THIS COURSE (do NOT repeat their content — build on it, reference their concepts):
${lines.join('\n')}`;
}

// ============================================================
// Quiz recovery - regenerates final quiz when truncation
// causes it to be lost during Gemini generation
// ============================================================

async function recoverMissingQuiz(lesson: Lesson, sectionText: string, targetLevel: string): Promise<Lesson> {
  try {
    const { analyzeSectionAsLesson: _ , ...rest } = await import('@/lib/ai/gemini');
    // We can't easily call generateFinalQuizAndMeta since it's not exported.
    // Instead, we'll create a minimal quiz from the lesson's page check questions.
    // Promote some check questions to final quiz scope.
    const allCheckQuestions = lesson.pages?.flatMap((p) => p.checkQuestions) ?? [];

    if (allCheckQuestions.length >= 3) {
      // Pick diverse questions from across pages
      const selected = allCheckQuestions
        .filter((q) => q.difficulty !== 'easy') // prefer harder questions
        .slice(0, Math.min(8, allCheckQuestions.length));

      if (selected.length < 3) {
        selected.push(...allCheckQuestions.slice(0, 3 - selected.length));
      }

      const quizQuestions = selected.map((q, i) => ({
        ...q,
        id: `${lesson.id}-fq-${i}`,
        scope: 'final' as const,
        points: 10,
      }));

      console.log(`[AnalyzeCourse] Recovered ${quizQuestions.length} quiz questions from check questions`);
      return { ...lesson, quizQuestions };
    }
  } catch (err) {
    console.error('[AnalyzeCourse] Quiz recovery failed:', err);
  }

  return lesson;
}
