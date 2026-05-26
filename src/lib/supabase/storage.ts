// ============================================================
// Supabase Storage helpers
//
// Category cover images are generated via Replicate, whose
// `replicate.delivery` URLs are ephemeral and expire within a day — so
// every cover eventually 404's. We download the bytes and persist them
// in a public Supabase Storage bucket, saving that durable URL to
// category_images.image_url.
//
// Uploads use the service-role key (RLS / bucket policies would
// otherwise block writes). This module is `server-only` so the key
// never reaches the browser.
// ============================================================

import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

const CATEGORY_IMAGE_BUCKET = 'category-images';

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY missing — required for image storage uploads',
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Idempotently ensure a public image bucket exists. */
async function ensureBucket(supabase: SupabaseClient, bucket: string): Promise<void> {
  const { data, error } = await supabase.storage.getBucket(bucket);
  if (data && !error) return;

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    // Cover images are small; cap to keep accidental huge uploads out.
    fileSizeLimit: '10MB',
  });
  // Tolerate the race where another request created it first.
  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(`Failed to create storage bucket: ${createError.message}`);
  }
}

function extensionFor(contentType: string): string {
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  return 'webp';
}

/**
 * Upload category cover bytes and return a durable public URL.
 * Filename is keyed by category slug + timestamp so re-generations don't
 * collide and CDN caches don't serve a stale image.
 */
export async function uploadCategoryImage(
  slug: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const supabase = serviceClient();
  await ensureBucket(supabase, CATEGORY_IMAGE_BUCKET);

  const ext = extensionFor(contentType);
  const path = `${slug}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(CATEGORY_IMAGE_BUCKET)
    .upload(path, bytes, {
      contentType,
      upsert: true,
      cacheControl: '31536000', // 1 year — filename changes on re-gen
    });
  if (error) throw new Error(`Failed to upload category image: ${error.message}`);

  const { data } = supabase.storage.from(CATEGORY_IMAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Failed to resolve public URL for category image');
  return data.publicUrl;
}
