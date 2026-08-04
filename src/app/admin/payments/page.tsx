// ============================================================
// /admin/payments — every payment with its full Bank of Georgia trail.
// Range is driven by ?days= (7 / 30 / 90 / 365), defaulting to 30.
// ============================================================

import Link from 'next/link';
import { getPaymentsOverview } from '@/lib/admin/queries';
import PaymentsLog from './_components/PaymentsLog';

export const dynamic = 'force-dynamic';

const RANGES = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
  { days: 365, label: '1y' },
] as const;

const gel = (cents: number) => `₾${(cents / 100).toFixed(2)}`;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = RANGES.some((r) => r.days === Number(daysParam)) ? Number(daysParam) : 30;
  const data = await getPaymentsOverview(days);
  const { totals } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every checkout with the exact request we sent to Bank of Georgia and what came back.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/admin/payments?days=${r.days}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                days === r.days ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {!data.logsAvailable && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          <p className="font-semibold">Payment logging is not set up yet.</p>
          <p className="mt-1">
            Run{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
              migrations/2026-08-04-payment-logs.sql
            </code>{' '}
            in the Supabase SQL editor to create the{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">payment_logs</code> table.
            Payments are listed below either way, but the request/response trail only starts
            recording once it exists.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Revenue
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">
            {gel(totals.revenueCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{totals.paid} paid over {days} days</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Attempts
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">{totals.payments}</p>
          <p className="mt-1 text-xs text-gray-500">{totals.pending} never completed</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Refunded
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">
            {gel(totals.refundedCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{totals.refunded} payments</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Problems
          </p>
          <p
            className={`mt-1.5 text-2xl font-bold tabular-nums ${
              totals.failedEvents > 0 ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {totals.failedEvents}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            failed steps · {totals.failed} failed payments
          </p>
        </div>
      </div>

      <PaymentsLog rows={data.rows} unmatched={data.unmatched} />
    </div>
  );
}
