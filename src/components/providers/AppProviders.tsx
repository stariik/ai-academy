'use client';

import * as React from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

/**
 * Root client-side providers — kept thin so layout.tsx can stay a server component.
 *
 * - MotionConfig with reducedMotion="user" honors prefers-reduced-motion globally.
 *   Means individual motion components (Walli, future primitives) don't need their
 *   own wrapper.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
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
