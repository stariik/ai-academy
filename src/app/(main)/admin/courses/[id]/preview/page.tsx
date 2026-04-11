'use client';

// ============================================================
// Admin Course Preview — read-only full content viewer.
// Renders every lesson, every page, every content block, every
// check question, and the final quiz in one long scrollable
// document. Used by admins to review generated courses end-to-end
// without going through the student flow.
// ============================================================

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ContentBlockRenderer } from '@/components/lesson/ContentBlockRenderer';
import type { Course, Lesson, QuizQuestion } from '@/types';

type CourseWithFullLessons = Course & { lessons: Lesson[] };

export default function AdminCoursePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const [course, setCourse] = useState<CourseWithFullLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}?include=pages`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Course not found.' : 'Failed to load course.');
        }
        const data = (await res.json()) as CourseWithFullLessons;
        setCourse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-navy rounded-full animate-spin" />
          Loading full course...
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error || 'Course not found.'}
          </div>
          <Link href="/admin/courses" className="inline-block mt-4 text-sm text-teal hover:text-navy">
            &larr; Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = course.lessons.reduce((sum, l) => sum + (l.pages?.length ?? 0), 0);
  const totalCheckQuestions = course.lessons.reduce(
    (sum, l) => sum + (l.pages?.reduce((s, p) => s + p.checkQuestions.length, 0) ?? 0),
    0
  );
  const totalFinalQuizQuestions = course.lessons.reduce(
    (sum, l) => sum + l.quizQuestions.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
      {/* ----- Header ----- */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          href={`/admin/courses/${courseId}`}
          className="text-sm text-gray-500 hover:text-navy inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to course detail
        </Link>
      </div>

      <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-1">
              Admin preview · Read-only
            </p>
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            {course.description && (
              <p className="text-gray-600 mt-2">{course.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Stat label="Lessons" value={course.lessons.length} />
          <Stat label="Pages" value={totalPages} />
          <Stat label="Check questions" value={totalCheckQuestions} />
          <Stat label="Final quiz questions" value={totalFinalQuizQuestions} />
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Scroll through the entire course below. This view renders every content block and question
          exactly as the student will see it, but without progress tracking or chat.
        </p>
      </div>

      {/* ----- Lessons ----- */}
      {course.lessons.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          This course has no lessons yet.
        </div>
      )}

      {course.lessons.map((lesson, lIdx) => (
        <LessonSection key={lesson.id} lesson={lesson} position={lIdx + 1} />
      ))}

      <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
        <Link
          href={`/admin/courses/${courseId}`}
          className="text-sm text-gray-500 hover:text-navy"
        >
          &larr; Back to course detail
        </Link>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-sm text-violet-700 hover:text-violet-900"
        >
          Back to top &uarr;
        </button>
      </div>
      </div>
    </div>
  );
}

// ----- Components -----

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-violet-200 rounded-full text-xs">
      <span className="font-semibold text-violet-700">{value}</span>
      <span className="text-gray-600">{label}</span>
    </div>
  );
}

function LessonSection({ lesson, position }: { lesson: Lesson; position: number }) {
  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700 border-green-200',
    intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
    advanced: 'bg-red-100 text-red-700 border-red-200',
  };
  const diffClass = difficultyColors[lesson.difficulty] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <section className="mb-12 pb-8 border-b border-gray-200 last:border-b-0">
      {/* Lesson header */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-xs font-mono text-gray-400">Lesson {position}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${diffClass}`}>
            {lesson.difficulty}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border bg-gray-50 text-gray-600 border-gray-200">
            {lesson.status}
          </span>
          {lesson.estimatedDurationMinutes > 0 && (
            <span className="text-xs text-gray-400">~{lesson.estimatedDurationMinutes} min</span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h2>
        {lesson.description && <p className="text-gray-600 text-sm">{lesson.description}</p>}

        {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
              Learning objectives
            </p>
            <ul className="space-y-1 text-sm text-blue-900">
              {lesson.learningObjectives.map((obj, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-blue-500">✓</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lesson.keyConcepts && lesson.keyConcepts.length > 0 && (
          <div className="mt-3 bg-teal-50 border border-teal-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">
              Key concepts
            </p>
            <dl className="space-y-2 text-sm">
              {lesson.keyConcepts.map((kc, i) => (
                <div key={i}>
                  <dt className="font-semibold text-teal-900 inline">{kc.term}:</dt>{' '}
                  <dd className="text-teal-800 inline">{kc.definition}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* Pages */}
      {lesson.pages && lesson.pages.length > 0 ? (
        lesson.pages.map((page) => (
          <div key={page.id} className="mb-8 pl-4 border-l-2 border-violet-200">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-xs font-mono text-violet-500">
                Page {page.pageNumber}/{lesson.pages?.length}
              </span>
              {page.difficultyLevel && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                  {page.difficultyLevel}
                </span>
              )}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">{page.title}</h3>

            {page.bridgeFromPrevious && (
              <div className="mb-4 text-sm italic text-gray-600 bg-gray-50 border-l-4 border-gray-300 px-4 py-2 rounded-r">
                <span className="font-semibold not-italic text-gray-500">Bridge from previous:</span>{' '}
                {page.bridgeFromPrevious}
              </div>
            )}

            {/* Content blocks */}
            <div className="mb-4">
              {page.contentBlocks.map((block) => (
                <ContentBlockRenderer key={block.id} block={block} />
              ))}
            </div>

            {/* Page metadata */}
            {page.keyConcepts && page.keyConcepts.length > 0 && (
              <div className="mb-4 bg-teal-50/50 border border-teal-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">
                  Page key concepts
                </p>
                <dl className="space-y-1 text-sm">
                  {page.keyConcepts.map((kc, i) => (
                    <div key={i}>
                      <dt className="font-semibold text-teal-900 inline">{kc.term}:</dt>{' '}
                      <dd className="text-teal-800 inline">{kc.definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {page.commonMisconceptions && page.commonMisconceptions.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                  Common misconceptions
                </p>
                <ul className="space-y-1 text-sm text-red-900">
                  {page.commonMisconceptions.map((m, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-red-500">✗</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {page.realWorldApplications && page.realWorldApplications.length > 0 && (
              <div className="mb-4 bg-green-50 border border-green-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                  Real-world applications
                </p>
                <ul className="space-y-1 text-sm text-green-900">
                  {page.realWorldApplications.map((a, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {page.teachingFlow?.reflectionPrompt && (
              <div className="mb-4 bg-purple-50 border border-purple-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
                  Reflection prompt
                </p>
                <p className="text-sm text-purple-900 italic">
                  &ldquo;{page.teachingFlow.reflectionPrompt}&rdquo;
                </p>
              </div>
            )}

            {/* Check questions */}
            {page.checkQuestions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Check questions ({page.checkQuestions.length})
                </p>
                <div className="space-y-3">
                  {page.checkQuestions.map((q, i) => (
                    <QuestionCard key={q.id || i} question={q} index={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-sm text-gray-400 italic pl-4">No pages in this lesson.</div>
      )}

      {/* Final quiz */}
      {lesson.quizQuestions.length > 0 && (
        <div className="mt-8 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-amber-900 mb-1">Final quiz</h3>
          <p className="text-xs text-amber-700 mb-4">{lesson.quizQuestions.length} questions covering the whole lesson</p>
          <div className="space-y-3">
            {lesson.quizQuestions.map((q, i) => (
              <QuestionCard key={q.id || i} question={q} index={i + 1} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function QuestionCard({ question, index }: { question: QuizQuestion; index: number }) {
  const typeLabels: Record<string, string> = {
    mcq: 'Multiple choice',
    true_false: 'True / False',
    short_answer: 'Short answer',
    ordering: 'Ordering',
    fill_in_blank: 'Fill in the blank',
    matching: 'Matching',
  };

  const diffColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    hard: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-mono text-gray-400">Q{index}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-gray-100 text-gray-600">
            {typeLabels[question.type] || question.type}
          </span>
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${diffColors[question.difficulty] || 'bg-gray-100 text-gray-600'}`}>
            {question.difficulty}
          </span>
          <span className="text-xs text-gray-400">{question.points} pts</span>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-900 mb-3">{question.question}</p>

      {question.options && question.options.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {question.options.map((opt, i) => {
            const isCorrect = opt === question.correctAnswer;
            return (
              <li
                key={i}
                className={`text-sm pl-3 py-1.5 rounded border ${
                  isCorrect
                    ? 'bg-green-50 border-green-200 text-green-900 font-medium'
                    : 'bg-gray-50 border-gray-100 text-gray-700'
                }`}
              >
                <span className="font-mono text-xs text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
                {isCorrect && <span className="ml-2 text-green-600">✓ correct</span>}
              </li>
            );
          })}
        </ul>
      )}

      {(!question.options || question.options.length === 0) && (
        <div className="mb-3 text-sm bg-green-50 border border-green-200 rounded px-3 py-2 text-green-900">
          <span className="font-semibold">Correct answer:</span> {question.correctAnswer}
        </div>
      )}

      {question.explanation && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-2 border-l-2 border-gray-300">
          <span className="font-semibold">Explanation:</span> {question.explanation}
        </div>
      )}
    </div>
  );
}
