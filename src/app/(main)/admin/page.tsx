'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { CourseGenerationProgress } from '@/types';

type AdminStep = 'choose' | 'prompt-chat' | 'upload' | 'preview-sections' | 'generating' | 'complete'
  | 'outline-upload' | 'outline-preview' | 'outline-generating';

type DetectedSection = {
  id: string;
  title: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
  preview: string;
};

type OutlineLesson = {
  id: string;
  title: string;
  keyPoints: string[];
};

export default function AdminPage() {
  const [step, setStep] = useState<AdminStep>('choose');
  const [courseName, setCourseName] = useState('');
  const [targetLevel, setTargetLevel] = useState('intermediate');
  const [error, setError] = useState<string | null>(null);
  const [courseGenProgress, setCourseGenProgress] = useState<CourseGenerationProgress | null>(null);

  // File state (kept between preview and generate steps)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Section preview state
  const [sections, setSections] = useState<DetectedSection[]>([]);
  const [detectingOutline, setDetectingOutline] = useState(false);
  const [totalWords, setTotalWords] = useState(0);
  const [extractedText, setExtractedText] = useState('');

  // Outline-based generation state
  const [outlineLessons, setOutlineLessons] = useState<OutlineLesson[]>([]);
  const [outlineLanguage, setOutlineLanguage] = useState('English');
  const [parsingOutline, setParsingOutline] = useState(false);

  // Prompt generator chat state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ---- Prompt Generator Chat ----
  const sendChatMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg = { role: 'user' as const, content: text.trim() };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput('');
    setIsStreaming(true);
    setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/prompt-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });

      if (!res.ok) throw new Error('Failed');
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No body');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setChatMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: 'assistant', content: fullText };
          return msgs;
        });
      }

      const promptMatch = fullText.match(/---PROMPT START---([\s\S]*?)---PROMPT END---/);
      if (promptMatch) {
        setGeneratedPrompt(promptMatch[1].trim());
      }
    } catch {
      setChatMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
        return msgs;
      });
    } finally {
      setIsStreaming(false);
      chatInputRef.current?.focus();
    }
  }, [chatMessages, isStreaming]);

  // ---- Outline Detection ----
  const detectOutline = useCallback(async (file: File) => {
    setDetectingOutline(true);
    setError(null);
    setSelectedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/analyze-outline', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze document');

      setSections(data.sections);
      setTotalWords(data.totalWords);
      setExtractedText(data.extractedText || '');

      // Auto-fill course name from file if empty
      if (!courseName.trim()) {
        setCourseName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
      }

      setStep('preview-sections');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze document');
    } finally {
      setDetectingOutline(false);
    }
  }, [courseName]);

  // ---- Section Editing ----
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

  // ---- Course Generation (one lesson per request to stay within Vercel 300s limit) ----
  const startGeneration = useCallback(async () => {
    if (!courseName.trim()) {
      setError('Please enter a course name.');
      return;
    }
    if (sections.length === 0) {
      setError('No sections to generate.');
      return;
    }
    if (!selectedFile) {
      setError('No file selected.');
      return;
    }

    setError(null);
    setCourseGenProgress(null);
    setStep('generating');

    try {
      // Step 1: Create the course
      const createRes = await fetch('/api/analyze-course/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName: courseName.trim(), sections }),
      });
      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({ error: 'Failed to create course' }));
        throw new Error(errData.error || 'Failed to create course');
      }
      const { courseId, courseName: resolvedName } = await createRes.json();

      const totalLessons = sections.length;
      const completedLessons: CourseGenerationProgress['lessons'] = [];
      const lessonSummaries: { position: number; title: string; summary: string; keyConcepts: string[] }[] = [];

      // Step 2: Generate each lesson one at a time
      for (let i = 0; i < totalLessons; i++) {
        const section = sections[i];
        const sectionText = extractedText.substring(section.startIndex, section.endIndex);

        // Update progress: generating
        setCourseGenProgress({
          status: 'generating_lesson',
          totalLessons,
          currentLesson: i + 1,
          currentLessonTitle: section.title,
          courseId,
          courseName: resolvedName,
          lessons: completedLessons,
        });

        // Build context from previous lessons
        const previousContext = lessonSummaries.length > 0
          ? `PREVIOUS LESSONS IN THIS COURSE (do NOT repeat their content — build on it, reference their concepts):\n${
              lessonSummaries.map(s => {
                const concepts = s.keyConcepts.length > 0 ? ` | Concepts taught: ${s.keyConcepts.join(', ')}` : '';
                const shortSummary = s.summary.length > 200 ? s.summary.substring(0, 200) + '...' : s.summary;
                return `Lesson ${s.position + 1} "${s.title}": ${shortSummary}${concepts}`;
              }).join('\n')
            }`
          : '';

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
              fileName: selectedFile.name,
              previousContext,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({ error: 'Lesson generation failed' }));
            throw new Error(errData.error || 'Lesson generation failed');
          }

          const result = await res.json();
          completedLessons.push({
            id: result.id,
            title: result.title,
            pages: result.pages,
            position: i,
          });

          lessonSummaries.push({
            position: i,
            title: result.title,
            summary: result.summary || '',
            keyConcepts: result.keyConcepts || [],
          });
        } catch (err) {
          console.error(`Section ${i + 1} failed:`, err);
          completedLessons.push({
            id: 'failed',
            title: `${section.title} (failed)`,
            pages: 0,
            position: i,
          });
        }

        // Small delay between lessons
        if (i < totalLessons - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      // Step 3: Complete
      setCourseGenProgress({
        status: 'complete',
        totalLessons,
        currentLesson: totalLessons,
        currentLessonTitle: '',
        courseId,
        courseName: resolvedName,
        lessons: completedLessons,
      });

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStep('preview-sections');
    }
  }, [courseName, targetLevel, sections, selectedFile, extractedText]);

  // ---- Outline Upload Handler ----
  const handleOutlineUpload = useCallback(async (file: File) => {
    setParsingOutline(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/analyze-course/parse-outline', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse outline');

      setOutlineLessons(data.lessons);
      if (!courseName.trim()) {
        setCourseName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
      }
      setStep('outline-preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse outline');
    } finally {
      setParsingOutline(false);
    }
  }, [courseName]);

  // ---- Split dense lessons into 15-min chunks ----
  // 3-5 key points → 1 lesson, 6-8 → 2 lessons, 9-12 → 3 lessons, etc.
  const splitLessonsForGeneration = (lessons: OutlineLesson[]): OutlineLesson[] => {
    const result: OutlineLesson[] = [];
    for (const lesson of lessons) {
      const kpCount = lesson.keyPoints.length;
      const parts = Math.max(1, Math.ceil(kpCount / 5));

      if (parts === 1) {
        result.push(lesson);
      } else {
        const perPart = Math.ceil(kpCount / parts);
        for (let p = 0; p < parts; p++) {
          const partKPs = lesson.keyPoints.slice(p * perPart, (p + 1) * perPart);
          const suffix = parts === 2
            ? (p === 0 ? ' — Part 1' : ' — Part 2')
            : ` — Part ${p + 1}`;
          result.push({
            id: `${lesson.id}-part${p + 1}`,
            title: `${lesson.title}${suffix}`,
            keyPoints: partKPs,
          });
        }
      }
    }
    return result;
  };

  // ---- Outline Course Generation ----
  const startOutlineGeneration = useCallback(async () => {
    if (!courseName.trim()) { setError('Please enter a course name.'); return; }
    if (outlineLessons.length === 0) { setError('No lessons to generate.'); return; }

    setError(null);
    setCourseGenProgress(null);
    setStep('outline-generating');

    try {
      // Split dense lessons into 15-min parts
      const expandedLessons = splitLessonsForGeneration(outlineLessons);

      // Step 1: Create the course
      const createRes = await fetch('/api/analyze-course/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: courseName.trim(),
          sections: expandedLessons.map((l, i) => ({ id: l.id, title: l.title, startIndex: i, endIndex: i, wordCount: l.keyPoints.length * 50 })),
        }),
      });
      if (!createRes.ok) throw new Error('Failed to create course');
      const { courseId, courseName: resolvedName } = await createRes.json();

      const totalLessons = expandedLessons.length;
      const completedLessons: CourseGenerationProgress['lessons'] = [];
      const lessonSummaries: { position: number; title: string; summary: string; keyConcepts: string[] }[] = [];

      // Step 2: Generate each lesson
      for (let i = 0; i < totalLessons; i++) {
        const lesson = expandedLessons[i];

        setCourseGenProgress({
          status: 'generating_lesson',
          totalLessons,
          currentLesson: i + 1,
          currentLessonTitle: lesson.title,
          courseId,
          courseName: resolvedName,
          lessons: completedLessons,
        });

        const previousContext = lessonSummaries.length > 0
          ? lessonSummaries.map(s => {
              const concepts = s.keyConcepts.length > 0 ? ` | Concepts: ${s.keyConcepts.join(', ')}` : '';
              const short = s.summary.length > 200 ? s.summary.substring(0, 200) + '...' : s.summary;
              return `Lesson ${s.position + 1} "${s.title}": ${short}${concepts}`;
            }).join('\n')
          : '';

        try {
          const res = await fetch('/api/analyze-course/generate-from-outline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonTitle: lesson.title,
              keyPoints: lesson.keyPoints,
              language: outlineLanguage,
              lessonIndex: i,
              totalLessons,
              courseId,
              previousContext,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({ error: 'Generation failed' }));
            throw new Error(errData.error || 'Generation failed');
          }

          const result = await res.json();
          completedLessons.push({ id: result.id, title: result.title, pages: result.pages, position: i });
          lessonSummaries.push({ position: i, title: result.title, summary: result.summary || '', keyConcepts: result.keyConcepts || [] });
        } catch (err) {
          console.error(`Lesson ${i + 1} failed:`, err);
          completedLessons.push({ id: 'failed', title: `${lesson.title} (failed)`, pages: 0, position: i });
        }

        if (i < totalLessons - 1) await new Promise(r => setTimeout(r, 1500));
      }

      setCourseGenProgress({
        status: 'complete',
        totalLessons,
        currentLesson: totalLessons,
        currentLessonTitle: '',
        courseId,
        courseName: resolvedName,
        lessons: completedLessons,
      });
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStep('outline-preview');
    }
  }, [courseName, outlineLessons, outlineLanguage]);

  // ---- Upload drop handler ----
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        detectOutline(acceptedFiles[0]);
      }
    },
    [detectOutline]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024,
    disabled: detectingOutline || step === 'generating',
  });

  const copyPrompt = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetAll = () => {
    setStep('choose');
    setCourseName('');
    setError(null);
    setCourseGenProgress(null);
    setChatMessages([]);
    setGeneratedPrompt(null);
    setChatInput('');
    setSections([]);
    setSelectedFile(null);
    setTotalWords(0);
    setOutlineLessons([]);
    setOutlineLanguage('English');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Academy - Admin</h1>
          <p className="text-gray-600 mt-1">Create courses from PDF documents</p>
          <div className="flex gap-4 mt-2">
            <a href="/admin/lessons" className="text-blue-600 hover:text-blue-800 text-sm">View all lessons &rarr;</a>
            <a href="/admin/courses" className="text-blue-600 hover:text-blue-800 text-sm">Manage courses &rarr;</a>
          </div>
        </div>

        {/* ============================================================
            STEP: CHOOSE
            ============================================================ */}
        {step === 'choose' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setStep('outline-upload')}
              className="bg-white border-2 border-orange-200 rounded-xl p-8 text-left hover:border-orange-400 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload Course Outline</h3>
              <p className="text-sm text-gray-500">Upload a PDF with lesson names &amp; key points. AI generates full lessons from scratch.</p>
              <span className="inline-block mt-2 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">Recommended</span>
            </button>

            <button
              onClick={() => setStep('prompt-chat')}
              className="bg-white border border-gray-200 rounded-xl p-8 text-left hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">I need help creating a PDF</h3>
              <p className="text-sm text-gray-500">Chat with AI to design your course. It generates a prompt for ChatGPT to create the PDF.</p>
            </button>

            <button
              onClick={() => setStep('upload')}
              className="bg-white border border-gray-200 rounded-xl p-8 text-left hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">I already have a full PDF</h3>
              <p className="text-sm text-gray-500">Upload a complete course PDF. The system analyzes content and restructures it into lessons.</p>
            </button>
          </div>
        )}

        {/* ============================================================
            STEP: OUTLINE UPLOAD
            ============================================================ */}
        {step === 'outline-upload' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('choose')} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-xl font-bold text-gray-900">Upload Course Outline</h2>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Introduction to AI and Vibe Coding"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Language</label>
                <select
                  value={outlineLanguage}
                  onChange={(e) => setOutlineLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                >
                  <option value="English">English</option>
                  <option value="Georgian">Georgian (ქართული)</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Russian">Russian</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Outline (PDF or DOCX)</label>
                <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${parsingOutline ? 'border-orange-300 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'}`}>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    disabled={parsingOutline}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleOutlineUpload(f);
                    }}
                  />
                  {parsingOutline ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                      <span className="text-sm text-gray-500">Parsing outline...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <span className="text-sm text-gray-500">Click to upload or drag &amp; drop (PDF or DOCX)</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">Expected PDF format:</p>
                <pre className="text-xs text-amber-700 whitespace-pre-wrap font-mono">{`Lesson 1: Introduction to AI
- What is Artificial Intelligence
- Brief history of AI development
- Types of AI: narrow vs general
- AI in everyday life

Lesson 2: Prompt Engineering Basics
- What is a prompt
- Structure of effective prompts
- Common prompting mistakes
- Practice examples`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP: OUTLINE PREVIEW
            ============================================================ */}
        {step === 'outline-preview' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep('outline-upload')} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-bold text-gray-900">Review Lessons ({outlineLessons.length})</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Language: <strong>{outlineLanguage}</strong></span>
                <button
                  onClick={startOutlineGeneration}
                  disabled={outlineLessons.length === 0}
                  className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
                >
                  Generate {outlineLessons.reduce((sum, l) => sum + Math.max(1, Math.ceil(l.keyPoints.length / 5)), 0)} Lessons
                </button>
              </div>
            </div>

            {/* Course name edit */}
            <div className="mb-4">
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="text-lg font-semibold text-gray-900 border-b-2 border-transparent focus:border-orange-500 focus:outline-none w-full py-1 bg-transparent"
                placeholder="Course name..."
              />
            </div>

            <div className="space-y-3">
              {outlineLessons.map((lesson, i) => (
                <div key={lesson.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-700 text-sm font-bold flex items-center justify-center">{i + 1}</span>
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => {
                          setOutlineLessons(prev => {
                            const next = [...prev];
                            next[i] = { ...next[i], title: e.target.value };
                            return next;
                          });
                        }}
                        className="text-base font-semibold text-gray-900 border-b border-transparent focus:border-orange-400 focus:outline-none bg-transparent"
                      />
                    </div>
                    <button
                      onClick={() => setOutlineLessons(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-gray-300 hover:text-red-500 transition p-1"
                      title="Remove lesson"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="ml-11 space-y-1">
                    {lesson.keyPoints.map((kp, j) => (
                      <div key={j} className="flex items-start gap-2 group">
                        <span className="text-gray-300 mt-0.5 text-sm">•</span>
                        <input
                          type="text"
                          value={kp}
                          onChange={(e) => {
                            setOutlineLessons(prev => {
                              const next = [...prev];
                              const kps = [...next[i].keyPoints];
                              kps[j] = e.target.value;
                              next[i] = { ...next[i], keyPoints: kps };
                              return next;
                            });
                          }}
                          className="flex-1 text-sm text-gray-600 border-b border-transparent focus:border-gray-300 focus:outline-none bg-transparent"
                        />
                        <button
                          onClick={() => {
                            setOutlineLessons(prev => {
                              const next = [...prev];
                              next[i] = { ...next[i], keyPoints: next[i].keyPoints.filter((_, idx) => idx !== j) };
                              return next;
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setOutlineLessons(prev => {
                          const next = [...prev];
                          next[i] = { ...next[i], keyPoints: [...next[i].keyPoints, ''] };
                          return next;
                        });
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1"
                    >
                      + Add key point
                    </button>
                  </div>

                  <div className="ml-11 mt-2 text-xs text-gray-400">
                    {lesson.keyPoints.length} key points
                    {lesson.keyPoints.length > 5 ? (
                      <span className="text-orange-600 font-medium"> &middot; Will split into {Math.ceil(lesson.keyPoints.length / 5)} lessons ({Math.ceil(lesson.keyPoints.length / 5) * 15} min)</span>
                    ) : (
                      <> &middot; ~15 min &middot; 5 pages</>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Estimated totals */}
            {(() => {
              const expanded = outlineLessons.reduce((sum, l) => sum + Math.max(1, Math.ceil(l.keyPoints.length / 5)), 0);
              const hasSplits = expanded > outlineLessons.length;
              return (
                <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
                  <strong>{expanded} lessons</strong>
                  {hasSplits && <span className="text-gray-500"> (from {outlineLessons.length} topics)</span>}
                  {' '}&middot; ~{expanded * 15} min total &middot; ~{expanded * 5} pages
                  {hasSplits && <div className="mt-1 text-xs text-orange-600">Some lessons with 6+ key points will be split into multiple 15-min parts.</div>}
                </div>
              );
            })()}
          </div>
        )}

        {/* ============================================================
            STEP: OUTLINE GENERATING (reuses the same progress UI)
            ============================================================ */}
        {step === 'outline-generating' && courseGenProgress && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Generating Course...</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Lesson {courseGenProgress.currentLesson} of {courseGenProgress.totalLessons}</span>
                  <span className="font-medium text-gray-900">{Math.round((courseGenProgress.currentLesson / courseGenProgress.totalLessons) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-orange-500 h-3 rounded-full transition-all duration-500" style={{ width: `${(courseGenProgress.currentLesson / courseGenProgress.totalLessons) * 100}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                Generating: <strong className="text-gray-900">{courseGenProgress.currentLessonTitle}</strong>
              </div>

              {courseGenProgress.lessons.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  {courseGenProgress.lessons.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-gray-700">{l.title}</span>
                      <span className="text-gray-400 text-xs">({l.pages} pages)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            STEP: PROMPT CHAT
            ============================================================ */}
        {step === 'prompt-chat' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep('choose')} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h2 className="text-xl font-bold text-gray-900">Course Design Assistant</h2>
              </div>
              {generatedPrompt && (
                <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Go to Upload &rarr;
                </button>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082" /></svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">What course would you like to create?</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">Describe your course idea. I&apos;ll ask questions to understand your needs, then generate a ready-to-use prompt.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Prompt Engineering for Adults', 'AI Agents for Beginners', 'Intro to Web Development'].map((s) => (
                        <button key={s} onClick={() => sendChatMessage(`I want to create a course on: ${s}`)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white px-4 py-2.5' : 'bg-gray-100 text-gray-800 px-4 py-3'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="chat-prose max-w-none text-[0.8125rem]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content.replace(/---PROMPT START---[\s\S]*?---PROMPT END---/, '[Prompt generated - see below]') || '...'}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isStreaming && chatMessages[chatMessages.length - 1]?.content === '' && (
                  <div className="flex gap-1 px-4 py-2"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
                )}
                <div ref={chatEndRef} />
              </div>

              {generatedPrompt && (
                <div className="border-t border-gray-200 bg-green-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-800 text-sm">Your prompt is ready!</h4>
                    <button onClick={copyPrompt} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                      {copied ? 'Copied!' : 'Copy Prompt'}
                    </button>
                  </div>
                  <div className="bg-white border border-green-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{generatedPrompt}</pre>
                  </div>
                  <p className="text-xs text-green-700 mt-2">Paste into ChatGPT-4o with Code Interpreter. Download the PDF, then click &quot;Go to Upload&quot;.</p>
                </div>
              )}

              <div className="border-t border-gray-200 p-3">
                <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(chatInput); }} className="flex gap-2">
                  <input ref={chatInputRef} type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Describe your course idea..." disabled={isStreaming} className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 transition" />
                  <button type="submit" disabled={isStreaming || !chatInput.trim()} className="shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9-7-9-7-9 7 9 7z" transform="rotate(-45 12 12)" /></svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP: UPLOAD
            ============================================================ */}
        {step === 'upload' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('choose')} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
              <h2 className="text-xl font-bold text-gray-900">Upload Course PDF</h2>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="courseName" className="block text-sm font-medium text-gray-700 mb-1">Course Name <span className="text-red-500">*</span></label>
                  <input id="courseName" type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g., Prompt Engineering for Adults" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">Target Level</label>
                  <select id="level" value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Upload a PDF with clear chapter headings. The system will detect chapters and show you a preview before generating lessons.</p>
            </div>

            {detectingOutline ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <div className="inline-block h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-900 font-medium">Analyzing document structure...</p>
                <p className="text-sm text-gray-500 mt-1">Detecting chapters and sections</p>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
              >
                <input {...getInputProps()} />
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                {isDragActive ? (
                  <p className="text-blue-600 font-medium">Drop the file here...</p>
                ) : (
                  <>
                    <p className="font-medium text-gray-600">Drag &amp; drop your course PDF, or click to browse</p>
                    <p className="text-sm text-gray-400 mt-1">PDF or DOCX (max 25MB)</p>
                  </>
                )}
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
            STEP: PREVIEW SECTIONS - Edit before generating
            ============================================================ */}
        {step === 'preview-sections' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('upload')} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review Detected Sections</h2>
                <p className="text-sm text-gray-500">{sections.length} sections detected &middot; {totalWords.toLocaleString()} words total</p>
              </div>
            </div>

            {/* Course name (editable here too) */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                  <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Level</label>
                  <select value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section list */}
            <div className="space-y-2 mb-6">
              {sections.map((section, i) => (
                <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => renameSection(i, e.target.value)}
                          className="w-full font-medium text-gray-900 text-sm border-0 border-b border-transparent hover:border-gray-200 focus:border-blue-400 focus:outline-none px-0 py-0.5 transition"
                        />
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">{section.wordCount.toLocaleString()} words</span>
                          <span className="text-xs text-gray-300">|</span>
                          <span className="text-xs text-gray-400 truncate">{section.preview}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {i < sections.length - 1 && (
                        <button
                          onClick={() => mergeSections(i, i + 1)}
                          title="Merge with next section"
                          className="px-2 py-1 text-xs border border-gray-200 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                        >
                          Merge &darr;
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

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Each section above becomes a <strong>separate lesson</strong> in the course. You can:
              </p>
              <ul className="text-sm text-blue-700 mt-1 space-y-0.5 ml-4 list-disc">
                <li>Click a section title to rename it (this becomes the lesson title)</li>
                <li>Click &quot;Merge&quot; to combine adjacent sections into one lesson</li>
                <li>Click &quot;Remove&quot; to skip a section entirely</li>
              </ul>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={startGeneration}
                disabled={sections.length === 0 || !courseName.trim()}
                className="px-6 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Generate Course ({sections.length} lessons)
              </button>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Generating: {courseGenProgress?.courseName || courseName}
                </h3>
                <p className="text-sm text-gray-500">
                  {!courseGenProgress && 'Starting...'}
                  {courseGenProgress?.status === 'extracting_outline' && 'Analyzing structure...'}
                  {courseGenProgress?.status === 'generating_lesson' && `Creating lesson ${courseGenProgress.currentLesson} of ${courseGenProgress.totalLessons}`}
                  {courseGenProgress?.status === 'saving' && `Saving lesson ${courseGenProgress.currentLesson}...`}
                </p>
              </div>
            </div>

            {courseGenProgress && courseGenProgress.totalLessons > 0 && (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{courseGenProgress.lessons.length}/{courseGenProgress.totalLessons} lessons</span>
                    <span>{Math.round((courseGenProgress.lessons.length / courseGenProgress.totalLessons) * 100)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-2.5 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${(courseGenProgress.lessons.length / courseGenProgress.totalLessons) * 100}%` }} />
                  </div>
                </div>
                {courseGenProgress.currentLessonTitle && (
                  <p className="text-sm text-blue-700 font-medium mb-3">Currently: {courseGenProgress.currentLessonTitle}</p>
                )}
                {courseGenProgress.lessons.length > 0 && (
                  <div className="space-y-1.5">
                    {courseGenProgress.lessons.map((l, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {l.id === 'failed' ? <span className="text-red-500">&#10007;</span> : <span className="text-green-500">&#10003;</span>}
                        <span className="text-gray-700">{l.title}</span>
                        {l.pages > 0 && <span className="text-gray-400 text-xs">({l.pages} pages)</span>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================
            STEP: COMPLETE
            ============================================================ */}
        {step === 'complete' && courseGenProgress?.status === 'complete' && (
          <div className="bg-white border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Course Created!</h3>
                <p className="text-sm text-gray-500">{courseGenProgress.courseName} &middot; {courseGenProgress.lessons.filter(l => l.id !== 'failed').length} lessons</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {courseGenProgress.lessons.map((l, i) => (
                <div key={i} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 w-6">{i + 1}.</span>
                    <span className="text-sm font-medium text-gray-900">{l.title}</span>
                    {l.pages > 0 && <span className="text-xs text-gray-400">({l.pages} pages)</span>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${l.id === 'failed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                    {l.id === 'failed' ? 'failed' : 'draft'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {courseGenProgress.courseId && (
                <a href={`/admin/courses/${courseGenProgress.courseId}`} className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition">
                  View &amp; Manage Course
                </a>
              )}
              <button
                onClick={() => {
                  const ids = courseGenProgress!.lessons.filter(l => l.id !== 'failed').map(l => l.id);
                  Promise.all(ids.map(id => fetch(`/api/lessons/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'published' }) }))).then(() => alert('All lessons published!'));
                }}
                className="px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
              >
                Publish All
              </button>
              <button onClick={resetAll} className="px-5 py-2.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
