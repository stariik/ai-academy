// ============================================================
// /api/admin/categories/[slug]/generate-image
//   GET  — return the auto-built prompt suggestion (no generation)
//   POST — generate a 3:2 cover image via Replicate and save the URL
//          to category_images.image_url. Body: { prompt?: string }
// Admin-gated by src/lib/admin-auth.ts (env allowlist).
// Requires REPLICATE_API_KEY env var.
// Notes: openai/gpt-image-2 only supports aspect_ratio 1:1 / 3:2 / 2:3.
// We use 3:2 — landscape, works for both the slider tile and the row banner.
// quality: 'low' is the cheapest tier (~$0.01/image).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import { getCategoryImage, upsertCategoryImage } from '@/lib/supabase/db';
import { uploadCategoryImage } from '@/lib/supabase/storage';
import { getCategoryBySlug, type CategoryVisual } from '@/lib/v2/data';

type RouteContext = { params: Promise<{ slug: string }> };

function buildPrompt(nameKa: string, visual: CategoryVisual): string {
  return [
    `Premium category cover image for an online AI learning platform.`,
    `Category: "${visual.nameEn}".`,
    visual.taglineEn && `Theme: ${visual.taglineEn}`,
    `Visual style: modern editorial illustration, soft gradients, abstract conceptual imagery evocative of the theme, clean composition, premium tech-education aesthetic, soft depth-of-field, warm but professional color palette.`,
    `Composition: balanced 3:2 landscape, subject centered or rule-of-thirds, lots of breathing room, no clutter.`,
    `STRICT: absolutely no text, no letters, no words, no logos, no watermarks, no UI elements, no people's faces in close-up.`,
  ]
    .filter(Boolean)
    .join(' ');
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { slug } = await context.params;
  const resolved = getCategoryBySlug(slug);
  if (!resolved) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Prefer a previously-saved prompt so the editor reflects the last run.
  const supabase = await createClient();
  const existing = await getCategoryImage(supabase, slug);

  return NextResponse.json({
    prompt: existing?.prompt || buildPrompt(resolved.nameKa, resolved.visual),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'missing_replicate_key' }, { status: 500 });
  }

  const { slug } = await context.params;
  const resolved = getCategoryBySlug(slug);
  if (!resolved) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let body: { prompt?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — we'll auto-build
  }

  const prompt = body.prompt?.trim() || buildPrompt(resolved.nameKa, resolved.visual);

  const replicate = new Replicate({ auth: apiKey });

  // Replicate returns an ephemeral replicate.delivery URL — valid only for
  // ~a day. We must download the bytes now and persist them ourselves.
  let sourceUrl: string | null = null;
  try {
    const output = (await replicate.run('openai/gpt-image-2', {
      input: {
        prompt,
        aspect_ratio: '3:2',
        quality: 'low',
      },
    })) as Array<{ url: () => string }> | { url: () => string };

    if (Array.isArray(output)) {
      sourceUrl = output[0]?.url() ?? null;
    } else if (output && typeof output.url === 'function') {
      sourceUrl = output.url();
    }
  } catch (err) {
    console.error('[admin/categories/generate-image] replicate failed:', err);
    return NextResponse.json({ error: 'generation_failed' }, { status: 502 });
  }

  if (!sourceUrl) {
    return NextResponse.json({ error: 'no_image_returned' }, { status: 502 });
  }

  // Download from Replicate and re-host in Supabase Storage so the URL
  // we save is permanent.
  let imageUrl: string;
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const contentType = res.headers.get('content-type') || 'image/webp';
    const bytes = await res.arrayBuffer();
    imageUrl = await uploadCategoryImage(slug, bytes, contentType);
  } catch (err) {
    console.error('[admin/categories/generate-image] persist failed:', err);
    return NextResponse.json({ error: 'persist_failed' }, { status: 502 });
  }

  const supabase = await createClient();
  await upsertCategoryImage(supabase, slug, { imageUrl, prompt });

  return NextResponse.json({ imageUrl, prompt });
}
