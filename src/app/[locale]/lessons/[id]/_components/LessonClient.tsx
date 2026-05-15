'use client';

/**
 * walle.academy — v2 lesson page (client root)
 *
 * Layout strategy
 *   📱 mobile (<lg)  Chat is the primary view; lesson content opens as a
 *                    slide-up sheet via the "კონტენტი" trigger. Page strip
 *                    sits between the header and the chat.
 *   💻 desktop (lg+) Three columns: stepper rail (220px) | chat (1fr) |
 *                    content panel (480px, collapsible).
 *
 * State flow mirrors the legacy PagedLessonView so the API surface stays
 * identical: completedPages drives gating, unlockedPages tracks pages the
 * AI tutor has unlocked but the user hasn't passed yet.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { Lesson } from '@/types';
import { useSession } from '@/hooks/useSession';
import { LoadingState, ErrorState } from './LoadingState';
import { LessonHeader } from './LessonHeader';
import { LessonStepper } from './LessonStepper';
import { ChatPanelV2 } from './ChatPanelV2';
import { ContentSheet } from './ContentSheet';
import { FinalQuizV2 } from './FinalQuizV2';
import { CompletionView } from './CompletionView';
import type { WrongAnswer } from './CheckQuestionsV2';
import { cn } from '@/lib/utils';
import { V2LocaleProvider } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';

const CONTENT_PREF_KEY = 'walle:v2-lesson-content-visible';

export default function LessonClient({
  lessonId,
  dict,
  locale,
}: {
  lessonId: string;
  dict: Dict;
  locale: Locale;
}) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <LessonClientInner lessonId={lessonId} />
    </V2LocaleProvider>
  );
}

function LessonClientInner({ lessonId }: { lessonId: string }) {
  const { sessionId } = useSession();
  const [lesson, setLesson] = React.useState<Lesson | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [completedPages, setCompletedPages] = React.useState<number[]>([]);
  const [unlockedPages, setUnlockedPages] = React.useState<Set<number>>(new Set());
  const [progressLoaded, setProgressLoaded] = React.useState(false);

  // Right-rail panel preference (desktop persists; mobile uses sheet state)
  const [contentVisibleDesktop, setContentVisibleDesktop] = React.useState(true);
  const [contentSheetOpen, setContentSheetOpen] = React.useState(false);

  // Walli reactions surface — child components can request a temporary state
  const [walliPulse, setWalliPulse] = React.useState<0 | 1>(0);

  // When the user submits wrong check-question answers we hand a prompt to
  // the chat panel so Walli explains without revealing the answer. The id
  // bumps on each new submission so the chat can dedupe.
  const [chatPrompt, setChatPrompt] = React.useState<{ id: number; text: string } | null>(null);

  const [recommended, setRecommended] = React.useState<Lesson | null>(null);

  /* ─── load lesson ─── */
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        if (!res.ok) throw new Error('გაკვეთილი ვერ მოიძებნა');
        const data = (await res.json()) as Lesson;
        if (!cancelled) setLesson(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'შეცდომა');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  /* ─── load progress ─── */
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch('/api/progress');
        const data = await res.json();
        if (Array.isArray(data) && !cancelled) {
          const lp = data.find((p: { lessonId: string }) => p.lessonId === lessonId);
          if (lp) {
            setCurrentPage(lp.currentPage || 1);
            setCompletedPages(lp.completedPages || []);
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setProgressLoaded(true);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  /* ─── mark in_progress ─── */
  React.useEffect(() => {
    if (!sessionId || !lesson) return;
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, status: 'in_progress' }),
    }).catch(() => {});
  }, [sessionId, lesson, lessonId]);

  /* ─── time tracking ─── */
  React.useEffect(() => {
    if (!sessionId || !lesson) return;
    let seconds = 0;
    const id = setInterval(() => {
      seconds += 30;
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, timeSpentSeconds: seconds }),
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [sessionId, lesson, lessonId]);

  /* ─── content panel preference ─── */
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(CONTENT_PREF_KEY);
      if (stored !== null) setContentVisibleDesktop(stored === '1');
    } catch {
      /* ignore */
    }
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem(CONTENT_PREF_KEY, contentVisibleDesktop ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [contentVisibleDesktop]);

  /* ─── derived ─── */
  const pages = React.useMemo(() => lesson?.pages ?? [], [lesson]);
  const contentPages = pages.length;
  const finalQuizQuestions = React.useMemo(
    () => lesson?.quizQuestions.filter((q) => q.scope !== 'check') ?? [],
    [lesson],
  );
  const hasQuiz = finalQuizQuestions.length > 0;
  const totalPages = contentPages + (hasQuiz ? 1 : 0);
  const isQuizPage = hasQuiz && currentPage === totalPages;
  const currentPageData = React.useMemo(
    () => (isQuizPage ? null : pages.find((p) => p.pageNumber === currentPage) ?? null),
    [isQuizPage, pages, currentPage],
  );
  const allContentPagesCompleted = pages.every((p) => completedPages.includes(p.pageNumber));

  const isCheckUnlocked =
    completedPages.includes(currentPage) || unlockedPages.has(currentPage);

  const canAccessPage = React.useCallback(
    (pageNum: number) => {
      if (pageNum === 1) return true;
      if (hasQuiz && pageNum === totalPages) return allContentPagesCompleted;
      if (completedPages.includes(pageNum)) return true;
      return completedPages.includes(pageNum - 1);
    },
    [hasQuiz, totalPages, completedPages, allContentPagesCompleted],
  );

  const navigateToPage = React.useCallback(
    (pageNum: number) => {
      if (!canAccessPage(pageNum)) return;
      setCurrentPage(pageNum);
      setContentSheetOpen(false);
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, currentPage: pageNum }),
      }).catch(() => {});
    },
    [canAccessPage, lessonId],
  );

  const handleCheckUnlocked = React.useCallback((pageNum: number) => {
    setUnlockedPages((prev) => {
      if (prev.has(pageNum)) return prev;
      const next = new Set(prev);
      next.add(pageNum);
      return next;
    });
    setWalliPulse((p) => (p === 0 ? 1 : 0));
  }, []);

  const handleCheckPassed = React.useCallback(
    (pageNum: number) => {
      setCompletedPages((prev) => (prev.includes(pageNum) ? prev : [...prev, pageNum]));
      const next = pageNum + 1;
      if (next <= totalPages) {
        setTimeout(() => {
          setCurrentPage(next);
        }, 1500);
      }
    },
    [totalPages],
  );

  const handleWrongAnswers = React.useCallback((wrongs: WrongAnswer[]) => {
    if (wrongs.length === 0) return;
    // Build a Georgian prompt that explicitly forbids leaking the answer.
    const lines = wrongs.map((w, i) => {
      const userAns = w.userAnswer.trim() || '(არ მიპასუხია)';
      return `${i + 1}) კითხვა: "${w.question.question}"\n   ჩემი პასუხი: "${userAns}"`;
    });
    const text =
      wrongs.length === 1
        ? `შემოწმების კითხვაში არასწორად ვუპასუხე:\n\n${lines[0]}\n\nამიხსენი, რატომ არ არის სწორი — მაგრამ ნუ მეტყვი სწორ პასუხს. დამეხმარე ვიფიქრო და თვითონ ვიპოვო.`
        : `შემოწმების კითხვებში არასწორად ვუპასუხე:\n\n${lines.join(
            '\n\n',
          )}\n\nამიხსენი, რატომ ვცდები — მაგრამ ნუ მეტყვი სწორ პასუხებს. დამეხმარე ვიფიქრო და თვითონ ვიპოვო ისინი.`;
    setChatPrompt({ id: Date.now(), text });
  }, []);

  const fetchRecommendation = React.useCallback(async () => {
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) setRecommended(data[0]);
    } catch {
      /* ignore */
    }
  }, []);

  /* ─── render gates ─── */
  if (loading || !progressLoaded) return <LoadingState />;
  if (error || !lesson) return <ErrorState message={error ?? 'გაკვეთილი ვერ მოიძებნა'} />;

  // Legacy lessons (no pages) — render a graceful redirect-style screen.
  if (pages.length === 0) {
    return (
      <ErrorState
        message="ეს გაკვეთილი ჯერ არ არის გადატანილი v2-ში. გადადით ძველ ვერსიაზე და გააგრძელეთ იქ."
      />
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground overflow-hidden">
      <LessonHeader
        title={lesson.title}
        courseId={lesson.courseId}
        currentPage={currentPage}
        totalPages={totalPages}
        completed={completedPages.length}
        contentVisible={contentVisibleDesktop}
        onToggleContent={() => setContentVisibleDesktop((v) => !v)}
        onOpenSheet={() => setContentSheetOpen(true)}
      />

      <LessonStepper
        pages={pages}
        currentPage={currentPage}
        completedPages={completedPages}
        unlockedPages={unlockedPages}
        hasQuiz={hasQuiz}
        totalPages={totalPages}
        allContentPagesCompleted={allContentPagesCompleted}
        onNavigate={navigateToPage}
        layout="mobile"
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop stepper rail */}
        <div className="hidden lg:flex">
          <LessonStepper
            pages={pages}
            currentPage={currentPage}
            completedPages={completedPages}
            unlockedPages={unlockedPages}
            hasQuiz={hasQuiz}
            totalPages={totalPages}
            allContentPagesCompleted={allContentPagesCompleted}
            onNavigate={navigateToPage}
            layout="desktop"
          />
        </div>

        {/* Chat column */}
        <div className="relative flex-1 min-w-0 flex flex-col bg-card border-l border-border">
          {isQuizPage ? (
            <FinalQuizV2
              lessonId={lessonId}
              lessonTitle={lesson.title}
              questions={finalQuizQuestions}
              onBack={() => navigateToPage(contentPages)}
              onComplete={fetchRecommendation}
            />
          ) : (
            <ChatPanelV2
              key={`page-${currentPage}`}
              lessonId={lessonId}
              lesson={lesson}
              pageNumber={currentPage}
              onUnlockCheck={() => handleCheckUnlocked(currentPage)}
              walliPulseKey={walliPulse}
              pendingPrompt={chatPrompt}
            />
          )}

          {/* Mobile "open content" floating trigger */}
          {!isQuizPage && currentPageData && (
            <motion.button
              key={`fab-${currentPage}-${isCheckUnlocked ? 'unlocked' : 'locked'}`}
              type="button"
              onClick={() => setContentSheetOpen(true)}
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.36, 0.64, 1] }}
              className={cn(
                'lg:hidden fixed right-4 z-30 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold backdrop-blur-md transition-all',
                'shadow-[0_8px_24px_rgba(0,0,0,0.10)]',
                isCheckUnlocked
                  ? 'bg-pulse text-primary-foreground shadow-[0_8px_28px_var(--pulse-glow)]'
                  : 'bg-card/95 text-foreground border border-border',
              )}
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 84px)' }}
            >
              <BookOpen className="w-4 h-4" />
              <span>კონტენტი</span>
              {isCheckUnlocked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  მზად
                </span>
              )}
            </motion.button>
          )}
        </div>

        {/* Desktop content rail */}
        <AnimatePresence initial={false}>
          {contentVisibleDesktop && !isQuizPage && currentPageData && (
            <motion.aside
              key="content-rail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 480, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              className="hidden lg:flex flex-col border-l border-border bg-background overflow-hidden"
              aria-label="Lesson content"
            >
              <ContentSheet
                lessonId={lessonId}
                page={currentPageData}
                pageNumber={currentPage}
                totalPages={totalPages}
                completedPages={completedPages}
                isCheckUnlocked={isCheckUnlocked}
                canAccessNext={canAccessPage(currentPage + 1)}
                onCheckPassed={() => handleCheckPassed(currentPage)}
                onWrongAnswers={handleWrongAnswers}
                onNext={() => navigateToPage(currentPage + 1)}
                onPrev={() => navigateToPage(currentPage - 1)}
                inline
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile content sheet */}
      <AnimatePresence>
        {contentSheetOpen && !isQuizPage && currentPageData && (
          <ContentSheet
            key="mobile-sheet"
            lessonId={lessonId}
            page={currentPageData}
            pageNumber={currentPage}
            totalPages={totalPages}
            completedPages={completedPages}
            isCheckUnlocked={isCheckUnlocked}
            canAccessNext={canAccessPage(currentPage + 1)}
            onCheckPassed={() => handleCheckPassed(currentPage)}
            onWrongAnswers={handleWrongAnswers}
            onNext={() => {
              navigateToPage(currentPage + 1);
              setContentSheetOpen(false);
            }}
            onPrev={() => navigateToPage(currentPage - 1)}
            onClose={() => setContentSheetOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Completion celebration overlay */}
      <AnimatePresence>
        {allContentPagesCompleted && !hasQuiz && (
          <CompletionView
            key="completion"
            lesson={lesson}
            recommended={recommended}
            onFetchRecommendation={fetchRecommendation}
          />
        )}
      </AnimatePresence>

      {/* Mobile sticky "next" bar — shown when current page is passed and not on quiz */}
      {!isQuizPage && completedPages.includes(currentPage) && currentPage < totalPages && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.34, 1.36, 0.64, 1] }}
          className="lg:hidden fixed bottom-0 inset-x-0 z-20 backdrop-blur-md bg-background/85 border-t border-border"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">
                გვერდი დასრულდა
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                გადადი შემდეგზე — Walli გელის
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateToPage(currentPage + 1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-5 py-2.5 text-sm font-bold whitespace-nowrap shadow-[0_8px_24px_var(--pulse-glow)] active:scale-[0.97] transition-transform"
            >
              {currentPage === contentPages && hasQuiz ? 'ქვიზი' : 'შემდეგი'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
