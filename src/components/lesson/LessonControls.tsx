'use client';

import { useEffect, useState } from 'react';

// ============================================================
// LessonControls — in-lesson tutor controls (Task 9)
// - Quick actions: simpler / deeper / example (dispatch prefab prompts)
// - Style selector: direct / socratic / exploratory (updates profile)
// ============================================================

type PreferredStyle = 'direct' | 'socratic' | 'exploratory';

const STYLE_LABELS: Record<PreferredStyle, { label: string; hint: string }> = {
  direct: { label: 'პირდაპირი', hint: 'ახსნის-ნათქვამი' },
  socratic: { label: 'სოკრატული', hint: 'კითხვა-კითხვა' },
  exploratory: { label: 'საძიებო', hint: 'სიღრმე' },
};

const QUICK_ACTIONS = [
  { key: 'simpler', label: 'უფრო მარტივად', prompt: 'გთხოვ, უფრო მარტივად ახსენი ეს ნაწილი, პატარა ნაბიჯებად.' },
  { key: 'deeper', label: 'უფრო ღრმად', prompt: 'გთხოვ, უფრო ღრმად ამიხსნა ბოლო თემა — რატომ და როგორ მუშაობს.' },
  { key: 'example', label: 'მაგალითი', prompt: 'გთხოვ, მომიყვანე კონკრეტული მაგალითი ამ ცნებისთვის გაკვეთილის მასალიდან.' },
] as const;

export function LessonControls({
  onPrompt,
  disabled,
  compact = false,
}: {
  onPrompt: (prompt: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [style, setStyle] = useState<PreferredStyle | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.preferredStyle) setStyle(data.preferredStyle);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateStyle(next: PreferredStyle) {
    if (next === style || saving) return;
    setStyle(next);
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredStyle: next }),
      });
    } catch {
      // keep the optimistic update even if the save fails
    } finally {
      setSaving(false);
    }
  }

  const btnCls = compact
    ? 'rounded-full px-2 py-0.5 text-[10px] font-semibold transition disabled:opacity-50'
    : 'rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Quick-action prompts */}
      {QUICK_ACTIONS.map((a) => (
        <button
          key={a.key}
          type="button"
          disabled={disabled}
          onClick={() => onPrompt(a.prompt)}
          className={`${btnCls} bg-cyan-50 text-teal hover:bg-teal hover:text-white`}
          title={a.prompt}
        >
          {a.label}
        </button>
      ))}

      {/* Divider */}
      <span className="mx-1 h-4 w-px bg-gray-200 hidden sm:inline-block" aria-hidden />

      {/* Style selector */}
      <div className="inline-flex rounded-full border border-gray-200 overflow-hidden">
        {(Object.keys(STYLE_LABELS) as PreferredStyle[]).map((s) => {
          const active = style === s;
          return (
            <button
              key={s}
              type="button"
              disabled={disabled || saving}
              onClick={() => updateStyle(s)}
              className={`${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'} font-bold transition ${
                active ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-gray-50'
              }`}
              title={STYLE_LABELS[s].hint}
            >
              {STYLE_LABELS[s].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
