'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Sparkles, X } from 'lucide-react';

export const PAYMENT_SUCCESS_EVENT = 'walle:payment-success';

export type PaymentSuccessEventDetail = {
  kind: 'course' | 'bundle';
  category: string | null;
};

const TEXT = {
  ka: {
    title: 'გადახდა წარმატებით შესრულდა',
    course: 'კურსი უკვე გახსნილია — შეგიძლია სწავლა დაიწყო.',
    bundle: 'კურსები უკვე გახსნილია — შეგიძლია სწავლა დაიწყო.',
    dismiss: 'დახურვა',
  },
  en: {
    title: 'Payment successful',
    course: 'Your course is unlocked and ready. Enjoy learning!',
    bundle: 'Your courses are unlocked and ready. Enjoy learning!',
    dismiss: 'Dismiss',
  },
};

/**
 * Turns BOG's successful return URL into user feedback and a browser event.
 *
 * Consumers can listen with:
 * window.addEventListener('walle:payment-success', (event) => { ... })
 */
export default function PaymentSuccessToast({ locale }: { locale: string }) {
  const [detail, setDetail] = React.useState<PaymentSuccessEventDetail | null>(null);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('payment') !== 'success') return;

    const category = url.searchParams.get('category');
    const eventDetail: PaymentSuccessEventDetail = {
      kind: category ? 'bundle' : 'course',
      category,
    };

    // The URL is an external signal. Queue the visual state update so this
    // effect remains an external-system synchronizer rather than causing a
    // synchronous render cascade.
    queueMicrotask(() => setDetail(eventDetail));

    // Clean the one-time return marker before dispatch. This also makes the
    // effect safe under React Strict Mode and prevents refresh from replaying it.
    url.searchParams.delete('payment');
    url.searchParams.delete('category');
    window.history.replaceState(window.history.state, '', url);

    window.dispatchEvent(
      new CustomEvent<PaymentSuccessEventDetail>(PAYMENT_SUCCESS_EVENT, {
        detail: eventDetail,
      }),
    );
  }, []);

  React.useEffect(() => {
    if (!detail) return;
    const timeout = window.setTimeout(() => setDetail(null), 8_000);
    return () => window.clearTimeout(timeout);
  }, [detail]);

  const copy = locale === 'ka' ? TEXT.ka : TEXT.en;

  return (
    <AnimatePresence>
      {detail && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6"
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        >
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl border border-pulse/35 bg-card/95 p-4 shadow-[0_18px_60px_-18px_var(--pulse-glow)] backdrop-blur-xl sm:p-5"
          >
            <div
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-pulse to-transparent"
              aria-hidden
            />
            <div
              className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-pulse/10 blur-2xl"
              aria-hidden
            />

            <div className="relative flex items-start gap-3.5">
              <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pulse text-primary-foreground shadow-[0_8px_24px_var(--pulse-glow)]">
                <Check className="h-6 w-6" strokeWidth={3} aria-hidden />
                <Sparkles
                  className="absolute -right-1.5 -top-1.5 h-4 w-4 text-pulse-soft"
                  fill="currentColor"
                  aria-hidden
                />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-black tracking-tight text-foreground sm:text-base">
                  {copy.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                  {detail.kind === 'bundle' ? copy.bundle : copy.course}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label={copy.dismiss}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
