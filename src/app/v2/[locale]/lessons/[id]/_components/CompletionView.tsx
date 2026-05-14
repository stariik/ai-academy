'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Lesson } from '@/types';
import { Walli } from '@/components/walli/Walli';

export function CompletionView({
  lesson,
  recommended,
  onFetchRecommendation,
}: {
  lesson: Lesson;
  recommended: Lesson | null;
  onFetchRecommendation: () => void;
}) {
  React.useEffect(() => {
    onFetchRecommendation();
  }, [onFetchRecommendation]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-background/85 backdrop-blur-md" aria-hidden />
      <div className="bg-starfield absolute inset-0 opacity-30" aria-hidden />
      <motion.div
        initial={{ scale: 0.92, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.36, 0.64, 1] }}
        className="relative max-w-md w-full rounded-3xl border border-pulse/30 bg-card overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)]"
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-pulse/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-heart/15 blur-3xl" aria-hidden />

        <div className="relative px-6 sm:px-8 pt-8 pb-6 text-center space-y-4">
          <div className="flex justify-center">
            <Walli size={140} state="dance" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold">
              გასილებაა!
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight mt-1.5 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              გაკვეთილი დასრულდა
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-semibold text-foreground">{lesson.title}</span> —
              ერთი ნაბიჯით უფრო ახლოს.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            {recommended ? (
              <a
                href={`/v2/lessons/${recommended.id}`}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-pulse text-primary-foreground h-12 px-5 text-sm font-bold shadow-[0_8px_24px_var(--pulse-glow)] hover:shadow-[0_12px_30px_var(--pulse-glow)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>შემდეგი გაკვეთილი</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            ) : (
              lesson.courseId && (
                <a
                  href={`/v2/courses/${lesson.courseId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-pulse text-primary-foreground h-12 px-5 text-sm font-bold shadow-[0_8px_24px_var(--pulse-glow)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                >
                  კურსზე დაბრუნება
                  <ArrowRight className="w-4 h-4" />
                </a>
              )
            )}
            <a
              href="/v2"
              className="inline-flex items-center justify-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              მთავარზე
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
