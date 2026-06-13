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
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setCourse(data);
      setTitle(data.title ?? '');
      setTitleEn(data.titleEn ?? '');
      setDescription(data.description ?? '');
      setDescriptionEn(data.descriptionEn ?? '');
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
        body: JSON.stringify({
          title,
          titleEn: titleEn.trim() || null,
          description,
          descriptionEn: descriptionEn.trim() || null,
          tags,
        }),
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
    <div>
      <div className="max-w-4xl">
        <Link
          href="/admin/courses"
          className="text-xs font-semibold text-teal hover:text-navy mb-4 inline-block"
        >
          &larr; Back to Courses
        </Link>

        {/* Course header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Title — ქართული</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Title — English</label>
                <input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Optional translation"
                  className="w-full border rounded-lg px-3 py-2 text-lg text-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Description — ქართული</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Description — English</label>
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={2}
                  placeholder="Optional translation"
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700"
                />
              </div>
              <CategoryPicker selected={tags} onChange={setTags} />
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button onClick={handleSave} className="px-4 py-2 sm:py-1.5 text-sm bg-navy text-white rounded-lg hover:bg-navy-light">
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 sm:py-1.5 text-sm border rounded-lg text-gray-600">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                {course.description && (
                  <p className="text-gray-500 mt-1">{course.description}</p>
                )}
                <CategoryBadges tags={course.tags} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                <Link
                  href={`/admin/courses/${courseId}/preview`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded hover:bg-violet-100 hover:border-violet-300 transition"
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
                  className="px-3 py-2 sm:py-1.5 text-xs border rounded text-gray-600 hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <PricingCard
          courseId={courseId}
          priceCents={course.priceCents ?? null}
          retailPriceCents={course.retailPriceCents ?? null}
          onSaved={fetchCourse}
        />

        {/* Course Lessons */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Lessons ({course.lessons.length})
            </h2>
            {course.lessons.some(l => l.status !== 'published') && (
              <button
                onClick={publishAll}
                className="px-4 py-2 sm:py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
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
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-gray-100 rounded-lg p-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
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
                  <div className="grid grid-cols-3 gap-1 sm:flex sm:shrink-0">
                    <Link
                      href={`/admin/lessons/${lesson.id}/edit`}
                      className="text-center px-2 py-1 text-xs bg-navy text-white rounded hover:bg-navy-light font-medium"
                    >
                      Edit
                    </Link>
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
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Lessons
            </h2>
            <div className="space-y-2">
              {availableLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-gray-100 rounded-lg p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-xs text-gray-500">
                      {lesson.difficulty} &middot; {lesson.status}
                    </p>
                  </div>
                  <button
                    onClick={() => addLesson(lesson.id)}
                    className="px-3 py-2 sm:py-1.5 text-xs bg-navy text-white rounded hover:bg-navy-light"
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

function PricingCard({
  courseId,
  priceCents,
  retailPriceCents,
  onSaved,
}: {
  courseId: string;
  priceCents: number | null;
  retailPriceCents: number | null;
  onSaved: () => void;
}) {
  // Edit in whole ₾ (lari); convert to/from tetri at the API boundary.
  const toGel = (cents: number | null) => (cents == null ? '' : String(cents / 100));
  const [price, setPrice] = useState(toGel(priceCents));
  const [retail, setRetail] = useState(toGel(retailPriceCents));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep inputs in sync if the parent refetches.
  useEffect(() => {
    setPrice(toGel(priceCents));
    setRetail(toGel(retailPriceCents));
  }, [priceCents, retailPriceCents]);

  const toCents = (gel: string): number | null => {
    const t = gel.trim();
    if (t === '') return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) return NaN as unknown as number;
    return Math.round(n * 100);
  };

  const save = async () => {
    const priceC = toCents(price);
    const retailC = toCents(retail);
    if (Number.isNaN(priceC) || Number.isNaN(retailC)) {
      setError('Enter a valid number, or leave blank for free.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceCents: priceC, retailPriceCents: retailC }),
      });
      if (!res.ok) throw new Error('save_failed');
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Save failed — check your permissions and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Shown on the storefront in ₾. Leave price blank to list the course as free.
          </p>
        </div>
        {saved && <span className="text-xs font-medium text-teal">Saved ✓</span>}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[160px_160px_1fr] sm:items-end">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
            Price (₾)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Free"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
            Retail / strike-through (₾)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={retail}
            onChange={(e) => setRetail(e.target.value)}
            placeholder="Optional"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm bg-navy text-white rounded-lg hover:bg-navy-light disabled:bg-gray-300 sm:w-auto"
        >
          {saving ? 'Saving…' : 'Save pricing'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {CATEGORIES.map((category) => {
          const checked = selected.includes(category);
          return (
            <label
              key={category}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition ${
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
              <span className="font-medium leading-snug">{category}</span>
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
