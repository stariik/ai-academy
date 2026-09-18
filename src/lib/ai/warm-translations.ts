// ============================================================
// Publish-time translation warming.
//
// Translating a page takes one Claude call over the whole page, so the first
// student to open a lesson in EN otherwise eats several seconds of latency.
// Warming at publish moves that cost off the student's critical path.
//
// Pages already cached under the current source hash are skipped, so
// re-publishing an unchanged lesson costs nothing.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { translatePageCached } from '@/lib/ai/page-translation';
import type { Lesson } from '@/types';

/** How many pages to translate at once. Enough to cut wall-clock time
 *  without tripping Anthropic rate limits on a long lesson. */
const CONCURRENCY = 3;

/**
 * Keeps background work alive past the response on platforms that reap the
 * function as soon as it returns (Vercel, Cloudflare). Falls back to a plain
 * detached promise where no such hook exists, which is correct on a
 * long-lived Node server.
 */
export function keepAlive(promise: Promise<unknown>): void {
  type RequestContext = {
    get?: () => { waitUntil?: (p: Promise<unknown>) => void } | undefined;
  };

  const ctx = (globalThis as unknown as Record<symbol, RequestContext | undefined>)[
    Symbol.for('@vercel/request-context')
  ];

  const waitUntil = ctx?.get?.()?.waitUntil;
  if (typeof waitUntil === 'function') {
    waitUntil(promise);
    return;
  }
  void promise;
}

export type WarmSummary = {
  total: number;
  translated: number;
  cached: number;
  failed: number;
};

/**
 * Translates every content page of a lesson into `locale`, populating the
 * translation cache.
 *
 * Never throws: a page that fails is counted and logged, and the rest still
 * warm. Callers treat this as best-effort background work.
 */
export async function warmLessonTranslations(
  supabase: SupabaseClient,
  lesson: Lesson,
  locale = 'en'
): Promise<WarmSummary> {
  const pages = lesson.pages ?? [];
  const summary: WarmSummary = { total: pages.length, translated: 0, cached: 0, failed: 0 };
  if (pages.length === 0) return summary;

  // Shared cursor — each worker pulls the next page as it frees up, so one
  // slow page doesn't stall a whole batch.
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= pages.length) return;
      const page = pages[index];
      try {
        const { fromCache } = await translatePageCached(supabase, lesson.id, page, locale);
        if (fromCache) summary.cached++;
        else summary.translated++;
      } catch (err) {
        summary.failed++;
        console.error(
          `Translation warm failed for lesson ${lesson.id} page ${page.pageNumber}:`,
          err
        );
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, pages.length) }, () => worker())
  );

  console.log(
    `Translation warm for lesson ${lesson.id} (${locale}): ` +
      `${summary.translated} translated, ${summary.cached} cached, ${summary.failed} failed`
  );
  return summary;
}
