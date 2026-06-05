'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Lightbulb,
  AlertTriangle,
  BookMarked,
  Quote,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import type { ContentBlock } from '@/types';
import { cn } from '@/lib/utils';
import { MATERIAL_STRINGS, type MaterialLocale } from './materialStrings';

export function ContentRenderer({
  blocks,
  locale = 'ka',
}: {
  blocks: ContentBlock[];
  locale?: MaterialLocale;
}) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-3 sm:space-y-4">
      {sorted.map((b) => (
        <Block key={b.id} block={b} locale={locale} />
      ))}
    </div>
  );
}

function Block({ block, locale }: { block: ContentBlock; locale: MaterialLocale }) {
  const { type, content } = block;
  const S = MATERIAL_STRINGS[locale];

  if (type === 'heading') {
    return (
      <h3
        className="text-lg sm:text-xl font-bold tracking-tight mt-4 first:mt-0"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {content}
      </h3>
    );
  }

  if (type === 'text') {
    return (
      <div className="lesson-prose text-sm sm:text-[15px] text-foreground/85 leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  if (type === 'code') {
    return (
      <pre className="rounded-2xl bg-[#1e1e2e] p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm">
        <code className="text-[#cdd6f4] leading-relaxed font-mono">{content}</code>
      </pre>
    );
  }

  if (type === 'callout' || type === 'tip') {
    return (
      <CalloutCard
        icon={<Lightbulb className="w-4 h-4" />}
        tone="pulse"
        label={type === 'tip' ? S.tip : S.note}
      >
        {content}
      </CalloutCard>
    );
  }

  if (type === 'warning') {
    return (
      <CalloutCard
        icon={<AlertTriangle className="w-4 h-4" />}
        tone="heart"
        label={S.caution}
      >
        {content}
      </CalloutCard>
    );
  }

  if (type === 'key_concepts' || type === 'definition') {
    return (
      <CalloutCard
        icon={<BookMarked className="w-4 h-4" />}
        tone="indigo"
        label={type === 'definition' ? S.definition : S.keyConcept}
      >
        {content}
      </CalloutCard>
    );
  }

  if (type === 'quote') {
    return (
      <blockquote className="rounded-2xl border-l-4 border-pulse/50 bg-pulse/5 px-4 py-3 italic text-sm text-foreground/80">
        <Quote className="w-4 h-4 text-pulse/60 mb-1.5" />
        <div className="lesson-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </blockquote>
    );
  }

  if (type === 'example' || type === 'analogy') {
    return (
      <CalloutCard
        icon={<Sparkles className="w-4 h-4" />}
        tone="violet"
        label={type === 'analogy' ? S.analogy : S.example}
      >
        {content}
      </CalloutCard>
    );
  }

  if (type === 'step_by_step' || type === 'list') {
    return (
      <CalloutCard
        icon={<ListChecks className="w-4 h-4" />}
        tone="pulse"
        label={type === 'step_by_step' ? S.stepByStep : S.list}
      >
        {content}
      </CalloutCard>
    );
  }

  if (type === 'summary') {
    return (
      <div className="rounded-2xl border border-pulse/30 bg-gradient-to-br from-pulse/8 via-card to-card p-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold mb-2">
          {S.inShort}
        </p>
        <div className="lesson-prose text-sm text-foreground/90">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="lesson-prose text-sm overflow-x-auto rounded-2xl border border-border bg-card p-3">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  if (type === 'diagram_description') {
    return (
      <CalloutCard
        icon={<Sparkles className="w-4 h-4" />}
        tone="indigo"
        label={S.diagram}
      >
        {content}
      </CalloutCard>
    );
  }

  // Fallback for any unknown type
  return (
    <div className="lesson-prose text-sm text-foreground/85 leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

type Tone = 'pulse' | 'heart' | 'indigo' | 'violet';

const TONE: Record<Tone, { ring: string; iconBg: string; iconText: string; bg: string }> = {
  pulse: {
    ring: 'border-pulse/30',
    iconBg: 'bg-pulse/15',
    iconText: 'text-pulse',
    bg: 'bg-pulse/5',
  },
  heart: {
    ring: 'border-heart/40',
    iconBg: 'bg-heart/15',
    iconText: 'text-heart',
    bg: 'bg-heart/5',
  },
  indigo: {
    ring: 'border-indigo-500/30',
    iconBg: 'bg-indigo-500/15',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/5',
  },
  violet: {
    ring: 'border-violet-500/30',
    iconBg: 'bg-violet-500/15',
    iconText: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/5',
  },
};

function CalloutCard({
  icon,
  tone,
  label,
  children,
}: {
  icon: React.ReactNode;
  tone: Tone;
  label: string;
  children: string;
}) {
  const t = TONE[tone];
  return (
    <div className={cn('rounded-2xl border p-3.5 sm:p-4', t.ring, t.bg)}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-lg',
            t.iconBg,
            t.iconText,
          )}
        >
          {icon}
        </span>
        <p className={cn('text-[10px] uppercase tracking-[0.22em] font-bold', t.iconText)}>
          {label}
        </p>
      </div>
      <div className="lesson-prose text-sm text-foreground/85 leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
      </div>
    </div>
  );
}
