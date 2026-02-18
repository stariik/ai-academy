'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Course } from '@/types';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setShowCreate(false);
        fetchCourses();
      }
    } catch (err) {
      console.error('Failed to create course:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course? Lessons will be unlinked but not deleted.')) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCourses();
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
            <p className="text-sm text-gray-500 mt-1">
              Organize lessons into structured courses
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Admin
            </Link>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showCreate ? 'Cancel' : 'New Course'}
            </button>
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-gray-200 rounded-lg p-6 mb-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Introduction to Machine Learning"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Brief description of the course..."
              />
            </div>
            <button
              type="submit"
              disabled={!title.trim() || creating}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Course'}
            </button>
          </form>
        )}

        {/* Course list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-1">No courses yet</p>
            <p className="text-sm">Create a course to organize your lessons.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {course.title}
                  </Link>
                  {course.description && (
                    <p className="text-sm text-gray-500 mt-1 truncate">{course.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Created {new Date(course.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                  >
                    Manage
                  </Link>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
