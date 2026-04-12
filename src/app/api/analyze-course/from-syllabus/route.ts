// ============================================================
// API Route: POST /api/analyze-course/from-syllabus
//
// Accepts a syllabus PDF (a table-of-contents style document with
// module and lesson titles but no teaching material) and generates
// a full course of 10-15 minute lessons by running the three-stage
// syllabus pipeline:
//
//   Stage 0 (parse)    — extract structured course outline
//   Stage 1 (expand)   — each syllabus lesson → 1-3 sub-lessons with
//                        6-8 detailed key points each
//   Stage 2 (generate) — full lesson content per sub-lesson, with
//                        quality review + one retry if score < 9
//
// Progress is streamed over SSE using the CourseGenerationProgress
// shape already defined for the sibling /api/analyze-course route.
// ============================================================

import { NextRequest } from 'next/server';
import { extractText } from '@/lib/document-parser';
import {
  runFullSyllabusPipeline,
  PipelineAbortError,
  type ExpandedSubLesson,
  type LLMProvider,
} from '@/lib/ai/syllabus-pipeline';
import { createClient } from '@/lib/supabase/server';
import { saveLesson, createCourse, deleteCourse } from '@/lib/supabase/db';
import { buildLessonFromGeminiResponse } from '@/lib/lesson-builder';
import type { CourseGenerationProgress, Lesson } from '@/types';

export const maxDuration = 300;

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const courseId = (formData.get('courseId') as string | null) || null;
    const explicitCourseName = (formData.get('courseName') as string | null) || null;
    const rawProvider = (formData.get('provider') as string | null) || 'gemini';
    const provider: LLMProvider = rawProvider === 'claude' ? 'claude' : 'gemini';

    if (!file) {
      return jsonError('No file provided', 400);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return jsonError(`Unsupported file type: ${file.type}`, 400);
    }
    if (file.size > MAX_FILE_BYTES) {
      return jsonError('File is too large. Maximum 25MB.', 400);
    }

    // Extract text from the uploaded document
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extraction = await extractText(buffer, file.type);

    if (extraction.wordCount < 50) {
      return jsonError('Syllabus has too little text to parse.', 422);
    }

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const emit = (progress: CourseGenerationProgress) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
        };

        let totalSubLessons = 0;
        const completedLessons: CourseGenerationProgress['lessons'] = [];
        let resolvedCourseId: string | null = courseId;
        let resolvedCourseName = explicitCourseName || '';
        const supabase = await createClient();

        try {

          // Kick off the pipeline with streaming events tied to SSE.
          // request.signal fires if the client aborts (Stop button or tab close),
          // and is propagated down into the Gemini call loops so the pipeline
          // bails cleanly between iterations. On abort we wipe any partial course.
          await runFullSyllabusPipeline(
            extraction.text,
            {
              onParsingStart: () => {
                emit({
                  status: 'parsing_syllabus',
                  totalLessons: 0,
                  currentLesson: 0,
                  currentLessonTitle: '',
                  lessons: [],
                });
              },

              onParsed: async (outline) => {
                // Create the course from the parsed title
                if (!resolvedCourseId) {
                  const title = resolvedCourseName || outline.courseTitle || file.name.replace(/\.[^.]+$/, '');
                  const description = outline.courseDescription || '';
                  const tags = outline.audience.slice(0, 5);
                  const course = await createCourse(supabase, { title, description, tags });
                  resolvedCourseId = course.id;
                  resolvedCourseName = title;
                }

                emit({
                  status: 'extracting_outline',
                  totalLessons: 0,
                  currentLesson: 0,
                  currentLessonTitle: outline.courseTitle,
                  courseId: resolvedCourseId,
                  courseName: resolvedCourseName,
                  lessons: [],
                });
              },

              onExpansionStart: (total) => {
                emit({
                  status: 'expanding_lessons',
                  totalLessons: total,
                  currentLesson: 0,
                  currentLessonTitle: '',
                  courseId: resolvedCourseId ?? undefined,
                  courseName: resolvedCourseName,
                  lessons: [],
                  expansionProgress: { current: 0, total },
                });
              },

              onExpansionProgress: (current, total, lessonTitle) => {
                emit({
                  status: 'expanding_lessons',
                  totalLessons: total,
                  currentLesson: current,
                  currentLessonTitle: lessonTitle,
                  courseId: resolvedCourseId ?? undefined,
                  courseName: resolvedCourseName,
                  lessons: [],
                  expansionProgress: { current, total },
                });
              },

              onExpansionComplete: (expandedLessons) => {
                totalSubLessons = expandedLessons.length;
                console.log(
                  `[FromSyllabus] Stage 1 complete: ${totalSubLessons} sub-lessons ` +
                    `(split-count: ${countSplits(expandedLessons)})`
                );
              },

              onGenerationStart: (total) => {
                emit({
                  status: 'generating_lesson',
                  totalLessons: total,
                  currentLesson: 0,
                  currentLessonTitle: '',
                  courseId: resolvedCourseId ?? undefined,
                  courseName: resolvedCourseName,
                  lessons: completedLessons,
                });
              },

              onLessonStart: (sub, position, total) => {
                emit({
                  status: 'generating_lesson',
                  totalLessons: total,
                  currentLesson: position,
                  currentLessonTitle: sub.title,
                  courseId: resolvedCourseId ?? undefined,
                  courseName: resolvedCourseName,
                  lessons: completedLessons,
                });
              },

              onLessonFailed: (sub, error) => {
                console.error(
                  `[FromSyllabus] Sub-lesson ${sub.coursePosition} "${sub.title}" failed:`,
                  error.message
                );
                completedLessons.push({
                  id: 'failed',
                  title: `${sub.title} (failed)`,
                  pages: 0,
                  position: sub.coursePosition - 1,
                });
              },
            },
            // onGeneratedLesson — save each lesson immediately so partial
            // progress is persisted even if a later lesson fails.
            async (sub, generated) => {
              if (!resolvedCourseId) {
                throw new Error('Course not created before lesson generation (pipeline bug)');
              }

              emit({
                status: 'saving',
                totalLessons: totalSubLessons,
                currentLesson: sub.coursePosition,
                currentLessonTitle: sub.title,
                courseId: resolvedCourseId,
                courseName: resolvedCourseName,
                lessons: completedLessons,
              });

              const lesson: Lesson = buildLessonFromGeminiResponse(
                generated,
                file.name,
                resolvedCourseId,
                sub.coursePosition - 1
              );

              await saveLesson(supabase, lesson);

              completedLessons.push({
                id: lesson.id,
                title: lesson.title,
                pages: lesson.totalPages ?? lesson.pages?.length ?? 0,
                position: sub.coursePosition - 1,
              });
            },
            request.signal,
            provider
          );

          const processingTimeMs = Date.now() - startTime;
          console.log(
            `[FromSyllabus] Course complete: ${completedLessons.length}/${totalSubLessons} ` +
              `lessons in ${Math.round(processingTimeMs / 1000)}s`
          );

          emit({
            status: 'complete',
            totalLessons: totalSubLessons,
            currentLesson: totalSubLessons,
            currentLessonTitle: '',
            courseId: resolvedCourseId ?? undefined,
            courseName: resolvedCourseName,
            lessons: completedLessons,
          });

          controller.close();
        } catch (err) {
          // Client aborted mid-generation — delete the whole partial course
          // so no orphan data is left behind. This matches the user's
          // "don't save anything if I click stop" expectation.
          if (err instanceof PipelineAbortError || request.signal.aborted) {
            console.log('[FromSyllabus] Aborted by client. Cleaning up partial course...');
            if (resolvedCourseId) {
              try {
                const ok = await deleteCourse(supabase, resolvedCourseId);
                console.log(
                  `[FromSyllabus] Partial course ${resolvedCourseId} deleted: ${ok} ` +
                    `(${completedLessons.length} lessons removed)`
                );
              } catch (cleanupErr) {
                console.error('[FromSyllabus] Cleanup failed:', cleanupErr);
              }
            }
            // Client already knows — nothing to emit. Just close the stream.
            try { controller.close(); } catch { /* already closed */ }
            return;
          }

          console.error('[FromSyllabus] Fatal error:', err);
          const message = err instanceof Error ? err.message : 'Syllabus pipeline failed';
          emit({
            status: 'error',
            totalLessons: totalSubLessons,
            currentLesson: 0,
            currentLessonTitle: '',
            courseId: resolvedCourseId ?? undefined,
            courseName: resolvedCourseName,
            lessons: completedLessons,
            error: message,
          });
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
    console.error('[FromSyllabus] Request error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return jsonError(message, 500);
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function countSplits(expanded: ExpandedSubLesson[]): number {
  // Count how many syllabus lessons produced more than one sub-lesson
  const bySyllabusLesson = new Map<number, number>();
  for (const e of expanded) {
    bySyllabusLesson.set(
      e.originSyllabusLessonNumber,
      (bySyllabusLesson.get(e.originSyllabusLessonNumber) ?? 0) + 1
    );
  }
  let splits = 0;
  for (const count of bySyllabusLesson.values()) {
    if (count > 1) splits++;
  }
  return splits;
}
