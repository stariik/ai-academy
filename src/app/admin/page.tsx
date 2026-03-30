'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { CourseGenerationProgress } from '@/types';

type AdminStep = 'choose' | 'prompt-chat' | 'upload' | 'preview-sections' | 'generating' | 'complete';

type DetectedSection = {
  id: string;
  title: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
  preview: string;
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

  // ---- Course Generation ----
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
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('targetLevel', targetLevel);
      formData.append('newCourseName', courseName.trim());
      formData.append('sections', JSON.stringify(
        sections.map(s => ({ title: s.title, startIndex: s.startIndex, endIndex: s.endIndex }))
      ));

      const response = await fetch('/api/analyze-course', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop()!;

        for (const event of events) {
          const dataLine = event.replace(/^data: /, '');
          if (dataLine) {
            try {
              const progress = JSON.parse(dataLine) as CourseGenerationProgress;
              setCourseGenProgress(progress);
              if (progress.status === 'error') {
                throw new Error(progress.error || 'Course generation failed');
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message.includes('generation failed')) {
                throw parseErr;
              }
            }
          }
        }
      }

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStep('preview-sections');
    }
  }, [courseName, targetLevel, sections, selectedFile]);

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
          <div className="grid grid-cols-2 gap-4">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-1">I already have a PDF</h3>
              <p className="text-sm text-gray-500">Upload a course PDF. The system detects chapters and lets you review before generating.</p>
            </button>
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
