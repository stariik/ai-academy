'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lesson, Course, LessonProgress, StudentProfile } from '@/types';
import { useSession } from '@/hooks/useSession';

export default function StudentPage() {
  const { sessionId } = useSession();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [lessonsRes, coursesRes, progressRes, profileRes, recsRes] = await Promise.all([
          fetch('/api/lessons?status=published'),
          fetch('/api/courses'),
          fetch('/api/progress'),
          fetch('/api/profile'),
          fetch('/api/recommendations'),
        ]);

        const [lessonsData, coursesData, progressData, profileData, recsData] = await Promise.all([
          lessonsRes.json(),
          coursesRes.json(),
          progressRes.json(),
          profileRes.json(),
          recsRes.json(),
        ]);

        setLessons(Array.isArray(lessonsData) ? lessonsData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setProgress(Array.isArray(progressData) ? progressData : []);
        setProfile(profileData?.id ? profileData : null);
        setRecommendations(Array.isArray(recsData) ? recsData : []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [sessionId]);

  const getProgressForLesson = (lessonId: string) =>
    progress.find((p) => p.lessonId === lessonId);

  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const inProgressCount = progress.filter((p) => p.status === 'in_progress').length;

  const difficultyColor = (d: string) => {
    if (d === 'beginner') return 'text-green-600';
    if (d === 'intermediate') return 'text-amber-600';
    return 'text-red-600';
  };

  const statusBadge = (lessonId: string) => {
    const p = getProgressForLesson(lessonId);
    if (!p) return null;
    if (p.status === 'completed')
      return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Completed</span>;
    if (p.status === 'in_progress')
      return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">In Progress</span>;
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Stats bar */}
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
            <p className="text-xs text-gray-500 mt-1">In Progress</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{profile.totalQuizzes}</p>
            <p className="text-xs text-gray-500 mt-1">Quizzes Taken</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {profile.averageScore > 0 ? `${Math.round(profile.averageScore)}%` : '--'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Avg Score</p>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Recommended for You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((lesson) => (
              <Link
                key={lesson.id}
                href={`/student/lesson/${lesson.id}`}
                className="block bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{lesson.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{lesson.description}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-medium ${difficultyColor(lesson.difficulty)}`}>
                    {lesson.difficulty}
                  </span>
                  <span className="text-xs text-gray-400">{lesson.estimatedDurationMinutes} min</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Courses */}
      {courses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.map((course) => {
              const courseLessons = lessons.filter((l) => l.courseId === course.id);
              const courseCompleted = courseLessons.filter(
                (l) => getProgressForLesson(l.id)?.status === 'completed'
              ).length;
              const pct = courseLessons.length > 0 ? Math.round((courseCompleted / courseLessons.length) * 100) : 0;

              return (
                <Link
                  key={course.id}
                  href={`/student/course/${course.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                  {course.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{pct}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {courseCompleted}/{courseLessons.length} lessons
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* All Lessons */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">All Lessons</h2>
          <span className="text-sm text-gray-500">{lessons.length} available</span>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-1">No lessons available</p>
            <p className="text-sm">Lessons will appear here once an admin publishes them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/student/lesson/${lesson.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                    {lesson.title}
                  </h3>
                  {statusBadge(lesson.id)}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{lesson.description}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-medium capitalize ${difficultyColor(lesson.difficulty)}`}>
                    {lesson.difficulty}
                  </span>
                  <span className="text-xs text-gray-400">{lesson.estimatedDurationMinutes} min</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
