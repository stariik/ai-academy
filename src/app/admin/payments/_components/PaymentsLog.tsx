'use client';

// ============================================================
// The readable half of /admin/payments.
//
// One collapsed line per payment; expand it to get the ordered trail of
// what we sent to Bank of Georgia and what came back, and expand any step
// to read the raw request/response JSON.
// ============================================================

import { useMemo, useState } from 'react';
import { ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { AdminPaymentRow, PaymentLogEvent } from '@/lib/admin/queries';

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-teal-50 text-teal border-teal/20',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  created: 'bg-gray-100 text-gray-500 border-gray-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
};

// `out` = we called BOG. `in` = BOG called us.
const EVENT_META: Record<string, { label: string; dir: 'out' | 'in' }> = {
  token: { label: 'Get access token', dir: 'out' },
  create_order: { label: 'Create order', dir: 'out' },
  status_lookup: { label: 'Check order status', dir: 'out' },
  refund: { label: 'Refund order', dir: 'out' },
  callback: { label: 'Webhook received', dir: 'in' },
};

const gel = (cents: number) => `₾${(cents / 100).toFixed(2)}`;

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

function Json({ title, value }: { title: string; value: unknown }) {
  const text = useMemo(() => {
    if (value === null || value === undefined) return '—';
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </p>
      <pre className="max-h-80 overflow-auto rounded-lg bg-gray-900 px-3 py-2.5 text-[11px] leading-relaxed text-gray-100">
        {text}
      </pre>
    </div>
  );
}

function EventItem({ e }: { e: PaymentLogEvent }) {
  const [open, setOpen] = useState(false);
  const meta = EVENT_META[e.event] ?? { label: e.event, dir: 'out' as const };
  const Icon = meta.dir === 'in' ? ArrowDownLeft : ArrowUpRight;

  return (
    <li className="border-t border-gray-100 first:border-t-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-gray-50"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition ${open ? 'rotate-90' : ''}`}
        />
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${meta.dir === 'in' ? 'text-blue-500' : 'text-gray-400'}`}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
          {meta.label}
          <span className="ml-2 text-xs font-normal text-gray-400">
            {meta.dir === 'in' ? 'from BOG' : 'to BOG'}
          </span>
        </span>
        {e.error && (
          <span className="hidden max-w-[18rem] truncate text-xs text-red-600 sm:inline">
            {e.error}
          </span>
        )}
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            e.ok
              ? 'border-teal/20 bg-teal-50 text-teal'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {e.httpStatus ?? (e.ok ? 'ok' : 'error')}
        </span>
        <span className="w-14 shrink-0 text-right text-xs tabular-nums text-gray-400">
          {e.durationMs != null ? `${e.durationMs}ms` : '—'}
        </span>
        <span className="hidden w-36 shrink-0 text-right text-xs text-gray-400 md:inline">
          {when(e.createdAt)}
        </span>
      </button>

      {open && (
        <div className="space-y-3 bg-gray-50/70 px-4 py-3">
          {e.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {e.error}
            </p>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            <Json title="Sent" value={e.request} />
            <Json title="Returned" value={e.response} />
          </div>
        </div>
      )}
    </li>
  );
}

function PaymentItem({ p }: { p: AdminPaymentRow }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-t border-gray-100 first:border-t-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? 'rotate-90' : ''}`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {p.target}
            {p.isBundle && (
              <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                bundle
              </span>
            )}
          </p>
          <p className="truncate text-xs text-gray-500">{p.email ?? p.userId}</p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
          {gel(p.amountCents)}
        </span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            STATUS_BADGE[p.status] ?? STATUS_BADGE.created
          }`}
        >
          {p.status}
        </span>
        <span className="hidden w-24 shrink-0 text-right text-xs text-gray-400 sm:inline">
          {p.events.length > 0 ? `${p.events.length} steps` : 'no log'}
          {p.hasFailure && <span className="ml-1.5 text-red-500">●</span>}
        </span>
        <span className="hidden w-32 shrink-0 text-right text-xs text-gray-400 md:inline">
          {when(p.createdAt)}
        </span>
      </button>

      {open && (
        <div className="bg-gray-50/70 px-4 pb-4 pt-1">
          <dl className="mb-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-gray-400">Payment ID</dt>
              <dd className="truncate font-mono text-gray-700">{p.id}</dd>
            </div>
            <div>
              <dt className="text-gray-400">BOG order ID</dt>
              <dd className="truncate font-mono text-gray-700">{p.bogOrderId ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Created</dt>
              <dd className="text-gray-700">{when(p.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Last updated</dt>
              <dd className="text-gray-700">{when(p.updatedAt)}</dd>
            </div>
          </dl>

          {p.events.length === 0 ? (
            <p className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-500">
              No log entries. This payment predates payment logging, or it was made while the
              logger could not reach the database.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              {p.events.map((e) => (
                <EventItem key={e.id} e={e} />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

export default function PaymentsLog({
  rows,
  unmatched,
}: {
  rows: AdminPaymentRow[];
  unmatched: PaymentLogEvent[];
}) {
  const [query, setQuery] = useState('');
  const [failuresOnly, setFailuresOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (failuresOnly && !p.hasFailure && p.status !== 'failed') return false;
      if (!q) return true;
      return (
        (p.email ?? '').toLowerCase().includes(q) ||
        p.target.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.bogOrderId ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, query, failuresOnly]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, course, payment ID, BOG order ID…"
          className="min-h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal"
        />
        <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={failuresOnly}
            onChange={(e) => setFailuresOnly(e.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          Problems only
        </label>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white">
        <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Payments</h2>
          <span className="text-xs text-gray-400">
            {filtered.length} of {rows.length}
          </span>
        </header>
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">No payments match.</p>
        ) : (
          <ul>
            {filtered.map((p) => (
              <PaymentItem key={p.id} p={p} />
            ))}
          </ul>
        )}
      </section>

      {unmatched.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-white">
          <header className="border-b border-amber-100 bg-amber-50/60 px-4 py-3">
            <h2 className="text-sm font-semibold text-amber-900">
              Unmatched events ({unmatched.length})
            </h2>
            <p className="mt-0.5 text-xs text-amber-700">
              Traffic we could not tie to a payment — a webhook whose signature failed
              verification, or one naming an order with no matching row. Worth a look if a
              customer says they paid and nothing happened.
            </p>
          </header>
          <ul>
            {unmatched.map((e) => (
              <EventItem key={e.id} e={e} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
