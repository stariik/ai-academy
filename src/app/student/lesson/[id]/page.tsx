'use client';

// ============================================================
// Student Lesson Page - Multi-Page AI Teaching Experience
// /student/lesson/[id]
// Supports both paged lessons (new) and legacy single-page layout
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import type {
  Lesson,
  LessonPage,
  ChatMessage,
  ContentBlock,
  QuizQuestion,
  QuizResult,
  QuizAttempt,
} from '@/types';
import { use } from 'react';
import { useSession } from '@/hooks/useSession';

// ---- Main Page Component ----

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
      <div className="flex h-screen items-center justify-center bg-gray-50">
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
        <div className="rounded-lg bg-white p-8 shadow-md text-center max-w-md">
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

  // Dual-mode rendering: paged vs legacy
  if (lesson.pages && lesson.pages.length > 0) {
    return <PagedLessonView lesson={lesson} lessonId={lessonId} />;
  }
  return <LegacyLessonView lesson={lesson} lessonId={lessonId} />;
}

// ============================================================
// PAGED LESSON VIEW - Multi-page tutor-guided experience
// ============================================================

function PagedLessonView({
  lesson,
  lessonId,
}: {
  lesson: Lesson;
  lessonId: string;
}) {
  const pages = lesson.pages!;
  const totalPages = lesson.totalPages ?? pages.length;

  const [currentPage, setCurrentPage] = useState(1);
  const [completedPages, setCompletedPages] = useState<number[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [recommended, setRecommended] = useState<Lesson | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load progress on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch('/api/progress');
        const data = await res.json();
        if (Array.isArray(data)) {
          const lp = data.find(
            (p: { lessonId: string }) => p.lessonId === lessonId
          );
          if (lp) {
            setCurrentPage(lp.currentPage || 1);
            setCompletedPages(lp.completedPages || []);
          }
        }
      } catch {
        /* ignore */
      }
      setProgressLoaded(true);
    }
    loadProgress();
  }, [lessonId]);

  const currentPageData = pages.find((p) => p.pageNumber === currentPage);
  const allPagesCompleted = pages.every((p) =>
    completedPages.includes(p.pageNumber)
  );

  const canAccessPage = (pageNum: number) => {
    if (pageNum === 1) return true;
    if (completedPages.includes(pageNum)) return true;
    return completedPages.includes(pageNum - 1);
  };

  const navigateToPage = (pageNum: number) => {
    if (canAccessPage(pageNum)) {
      setCurrentPage(pageNum);
      contentRef.current?.scrollTo(0, 0);
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, currentPage: pageNum }),
      }).catch(() => {});
    }
  };

  const handleCheckPassed = (pageNum: number) => {
    const updated = [...completedPages];
    if (!updated.includes(pageNum)) {
      updated.push(pageNum);
    }
    setCompletedPages(updated);

    // Auto-advance to next page after a short delay
    if (pageNum < totalPages) {
      setTimeout(() => {
        setCurrentPage(pageNum + 1);
        contentRef.current?.scrollTo(0, 0);
      }, 1500);
    }
  };

  const fetchRecommendation = useCallback(async () => {
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setRecommended(data[0]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!progressLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-200">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Unified header with integrated progress */}
      <header className="glass-panel border-b px-6 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/student" className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </a>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-gray-900 truncate max-w-md">{lesson.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 ring-1 ring-inset ring-blue-200">
                  {lesson.difficulty}
                </span>
                <span className="text-xs text-gray-400">
                  Page {currentPage}/{totalPages}
                </span>
                <span className="text-xs text-gray-300">&middot;</span>
                <span className="text-xs text-gray-400">
                  {completedPages.length}/{totalPages} done
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                showChat
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              {showChat ? 'Hide Tutor' : 'AI Tutor'}
            </button>
            {allPagesCompleted && (
              <button
                onClick={() => setShowQuiz(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Final Quiz
              </button>
            )}
          </div>
        </div>
        {/* Integrated thin progress bar at header bottom */}
        <div className="mt-2.5 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-1 rounded-full bg-linear-to-r from-blue-500 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${(completedPages.length / totalPages) * 100}%` }}
          />
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Page stepper */}
        <aside className="w-64 shrink-0 overflow-y-auto border-r bg-gray-50/50 p-4 lesson-scroll">
          <PageStepper
            pages={pages}
            currentPage={currentPage}
            completedPages={completedPages}
            allPagesCompleted={allPagesCompleted}
            onPageClick={navigateToPage}
            onQuizClick={() => setShowQuiz(true)}
          />
        </aside>

        {/* Center - Page content + check questions */}
        <main ref={contentRef} className="flex-1 overflow-y-auto p-6 lg:p-8 lesson-scroll bg-gray-50/30">
          {currentPageData ? (
            <div className="mx-auto max-w-3xl animate-fade-in-up" key={currentPage}>
              <div className="content-surface p-8 mb-8">
                {/* Page header */}
                <div className="mb-8 pb-6 border-b border-gray-100">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 mb-3">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    Page {currentPage} of {totalPages}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{currentPageData.title}</h2>
                </div>

                {/* Page content blocks with stagger */}
                <div className="stagger-children">
                  {[...currentPageData.contentBlocks]
                    .sort((a, b) => a.order - b.order)
                    .map((block) => (
                      <ContentBlockRenderer key={block.id} block={block} />
                    ))}
                </div>
              </div>

              {/* Key concepts for this page */}
              {currentPageData.keyConcepts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Key Concepts
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentPageData.keyConcepts.map((concept, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-purple-100 bg-linear-to-br from-purple-50 to-white p-4 transition hover:shadow-md hover:border-purple-200"
                      >
                        <h4 className="font-semibold text-purple-900 text-sm mb-1">{concept.term}</h4>
                        <p className="text-[0.8125rem] text-purple-700 leading-snug">{concept.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Check Questions */}
              {currentPageData.checkQuestions.length > 0 && (
                <CheckQuestions
                  lessonId={lessonId}
                  pageNumber={currentPage}
                  questions={currentPageData.checkQuestions}
                  alreadyPassed={completedPages.includes(currentPage)}
                  onPass={() => handleCheckPassed(currentPage)}
                />
              )}

              {/* If page has no check questions, show a continue button */}
              {currentPageData.checkQuestions.length === 0 &&
                !completedPages.includes(currentPage) && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => handleCheckPassed(currentPage)}
                      className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                    >
                      I understand this page - Continue
                    </button>
                  </div>
                )}

              {/* Navigation buttons */}
              <div className="mt-10 flex items-center justify-between border-t pt-8">
                <button
                  onClick={() => navigateToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Previous
                </button>

                {currentPage < totalPages ? (
                  <button
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={!canAccessPage(currentPage + 1)}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-300 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all"
                  >
                    Next Page
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ) : allPagesCompleted ? (
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-emerald-600 to-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-200 hover:shadow-md hover:shadow-emerald-300 transition-all"
                  >
                    Take Final Quiz
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-6 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed"
                  >
                    Complete to continue
                  </button>
                )}
              </div>

              {/* Final quiz prompt when all pages done */}
              {allPagesCompleted && (
                <div className="mt-6 bg-linear-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="font-semibold text-green-800 mb-1">
                    All pages completed!
                  </p>
                  <p className="text-sm text-green-700 mb-3">
                    You&apos;ve covered all the material. Ready to test your
                    knowledge?
                  </p>
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                  >
                    Take Final Quiz ({lesson.quizQuestions.length} questions)
                  </button>
                </div>
              )}

              {/* Recommendation */}
              {recommended && recommended.id !== lessonId && (
                <div className="mt-6 bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Next recommended lesson:
                  </p>
                  <Link
                    href={`/student/lesson/${recommended.id}`}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {recommended.title} &rarr;
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-10">
              Page not found
            </div>
          )}
        </main>

        {/* Right panel - AI Chat (page-scoped) */}
        {showChat && (
          <aside className="w-96 shrink-0 border-l bg-white flex flex-col">
            <ChatPanel
              key={`page-${currentPage}`}
              lessonId={lessonId}
              lesson={lesson}
              pageNumber={currentPage}
            />
          </aside>
        )}
      </div>

      {/* Quiz Modal - final quiz only */}
      {showQuiz && (
        <QuizModal
          lessonId={lessonId}
          questions={lesson.quizQuestions.filter((q) => q.scope !== 'check')}
          onClose={() => setShowQuiz(false)}
          onComplete={fetchRecommendation}
        />
      )}
    </div>
  );
}

// ============================================================
// PAGE STEPPER - Left sidebar navigation for paged lessons
// ============================================================

function PageStepper({
  pages,
  currentPage,
  completedPages,
  allPagesCompleted,
  onPageClick,
  onQuizClick,
}: {
  pages: LessonPage[];
  currentPage: number;
  completedPages: number[];
  allPagesCompleted: boolean;
  onPageClick: (pageNum: number) => void;
  onQuizClick: () => void;
}) {
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Lesson Pages
      </h3>
      <nav className="stepper-rail space-y-0.5 relative">
        {sortedPages.map((page) => {
          const isCompleted = completedPages.includes(page.pageNumber);
          const isCurrent = page.pageNumber === currentPage;
          const isLocked =
            !isCompleted &&
            !isCurrent &&
            page.pageNumber > 1 &&
            !completedPages.includes(page.pageNumber - 1);

          return (
            <button
              key={page.id}
              onClick={() => !isLocked && onPageClick(page.pageNumber)}
              disabled={isLocked}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition relative z-10 ${
                isCurrent
                  ? 'bg-blue-50 font-medium text-blue-700 page-active-glow'
                  : isCompleted
                  ? 'text-green-700 hover:bg-green-50/50'
                  : isLocked
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-xs">
                {isCompleted ? (
                  <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-2 ring-emerald-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </span>
                ) : isCurrent ? (
                  <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold shadow-sm ring-2 ring-blue-200">
                    {page.pageNumber}
                  </span>
                ) : isLocked ? (
                  <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                ) : (
                  <span className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-500 flex items-center justify-center font-medium">
                    {page.pageNumber}
                  </span>
                )}
              </span>
              <span className="truncate flex-1">{page.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Final Quiz entry */}
      <div className="mt-4 pt-4 border-t">
        <button
          onClick={onQuizClick}
          disabled={!allPagesCompleted}
          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition ${
            allPagesCompleted
              ? 'bg-linear-to-r from-emerald-50 to-blue-50 text-emerald-700 font-medium ring-1 ring-inset ring-emerald-200 hover:ring-emerald-300'
              : 'text-gray-400 cursor-not-allowed bg-gray-50/50'
          }`}
        >
          <span className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-xs">
            {allPagesCompleted ? (
              <span className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-500 to-blue-500 text-white flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            ) : (
              <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
            )}
          </span>
          <span>Final Quiz</span>
        </button>
      </div>

      {/* Progress */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Progress
          </h3>
          <span className="text-sm font-semibold text-gray-700">
            {Math.round((completedPages.length / pages.length) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-2 rounded-full bg-linear-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{
              width: `${(completedPages.length / pages.length) * 100}%`,
            }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {completedPages.length} of {pages.length} pages complete
        </p>
      </div>
    </div>
  );
}

// ============================================================
// CHECK QUESTIONS - Inline per-page questions
// ============================================================

function CheckQuestions({
  lessonId,
  pageNumber,
  questions,
  alreadyPassed,
  onPass,
}: {
  lessonId: string;
  pageNumber: number;
  questions: QuizQuestion[];
  alreadyPassed: boolean;
  onPass: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<
    {
      questionId: string;
      isCorrect: boolean;
      correctAnswer: string;
      explanation: string;
    }[]
    | null
  >(null);
  const [checking, setChecking] = useState(false);

  if (alreadyPassed) {
    return (
      <div className="content-surface p-0 overflow-hidden">
        <div className="bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Check Questions Completed</h3>
              <p className="text-emerald-100 text-sm">You can proceed to the next page</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allAnswered = questions.every((q) => answers[q.id]?.trim());
  const allCorrect = results?.every((r) => r.isCorrect);

  const handleSubmit = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/quiz/check-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          pageNumber,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });
      const data = await res.json();
      setResults(data.results);
      setSubmitted(true);
      if (data.passed) {
        onPass();
      }
    } catch {
      /* ignore */
    } finally {
      setChecking(false);
    }
  };

  const handleRetry = () => {
    // Keep correct answers, only clear incorrect ones
    const clearedAnswers = { ...answers };
    results?.forEach((r) => {
      if (!r.isCorrect) {
        delete clearedAnswers[r.questionId];
      }
    });
    setAnswers(clearedAnswers);
    setSubmitted(false);
    setResults(null);
  };

  return (
    <div className="content-surface p-0 overflow-hidden">
      <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Check Your Understanding</h3>
            <p className="text-blue-100 text-sm">Answer correctly to unlock the next page</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {questions.map((q, i) => {
          const result = results?.find((r) => r.questionId === q.id);
          return (
            <div
              key={q.id}
              className={`rounded-xl bg-white p-5 border shadow-sm ${
                result
                  ? result.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-red-200 bg-red-50/30'
                  : 'border-gray-200'
              }`}
            >
              <p className="font-medium text-gray-900 mb-3">
                {i + 1}. {q.question}
              </p>

              {q.type === 'mcq' && q.options && (
                <div className="space-y-2">
                  {q.options.map((option, j) => (
                    <label
                      key={j}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                        submitted ? 'cursor-default' : ''
                      } ${
                        answers[q.id] === option
                          ? submitted
                            ? result?.isCorrect
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`check-${q.id}`}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={() =>
                          !submitted &&
                          setAnswers((prev) => ({ ...prev, [q.id]: option }))
                        }
                        disabled={submitted}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="flex gap-4">
                  {['True', 'False'].map((val) => (
                    <button
                      key={val}
                      onClick={() =>
                        !submitted &&
                        setAnswers((prev) => ({ ...prev, [q.id]: val }))
                      }
                      disabled={submitted}
                      className={`flex-1 rounded-lg border p-3 text-center text-sm font-medium transition ${
                        answers[q.id] === val
                          ? submitted
                            ? result?.isCorrect
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-red-500 bg-red-50 text-red-700'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}

              {/* Result feedback */}
              {result && (
                <div
                  className={`mt-3 rounded p-2 text-sm ${
                    result.isCorrect
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {result.isCorrect
                    ? '&#10003; Correct!'
                    : `Incorrect. The answer is: ${result.correctAnswer}`}
                  {result.explanation && (
                    <p className="mt-1 text-xs opacity-80">
                      {result.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit / Retry */}
        <div className="mt-6 text-center pb-2">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || checking}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-300 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              {checking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Checking...
                </>
              ) : !allAnswered ? (
                <>
                  Answer all questions ({Object.keys(answers).length}/{questions.length})
                </>
              ) : (
                <>
                  Check Answers
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </>
              )}
            </button>
          ) : !allCorrect ? (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-300 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Try Again
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 text-emerald-700 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              All correct! Moving to next page...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LEGACY LESSON VIEW - Single-page layout (backward compatible)
// ============================================================

function LegacyLessonView({
  lesson,
  lessonId,
}: {
  lesson: Lesson;
  lessonId: string;
}) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [showChat, setShowChat] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [recommended, setRecommended] = useState<Lesson | null>(null);

  const fetchRecommendation = useCallback(async () => {
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setRecommended(data[0]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <a
            href="/student"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            &larr; Back
          </a>
          <h1 className="text-lg font-bold text-gray-900">{lesson.title}</h1>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {lesson.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              showChat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showChat ? 'Hide' : 'Show'} AI Tutor
          </button>
          <button
            onClick={() => setShowQuiz(true)}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            Take Quiz
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - navigation */}
        <aside className="w-64 shrink-0 overflow-y-auto border-r bg-white p-4">
          <LessonNav
            contentBlocks={lesson.contentBlocks}
            activeSection={activeSection}
            onSectionClick={setActiveSection}
          />
        </aside>

        {/* Center - lesson content */}
        <main className="flex-1 overflow-y-auto p-8">
          <LessonContent lesson={lesson} onSectionVisible={setActiveSection} />
          {/* Take Quiz button at bottom */}
          <div className="mt-12 border-t pt-8 text-center">
            <p className="text-gray-500 mb-4">
              Finished reading? Test your knowledge!
            </p>
            <button
              onClick={() => setShowQuiz(true)}
              className="rounded-lg bg-green-600 px-6 py-3 text-lg font-medium text-white hover:bg-green-700 transition"
            >
              Take the Quiz ({lesson.quizQuestions.length} questions)
            </button>
          </div>

          {/* Next recommendation */}
          {recommended && recommended.id !== lessonId && (
            <div className="mt-6 bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Next recommended lesson:
              </p>
              <Link
                href={`/student/lesson/${recommended.id}`}
                className="text-blue-600 font-semibold hover:underline"
              >
                {recommended.title} &rarr;
              </Link>
            </div>
          )}
        </main>

        {/* Right panel - AI Chat */}
        {showChat && (
          <aside className="w-96 shrink-0 border-l bg-white flex flex-col">
            <ChatPanel lessonId={lessonId} lesson={lesson} />
          </aside>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuiz && (
        <QuizModal
          lessonId={lessonId}
          questions={lesson.quizQuestions}
          onClose={() => setShowQuiz(false)}
          onComplete={fetchRecommendation}
        />
      )}
    </div>
  );
}

// ============================================================
// LEFT SIDEBAR NAVIGATION (legacy)
// ============================================================

function LessonNav({
  contentBlocks,
  activeSection,
  onSectionClick,
}: {
  contentBlocks: ContentBlock[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}) {
  const headings = contentBlocks
    .filter((b) => b.type === 'heading')
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Contents
      </h3>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => {
              onSectionClick(heading.id);
              document
                .getElementById(`block-${heading.id}`)
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`block w-full rounded px-3 py-1.5 text-left text-sm transition ${
              activeSection === heading.id
                ? 'bg-blue-50 font-medium text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {heading.content}
          </button>
        ))}
      </nav>

      {/* Progress */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Progress
        </h3>
        <div className="h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{
              width: `${
                headings.length > 0
                  ? Math.round(
                      ((headings.findIndex((h) => h.id === activeSection) + 1) /
                        headings.length) *
                        100
                    )
                  : 0
              }%`,
            }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {headings.findIndex((h) => h.id === activeSection) + 1} /{' '}
          {headings.length} sections
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN LESSON CONTENT (legacy)
// ============================================================

function LessonContent({
  lesson,
  onSectionVisible,
}: {
  lesson: Lesson;
  onSectionVisible: (id: string) => void;
}) {
  const sortedBlocks = [...lesson.contentBlocks].sort(
    (a, b) => a.order - b.order
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Lesson header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {lesson.title}
        </h1>
        <p className="text-gray-600 mb-4">{lesson.description}</p>

        {/* Learning objectives */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            Learning Objectives
          </h3>
          <ul className="space-y-1">
            {lesson.learningObjectives.map((obj, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-blue-700"
              >
                <span className="mt-0.5 text-blue-400">&#10003;</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Content blocks */}
      {sortedBlocks.map((block) => (
        <ContentBlockRenderer
          key={block.id}
          block={block}
          onVisible={onSectionVisible}
        />
      ))}

      {/* Key concepts */}
      {lesson.keyConcepts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Key Concepts
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lesson.keyConcepts.map((concept, i) => (
              <div
                key={i}
                className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                <h4 className="font-semibold text-gray-900 mb-1">
                  {concept.term}
                </h4>
                <p className="text-sm text-gray-600">{concept.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {lesson.summary && (
        <div className="mt-8 rounded-lg bg-gray-50 border p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
          <div className="lesson-prose text-sm text-gray-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {lesson.summary}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CONTENT BLOCK RENDERER (shared)
// ============================================================

function ContentBlockRenderer({
  block,
  onVisible,
}: {
  block: ContentBlock;
  onVisible?: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || block.type !== 'heading' || !onVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible(block.id);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [block.id, block.type, onVisible]);

  return (
    <div ref={ref} id={`block-${block.id}`} className="mb-6">
      {block.type === 'heading' && (
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3 tracking-tight">
          {block.content}
        </h2>
      )}
      {block.type === 'text' && (
        <div className="lesson-prose text-[0.9375rem] text-gray-700 leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {block.content}
          </ReactMarkdown>
        </div>
      )}
      {block.type === 'code' && (
        <pre className="rounded-lg bg-[#1e1e2e] p-4 overflow-x-auto">
          <code className="text-sm text-[#cdd6f4] leading-relaxed">{block.content}</code>
        </pre>
      )}
      {block.type === 'callout' && (
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1.5">
            Note
          </p>
          <div className="lesson-prose text-sm text-amber-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {block.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {block.type === 'key_concepts' && (
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1.5">
            Key Concept
          </p>
          <div className="lesson-prose text-sm text-purple-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {block.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {block.type === 'summary' && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Summary
          </p>
          <div className="lesson-prose text-sm text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {block.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// AI CHAT PANEL (supports both page-scoped and full-lesson)
// ============================================================

function ChatPanel({
  lessonId,
  lesson,
  pageNumber,
}: {
  lessonId: string;
  lesson: Lesson;
  pageNumber?: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Current page data for page-scoped mode
  const currentPageData =
    pageNumber !== undefined
      ? lesson.pages?.find((p) => p.pageNumber === pageNumber)
      : null;

  // Load chat history + auto-intro for new pages
  useEffect(() => {
    let cancelled = false;

    async function loadHistoryAndMaybeIntro() {
      try {
        let url = `/api/chat-history?lessonId=${lessonId}`;
        if (pageNumber !== undefined) {
          url += `&pageNumber=${pageNumber}`;
        }
        const res = await fetch(url);
        const data = await res.json();

        if (cancelled) return;

        if (data.messages && data.messages.length > 0) {
          // Has existing history - load it
          setMessages(
            data.messages.map(
              (m: {
                id: string;
                role: string;
                content: string;
                timestamp: string;
              }) => ({
                id: m.id,
                role: m.role as ChatMessage['role'],
                content: m.content,
                timestamp: m.timestamp,
              })
            )
          );
          setHistoryLoaded(true);
        } else {
          // No history
          setHistoryLoaded(true);

          // Auto-intro for paged mode on first visit
          if (pageNumber !== undefined && currentPageData) {
            sendAutoIntro();
          }
        }
      } catch {
        if (!cancelled) {
          setHistoryLoaded(true);
          if (pageNumber !== undefined && currentPageData) {
            sendAutoIntro();
          }
        }
      }
    }

    function sendAutoIntro() {
      const pageTitle = currentPageData?.title ?? 'this topic';
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: `I'm ready to learn about "${pageTitle}". Please teach me!`,
        timestamp: new Date().toISOString(),
      };
      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages([userMsg, assistantMsg]);
      setIsStreaming(true);

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [userMsg],
          lessonId,
          pageNumber,
          isFirstVisit: true,
        }),
      })
        .then(async (res) => {
          if (cancelled) return;
          if (!res.ok) throw new Error('Failed');
          const reader = res.body?.getReader();
          if (!reader) throw new Error('No body');
          const decoder = new TextDecoder();
          let fullText = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (cancelled) break;
            fullText += decoder.decode(value, { stream: true });
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: fullText } : m
              )
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content:
                        'Welcome! Ask me anything about this page.',
                    }
                  : m
              )
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsStreaming(false);
          }
        });
    }

    loadHistoryAndMaybeIntro();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, pageNumber]);

  // Suggested questions
  const suggestedQuestions =
    currentPageData
      ? [
          `Can you explain "${currentPageData.title}" in simpler terms?`,
          ...currentPageData.keyConcepts
            .slice(0, 3)
            .map((c) => `What is ${c.term} and why does it matter?`),
          'Can you give me an example of this?',
        ]
      : [
          `Can you explain the main ideas of "${lesson.title}" in simple terms?`,
          ...lesson.keyConcepts
            .slice(0, 3)
            .map((c) => `What is ${c.term} and why does it matter?`),
          'Can you give me a real-world example of this?',
          'What are the most important things I should remember?',
        ];

  const scrollToBottom = useCallback(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const body: Record<string, unknown> = {
          messages: updatedMessages,
          lessonId,
        };
        if (pageNumber !== undefined) {
          body.pageNumber = pageNumber;
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || 'Chat request failed');
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullText } : m
            )
          );
        }
      } catch (err) {
        const errorText =
          err instanceof Error ? err.message : 'Something went wrong';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: `Sorry, I encountered an error: ${errorText}. Please try again.`,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        inputRef.current?.focus();
      }
    },
    [messages, isStreaming, lessonId, pageNumber]
  );

  if (!historyLoaded) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 shadow-sm">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const conceptButtons = currentPageData
    ? currentPageData.keyConcepts.slice(0, 4)
    : lesson.keyConcepts.slice(0, 4);

  return (
    <>
      {/* Chat header */}
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.187 3.187 0 01-.758.515m0 0a3.188 3.188 0 01-2.544 0m3.302-.515a3.187 3.187 0 00.758-.515" /></svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">AI Tutor</h3>
          <p className="text-xs text-gray-400">
            {currentPageData ? `Page ${pageNumber}: ${currentPageData.title}` : 'Ask me anything about this lesson'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-800 font-medium mb-1">
                Welcome! I&apos;m your AI tutor.
              </p>
              <p className="text-xs text-blue-600">
                I&apos;m here to help you understand{' '}
                {currentPageData
                  ? `"${currentPageData.title}"`
                  : `"${lesson.title}"`}
                . Ask me anything, or try one of the suggestions below!
              </p>
            </div>
            {/* Suggested questions */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-400 uppercase">
                Suggested questions
              </p>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="block w-full rounded-lg border border-gray-200 p-2 text-left text-xs text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white px-4 py-2.5 msg-tail-right'
                  : 'bg-gray-100 text-gray-800 px-4 py-3 msg-tail-left'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="chat-prose max-w-none text-[0.8125rem]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content || '...'}
                  </ReactMarkdown>
                  {isStreaming &&
                    msg.id === messages[messages.length - 1]?.id &&
                    !msg.content && (
                      <div className="flex gap-1 py-1">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    )}
                </div>
              ) : (
                <p className="leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick concept buttons */}
      {messages.length > 0 && conceptButtons.length > 0 && (
        <div className="border-t px-3 py-2">
          <p className="text-xs text-gray-400 mb-1">Ask about a concept:</p>
          <div className="flex flex-wrap gap-1">
            {conceptButtons.map((c, i) => (
              <button
                key={i}
                onClick={() =>
                  sendMessage(`Can you explain "${c.term}" in more detail?`)
                }
                disabled={isStreaming}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition disabled:opacity-50"
              >
                {c.term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 bg-gray-50/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isStreaming}
            className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 placeholder:text-gray-400 transition"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9-7-9-7-9 7 9 7z" transform="rotate(-45 12 12)" /></svg>
          </button>
        </form>
      </div>
    </>
  );
}



// ============================================================
// QUIZ MODAL (shared, unchanged) 
// ============================================================

function QuizModal({
  lessonId,
  questions,
  onClose,
  onComplete,
}: {
  lessonId: string;
  questions: QuizQuestion[];
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [grading, setGrading] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const allAnswered = questions.every((q) => answers[q.id]?.trim());

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // Escape key to close quiz
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async () => {
    setGrading(true);
    try {
      const res = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });

      if (!res.ok) throw new Error('Failed to grade quiz');
      const data: QuizResult = await res.json();
      setResult(data);
      setSubmitted(true);
      onComplete?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setGrading(false);
    }
  };

  // Results view
  if (submitted && result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center quiz-backdrop">
        <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-scale-in">
          <div className="p-6">
            {/* Score header */}
            <div className="text-center mb-6 animate-scale-in">
              <div className="relative inline-flex items-center justify-center mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="none" stroke={result.passed ? '#dcfce7' : '#fee2e2'} strokeWidth="8" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke={result.passed ? '#10b981' : '#ef4444'}
                    strokeWidth="8"
                    strokeDasharray="351.86"
                    strokeDashoffset={351.86 * (1 - result.percentage / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${result.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.percentage}%
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {result.passed ? 'Great job!' : 'Keep learning!'}
              </h2>
              <p className="text-gray-500 mt-1">
                {result.score} / {result.totalPoints} points
                {result.passed
                  ? ' - You passed!'
                  : ' - 70% needed to pass'}
              </p>
            </div>

            {/* Per-question results */}
            <div className="space-y-4">
              {questions.map((q, i) => {
                const attempt: QuizAttempt | undefined = result.answers.find(
                  (a) => a.questionId === q.id
                );
                return (
                  <div
                    key={q.id}
                    className={`rounded-lg border p-4 ${
                      attempt?.isCorrect
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 text-lg ${
                          attempt?.isCorrect
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {attempt?.isCorrect ? '\u2713' : '\u2717'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          Q{i + 1}: {q.question}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Your answer: {attempt?.answer || '(no answer)'}
                        </p>
                        {!attempt?.isCorrect && (
                          <p className="mt-1 text-xs text-green-700">
                            Correct answer: {q.correctAnswer}
                          </p>
                        )}
                        {attempt?.feedback && (
                          <div className="mt-2 rounded bg-white/60 p-2 text-xs text-gray-700">
                            {attempt.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setResult(null);
                  setAnswers({});
                  setCurrentIndex(0);
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Retake Quiz
              </button>
              <button
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Back to Lesson
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center quiz-backdrop">
      <div className="mx-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-scale-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quiz</h2>
              <p className="text-sm text-gray-500">
                Question {currentIndex + 1} of {totalQuestions} &middot; 70% needed to pass
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              &#10005;
            </button>
          </div>

          {/* Progress bar + answer count */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{Object.keys(answers).length}/{totalQuestions} answered</span>
              <span>Question {currentIndex + 1}/{totalQuestions}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-green-100 text-green-700'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {currentQuestion.difficulty}
              </span>
              <span className="text-xs text-gray-400">
                {currentQuestion.points} point
                {currentQuestion.points !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-lg font-medium text-gray-900">
              {currentQuestion.question}
            </p>
          </div>

          {/* Answer input - varies by question type */}
          <div className="mb-8">
            {currentQuestion.type === 'mcq' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, i) => (
                  <label
                    key={i}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      answers[currentQuestion.id] === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() =>
                        setAnswer(currentQuestion.id, option)
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'true_false' && (
              <div className="flex gap-4">
                {['True', 'False'].map((val) => (
                  <button
                    key={val}
                    onClick={() =>
                      setAnswer(currentQuestion.id, val)
                    }
                    className={`flex-1 rounded-lg border p-4 text-center text-sm font-medium transition ${
                      answers[currentQuestion.id] === val
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'short_answer' && (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) =>
                  setAnswer(currentQuestion.id, e.target.value)
                }
                placeholder="Type your answer here..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Question dots */}
            <div className="flex gap-1.5">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  title={`Question ${i + 1}${answers[q.id] ? ' (answered)' : ''}`}
                  className={`h-3 w-3 rounded-full transition hover:scale-125 ${
                    i === currentIndex
                      ? 'bg-blue-600 ring-2 ring-blue-200'
                      : answers[q.id]
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() =>
                  setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || grading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {grading ? 'Grading...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
