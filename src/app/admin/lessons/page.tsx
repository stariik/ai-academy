'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Lesson } from '@/types';

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lessons');
      const data: Lesson[] = await res.json();
      setLessons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const toggleStatus = async (lesson: Lesson) => {
    const newStatus = lesson.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchLessons();
    } catch (err) {
      console.error('Failed to update lesson:', err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? Its pages, content, and quiz questions are permanently removed.`))
      return;
    try {
      const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' });
      if (res.ok) fetchLessons();
    } catch (err) {
      console.error('Failed to delete lesson:', err);
    }
  };

  const counts = useMemo(() => {
    const published = lessons.filter((l) => l.status === 'published').length;
    return { published, draft: lessons.length - published };
  }, [lessons]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (q && !l.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [lessons, query, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lessons</h1>
        <p className="mt-1 text-sm text-gray-500">
          {lessons.length} total · {counts.published} published · {counts.draft} draft
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lessons…"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100 sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <span className="text-xs text-gray-400 sm:ml-auto">{rows.length} shown</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-100 border-t-navy" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-sm text-gray-400">
          {lessons.length === 0
            ? 'No lessons yet — generate your first course from the Course generator.'
            : 'No lessons match.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Difficulty</th>
                <th className="px-3 py-2.5">Created</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lesson) => (
                <tr key={lesson.id} className="border-t border-gray-100">
                  <td className="max-w-sm px-4 py-3">
                    <p className="truncate font-medium text-gray-900">{lesson.title}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        lesson.status === 'published'
                          ? 'bg-teal-50 text-teal'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {lesson.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 capitalize text-gray-600">{lesson.difficulty}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">
                    {new Date(lesson.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/lessons/${lesson.id}/edit`}
                        className="rounded-lg bg-navy px-2.5 py-1 text-xs font-medium text-white transition hover:bg-navy-light"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/ka/lessons/${lesson.id}`}
                        target="_blank"
                        className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => toggleStatus(lesson)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                          lesson.status === 'published'
                            ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            : 'border-teal/30 bg-teal-50 text-teal hover:bg-teal-100'
                        }`}
                      >
                        {lesson.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id, lesson.title)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
