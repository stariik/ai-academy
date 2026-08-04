'use client';

// BOG sends declined payments back to `?payment=failed` (see /api/checkout).
// Without this the customer lands on the page with no feedback at all and
// assumes the site broke, when in fact their bank refused the card.
// ponytail: texts inlined per-locale, matching IpWarnBanner — two strings
// for a rare banner; move into the dict if it grows.

import * as React from 'react';

const TEXT = {
  ka: 'გადახდა ვერ შესრულდა — თანხა არ ჩამოგეჭრათ. ბარათი უარყო გამომცემმა ბანკმა. სცადეთ სხვა ბარათი ან დაუკავშირდით თქვენს ბანკს.',
  en: 'Payment failed — you were not charged. Your bank declined the card. Try another card, or contact your bank.',
};

export default function PaymentFailedBanner({ locale }: { locale: string }) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    setShow(new URLSearchParams(window.location.search).get('payment') === 'failed');
  }, []);

  if (!show) return null;

  // Drop the param too, so a refresh or a back-navigation doesn't resurrect it.
  const dismiss = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    window.history.replaceState(null, '', url);
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex max-w-2xl items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-lg dark:border-rose-700 dark:bg-rose-950 dark:text-rose-100">
        <span className="text-lg leading-none" aria-hidden>
          ⚠️
        </span>
        <p className="flex-1 text-xs leading-relaxed">{locale === 'ka' ? TEXT.ka : TEXT.en}</p>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full px-2 py-0.5 text-sm font-bold opacity-60 transition hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
