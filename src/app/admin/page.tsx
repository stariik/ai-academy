'use client';

// ============================================================
// Admin Page — Single Upload Method
// Full-course PDFs go through one pipeline:
//   - Drop 1 file → preview detected sections → edit → generate
//   - Drop N files → queue mode, auto-generate each in sequence
//   - Add more files while generating; the loop picks them up
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import type { CourseGenerationProgress } from '@/types';
import { CATEGORIES } from '@/lib/constants/categories';

type AdminStep = 'upload' | 'preview-sections' | 'generating' | 'complete';

type DetectedSection = {
  id: string;
  title: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
  preview: string;
};

type FullPdfJob = {
  id: string;
  file: File;
  name: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  courseId?: string;
  lessonsTotal?: number;
  lessonsDone?: number;
  error?: string;
  tags: string[];
  // When set, the queue processor skips the /api/analyze-outline call
  // and uses these pre-computed sections instead. Used by the
  // preview-sections single-file flow to preserve user edits (merges,
  // renames, deletes) without re-running outline detection.
  presetSections?: DetectedSection[];
  presetExtractedText?: string;
};

const newJobId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function AdminPage() {
  const [step, setStep] = useState<AdminStep>('upload');
  const [courseName, setCourseName] = useState('');
  const [selectedCourseTags, setSelectedCourseTags] = useState<string[]>([]);
  const [targetLevel, setTargetLevel] = useState('intermediate');
  const [error, setError] = useState<string | null>(null);
  const [courseGenProgress, setCourseGenProgress] = useState<CourseGenerationProgress | null>(null);

  // Single-file path: review sections before generating
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sections, setSections] = useState<DetectedSection[]>([]);
  const [detectingOutline, setDetectingOutline] = useState(false);
  const [totalWords, setTotalWords] = useState(0);
  const [extractedText, setExtractedText] = useState('');

  // Queue path: multi-file batch with add-while-running
  const fullPdfAbortRef = useRef<AbortController | null>(null);
  const [fullPdfRunning, setFullPdfRunning] = useState(false);
  const [provider, setProvider] = useState<'gemini' | 'claude'>('gemini');
  const [fullPdfJobs, setFullPdfJobs] = useState<FullPdfJob[]>([]);
  const [activeFullPdfId, setActiveFullPdfId] = useState<string | null>(null);
  const fullPdfJobsRef = useRef<FullPdfJob[]>([]);
  useEffect(() => {
    fullPdfJobsRef.current = fullPdfJobs;
  }, [fullPdfJobs]);

  // ---- Outline detection (single-file path) ----
  const detectOutline = useCallback(async (file: File) => {
    setDetectingOutline(true);
    setError(null);
    setSelectedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('provider', provider);

      const res = await fetch('/api/analyze-outline', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze document');

      setSections(data.sections);
      setTotalWords(data.totalWords);
      setExtractedText(data.extractedText || '');

      if (!courseName.trim()) {
        setCourseName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
      }

      setStep('preview-sections');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze document');
    } finally {
      setDetectingOutline(false);
    }
  }, [courseName, provider]);

  // ---- Section editing ----
  const mergeSections = (indexA: number, indexB: number) => {
    setSections(prev => {
      const next = [...prev];
      const a = next[indexA];
      const b = next[indexB];
      next[indexA] = {
        ...a,
        title: `${a.title} & ${b.title}`,
        endIndex: b.endIndex,
        wordCount: a.wordCount + b.wordCount,
        preview: a.preview,
      };
      next.splice(indexB, 1);
      return next;
    });
  };

  const deleteSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const renameSection = (index: number, newTitle: string) => {
    setSections(prev => {
      const next = [...prev];
      next[index] = { ...next[index], title: newTitle };
      return next;
    });
  };

  // ---- Queue generation (handles BOTH single-file preview and multi-file) ----
  const startFullPdfQueue = useCallback(async () => {
    if (fullPdfJobsRef.current.length === 0) {
      setError('Please upload at least one PDF.');
      return;
    }

    setError(null);
    setCourseGenProgress(null);
    setStep('generating');
    setFullPdfRunning(true);

    setFullPdfJobs(prev => prev.map(j =>
      j.status === 'queued' || j.status === 'running'
        ? { ...j, status: 'queued', courseId: undefined, error: undefined, lessonsTotal: undefined, lessonsDone: undefined }
        : j
    ));

    try {
      while (true) {
        const nextJob = fullPdfJobsRef.current.find(j => j.status === 'queued');
        if (!nextJob) break;

        const jobId = nextJob.id;
        setActiveFullPdfId(jobId);
        setCourseGenProgress(null);
        setFullPdfJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'running' } : j));

        const controller = new AbortController();
        fullPdfAbortRef.current = controller;
        let jobAborted = false;

        try {
          // If the user already previewed and edited sections (single-file
          // flow), use those directly. Otherwise run outline detection.
          let detectedSections: DetectedSection[];
          let extractedTextForJob: string;

          if (nextJob.presetSections && nextJob.presetExtractedText != null) {
            detectedSections = nextJob.presetSections;
            extractedTextForJob = nextJob.presetExtractedText;
          } else {
            setCourseGenProgress({
              status: 'extracting_outline',
              totalLessons: 0,
              currentLesson: 0,
              currentLessonTitle: '',
              courseName: nextJob.name || nextJob.file.name,
              lessons: [],
            });

            const outlineForm = new FormData();
            outlineForm.append('file', nextJob.file);
            outlineForm.append('provider', provider);

            const outlineRes = await fetch('/api/analyze-outline', {
              method: 'POST',
              body: outlineForm,
              signal: controller.signal,
            });
            if (!outlineRes.ok) {
              const data = await outlineRes.json().catch(() => ({ error: 'Outline detection failed' }));
              throw new Error(data.error || 'Outline detection failed');
            }
            const outlineData = await outlineRes.json();
            detectedSections = outlineData.sections;
            extractedTextForJob = outlineData.extractedText || '';
          }

          if (!detectedSections || detectedSections.length === 0) {
            throw new Error('No sections detected in document.');
          }

          const createRes = await fetch('/api/analyze-course/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseName: nextJob.name.trim() || nextJob.file.name.replace(/\.[^.]+$/, ''),
              sections: detectedSections,
              tags: nextJob.tags,
            }),
            signal: controller.signal,
          });
          if (!createRes.ok) {
            const data = await createRes.json().catch(() => ({ error: 'Failed to create course' }));
            throw new Error(data.error || 'Failed to create course');
          }
          const { courseId, courseName: resolvedName } = await createRes.json();

          setFullPdfJobs(prev => prev.map(j => j.id === jobId ? {
            ...j,
            courseId,
            lessonsTotal: detectedSections.length,
            lessonsDone: 0,
          } : j));

          const totalLessons = detectedSections.length;
          const completedLessons: CourseGenerationProgress['lessons'] = [];
          const lessonSummaries: { position: number; title: string; summary: string; keyConcepts: string[] }[] = [];

          // Parallel batches of 3 — lessons inside a batch fire in parallel
          // and share the same previousContext (summaries of all prior
          // batches). Siblings in a batch don't reference each other —
          // acceptable tradeoff for 3× wall-clock speedup.
          const BATCH_SIZE = 3;
          for (let batchStart = 0; batchStart < totalLessons; batchStart += BATCH_SIZE) {
            if (controller.signal.aborted) {
              jobAborted = true;
              break;
            }
            const batchEnd = Math.min(batchStart + BATCH_SIZE, totalLessons);
            const batchIndexes = Array.from({ length: batchEnd - batchStart }, (_, k) => batchStart + k);

            const previousContext = lessonSummaries.length > 0
              ? `PREVIOUS LESSONS IN THIS COURSE (do NOT repeat their content — build on it, reference their concepts):\n${
                  lessonSummaries.map(s => {
                    const concepts = s.keyConcepts.length > 0 ? ` | Concepts taught: ${s.keyConcepts.join(', ')}` : '';
                    const short = s.summary.length > 200 ? s.summary.substring(0, 200) + '...' : s.summary;
                    return `Lesson ${s.position + 1} "${s.title}": ${short}${concepts}`;
                  }).join('\n')
                }`
              : '';

            setCourseGenProgress({
              status: 'generating_lesson',
              totalLessons,
              currentLesson: batchEnd,
              currentLessonTitle: batchIndexes.length > 1
                ? `${detectedSections[batchStart].title} (+${batchIndexes.length - 1} more in parallel)`
                : detectedSections[batchStart].title,
              courseId,
              courseName: resolvedName,
              lessons: completedLessons,
            });

            const batchResults = await Promise.all(batchIndexes.map(async (i) => {
              const section = detectedSections[i];
              const sectionText = extractedTextForJob.substring(section.startIndex, section.endIndex);
              try {
                const res = await fetch('/api/analyze-course/generate-lesson', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sectionText,
                    sectionTitle: section.title,
                    sectionIndex: i,
                    totalSections: totalLessons,
                    targetLevel,
                    courseId,
                    fileName: nextJob.file.name,
                    previousContext,
                    provider,
                  }),
                  signal: controller.signal,
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({ error: 'Lesson generation failed' }));
                  throw new Error(data.error || 'Lesson generation failed');
                }
                return { index: i, result: await res.json(), error: null as Error | null };
              } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                  return { index: i, result: null, error: err };
                }
                console.error(`[FullPdf] Lesson ${i + 1} failed:`, err);
                return { index: i, result: null, error: err instanceof Error ? err : new Error(String(err)) };
              }
            }));

            // If any sibling aborted, bail the whole job
            if (batchResults.some(r => r.error instanceof DOMException && r.error.name === 'AbortError')) {
              jobAborted = true;
              break;
            }

            for (const r of batchResults.sort((a, b) => a.index - b.index)) {
              if (r.result) {
                completedLessons.push({ id: r.result.id, title: r.result.title, pages: r.result.pages, position: r.index });
                lessonSummaries.push({
                  position: r.index,
                  title: r.result.title,
                  summary: r.result.summary || '',
                  keyConcepts: r.result.keyConcepts || [],
                });
              } else {
                completedLessons.push({ id: 'failed', title: `${detectedSections[r.index].title} (failed)`, pages: 0, position: r.index });
              }
            }

            setFullPdfJobs(prev => prev.map(j => j.id === jobId ? {
              ...j,
              lessonsDone: completedLessons.filter(l => l.id !== 'failed').length,
            } : j));

            if (batchEnd < totalLessons) {
              await new Promise(r => setTimeout(r, 1500));
            }
          }

          if (!jobAborted) {
            setCourseGenProgress({
              status: 'complete',
              totalLessons,
              currentLesson: totalLessons,
              currentLessonTitle: '',
              courseId,
              courseName: resolvedName,
              lessons: completedLessons,
            });
            setFullPdfJobs(prev => prev.map(j => j.id === jobId ? {
              ...j,
              status: 'complete',
              lessonsDone: completedLessons.filter(l => l.id !== 'failed').length,
            } : j));
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            jobAborted = true;
          } else {
            const message = err instanceof Error ? err.message : 'Failed to generate course.';
            setFullPdfJobs(prev => prev.map(j => j.id === jobId ? {
              ...j,
              status: 'failed',
              error: message,
            } : j));
          }
        } finally {
          if (fullPdfAbortRef.current === controller) {
            fullPdfAbortRef.current = null;
          }
        }

        if (jobAborted) return;
      }

      setActiveFullPdfId(null);
      setStep('complete');
    } finally {
      setFullPdfRunning(false);
    }
  }, [provider, targetLevel]);

  const stopFullPdfGeneration = useCallback(() => {
    const controller = fullPdfAbortRef.current;
    if (controller) {
      controller.abort();
      fullPdfAbortRef.current = null;
    }
    setFullPdfRunning(false);
    setCourseGenProgress(null);
    setActiveFullPdfId(null);
    setError(null);
    setStep('upload');
  }, []);

  // ---- Drop handler ----
  // 1 file + empty queue → preview-sections (review & edit).
  // Anything else → queue mode (skip preview, trust auto-detected sections).
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const shouldQueue = acceptedFiles.length > 1 || fullPdfJobsRef.current.length > 0;

      if (shouldQueue) {
        const newJobs: FullPdfJob[] = acceptedFiles.map(f => ({
          id: newJobId(),
          file: f,
          name: f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/^\d+\s*/, ''),
          status: 'queued',
          tags: selectedCourseTags,
        }));
        setFullPdfJobs(prev => [...prev, ...newJobs]);
        setError(null);
        return;
      }

      detectOutline(acceptedFiles[0]);
    },
    [detectOutline, selectedCourseTags]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md', '.markdown'],
    },
    multiple: true,
    maxSize: 25 * 1024 * 1024,
    disabled: detectingOutline || step === 'generating',
  });

  const resetAll = () => {
    setStep('upload');
    setCourseName('');
    setSelectedCourseTags([]);
    setError(null);
    setCourseGenProgress(null);
    setSections([]);
    setSelectedFile(null);
    setTotalWords(0);
    setExtractedText('');
    setFullPdfJobs([]);
    setActiveFullPdfId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Academy — Admin</h1>
          <p className="text-gray-600 mt-1">Upload a full-course PDF to generate lessons</p>
          <div className="flex gap-4 mt-2 flex-wrap">
            <Link href="/admin/lessons" className="text-teal hover:text-navy text-sm">View all lessons →</Link>
            <Link href="/admin/courses" className="text-teal hover:text-navy text-sm">Manage courses →</Link>
            <Link href="/admin/analytics" className="text-teal hover:text-navy text-sm">Analytics →</Link>
            <Link href="/admin/promo-codes" className="text-teal hover:text-navy text-sm">Promo codes →</Link>
          </div>
        </div>

        {/* ============================================================
            STEP: UPLOAD
            ============================================================ */}
        {step === 'upload' && (
          <div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="courseName" className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name <span className="text-gray-400 font-normal">(single-file mode; ignored for queue)</span>
                  </label>
                  <input
                    id="courseName"
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g., Prompt Engineering for Professionals"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">Target Level</label>
                  <select
                    id="level"
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <CategorySelect
                  value={selectedCourseTags[0] ?? ''}
                  onChange={(category) => setSelectedCourseTags(category ? [category] : [])}
                  label="Category"
                />
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Upload one PDF to review sections before generating. Upload multiple PDFs (or keep adding) to run them as a queue without per-file review.
              </p>
            </div>

            {/* Provider toggle */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider <span className="text-gray-400 font-normal">(detects sections + generates lessons)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvider('gemini')}
                  className={`text-left p-4 rounded-lg border-2 transition ${
                    provider === 'gemini'
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">Google Gemini</span>
                    {provider === 'gemini' && (
                      <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">SELECTED</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">gemini-2.5-flash · 65K output · fast &amp; cheap</p>
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('claude')}
                  className={`text-left p-4 rounded-lg border-2 transition ${
                    provider === 'claude'
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">Anthropic Claude</span>
                    {provider === 'claude' && (
                      <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">SELECTED</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">claude-sonnet-4-6 · 64K output · higher quality</p>
                </button>
              </div>
            </div>

            {detectingOutline ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <div className="inline-block h-10 w-10 border-4 border-navy-100 border-t-navy rounded-full animate-spin mb-4" />
                <p className="text-gray-900 font-medium">Analyzing document structure...</p>
                <p className="text-sm text-gray-500 mt-1">Detecting chapters and sections</p>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-teal bg-teal-50' :
                  fullPdfJobs.length > 0 ? 'border-green-300 bg-green-50/30' :
                  'border-gray-300 hover:border-gray-400 bg-white'
                }`}
              >
                <input {...getInputProps()} />
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                {isDragActive ? (
                  <p className="text-teal font-medium">Drop the file(s) here...</p>
                ) : fullPdfJobs.length > 0 ? (
                  <>
                    <p className="font-medium text-gray-700">Click or drop to add more files to the queue</p>
                    <p className="text-sm text-gray-400 mt-1">PDF, DOCX, or Markdown (max 25MB each)</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-600">Drag &amp; drop your course file(s), or click to browse</p>
                    <p className="text-sm text-gray-400 mt-1">PDF, DOCX, or Markdown (max 25MB each) · one file = review sections · multiple = queue mode</p>
                  </>
                )}
              </div>
            )}

            {/* Queue list */}
            {fullPdfJobs.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 mt-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {fullPdfJobs.length} {fullPdfJobs.length === 1 ? 'file' : 'files'} queued
                  </h3>
                  <button
                    onClick={() => setFullPdfJobs([])}
                    className="text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-2 mb-4">
                  {fullPdfJobs.map((job, i) => (
                    <div key={job.id} className="grid grid-cols-[auto_1fr_auto] gap-3 bg-gray-50 rounded-lg px-3 sm:px-4 py-3">
                      <span className="w-7 h-7 rounded-full bg-green-50 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="min-w-0 space-y-2">
                        <input
                          type="text"
                          value={job.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFullPdfJobs(prev => prev.map(c => c.id === job.id ? { ...c, name: val } : c));
                          }}
                          placeholder="Course name"
                          className="w-full bg-transparent border-b border-transparent focus:border-green-500 focus:outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
                          <CategorySelect
                            value={job.tags[0] ?? ''}
                            onChange={(category) => {
                              setFullPdfJobs(prev => prev.map(c => c.id === job.id ? { ...c, tags: category ? [category] : [] } : c));
                            }}
                            label="Category"
                            compact
                          />
                          <span className="text-xs text-gray-400 truncate">{job.file.name} · {(job.file.size / 1024).toFixed(0)} KB</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setFullPdfJobs(prev => prev.filter(c => c.id !== job.id))}
                        className="text-gray-300 hover:text-red-500 transition self-start"
                        aria-label="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={startFullPdfQueue}
                  disabled={fullPdfJobs.length === 0}
                  className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Generate {fullPdfJobs.length} {fullPdfJobs.length === 1 ? 'Course' : 'Courses'}
                </button>
                <p className="text-xs text-gray-500 mt-3">
                  Queue mode skips the section-review step — sections are auto-detected and used as-is. For finer control, upload one file at a time.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-medium">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            STEP: PREVIEW SECTIONS — single-file editing
            ============================================================ */}
        {step === 'preview-sections' && (
          <div>
            <div className="flex items-start gap-3 mb-6">
              <button onClick={() => setStep('upload')} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review Detected Sections</h2>
                <p className="text-sm text-gray-500">{sections.length} sections detected · {totalWords.toLocaleString()} words total</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Level</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <CategorySelect
                  value={selectedCourseTags[0] ?? ''}
                  onChange={(category) => setSelectedCourseTags(category ? [category] : [])}
                  label="Category"
                />
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {sections.map((section, i) => (
                <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="shrink-0 w-8 h-8 rounded-full bg-teal-50 text-teal flex items-center justify-center text-sm font-semibold mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => renameSection(i, e.target.value)}
                          className="w-full font-medium text-gray-900 text-sm border-0 border-b border-transparent hover:border-gray-200 focus:border-teal focus:outline-none px-0 py-0.5 transition"
                        />
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="text-xs text-gray-400">{section.wordCount.toLocaleString()} words</span>
                          <span className="text-xs text-gray-300">|</span>
                          <span className="text-xs text-gray-400 truncate">{section.preview}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-1 sm:shrink-0">
                      {i < sections.length - 1 && (
                        <button
                          onClick={() => mergeSections(i, i + 1)}
                          title="Merge with next section"
                          className="px-2 py-1 text-xs border border-gray-200 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                        >
                          Merge ↓
                        </button>
                      )}
                      {sections.length > 1 && (
                        <button
                          onClick={() => deleteSection(i)}
                          title="Remove this section"
                          className="px-2 py-1 text-xs border border-red-200 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!courseName.trim() || sections.length === 0 || !selectedFile) return;
                  // Seed the queue with a single job carrying the user's
                  // edited sections so the queue processor skips outline
                  // detection and preserves merges/renames/deletes.
                  // Sync the ref before firing so the loop sees the job
                  // before React's next render.
                  const job: FullPdfJob = {
                    id: newJobId(),
                    file: selectedFile,
                    name: courseName.trim(),
                    status: 'queued',
                    tags: selectedCourseTags,
                    presetSections: sections,
                    presetExtractedText: extractedText,
                  };
                  setFullPdfJobs([job]);
                  fullPdfJobsRef.current = [job];
                  startFullPdfQueue();
                }}
                disabled={sections.length === 0 || !courseName.trim()}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm bg-navy text-white rounded-lg hover:bg-navy-light font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Generate Course ({sections.length} lessons)
              </button>
              <button
                onClick={() => setStep('upload')}
                className="w-full sm:w-auto px-4 py-3 sm:py-2.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Upload Different File
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP: GENERATING
            ============================================================ */}
        {step === 'generating' && (
          <div className="space-y-4">
            {/* Queue panel — only when multi-file queue is active */}
            {(fullPdfJobs.length > 1 || fullPdfRunning) && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Queue: {fullPdfJobs.filter(j => j.status === 'complete').length}/{fullPdfJobs.length} complete
                    {fullPdfJobs.filter(j => j.status === 'queued').length > 0 && (
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        ({fullPdfJobs.filter(j => j.status === 'queued').length} waiting)
                      </span>
                    )}
                  </h3>
                </div>
                <div className="space-y-2">
                  {fullPdfJobs.map((job, i) => (
                    <div key={job.id} className={`flex flex-wrap items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                      job.status === 'running' ? 'bg-green-50 border border-green-200' :
                      job.status === 'complete' ? 'bg-green-50' :
                      job.status === 'failed' ? 'bg-red-50' :
                      'bg-gray-50'
                    }`}>
                      <span className="w-6 h-6 shrink-0 flex items-center justify-center">
                        {job.status === 'queued' && <span className="text-xs font-bold text-gray-400">{i + 1}</span>}
                        {job.status === 'running' && <div className="w-3.5 h-3.5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />}
                        {job.status === 'complete' && <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                        {job.status === 'failed' && <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                      </span>
                      <span className="flex-1 truncate font-medium text-gray-800">{job.name || job.file.name}</span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {job.status === 'queued' && 'Waiting…'}
                        {job.status === 'running' && 'Processing…'}
                        {job.status === 'complete' && `${job.lessonsDone ?? 0}/${job.lessonsTotal ?? 0} lessons`}
                        {job.status === 'failed' && (job.error || 'Failed')}
                      </span>
                      {job.status === 'queued' && (
                        <button
                          onClick={() => setFullPdfJobs(prev => prev.filter(c => c.id !== job.id))}
                          className="text-gray-300 hover:text-red-500 transition shrink-0"
                          aria-label="Remove from queue"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add-more dropzone — active while the queue is running */}
                {fullPdfRunning && (
                  <label className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-green-200 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50/40 transition text-sm text-green-700">
                    <input
                      type="file"
                      accept=".pdf,.docx,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        const newJobs: FullPdfJob[] = files.map(f => ({
                          id: newJobId(),
                          file: f,
                          name: f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/^\d+\s*/, ''),
                          status: 'queued',
                          tags: selectedCourseTags,
                        }));
                        setFullPdfJobs(prev => [...prev, ...newJobs]);
                        e.target.value = '';
                      }}
                    />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <span className="font-medium">Add more PDFs to the queue</span>
                  </label>
                )}
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-navy-100 border-t-navy rounded-full animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Generating: {courseGenProgress?.courseName || (activeFullPdfId ? fullPdfJobs.find(j => j.id === activeFullPdfId)?.name : courseName)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {!courseGenProgress && 'Starting...'}
                      {courseGenProgress?.status === 'extracting_outline' && 'Analyzing document structure...'}
                      {courseGenProgress?.status === 'generating_lesson' && `Creating lesson ${courseGenProgress.currentLesson} of ${courseGenProgress.totalLessons}`}
                      {courseGenProgress?.status === 'saving' && `Saving lesson ${courseGenProgress.currentLesson}...`}
                    </p>
                  </div>
                </div>

                {fullPdfRunning && (
                  <button
                    onClick={stopFullPdfGeneration}
                    className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition"
                    title="Cancel generation and stop the queue"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <rect x="9" y="9" width="6" height="6" rx="0.5" fill="currentColor" stroke="none" />
                    </svg>
                    Stop &amp; Discard
                  </button>
                )}
              </div>

              {courseGenProgress && courseGenProgress.totalLessons > 0 && (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{courseGenProgress.lessons.length}/{courseGenProgress.totalLessons} lessons</span>
                      <span>{Math.round((courseGenProgress.lessons.length / courseGenProgress.totalLessons) * 100)}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-2.5 rounded-full bg-teal transition-all duration-500" style={{ width: `${(courseGenProgress.lessons.length / courseGenProgress.totalLessons) * 100}%` }} />
                    </div>
                  </div>
                  {courseGenProgress.currentLessonTitle && (
                    <p className="text-sm text-navy font-medium mb-3">Currently: {courseGenProgress.currentLessonTitle}</p>
                  )}
                  {courseGenProgress.lessons.length > 0 && (
                    <div className="space-y-1.5">
                      {courseGenProgress.lessons.map((l, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {l.id === 'failed' ? <span className="text-red-500">✗</span> : <span className="text-green-500">✓</span>}
                          <span className="text-gray-700">{l.title}</span>
                          {l.pages > 0 && <span className="text-gray-400 text-xs">({l.pages} pages)</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            STEP: COMPLETE — multi-file summary
            ============================================================ */}
        {step === 'complete' && fullPdfJobs.length > 1 && (
          <div className="bg-white border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {fullPdfJobs.filter(j => j.status === 'complete').length}/{fullPdfJobs.length} Courses Created
                </h3>
                <p className="text-sm text-gray-500">
                  {fullPdfJobs.filter(j => j.status === 'failed').length > 0
                    ? `${fullPdfJobs.filter(j => j.status === 'failed').length} failed — see details below`
                    : 'All PDFs processed successfully'}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {fullPdfJobs.map((job, i) => (
                <div key={job.id} className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border rounded-lg p-3 ${
                  job.status === 'complete' ? 'border-green-100 bg-green-50/40' :
                  job.status === 'failed' ? 'border-red-100 bg-red-50/40' :
                  'border-gray-100'
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-gray-400 w-6 shrink-0">{i + 1}.</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{job.name || job.file.name}</span>
                    {job.status === 'complete' && job.lessonsTotal != null && (
                      <span className="text-xs text-gray-500 shrink-0">({job.lessonsDone}/{job.lessonsTotal} lessons)</span>
                    )}
                    {job.status === 'failed' && job.error && (
                      <span className="text-xs text-red-600 truncate">{job.error}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {job.status === 'complete' && job.courseId && (
                      <Link
                        href={`/admin/courses/${job.courseId}`}
                        className="text-xs px-3 py-1 bg-navy text-white rounded-full hover:bg-navy-light font-medium transition"
                      >
                        Manage →
                      </Link>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      job.status === 'complete' ? 'bg-green-100 text-green-700' :
                      job.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:flex">
              <Link href="/admin/courses" className="text-center px-5 py-3 sm:py-2.5 text-sm bg-navy text-white rounded-lg hover:bg-navy-light font-medium transition">
                View All Courses →
              </Link>
              <button onClick={resetAll} className="px-5 py-3 sm:py-2.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
                Create Another
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP: COMPLETE — single-file summary
            ============================================================ */}
        {step === 'complete' && fullPdfJobs.length <= 1 && courseGenProgress?.status === 'complete' && (
          <div className="bg-white border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Course Created!</h3>
                <p className="text-sm text-gray-500">{courseGenProgress.courseName} · {courseGenProgress.lessons.filter(l => l.id !== 'failed').length} lessons</p>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              {courseGenProgress.lessons.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {l.id === 'failed' ? <span className="text-red-500">✗</span> : <span className="text-green-500">✓</span>}
                  <span className="text-gray-700">{l.title}</span>
                  {l.pages > 0 && <span className="text-gray-400 text-xs">({l.pages} pages)</span>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:flex">
              {courseGenProgress.courseId && (
                <Link href={`/admin/courses/${courseGenProgress.courseId}`} className="text-center px-5 py-3 sm:py-2.5 text-sm bg-navy text-white rounded-lg hover:bg-navy-light font-medium transition">
                  Manage Course →
                </Link>
              )}
              <button onClick={resetAll} className="px-5 py-3 sm:py-2.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategorySelect({
  value,
  onChange,
  label,
  compact = false,
}: {
  value: string;
  onChange: (category: string) => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <div>
      <label className={`block font-medium text-gray-700 ${compact ? 'sr-only' : 'text-sm mb-1'}`}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-300 rounded-lg text-sm bg-white focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100 ${
          compact ? 'px-2 py-1.5' : 'px-3 py-2'
        }`}
      >
        <option value="">Uncategorized</option>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}
