// ============================================================
// Quiz Grading API Route
// POST /api/quiz/check
// Enhanced: saves attempt, analyzes weaknesses, updates profile
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLesson, saveQuizAttempt, getOrCreateProfile, updateProfile, upsertLessonProgress } from '@/lib/supabase/db';
import { gradeQuizWithAI } from '@/lib/ai/claude';
import { getSessionId } from '@/lib/session';
import { analyzeQuizWeaknesses, mergeTopicAnalysis, determineTeachingStyle } from '@/lib/ai/learning-analytics';
import { QuizResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, answers } = body as {
      lessonId: string;
      answers: { questionId: string; answer: string }[];
    };

    if (!lessonId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, answers' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the lesson
    const lesson = await getLesson(supabase, lessonId);
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const questions = lesson.quizQuestions;
    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No quiz questions found for this lesson' },
        { status: 404 }
      );
    }

    // Grade with AI for personalized feedback
    const gradingResults = await gradeQuizWithAI(
      questions,
      answers,
      { title: lesson.title, summary: lesson.summary }
    );

    // Calculate totals
    const score = gradingResults.reduce((sum, r) => sum + r.points, 0);
    const totalPoints = gradingResults.reduce((sum, r) => sum + r.maxPoints, 0);
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentage >= 70;

    // Build QuizResult
    const result: QuizResult = {
      score,
      totalPoints,
      percentage,
      passed,
      answers: gradingResults.map((r) => ({
        questionId: r.questionId,
        answer: answers.find((a) => a.questionId === r.questionId)?.answer ?? '',
        isCorrect: r.isCorrect,
        feedback: r.feedback,
      })),
    };

    // Persist quiz attempt and update profile
    const sessionId = await getSessionId();
    if (sessionId) {
      try {
        // Save the quiz attempt
        await saveQuizAttempt(supabase, {
          sessionId,
          lessonId,
          score,
          totalPoints,
          percentage,
          passed,
          answers: gradingResults.map((r) => ({
            questionId: r.questionId,
            answer: answers.find((a) => a.questionId === r.questionId)?.answer ?? '',
            isCorrect: r.isCorrect,
            feedback: r.feedback,
          })),
        });

        // Analyze weaknesses from this quiz
        const analysis = analyzeQuizWeaknesses(questions, gradingResults, lesson);

        // Get existing profile and merge
        const profile = await getOrCreateProfile(supabase, sessionId);
        const merged = mergeTopicAnalysis(profile, analysis);
        const newStyle = determineTeachingStyle({
          ...profile,
          averageScore: Math.round(
            (profile.averageScore * profile.totalQuizzes + percentage) /
            (profile.totalQuizzes + 1)
          ),
        });

        await updateProfile(supabase, sessionId, {
          weakTopics: merged.weakTopics,
          strongTopics: merged.strongTopics,
          preferredStyle: newStyle,
          totalQuizzes: profile.totalQuizzes + 1,
          averageScore: Math.round(
            (profile.averageScore * profile.totalQuizzes + percentage) /
            (profile.totalQuizzes + 1)
          ),
        });

        // Mark lesson as completed if passed
        if (passed) {
          await upsertLessonProgress(supabase, {
            sessionId,
            lessonId,
            status: 'completed',
          });
        }
      } catch (err) {
        console.error('Failed to persist quiz data:', err);
        // Don't fail the response - quiz result is still valid
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Quiz check error:', err);
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
