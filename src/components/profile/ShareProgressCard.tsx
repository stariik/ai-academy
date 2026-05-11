'use client';

import { useEffect, useState } from 'react';

// ============================================================
// ShareProgressCard — profile widget for Task 10
// Lets the student get / copy / rotate a read-only share link.
// ============================================================

export function ShareProgressCard() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    token && typeof window !== 'undefined' ? `${window.location.origin}/share/${token}` : '';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/share-token');
        if (res.ok) {
          const data = await res.json();
          setToken(data.token ?? null);
        }
      } catch {
        // no-op — UI handles null state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function rotate() {
    setLoading(true);
    try {
      const res = await fetch('/api/share-token', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setCopied(false);
      }
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="bg-white rounded-2xl border border-cyan-50 p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">👨‍👩‍👧</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-navy">გაუზიარე მშობელს ან მასწავლებელს</h2>
          <p className="text-xs text-navy-100 mt-0.5">
            ბმული აჩვენებს შენს პროგრესს — მხოლოდ ნახვის რეჟიმი. შეგიძლია ნებისმიერ დროს გააუქმო.
          </p>
        </div>
      </div>

      {loading && !token ? (
        <div className="h-10 flex items-center text-xs text-navy-100">იტვირთება...</div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
              className="flex-1 rounded-xl border border-cyan-50 bg-cream-50 px-3 py-2 text-xs text-navy font-mono min-w-0"
            />
            <button
              onClick={copy}
              disabled={!shareUrl}
              className="rounded-xl bg-gradient-to-r from-teal to-cyan text-white font-bold px-4 py-2 text-xs disabled:opacity-50 hover:-translate-y-0.5 transition"
            >
              {copied ? '✓ დაკოპირდა' : 'დააკოპირე'}
            </button>
          </div>
          <button
            onClick={rotate}
            disabled={loading}
            className="mt-3 text-[11px] font-bold text-navy-100 hover:text-red-500 transition"
          >
            ↻ ახალი ბმულის გენერირება (ძველი გაუქმდება)
          </button>
        </>
      )}
    </section>
  );
}
