'use client';

import * as React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

export type WalliState = 'idle' | 'wave' | 'spin' | 'tilt' | 'dance' | 'sleep';

interface WalliProps {
  state?: WalliState;
  size?: number;
  className?: string;
  label?: string;
  /** Disable the floor shadow (e.g. when placed inside a card) */
  noShadow?: boolean;
}

/* ============================================================
   Animation system
   ============================================================ */

const CONTAINER: Variants = {
  idle: { rotate: 0, scale: 1, y: 0, transition: { duration: 0.5 } },
  wave: {
    rotate: 0,
    scale: 1,
    y: [0, -3, 0],
    transition: { y: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
  },
  spin: {
    rotate: 360,
    scale: [1, 1.08, 1],
    y: [0, -8, 0],
    transition: {
      rotate: { duration: 0.75, ease: [0.34, 1.56, 0.64, 1] },
      scale: { duration: 0.75, times: [0, 0.5, 1] },
      y: { duration: 0.75, times: [0, 0.4, 1] },
    },
  },
  tilt: { rotate: 0, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 14 } },
  // Dance v2 — side-to-side shimmy with subtle bounces (was a tall vertical hop)
  dance: {
    rotate: [-6, 6, -6, 6, 0],
    scaleX: [1, 1.04, 0.96, 1.04, 1],
    scaleY: [1, 0.96, 1.04, 0.96, 1],
    y: [0, -4, -1, -4, 0],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
  sleep: {
    rotate: 0,
    scale: 1,
    y: [0, -1, 0],
    transition: { y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } },
  },
};

const HEAD: Variants = {
  idle: {
    y: [0, -4, 0],
    rotate: 0,
    transition: { y: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } },
  },
  wave: {
    y: [0, -2, 0],
    rotate: [0, -4, 0, 4, 0],
    transition: {
      y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
      rotate: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  spin: { y: 0, rotate: 0 },
  tilt: { y: -2, rotate: -20, transition: { type: 'spring', stiffness: 220, damping: 11 } },
  // Dance v2 — head counter-rotates against body for shoulder-shimmy effect
  dance: {
    y: [0, -2, 2, -2, 0],
    rotate: [8, -8, 8, -8, 0],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
  sleep: {
    y: [0, -2, 0],
    rotate: -8,
    transition: { y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } },
  },
};

const BODY: Variants = {
  idle: {
    y: [0, -1, 0],
    scaleY: [1, 1.012, 1],
    scaleX: [1, 0.992, 1],
    transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
  },
  wave: {
    y: [0, -1, 0],
    rotate: [-1, 1, -1, 1, 0],
    transition: {
      y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
      rotate: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  spin: { y: 0, rotate: 0 },
  tilt: { rotate: -3, transition: { type: 'spring', stiffness: 180, damping: 14 } },
  // Dance v2 — stronger hip-shake squash/stretch
  dance: {
    scaleX: [1, 1.07, 0.93, 1.07, 1],
    scaleY: [1, 0.93, 1.07, 0.93, 1],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
  sleep: { y: [0, -1, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' } },
};

const RIGHT_ARM: Variants = {
  idle: { rotate: 0 },
  wave: {
    rotate: [0, -75, -45, -75, -45, 0],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 },
  },
  spin: { rotate: 0 },
  tilt: { rotate: 0 },
  // Dance v2 — bigger amplitude swings (was ±30°)
  dance: {
    rotate: [-50, 50, -50, 50, 0],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
  sleep: { rotate: 0 },
};

const LEFT_ARM: Variants = {
  idle: { rotate: 0 },
  wave: { rotate: 0 },
  spin: { rotate: 0 },
  tilt: { rotate: 0 },
  // Dance v2 — opposite phase to right arm
  dance: {
    rotate: [50, -50, 50, -50, 0],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
  sleep: { rotate: 0 },
};

const EYE_SYMM: Variants = {
  idle: { scaleY: 1, scaleX: 1, y: 0 },
  wave: { scaleY: 0.5, scaleX: 1, y: -1 },
  spin: { scaleY: 1, scaleX: 1, y: 0 },
  dance: { scaleY: 0.55, scaleX: 1, y: -1 },
  sleep: { scaleY: 0.06, scaleX: 1, y: 0 },
};

const leftEyeVariants: Variants = {
  ...EYE_SYMM,
  tilt: { scaleY: 1.15, scaleX: 1.08, y: 0 },
};

const rightEyeVariants: Variants = {
  ...EYE_SYMM,
  tilt: { scaleY: 0.78, scaleX: 0.94, y: 0 },
};

const AURA: Variants = {
  idle: {
    opacity: [0.7, 1, 0.7],
    scale: [1, 1.04, 1],
    transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
  },
  wave: {
    opacity: [0.85, 1, 0.85],
    scale: [1, 1.06, 1],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
  spin: { opacity: 1, scale: 1.1, transition: { duration: 0.4 } },
  tilt: { opacity: 0.8, scale: 1, transition: { duration: 0.4 } },
  // Dance v2 — pulses match the new 1.4s rhythm
  dance: {
    opacity: [0.9, 1.15, 0.9, 1.15, 0.9],
    scale: [1, 1.1, 1, 1.1, 1],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
  sleep: { opacity: 0.4, scale: 1, transition: { duration: 0.6 } },
};

export function Walli({
  state = 'idle',
  size = 100,
  className,
  label = 'Walli mascot',
  noShadow = false,
}: WalliProps) {
  const id = React.useId().replace(/:/g, '');
  const [blink, setBlink] = React.useState(false);

  React.useEffect(() => {
    if (state === 'sleep' || state === 'wave' || state === 'dance') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 1800 + Math.random() * 2800;
      timer = setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        setTimeout(() => {
          if (cancelled) return;
          setBlink(false);
          schedule();
        }, 110);
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state]);

  const blinking = blink && state !== 'sleep';

  return (
    <div
      role="img"
      aria-label={label}
      className={cn('relative inline-flex flex-col items-center justify-center', className)}
      style={{ width: size, height: size * 1.05 }}
    >
      <motion.svg
        viewBox="0 0 240 240"
        width={size}
        height={size}
        variants={CONTAINER}
        animate={state}
        initial="idle"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {/* Body */}
          <radialGradient id={`b-${id}`} cx="38%" cy="22%" r="90%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#C8D0DC" />
          </radialGradient>

          {/* Head — whiter, much less gray at the edges */}
          <radialGradient id={`h-${id}`} cx="38%" cy="22%" r="95%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#FFFFFF" />
            <stop offset="82%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#D8DEEA" />
          </radialGradient>

          {/* Head top sheen */}
          <linearGradient id={`hs-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Visor */}
          <radialGradient id={`v-${id}`} cx="50%" cy="35%" r="85%">
            <stop offset="0%" stopColor="#101A2C" />
            <stop offset="50%" stopColor="#020610" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Visor cyan inner reflection */}
          <radialGradient id={`vg-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.20" />
            <stop offset="55%" stopColor="#22D3EE" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </radialGradient>

          {/* Eye fill */}
          <linearGradient id={`e-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ECFEFF" />
            <stop offset="22%" stopColor="#67E8F9" />
            <stop offset="60%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* Eye top highlight */}
          <linearGradient id={`eh-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Aura */}
          <radialGradient id={`a-${id}`} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.30" />
            <stop offset="55%" stopColor="#22D3EE" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </radialGradient>

          {/* Arm */}
          <radialGradient id={`arm-${id}`} cx="40%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E8EDF3" />
            <stop offset="100%" stopColor="#B8C2D1" />
          </radialGradient>

          {/* Eye scanline clip-paths */}
          <clipPath id={`lec-${id}`}>
            <rect x="74" y="68" width="42" height="22" rx="11" ry="11" />
          </clipPath>
          <clipPath id={`rec-${id}`}>
            <rect x="124" y="68" width="42" height="22" rx="11" ry="11" />
          </clipPath>

          {/* Eye glow */}
          <filter id={`g-${id}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft blur for shadows */}
          <filter id={`sh-${id}`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        {/* Aura */}
        <motion.ellipse
          cx="120"
          cy="130"
          rx="120"
          ry="120"
          fill={`url(#a-${id})`}
          variants={AURA}
          animate={state}
          initial="idle"
          style={{ transformOrigin: '120px 130px' }}
        />

        {/* ===== BODY — bigger to balance the smaller head ===== */}
        <motion.g variants={BODY} animate={state} initial="idle" style={{ transformOrigin: '120px 200px' }}>
          {/* Floor contact shadow */}
          <ellipse cx="120" cy="246" rx="48" ry="4.5" fill="#000" opacity="0.22" filter={`url(#sh-${id})`} />

          {/* Left arm */}
          <motion.g variants={LEFT_ARM} animate={state} initial="idle" style={{ transformOrigin: '78px 162px' }}>
            <path
              d="M 78 162 Q 64 170, 60 196 Q 58 220, 68 234 Q 76 240, 82 234 Q 84 220, 82 200 Q 82 178, 86 168 Q 84 162, 78 162 Z"
              fill={`url(#arm-${id})`}
              stroke="#B8C2D1"
              strokeWidth="0.6"
            />
          </motion.g>

          {/* Right arm */}
          <motion.g variants={RIGHT_ARM} animate={state} initial="idle" style={{ transformOrigin: '162px 162px' }}>
            <path
              d="M 162 162 Q 176 170, 180 196 Q 182 220, 172 234 Q 164 240, 158 234 Q 156 220, 158 200 Q 158 178, 154 168 Q 156 162, 162 162 Z"
              fill={`url(#arm-${id})`}
              stroke="#B8C2D1"
              strokeWidth="0.6"
            />
          </motion.g>

          {/* Body — bigger pebble (was 92×84, now 108×92) */}
          <path
            d="M 84 158
               Q 84 152, 92 152
               L 148 152
               Q 156 152, 156 158
               C 168 174, 174 196, 172 216
               C 168 236, 148 244, 120 244
               C 92 244, 72 236, 68 216
               C 66 196, 72 174, 84 158 Z"
            fill={`url(#b-${id})`}
            stroke="#B8C2D1"
            strokeWidth="0.9"
          />

          {/* Body specular highlight */}
          <path
            d="M 90 164
               Q 100 160, 108 164
               Q 98 172, 90 192
               Q 84 214, 86 234
               Q 80 212, 82 188
               Q 84 172, 90 164 Z"
            fill="#FFFFFF"
            opacity="0.55"
          />
        </motion.g>

        {/* ===== HEAD — smaller, whiter ===== */}
        <motion.g variants={HEAD} animate={state} initial="idle" style={{ transformOrigin: '120px 80px' }}>
          {/* Head shadow on body — softer */}
          <ellipse cx="120" cy="148" rx="46" ry="3" fill="#000" opacity="0.13" filter={`url(#sh-${id})`} />

          {/* Head dome — smaller egg (was 180×152, now 156×128) */}
          <path
            d="M 120 16
               C 180 16, 198 52, 198 94
               C 198 128, 178 144, 120 144
               C 62 144, 42 128, 42 94
               C 42 52, 60 16, 120 16 Z"
            fill={`url(#h-${id})`}
            stroke="#C8D0DC"
            strokeWidth="0.9"
          />

          {/* Strong top sheen */}
          <path
            d="M 64 32
               Q 92 16, 128 20
               Q 122 24, 108 30
               Q 90 38, 78 54
               Q 68 72, 64 90
               Q 56 64, 64 32 Z"
            fill={`url(#hs-${id})`}
          />

          {/* Right-side rim light */}
          <path
            d="M 188 60
               Q 194 84, 190 108
               Q 184 100, 182 86
               Q 182 74, 188 60 Z"
            fill="#FFFFFF"
            opacity="0.30"
          />

          {/* Visor inner shadow ring — softer (was 0.55 opacity, now 0.30) */}
          <path
            d="M 48 48
               Q 48 28, 70 24
               L 170 24
               Q 192 28, 192 48
               L 192 108
               Q 192 128, 170 132
               Q 120 140, 70 132
               Q 48 128, 48 108 Z"
            fill="#000"
            opacity="0.30"
          />

          {/* Visor face */}
          <path
            d="M 54 50
               Q 54 32, 74 28
               L 166 28
               Q 186 32, 186 50
               L 186 104
               Q 186 122, 166 126
               Q 120 132, 74 126
               Q 54 122, 54 104 Z"
            fill={`url(#v-${id})`}
          />

          {/* Visor cyan inner glow */}
          <path
            d="M 54 50
               Q 54 32, 74 28
               L 166 28
               Q 186 32, 186 50
               L 186 104
               Q 186 122, 166 126
               Q 120 132, 74 126
               Q 54 122, 54 104 Z"
            fill={`url(#vg-${id})`}
          />

          {/* Visor top diagonal sheen */}
          <path
            d="M 60 44
               Q 80 34, 124 38
               L 116 52
               Q 80 52, 60 60 Z"
            fill="#FFFFFF"
            opacity="0.13"
          />

          {/* Visor bottom subtle sheen */}
          <path
            d="M 64 116
               Q 102 122, 178 116
               L 174 124
               Q 102 130, 64 124 Z"
            fill="#FFFFFF"
            opacity="0.05"
          />

          {/* ===== EYES ===== */}
          {/* Left eye — slightly compacted to fit smaller visor */}
          <motion.g
            variants={leftEyeVariants}
            animate={blinking ? { scaleY: 0.05, scaleX: 1, y: 0 } : state}
            initial="idle"
            transform="rotate(10 95 79)"
            style={{ transformOrigin: '95px 79px' }}
            filter={`url(#g-${id})`}
          >
            <rect x="74" y="68" width="42" height="22" rx="11" ry="11" fill={`url(#e-${id})`} />
            <g clipPath={`url(#lec-${id})`}>
              <rect x="74" y="73" width="42" height="1.5" fill="#FFFFFF" opacity="0.6" />
              <rect x="74" y="79" width="42" height="1.5" fill="#FFFFFF" opacity="0.5" />
              <rect x="74" y="84" width="42" height="1.5" fill="#FFFFFF" opacity="0.4" />
            </g>
            <rect x="74" y="68" width="42" height="12" rx="11" ry="11" fill={`url(#eh-${id})`} />
            <ellipse cx="87" cy="73" rx="6" ry="2" fill="#FFFFFF" opacity="0.92" />
          </motion.g>

          {/* Right eye */}
          <motion.g
            variants={rightEyeVariants}
            animate={blinking ? { scaleY: 0.05, scaleX: 1, y: 0 } : state}
            initial="idle"
            transform="rotate(-10 145 79)"
            style={{ transformOrigin: '145px 79px' }}
            filter={`url(#g-${id})`}
          >
            <rect x="124" y="68" width="42" height="22" rx="11" ry="11" fill={`url(#e-${id})`} />
            <g clipPath={`url(#rec-${id})`}>
              <rect x="124" y="73" width="42" height="1.5" fill="#FFFFFF" opacity="0.6" />
              <rect x="124" y="79" width="42" height="1.5" fill="#FFFFFF" opacity="0.5" />
              <rect x="124" y="84" width="42" height="1.5" fill="#FFFFFF" opacity="0.4" />
            </g>
            <rect x="124" y="68" width="42" height="12" rx="11" ry="11" fill={`url(#eh-${id})`} />
            <ellipse cx="137" cy="73" rx="6" ry="2" fill="#FFFFFF" opacity="0.92" />
          </motion.g>
        </motion.g>
      </motion.svg>

      {/* Floor shadow */}
      {!noShadow && (
        <motion.div
          aria-hidden
          className="rounded-[50%] bg-foreground/15 blur-md"
          animate={
            state === 'idle' || state === 'sleep'
              ? { width: ['54%', '44%', '54%'], opacity: [0.20, 0.10, 0.20] }
              : state === 'dance'
              ? { width: ['46%', '60%', '46%', '60%', '46%'], opacity: [0.14, 0.20, 0.14, 0.20, 0.14] }
              : state === 'spin'
              ? { width: ['52%', '58%', '52%'], opacity: [0.16, 0.22, 0.16] }
              : { width: '50%', opacity: 0.16 }
          }
          transition={{
            duration: state === 'dance' ? 1.4 : state === 'spin' ? 0.75 : 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ height: size * 0.045, marginTop: -size * 0.04 }}
        />
      )}
    </div>
  );
}
