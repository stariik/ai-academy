// ============================================================
// API Route: POST /api/analyze-course/generate-lesson
// Generates a SINGLE lesson from a section of text.
// Called by the frontend once per section to stay within
// Vercel's 300s serverless function limit.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { analyzeSectionAsLesson, type LLMProvider } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import { saveLesson } from '@/lib/supabase/db';
import { buildLessonFromGeminiResponse } from '@/lib/lesson-builder';
import type { Lesson } from '@/types';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sectionText,
      sectionTitle,
      sectionIndex,
      totalSections,
      targetLevel,
      courseId,
      fileName,
      previousContext,
      provider: providerRaw,
    } = body;

    if (!sectionText || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields: sectionText, courseId' },
        { status: 400 }
      );
    }

    const provider: LLMProvider = providerRaw === 'claude' ? 'claude' : 'gemini';

    // Generate lesson with selected provider
    const geminiResponse = await analyzeSectionAsLesson(sectionText, {
      targetLevel: targetLevel || 'intermediate',
      sectionTitle: sectionTitle || 'Untitled Section',
      sectionIndex: sectionIndex ?? 0,
      totalSections: totalSections ?? 1,
      previousSectionContext: previousContext || '',
      provider,
    });

    let lesson = buildLessonFromGeminiResponse(
      geminiResponse,
      fileName || 'uploaded-document',
      courseId,
      sectionIndex ?? 0
    );

    // Quiz recovery if needed
    if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) {
      console.warn(`[GenerateLesson] Lesson has no final quiz — attempting recovery`);
      lesson = recoverMissingQuiz(lesson);
    }

    // Save to database
    const supabase = await createClient();
    await saveLesson(supabase, lesson);

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      pages: lesson.totalPages ?? lesson.pages?.length ?? 0,
      position: sectionIndex ?? 0,
      summary: lesson.summary || lesson.description,
      keyConcepts: lesson.keyConcepts.map((c) => c.term),
    });
  } catch (err) {
    console.error('[GenerateLesson] Error:', err);
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
      console.log(`[GenerateLesson] Recovered ${quizQuestions.length} quiz questions from check questions`);
      return { ...lesson, quizQuestions };
    }
  } catch (err) {
    console.error('[GenerateLesson] Quiz recovery failed:', err);
  }
  return lesson;
}
