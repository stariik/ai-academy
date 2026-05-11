// ============================================================
// Public read-only progress snapshot by share token (Task 10)
// No auth — the token IS the credential. Revocable via /api/share-token.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getSessionByShareToken,
  getOrCreateProfile,
  getProgressForSession,
  getUserBadges,
  getRecentQuizAttempts,
  getAllLessons,
  getAllCourses,
} from '@/lib/supabase/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const supabase = await createClient();
    const session = await getSessionByShareToken(supabase, token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or revoked link' }, { status: 404 });
    }

    const [profile, progress, badges, recentAttempts, lessons, courses] = await Promise.all([
      getOrCreateProfile(supabase, session.id),
      getProgressForSession(supabase, session.id),
      getUserBadges(supabase, session.id),
      getRecentQuizAttempts(supabase, session.id, 10),
      getAllLessons(supabase, { status: 'published' }),
      getAllCourses(supabase),
    ]);

    // Course-level progress summary
    const enrolled = courses
      .map((c) => {
        const cLessons = lessons.filter((l) => l.courseId === c.id);
        const done = cLessons.filter((l) =>
          progress.find((p) => p.lessonId === l.id && p.status === 'completed')
        ).length;
        const inProgress = cLessons.filter((l) =>
          progress.find((p) => p.lessonId === l.id && p.status === 'in_progress')
        ).length;
        const pct = cLessons.length > 0 ? Math.round((done / cLessons.length) * 100) : 0;
        return {
          id: c.id,
          title: c.title,
          totalLessons: cLessons.length,
          done,
          inProgress,
          pct,
        };
      })
      .filter((x) => x.done + x.inProgress > 0);

    // Weekly-ish aggregates (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const attemptsLast7 = recentAttempts.filter((a) => new Date(a.createdAt) >= weekAgo);
    const weeklyAverage =
      attemptsLast7.length > 0
        ? Math.round(
            attemptsLast7.reduce((sum, a) => sum + a.percentage, 0) / attemptsLast7.length
          )
        : null;

    const totalTimeMinutes = Math.round(
      progress.reduce((sum, p) => sum + (p.timeSpentSeconds ?? 0), 0) / 60
    );

    return NextResponse.json({
      student: {
        displayName: session.displayName,
      },
      gamification: {
        totalXp: profile.totalXp,
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
      },
      totals: {
        completed: progress.filter((p) => p.status === 'completed').length,
        inProgress: progress.filter((p) => p.status === 'in_progress').length,
        totalQuizzes: profile.totalQuizzes,
        averageScore: Math.round(profile.averageScore ?? 0),
        totalMinutes: totalTimeMinutes,
      },
      weekly: {
        quizzesThisWeek: attemptsLast7.length,
        averageScoreThisWeek: weeklyAverage,
      },
      weakTopics: profile.weakTopics ?? [],
      strongTopics: profile.strongTopics ?? [],
      courses: enrolled,
      recentAttempts: recentAttempts.slice(0, 5),
      badges: badges.map((b) => ({ code: b.badgeCode, earnedAt: b.earnedAt })),
    });
  } catch (err) {
    console.error('Share snapshot error:', err);
    return NextResponse.json({ error: 'Failed to load snapshot' }, { status: 500 });
  }
}
