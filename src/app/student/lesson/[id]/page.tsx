'use client';

// ============================================================
// Student Lesson Page - Routes to paged or legacy view
// /student/lesson/[id]
// ============================================================

import { useState, useEffect } from 'react';
import { use } from 'react';
import type { Lesson } from '@/types';
import { useSession } from '@/hooks/useSession';
import { PagedLessonView } from '@/components/lesson/PagedLessonView';
import { LegacyLessonView } from '@/components/lesson/LegacyLessonView';

export default function StudentLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: lessonId } = use(params);
  const { sessionId } = useSession();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lesson data
  useEffect(() => {
    async function fetchLesson() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        if (!res.ok) throw new Error('Failed to load lesson');
        const data = await res.json();
        setLesson(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [lessonId]);

  // Mark lesson as in_progress on mount
  useEffect(() => {
    if (!sessionId || !lesson) return;
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, status: 'in_progress' }),
    }).catch(() => {});
  }, [sessionId, lesson, lessonId]);

  // Time tracking - update every 30 seconds
  useEffect(() => {
    if (!sessionId || !lesson) return;
    let seconds = 0;
    const interval = setInterval(() => {
      seconds += 30;
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, timeSpentSeconds: seconds }),
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionId, lesson, lessonId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50" role="status" aria-label="Loading lesson">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-200">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-md text-center max-w-md" role="alert">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Lesson not found'}</p>
          <a
            href="/"
            className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // Route to the appropriate view
  if (lesson.pages && lesson.pages.length > 0) {
    return <PagedLessonView lesson={lesson} lessonId={lessonId} />;
  }
  return <LegacyLessonView lesson={lesson} lessonId={lessonId} />;
}
