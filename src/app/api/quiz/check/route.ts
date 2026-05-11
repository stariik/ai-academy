// ============================================================
// Quiz Grading API Route
// POST /api/quiz/check
// Enhanced: saves attempt, analyzes weaknesses, updates profile,
// seeds spaced-repetition items, awards XP + streak + badges.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getLesson,
  saveQuizAttempt,
  getOrCreateProfile,
  updateProfile,
  upsertLessonProgress,
  applyQuizReviewUpdate,
  unlockBadges,
  getProgressForSession,
  getAllLessons,
} from '@/lib/supabase/db';
import { gradeQuizWithAI } from '@/lib/ai/claude';
import { getSessionId } from '@/lib/session';
import { analyzeQuizWeaknesses, mergeTopicAnalysis, determineTeachingStyle } from '@/lib/ai/learning-analytics';
import { calculateLessonXp, updateStreak } from '@/lib/gamification/xp';
import { evaluateBadges } from '@/lib/gamification/badges';
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

        // Seed / promote spaced-repetition items — one per question graded.
        await Promise.all(
          gradingResults.map((r) => {
            const q = questions.find((qq) => qq.id === r.questionId);
            if (!q) return Promise.resolve();
            return applyQuizReviewUpdate(
              supabase,
              sessionId,
              r.questionId,
              lessonId,
              r.isCorrect,
              (q.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium'
            );
          })
        );

        // Analyze weaknesses from this quiz
        const analysis = analyzeQuizWeaknesses(questions, gradingResults, lesson);

        // Get existing profile and merge
        const profile = await getOrCreateProfile(supabase, sessionId);
        const merged = mergeTopicAnalysis(profile, analysis);
        const nextAverage = Math.round(
          (profile.averageScore * profile.totalQuizzes + percentage) /
          (profile.totalQuizzes + 1)
        );
        const newStyle = determineTeachingStyle({ ...profile, averageScore: nextAverage });

        // Gamification: XP, streak, lesson-complete flag
        const profileUpdates: Parameters<typeof updateProfile>[2] = {
          weakTopics: merged.weakTopics,
          strongTopics: merged.strongTopics,
          preferredStyle: newStyle,
          totalQuizzes: profile.totalQuizzes + 1,
          averageScore: nextAverage,
        };

        const unlockedBadgeCodes: string[] = [];
        if (passed) {
          const questionPoints = questions.reduce((sum, q) => sum + (q.points ?? 0), 0);
          const isFirstAttempt = profile.totalQuizzes === 0; // rough proxy — OK for now
          const xpGained = calculateLessonXp({ percentage, questionPoints, isFirstAttempt });
          profileUpdates.totalXp = (profile.totalXp ?? 0) + xpGained;

          const streakUpdate = updateStreak({
            currentStreak: profile.currentStreak ?? 0,
            longestStreak: profile.longestStreak ?? 0,
            lastActivityDate: profile.lastActivityDate,
          });
          if (streakUpdate) {
            profileUpdates.currentStreak = streakUpdate.currentStreak;
            profileUpdates.longestStreak = streakUpdate.longestStreak;
            profileUpdates.lastActivityDate = streakUpdate.lastActivityDate;
          }
        }

        const updatedProfile = await updateProfile(supabase, sessionId, profileUpdates);

        // Mark lesson as completed if passed, then evaluate badges on fresh state.
        if (passed) {
          await upsertLessonProgress(supabase, {
            sessionId,
            lessonId,
            status: 'completed',
          });

          // Gather post-event state for badge evaluation
          const progressAfter = await getProgressForSession(supabase, sessionId);
          const completedLessons = progressAfter.filter((p) => p.status === 'completed');
          const completedCount = completedLessons.length;

          // Detect "course complete" — did this lesson finish its course?
          let justCompletedCourse = false;
          if (lesson.courseId) {
            const courseLessons = await getAllLessons(supabase, { courseId: lesson.courseId });
            const completedIdsInCourse = new Set(
              completedLessons.filter((p) => courseLessons.some((l) => l.id === p.lessonId)).map((p) => p.lessonId)
            );
            justCompletedCourse =
              courseLessons.length > 0 &&
              completedIdsInCourse.size === courseLessons.length;
          }

          const badgeCodes = evaluateBadges({
            completedLessons: completedCount,
            currentStreak: updatedProfile.currentStreak,
            totalXp: updatedProfile.totalXp,
            reviewAnswersCount: 0, // quiz path doesn't affect review counter
            justScoredPerfect: percentage === 100,
            justCompletedCourse,
          });

          const newlyUnlocked = await unlockBadges(supabase, sessionId, badgeCodes, {
            lessonId,
            percentage,
          });
          unlockedBadgeCodes.push(...newlyUnlocked);
        }

        return NextResponse.json({
          ...result,
          gamification: {
            totalXp: updatedProfile.totalXp,
            currentStreak: updatedProfile.currentStreak,
            longestStreak: updatedProfile.longestStreak,
            unlockedBadges: unlockedBadgeCodes,
          },
        });
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
