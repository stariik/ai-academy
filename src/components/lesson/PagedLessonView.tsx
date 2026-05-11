'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Lesson } from '@/types';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { ChatPanel } from './ChatPanel';
import { QuizModal } from './QuizModal';
import { CheckQuestions } from './CheckQuestions';
import { PageStepper } from './PageStepper';

// ============================================================
// PAGED LESSON VIEW - Multi-page tutor-guided experience
// Responsive: mobile-first with desktop 3-column layout
// ============================================================

export function PagedLessonView({
  lesson,
  lessonId,
}: {
  lesson: Lesson;
  lessonId: string;
}) {
  const pages = lesson.pages!;
  const contentPages = pages.length;
  const hasQuiz = lesson.quizQuestions.filter((q) => q.scope !== 'check').length > 0;
  const totalPages = contentPages + (hasQuiz ? 1 : 0);

  const [currentPage, setCurrentPage] = useState(1);
  const [completedPages, setCompletedPages] = useState<number[]>([]);
  const [showContentMobile, setShowContentMobile] = useState(false);
  const [showContentDesktop, setShowContentDesktop] = useState(true);
  const [showPageNav, setShowPageNav] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1200 : true
  );
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [recommended, setRecommended] = useState<Lesson | null>(null);
  const [unlockedPages, setUnlockedPages] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const checkQuestionsRef = useRef<HTMLDivElement>(null);

  const isCheckUnlocked = completedPages.includes(currentPage) || unlockedPages.has(currentPage);

  const handleCheckUnlocked = useCallback((pageNum: number) => {
    setUnlockedPages((prev) => {
      const next = new Set(prev);
      next.add(pageNum);
      return next;
    });
    setTimeout(() => {
      checkQuestionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  // Load progress on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch('/api/progress');
        const data = await res.json();
        if (Array.isArray(data)) {
          const lp = data.find((p: { lessonId: string }) => p.lessonId === lessonId);
          if (lp) {
            setCurrentPage(lp.currentPage || 1);
            setCompletedPages(lp.completedPages || []);
          }
        }
      } catch { /* ignore */ }
      setProgressLoaded(true);
    }
    loadProgress();
  }, [lessonId]);

  const isQuizPage = hasQuiz && currentPage === totalPages;
  const currentPageData = isQuizPage ? null : pages.find((p) => p.pageNumber === currentPage);
  const allContentPagesCompleted = pages.every((p) => completedPages.includes(p.pageNumber));

  const canAccessPage = (pageNum: number) => {
    if (pageNum === 1) return true;
    if (hasQuiz && pageNum === totalPages) return allContentPagesCompleted;
    if (completedPages.includes(pageNum)) return true;
    return completedPages.includes(pageNum - 1);
  };

  const navigateToPage = (pageNum: number) => {
    if (canAccessPage(pageNum)) {
      setCurrentPage(pageNum);
      setShowPageNav(false);
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

    const nextPage = pageNum + 1;
    if (nextPage <= totalPages) {
      setTimeout(() => {
        setCurrentPage(nextPage);
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
    } catch { /* ignore */ }
  }, []);

  if (!progressLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50" role="status" aria-label="Loading progress">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-teal to-cyan mb-4 shadow-lg shadow-navy-100">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-gray-50">
      {/* ═══ HEADER ═══ */}
      <header className="glass-panel border-b px-3 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-2">
          {/* Left: back + title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <a href="/" className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0" aria-label="მთავარ გვერდზე დაბრუნება">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </a>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{lesson.title}</h1>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                <span className="hidden sm:inline-flex items-center rounded-full bg-cream-50 px-2 py-0.5 text-[11px] font-medium text-navy ring-1 ring-inset ring-cream">
                  {lesson.difficulty}
                </span>
                <span className="text-xs text-gray-400">
                  {currentPage}/{totalPages}
                </span>
                <span className="text-xs text-gray-300 hidden sm:inline" aria-hidden="true">&middot;</span>
                <span className="text-xs text-gray-400 hidden sm:inline">
                  {completedPages.length}/{totalPages} done
                </span>
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Content toggle - mobile (visible below 1080px) */}
            <button
              onClick={() => setShowContentMobile(!showContentMobile)}
              aria-label={showContentMobile ? 'Hide content' : 'Show content'}
              className={`widemd:hidden inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                showContentMobile
                  ? 'bg-navy text-white shadow-sm shadow-navy-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </button>

            {/* Content toggle - desktop (visible at 1080px+) */}
            <button
              onClick={() => setShowContentDesktop(!showContentDesktop)}
              aria-label={showContentDesktop ? 'Hide lesson content' : 'Show lesson content'}
              aria-pressed={showContentDesktop}
              className={`hidden widemd:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                showContentDesktop
                  ? 'bg-navy text-white shadow-sm shadow-navy-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              {showContentDesktop ? 'Hide Content' : 'Show Content'}
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuenow={completedPages.length} aria-valuemin={0} aria-valuemax={totalPages} aria-label="Lesson progress">
          <div
            className="h-1 rounded-full bg-linear-to-r from-navy to-cyan transition-all duration-700 ease-out"
            style={{ width: `${(completedPages.length / totalPages) * 100}%` }}
          />
        </div>
      </header>

      {/* ═══ MOBILE PAGE NAV STRIP ═══ */}
      <MobilePageStrip
        pages={pages}
        currentPage={currentPage}
        completedPages={completedPages}
        allContentPagesCompleted={allContentPagesCompleted}
        hasQuiz={hasQuiz}
        totalPages={totalPages}
        expanded={showPageNav}
        onToggle={() => setShowPageNav(!showPageNav)}
        onNavigate={navigateToPage}
      />

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar - collapsible */}
        <aside
          className={`hidden md:flex flex-col shrink-0 overflow-y-auto border-r bg-gray-50/50 lesson-scroll transition-all duration-300 ease-in-out ${
            sidebarExpanded ? 'w-64 p-4' : 'w-16 p-2 items-center'
          }`}
          aria-label="Page navigation"
        >
          {sidebarExpanded ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pages</h3>
                <button
                  onClick={() => setSidebarExpanded(false)}
                  className="widecontent:hidden p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                  aria-label="Collapse sidebar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              </div>
              <PageStepper
                pages={pages}
                currentPage={currentPage}
                completedPages={completedPages}
                allPagesCompleted={allContentPagesCompleted}
                onPageClick={navigateToPage}
                onQuizClick={() => navigateToPage(totalPages)}
                quizPageNumber={hasQuiz ? totalPages : undefined}
              />
            </>
          ) : (
            <CollapsedSidebar
              pages={pages}
              currentPage={currentPage}
              completedPages={completedPages}
              allContentPagesCompleted={allContentPagesCompleted}
              hasQuiz={hasQuiz}
              totalPages={totalPages}
              onNavigate={navigateToPage}
              onExpand={() => setSidebarExpanded(true)}
            />
          )}
        </aside>

        {/* Desktop chat panel - always visible */}
        <aside className="hidden md:flex md:flex-[3] border-r bg-white flex-col" aria-label="AI Tutor chat">
          <ChatPanel
            key={`page-${currentPage}`}
            lessonId={lessonId}
            lesson={lesson}
            pageNumber={currentPage}
            onUnlockCheck={() => handleCheckUnlocked(currentPage)}
          />
        </aside>

        {/* Mobile chat - inline, always visible on mobile */}
        <div className="flex flex-col flex-1 md:hidden bg-white">
          <ChatPanel
            key={`mobile-page-${currentPage}`}
            lessonId={lessonId}
            lesson={lesson}
            pageNumber={currentPage}
            onUnlockCheck={() => handleCheckUnlocked(currentPage)}
          />
        </div>

        {/* Content area - visible at 1080px+, toggleable */}
        {showContentDesktop && (
        <main
          ref={contentRef}
          className="hidden widemd:block widemd:flex-[2] overflow-y-auto p-4 sm:p-6 lesson-scroll bg-gray-50/30 lesson-content-panel"
          aria-label="Lesson content"
        >
          {currentPageData ? (
            <div className="mx-auto max-w-3xl animate-fade-in-up" key={currentPage}>
              <div className="content-surface p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
                {currentPageData.bridgeFromPrevious && currentPage > 1 && (
                  <div className="rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 p-3 mb-4 text-sm text-teal-800 italic">
                    {currentPageData.bridgeFromPrevious}
                  </div>
                )}

                {/* Page header */}
                <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      {`Page ${currentPage} of ${totalPages}`}
                    </div>
                    {currentPageData.difficultyLevel && (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        currentPageData.difficultyLevel === 'foundational' ? 'bg-green-100 text-green-700'
                          : currentPageData.difficultyLevel === 'intermediate' ? 'bg-amber-100 text-amber-700'
                          : currentPageData.difficultyLevel === 'advanced' ? 'bg-red-100 text-red-700'
                          : 'bg-cream text-navy'
                      }`}>
                        {currentPageData.difficultyLevel}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight page-title">{currentPageData.title}</h2>
                </div>

                {/* Content blocks */}
                <div className="stagger-children">
                  {[...currentPageData.contentBlocks]
                    .sort((a, b) => a.order - b.order)
                    .map((block) => (
                      <ContentBlockRenderer
                        key={block.id}
                        block={block}
                        translatedContent={undefined}
                      />
                    ))}
                </div>
              </div>

              {/* Common misconceptions */}
              {currentPageData.commonMisconceptions && currentPageData.commonMisconceptions.length > 0 && (
                <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-3 sm:p-4 mb-4 sm:mb-6" role="note">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-2">
                    Common Misconceptions
                  </p>
                  <ul className="list-disc list-inside text-sm text-orange-900 space-y-1">
                    {currentPageData.commonMisconceptions.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Real-world applications */}
              {currentPageData.realWorldApplications && currentPageData.realWorldApplications.length > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
                    Real-World Applications
                  </p>
                  <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
                    {currentPageData.realWorldApplications.map((app, i) => (
                      <li key={i}>{app}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reflection prompt */}
              {currentPageData.teachingFlow?.reflectionPrompt && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700 mb-1">
                    Reflect
                  </p>
                  <p className="text-sm text-yellow-900 italic">
                    {currentPageData.teachingFlow.reflectionPrompt}
                  </p>
                </div>
              )}

              {/* Key concepts */}
              {currentPageData.keyConcepts.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    Key Concepts
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentPageData.keyConcepts.map((concept, i) => (
                      <div key={i} className="rounded-xl border border-cream bg-linear-to-br from-cream-50 to-white p-3 sm:p-4 transition hover:shadow-md hover:border-cream">
                        <h4 className="font-semibold text-navy text-sm mb-1">{concept.term}</h4>
                        <p className="text-[0.8125rem] text-navy leading-snug">{concept.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Check Questions */}
              {currentPageData.checkQuestions.length > 0 && (
                <div ref={checkQuestionsRef}>
                  <CheckQuestions
                    lessonId={lessonId}
                    pageNumber={currentPage}
                    questions={currentPageData.checkQuestions}
                    alreadyPassed={completedPages.includes(currentPage)}
                    locked={!isCheckUnlocked}
                    onPass={() => handleCheckPassed(currentPage)}
                  />
                </div>
              )}

              {/* Continue button for pages without check questions */}
              {currentPageData.checkQuestions.length === 0 && !completedPages.includes(currentPage) && (
                <div className="mt-6 sm:mt-8 text-center">
                  {isCheckUnlocked ? (
                    <button
                      onClick={() => handleCheckPassed(currentPage)}
                      className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition active:scale-95"
                    >
                      I understand this page - Continue
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 sm:px-5 py-2.5 text-sm text-gray-500">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      <span>Work through the material with your AI tutor to continue</span>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 sm:mt-10 flex items-center justify-between border-t pt-6 sm:pt-8 pb-4">
                <button
                  onClick={() => navigateToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-4 sm:px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {currentPage < totalPages ? (
                  <button
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={!canAccessPage(currentPage + 1)}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-5 sm:px-6 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed ${
                      currentPage === contentPages && allContentPagesCompleted
                        ? 'bg-linear-to-r from-emerald-600 to-navy text-white shadow-emerald-200'
                        : 'bg-navy text-white shadow-navy-100 hover:bg-navy-light'
                    }`}
                  >
                    <span>{currentPage === contentPages && allContentPagesCompleted ? 'Take Quiz' : 'Next'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ) : (
                  <button disabled className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-5 sm:px-6 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed">
                    Complete to continue
                  </button>
                )}
              </div>
            </div>
          ) : isQuizPage ? (
            /* ═══ QUIZ PAGE ═══ */
            <div className="mx-auto max-w-3xl animate-fade-in-up" key="quiz-page">
              <div className="content-surface p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
                <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Final Quiz
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight page-title">Test Your Knowledge</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    {lesson.quizQuestions.filter((q) => q.scope !== 'check').length} questions covering everything you learned.
                  </p>
                </div>

                <QuizModal
                  lessonId={lessonId}
                  questions={lesson.quizQuestions.filter((q) => q.scope !== 'check')}
                  onClose={() => navigateToPage(contentPages)}
                  onComplete={fetchRecommendation}
                  inline
                />
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-6 sm:pt-8 pb-4">
                <button
                  onClick={() => navigateToPage(currentPage - 1)}
                  className="inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </button>
                {recommended && recommended.id !== lessonId && (
                  <Link href={`/student/lesson/${recommended.id}`} className="inline-flex items-center gap-2 rounded-full bg-navy px-5 sm:px-6 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition active:scale-95">
                    Next Lesson
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-10">Page not found</div>
          )}
        </main>
        )}
      </div>

      {/* ═══ MOBILE CONTENT PANEL (slide-up overlay, visible below 1080px) ═══ */}
      {showContentMobile && (
        <div className="widemd:hidden fixed inset-0 z-40 flex flex-col">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowContentMobile(false)} />
          {/* Content container */}
          <div className="relative mt-auto h-[85dvh] bg-white rounded-t-2xl shadow-2xl flex flex-col animate-slide-up overflow-hidden">
            {/* Header + close */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-teal to-cyan flex items-center justify-center shrink-0" aria-hidden="true">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <span className="font-semibold text-gray-900 text-sm">Lesson Content</span>
              </div>
              <button
                onClick={() => setShowContentMobile(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                aria-label="Close content"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {currentPageData ? (
                <div className="mx-auto max-w-3xl" key={`mobile-content-${currentPage}`}>
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">{currentPageData.title}</h2>
                  </div>
                  <div className="stagger-children">
                    {[...currentPageData.contentBlocks]
                      .sort((a, b) => a.order - b.order)
                      .map((block) => (
                        <ContentBlockRenderer
                          key={block.id}
                          block={block}
                          translatedContent={undefined}
                        />
                      ))}
                  </div>
                  {currentPageData.keyConcepts.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Concepts</h3>
                      <div className="grid gap-3">
                        {currentPageData.keyConcepts.map((concept, i) => (
                          <div key={i} className="rounded-xl border border-cream bg-linear-to-br from-cream-50 to-white p-3">
                            <h4 className="font-semibold text-navy text-sm mb-1">{concept.term}</h4>
                            <p className="text-[0.8125rem] text-navy leading-snug">{concept.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : isQuizPage ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Quiz page — close this panel to take the quiz.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MOBILE PAGE STRIP — always-visible collapsible page navigator
// Collapsed: horizontal row of icon circles (no titles)
// Expanded: accordion showing circles + page titles
// ============================================================

type MobilePageStripProps = {
  pages: import('@/types').LessonPage[];
  currentPage: number;
  completedPages: number[];
  allContentPagesCompleted: boolean;
  hasQuiz: boolean;
  totalPages: number;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (pageNum: number) => void;
};

function MobilePageStrip({
  pages,
  currentPage,
  completedPages,
  allContentPagesCompleted,
  hasQuiz,
  totalPages,
  expanded,
  onToggle,
  onNavigate,
}: MobilePageStripProps) {
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  const canAccessPage = (pageNum: number) => {
    if (pageNum === 1) return true;
    if (hasQuiz && pageNum === totalPages) return allContentPagesCompleted;
    if (completedPages.includes(pageNum)) return true;
    return completedPages.includes(pageNum - 1);
  };

  const isLocked = (pageNum: number) => !canAccessPage(pageNum);

  // Icon node shared between collapsed + expanded rows
  const PageIcon = ({ pageNum, isQuiz }: { pageNum: number; isQuiz?: boolean }) => {
    const completed = completedPages.includes(pageNum) || (isQuiz && allContentPagesCompleted && currentPage === pageNum);
    const current = pageNum === currentPage;
    const locked = isLocked(pageNum);

    if (isQuiz) {
      if (allContentPagesCompleted) {
        return current ? (
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm ring-2 ring-emerald-200">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
        ) : (
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-linear-to-br from-emerald-500 to-navy text-white flex items-center justify-center">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
        );
      }
      return (
        <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </span>
      );
    }

    if (completed) {
      return (
        <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-2 ring-emerald-200">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        </span>
      );
    }
    if (current) {
      return (
        <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-navy text-white flex items-center justify-center font-semibold text-[10px] sm:text-xs shadow-sm ring-2 ring-navy-100">
          {pageNum}
        </span>
      );
    }
    if (locked) {
      return (
        <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </span>
      );
    }
    return (
      <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-gray-300 text-gray-500 flex items-center justify-center font-medium text-[10px] sm:text-xs">
        {pageNum}
      </span>
    );
  };

  return (
    <div className="md:hidden bg-white border-b border-gray-200 shadow-sm" aria-label="Page navigation">
      {/* ── COLLAPSED ROW (always rendered; hidden when expanded) ── */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-20 opacity-100'}`}
        aria-hidden={expanded}
      >
        <div className="flex items-center gap-0 px-1 sm:px-2 py-0.5 sm:py-1">
          {/* Scrollable dots row */}
          <div className="flex-1 overflow-x-auto flex items-center gap-1 sm:gap-2 px-0.5 sm:px-1 py-1 sm:py-1.5 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
            {sortedPages.map((page) => (
              <button
                key={page.id}
                onClick={() => !isLocked(page.pageNumber) && onNavigate(page.pageNumber)}
                disabled={isLocked(page.pageNumber)}
                aria-label={`Go to page ${page.pageNumber}${isLocked(page.pageNumber) ? ' (locked)' : ''}`}
                aria-current={page.pageNumber === currentPage ? 'page' : undefined}
                className="shrink-0 flex items-center justify-center touch-manipulation disabled:cursor-not-allowed p-1 sm:p-1.5"
              >
                <PageIcon pageNum={page.pageNumber} />
              </button>
            ))}
            {hasQuiz && (
              <button
                onClick={() => !isLocked(totalPages) && onNavigate(totalPages)}
                disabled={isLocked(totalPages)}
                aria-label={`Final Quiz${isLocked(totalPages) ? ' (locked)' : ''}`}
                aria-current={currentPage === totalPages ? 'page' : undefined}
                className="shrink-0 flex items-center justify-center touch-manipulation disabled:cursor-not-allowed p-1 sm:p-1.5"
              >
                <PageIcon pageNum={totalPages} isQuiz />
              </button>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={onToggle}
            aria-label="Expand page navigation"
            aria-expanded={false}
            className="shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition touch-manipulation ml-0.5 sm:ml-1 p-1.5 sm:p-2.5"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── EXPANDED LIST ── */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-[55vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
        aria-hidden={!expanded}
      >
        {/* Sticky header inside expanded panel */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5 border-b border-gray-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pages</span>
          <button
            onClick={onToggle}
            aria-label="Collapse page navigation"
            aria-expanded={true}
            className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition touch-manipulation"
            style={{ minWidth: 36, minHeight: 36 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(55vh - 44px)' }}>
          <nav className="px-3 py-2 space-y-0.5" aria-label="Lesson pages">
            {sortedPages.map((page) => {
              const completed = completedPages.includes(page.pageNumber);
              const current = page.pageNumber === currentPage;
              const locked = isLocked(page.pageNumber);
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    if (!locked) {
                      onNavigate(page.pageNumber);
                    }
                  }}
                  disabled={locked}
                  aria-current={current ? 'page' : undefined}
                  aria-label={`Page ${page.pageNumber}: ${page.title}${completed ? ' (completed)' : locked ? ' (locked)' : ''}`}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition touch-manipulation ${
                    current
                      ? 'bg-navy-50 text-navy font-medium'
                      : completed
                      ? 'text-green-700 hover:bg-green-50/50 active:bg-green-50'
                      : locked
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  style={{ minHeight: 44 }}
                >
                  <span className="shrink-0" aria-hidden="true">
                    <PageIcon pageNum={page.pageNumber} />
                  </span>
                  <span className="truncate flex-1 text-[0.8125rem] leading-snug">{page.title}</span>
                  {current && (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-navy" aria-hidden="true" />
                  )}
                </button>
              );
            })}

            {hasQuiz && (
              <div className="pt-2 mt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    if (!isLocked(totalPages)) {
                      onNavigate(totalPages);
                    }
                  }}
                  disabled={isLocked(totalPages)}
                  aria-current={currentPage === totalPages ? 'page' : undefined}
                  aria-label={`Final Quiz${isLocked(totalPages) ? ' (locked — complete all pages first)' : ''}`}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition touch-manipulation ${
                    currentPage === totalPages
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : allContentPagesCompleted
                      ? 'text-emerald-700 font-medium hover:bg-emerald-50/50 active:bg-emerald-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  style={{ minHeight: 44 }}
                >
                  <span className="shrink-0" aria-hidden="true">
                    <PageIcon pageNum={totalPages} isQuiz />
                  </span>
                  <span className="flex-1 text-[0.8125rem]">Final Quiz</span>
                  {currentPage === totalPages && (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Collapsed Desktop Sidebar — vertical strip of page dots
// ============================================================

type CollapsedSidebarProps = {
  pages: import('@/types').LessonPage[];
  currentPage: number;
  completedPages: number[];
  allContentPagesCompleted: boolean;
  hasQuiz: boolean;
  totalPages: number;
  onNavigate: (pageNum: number) => void;
  onExpand: () => void;
};

function CollapsedSidebar({
  pages,
  currentPage,
  completedPages,
  allContentPagesCompleted,
  hasQuiz,
  totalPages,
  onNavigate,
  onExpand,
}: CollapsedSidebarProps) {
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  const canAccessPage = (pageNum: number) => {
    if (pageNum === 1) return true;
    if (hasQuiz && pageNum === totalPages) return allContentPagesCompleted;
    if (completedPages.includes(pageNum)) return true;
    return completedPages.includes(pageNum - 1);
  };

  const DotIcon = ({ pageNum, isQuiz }: { pageNum: number; isQuiz?: boolean }) => {
    const completed = completedPages.includes(pageNum);
    const current = pageNum === currentPage;
    const locked = !canAccessPage(pageNum);

    if (isQuiz) {
      if (allContentPagesCompleted) {
        return (
          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${current ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-linear-to-br from-emerald-500 to-navy'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
        );
      }
      return (
        <span className="w-9 h-9 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </span>
      );
    }

    if (completed) {
      return (
        <span className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-2 ring-emerald-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        </span>
      );
    }
    if (current) {
      return (
        <span className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-semibold text-xs ring-2 ring-navy-100">
          {pageNum}
        </span>
      );
    }
    if (locked) {
      return (
        <span className="w-9 h-9 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </span>
      );
    }
    return (
      <span className="w-9 h-9 rounded-full bg-white border-2 border-gray-300 text-gray-500 flex items-center justify-center font-medium text-xs">
        {pageNum}
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center gap-1 py-2 w-full">
      {/* Expand button */}
      <button
        onClick={onExpand}
        className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition mb-2"
        aria-label="Expand sidebar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* Page dots */}
      {sortedPages.map((page) => (
        <button
          key={page.id}
          onClick={() => canAccessPage(page.pageNumber) && onNavigate(page.pageNumber)}
          disabled={!canAccessPage(page.pageNumber)}
          aria-label={`Page ${page.pageNumber}: ${page.title}`}
          aria-current={page.pageNumber === currentPage ? 'page' : undefined}
          className="shrink-0 flex items-center justify-center disabled:cursor-not-allowed transition hover:scale-110"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <DotIcon pageNum={page.pageNumber} />
        </button>
      ))}

      {/* Quiz dot */}
      {hasQuiz && (
        <>
          <div className="w-6 border-t border-gray-200 my-1" />
          <button
            onClick={() => canAccessPage(totalPages) && onNavigate(totalPages)}
            disabled={!canAccessPage(totalPages)}
            aria-label="Final Quiz"
            aria-current={currentPage === totalPages ? 'page' : undefined}
            className="shrink-0 flex items-center justify-center disabled:cursor-not-allowed transition hover:scale-110"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <DotIcon pageNum={totalPages} isQuiz />
          </button>
        </>
      )}
    </div>
  );
}
