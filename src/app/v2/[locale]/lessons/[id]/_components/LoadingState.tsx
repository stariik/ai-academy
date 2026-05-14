'use client';

import { motion } from 'framer-motion';
import { Walli } from '@/components/walli/Walli';

export function LoadingState({ label = 'გაკვეთილი იტვირთება…' }: { label?: string }) {
  return (
    <div className="relative flex h-[100dvh] items-center justify-center bg-background overflow-hidden">
      <div className="bg-starfield absolute inset-0 -z-10 opacity-40" aria-hidden />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-pulse/15 blur-3xl -z-10" aria-hidden />

      <div className="text-center space-y-6 px-6">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.36, 0.64, 1] }}
          className="flex justify-center"
        >
          <Walli size={120} state="idle" />
        </motion.div>
        <div className="space-y-2">
          <p
            className="text-base sm:text-lg font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {label}
          </p>
          <div className="flex items-center justify-center gap-1.5">
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
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="relative flex h-[100dvh] items-center justify-center bg-background px-6">
      <div className="bg-starfield absolute inset-0 -z-10 opacity-30" aria-hidden />
      <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 text-center space-y-5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.10)]">
        <div className="flex justify-center">
          <Walli size={100} state="tilt" />
        </div>
        <div className="space-y-2">
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            რაღაც ვერ მოხერხდა
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <a
          href="/v2"
          className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-[0_8px_24px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
        >
          მთავარზე დაბრუნება
        </a>
      </div>
    </div>
  );
}
