'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ContentBlock } from '@/types';

export function ContentBlockRenderer({
  block,
  onVisible,
  translatedContent,
}: {
  block: ContentBlock;
  onVisible?: (id: string) => void;
  translatedContent?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const content = translatedContent ?? block.content;

  useEffect(() => {
    const el = ref.current;
    if (!el || block.type !== 'heading' || !onVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible(block.id);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [block.id, block.type, onVisible]);

  return (
    <div ref={ref} id={`block-${block.id}`} className="mb-4 sm:mb-6">
      {block.type === 'heading' && (
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 mb-2 sm:mb-3 tracking-tight">
          {content}
        </h2>
      )}
      {block.type === 'text' && (
        <div className="lesson-prose text-sm sm:text-[0.9375rem] text-gray-700 leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      )}
      {block.type === 'code' && (
        <pre className="rounded-lg bg-[#1e1e2e] p-3 sm:p-4 overflow-x-auto -mx-1 sm:mx-0">
          <code className="text-xs sm:text-sm text-[#cdd6f4] leading-relaxed">{block.content}</code>
        </pre>
      )}
      {block.type === 'callout' && (
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 sm:p-4" role="note">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1 sm:mb-1.5">
            Note
          </p>
          <div className="lesson-prose text-xs sm:text-sm text-amber-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {block.type === 'key_concepts' && (
        <div className="rounded-lg bg-cream-50 border border-cream p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-navy mb-1 sm:mb-1.5">
            Key Concept
          </p>
          <div className="lesson-prose text-xs sm:text-sm text-navy">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {block.type === 'summary' && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 sm:mb-1.5">
            Summary
          </p>
          <div className="lesson-prose text-xs sm:text-sm text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {block.type === 'table' && (
        <div className="rounded-lg border border-gray-200 overflow-hidden -mx-1 sm:mx-0">
          <div className="overflow-x-auto">
            {block.metadata?.headers && block.metadata?.rows ? (
              <table className="w-full text-xs sm:text-sm min-w-[400px]">
                <thead className="bg-gray-50">
                  <tr>
                    {(block.metadata.headers as string[]).map((header, i) => (
                      <th key={i} className="px-3 sm:px-4 py-2 sm:py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(block.metadata.rows as string[][]).map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-700 border-b border-gray-100">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="lesson-prose text-xs sm:text-sm p-3 sm:p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
      {block.type === 'list' && (
        <div className="lesson-prose text-sm sm:text-[0.9375rem] text-gray-700 leading-relaxed pl-1 sm:pl-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      )}
      {block.type === 'example' && (
        <div className="rounded-lg border-l-4 border-teal bg-teal-50 p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-teal mb-1 sm:mb-1.5">
            {block.metadata?.title ? String(block.metadata.title) : 'Example'}
          </p>
          <div className="lesson-prose text-xs sm:text-sm text-navy">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {block.type === 'analogy' && (
        <div className="rounded-lg border-l-4 border-teal-400 bg-teal-50 p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-teal-700 mb-1 sm:mb-1.5">
            Think of it this way...
          </p>
          <div className="lesson-prose text-xs sm:text-sm text-teal-900 italic">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {block.type === 'step_by_step' && (
        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-1.5 sm:mb-2">
            Step by Step
          </p>
          {block.metadata?.steps ? (
            <ol className="list-decimal list-inside space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-indigo-900">
              {(block.metadata.steps as string[]).map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          ) : (
            <div className="lesson-prose text-xs sm:text-sm text-indigo-900">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
      {block.type === 'diagram_description' && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 sm:mb-1.5">
            Visual Concept
          </p>
          <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
            {content}
          </pre>
        </div>
      )}
      {block.type === 'definition' && (
        <div className="rounded-lg bg-violet-50 border border-violet-200 p-3 sm:p-4">
          {Boolean(block.metadata?.term) && (
            <p className="font-bold text-violet-800 mb-1 text-sm sm:text-base">
              {String(block.metadata!.term)}
            </p>
          )}
          <div className="lesson-prose text-xs sm:text-sm text-violet-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {block.type === 'warning' && (
        <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-3 sm:p-4" role="alert">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-red-700 mb-1 sm:mb-1.5">
            Common Mistake
          </p>
          <div className="lesson-prose text-xs sm:text-sm text-red-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {block.type === 'tip' && (
        <div className="rounded-lg border-l-4 border-green-400 bg-green-50 p-3 sm:p-4" role="note">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-green-700 mb-1 sm:mb-1.5">
            Pro Tip
          </p>
          <div className="lesson-prose text-xs sm:text-sm text-green-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {block.type === 'quote' && (
        <blockquote className="border-l-4 border-gray-300 pl-3 sm:pl-4 py-2 my-2">
          <div className="lesson-prose text-xs sm:text-sm text-gray-700 italic">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
          {Boolean(block.metadata?.attribution) && (
            <footer className="text-[10px] sm:text-xs text-gray-500 mt-1">
              &mdash; {String(block.metadata!.attribution)}
            </footer>
          )}
        </blockquote>
      )}
    </div>
  );
}
