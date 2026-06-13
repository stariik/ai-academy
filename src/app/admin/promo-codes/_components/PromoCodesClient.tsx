'use client';

// ============================================================
// /admin/promo-codes client — list, create, bulk-generate, copy.
// Visual language matches the rest of the admin area (gray-50 bg,
// white cards, navy/teal accents).
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Course } from '@/types';

type PromoFilter = 'all' | 'active' | 'expired' | 'exhausted' | 'inactive';
type PromoType = 'unlock' | 'percent_off' | 'amount_off';
type PromoStatus = 'active' | 'inactive' | 'expired' | 'exhausted';

type PromoCode = {
  id: string;
  code: string;
  type: PromoType;
  courseId: string | null;
  percentOff: number | null;
  amountOffCents: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  perUserLimit: number;
  expiresAt: string | null;
  isActive: boolean;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

function statusOf(p: PromoCode, now = new Date()): PromoStatus {
  if (!p.isActive) return 'inactive';
  if (p.expiresAt && new Date(p.expiresAt) < now) return 'expired';
  if (p.maxRedemptions !== null && p.redemptionCount >= p.maxRedemptions) return 'exhausted';
  return 'active';
}

const FILTER_LABELS: Record<PromoFilter, string> = {
  all: 'All',
  active: 'Active',
  expired: 'Expired',
  exhausted: 'Used up',
  inactive: 'Inactive',
};

export default function PromoCodesClient() {
  const [filter, setFilter] = useState<PromoFilter>('all');
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  const courseTitle = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((c) => map.set(c.id, c.title));
    return (id: string | null) => (id ? map.get(id) ?? '(unknown)' : 'Any course');
  }, [courses]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/promo-codes?filter=${filter}`);
      if (!res.ok) throw new Error(res.status === 403 ? 'You are not an admin.' : 'Failed to load');
      const data = await res.json();
      setCodes(data.codes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load codes');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((d) => setCourses(Array.isArray(d) ? d : []))
      .catch(() => setCourses([]));
  }, []);

  const handleDeactivate = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error('failed');
      reload();
    } catch {
      setError('Failed to update code');
    }
  };

  return (
    <div>
      <div>
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promo codes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Generate unlock codes for courses. Codes are case-insensitive on redemption.
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => { setShowCreate((s) => !s); setShowBulk(false); }}
            className="px-4 py-2 text-sm bg-navy text-white rounded-lg hover:bg-navy-light font-medium transition"
          >
            {showCreate ? 'Cancel' : '+ Generate one'}
          </button>
          <button
            onClick={() => { setShowBulk((s) => !s); setShowCreate(false); }}
            className="px-4 py-2 text-sm bg-teal text-white rounded-lg hover:opacity-90 font-medium transition"
          >
            {showBulk ? 'Cancel' : 'Bulk generate (CSV)'}
          </button>
        </div>

        {/* Create one */}
        {showCreate && (
          <CreateOneForm
            courses={courses}
            onCreated={() => { setShowCreate(false); reload(); }}
            onError={setError}
          />
        )}

        {/* Bulk generate */}
        {showBulk && (
          <BulkForm
            courses={courses}
            onCreated={() => { setShowBulk(false); reload(); }}
            onError={setError}
          />
        )}

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 my-5">
          {(Object.keys(FILTER_LABELS) as PromoFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-full border font-medium transition ${
                filter === f
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
          ) : codes.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No codes match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Redemptions</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {codes.map((c) => (
                    <PromoRow
                      key={c.id}
                      code={c}
                      courseTitle={courseTitle(c.courseId)}
                      onDeactivate={() => handleDeactivate(c.id, c.isActive)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Row
   ============================================================ */

function PromoRow({
  code,
  courseTitle,
  onDeactivate,
}: {
  code: PromoCode;
  courseTitle: string;
  onDeactivate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const status = statusOf(code);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const redemptionLabel =
    code.maxRedemptions == null
      ? `${code.redemptionCount} / ∞`
      : `${code.redemptionCount} / ${code.maxRedemptions}`;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <button
          onClick={copyToClipboard}
          className="font-mono text-xs sm:text-sm font-bold text-navy hover:text-teal transition"
          title="Click to copy"
        >
          {code.code}
          {copied && <span className="ml-2 text-[10px] text-green-600 font-sans font-medium">Copied!</span>}
        </button>
        {code.notes && (
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[20ch]" title={code.notes}>
            {code.notes}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-gray-700">{courseTitle}</td>
      <td className="px-4 py-3 font-mono text-xs tabular-nums">{redemptionLabel}</td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3">
        <StatusPill status={status} />
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <Link
          href={`/admin/promo-codes/${code.id}`}
          className="text-xs text-teal hover:text-navy mr-3"
        >
          Details
        </Link>
        <button
          onClick={onDeactivate}
          className="text-xs text-gray-500 hover:text-red-600"
        >
          {code.isActive ? 'Deactivate' : 'Reactivate'}
        </button>
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status: PromoStatus }) {
  const styles: Record<PromoStatus, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    expired: 'bg-amber-100 text-amber-700',
    exhausted: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

/* ============================================================
   Create one
   ============================================================ */

function CreateOneForm({
  courses,
  onCreated,
  onError,
}: {
  courses: Course[];
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [type, setType] = useState<PromoType>('unlock');
  const [customCode, setCustomCode] = useState('');
  const [courseId, setCourseId] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [percentOff, setPercentOff] = useState('');
  const [amountOff, setAmountOff] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type,
        courseId: courseId || null,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        notes: notes.trim() || null,
      };
      if (customCode.trim()) body.code = customCode.trim().toUpperCase();
      if (type === 'percent_off') body.percentOff = Number(percentOff);
      if (type === 'amount_off') body.amountOffCents = Math.round(Number(amountOff) * 100);

      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-3">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">New promo code</h3>

      {(type === 'percent_off' || type === 'amount_off') && (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          Discount codes are stored but cannot be redeemed yet — checkout isn&apos;t built.
          Use Unlock for now.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PromoType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="unlock">Unlock — free course access</option>
            <option value="percent_off">Percent off (requires checkout)</option>
            <option value="amount_off">Fixed amount off (requires checkout)</option>
          </select>
        </Field>

        <Field label="Course" hint={type === 'unlock' ? 'Leave blank to let the user pick' : undefined}>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Any course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </Field>

        <Field label="Custom code" hint="Leave blank to auto-generate (WALLI-XXXX-XXXX)">
          <input
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            placeholder="SUMMER2026"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-wider"
          />
        </Field>

        <Field label="Max redemptions" hint="Leave blank for unlimited">
          <input
            type="number"
            min={1}
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            placeholder="∞"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </Field>

        {type === 'percent_off' && (
          <Field label="Percent off (1–100)">
            <input
              type="number"
              min={1}
              max={100}
              value={percentOff}
              onChange={(e) => setPercentOff(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </Field>
        )}

        {type === 'amount_off' && (
          <Field label="Amount off (₾)">
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={amountOff}
              onChange={(e) => setAmountOff(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </Field>
        )}

        <Field label="Expires at" hint="Leave blank for no expiry">
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Notes (admin-only)" full>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Refund for ticket #1234"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={submit}
          disabled={submitting}
          className="px-4 py-2 text-sm bg-navy text-white rounded-lg hover:bg-navy-light font-medium disabled:bg-gray-300 transition"
        >
          {submitting ? 'Creating…' : 'Create code'}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Bulk
   ============================================================ */

function BulkForm({
  courses,
  onCreated,
  onError,
}: {
  courses: Course[];
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [count, setCount] = useState('25');
  const [courseId, setCourseId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/promo-codes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: Number(count),
          courseId: courseId || null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');

      // Download CSV
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promo-codes-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to bulk-generate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-3">
      <h3 className="text-sm font-semibold text-gray-800 mb-1">Bulk generate single-use codes</h3>
      <p className="text-xs text-gray-500 mb-3">
        Each code can be redeemed exactly once. CSV downloads automatically.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="How many codes? (1–1000)">
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Course" hint="Leave blank to let users pick">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Any course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </Field>

        <Field label="Expires at" hint="Leave blank for no expiry">
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Notes (admin-only)">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instagram giveaway"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={submit}
          disabled={submitting}
          className="px-4 py-2 text-sm bg-teal text-white rounded-lg hover:opacity-90 font-medium disabled:bg-gray-300 transition"
        >
          {submitting ? 'Generating…' : `Generate ${count} codes → CSV`}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Field wrapper
   ============================================================ */

function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
