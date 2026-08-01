// ============================================================
// AI usage logging — one row in `ai_usage` per external AI call.
//
// Every Claude / Gemini / Google Translate / Replicate call site reports
// here so the admin panel can show token counts and cost. Logging is
// strictly best-effort: it must never fail the user-facing request, so
// `logAiUsage` swallows every error (a missing table before the
// 2026-06-12 migration just logs a warning).
//
// Costs are estimates from published per-MTok prices — good enough for
// budget monitoring, not for invoicing.
// ============================================================

import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export type AiProvider = 'anthropic' | 'gemini' | 'google-translate' | 'replicate';

export type AiFeature =
  | 'tutor_chat'
  | 'english_guard'
  | 'quiz_grading'
  | 'review_explanation'
  | 'material_translation'
  | 'lesson_generation'
  | 'outline_detection'
  | 'quiz_generation'
  | 'metadata_generation'
  | 'onboarding_interview'
  | 'ui_translation'
  | 'category_image';

/** Optional request context passed down from routes into AI helpers. */
export type UsageMeta = {
  feature: AiFeature;
  sessionId?: string | null;
  userId?: string | null;
  lessonId?: string | null;
  courseId?: string | null;
  locale?: string | null;
};

export type UsageEntry = UsageMeta & {
  provider: AiProvider;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  /** Overrides the estimate when the caller knows the real cost (e.g. per-image). */
  costUsd?: number;
  durationMs?: number;
  success?: boolean;
  metadata?: Record<string, unknown>;
};

// ---- Cost estimation ----
//
// USD per million tokens: [input, output, cacheWrite, cacheRead].
// Matched by longest key prefix so dated model ids resolve correctly.
const MTOK_PRICES: Record<string, [number, number, number, number]> = {
  'claude-opus': [15, 75, 18.75, 1.5],
  'claude-sonnet': [3, 15, 3.75, 0.3],
  'claude-haiku': [1, 5, 1.25, 0.1],
  'gemini-2.5-pro': [1.25, 10, 0, 0],
  'gemini-2.5-flash': [0.3, 2.5, 0, 0],
  'gemini-2.0-flash': [0.1, 0.4, 0, 0],
};

export function estimateCostUsd(entry: {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}): number {
  let prices: [number, number, number, number] | null = null;
  let bestLen = 0;
  for (const [prefix, p] of Object.entries(MTOK_PRICES)) {
    if (entry.model.startsWith(prefix) && prefix.length > bestLen) {
      prices = p;
      bestLen = prefix.length;
    }
  }
  if (!prices) return 0;
  const [inP, outP, cwP, crP] = prices;
  return (
    ((entry.inputTokens ?? 0) * inP +
      (entry.outputTokens ?? 0) * outP +
      (entry.cacheWriteTokens ?? 0) * cwP +
      (entry.cacheReadTokens ?? 0) * crP) /
    1_000_000
  );
}

/** Google Translate v2: $20 per million characters. */
export function translateCharsCostUsd(chars: number): number {
  return (chars * 20) / 1_000_000;
}

// ---- Service-role writer ----
//
// ai_usage has a deny-all RLS policy, so writes need the service key.
let serviceClient: SupabaseClient | null = null;
let warnedNoKey = false;

function getServiceClient(): SupabaseClient | null {
  if (serviceClient) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    if (!warnedNoKey) {
      console.warn('[ai-usage] SUPABASE_SERVICE_ROLE_KEY missing — AI usage logging disabled');
      warnedNoKey = true;
    }
    return null;
  }
  serviceClient = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}

/**
 * Record one AI call. Never throws, never blocks the caller's error path —
 * await it freely or fire-and-forget with `void logAiUsage(...)`.
 */
export async function logAiUsage(entry: UsageEntry): Promise<void> {
  try {
    const supabase = getServiceClient();
    if (!supabase) return;

    const costUsd =
      entry.costUsd ??
      estimateCostUsd({
        model: entry.model,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        cacheReadTokens: entry.cacheReadTokens,
        cacheWriteTokens: entry.cacheWriteTokens,
      });

    const { error } = await supabase.from('ai_usage').insert({
      provider: entry.provider,
      model: entry.model,
      feature: entry.feature,
      input_tokens: entry.inputTokens ?? 0,
      output_tokens: entry.outputTokens ?? 0,
      cache_read_tokens: entry.cacheReadTokens ?? 0,
      cache_write_tokens: entry.cacheWriteTokens ?? 0,
      cost_usd: Number(costUsd.toFixed(6)),
      duration_ms: entry.durationMs ?? null,
      success: entry.success ?? true,
      session_id: entry.sessionId ?? null,
      user_id: entry.userId ?? null,
      lesson_id: entry.lessonId ?? null,
      course_id: entry.courseId ?? null,
      locale: entry.locale ?? null,
      metadata: entry.metadata ?? null,
    });
    if (error) {
      console.warn('[ai-usage] insert failed:', error.message);
    }
  } catch (err) {
    console.warn('[ai-usage] logging failed:', err instanceof Error ? err.message : err);
  }
}
