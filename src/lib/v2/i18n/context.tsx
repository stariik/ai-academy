'use client';

import * as React from 'react';
import type { Dict } from './index';
import type { Locale } from './types';

type V2LocaleValue = {
  locale: Locale;
  dict: Dict;
  /** Returns a path prefixed with the current locale, e.g. href('courses/abc') → '/en/courses/abc'. */
  href: (path?: string) => string;
};

const V2LocaleContext = React.createContext<V2LocaleValue | null>(null);

export function V2LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dict;
  children: React.ReactNode;
}) {
  const value = React.useMemo<V2LocaleValue>(() => {
    const href = (path = '') => {
      const trimmed = path.replace(/^\/+/, '');
      return trimmed ? `/${locale}/${trimmed}` : `/${locale}`;
    };
    return { locale, dict, href };
  }, [locale, dict]);
  return <V2LocaleContext.Provider value={value}>{children}</V2LocaleContext.Provider>;
}

export function useV2Locale(): V2LocaleValue {
  const ctx = React.useContext(V2LocaleContext);
  if (!ctx) {
    throw new Error('useV2Locale must be used inside <V2LocaleProvider>');
  }
  return ctx;
}
