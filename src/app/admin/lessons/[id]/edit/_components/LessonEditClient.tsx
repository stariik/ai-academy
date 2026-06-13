'use client';

// ============================================================
// /admin/lessons/[id]/edit — client editor
//
// Three editable sections:
//   1) Lesson metadata — title / titleEn / description / descriptionEn /
//      summary / difficulty / duration / learning objectives (ka+en) /
//      key concepts / tags. Save-on-button.
//   2) Pages — ordered list with bilingual titles + reorder + expand to
//      reveal the block editor.
//   3) Content blocks (per page) — type dropdown + content (ka) +
//      content_en, reorder up/down, delete, add-block.
//
// State of truth: after every save we refetch the lesson via
// GET /api/lessons/[id] so local state can't drift from the DB.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Lesson, LessonPage, ContentBlock } from '@/types';
import { CATEGORIES } from '@/lib/constants/categories';

const BLOCK_TYPES: ContentBlock['type'][] = [
  'heading', 'text', 'key_concepts', 'code', 'callout', 'summary',
  'table', 'list', 'example', 'analogy', 'step_by_step',
  'diagram_description', 'definition', 'warning', 'tip', 'quote',
];

const DIFFICULTY_OPTIONS: Lesson['difficulty'][] = ['beginner', 'intermediate', 'advanced'];

export default function LessonEditClient({ initialLesson }: { initialLesson: Lesson }) {
  const [lesson, setLesson] = useState<Lesson>(initialLesson);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/lessons/${initialLesson.id}`);
      if (!res.ok) throw new Error('reload_failed');
      const data: Lesson = await res.json();
      setLesson(data);
    } catch {
      setError('Failed to reload lesson.');
    }
  }, [initialLesson.id]);

  return (
    <div>
      <div className="max-w-4xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/admin/lessons" className="text-xs font-semibold text-teal hover:text-navy">
              ← All lessons
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{lesson.title}</h1>
            <p className="text-xs text-gray-500 font-mono">{lesson.id}</p>
          </div>
          {lesson.courseId && (
            <Link
              href={`/admin/courses/${lesson.courseId}`}
              className="text-xs text-gray-500 hover:text-navy underline decoration-dotted"
            >
              Manage course →
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <LessonMetadataCard
          lesson={lesson}
          busy={busy}
          setBusy={setBusy}
          setError={setError}
          onSaved={reload}
        />

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Pages ({lesson.pages?.length ?? 0})
          </h2>
          {!lesson.pages || lesson.pages.length === 0 ? (
            <p className="text-sm text-gray-500">This lesson has no pages.</p>
          ) : (
            <div className="space-y-3">
              {lesson.pages.map((page, idx) => (
                <PageEditor
                  key={page.id}
                  lessonId={lesson.id}
                  page={page}
                  index={idx}
                  total={lesson.pages!.length}
                  busy={busy}
                  setBusy={setBusy}
                  setError={setError}
                  onSaved={reload}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Lesson metadata
   ============================================================ */

function LessonMetadataCard({
  lesson,
  busy,
  setBusy,
  setError,
  onSaved,
}: {
  lesson: Lesson;
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (s: string | null) => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [titleEn, setTitleEn] = useState(lesson.titleEn ?? '');
  const [description, setDescription] = useState(lesson.description);
  const [descriptionEn, setDescriptionEn] = useState(lesson.descriptionEn ?? '');
  const [summary, setSummary] = useState(lesson.summary);
  const [difficulty, setDifficulty] = useState<Lesson['difficulty']>(lesson.difficulty);
  const [duration, setDuration] = useState<number>(lesson.estimatedDurationMinutes);
  const [tags, setTags] = useState<string[]>(lesson.tags ?? []);
  const [objectives, setObjectives] = useState<string[]>(lesson.learningObjectives);
  const [objectivesEn, setObjectivesEn] = useState<string[]>(lesson.learningObjectivesEn ?? []);
  const [concepts, setConcepts] = useState<{ term: string; definition: string }[]>(lesson.keyConcepts);
  const [saved, setSaved] = useState(false);

  // Re-seed when the parent reloads (e.g. after page reorder).
  useEffect(() => {
    setTitle(lesson.title);
    setTitleEn(lesson.titleEn ?? '');
    setDescription(lesson.description);
    setDescriptionEn(lesson.descriptionEn ?? '');
    setSummary(lesson.summary);
    setDifficulty(lesson.difficulty);
    setDuration(lesson.estimatedDurationMinutes);
    setTags(lesson.tags ?? []);
    setObjectives(lesson.learningObjectives);
    setObjectivesEn(lesson.learningObjectivesEn ?? []);
    setConcepts(lesson.keyConcepts);
  }, [lesson]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          titleEn: titleEn.trim() || null,
          description: description.trim(),
          descriptionEn: descriptionEn.trim() || null,
          summary: summary.trim(),
          difficulty,
          estimatedDurationMinutes: Math.max(1, Math.floor(duration || 1)),
          tags,
          learningObjectives: objectives.filter((o) => o.trim().length > 0),
          learningObjectivesEn: objectivesEn.filter((o) => o.trim().length > 0),
          keyConcepts: concepts.filter((c) => c.term.trim().length > 0),
        }),
      });
      if (!res.ok) throw new Error('save_failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      await onSaved();
    } catch {
      setError('Failed to save lesson metadata.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Lesson metadata</h2>

      <BilingualTextField
        label="Title"
        valueKa={title}
        valueEn={titleEn}
        onChangeKa={setTitle}
        onChangeEn={setTitleEn}
      />
      <BilingualTextArea
        label="Description"
        valueKa={description}
        valueEn={descriptionEn}
        onChangeKa={setDescription}
        onChangeEn={setDescriptionEn}
        rows={2}
      />
      <Field label="Summary">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Difficulty">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Lesson['difficulty'])}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Duration (minutes)">
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="Categories">
        <CategoryPicker selected={tags} onChange={setTags} />
      </Field>

      <RepeatableList
        label="Learning objectives (ქართული)"
        values={objectives}
        onChange={setObjectives}
        placeholder="What the student will learn"
      />
      <RepeatableList
        label="Learning objectives (English)"
        values={objectivesEn}
        onChange={setObjectivesEn}
        placeholder="What the student will learn"
      />

      <ConceptsEditor concepts={concepts} onChange={setConcepts} />

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="px-4 py-2 text-sm bg-navy text-white rounded-lg hover:bg-navy-light font-medium disabled:bg-gray-300 transition"
        >
          {busy ? 'Saving…' : 'Save lesson metadata'}
        </button>
        {saved && <span className="text-xs text-green-600 font-semibold">✓ Saved</span>}
      </div>
    </div>
  );
}

/* ============================================================
   Single page editor (collapsed by default)
   ============================================================ */

function PageEditor({
  lessonId,
  page,
  index,
  total,
  busy,
  setBusy,
  setError,
  onSaved,
}: {
  lessonId: string;
  page: LessonPage;
  index: number;
  total: number;
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (s: string | null) => void;
  onSaved: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [titleEn, setTitleEn] = useState(page.titleEn ?? '');
  const [concepts, setConcepts] = useState<{ term: string; definition: string }[]>(page.keyConcepts);
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => {
    setTitle(page.title);
    setTitleEn(page.titleEn ?? '');
    setConcepts(page.keyConcepts);
  }, [page]);

  const savePage = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lesson-pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          titleEn: titleEn.trim() || null,
          keyConcepts: concepts.filter((c) => c.term.trim().length > 0),
        }),
      });
      if (!res.ok) throw new Error('save_failed');
      setSavedFlag(true);
      setTimeout(() => setSavedFlag(false), 1500);
      await onSaved();
    } catch {
      setError('Failed to save page.');
    } finally {
      setBusy(false);
    }
  };

  const movePage = async (direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= total) return;
    setBusy(true);
    setError(null);
    try {
      // Build the new order from the rendered list — we know index/total
      // here, the rest of the reorder is handled by the parent's reload.
      const orderRes = await fetch(`/api/lessons/${lessonId}`);
      if (!orderRes.ok) throw new Error('fetch_failed');
      const fresh: Lesson = await orderRes.json();
      const pages = (fresh.pages ?? []).sort((a, b) => a.pageNumber - b.pageNumber);
      const ids = pages.map((p) => p.id);
      [ids[index], ids[swapIdx]] = [ids[swapIdx], ids[index]];
      const order = ids.map((id, i) => ({ id, pageNumber: i + 1 }));

      const res = await fetch(`/api/lessons/${lessonId}/pages/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) throw new Error('reorder_failed');
      await onSaved();
    } catch {
      setError('Failed to reorder page.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 w-7 h-7 rounded-full bg-teal-50 text-teal text-xs font-bold flex items-center justify-center">
            {page.pageNumber}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{page.title}</p>
            {page.titleEn && <p className="text-xs text-gray-500 truncate">{page.titleEn}</p>}
            <p className="text-xs text-gray-400">{page.contentBlocks.length} blocks</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => movePage('up')}
            disabled={busy || index === 0}
            className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => movePage('down')}
            disabled={busy || index === total - 1}
            className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="px-3 py-1 text-xs bg-navy text-white rounded hover:bg-navy-light font-medium"
          >
            {expanded ? 'Collapse' : 'Edit'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          <BilingualTextField
            label="Page title"
            valueKa={title}
            valueEn={titleEn}
            onChangeKa={setTitle}
            onChangeEn={setTitleEn}
          />

          <ConceptsEditor concepts={concepts} onChange={setConcepts} />

          <div className="flex items-center gap-3">
            <button
              onClick={savePage}
              disabled={busy}
              className="px-3 py-1.5 text-xs bg-navy text-white rounded hover:bg-navy-light font-medium disabled:bg-gray-300"
            >
              {busy ? 'Saving…' : 'Save page'}
            </button>
            {savedFlag && <span className="text-xs text-green-600 font-semibold">✓ Saved</span>}
          </div>

          <hr className="border-gray-100" />

          <BlocksEditor
            lessonId={lessonId}
            page={page}
            busy={busy}
            setBusy={setBusy}
            setError={setError}
            onSaved={onSaved}
          />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Content blocks editor
   ============================================================ */

function BlocksEditor({
  lessonId,
  page,
  busy,
  setBusy,
  setError,
  onSaved,
}: {
  lessonId: string;
  page: LessonPage;
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (s: string | null) => void;
  onSaved: () => Promise<void>;
}) {
  const ordered = [...page.contentBlocks].sort((a, b) => a.order - b.order);

  const moveBlock = async (idx: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ordered.length) return;
    setBusy(true);
    setError(null);
    try {
      const ids = ordered.map((b) => b.id);
      [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
      const order = ids.map((id, i) => ({ id, order: i }));
      const res = await fetch(`/api/lesson-pages/${page.id}/blocks/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) throw new Error('reorder_failed');
      await onSaved();
    } catch {
      setError('Failed to reorder blocks.');
    } finally {
      setBusy(false);
    }
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('Delete this block? This cannot be undone.')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/content-blocks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete_failed');
      await onSaved();
    } catch {
      setError('Failed to delete block.');
    } finally {
      setBusy(false);
    }
  };

  const addBlock = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/content-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          pageId: page.id,
          type: 'text',
          content: '',
          contentEn: null,
          order: ordered.length,
        }),
      });
      if (!res.ok) throw new Error('create_failed');
      await onSaved();
    } catch {
      setError('Failed to add block.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
        Content blocks
      </h4>
      <div className="space-y-3">
        {ordered.length === 0 ? (
          <p className="text-sm text-gray-500">No blocks yet. Add one below.</p>
        ) : (
          ordered.map((block, idx) => (
            <BlockEditor
              key={block.id}
              block={block}
              index={idx}
              total={ordered.length}
              busy={busy}
              setBusy={setBusy}
              setError={setError}
              onMoveUp={() => moveBlock(idx, 'up')}
              onMoveDown={() => moveBlock(idx, 'down')}
              onDelete={() => deleteBlock(block.id)}
              onSaved={onSaved}
            />
          ))
        )}
      </div>
      <button
        onClick={addBlock}
        disabled={busy}
        className="mt-3 px-3 py-1.5 text-xs bg-teal text-white rounded hover:opacity-90 font-medium disabled:bg-gray-300"
      >
        + Add block
      </button>
    </div>
  );
}

function BlockEditor({
  block,
  index,
  total,
  busy,
  setBusy,
  setError,
  onMoveUp,
  onMoveDown,
  onDelete,
  onSaved,
}: {
  block: ContentBlock;
  index: number;
  total: number;
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (s: string | null) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onSaved: () => Promise<void>;
}) {
  const [type, setType] = useState<ContentBlock['type']>(block.type);
  const [content, setContent] = useState(block.content);
  const [contentEn, setContentEn] = useState(block.contentEn ?? '');
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => {
    setType(block.type);
    setContent(block.content);
    setContentEn(block.contentEn ?? '');
  }, [block]);

  const dirty =
    type !== block.type ||
    content !== block.content ||
    (contentEn || '') !== (block.contentEn ?? '');

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/content-blocks/${block.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          content,
          contentEn: contentEn.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('save_failed');
      setSavedFlag(true);
      setTimeout(() => setSavedFlag(false), 1500);
      await onSaved();
    } catch {
      setError('Failed to save block.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono w-6">{index + 1}.</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ContentBlock['type'])}
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
          >
            {BLOCK_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={busy || index === 0}
            className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Move up"
          >↑</button>
          <button
            onClick={onMoveDown}
            disabled={busy || index === total - 1}
            className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Move down"
          >↓</button>
          <button
            onClick={onDelete}
            disabled={busy}
            className="px-2 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 disabled:opacity-30"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
            ქართული
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={Math.min(8, Math.max(2, content.split('\n').length))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
            English
          </label>
          <textarea
            value={contentEn}
            onChange={(e) => setContentEn(e.target.value)}
            rows={Math.min(8, Math.max(2, (contentEn || '').split('\n').length))}
            placeholder="Translation — leave blank to fall back to Georgian"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono text-gray-700"
          />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="px-3 py-1 text-xs bg-navy text-white rounded hover:bg-navy-light font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {busy ? 'Saving…' : dirty ? 'Save block' : 'Saved'}
        </button>
        {savedFlag && <span className="text-xs text-green-600 font-semibold">✓ Saved</span>}
      </div>
    </div>
  );
}

/* ============================================================
   Reusable bits
   ============================================================ */

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function BilingualTextField({
  label,
  valueKa,
  valueEn,
  onChangeKa,
  onChangeEn,
}: {
  label: string;
  valueKa: string;
  valueEn: string;
  onChangeKa: (v: string) => void;
  onChangeEn: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="space-y-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400">ქართული</span>
          <input
            value={valueKa}
            onChange={(e) => onChangeKa(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400">English</span>
          <input
            value={valueEn}
            onChange={(e) => onChangeEn(e.target.value)}
            placeholder="Optional translation"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}

function BilingualTextArea({
  label,
  valueKa,
  valueEn,
  onChangeKa,
  onChangeEn,
  rows = 3,
}: {
  label: string;
  valueKa: string;
  valueEn: string;
  onChangeKa: (v: string) => void;
  onChangeEn: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="space-y-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400">ქართული</span>
          <textarea
            value={valueKa}
            onChange={(e) => onChangeKa(e.target.value)}
            rows={rows}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400">English</span>
          <textarea
            value={valueEn}
            onChange={(e) => onChangeEn(e.target.value)}
            rows={rows}
            placeholder="Optional translation"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}

function RepeatableList({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={v}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-500 hover:bg-gray-50"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ''])}
          className="text-xs text-teal hover:text-navy font-medium"
        >
          + Add row
        </button>
      </div>
    </div>
  );
}

function ConceptsEditor({
  concepts,
  onChange,
}: {
  concepts: { term: string; definition: string }[];
  onChange: (next: { term: string; definition: string }[]) => void;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">Key concepts</label>
      <div className="space-y-2">
        {concepts.map((c, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
            <input
              value={c.term}
              onChange={(e) => {
                const next = [...concepts];
                next[i] = { ...next[i], term: e.target.value };
                onChange(next);
              }}
              placeholder="Term"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={c.definition}
              onChange={(e) => {
                const next = [...concepts];
                next[i] = { ...next[i], definition: e.target.value };
                onChange(next);
              }}
              placeholder="Definition"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(concepts.filter((_, j) => j !== i))}
              className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-500 hover:bg-gray-50"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...concepts, { term: '', definition: '' }])}
          className="text-xs text-teal hover:text-navy font-medium"
        >
          + Add concept
        </button>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {CATEGORIES.map((category) => {
        const checked = selected.includes(category);
        return (
          <label
            key={category}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${
              checked
                ? 'border-teal bg-teal-50 text-navy'
                : 'border-gray-200 bg-white text-gray-700 hover:border-teal/50'
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(category)}
              className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal mt-0.5"
            />
            <span className="font-medium leading-snug">{category}</span>
          </label>
        );
      })}
    </div>
  );
}
