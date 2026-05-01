'use client';

import { useCallback, useEffect, useState, use } from 'react';
import Link from 'next/link';
import type { Course, Lesson } from '@/types';
import { CATEGORIES } from '@/lib/constants/categories';

type CourseWithLessons = Course & { lessons: Lesson[] };

export default function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setCourse(data);
      setTitle(data.title);
      setDescription(data.description);
      setTags(Array.isArray(data.tags) ? data.tags : []);
    } catch {
      setCourse(null);
    }
  }, [courseId]);

  const fetchAllLessons = useCallback(async () => {
    try {
      const res = await fetch('/api/lessons');
      const data = await res.json();
      setAllLessons(Array.isArray(data) ? data : []);
    } catch {
      setAllLessons([]);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchCourse(), fetchAllLessons()]).finally(() =>
      setLoading(false)
    );
  }, [courseId, fetchCourse, fetchAllLessons]);

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, tags }),
      });
      if (res.ok) {
        setEditing(false);
        fetchCourse();
      }
    } catch (err) {
      console.error('Failed to update course:', err);
    }
  };

  const addLesson = async (lessonId: string) => {
    const currentLessons = course?.lessons ?? [];
    const nextPosition = currentLessons.length;
    try {
      await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, positionInCourse: nextPosition }),
      });
      fetchCourse();
    } catch (err) {
      console.error('Failed to add lesson:', err);
    }
  };

  const removeLesson = async (lessonId: string) => {
    try {
      await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: null, positionInCourse: null }),
      });
      fetchCourse();
    } catch (err) {
      console.error('Failed to remove lesson:', err);
    }
  };

  const togglePublish = async (lessonId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchCourse();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const publishAll = async () => {
    if (!course) return;
    const drafts = course.lessons.filter(l => l.status !== 'published');
    if (drafts.length === 0) return;
    try {
      await Promise.all(
        drafts.map(l =>
          fetch(`/api/lessons/${l.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'published' }),
          })
        )
      );
      fetchCourse();
    } catch (err) {
      console.error('Failed to publish all:', err);
    }
  };

  const moveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    if (!course) return;
    const lessons = [...course.lessons];
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;

    // Swap positions
    try {
      await Promise.all([
        fetch(`/api/lessons/${lessons[idx].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positionInCourse: swapIdx }),
        }),
        fetch(`/api/lessons/${lessons[swapIdx].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positionInCourse: idx }),
        }),
      ]);
      fetchCourse();
    } catch (err) {
      console.error('Failed to reorder:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 border-4 border-navy-100 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-900">Course not found</h2>
        <Link href="/admin/courses" className="text-teal mt-2 inline-block">
          Back to courses
        </Link>
      </div>
    );
  }

  // Available lessons = all lessons not already in this course
  const courselesionIds = new Set(course.lessons.map((l) => l.id));
  const availableLessons = allLessons.filter((l) => !courselesionIds.has(l.id));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/courses"
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          &larr; Back to Courses
        </Link>

        {/* Course header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          {editing ? (
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-lg font-bold"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <CategoryPicker selected={tags} onChange={setTags} />
              <div className="flex gap-2">
                <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-navy text-white rounded-lg hover:bg-navy-light">
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-1.5 text-sm border rounded-lg text-gray-600">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                {course.description && (
                  <p className="text-gray-500 mt-1">{course.description}</p>
                )}
                <CategoryBadges tags={course.tags} />
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/courses/${courseId}/preview`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded hover:bg-violet-100 hover:border-violet-300 transition"
                  title="Read the full course content end-to-end"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Read full course
                </Link>
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 text-xs border rounded text-gray-600 hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Course Lessons */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Lessons ({course.lessons.length})
            </h2>
            {course.lessons.some(l => l.status !== 'published') && (
              <button
                onClick={publishAll}
                className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Publish All
              </button>
            )}
          </div>
          {course.lessons.length === 0 ? (
            <p className="text-sm text-gray-500">No lessons in this course yet. Add lessons below.</p>
          ) : (
            <div className="space-y-2">
              {course.lessons.map((lesson, i) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 w-6">
                      {i + 1}.
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                      <p className="text-xs text-gray-500">
                        {lesson.difficulty} &middot; {lesson.estimatedDurationMinutes} min
                        &middot; {lesson.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => togglePublish(lesson.id, lesson.status)}
                      className={`px-2 py-1 text-xs rounded ${
                        lesson.status === 'published'
                          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                      }`}
                    >
                      {lesson.status === 'published' ? 'Published' : 'Publish'}
                    </button>
                    <button
                      onClick={() => moveLesson(lesson.id, 'up')}
                      disabled={i === 0}
                      className="px-2 py-1 text-xs border rounded text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                    >
                      &uarr;
                    </button>
                    <button
                      onClick={() => moveLesson(lesson.id, 'down')}
                      disabled={i === course.lessons.length - 1}
                      className="px-2 py-1 text-xs border rounded text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                    >
                      &darr;
                    </button>
                    <button
                      onClick={() => removeLesson(lesson.id)}
                      className="px-2 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add lessons */}
        {availableLessons.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Lessons
            </h2>
            <div className="space-y-2">
              {availableLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-xs text-gray-500">
                      {lesson.difficulty} &middot; {lesson.status}
                    </p>
                  </div>
                  <button
                    onClick={() => addLesson(lesson.id)}
                    className="px-3 py-1.5 text-xs bg-navy text-white rounded hover:bg-navy-light"
                  >
                    Add to Course
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const toggle = (category: string) => {
    onChange(
      selected.includes(category)
        ? selected.filter((tag) => tag !== category)
        : [...selected, category]
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">Categories</label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-gray-400 hover:text-red-500"
          >
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CATEGORIES.map((category) => {
          const checked = selected.includes(category);
          return (
            <label
              key={category}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${
                checked
                  ? 'border-teal bg-teal-50 text-navy'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-teal/50'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(category)}
                className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal"
              />
              <span className="font-medium">{category}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CategoryBadges({ tags }: { tags: string[] }) {
  if (!tags?.length) {
    return (
      <div className="mt-3 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-100">
        Uncategorized
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal border border-teal/20"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
