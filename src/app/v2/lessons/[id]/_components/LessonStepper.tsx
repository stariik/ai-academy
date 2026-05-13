'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, ChevronDown, ChevronUp, Trophy, Sparkles } from 'lucide-react';
import type { LessonPage } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  pages: LessonPage[];
  currentPage: number;
  completedPages: number[];
  unlockedPages: Set<number>;
  hasQuiz: boolean;
  totalPages: number;
  allContentPagesCompleted: boolean;
  onNavigate: (pageNum: number) => void;
  layout: 'mobile' | 'desktop';
};

export function LessonStepper(props: Props) {
  if (props.layout === 'desktop') return <DesktopStepper {...props} />;
  return <MobileStepper {...props} />;
}

/* ──────────────────────────────────────────────────────────
   MOBILE — horizontal scrolling chip strip; tap chevron to
   expand into a full list of page titles.
   ────────────────────────────────────────────────────────── */

function MobileStepper({
  pages,
  currentPage,
  completedPages,
  unlockedPages,
  hasQuiz,
  totalPages,
  allContentPagesCompleted,
  onNavigate,
}: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const sorted = React.useMemo(
    () => [...pages].sort((a, b) => a.pageNumber - b.pageNumber),
    [pages],
  );
  const stripRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll current chip into view
  React.useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-page="${currentPage}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [currentPage]);

  const canAccess = (n: number) => {
    if (n === 1) return true;
    if (hasQuiz && n === totalPages) return allContentPagesCompleted;
    if (completedPages.includes(n)) return true;
    return completedPages.includes(n - 1);
  };

  return (
    <div className="lg:hidden bg-background border-b border-border" aria-label="გვერდის ნავიგაცია">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <div
          ref={stripRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {sorted.map((p) => (
            <PageChip
              key={p.id}
              pageNum={p.pageNumber}
              completed={completedPages.includes(p.pageNumber)}
              current={p.pageNumber === currentPage}
              locked={!canAccess(p.pageNumber)}
              unlocked={unlockedPages.has(p.pageNumber)}
              onClick={() => canAccess(p.pageNumber) && onNavigate(p.pageNumber)}
            />
          ))}
          {hasQuiz && (
            <>
              <span className="w-px h-5 bg-border shrink-0 mx-1" aria-hidden />
              <PageChip
                pageNum={totalPages}
                completed={completedPages.includes(totalPages)}
                current={currentPage === totalPages}
                locked={!canAccess(totalPages)}
                unlocked={false}
                isQuiz
                onClick={() => canAccess(totalPages) && onNavigate(totalPages)}
              />
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'დახურე სია' : 'გახსენი სია'}
          className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border max-h-[55dvh] overflow-y-auto py-1.5 px-2 space-y-0.5">
              {sorted.map((p) => {
                const locked = !canAccess(p.pageNumber);
                const completed = completedPages.includes(p.pageNumber);
                const current = p.pageNumber === currentPage;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={locked}
                    aria-current={current ? 'page' : undefined}
                    onClick={() => {
                      if (!locked) {
                        onNavigate(p.pageNumber);
                        setExpanded(false);
                      }
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                      current
                        ? 'bg-pulse/10 text-pulse'
                        : completed
                          ? 'text-foreground hover:bg-muted'
                          : locked
                            ? 'text-muted-foreground opacity-60 cursor-not-allowed'
                            : 'text-foreground hover:bg-muted',
                    )}
                    style={{ minHeight: 44 }}
                  >
                    <PageChip
                      pageNum={p.pageNumber}
                      completed={completed}
                      current={current}
                      locked={locked}
                      unlocked={unlockedPages.has(p.pageNumber)}
                      onClick={() => {}}
                      decorative
                    />
                    <span className="flex-1 text-sm leading-snug truncate font-semibold">
                      {p.title}
                    </span>
                  </button>
                );
              })}

              {hasQuiz && (
                <div className="pt-2 mt-2 border-t border-border">
                  <button
                    type="button"
                    disabled={!canAccess(totalPages)}
                    aria-current={currentPage === totalPages ? 'page' : undefined}
                    onClick={() => {
                      if (canAccess(totalPages)) {
                        onNavigate(totalPages);
                        setExpanded(false);
                      }
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                      currentPage === totalPages
                        ? 'bg-pulse/10 text-pulse'
                        : canAccess(totalPages)
                          ? 'text-foreground hover:bg-muted'
                          : 'text-muted-foreground opacity-60 cursor-not-allowed',
                    )}
                    style={{ minHeight: 44 }}
                  >
                    <PageChip
                      pageNum={totalPages}
                      completed={completedPages.includes(totalPages)}
                      current={currentPage === totalPages}
                      locked={!canAccess(totalPages)}
                      unlocked={false}
                      isQuiz
                      onClick={() => {}}
                      decorative
                    />
                    <span className="flex-1 text-sm font-bold">საბოლოო ქვიზი</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   DESKTOP — vertical rail with progress ring at top.
   ────────────────────────────────────────────────────────── */

function DesktopStepper({
  pages,
  currentPage,
  completedPages,
  unlockedPages,
  hasQuiz,
  totalPages,
  allContentPagesCompleted,
  onNavigate,
}: Props) {
  const sorted = React.useMemo(
    () => [...pages].sort((a, b) => a.pageNumber - b.pageNumber),
    [pages],
  );
  const canAccess = (n: number) => {
    if (n === 1) return true;
    if (hasQuiz && n === totalPages) return allContentPagesCompleted;
    if (completedPages.includes(n)) return true;
    return completedPages.includes(n - 1);
  };

  const pct = totalPages === 0 ? 0 : Math.round((completedPages.length / totalPages) * 100);

  return (
    <aside
      className="w-[220px] xl:w-[240px] shrink-0 flex flex-col overflow-y-auto bg-background border-l border-border"
      aria-label="გვერდის ნავიგაცია"
    >
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <ProgressRing pct={pct} />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-pulse font-bold">
              პროგრესი
            </p>
            <p
              className="text-sm font-bold mt-0.5 tabular-nums"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {completedPages.length}/{totalPages}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5" aria-label="გვერდები">
        {sorted.map((p) => {
          const locked = !canAccess(p.pageNumber);
          const completed = completedPages.includes(p.pageNumber);
          const current = p.pageNumber === currentPage;
          const unlocked = unlockedPages.has(p.pageNumber);

          return (
            <button
              key={p.id}
              type="button"
              disabled={locked}
              aria-current={current ? 'page' : undefined}
              onClick={() => !locked && onNavigate(p.pageNumber)}
              className={cn(
                'w-full flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-all relative group',
                current && 'bg-pulse/10 text-pulse',
                !current && completed && 'text-foreground hover:bg-muted',
                !current && !completed && !locked && 'text-foreground hover:bg-muted',
                !current && locked && 'text-muted-foreground opacity-60 cursor-not-allowed',
              )}
            >
              <PageChip
                pageNum={p.pageNumber}
                completed={completed}
                current={current}
                locked={locked}
                unlocked={unlocked}
                size="md"
                onClick={() => {}}
                decorative
              />
              <span className="flex-1 text-[13px] leading-snug font-semibold truncate">
                {p.title}
              </span>
              {current && (
                <motion.span
                  layoutId="active-pill-desktop"
                  className="absolute -left-2 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-pulse"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {hasQuiz && (
        <div className="p-3 border-t border-border">
          <button
            type="button"
            disabled={!canAccess(totalPages)}
            onClick={() => canAccess(totalPages) && onNavigate(totalPages)}
            aria-current={currentPage === totalPages ? 'page' : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all',
              currentPage === totalPages && 'bg-pulse text-primary-foreground shadow-[0_8px_24px_var(--pulse-glow)]',
              currentPage !== totalPages && allContentPagesCompleted &&
                'bg-pulse/10 text-pulse hover:bg-pulse/15 border border-pulse/30',
              !allContentPagesCompleted && 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed',
            )}
          >
            <span
              className={cn(
                'shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg',
                currentPage === totalPages
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : allContentPagesCompleted
                    ? 'bg-pulse/15 text-pulse'
                    : 'bg-background/60 text-muted-foreground',
              )}
            >
              {allContentPagesCompleted ? (
                <Trophy className="w-4 h-4" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="flex-1 text-[13px] font-bold leading-snug">
              საბოლოო ქვიზი
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}

/* ──────────────────────────────────────────────────────────
   Shared page chip — small circular indicator
   ────────────────────────────────────────────────────────── */

function PageChip({
  pageNum,
  completed,
  current,
  locked,
  unlocked,
  isQuiz,
  onClick,
  decorative,
  size = 'sm',
}: {
  pageNum: number;
  completed: boolean;
  current: boolean;
  locked: boolean;
  unlocked: boolean;
  isQuiz?: boolean;
  onClick: () => void;
  decorative?: boolean;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'md' ? 'w-8 h-8 text-[11px]' : 'w-7 h-7 text-[10px]';

  const inner = (
    <span
      data-page={pageNum}
      className={cn(
        'relative shrink-0 inline-flex items-center justify-center rounded-full font-bold tabular-nums transition-all',
        dim,
        current && 'bg-pulse text-primary-foreground shadow-[0_4px_14px_var(--pulse-glow)]',
        !current && completed && 'bg-pulse/15 text-pulse border border-pulse/40',
        !current && !completed && !locked && !isQuiz && 'bg-card border border-border text-foreground',
        !current && !completed && !locked && isQuiz &&
          'bg-pulse/10 text-pulse border border-pulse/30',
        !current && locked && 'bg-muted text-muted-foreground/80 border border-border',
      )}
      aria-label={
        isQuiz
          ? 'საბოლოო ქვიზი'
          : `გვერდი ${pageNum}${completed ? ', დასრულებული' : locked ? ', ჩაკეტილი' : ''}`
      }
    >
      {isQuiz && !current ? (
        locked ? <Lock className="w-3 h-3" /> : <Trophy className="w-3.5 h-3.5" />
      ) : completed ? (
        <Check className="w-3.5 h-3.5" strokeWidth={2.8} />
      ) : locked ? (
        <Lock className="w-3 h-3" />
      ) : (
        pageNum
      )}

      {/* Unlock pulse — when AI tutor has signaled readiness */}
      {!completed && unlocked && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full ring-2 ring-pulse animate-ping"
          style={{ animationDuration: '2.4s' }}
        />
      )}
      {/* Subtle sparkle on the current chip */}
      {current && (
        <span aria-hidden className="absolute -top-1 -right-1 text-pulse">
          <Sparkles className="w-2.5 h-2.5" />
        </span>
      )}
    </span>
  );

  if (decorative) return inner;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      className={cn(
        'shrink-0 p-0.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        locked ? 'cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      {inner}
    </button>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (circ * pct) / 100;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90 shrink-0">
      <circle cx="22" cy="22" r={radius} className="fill-none stroke-muted" strokeWidth="3.5" />
      <motion.circle
        cx="22"
        cy="22"
        r={radius}
        className="fill-none stroke-pulse"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={false}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
}
