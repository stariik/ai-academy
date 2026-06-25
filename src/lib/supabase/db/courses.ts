import { SupabaseClient } from '@supabase/supabase-js';
import type {
  CourseRow,
  CategoryImageRow,
} from '../types';
import type {
  Course,
} from '@/types';
import { deleteLesson } from './lessons';


// ============================================================
// Courses CRUD
// ============================================================

function mapCourseRow(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en ?? null,
    description: row.description,
    descriptionEn: row.description_en ?? null,
    tags: row.tags,
    userId: row.user_id,
    priceCents: row.price_cents ?? null,
    retailPriceCents: row.retail_price_cents ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createCourse(
  supabase: SupabaseClient,
  course: { title: string; description: string; tags?: string[] }
): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: course.title,
      description: course.description,
      tags: course.tags ?? [],
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create course: ${error?.message}`);
  return mapCourseRow(data as CourseRow);
}

export async function getAllCourses(supabase: SupabaseClient): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as CourseRow[]).map(mapCourseRow);
}

export async function getCourse(supabase: SupabaseClient, id: string): Promise<Course | null> {
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapCourseRow(data as CourseRow);
}

export async function updateCourse(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<{
    title: string;
    titleEn: string | null;
    description: string;
    descriptionEn: string | null;
    tags: string[];
    priceCents: number | null;
    retailPriceCents: number | null;
  }>
): Promise<Course | null> {
  const rowUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) rowUpdates.title = updates.title;
  if (updates.titleEn !== undefined) rowUpdates.title_en = updates.titleEn;
  if (updates.description !== undefined) rowUpdates.description = updates.description;
  if (updates.descriptionEn !== undefined) rowUpdates.description_en = updates.descriptionEn;
  if (updates.tags !== undefined) rowUpdates.tags = updates.tags;
  if (updates.priceCents !== undefined) rowUpdates.price_cents = updates.priceCents;
  if (updates.retailPriceCents !== undefined) rowUpdates.retail_price_cents = updates.retailPriceCents;

  if (Object.keys(rowUpdates).length > 0) {
    const { error } = await supabase.from('courses').update(rowUpdates).eq('id', id);
    if (error) throw new Error(`Failed to update course: ${error.message}`);
  }
  return getCourse(supabase, id);
}

export async function deleteCourse(supabase: SupabaseClient, id: string): Promise<boolean> {
  // Delete all lessons belonging to this course (cascade deletes their content_blocks, quiz_questions, lesson_pages)
  const { data: lessons } = await supabase.from('lessons').select('id').eq('course_id', id);
  if (lessons && lessons.length > 0) {
    for (const lesson of lessons) {
      await deleteLesson(supabase, lesson.id);
    }
  }
  const { error } = await supabase.from('courses').delete().eq('id', id);
  return !error;
}

// ============================================================
// Category cover images
//
// Categories live as the 9 canonical strings in
// src/lib/constants/categories.ts (not a `categories` table). The
// `category_images` table stores one admin-generated cover per category,
// keyed by the category slug from CATEGORY_VISUALS.
// ============================================================

export type CategoryImage = {
  slug: string;
  imageUrl: string | null;
  prompt: string | null;
  /** Admin override of the derived storefront bundle price (tetri). */
  bundlePriceCents: number | null;
  bundleRetailCents: number | null;
};

function mapCategoryImageRow(row: CategoryImageRow): CategoryImage {
  return {
    slug: row.slug,
    imageUrl: row.image_url ?? null,
    prompt: row.prompt ?? null,
    bundlePriceCents: row.bundle_price_cents ?? null,
    bundleRetailCents: row.bundle_retail_cents ?? null,
  };
}

/** All category images as a slug -> image_url map (only rows with a URL). */
export async function getCategoryImages(
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('category_images')
    .select('slug, image_url');
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data as Pick<CategoryImageRow, 'slug' | 'image_url'>[]) {
    if (row.image_url) map[row.slug] = row.image_url;
  }
  return map;
}

/** Full per-category metadata rows (image + bundle price), keyed by slug. */
export async function getCategoryMeta(
  supabase: SupabaseClient,
): Promise<Record<string, CategoryImage>> {
  const { data, error } = await supabase.from('category_images').select('*');
  if (error || !data) return {};
  const map: Record<string, CategoryImage> = {};
  for (const row of data as CategoryImageRow[]) {
    map[row.slug] = mapCategoryImageRow(row);
  }
  return map;
}

export async function getCategoryImage(
  supabase: SupabaseClient,
  slug: string,
): Promise<CategoryImage | null> {
  const { data, error } = await supabase
    .from('category_images')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return mapCategoryImageRow(data as CategoryImageRow);
}

/** Insert or update a category's cover image / prompt / bundle price. */
export async function upsertCategoryImage(
  supabase: SupabaseClient,
  slug: string,
  updates: {
    imageUrl?: string | null;
    prompt?: string | null;
    bundlePriceCents?: number | null;
    bundleRetailCents?: number | null;
  },
): Promise<CategoryImage | null> {
  const row: Record<string, unknown> = { slug, updated_at: new Date().toISOString() };
  if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
  if (updates.prompt !== undefined) row.prompt = updates.prompt;
  if (updates.bundlePriceCents !== undefined) row.bundle_price_cents = updates.bundlePriceCents;
  if (updates.bundleRetailCents !== undefined) row.bundle_retail_cents = updates.bundleRetailCents;

  const { error } = await supabase
    .from('category_images')
    .upsert(row, { onConflict: 'slug' });
  if (error) throw new Error(`Failed to upsert category image: ${error.message}`);
  return getCategoryImage(supabase, slug);
}
