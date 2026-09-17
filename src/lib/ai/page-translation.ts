// ============================================================
// Shared page-translation core.
//
// Both the on-demand route (GET /api/lessons/[id]/translate) and the
// publish-time warmer go through here, so the source hash, the human-EN
// preference and the cache write can't drift apart between the two.
// Auth and HTTP shaping stay with the callers.
// ============================================================

import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPageTranslation, upsertPageTranslation } from '@/lib/supabase/db';
import {
  translatePageMaterialToEnglish,
  type PageTranslationInput,
} from '@/lib/ai/claude';
import type { LessonPage, TranslatedPageOverlay } from '@/types';

/** Bump when the translation logic/shape changes so old cache rows are ignored. */
export const TRANSLATION_VERSION = 'v1';

/** Builds the Claude input for a page — the Georgian source material. */
export function buildTranslationInput(page: LessonPage): PageTranslationInput {
  return {
    title: page.title,
    bridgeFromPrevious: page.bridgeFromPrevious,
    blocks: page.contentBlocks.map((b) => ({ id: b.id, type: b.type, content: b.content })),
    keyConcepts: page.keyConcepts,
    commonMisconceptions: page.commonMisconceptions,
    realWorldApplications: page.realWorldApplications,
    reflectionPrompt: page.teachingFlow?.reflectionPrompt,
  };
}

/** Hashes the Georgian source *and* any human EN values, so edits to either
 *  side bust the cache. */
export function pageSourceHash(page: LessonPage, input: PageTranslationInput): string {
  const manual = {
    titleEn: page.titleEn ?? null,
    blocksEn: page.contentBlocks.map((b) => [b.id, b.contentEn ?? null]),
  };
  return createHash('sha256')
    .update(TRANSLATION_VERSION + JSON.stringify({ input, manual }))
    .digest('hex');
}

export type TranslateResult = {
  overlay: TranslatedPageOverlay;
  /** True when the cache already held a translation for this exact source. */
  fromCache: boolean;
};

/**
 * Returns the EN overlay for a page, translating and caching on a miss.
 *
 * Throws if the Claude call fails; the cache write is best-effort and only
 * logged, since a translated page in hand beats failing the caller.
 */
export async function translatePageCached(
  supabase: SupabaseClient,
  lessonId: string,
  page: LessonPage,
  locale = 'en'
): Promise<TranslateResult> {
  const input = buildTranslationInput(page);
  const sourceHash = pageSourceHash(page, input);

  const cached = await getPageTranslation(supabase, lessonId, page.pageNumber, locale);
  if (cached && cached.sourceHash === sourceHash) {
    return { overlay: cached.payload, fromCache: true };
  }

  const translated = await translatePageMaterialToEnglish(input, {
    feature: 'material_translation',
    lessonId,
    locale,
  });
  const aiById = new Map(translated.blocks.map((b) => [b.id, b.content]));

  // Prefer human EN columns where they exist, falling back to the AI output
  // and finally to the Georgian source.
  const overlay: TranslatedPageOverlay = {
    title: page.titleEn ?? translated.title,
    bridgeFromPrevious: translated.bridgeFromPrevious,
    blocks: page.contentBlocks.map((b) => ({
      id: b.id,
      content: b.contentEn ?? aiById.get(b.id) ?? b.content,
    })),
    keyConcepts: translated.keyConcepts,
    commonMisconceptions: translated.commonMisconceptions,
    realWorldApplications: translated.realWorldApplications,
    reflectionPrompt: translated.reflectionPrompt,
  };

  try {
    await upsertPageTranslation(supabase, lessonId, page.pageNumber, locale, sourceHash, overlay);
  } catch (err) {
    console.error('Failed to persist page translation cache:', err);
  }

  return { overlay, fromCache: false };
}
