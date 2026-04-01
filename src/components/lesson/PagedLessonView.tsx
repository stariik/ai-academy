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
  const totalPages = contentPages + (hasQuiz ? 1 : 0); // +1 for quiz page

  const [currentPage, setCurrentPage] = useState(1);
  const [completedPages, setCompletedPages] = useState<number[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [recommended, setRecommended] = useState<Lesson | null>(null);
  const [language, setLanguage] = useState<'en' | 'ka'>('en');
  const [unlockedPages, setUnlockedPages] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const checkQuestionsRef = useRef<HTMLDivElement>(null);

  // --- Page translation state ---
  const [translatedPages, setTranslatedPages] = useState<Record<number, Record<string, string>>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Translate page content when language switches to Georgian
  useEffect(() => {
    if (language !== 'ka') return;
    if (translatedPages[currentPage]) return;

    const pageData = pages.find((p) => p.pageNumber === currentPage);
    if (!pageData) return;

    const textsToTranslate: string[] = [];
    const keys: string[] = [];

    textsToTranslate.push(pageData.title);
    keys.push('title');

    if (pageData.bridgeFromPrevious) {
      textsToTranslate.push(pageData.bridgeFromPrevious);
      keys.push('bridge');
    }

    [...pageData.contentBlocks]
      .sort((a, b) => a.order - b.order)
      .forEach((block) => {
        textsToTranslate.push(block.content);
        keys.push(`block-${block.id}`);
      });

    pageData.commonMisconceptions?.forEach((m, i) => {
      textsToTranslate.push(m);
      keys.push(`misconception-${i}`);
    });

    pageData.realWorldApplications?.forEach((a, i) => {
      textsToTranslate.push(a);
      keys.push(`application-${i}`);
    });

    if (pageData.teachingFlow?.reflectionPrompt) {
      textsToTranslate.push(pageData.teachingFlow.reflectionPrompt);
      keys.push('reflection');
    }

    pageData.keyConcepts.forEach((c, i) => {
      textsToTranslate.push(c.term);
      keys.push(`concept-term-${i}`);
      textsToTranslate.push(c.definition);
      keys.push(`concept-def-${i}`);
    });

    if (textsToTranslate.length === 0) return;

    setIsTranslating(true);
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: textsToTranslate, targetLang: 'ka', sourceLang: 'en' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.translations) {
          const map: Record<string, string> = {};
          keys.forEach((key, i) => {
            map[key] = data.translations[i];
          });
          setTranslatedPages((prev) => ({ ...prev, [currentPage]: map }));
        }
      })
      .catch((err) => console.error('Translation error:', err))
      .finally(() => setIsTranslating(false));
  }, [language, currentPage, translatedPages, pages]);

  const t = useCallback(
    (key: string, original: string): string => {
      if (language !== 'ka') return original;
      return translatedPages[currentPage]?.[key] ?? original;
    },
    [language, currentPage, translatedPages]
  );

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
    // Quiz page requires all content pages completed
    if (hasQuiz && pageNum === totalPages) return allContentPagesCompleted;
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

    // Auto-advance: next content page, or quiz page if last content page
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
      {/* Header */}
      <header className="glass-panel border-b px-6 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/student" className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition" aria-label="Back to student dashboard">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
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
                <span className="text-xs text-gray-300" aria-hidden="true">&middot;</span>
                <span className="text-xs text-gray-400">
                  {completedPages.length}/{totalPages} done
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ka' : 'en')}
              aria-label={language === 'ka' ? 'Switch to English' : 'Switch to Georgian'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                language === 'ka'
                  ? 'bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-300'
                  : 'bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200 hover:bg-gray-200'
              }`}
            >
              {language === 'ka' ? '\u{1F1EC}\u{1F1EA} \u10E5\u10D0\u10E0' : '\u{1F1EC}\u{1F1E7} EN'}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              aria-label={showChat ? 'Hide AI tutor chat' : 'Show AI tutor chat'}
              aria-pressed={showChat}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                showChat
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              {showChat ? 'Hide Tutor' : 'AI Tutor'}
            </button>
            {/* Final Quiz button removed — quiz is now a page */}
          </div>
        </div>
        <div className="mt-2.5 h-1 rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuenow={completedPages.length} aria-valuemin={0} aria-valuemax={totalPages} aria-label="Lesson progress">
          <div
            className="h-1 rounded-full bg-linear-to-r from-blue-500 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${(completedPages.length / totalPages) * 100}%` }}
          />
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-64 shrink-0 overflow-y-auto border-r bg-gray-50/50 p-4 lesson-scroll" aria-label="Page navigation">
          <PageStepper
            pages={pages}
            currentPage={currentPage}
            completedPages={completedPages}
            allPagesCompleted={allContentPagesCompleted}
            onPageClick={navigateToPage}
            onQuizClick={() => navigateToPage(totalPages)}
            quizPageNumber={hasQuiz ? totalPages : undefined}
          />
        </aside>

        {/* Center - AI Chat (main area) */}
        {showChat && (
          <aside className="flex-1 border-r bg-white flex flex-col" aria-label="AI Tutor chat">
            <ChatPanel
              key={`page-${currentPage}`}
              lessonId={lessonId}
              lesson={lesson}
              pageNumber={currentPage}
              onUnlockCheck={() => handleCheckUnlocked(currentPage)}
              language={language}
            />
          </aside>
        )}

        {/* Right panel - Page content */}
        <main ref={contentRef} className="w-[34rem] shrink-0 overflow-y-auto p-6 lesson-scroll bg-gray-50/30" aria-label="Lesson content">
          {currentPageData ? (
            <div className="mx-auto max-w-3xl animate-fade-in-up" key={currentPage}>
              <div className="content-surface p-8 mb-8">
                {isTranslating && language === 'ka' && (
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-2 mb-4 flex items-center gap-2 text-sm text-purple-700" role="status">
                    <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" aria-hidden="true" />
                    {'\u10D8\u10D7\u10D0\u10E0\u10D2\u10DB\u10DC\u10D4\u10D1\u10D0 \u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D0\u10D3...'}
                  </div>
                )}

                {currentPageData.bridgeFromPrevious && currentPage > 1 && (
                  <div className="rounded-lg bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 p-3 mb-4 text-sm text-teal-800 italic">
                    {t('bridge', currentPageData.bridgeFromPrevious)}
                  </div>
                )}

                {/* Page header */}
                <div className="mb-8 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      {language === 'ka' ? `\u10D2\u10D5\u10D4\u10E0\u10D3\u10D8 ${currentPage} / ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                    </div>
                    {currentPageData.difficultyLevel && (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        currentPageData.difficultyLevel === 'foundational' ? 'bg-green-100 text-green-700'
                          : currentPageData.difficultyLevel === 'intermediate' ? 'bg-amber-100 text-amber-700'
                          : currentPageData.difficultyLevel === 'advanced' ? 'bg-red-100 text-red-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {currentPageData.difficultyLevel}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t('title', currentPageData.title)}</h2>
                </div>

                {/* Content blocks */}
                <div className="stagger-children">
                  {[...currentPageData.contentBlocks]
                    .sort((a, b) => a.order - b.order)
                    .map((block) => (
                      <ContentBlockRenderer
                        key={block.id}
                        block={block}
                        translatedContent={language === 'ka' ? translatedPages[currentPage]?.[`block-${block.id}`] : undefined}
                      />
                    ))}
                </div>
              </div>

              {/* Common misconceptions */}
              {currentPageData.commonMisconceptions && currentPageData.commonMisconceptions.length > 0 && (
                <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4 mb-6" role="note">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-2">
                    {language === 'ka' ? '\u10D2\u10D0\u10D5\u10E0\u10EA\u10D4\u10DA\u10D4\u10D1\u10E3\u10DA\u10D8 \u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D4\u10D1\u10D8' : 'Common Misconceptions'}
                  </p>
                  <ul className="list-disc list-inside text-sm text-orange-900 space-y-1">
                    {currentPageData.commonMisconceptions.map((m, i) => (
                      <li key={i}>{t(`misconception-${i}`, m)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Real-world applications */}
              {currentPageData.realWorldApplications && currentPageData.realWorldApplications.length > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
                    {language === 'ka' ? '\u10E0\u10D4\u10D0\u10DA\u10E3\u10E0\u10D8 \u10D2\u10D0\u10DB\u10DD\u10E7\u10D4\u10DC\u10D4\u10D1\u10D0' : 'Real-World Applications'}
                  </p>
                  <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
                    {currentPageData.realWorldApplications.map((app, i) => (
                      <li key={i}>{t(`application-${i}`, app)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reflection prompt */}
              {currentPageData.teachingFlow?.reflectionPrompt && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700 mb-1">
                    {language === 'ka' ? '\u10D3\u10D0\u10E4\u10D8\u10E5\u10E0\u10D3\u10D8' : 'Reflect'}
                  </p>
                  <p className="text-sm text-yellow-900 italic">
                    {t('reflection', currentPageData.teachingFlow.reflectionPrompt)}
                  </p>
                </div>
              )}

              {/* Key concepts */}
              {currentPageData.keyConcepts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {language === 'ka' ? '\u10EB\u10D8\u10E0\u10D8\u10D7\u10D0\u10D3\u10D8 \u10EA\u10DC\u10D4\u10D1\u10D4\u10D1\u10D8' : 'Key Concepts'}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentPageData.keyConcepts.map((concept, i) => (
                      <div key={i} className="rounded-xl border border-purple-100 bg-linear-to-br from-purple-50 to-white p-4 transition hover:shadow-md hover:border-purple-200">
                        <h4 className="font-semibold text-purple-900 text-sm mb-1">{t(`concept-term-${i}`, concept.term)}</h4>
                        <p className="text-[0.8125rem] text-purple-700 leading-snug">{t(`concept-def-${i}`, concept.definition)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Check Questions — inline on the page */}
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
                <div className="mt-8 text-center">
                  {isCheckUnlocked ? (
                    <button
                      onClick={() => handleCheckPassed(currentPage)}
                      className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                    >
                      I understand this page - Continue
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2.5 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Work through the material with your AI tutor to continue
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-10 flex items-center justify-between border-t pt-8">
                <button
                  onClick={() => navigateToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Previous
                </button>

                {currentPage < totalPages ? (
                  <button
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={!canAccessPage(currentPage + 1)}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium shadow-sm transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed ${
                      currentPage === contentPages && allContentPagesCompleted
                        ? 'bg-linear-to-r from-emerald-600 to-blue-600 text-white shadow-emerald-200'
                        : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
                    }`}
                  >
                    {currentPage === contentPages && allContentPagesCompleted ? 'Take Final Quiz' : 'Next Page'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ) : (
                  <button disabled className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-6 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed">
                    Complete to continue
                  </button>
                )}
              </div>
            </div>
          ) : isQuizPage ? (
            /* ═══ QUIZ PAGE ═══ */
            <div className="mx-auto max-w-3xl animate-fade-in-up" key="quiz-page">
              <div className="content-surface p-8 mb-8">
                <div className="mb-8 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Final Quiz
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Test Your Knowledge</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    {lesson.quizQuestions.filter((q) => q.scope !== 'check').length} questions covering everything you learned in this lesson.
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

              {/* Navigation back */}
              <div className="mt-6 flex items-center justify-between border-t pt-8">
                <button
                  onClick={() => navigateToPage(currentPage - 1)}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back to lesson
                </button>
                {recommended && recommended.id !== lessonId && (
                  <Link href={`/student/lesson/${recommended.id}`} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
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

      </div>
    </div>
  );
}
