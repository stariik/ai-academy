// ============================================================
// Client-side helper for redeeming promo codes.
//
// Wraps POST /api/promo/redeem, normalises the response, and maps the
// RPC status onto the i18n strings the three redemption surfaces share.
// ============================================================

import type { Dict } from '@/lib/v2/i18n';

export type RedeemStatus =
  | 'ok'
  | 'already_enrolled'
  | 'not_found'
  | 'inactive'
  | 'expired'
  | 'exhausted'
  | 'already_redeemed'
  | 'course_required'
  | 'requires_checkout'
  | 'unauthenticated'
  | 'rate_limited'
  | 'error';

export type RedeemResult = {
  status: RedeemStatus;
  message: string;
  courseId: string | null;
  promoId: string | null;
};

export async function redeemPromoCode(
  code: string,
  courseId?: string | null,
): Promise<RedeemResult> {
  const res = await fetch('/api/promo/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, courseId: courseId ?? null }),
  });

  if (res.status === 429) {
    return { status: 'rate_limited', message: '', courseId: null, promoId: null };
  }

  let body: Partial<RedeemResult> & { error?: string };
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  const status = (body.status ?? 'error') as RedeemStatus;
  return {
    status,
    message: body.message ?? '',
    courseId: body.courseId ?? null,
    promoId: body.promoId ?? null,
  };
}

export function redeemStatusLabel(status: RedeemStatus, dict: Dict): string {
  switch (status) {
    case 'ok':                  return dict.promo.successTitle;
    case 'already_enrolled':    return dict.promo.alreadyEnrolledTitle;
    case 'not_found':           return dict.promo.errorNotFound;
    case 'inactive':            return dict.promo.errorInactive;
    case 'expired':             return dict.promo.errorExpired;
    case 'exhausted':           return dict.promo.errorExhausted;
    case 'already_redeemed':    return dict.promo.errorAlreadyRedeemed;
    case 'course_required':    return dict.promo.errorCourseRequired;
    case 'requires_checkout':   return dict.promo.errorRequiresCheckout;
    case 'rate_limited':        return dict.promo.errorRateLimited;
    case 'unauthenticated':     return dict.promo.redeemPageSigningIn;
    case 'error':
    default:                    return dict.promo.errorGeneric;
  }
}
