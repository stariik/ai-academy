'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Lesson, AnalysisResult, Course } from '@/types';

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

export default function AdminPage() {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [targetLevel, setTargetLevel] = useState<string>('intermediate');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Fetch courses for the dropdown
  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleAnalyze = useCallback(
    async (file: File) => {
      setError(null);
      setLesson(null);
      setFileName(file.name);
      setUploadState('uploading');

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetLevel', targetLevel);
        if (selectedCourseId) {
          formData.append('courseId', selectedCourseId);
        }

        setUploadState('analyzing');

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status}`);
        }

        const result = data as AnalysisResult;
        setLesson(result.lesson);
        setProcessingTime(result.processingTimeMs);
        setUploadState('success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        setUploadState('error');
      }
    },
    [targetLevel, selectedCourseId]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleAnalyze(acceptedFiles[0]);
      }
    },
    [handleAnalyze]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadState === 'uploading' || uploadState === 'analyzing',
  });

  const handleRegenerate = () => {
    setUploadState('idle');
    setLesson(null);
    setError(null);
    setProcessingTime(null);
    setFileName(null);
  };

  const handlePublish = async () => {
    if (!lesson) return;

    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!res.ok) throw new Error('Failed to publish');
      const updated = await res.json();
      setLesson(updated);
    } catch {
      alert('Failed to publish lesson. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Academy - Admin</h1>
          <p className="text-gray-600 mt-1">
            Upload a document to generate an AI-powered lesson
          </p>
          <div className="flex gap-4 mt-2">
            <a
              href="/admin/lessons"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View all lessons &rarr;
            </a>
            <a
              href="/admin/courses"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Manage courses &rarr;
            </a>
          </div>
        </div>

        {/* Target Level + Course Selector */}
        {(uploadState === 'idle' || uploadState === 'error') && (
          <div className="mb-4 flex gap-4">
            <div>
              <label
                htmlFor="targetLevel"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Target Level
              </label>
              <select
                id="targetLevel"
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="courseSelect"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Assign to Course (optional)
              </label>
              <select
                id="courseSelect"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white min-w-[200px]"
              >
                <option value="">No course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {(uploadState === 'idle' || uploadState === 'error') && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop the file here...</p>
              ) : (
                <>
                  <p className="font-medium">Drag & drop a document here, or click to browse</p>
                  <p className="text-sm mt-1">Supports PDF and DOCX files (max 10MB)</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadState === 'error' && error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm font-medium">Analysis Failed</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Processing State */}
        {(uploadState === 'uploading' || uploadState === 'analyzing') && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="inline-block h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-900 font-medium text-lg">
              {uploadState === 'uploading'
                ? 'Uploading document...'
                : 'Analyzing with AI...'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {fileName && <span>File: {fileName}</span>}
              {uploadState === 'analyzing' && (
                <span className="block mt-1">
                  This may take 15-30 seconds depending on document size
                </span>
              )}
            </p>
          </div>
        )}

        {/* Success - Lesson Preview */}
        {uploadState === 'success' && lesson && (
          <div className="space-y-6">
            {/* Processing Info Bar */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="text-green-800 text-sm font-medium">
                  Lesson generated successfully
                </span>
                {processingTime && (
                  <span className="text-green-600 text-xs ml-2">
                    ({(processingTime / 1000).toFixed(1)}s)
                  </span>
                )}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded font-medium ${
                  lesson.status === 'published'
                    ? 'bg-green-200 text-green-800'
                    : 'bg-yellow-200 text-yellow-800'
                }`}
              >
                {lesson.status}
              </span>
            </div>

            {/* Title & Description */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
              <p className="text-gray-600 mt-2">{lesson.description}</p>
              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                <span>Difficulty: {lesson.difficulty}</span>
                <span>Duration: ~{lesson.estimatedDurationMinutes} min</span>
                <span>Source: {lesson.sourceDocument}</span>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Learning Objectives
              </h3>
              <ul className="space-y-2">
                {lesson.learningObjectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="text-green-600 mt-0.5 shrink-0">&#10003;</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Content Blocks */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Content</h3>
              <div className="space-y-4">
                {lesson.contentBlocks.map((block) => (
                  <ContentBlockRenderer key={block.id} block={block} />
                ))}
              </div>
            </div>

            {/* Key Concepts */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Concepts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-medium text-gray-700 w-1/4">
                        Term
                      </th>
                      <th className="text-left py-2 font-medium text-gray-700">
                        Definition
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lesson.keyConcepts.map((concept, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-medium text-gray-900">
                          {concept.term}
                        </td>
                        <td className="py-2 text-gray-600">{concept.definition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{lesson.summary}</p>
            </div>

            {/* Quiz Questions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Quiz Questions ({lesson.quizQuestions.length})
              </h3>
              <div className="space-y-4">
                {lesson.quizQuestions.map((q, i) => (
                  <div key={q.id} className="border border-gray-100 rounded p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {i + 1}. {q.question}
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {q.type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {q.difficulty}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {q.points} pts
                        </span>
                      </div>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {q.options.map((opt, j) => (
                          <li
                            key={j}
                            className={`text-sm pl-4 ${
                              opt === q.correctAnswer
                                ? 'text-green-700 font-medium'
                                : 'text-gray-600'
                            }`}
                          >
                            {String.fromCharCode(65 + j)}. {opt}
                            {opt === q.correctAnswer && ' (correct)'}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.type === 'short_answer' && (
                      <p className="text-sm text-green-700 mt-2">
                        <span className="font-medium">Answer:</span> {q.correctAnswer}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2 italic">{q.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pb-8">
              <button
                onClick={handlePublish}
                disabled={lesson.status === 'published'}
                className={`px-6 py-2 rounded font-medium text-sm ${
                  lesson.status === 'published'
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {lesson.status === 'published' ? 'Published' : 'Publish'}
              </button>
              <button
                onClick={handleRegenerate}
                className="px-6 py-2 rounded font-medium text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Content Block Renderer ----

function ContentBlockRenderer({ block }: { block: Lesson['contentBlocks'][0] }) {
  switch (block.type) {
    case 'heading':
      return (
        <h4 className="text-lg font-semibold text-gray-900 mt-3 mb-1">{block.content}</h4>
      );
    case 'text':
      return (
        <div className="lesson-prose text-sm text-gray-700 leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
        </div>
      );
    case 'key_concepts':
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1">
            Key Concept
          </p>
          <div className="lesson-prose text-sm text-purple-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
          </div>
        </div>
      );
    case 'code':
      return (
        <pre className="bg-[#1e1e2e] text-[#cdd6f4] text-sm p-4 rounded-lg overflow-x-auto">
          <code>{block.content}</code>
        </pre>
      );
    case 'callout':
      return (
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
            Note
          </p>
          <div className="lesson-prose text-sm text-amber-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
          </div>
        </div>
      );
    case 'summary':
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Summary
          </p>
          <div className="lesson-prose text-sm text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
          </div>
        </div>
      );
    default:
      return (
        <div className="lesson-prose text-sm text-gray-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
        </div>
      );
  }
}
