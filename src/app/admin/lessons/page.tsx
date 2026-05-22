'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lesson } from '@/types';

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lessons');
      const data: Lesson[] = await res.json();
      setLessons(data);
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
      if (res.ok) {
        fetchLessons();
      }
    } catch (err) {
      console.error('Failed to update lesson:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLessons();
      }
    } catch (err) {
      console.error('Failed to delete lesson:', err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Delete ALL ${lessons.length} lessons? This cannot be undone.`)) return;
    if (!confirm('Are you sure? This will permanently delete all lessons and their content.')) return;
    try {
      const res = await fetch('/api/lessons', { method: 'DELETE' });
      if (res.ok) {
        fetchLessons();
      }
    } catch (err) {
      console.error('Failed to delete all lessons:', err);
    }
  };

  const btnStyle = (variant: 'default' | 'danger' | 'success' = 'default'): React.CSSProperties => ({
    padding: '0.3rem 0.7rem',
    fontSize: '0.75rem',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    background:
      variant === 'danger'
        ? 'var(--danger)'
        : variant === 'success'
          ? 'var(--success)'
          : 'var(--background)',
    color:
      variant === 'default' ? 'var(--foreground)' : '#ffffff',
    cursor: 'pointer',
  });

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Lessons</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {lessons.length > 0 && (
            <button
              onClick={handleDeleteAll}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                background: 'var(--danger)',
                color: '#ffffff',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Delete All ({lessons.length})
            </button>
          )}
          <Link
            href="/admin"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              background: 'var(--accent)',
              color: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Generate New Lesson
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : lessons.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--muted-foreground)',
          }}
        >
          <p>No lessons yet. Generate your first lesson from the Admin panel.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Title</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Difficulty</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr
                  key={lesson.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '0.6rem 0.75rem', maxWidth: '280px' }}>
                    <span style={{ fontWeight: 500 }}>{lesson.title}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background:
                          lesson.status === 'published'
                            ? 'var(--accent-light)'
                            : 'var(--muted)',
                        color:
                          lesson.status === 'published'
                            ? 'var(--accent)'
                            : 'var(--muted-foreground)',
                      }}
                    >
                      {lesson.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '0.6rem 0.75rem',
                      textTransform: 'capitalize',
                    }}
                  >
                    {lesson.difficulty}
                  </td>
                  <td
                    style={{
                      padding: '0.6rem 0.75rem',
                      color: 'var(--muted-foreground)',
                      fontSize: '0.8rem',
                    }}
                  >
                    {new Date(lesson.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Link
                        href={`/admin/lessons/${lesson.id}/edit`}
                        style={{
                          ...btnStyle('default'),
                          textDecoration: 'none',
                          display: 'inline-block',
                          fontWeight: 600,
                          color: 'var(--accent)',
                          borderColor: 'var(--accent)',
                        }}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/student/lesson/${lesson.id}`}
                        style={{
                          ...btnStyle('default'),
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        View
                      </Link>
                      <button
                        onClick={() => toggleStatus(lesson)}
                        style={btnStyle(lesson.status === 'published' ? 'default' : 'success')}
                      >
                        {lesson.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        style={btnStyle('danger')}
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
