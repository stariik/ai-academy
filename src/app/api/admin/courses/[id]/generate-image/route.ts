// ============================================================
// /api/admin/courses/[id]/generate-image
//   GET  — return the auto-built prompt suggestion (no generation)
//   POST — generate a 3:2 cover image via Replicate and save URL
//          to courses.image_url. Body: { prompt?: string }
// Admin-gated by src/lib/admin-auth.ts (env allowlist).
// Requires REPLICATE_API_KEY env var.
// Notes: openai/gpt-image-2 only supports aspect_ratio 1:1 / 3:2 / 2:3.
// We use 3:2 — the closest landscape match for the 4:3 card slot.
// quality: 'low' is the cheapest tier (~$0.01/image).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import { getCourse, updateCourse } from '@/lib/supabase/db';
import type { Course } from '@/types';

type RouteContext = { params: Promise<{ id: string }> };

function buildPrompt(course: Course): string {
  const title = course.titleEn?.trim() || course.title;
  const description = (course.descriptionEn?.trim() || course.description || '').slice(0, 240);
  const tags = course.tags?.slice(0, 4).join(', ') ?? '';

  return [
    `Premium course cover image for an online learning platform.`,
    `Course title: "${title}".`,
    description && `Course summary: ${description}`,
    tags && `Topics: ${tags}.`,
    `Visual style: modern editorial illustration, soft gradients, abstract conceptual imagery evocative of the topic, clean composition, premium tech-education aesthetic, soft depth-of-field, warm but professional color palette.`,
    `Composition: balanced 3:2 landscape, subject centered or rule-of-thirds, lots of breathing room, no clutter.`,
    `STRICT: absolutely no text, no letters, no words, no logos, no watermarks, no UI elements, no people's faces in close-up.`,
  ]
    .filter(Boolean)
    .join(' ');
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();
  const course = await getCourse(supabase, id);
  if (!course) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json({ prompt: buildPrompt(course) });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'missing_replicate_key' }, { status: 500 });
  }

  const { id } = await context.params;
  const supabase = await createClient();
  const course = await getCourse(supabase, id);
  if (!course) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let body: { prompt?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — we'll auto-build
  }

  const prompt = (body.prompt?.trim() || buildPrompt(course));

  const replicate = new Replicate({ auth: apiKey });

  let imageUrl: string | null = null;
  try {
    const output = (await replicate.run('openai/gpt-image-2', {
      input: {
        prompt,
        aspect_ratio: '3:2',
        quality: 'low',
      },
    })) as Array<{ url: () => string }> | { url: () => string };

    if (Array.isArray(output)) {
      imageUrl = output[0]?.url() ?? null;
    } else if (output && typeof output.url === 'function') {
      imageUrl = output.url();
    }
  } catch (err) {
    console.error('[admin/courses/generate-image] replicate failed:', err);
    return NextResponse.json({ error: 'generation_failed' }, { status: 502 });
  }

  if (!imageUrl) {
    return NextResponse.json({ error: 'no_image_returned' }, { status: 502 });
  }

  await updateCourse(supabase, id, { imageUrl });

  return NextResponse.json({ imageUrl, prompt });
}
