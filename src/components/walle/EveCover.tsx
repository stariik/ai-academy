'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * EveCover — the course "cover" visual, shaped and styled after Walle/Eve's
 * head (see ./Walle.tsx): a glossy white egg-dome at Eve's ~5:4 proportions
 * with a soft cyan aura, the category emoji centered where the visor sits.
 * Used on landing course cards and the course-detail page so every course
 * shares the teacher's visual language.
 *
 * The path data and gradients are lifted verbatim from Walle's head so the
 * silhouette and shading match the mascot exactly.
 */

// Eve head dome — bounding box ≈ x[56..184] y[38..142] → ~128×104 (5:4).
const PATH_HEAD =
  'M 120 38 C 168 38, 184 64, 184 92 C 184 122, 166 142, 120 142 C 74 142, 56 122, 56 92 C 56 64, 72 38, 120 38 Z';
const PATH_HEAD_SHEEN =
  'M 74 50 Q 96 36, 126 40 Q 120 44, 108 50 Q 92 58, 82 72 Q 74 86, 72 100 Q 66 76, 74 50 Z';
const PATH_HEAD_RIM =
  'M 176 70 Q 182 90, 178 110 Q 172 102, 170 92 Q 170 82, 176 70 Z';

export function EveCover({
  icon,
  className,
  iconClassName,
}: {
  icon: React.ReactNode;
  /** Sizing/positioning wrapper classes (the egg scales to this box's height). */
  className?: string;
  /** Classes for the centered emoji (font-size, hover transforms, …). */
  iconClassName?: string;
}) {
  // Unique gradient ids so multiple covers on one page don't collide.
  const id = React.useId().replace(/:/g, '');

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg
        viewBox="40 24 160 134"
        className="h-full w-auto max-w-full"
        style={{ overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          {/* Dome — whiter at the center, faint cool gray at the rim */}
          <radialGradient id={`eh-${id}`} cx="38%" cy="22%" r="95%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#FFFFFF" />
            <stop offset="82%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#D8DEEA" />
          </radialGradient>

          {/* Top sheen */}
          <linearGradient id={`hs-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Eve's signature cyan aura */}
          <radialGradient id={`au-${id}`} cx="50%" cy="52%" r="55%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.30" />
            <stop offset="55%" stopColor="#22D3EE" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </radialGradient>

          {/* Soft contact shadow */}
          <filter id={`sh-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {/* Cyan aura behind the head */}
        <ellipse cx="120" cy="92" rx="104" ry="92" fill={`url(#au-${id})`} />
        {/* Contact shadow under the dome */}
        <ellipse cx="120" cy="150" rx="46" ry="5" fill="#000" opacity="0.12" filter={`url(#sh-${id})`} />
        {/* Dome */}
        <path d={PATH_HEAD} fill={`url(#eh-${id})`} stroke="#C8D0DC" strokeWidth="0.9" />
        {/* Top sheen + right-edge rim light */}
        <path d={PATH_HEAD_SHEEN} fill={`url(#hs-${id})`} />
        <path d={PATH_HEAD_RIM} fill="#FFFFFF" opacity="0.28" />
      </svg>

      {/* Category emoji centered in the dome (aligns with the egg's center) */}
      <span
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center select-none',
          iconClassName,
        )}
      >
        {icon}
      </span>
    </div>
  );
}
