// ============================================================
// API Route: POST /api/quiz/check-page
// Grades per-page check questions (simple string comparison)
// Updates lesson_progress.completed_pages on pass
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLesson, upsertLessonProgress, getProgressForLesson } from '@/lib/supabase/db';
import { getSessionId } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, pageNumber, answers } = body as {
      lessonId: string;
      pageNumber: number;
      answers: { questionId: string; answer: string }[];
    };

    if (!lessonId || pageNumber === undefined || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, pageNumber, answers' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const lesson = await getLesson(supabase, lessonId);
    if (!lesson || !lesson.pages) {
      return NextResponse.json({ error: 'Lesson or pages not found' }, { status: 404 });
    }

    const page = lesson.pages.find((p) => p.pageNumber === pageNumber);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Grade each check question by simple string comparison
    const results = page.checkQuestions.map((q) => {
      const studentAnswer = answers.find((a) => a.questionId === q.id);
      const isCorrect =
        (studentAnswer?.answer ?? '').toLowerCase().trim() ===
        q.correctAnswer.toLowerCase().trim();

      return {
        questionId: q.id,
        isCorrect,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    });

    const allCorrect = results.every((r) => r.isCorrect);

    // If passed, update progress
    if (allCorrect) {
      const sessionId = await getSessionId();
      if (sessionId) {
        try {
          const existing = await getProgressForLesson(supabase, sessionId, lessonId);
          const completedPages = existing?.completedPages ?? [];

          if (!completedPages.includes(pageNumber)) {
            completedPages.push(pageNumber);
          }

          await upsertLessonProgress(supabase, {
            sessionId,
            lessonId,
            currentPage: pageNumber + 1,
            completedPages,
          });
        } catch (err) {
          console.error('Failed to update page progress:', err);
        }
      }
    }

    return NextResponse.json({ passed: allCorrect, results });
  } catch (err) {
    console.error('Check page error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
