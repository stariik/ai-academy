'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  const toggle = React.useCallback(() => {
    const next = isDark ? 'light' : 'dark';

    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      document.documentElement.style.setProperty('--toggle-x', `${x}px`);
      document.documentElement.style.setProperty('--toggle-y', `${y}px`);
    }

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => setTheme(next));
    } else {
      setTheme(next);
    }
  }, [isDark, setTheme]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'group relative inline-flex h-11 w-11 items-center justify-center rounded-full',
        'bg-card/70 backdrop-blur-md border border-border',
        'text-foreground/80 hover:text-pulse',
        'transition-all duration-200',
        'hover:border-pulse/40 hover:shadow-[0_0_24px_var(--pulse-glow)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:scale-95',
        className,
      )}
    >
      <span className="sr-only">{isDark ? 'Light mode' : 'Dark mode'}</span>

      <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="absolute inset-0 rounded-full bg-pulse/10 blur-md" />
      </span>

      <AnimatePresence mode="wait" initial={false}>
        {mounted ? (
          isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative"
            >
              <Moon className="h-5 w-5" strokeWidth={2.2} />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative"
            >
              <Sun className="h-5 w-5" strokeWidth={2.2} />
            </motion.span>
          )
        ) : (
          <span className="h-5 w-5" />
        )}
      </AnimatePresence>
    </button>
  );
}
