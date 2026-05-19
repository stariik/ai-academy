// ============================================================
// Promo code server helpers
//
// All admin reads/writes against `promo_codes`. End-user redemption
// goes through the redeem_promo_code() RPC (see src/app/api/promo/redeem).
//
// RLS denies all access to `promo_codes` for clients — these helpers
// run server-side using the user's authenticated session, but the
// callers must already have passed an admin check (see admin-auth.ts).
// We intentionally use the service role for these writes so RLS does
// not block legitimate admin operations.
// ============================================================

import 'server-only';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export type PromoCodeType = 'unlock' | 'percent_off' | 'amount_off';

export type PromoCode = {
  id: string;
  code: string;
  type: PromoCodeType;
  courseId: string | null;
  percentOff: number | null;
  amountOffCents: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  perUserLimit: number;
  expiresAt: string | null;
  isActive: boolean;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PromoRedemption = {
  id: string;
  promoCodeId: string;
  userId: string;
  courseId: string | null;
  redeemedAt: string;
};

/* ============================================================
   Code generation — Crockford base32 (no 0/O/1/I/L/U)
   Produces WALLI-XXXX-XXXX (14 chars including dashes).
   ============================================================ */

const CROCKFORD_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomChunk(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CROCKFORD_ALPHABET[bytes[i] % CROCKFORD_ALPHABET.length];
  }
  return out;
}

export function generateCode(prefix = 'WALLI'): string {
  return `${prefix}-${randomChunk(4)}-${randomChunk(4)}`;
}

/** Generate N unique codes locally (collisions within this batch are filtered). */
export function generateBatch(n: number, prefix = 'WALLI'): string[] {
  const seen = new Set<string>();
  // n is admin-supplied — guard against pathological values upstream.
  while (seen.size < n) seen.add(generateCode(prefix));
  return [...seen];
}

/* ============================================================
   Service-role client — required for admin writes because RLS
   on `promo_codes` denies everything to authenticated users.
   Service-role key never reaches the browser; this module is
   `server-only`.
   ============================================================ */

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY missing — required for promo-code admin writes',
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/* ============================================================
   Row → object mapper
   ============================================================ */

type PromoCodeRow = {
  id: string;
  code: string;
  type: PromoCodeType;
  course_id: string | null;
  percent_off: number | null;
  amount_off_cents: number | null;
  max_redemptions: number | null;
  redemption_count: number;
  per_user_limit: number;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function rowToPromo(r: PromoCodeRow): PromoCode {
  return {
    id: r.id,
    code: r.code,
    type: r.type,
    courseId: r.course_id,
    percentOff: r.percent_off,
    amountOffCents: r.amount_off_cents,
    maxRedemptions: r.max_redemptions,
    redemptionCount: r.redemption_count,
    perUserLimit: r.per_user_limit,
    expiresAt: r.expires_at,
    isActive: r.is_active,
    notes: r.notes,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ============================================================
   Reads (admin)
   ============================================================ */

export type PromoFilter = 'all' | 'active' | 'expired' | 'exhausted' | 'inactive';

export async function listPromoCodes(filter: PromoFilter = 'all'): Promise<PromoCode[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []).map(rowToPromo);
  const now = new Date();
  return rows.filter((p) => {
    const expired = p.expiresAt !== null && new Date(p.expiresAt) < now;
    const exhausted =
      p.maxRedemptions !== null && p.redemptionCount >= p.maxRedemptions;
    switch (filter) {
      case 'active':
        return p.isActive && !expired && !exhausted;
      case 'expired':
        return expired;
      case 'exhausted':
        return exhausted;
      case 'inactive':
        return !p.isActive;
      default:
        return true;
    }
  });
}

export async function getPromoCode(id: string): Promise<PromoCode | null> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPromo(data) : null;
}

export async function listRedemptions(promoCodeId: string): Promise<PromoRedemption[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from('promo_redemptions')
    .select('id, promo_code_id, user_id, course_id, redeemed_at')
    .eq('promo_code_id', promoCodeId)
    .order('redeemed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    promoCodeId: r.promo_code_id,
    userId: r.user_id,
    courseId: r.course_id,
    redeemedAt: r.redeemed_at,
  }));
}

/* ============================================================
   Writes (admin)
   ============================================================ */

export type CreatePromoInput = {
  code?: string;            // when omitted, auto-generate
  type: PromoCodeType;
  courseId?: string | null;
  percentOff?: number | null;
  amountOffCents?: number | null;
  maxRedemptions?: number | null;
  perUserLimit?: number;
  expiresAt?: string | null;
  notes?: string | null;
  createdBy?: string | null;
};

function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}

export async function createPromoCode(input: CreatePromoInput): Promise<PromoCode> {
  const supabase = serviceClient();
  const code = normalizeCode(input.code ?? generateCode());

  const row = {
    code,
    type: input.type,
    course_id: input.courseId ?? null,
    percent_off: input.type === 'percent_off' ? input.percentOff ?? null : null,
    amount_off_cents: input.type === 'amount_off' ? input.amountOffCents ?? null : null,
    max_redemptions: input.maxRedemptions ?? null,
    per_user_limit: input.perUserLimit ?? 1,
    expires_at: input.expiresAt ?? null,
    notes: input.notes ?? null,
    created_by: input.createdBy ?? null,
  };

  const { data, error } = await supabase
    .from('promo_codes')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return rowToPromo(data);
}

export async function createBulkUnlockCodes(args: {
  courseId: string | null;
  count: number;
  expiresAt?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}): Promise<PromoCode[]> {
  if (args.count < 1 || args.count > 1000) {
    throw new Error('count must be between 1 and 1000');
  }
  const supabase = serviceClient();
  const codes = generateBatch(args.count);
  const rows = codes.map((code) => ({
    code,
    type: 'unlock' as const,
    course_id: args.courseId,
    max_redemptions: 1,
    per_user_limit: 1,
    expires_at: args.expiresAt ?? null,
    notes: args.notes ?? null,
    created_by: args.createdBy ?? null,
  }));

  const { data, error } = await supabase
    .from('promo_codes')
    .insert(rows)
    .select('*');

  if (error) throw error;
  return (data ?? []).map(rowToPromo);
}

export async function setPromoActive(id: string, isActive: boolean): Promise<void> {
  const supabase = serviceClient();
  const { error } = await supabase
    .from('promo_codes')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw error;
}

/* ============================================================
   Server-side derived state — used by both admin UI and APIs
   ============================================================ */

export type PromoStatus = 'active' | 'inactive' | 'expired' | 'exhausted';

export function statusOf(p: PromoCode, now = new Date()): PromoStatus {
  if (!p.isActive) return 'inactive';
  if (p.expiresAt && new Date(p.expiresAt) < now) return 'expired';
  if (p.maxRedemptions !== null && p.redemptionCount >= p.maxRedemptions) return 'exhausted';
  return 'active';
}

/* ============================================================
   Convenience: also expose the user-session supabase client
   for any helper that doesn't need service role (e.g. counting
   the redemptions a signed-in user owns).
   ============================================================ */

export async function userSupabase() {
  return createServerClient();
}
