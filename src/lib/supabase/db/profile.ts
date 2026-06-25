import { SupabaseClient } from '@supabase/supabase-js';
import type {
  StudentProfileRow,
} from '../types';
import type {
  Lesson,
  StudentProfile,
} from '@/types';
import { getAllLessons } from './lessons';
import { getProgressForSession } from './progress';


// ============================================================
// Student Profiles
// ============================================================

export async function getOrCreateProfile(
  supabase: SupabaseClient,
  sessionId: string
): Promise<StudentProfile> {
  const { data } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (data) return mapProfileRow(data as StudentProfileRow);

  const { data: newProfile, error } = await supabase
    .from('student_profiles')
    .insert({
      session_id: sessionId,
      weak_topics: [],
      strong_topics: [],
      preferred_style: 'socratic',
      total_quizzes: 0,
      average_score: 0,
      total_time_spent: 0,
    })
    .select()
    .single();

  if (error?.code === '23505') {
    // Race condition: another request already created the profile — just fetch it
    const { data: existing } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    if (existing) return mapProfileRow(existing as StudentProfileRow);
  }
  if (error || !newProfile) throw new Error(`Failed to create profile: ${error?.message}`);
  return mapProfileRow(newProfile as StudentProfileRow);
}

export async function updateProfile(
  supabase: SupabaseClient,
  sessionId: string,
  updates: Partial<{
    weakTopics: { topic: string; score: number }[];
    strongTopics: { topic: string; score: number }[];
    preferredStyle: string;
    totalQuizzes: number;
    averageScore: number;
    totalTimeSpent: number;
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
  }>
): Promise<StudentProfile> {
  const rowUpdates: Record<string, unknown> = {};
  if (updates.weakTopics !== undefined) rowUpdates.weak_topics = updates.weakTopics;
  if (updates.strongTopics !== undefined) rowUpdates.strong_topics = updates.strongTopics;
  if (updates.preferredStyle !== undefined) rowUpdates.preferred_style = updates.preferredStyle;
  if (updates.totalQuizzes !== undefined) rowUpdates.total_quizzes = updates.totalQuizzes;
  if (updates.averageScore !== undefined) rowUpdates.average_score = updates.averageScore;
  if (updates.totalTimeSpent !== undefined) rowUpdates.total_time_spent = updates.totalTimeSpent;
  if (updates.totalXp !== undefined) rowUpdates.total_xp = updates.totalXp;
  if (updates.currentStreak !== undefined) rowUpdates.current_streak = updates.currentStreak;
  if (updates.longestStreak !== undefined) rowUpdates.longest_streak = updates.longestStreak;
  if (updates.lastActivityDate !== undefined) rowUpdates.last_activity_date = updates.lastActivityDate;

  const { data, error } = await supabase
    .from('student_profiles')
    .update(rowUpdates)
    .eq('session_id', sessionId)
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to update profile: ${error?.message}`);
  return mapProfileRow(data as StudentProfileRow);
}

function mapProfileRow(row: StudentProfileRow): StudentProfile {
  return {
    id: row.id,
    sessionId: row.session_id,
    weakTopics: row.weak_topics,
    strongTopics: row.strong_topics,
    preferredStyle: row.preferred_style,
    totalQuizzes: row.total_quizzes,
    averageScore: row.average_score,
    totalTimeSpent: row.total_time_spent,
    totalXp: row.total_xp ?? 0,
    currentStreak: row.current_streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    lastActivityDate: row.last_activity_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================
// Recommendations
// ============================================================

export async function getRecommendedLessons(
  supabase: SupabaseClient,
  sessionId: string,
  limit = 5
): Promise<Lesson[]> {
  // Get profile and completed lesson IDs
  const [profile, progress] = await Promise.all([
    getOrCreateProfile(supabase, sessionId),
    getProgressForSession(supabase, sessionId),
  ]);

  const completedIds = progress
    .filter((p) => p.status === 'completed')
    .map((p) => p.lessonId);

  // Get all published lessons
  const allLessons = await getAllLessons(supabase, { status: 'published' });

  // Score and sort
  const scored = allLessons
    .filter((l) => !completedIds.includes(l.id))
    .map((lesson) => {
      let score = 0;

      // Weak topic overlap
      const weakTopicNames = profile.weakTopics.map((t) => t.topic.toLowerCase());
      const lessonTopics = [
        ...lesson.keyConcepts.filter((c) => c.term).map((c) => c.term.toLowerCase()),
        ...(lesson.tags ?? []).map((t) => t.toLowerCase()),
      ];
      const overlap = lessonTopics.filter((t) =>
        weakTopicNames.some((wt) => t.includes(wt) || wt.includes(t))
      ).length;
      score += overlap * 10;

      // Difficulty match
      if (profile.averageScore < 50 && lesson.difficulty === 'beginner') score += 5;
      else if (profile.averageScore >= 50 && profile.averageScore < 85 && lesson.difficulty === 'intermediate') score += 5;
      else if (profile.averageScore >= 85 && lesson.difficulty === 'advanced') score += 5;

      // Course progression bonus
      if (lesson.courseId && lesson.positionInCourse !== undefined) {
        const inProgressInCourse = progress.find(
          (p) => p.status === 'in_progress' && allLessons.find((l) => l.id === p.lessonId)?.courseId === lesson.courseId
        );
        if (inProgressInCourse) score += 8;
      }

      return { lesson, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.lesson);
}
