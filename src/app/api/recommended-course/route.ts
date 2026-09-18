'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OnboardingAnswer } from '@/lib/onboarding';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ recommendedCourseId: null });
    }

    // Get user's onboarding data from metadata
    const onboarding = user.user_metadata?.onboarding;

    if (!onboarding || !Array.isArray(onboarding)) {
      return NextResponse.json({ recommendedCourseId: null });
    }

    // Get all courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description, tags')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (coursesError || !courses || courses.length === 0) {
      return NextResponse.json({ recommendedCourseId: null });
    }

    // Extract user interests and goals from onboarding answers
    const interests: string[] = [];
    const goals: string[] = [];

    onboarding.forEach((answer: OnboardingAnswer) => {
      if (answer.questionId === 'progress_goal') {
        goals.push(...answer.selectedLabels);
      }
      if (answer.selectedLabels) {
        interests.push(...answer.selectedLabels);
      }
      if (answer.freeText) {
        interests.push(answer.freeText.toLowerCase());
      }
    });

    // Score each course based on matching interests and goals
    const scoredCourses = courses.map(course => {
      let score = 0;
      const courseTags = course.tags || [];
      const courseText = `${course.title} ${course.description}`.toLowerCase();

      // Match with user goals (higher weight)
      goals.forEach(goal => {
        if (courseText.includes(goal.toLowerCase())) {
          score += 3;
        }
        courseTags.forEach((tag: string) => {
          if (tag.toLowerCase().includes(goal.toLowerCase()) ||
              goal.toLowerCase().includes(tag.toLowerCase())) {
            score += 2;
          }
        });
      });

      // Match with user interests
      interests.forEach(interest => {
        if (courseText.includes(interest.toLowerCase())) {
          score += 1;
        }
        courseTags.forEach((tag: string) => {
          if (tag.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(tag.toLowerCase())) {
            score += 1;
          }
        });
      });

      return { ...course, score };
    });

    // Sort by score and get the top recommendation
    scoredCourses.sort((a, b) => b.score - a.score);
    const recommendedCourse = scoredCourses[0];

    return NextResponse.json({
      recommendedCourseId: recommendedCourse?.score > 0 ? recommendedCourse.id : null
    });
  } catch (error) {
    console.error('[recommended-course] Error:', error);
    return NextResponse.json({ recommendedCourseId: null });
  }
}
