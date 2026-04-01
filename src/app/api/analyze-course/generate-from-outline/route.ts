// ============================================================
// API Route: POST /api/analyze-course/generate-from-outline
// Generates a SINGLE lesson from a topic + key points.
// Called per-lesson by the frontend to stay within Vercel's
// 300s serverless function limit.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateLessonFromOutline } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import { saveLesson } from '@/lib/supabase/db';
import { buildLessonFromGeminiResponse } from '@/lib/lesson-builder';
import type { Lesson } from '@/types';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lessonTitle,
      keyPoints,
      language,
      lessonIndex,
      totalLessons,
      courseId,
      previousContext,
    } = body;

    if (!lessonTitle || !keyPoints?.length || !courseId || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonTitle, keyPoints, courseId, language' },
        { status: 400 }
      );
    }

    // Generate lesson with Gemini
    const geminiResponse = await generateLessonFromOutline({
      lessonTitle,
      keyPoints,
      language,
      lessonIndex: lessonIndex ?? 0,
      totalLessons: totalLessons ?? 1,
      previousLessonContext: previousContext || '',
    });

    let lesson = buildLessonFromGeminiResponse(
      geminiResponse,
      'outline-generated',
      courseId,
      lessonIndex ?? 0
    );

    // Quiz recovery if needed
    if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) {
      console.warn(`[GenerateFromOutline] Lesson has no final quiz — recovering`);
      lesson = recoverMissingQuiz(lesson);
    }

    // Save to database
    const supabase = await createClient();
    await saveLesson(supabase, lesson);

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      pages: lesson.totalPages ?? lesson.pages?.length ?? 0,
      position: lessonIndex ?? 0,
      summary: lesson.summary || lesson.description,
      keyConcepts: lesson.keyConcepts.map((c) => c.term),
    });
  } catch (err) {
    console.error('[GenerateFromOutline] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate lesson';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function recoverMissingQuiz(lesson: Lesson): Lesson {
  try {
    const allCheckQuestions = lesson.pages?.flatMap((p) => p.checkQuestions) ?? [];
    if (allCheckQuestions.length >= 3) {
      const selected = allCheckQuestions
        .filter((q) => q.difficulty !== 'easy')
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
      return { ...lesson, quizQuestions };
    }
  } catch (err) {
    console.error('[GenerateFromOutline] Quiz recovery failed:', err);
  }
  return lesson;
}
