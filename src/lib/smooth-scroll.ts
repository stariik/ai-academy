'use client';

import * as React from 'react';

// Sticky header height (~64px) plus a little breathing room, so the scrolled-to
// section doesn't tuck under the navbar. Matches the `scroll-mt-20` used on
// in-page anchor targets.
const DEFAULT_OFFSET = 88;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Smoothly scroll the window so `el` sits just below the sticky header, using
 * an eased rAF animation (nicer and more consistent than native smooth). The
 * animation bails out the moment the user scrolls themselves, so it never
 * fights manual input. Respects prefers-reduced-motion.
 */
export function smoothScrollToElement(
  el: Element,
  opts: { offset?: number; duration?: number } = {},
): void {
  const offset = opts.offset ?? DEFAULT_OFFSET;
  const startY = window.scrollY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const targetY = Math.max(0, Math.min(el.getBoundingClientRect().top + startY - offset, maxY));
  const distance = targetY - startY;

  if (prefersReducedMotion() || Math.abs(distance) < 4) {
    window.scrollTo(0, targetY);
    return;
  }

  // Scale duration with distance so short hops feel snappy and long ones stay
  // graceful — clamped to a pleasant range.
  const duration = opts.duration ?? Math.min(Math.max(Math.abs(distance) * 0.45, 380), 820);

  let startTime: number | null = null;
  let cancelled = false;

  const onUserScroll = () => {
    cancelled = true;
  };
  // Only a genuine user gesture should cancel — not our own scrollTo calls.
  window.addEventListener('wheel', onUserScroll, { passive: true });
  window.addEventListener('touchstart', onUserScroll, { passive: true });
  window.addEventListener('keydown', onUserScroll);

  const cleanup = () => {
    window.removeEventListener('wheel', onUserScroll);
    window.removeEventListener('touchstart', onUserScroll);
    window.removeEventListener('keydown', onUserScroll);
  };

  const step = (now: number) => {
    if (cancelled) {
      cleanup();
      return;
    }
    if (startTime === null) startTime = now;
    const t = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, Math.round(startY + distance * easeInOutCubic(t)));
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      cleanup();
    }
  };
  requestAnimationFrame(step);
}

/** Scroll to an element by id. Returns false if no such element exists. */
export function smoothScrollToId(
  id: string,
  opts?: { offset?: number; duration?: number },
): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  smoothScrollToElement(el, opts);
  return true;
}

/**
 * Upgrades every in-page anchor (`<a href="#some-id">`) on the page to a
 * satisfying eased smooth scroll, via a single delegated click listener.
 * Plain `#` links, modified clicks (cmd/ctrl/new-tab), and anchors whose
 * target doesn't exist are left to the browser's default behavior.
 */
export function useSmoothHashScroll(): void {
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const hash = anchor.getAttribute('href') ?? '';
      if (hash.length <= 1) return; // bare "#" → ignore

      const id = decodeURIComponent(hash.slice(1));
      const el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();
      smoothScrollToElement(el);
      // Keep the URL shareable without triggering a second native jump.
      history.replaceState(null, '', hash);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}
