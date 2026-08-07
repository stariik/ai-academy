// ============================================================
// GET /api/lessons/[id]/translate?pageNumber=N&locale=en
// Returns an English translation overlay for a lesson page's material.
// Prefers human EN columns (title_en / content_en) where present and
// AI-translates the rest. Results are cached in lesson_page_translations
// and invalidated via a source hash when the Georgian content changes.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getLesson, getPageTranslation, upsertPageTranslation } from '@/lib/supabase/db';
import { isCurrentUserEnrolled } from '@/lib/enrollments';
import { isAdmin } from '@/lib/admin-auth';
import { FREE_LESSON_ID } from '@/lib/v2/db';
import {
  translatePageMaterialToEnglish,
  type PageTranslationInput,
} from '@/lib/ai/claude';
import type { TranslatedPageOverlay } from '@/types';

export const runtime = 'nodejs';

// Bump when the translation logic/shape changes so old cache rows are ignored.
const TRANSLATION_VERSION = 'v1';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const pageNumber = Number(searchParams.get('pageNumber'));
  const locale = searchParams.get('locale') ?? 'en';

  if (!Number.isFinite(pageNumber)) {
    return NextResponse.json({ error: 'Invalid pageNumber' }, { status: 400 });
  }
  if (locale !== 'en') {
    // Only EN translation is supported; Georgian is the source language.
    return NextResponse.json({ error: 'Unsupported locale' }, { status: 400 });
  }

  const supabase = await createClient();
  const lesson = await getLesson(supabase, id);
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  // Same paywall as GET /api/lessons/[id] — this returns the page material in
  // English, so leaving it open would hand out the paid content verbatim. It
  // also spends AI credits, which is reason enough not to serve strangers.
  if (id !== FREE_LESSON_ID) {
    const allowed =
      (lesson.courseId ? await isCurrentUserEnrolled(lesson.courseId) : false) ||
      (await isAdmin());
    if (!allowed) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  const page = lesson.pages?.find((p) => p.pageNumber === pageNumber);
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const input: PageTranslationInput = {
    title: page.title,
    bridgeFromPrevious: page.bridgeFromPrevious,
    blocks: page.contentBlocks.map((b) => ({ id: b.id, type: b.type, content: b.content })),
    keyConcepts: page.keyConcepts,
    commonMisconceptions: page.commonMisconceptions,
    realWorldApplications: page.realWorldApplications,
    reflectionPrompt: page.teachingFlow?.reflectionPrompt,
  };

  // Hash the Georgian source *and* any human EN values, so edits to either
  // side bust the cache.
  const manual = {
    titleEn: page.titleEn ?? null,
    blocksEn: page.contentBlocks.map((b) => [b.id, b.contentEn ?? null]),
  };
  const sourceHash = createHash('sha256')
    .update(TRANSLATION_VERSION + JSON.stringify({ input, manual }))
    .digest('hex');

  // Cache hit?
  const cached = await getPageTranslation(supabase, id, pageNumber, locale);
  if (cached && cached.sourceHash === sourceHash) {
    return NextResponse.json(cached.payload);
  }

  // Translate, preferring human EN columns where they exist.
  let overlay: TranslatedPageOverlay;
  try {
    const translated = await translatePageMaterialToEnglish(input, {
      feature: 'material_translation',
      lessonId: id,
      locale,
    });
    const aiById = new Map(translated.blocks.map((b) => [b.id, b.content]));
    overlay = {
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
  } catch (err) {
    console.error('Page translation failed:', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 502 });
  }

  // Best-effort cache write — don't fail the request if it can't persist.
  try {
    await upsertPageTranslation(supabase, id, pageNumber, locale, sourceHash, overlay);
  } catch (err) {
    console.error('Failed to persist page translation cache:', err);
  }

  return NextResponse.json(overlay);
}
