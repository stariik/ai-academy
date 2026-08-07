'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, PanelRightClose, PanelRightOpen, BookOpen } from 'lucide-react';
import { Walle } from '@/components/walle/Walle';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import { useV2Locale } from '@/lib/v2/i18n/context';

export function LessonHeader({
  title,
  courseId,
  currentPage,
  totalPages,
  completed,
  contentVisible,
  onToggleContent,
  onOpenSheet,
}: {
  title: string;
  courseId?: string;
  currentPage: number;
  totalPages: number;
  completed: number;
  contentVisible: boolean;
  onToggleContent: () => void;
  onOpenSheet: () => void;
}) {
  const { href } = useV2Locale();
  const pct = totalPages === 0 ? 0 : Math.round((completed / totalPages) * 100);
  const backHref = courseId ? href(`courses/${courseId}`) : href();

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md bg-background/85 border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
    >
      <div className="px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 min-w-0">
        <a
          href={backHref}
          aria-label="უკან კურსზე"
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </a>

        <div className="shrink-0">
          <Walle size={32} state="idle" noShadow />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-pulse font-bold leading-none">
            გაკვეთილი
          </p>
          <h1
            className="text-sm sm:text-base font-bold tracking-tight leading-tight truncate mt-0.5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
        </div>

        <div className="shrink-0 hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
          <span className="font-bold text-foreground">{currentPage}</span>
          <span className="opacity-40">/</span>
          <span>{totalPages}</span>
        </div>

        {/* Mobile: open content sheet */}
        <button
          type="button"
          onClick={onOpenSheet}
          aria-label="გახსენი კონტენტი"
          className="lg:hidden shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Desktop: toggle content rail */}
        <button
          type="button"
          onClick={onToggleContent}
          aria-pressed={contentVisible}
          aria-label={contentVisible ? 'დახურე კონტენტი' : 'გახსენი კონტენტი'}
          className={cn(
            'hidden lg:inline-flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
            contentVisible
              ? 'bg-pulse/10 text-pulse border border-pulse/30'
              : 'bg-muted text-muted-foreground hover:text-foreground border border-transparent',
          )}
        >
          {contentVisible ? (
            <PanelRightClose className="w-3.5 h-3.5" />
          ) : (
            <PanelRightOpen className="w-3.5 h-3.5" />
          )}
          <span>კონტენტი</span>
        </button>

        <div className="hidden sm:block shrink-0">
          <ThemeToggle />
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={totalPages}
        aria-label="გაკვეთილის პროგრესი"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-pulse via-pulse-soft to-pulse"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </header>
  );
}
