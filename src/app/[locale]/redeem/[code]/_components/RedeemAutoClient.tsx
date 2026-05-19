'use client';

// ============================================================
// Auto-redeem client: fires once on mount, shows result.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { V2LocaleProvider } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import {
  redeemPromoCode,
  redeemStatusLabel,
  type RedeemResult,
  type RedeemStatus,
} from '@/lib/promo-redeem-client';

const TERMINAL_OK: RedeemStatus[] = ['ok', 'already_enrolled'];

export default function RedeemAutoClient({
  code,
  locale,
  dict,
}: {
  code: string;
  locale: Locale;
  dict: Dict;
}) {
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let cancelled = false;
    redeemPromoCode(code).then((r) => {
      if (!cancelled) {
        setResult(r);
        setRunning(false);
      }
    });
    return () => { cancelled = true; };
  }, [code]);

  const success = result && TERMINAL_OK.includes(result.status);
  const message = result ? redeemStatusLabel(result.status, dict) : dict.promo.redeemPageSubtitle;

  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {dict.promo.redeemPageTitle}
          </p>
          <p className="font-mono text-xl font-bold text-foreground tracking-wider mb-6 break-all">
            {code}
          </p>

          {running && (
            <>
              <div className="mx-auto w-10 h-10 border-2 border-muted border-t-pulse rounded-full animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">{dict.promo.redeemPageSubtitle}</p>
            </>
          )}

          {!running && (
            <>
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                success ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'
              }`}>
                {success ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              <p className="text-base font-semibold text-foreground">{message}</p>

              {success && result?.courseId && (
                <Link
                  href={`/${locale}/courses/${result.courseId}`}
                  className="inline-flex items-center justify-center w-full mt-5 px-4 py-3 rounded-xl bg-pulse text-primary-foreground font-bold hover:shadow-[0_8px_24px_var(--pulse-glow)] transition-all"
                >
                  {result.status === 'ok'
                    ? dict.promo.successCta
                    : dict.promo.alreadyEnrolledCta}
                </Link>
              )}

              {!success && (
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center justify-center w-full mt-5 px-4 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
                >
                  {dict.promo.redeemPageBrowseCourses}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </V2LocaleProvider>
  );
}
