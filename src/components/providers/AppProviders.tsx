'use client';

import * as React from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { useSmoothHashScroll } from '@/lib/smooth-scroll';

/**
 * Root client-side providers — kept thin so layout.tsx can stay a server component.
 *
 * - MotionConfig with reducedMotion="user" honors prefers-reduced-motion globally.
 *   Means individual motion components (Walle, future primitives) don't need their
 *   own wrapper.
 * - useSmoothHashScroll upgrades every in-page `#anchor` button across the app to
 *   a satisfying eased smooth scroll instead of an instant jump.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  useSmoothHashScroll();

  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </MotionConfig>
  );
}
