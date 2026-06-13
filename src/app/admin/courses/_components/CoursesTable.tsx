'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AdminCourseListItem } from '@/lib/admin/queries';
import { CATEGORIES } from '@/lib/constants/categories';

const fmtPrice = (cents: number | null) =>
  cents == null ? null : `₾${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

export default function CoursesTable({ courses }: { courses: AdminCourseListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (category === 'uncategorized' && c.tags.length > 0) return false;
      if (category !== 'all' && category !== 'uncategorized' && !c.tags.includes(category)) return false;
      if (q && !c.title.toLowerCase().includes(q) && !(c.titleEn ?? '').toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [courses, query, category]);

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"? Its lessons and all their content will be permanently deleted.`))
      return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
      else alert('Delete failed — you may not have permission.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses…"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100 sm:max-w-xs"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All categories</option>
          <option value="uncategorized">Uncategorized</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400 sm:ml-auto">{rows.length} shown</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-2.5">Course</th>
              <th className="px-3 py-2.5 text-right">Lessons</th>
              <th className="px-3 py-2.5 text-right">Enrolled</th>
              <th className="px-3 py-2.5 text-right">Active</th>
              <th className="px-3 py-2.5 text-right">Price</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  No courses match.
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const price = fmtPrice(c.priceCents);
              const draft = c.lessonsTotal - c.lessonsPublished;
              return (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/courses/${c.id}`)}
                  className="cursor-pointer border-t border-gray-100 transition hover:bg-teal-50/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.tags.length === 0 ? (
                        <span className="rounded-full border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          Uncategorized
                        </span>
                      ) : (
                        c.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-teal/20 bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal"
                          >
                            {t}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {c.lessonsPublished}
                    {draft > 0 && (
                      <span className="text-xs text-amber-600"> +{draft} draft</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.enrollments || '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-500">
                    {c.studentsActive || '—'}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {price ? (
                      <span className="font-semibold tabular-nums text-gray-900">{price}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/courses/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        Manage
                      </Link>
                      <button
                        onClick={(e) => handleDelete(e, c.id, c.title)}
                        disabled={deleting === c.id}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                      >
                        {deleting === c.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
