'use client';

// Account-sharing warning. Middleware sets the `ip_warn` cookie once the
// account hits 5+ distinct IPs in 30 days; this shows the rule before the
// hard block at 7. Dismiss deletes the cookie (it returns if a new IP
// registers again).
// ponytail: texts inlined per-locale instead of the dict system — two
// strings for a rare banner; move into the dict if it grows.

import * as React from 'react';

const TEXT = {
  ka: (n: string) =>
    `თქვენი ანგარიში ბოლო 30 დღეში ${n} სხვადასხვა ქსელიდან იყო გამოყენებული. დასაშვებია მაქსიმუმ 7 — ანგარიში პირადია და გაზიარება აკრძალულია. ლიმიტის ამოწურვის შემდეგ ახალი ქსელებიდან შესვლა დაიბლოკება.`,
  en: (n: string) =>
    `Your account has been used from ${n} different networks in the last 30 days. The maximum is 7 — accounts are personal and may not be shared. Once the limit is reached, sign-ins from new networks will be blocked.`,
};

export default function IpWarnBanner({ locale }: { locale: string }) {
  const [count, setCount] = React.useState<string | null>(null);

  React.useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)ip_warn=(\d+)/);
    if (m) setCount(m[1]);
  }, []);

  if (!count) return null;

  const dismiss = () => {
    document.cookie = 'ip_warn=; Max-Age=0; path=/';
    setCount(null);
  };
  const text = (locale === 'ka' ? TEXT.ka : TEXT.en)(count);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex max-w-2xl items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-lg dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
        <span className="text-lg leading-none" aria-hidden>
          ⚠️
        </span>
        <p className="flex-1 text-xs leading-relaxed">{text}</p>
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
