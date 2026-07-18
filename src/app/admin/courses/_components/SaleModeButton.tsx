'use client';

// ============================================================
// One-click storefront-wide sale toggle (backed by /api/admin/sale-mode):
// every paid course + category bundle → 0.01 ₾, original prices kept in
// a snapshot and restored exactly with the same button.
// Hidden until the GET confirms the endpoint works (e.g. migration run).
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SaleModeButton() {
  const router = useRouter();
  const [active, setActive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/sale-mode')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setActive(d ? d.active : null))
      .catch(() => setActive(null));
  }, []);

  async function toggle() {
    if (active === null || busy) return;
    const msg = active
      ? 'Restore all original prices from the snapshot?'
      : 'Set EVERY paid course and category bundle to 0.01 ₾?\n\nCurrent prices are saved first and can be restored with one click.';
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/sale-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: active ? 'restore' : 'enable' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Sale mode failed: ${data.error ?? res.status}`);
        return;
      }
      setActive(data.active);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (active === null) return null;
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={
        active
          ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50'
          : 'inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50'
      }
    >
      {busy ? 'Working…' : active ? '⏪ Restore original prices' : '🏷️ Sale: everything 0.01 ₾'}
    </button>
  );
}
