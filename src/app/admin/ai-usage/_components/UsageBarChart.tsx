'use client';

// Lightweight CSS bar chart for daily AI cost — avoids pulling in a
// charting dependency. Hover a bar for the exact figures.

import { useState } from 'react';

type Day = { day: string; costUsd: number; calls: number; tokens: number };

export default function UsageBarChart({ data }: { data: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.costUsd), 0.0001);

  // Label cadence: avoid crowding on 30/90-day ranges.
  const labelEvery = data.length > 45 ? 14 : data.length > 14 ? 7 : 2;

  return (
    <div>
      <div className="flex h-44 items-end gap-px sm:gap-0.5">
        {data.map((d, i) => {
          const pct = (d.costUsd / max) * 100;
          const active = hover === i;
          return (
            <div
              key={d.day}
              className="group relative flex flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {active && (
                <div className="absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-[11px] text-white shadow-lg">
                  <p className="font-semibold">${d.costUsd.toFixed(4)}</p>
                  <p className="text-white/70">
                    {d.calls.toLocaleString()} calls · {d.tokens.toLocaleString()} tok
                  </p>
                  <p className="text-white/50">{d.day}</p>
                </div>
              )}
              <div
                className={`w-full rounded-t-sm transition-colors ${
                  active ? 'bg-navy' : 'bg-teal/70 group-hover:bg-teal'
                }`}
                style={{ height: `${Math.max(pct, d.costUsd > 0 ? 2 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-px sm:gap-0.5">
        {data.map((d, i) => (
          <div key={d.day} className="flex-1 text-center">
            {i % labelEvery === 0 && (
              <span className="text-[9px] text-gray-400">{d.day.slice(5)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
