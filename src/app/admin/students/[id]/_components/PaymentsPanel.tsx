'use client';

// Payment history for one student, with a one-click refund that also
// revokes the purchased enrollment (POST /api/admin/payments/[id]/refund).

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type PaymentRow = {
  id: string;
  courseTitle: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
};

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-teal-50 text-teal border border-teal/20',
  refunded: 'bg-purple-50 text-purple-700 border border-purple-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  created: 'bg-gray-100 text-gray-500 border border-gray-200',
  failed: 'bg-red-50 text-red-600 border border-red-200',
};

export default function PaymentsPanel({ payments }: { payments: PaymentRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refund = async (p: PaymentRow) => {
    const gel = (p.amountCents / 100).toFixed(2);
    if (
      !confirm(
        `Refund ₾${gel} for "${p.courseTitle}"?\n\nThis returns the money via Bank of Georgia AND revokes the student's access to the course.`,
      )
    )
      return;
    setBusyId(p.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments/${p.id}/refund`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'refund_failed');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'refund_failed');
    } finally {
      setBusyId(null);
    }
  };

  if (payments.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <header className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Payments ({payments.length})</h2>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-2">Course</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Date</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="max-w-md truncate px-4 py-2.5 font-medium text-gray-900">
                  {p.courseTitle}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  ₾{(p.amountCents / 100).toFixed(2)}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[p.status] ?? STATUS_BADGE.created}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {p.status === 'paid' ? (
                    <button
                      onClick={() => refund(p)}
                      disabled={busyId !== null}
                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      {busyId === p.id ? 'Refunding…' : 'Refund'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="px-4 pb-3 text-xs text-red-600">Failed: {error}</p>}
    </section>
  );
}
