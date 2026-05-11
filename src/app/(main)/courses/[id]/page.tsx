'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import type { Course, Lesson, LessonProgress } from '@/types';

type CourseWithLessons = Course & { lessons: Lesson[] };

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'დამწყები',
  intermediate: 'საშუალო',
  advanced: 'რთული',
};

export default function CourseDetailPage({
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
        setCourse(courseData?.id ? courseData : null);
        setProgress(Array.isArray(progressData) ? progressData : []);
      } catch {
        setCourse(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [courseId, sessionId]);

  const progressById = useMemo(() => {
    const m = new Map<string, LessonProgress>();
    progress.forEach((p) => m.set(p.lessonId, p));
    return m;
  }, [progress]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="h-10 w-10 border-4 border-cyan-50 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-xl font-black text-navy mb-2">კურსი ვერ მოიძებნა</p>
        <Link
          href="/courses"
          className="text-sm font-bold text-teal hover:text-navy transition"
        >
          ← ყველა კურსი
        </Link>
      </div>
    );
  }

  const publishedLessons = course.lessons
    .filter((l) => l.status === 'published')
    .sort((a, b) => (a.positionInCourse ?? 999) - (b.positionInCourse ?? 999));

  const total = publishedLessons.length;
  const completedCount = publishedLessons.filter(
    (l) => progressById.get(l.id)?.status === 'completed'
  ).length;
  const inProgressCount = publishedLessons.filter(
    (l) => progressById.get(l.id)?.status === 'in_progress'
  ).length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const totalMinutes = publishedLessons.reduce((s, l) => s + (l.estimatedDurationMinutes || 0), 0);

  const diffCount: Record<string, number> = {};
  publishedLessons.forEach((l) => (diffCount[l.difficulty] = (diffCount[l.difficulty] || 0) + 1));
  const mainDifficulty = Object.entries(diffCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Resume: first in-progress lesson, then first not-started
  const resumeLesson =
    publishedLessons.find((l) => progressById.get(l.id)?.status === 'in_progress') ||
    publishedLessons.find((l) => !progressById.get(l.id) || progressById.get(l.id)?.status === 'not_started');

  const started = completedCount + inProgressCount > 0;

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(10,196,224,0.35) 0, transparent 45%), radial-gradient(circle at 85% 70%, rgba(9,146,194,0.4) 0, transparent 45%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-cyan mb-5 no-underline transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            ყველა კურსი
          </Link>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
            <div>
              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {course.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-bold bg-cyan/10 border border-cyan/30 text-cyan px-3 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl sm:text-5xl font-black leading-[1.1] tracking-tight mb-4">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-base sm:text-lg text-white/75 max-w-2xl leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* Meta row */}
              <div className="mt-6 flex flex-wrap gap-4 sm:gap-6 text-sm">
                <MetaItem
                  icon={
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  }
                  label={`${total} გაკვეთილი`}
                />
                {totalMinutes > 0 && (
                  <MetaItem
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    }
                    label={
                      totalMinutes >= 60
                        ? `${Math.round(totalMinutes / 60)} საათი`
                        : `${totalMinutes} წუთი`
                    }
                  />
                )}
                {mainDifficulty && (
                  <MetaItem
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    }
                    label={DIFFICULTY_LABELS[mainDifficulty] || mainDifficulty}
                  />
                )}
              </div>
            </div>

            {/* Progress card */}
            <div className="bg-white text-navy rounded-2xl shadow-2xl p-5 sm:p-6">
              {started ? (
                <>
                  <p className="text-xs font-black uppercase tracking-wider text-teal mb-2">
                    შენი პროგრესი
                  </p>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-4xl font-black text-navy">{pct}%</span>
                    <span className="text-sm text-navy-100 font-semibold">დასრულებული</span>
                  </div>
                  <div className="h-2.5 bg-cyan-50 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-teal to-cyan transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-navy-100 mb-4">
                    {completedCount}/{total} გაკვეთილი დასრულებულია
                  </p>
                  {resumeLesson && pct < 100 && (
                    <Link
                      href={`/student/lesson/${resumeLesson.id}`}
                      className="block w-full text-center bg-gradient-to-r from-teal to-cyan text-white font-bold py-3 rounded-xl no-underline hover:shadow-lg hover:shadow-teal/30 hover:-translate-y-0.5 transition"
                    >
                      განაგრძე სწავლა
                    </Link>
                  )}
                  {pct === 100 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                      <p className="text-sm font-black text-green-700">🎉 ყველა გაკვეთილი დასრულებულია!</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs font-black uppercase tracking-wider text-teal mb-1">
                    მზად ხარ?
                  </p>
                  <p className="text-lg font-black text-navy mb-4">
                    დაიწყე ეს კურსი
                  </p>
                  {resumeLesson && (
                    <Link
                      href={`/student/lesson/${resumeLesson.id}`}
                      className="block w-full text-center bg-gradient-to-r from-teal to-cyan text-white font-bold py-3 rounded-xl no-underline hover:shadow-lg hover:shadow-teal/30 hover:-translate-y-0.5 transition"
                    >
                      დაწყება
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LESSONS */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
              კურსის შინაარსი
            </h2>
            <p className="text-sm text-teal mt-0.5 font-medium">
              {total} გაკვეთილი
              {totalMinutes > 0 &&
                ` · ${
                  totalMinutes >= 60 ? `${Math.round(totalMinutes / 60)} სთ` : `${totalMinutes} წთ`
                }`}
            </p>
          </div>
        </div>

        {publishedLessons.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-cyan-50">
            <p className="text-base font-bold text-navy mb-1">გაკვეთილები ჯერ არ არის</p>
            <p className="text-sm text-navy-100">გაკვეთილები მალე გამოჩნდება.</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {publishedLessons.map((lesson, i) => {
              const p = progressById.get(lesson.id);
              const isCompleted = p?.status === 'completed';
              const isInProgress = p?.status === 'in_progress';
              const lessonPct = isCompleted
                ? 100
                : Math.min(100, Math.max(0, Math.round(p?.scrollPercentage || 0)));

              return (
                <li key={lesson.id}>
                  <Link
                    href={`/student/lesson/${lesson.id}`}
                    className={`group flex items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all no-underline hover:shadow-lg hover:-translate-y-0.5 ${
                      isCompleted
                        ? 'bg-white border-teal-100 hover:border-teal'
                        : isInProgress
                        ? 'bg-gradient-to-r from-white to-cyan-50 border-cyan hover:border-teal'
                        : 'bg-white border-cyan-50 hover:border-cyan'
                    }`}
                  >
                    {/* Step badge */}
                    <div
                      className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${
                        isCompleted
                          ? 'bg-gradient-to-br from-teal to-cyan text-white'
                          : isInProgress
                          ? 'bg-gradient-to-br from-navy to-teal text-white'
                          : 'bg-cream text-navy'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-navy group-hover:text-teal transition line-clamp-2">
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-navy-100 font-medium">
                        <span className="capitalize">
                          {DIFFICULTY_LABELS[lesson.difficulty] || lesson.difficulty}
                        </span>
                        <span>·</span>
                        <span>{lesson.estimatedDurationMinutes} წთ</span>
                        {isInProgress && (
                          <>
                            <span>·</span>
                            <span className="text-teal font-bold">{lessonPct}%</span>
                          </>
                        )}
                      </div>
                      {isInProgress && (
                        <div className="mt-2 h-1 bg-cyan-50 rounded-full overflow-hidden max-w-xs">
                          <div
                            className="h-full bg-gradient-to-r from-teal to-cyan"
                            style={{ width: `${lessonPct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isCompleted && (
                        <span className="hidden sm:inline text-[11px] font-bold bg-teal-50 text-teal px-2.5 py-1 rounded-full">
                          დასრულდა
                        </span>
                      )}
                      {isInProgress && (
                        <span className="hidden sm:inline text-[11px] font-bold bg-cyan text-white px-2.5 py-1 rounded-full">
                          მიმდინარე
                        </span>
                      )}
                      <svg
                        className="h-5 w-5 text-teal group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function MetaItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-white/80">
      <svg className="h-4 w-4 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
      <span className="font-semibold">{label}</span>
    </div>
  );
}
