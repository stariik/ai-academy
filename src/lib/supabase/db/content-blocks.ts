import { SupabaseClient } from '@supabase/supabase-js';
import type {
  ContentBlockRow,
} from '../types';
import type {
  ContentBlock,
} from '@/types';
import { mapContentBlock } from './_shared';


// ============================================================
// Content Blocks CRUD (added 2026-05-20)
// ============================================================

export async function createContentBlock(
  supabase: SupabaseClient,
  block: {
    lessonId: string;
    pageId: string | null;
    type: ContentBlock['type'];
    content: string;
    contentEn?: string | null;
    order: number;
    metadata?: Record<string, unknown> | null;
  },
): Promise<ContentBlock> {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const row = {
    id,
    lesson_id: block.lessonId,
    page_id: block.pageId,
    type: block.type,
    content: block.content,
    content_en: block.contentEn ?? null,
    metadata: block.metadata ?? null,
    order: block.order,
  };
  const { data, error } = await supabase
    .from('content_blocks')
    .insert(row)
    .select('*')
    .single();
  if (error || !data) throw new Error(`Failed to create content block: ${error?.message}`);
  return mapContentBlock(data as ContentBlockRow);
}

export async function updateContentBlock(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<{
    type: ContentBlock['type'];
    content: string;
    contentEn: string | null;
    order: number;
    metadata: Record<string, unknown> | null;
  }>,
): Promise<boolean> {
  const rowUpdates: Record<string, unknown> = {};
  if (updates.type !== undefined) rowUpdates.type = updates.type;
  if (updates.content !== undefined) rowUpdates.content = updates.content;
  if (updates.contentEn !== undefined) rowUpdates.content_en = updates.contentEn;
  if (updates.order !== undefined) rowUpdates.order = updates.order;
  if (updates.metadata !== undefined) rowUpdates.metadata = updates.metadata;
  if (Object.keys(rowUpdates).length === 0) return true;

  const { error } = await supabase.from('content_blocks').update(rowUpdates).eq('id', id);
  if (error) throw new Error(`Failed to update content block: ${error.message}`);
  return true;
}

export async function deleteContentBlock(
  supabase: SupabaseClient,
  id: string,
): Promise<boolean> {
  const { error } = await supabase.from('content_blocks').delete().eq('id', id);
  return !error;
}

/**
 * Batch-reorder content blocks within a single page (or top-level when
 * pageId is null). content_blocks.order has no uniqueness constraint
 * today, so a one-pass update is safe.
 */
export async function reorderContentBlocks(
  supabase: SupabaseClient,
  order: { id: string; order: number }[],
): Promise<void> {
  for (const { id, order: position } of order) {
    const { error } = await supabase
      .from('content_blocks')
      .update({ order: position })
      .eq('id', id);
    if (error) throw new Error(`Failed to reorder content blocks: ${error.message}`);
  }
}
