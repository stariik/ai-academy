'use client';

import { useMemo, useState } from 'react';
import type { AdminLead } from '@/lib/admin/queries';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });

function toCsv(rows: AdminLead[]): string {
  const header = [
    'created_at',
    'email',
    'phone',
    'age_group',
    'topics',
    'utm_source',
    'utm_medium',
    'utm_campaign',
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.createdAt,
      r.email ?? '',
      r.phone ?? '',
      r.ageGroup,
      r.topics.join('; '),
      r.utmSource ?? '',
      r.utmMedium ?? '',
      r.utmCampaign ?? '',
    ]
      .map((v) => escape(String(v)))
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export default function LeadsTable({ leads }: { leads: AdminLead[] }) {
  const [query, setQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');

  const ageGroups = useMemo(
    () => Array.from(new Set(leads.map((l) => l.ageGroup))).sort(),
    [leads],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (ageFilter !== 'all' && l.ageGroup !== ageFilter) return false;
      if (!q) return true;
      return (
        (l.email ?? '').toLowerCase().includes(q) ||
        (l.phone ?? '').toLowerCase().includes(q) ||
        l.topics.some((t) => t.toLowerCase().includes(q)) ||
        (l.utmCampaign ?? '').toLowerCase().includes(q)
      );
    });
  }, [leads, query, ageFilter]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, phone, topic, campaign…"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100 sm:max-w-xs"
        />
        <select
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All age groups</option>
          {ageGroups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3 sm:ml-auto">
          <span className="text-xs text-gray-400">{rows.length} shown</span>
          <button
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-2.5">Contact</th>
              <th className="px-3 py-2.5">Age</th>
              <th className="px-3 py-2.5">Topics</th>
              <th className="px-3 py-2.5">Source</th>
              <th className="px-4 py-2.5 text-right">Captured</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  No leads match.
                </td>
              </tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  {l.email && <p className="font-medium text-gray-900">{l.email}</p>}
                  {l.phone && <p className="text-xs text-gray-500">{l.phone}</p>}
                  {!l.email && !l.phone && <span className="text-gray-400">—</span>}
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                    {l.ageGroup}
                  </span>
                </td>
                <td className="max-w-xs px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {l.topics.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-teal/20 bg-teal-50 px-1.5 py-0.5 text-[11px] text-teal"
                      >
                        {t}
                      </span>
                    ))}
                    {l.topics.length > 4 && (
                      <span className="text-[11px] text-gray-400">+{l.topics.length - 4}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-gray-500">
                  {l.utmSource || l.utmCampaign ? (
                    <>
                      <p>{l.utmSource ?? '—'}</p>
                      {l.utmCampaign && <p className="text-gray-400">{l.utmCampaign}</p>}
                    </>
                  ) : (
                    <span className="text-gray-300">direct</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500">
                  {fmtDate(l.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
