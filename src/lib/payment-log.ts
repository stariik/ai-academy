// ============================================================
// Payment logging — one row in `payment_logs` per Bank of Georgia
// interaction, so a payment can be reconstructed after the fact.
//
// Mirrors the shape of src/lib/ai/usage.ts on purpose: logging is
// best-effort and must NEVER fail a payment. Every error is swallowed
// (a missing table before the 2026-08-04 migration just warns once).
//
// Secrets are stripped here, not at the call site — `redact()` is the one
// place that decides what is safe to store, so no future call site can
// leak a bearer token by forgetting.
// ============================================================

import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export type PaymentEvent =
  | 'token'
  | 'create_order'
  | 'status_lookup'
  | 'refund'
  | 'callback';

export type PaymentLogEntry = {
  event: PaymentEvent;
  /** Our payments.id. Null for events we can't attribute (rejected callbacks). */
  paymentId?: string | null;
  bogOrderId?: string | null;
  ok: boolean;
  httpStatus?: number | null;
  request?: unknown;
  response?: unknown;
  error?: string | null;
  durationMs?: number | null;
};

// ---- Redaction ----
//
// Key-name match, applied at every depth. Deliberately broad: a false
// positive costs one unreadable field, a false negative puts a live bearer
// token in the database.
const SECRET_KEY = /token|secret|password|authorization|client_id|api[-_]?key/i;

/** How much serialized JSON we keep per field. Beyond this the body is truncated. */
const MAX_JSON_CHARS = 20_000;

/**
 * Deep-copy `value`, replacing anything under a secret-looking key with
 * '[redacted]'. Card data and buyer names are intentionally kept — they are
 * what makes a disputed payment debuggable.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 12) return '[too deep]';
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET_KEY.test(key) ? '[redacted]' : redact(v, depth + 1);
  }
  return out;
}

/** Redact, then cap the size so one giant payload can't bloat the table. */
function prepare(value: unknown): unknown {
  if (value === undefined) return null;
  const cleaned = redact(value);
  try {
    const json = JSON.stringify(cleaned);
    if (json && json.length > MAX_JSON_CHARS) {
      return { truncated: true, bytes: json.length, preview: json.slice(0, MAX_JSON_CHARS) };
    }
  } catch {
    return { unserializable: true };
  }
  return cleaned;
}

// ---- Service-role writer ----
//
// payment_logs is deny-all under RLS, so writes need the service key.
let serviceClient: SupabaseClient | null = null;
let warnedNoKey = false;

function getServiceClient(): SupabaseClient | null {
  if (serviceClient) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    if (!warnedNoKey) {
      console.warn('[payment-log] SUPABASE_SERVICE_ROLE_KEY missing — payment logging disabled');
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
 * Record one payment interaction. Never throws — safe to await on any path,
 * including inside a catch block that is about to rethrow.
 */
export async function logPaymentEvent(entry: PaymentLogEntry): Promise<void> {
  try {
    const supabase = getServiceClient();
    if (!supabase) return;

    const { error } = await supabase.from('payment_logs').insert({
      payment_id: entry.paymentId ?? null,
      bog_order_id: entry.bogOrderId ?? null,
      event: entry.event,
      ok: entry.ok,
      http_status: entry.httpStatus ?? null,
      request: prepare(entry.request),
      response: prepare(entry.response),
      error: entry.error ?? null,
      duration_ms: entry.durationMs ?? null,
    });
    // Warn on every failure, not once: a payment log that silently stops
    // recording is worse than noisy output.
    if (error) console.warn('[payment-log] insert failed:', error.message);
  } catch (err) {
    console.warn('[payment-log] logging failed:', err instanceof Error ? err.message : err);
  }
}
