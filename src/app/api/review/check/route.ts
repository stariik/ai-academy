// ============================================================
// POST /api/review/check
// Grades a single spaced-repetition answer, applies SM-2,
// and returns an AI re-explanation for wrong answers.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import {
  getLesson,
  getOrCreateProfile,
  applyQuizReviewUpdate,
  countReviewAnswers,
  getProgressForSession,
  updateProfile,
  unlockBadges,
} from '@/lib/supabase/db';
import { getSession } from '@/lib/session';
import { buildReviewExplanationPrompt, type TutorLocale } from '@/lib/ai/claude';
import { XP_REVIEW_CORRECT, XP_REVIEW_INCORRECT, updateStreak } from '@/lib/gamification/xp';
import { evaluateBadges } from '@/lib/gamification/badges';

const anthropic = new Anthropic();
const MODEL = 'claude-sonnet-4-5-20250929';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await getSession();
    const body = await request.json();
    const { questionId, lessonId, answer, locale: rawLocale } = body as {
      questionId: string;
      lessonId: string;
      answer: string;
      locale?: string;
    };
    const locale: TutorLocale = rawLocale === 'en' ? 'en' : 'ka';

    if (!questionId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required fields: questionId, lessonId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const lesson = await getLesson(supabase, lessonId);
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const question = lesson.quizQuestions.find((q) => q.id === questionId)
      ?? (lesson.pages ?? []).flatMap((p) => p.checkQuestions).find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Simple comparison — the review flow is lighter weight than full quiz grading.
    const isCorrect =
      (answer ?? '').toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

    await applyQuizReviewUpdate(
      supabase,
      sessionId,
      questionId,
      lessonId,
      isCorrect,
      question.difficulty
    );

    const profile = await getOrCreateProfile(supabase, sessionId);

    // XP + streak for review participation
    const xpGained = isCorrect ? XP_REVIEW_CORRECT : XP_REVIEW_INCORRECT;
    const profileUpdates: Parameters<typeof updateProfile>[2] = {
      totalXp: (profile.totalXp ?? 0) + xpGained,
    };
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
    const updatedProfile = await updateProfile(supabase, sessionId, profileUpdates);

    // Badge evaluation — review contributes to the review_warrior counter and streak/XP badges
    const [reviewAnswers, progress] = await Promise.all([
      countReviewAnswers(supabase, sessionId),
      getProgressForSession(supabase, sessionId),
    ]);
    const completedCount = progress.filter((p) => p.status === 'completed').length;
    const badgeCodes = evaluateBadges({
      completedLessons: completedCount,
      currentStreak: updatedProfile.currentStreak,
      totalXp: updatedProfile.totalXp,
      reviewAnswersCount: reviewAnswers,
      justScoredPerfect: false,
      justCompletedCourse: false,
    });
    const newlyUnlocked = await unlockBadges(supabase, sessionId, badgeCodes, {
      source: 'review',
      questionId,
    });

    // Re-explain failures. Best-effort — failure to reach Claude shouldn't break the flow.
    let reExplanation: string | null = null;
    if (!isCorrect) {
      try {
        const prompt = buildReviewExplanationPrompt({
          lessonTitle: lesson.title,
          lessonSummary: lesson.summary,
          keyConcepts: lesson.keyConcepts,
          question: question.question,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          studentAnswer: answer ?? '',
          preferredStyle: profile.preferredStyle,
          locale,
        });
        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = response.content.find((b) => b.type === 'text');
        if (textBlock && textBlock.type === 'text') reExplanation = textBlock.text;
      } catch (err) {
        console.error('Review re-explanation failed:', err);
      }
    }

    return NextResponse.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      reExplanation,
      gamification: {
        totalXp: updatedProfile.totalXp,
        currentStreak: updatedProfile.currentStreak,
        xpGained,
        unlockedBadges: newlyUnlocked,
      },
    });
  } catch (err) {
    console.error('Review check error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
