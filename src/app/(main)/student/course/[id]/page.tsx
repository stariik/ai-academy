'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import type { Course, Lesson, LessonProgress } from '@/types';
import { useSession } from '@/hooks/useSession';

type CourseWithLessons = Course & { lessons: Lesson[] };

export default function StudentCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const { sessionId } = useSession();
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [courseRes, progressRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch('/api/progress'),
        ]);
        const [courseData, progressData] = await Promise.all([
          courseRes.json(),
          progressRes.json(),
        ]);
        setCourse(courseData.id ? courseData : null);
        setProgress(Array.isArray(progressData) ? progressData : []);
      } catch {
        setCourse(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [courseId, sessionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="h-8 w-8 border-4 border-teal-100 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-900">Course not found</h2>
        <Link href="/student" className="text-teal mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const publishedLessons = course.lessons
    .filter((l) => l.status === 'published')
    .sort((a, b) => (a.positionInCourse ?? 999) - (b.positionInCourse ?? 999));

  const completedCount = publishedLessons.filter(
    (l) => progress.find((p) => p.lessonId === l.id)?.status === 'completed'
  ).length;
  const pct = publishedLessons.length > 0 ? Math.round((completedCount / publishedLessons.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/student" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; Back to Dashboard
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
        {course.description && (
          <p className="text-gray-500 mt-2">{course.description}</p>
        )}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 h-3 rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-teal transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">{pct}% complete</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {completedCount} of {publishedLessons.length} lessons completed
        </p>
      </div>

      {/* Lesson list */}
      <div className="space-y-3">
        {publishedLessons.map((lesson, i) => {
          const p = progress.find((pr) => pr.lessonId === lesson.id);
          const isCompleted = p?.status === 'completed';
          const isInProgress = p?.status === 'in_progress';

          return (
            <Link
              key={lesson.id}
              href={`/student/lesson/${lesson.id}`}
              className={`flex items-center gap-4 p-4 rounded-lg border transition hover:shadow-md ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : isInProgress
                  ? 'bg-teal-50 border-teal-100'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Step number */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isInProgress
                    ? 'bg-teal text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '\u2713' : i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{lesson.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {lesson.difficulty} &middot; {lesson.estimatedDurationMinutes} min
                  {p?.timeSpentSeconds ? ` &middot; ${Math.round(p.timeSpentSeconds / 60)} min spent` : ''}
                </p>
              </div>

              {isCompleted && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  Done
                </span>
              )}
              {isInProgress && (
                <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal font-medium">
                  Continue
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {publishedLessons.length === 0 && (
        <p className="text-center py-8 text-gray-500">
          No published lessons in this course yet.
        </p>
      )}
    </div>
  );
}
