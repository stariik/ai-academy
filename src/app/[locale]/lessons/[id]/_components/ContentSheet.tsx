'use client';

/**
 * Lesson content surface — two-step flow per lesson page.
 *
 *   Sub-page 1: Material  → lesson blocks, key concepts, misconceptions,
 *                           real-world examples, reflection prompt, and a
 *                           [შემოწმე გაგება →] CTA at the bottom that's
 *                           locked until the AI tutor signals readiness.
 *   Sub-page 2: Checks    → CheckQuestionsV2 with a "← მასალაზე" back link.
 *
 * Inline (desktop right rail) and drawer (mobile bottom sheet) share the
 * same body — only the wrapper differs.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Brain,
  Compass,
  Lightbulb,
  Lock,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import type { LessonPage } from '@/types';
import { ContentRenderer } from './ContentRenderer';
import { CheckQuestionsV2, type WrongAnswer } from './CheckQuestionsV2';
import { cn } from '@/lib/utils';
import { MATERIAL_STRINGS, type MaterialLocale, type MaterialStrings } from './materialStrings';

type Props = {
  lessonId: string;
  page: LessonPage;
  pageNumber: number;
  totalPages: number;
  completedPages: number[];
  isCheckUnlocked: boolean;
  canAccessNext: boolean;
  onCheckPassed: () => void;
  onWrongAnswers?: (wrongs: WrongAnswer[]) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose?: () => void;
  inline?: boolean;
  /** Teacher/material locale — drives both UI labels and which (translated)
   *  content is shown. Defaults to Georgian. */
  locale?: MaterialLocale;
  /** True while the English translation for this page is still loading. */
  materialLoading?: boolean;
};

type SubView = 'material' | 'checks';

export function ContentSheet(props: Props) {
  const locale: MaterialLocale = props.locale ?? 'ka';
  const S = MATERIAL_STRINGS[locale];
  const [subView, setSubView] = React.useState<SubView>('material');

  // Reset to material when the lesson page changes.
  React.useEffect(() => {
    setSubView('material');
  }, [props.pageNumber]);

  // If the page was already passed AND has check questions, default to the
  // checks view so the user can review their answers without an extra click.
  const passed = props.completedPages.includes(props.pageNumber);
  const hasChecks = props.page.checkQuestions.length > 0;
  React.useEffect(() => {
    if (passed && hasChecks) setSubView('checks');
  }, [passed, hasChecks]);

  const body = (
    <>
      <SheetHeader {...props} s={S} subView={subView} onJumpToMaterial={() => setSubView('material')} />
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          {subView === 'material' ? (
            <motion.div
              key="material"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="px-4 sm:px-5 py-4 sm:py-5 space-y-5"
            >
              <MaterialView
                {...props}
                s={S}
                materialLocale={locale}
                onAdvance={() => {
                  if (props.page.checkQuestions.length > 0) {
                    setSubView('checks');
                  } else if (props.isCheckUnlocked) {
                    // No check questions — direct mark-complete via the
                    // legacy "I understand" flow.
                    props.onCheckPassed();
                  }
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="checks"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="px-4 sm:px-5 py-4 sm:py-5 space-y-4"
            >
              <ChecksView {...props} s={S} onBack={() => setSubView('material')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  if (props.inline) {
    return <div className="h-full flex flex-col">{body}</div>;
  }

  return (
    <motion.div
      key="drawer"
      className="lg:hidden fixed inset-0 z-40 flex flex-col"
      initial={{ pointerEvents: 'none' }}
      animate={{ pointerEvents: 'auto' }}
      exit={{ pointerEvents: 'none' }}
      role="dialog"
      aria-modal="true"
      aria-label={S.dialogLabel}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={props.onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        className="relative mt-auto h-[88dvh] rounded-t-3xl bg-background border-t border-border shadow-[0_-12px_40px_rgba(0,0,0,0.20)] flex flex-col overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="h-1 w-10 rounded-full bg-border" aria-hidden />
        </div>
        {body}
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────
   Header — pagination dots reflect sub-view (1/2 vs 2/2).
   ────────────────────────────────────────────────────────── */

function SheetHeader({
  page,
  pageNumber,
  totalPages,
  onPrev,
  onNext,
  canAccessNext,
  onClose,
  inline,
  subView,
  onJumpToMaterial,
  s,
}: Props & { subView: SubView; onJumpToMaterial: () => void; s: MaterialStrings }) {
  return (
    <div className="shrink-0 px-4 sm:px-5 pt-3 pb-3 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pulse/10 border border-pulse/30 px-2.5 py-1 text-[10px] font-bold text-pulse uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            {pageNumber}/{totalPages}
          </span>
          {/* Sub-step indicator */}
          <SubViewBadge subView={subView} onJumpToMaterial={onJumpToMaterial} s={s} />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={pageNumber <= 1}
            aria-label={s.prevPage}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canAccessNext}
            aria-label={s.nextPage}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {!inline && (
            <button
              type="button"
              onClick={onClose}
              aria-label={s.close}
              className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <h2
        className="text-lg sm:text-xl font-bold tracking-tight leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {page.title}
      </h2>
      {page.difficultyLevel && (
        <span
          className={cn(
            'mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border',
            page.difficultyLevel === 'foundational' && 'bg-pulse/10 text-pulse border-pulse/30',
            page.difficultyLevel === 'intermediate' &&
              'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
            page.difficultyLevel === 'advanced' && 'bg-heart/10 text-heart border-heart/30',
            page.difficultyLevel === 'synthesis' &&
              'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
          )}
        >
          {page.difficultyLevel === 'foundational' && s.diffFoundational}
          {page.difficultyLevel === 'intermediate' && s.diffIntermediate}
          {page.difficultyLevel === 'advanced' && s.diffAdvanced}
          {page.difficultyLevel === 'synthesis' && s.diffSynthesis}
        </span>
      )}
    </div>
  );
}

function SubViewBadge({
  subView,
  onJumpToMaterial,
  s,
}: {
  subView: SubView;
  onJumpToMaterial: () => void;
  s: MaterialStrings;
}) {
  return (
    <div className="hidden sm:inline-flex items-center gap-1 rounded-full bg-muted/70 border border-border p-0.5">
      <button
        type="button"
        onClick={onJumpToMaterial}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors',
          subView === 'material'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {s.subMaterial}
      </button>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
          subView === 'checks' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
        )}
      >
        {s.subCheck}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Material sub-view
   ────────────────────────────────────────────────────────── */

function MaterialView({
  page,
  pageNumber,
  completedPages,
  isCheckUnlocked,
  onAdvance,
  s,
  materialLocale,
  materialLoading,
}: Props & { onAdvance: () => void; s: MaterialStrings; materialLocale: MaterialLocale }) {
  const hasChecks = page.checkQuestions.length > 0;
  const passed = completedPages.includes(pageNumber);

  // While the English translation is in flight, show a spinner instead of
  // flashing the Georgian source.
  if (materialLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-pulse"
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {page.bridgeFromPrevious && pageNumber > 1 && (
        <div className="rounded-2xl border border-pulse/25 bg-pulse/5 px-4 py-2.5 text-sm italic text-foreground/85">
          <span className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold not-italic mr-2">
            {s.bridge}
          </span>
          {page.bridgeFromPrevious}
        </div>
      )}

      <ContentRenderer blocks={page.contentBlocks} locale={materialLocale} />

      {page.keyConcepts.length > 0 && (
        <section>
          <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold mb-2.5">
            {s.keyConcepts}
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {page.keyConcepts.map((c, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-3.5 hover:border-pulse/40 transition-colors"
              >
                <p
                  className="text-sm font-bold text-pulse"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {c.term}
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed mt-1">{c.definition}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {page.commonMisconceptions && page.commonMisconceptions.length > 0 && (
        <ExtraList
          icon={<Brain className="w-4 h-4" />}
          tone="heart"
          label={s.commonMistakes}
          items={page.commonMisconceptions}
        />
      )}

      {page.realWorldApplications && page.realWorldApplications.length > 0 && (
        <ExtraList
          icon={<Compass className="w-4 h-4" />}
          tone="pulse"
          label={s.realWorld}
          items={page.realWorldApplications}
        />
      )}

      {page.teachingFlow?.reflectionPrompt && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Lightbulb className="w-4 h-4" />
            </span>
            <p className="text-[10px] uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300 font-bold">
              {s.reflect}
            </p>
          </div>
          <p className="text-sm italic text-foreground/85 leading-relaxed">
            {page.teachingFlow.reflectionPrompt}
          </p>
        </div>
      )}

      {/* ── Sticky CTA at bottom of material ── */}
      <AdvanceCta
        passed={passed}
        unlocked={isCheckUnlocked}
        hasChecks={hasChecks}
        onAdvance={onAdvance}
        s={s}
      />
    </>
  );
}

function AdvanceCta({
  passed,
  unlocked,
  hasChecks,
  onAdvance,
  s,
}: {
  passed: boolean;
  unlocked: boolean;
  hasChecks: boolean;
  onAdvance: () => void;
  s: MaterialStrings;
}) {
  if (passed) {
    if (!hasChecks) {
      return (
        <div className="rounded-2xl border border-pulse/30 bg-pulse/5 px-4 py-3 text-center">
          <p className="text-sm font-bold text-pulse" style={{ fontFamily: 'var(--font-display)' }}>
            {s.pageComplete}
          </p>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={onAdvance}
        className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-pulse/10 text-pulse border border-pulse/30 px-5 h-12 text-sm font-bold hover:bg-pulse/15 transition-colors"
      >
        {s.reviewAnswers}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    );
  }

  if (!unlocked) {
    return (
      <div
        className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-4 text-center space-y-2"
        aria-live="polite"
      >
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-muted text-muted-foreground mx-auto">
          <Lock className="w-4 h-4" />
        </div>
        <p className="text-sm font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          {hasChecks ? s.checkLocked : s.nextLocked}
        </p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {s.lockedHint}
        </p>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-pulse">
          <MessageCircle className="w-3 h-3" />
          {s.backToChat}
        </div>
      </div>
    );
  }

  // Unlocked, not yet passed — pulse the CTA to draw the eye.
  return (
    <motion.button
      type="button"
      onClick={onAdvance}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.32, ease: [0.34, 1.36, 0.64, 1] }}
      className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-pulse text-primary-foreground px-5 h-12 text-sm font-bold shadow-[0_8px_28px_var(--pulse-glow)] hover:shadow-[0_14px_36px_var(--pulse-glow)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
    >
      <Sparkles className="w-4 h-4" />
      {hasChecks ? s.checkUnderstanding : s.gotItNext}
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
    </motion.button>
  );
}

/* ──────────────────────────────────────────────────────────
   Checks sub-view — back link + CheckQuestionsV2
   ────────────────────────────────────────────────────────── */

function ChecksView({
  lessonId,
  page,
  pageNumber,
  completedPages,
  isCheckUnlocked,
  onCheckPassed,
  onWrongAnswers,
  onBack,
  s,
}: Props & { onBack: () => void; s: MaterialStrings }) {
  const passed = completedPages.includes(pageNumber);
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-pulse transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {s.backToMaterial}
      </button>

      <CheckQuestionsV2
        lessonId={lessonId}
        pageNumber={pageNumber}
        questions={page.checkQuestions}
        alreadyPassed={passed}
        locked={!isCheckUnlocked}
        onPass={onCheckPassed}
        onWrongAnswers={onWrongAnswers}
      />
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   Shared extras list
   ────────────────────────────────────────────────────────── */

function ExtraList({
  icon,
  tone,
  label,
  items,
}: {
  icon: React.ReactNode;
  tone: 'pulse' | 'heart';
  label: string;
  items: string[];
}) {
  const toneClasses =
    tone === 'pulse'
      ? 'border-pulse/30 bg-pulse/5'
      : 'border-heart/30 bg-heart/5';
  const iconClasses =
    tone === 'pulse' ? 'bg-pulse/15 text-pulse' : 'bg-heart/15 text-heart';
  const labelClasses = tone === 'pulse' ? 'text-pulse' : 'text-heart';

  return (
    <div className={cn('rounded-2xl border p-4', toneClasses)}>
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-lg',
            iconClasses,
          )}
        >
          {icon}
        </span>
        <p className={cn('text-[10px] uppercase tracking-[0.22em] font-bold', labelClasses)}>
          {label}
        </p>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-foreground/85 leading-relaxed flex gap-2">
            <span
              className={cn(
                'mt-1.5 shrink-0 w-1 h-1 rounded-full',
                tone === 'pulse' ? 'bg-pulse' : 'bg-heart',
              )}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
