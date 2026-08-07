'use client';

import * as React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

export type WalleState = 'idle' | 'wave' | 'spin' | 'tilt' | 'dance' | 'sleep';

interface WalleProps {
  state?: WalleState;
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
  // Correct-answer celebration — crouch, joyful jump with arms up, smile, land, settle
  spin: {
    scaleY: [1, 0.85, 1.1, 1.0, 0.92, 1],
    scaleX: [1, 1.1, 0.92, 1.0, 1.06, 1],
    y: [0, 6, -14, -8, 0, 0],
    rotate: [0, 0, 3, -2, 0, 0],
    transition: {
      duration: 1.0,
      times: [0, 0.15, 0.4, 0.65, 0.85, 1],
      ease: 'easeInOut',
    },
  },
  tilt: { rotate: 0, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 14 } },
  // Dance — gentle groove (toned down from prior version)
  dance: {
    rotate: [-3, 3, -3, 3, 0],
    scaleX: [1, 1.02, 0.98, 1.02, 1],
    scaleY: [1, 0.98, 1.02, 0.98, 1],
    y: [0, -1.5, 0, -1.5, 0],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
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
  // Correct-answer celebration — head bobs through the jump, tilts excitedly mid-air
  spin: {
    y: [0, 2, -3, -2, 1, 0],
    rotate: [0, 0, -6, 4, 0, 0],
    transition: {
      duration: 1.0,
      times: [0, 0.15, 0.4, 0.65, 0.85, 1],
      ease: 'easeInOut',
    },
  },
  tilt: { y: -2, rotate: -20, transition: { type: 'spring', stiffness: 220, damping: 11 } },
  // Dance — small head counter-bob
  dance: {
    y: [0, -1, 1, -1, 0],
    rotate: [4, -4, 4, -4, 0],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
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
  // Correct-answer celebration — body squashes for jump, stretches at peak, lands compressed
  spin: {
    scaleY: [1, 0.92, 1.06, 1.0, 0.94, 1],
    scaleX: [1, 1.06, 0.94, 1.0, 1.04, 1],
    transition: {
      duration: 1.0,
      times: [0, 0.15, 0.4, 0.65, 0.85, 1],
      ease: 'easeInOut',
    },
  },
  tilt: { rotate: -3, transition: { type: 'spring', stiffness: 180, damping: 14 } },
  // Dance — light hip sway
  dance: {
    scaleX: [1, 1.03, 0.97, 1.03, 1],
    scaleY: [1, 0.97, 1.03, 0.97, 1],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
  sleep: { y: [0, -1, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' } },
};

const RIGHT_ARM: Variants = {
  idle: { rotate: 0 },
  wave: {
    rotate: [0, -75, -45, -75, -45, 0],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 },
  },
  // Correct-answer celebration — arm raised triumphantly at peak, lowers back
  spin: {
    rotate: [0, 0, -85, -55, -20, 0],
    transition: {
      duration: 1.0,
      times: [0, 0.15, 0.4, 0.65, 0.85, 1],
      ease: 'easeInOut',
    },
  },
  tilt: { rotate: 0 },
  // Dance — small arm sway
  dance: {
    rotate: [-15, 15, -15, 15, 0],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
  sleep: { rotate: 0 },
};

const LEFT_ARM: Variants = {
  idle: { rotate: 0 },
  wave: { rotate: 0 },
  // Correct-answer celebration — opposite arm also raises (both arms up)
  spin: {
    rotate: [0, 0, 85, 55, 20, 0],
    transition: {
      duration: 1.0,
      times: [0, 0.15, 0.4, 0.65, 0.85, 1],
      ease: 'easeInOut',
    },
  },
  tilt: { rotate: 0 },
  // Dance — opposite small sway
  dance: {
    rotate: [15, -15, 15, -15, 0],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
  sleep: { rotate: 0 },
};

const EYE_SYMM: Variants = {
  idle: { scaleY: 1, scaleX: 1, y: 0 },
  wave: { scaleY: 0.5, scaleX: 1, y: -1 },
  // Correct-answer celebration — eyes squint into smile during the airborne joy
  spin: {
    scaleY: [1, 1, 0.5, 0.55, 0.75, 1],
    scaleX: [1, 1, 1.1, 1.08, 1.04, 1],
    y: [0, 0, -1.5, -1, -0.5, 0],
    transition: {
      duration: 1.0,
      times: [0, 0.15, 0.4, 0.65, 0.85, 1],
      ease: 'easeInOut',
    },
  },
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

/* ============================================================
   Path data — kept as single-line constants so SSR and CSR emit
   identical `d` attribute strings. Multi-line template strings
   inside JSX attributes triggered hydration mismatches under
   Next.js 16 / Turbopack (whitespace normalized differently on
   the server vs. the client).
   ============================================================ */

const PATH_BODY =
  'M 84 158 Q 84 152, 92 152 L 148 152 Q 156 152, 156 158 C 168 174, 174 196, 172 216 C 168 236, 148 244, 120 244 C 92 244, 72 236, 68 216 C 66 196, 72 174, 84 158 Z';
const PATH_BODY_HIGHLIGHT =
  'M 90 164 Q 100 160, 108 164 Q 98 172, 90 192 Q 84 214, 86 234 Q 80 212, 82 188 Q 84 172, 90 164 Z';
const PATH_HEAD =
  'M 120 38 C 168 38, 184 64, 184 92 C 184 122, 166 142, 120 142 C 74 142, 56 122, 56 92 C 56 64, 72 38, 120 38 Z';
const PATH_HEAD_SHEEN =
  'M 74 50 Q 96 36, 126 40 Q 120 44, 108 50 Q 92 58, 82 72 Q 74 86, 72 100 Q 66 76, 74 50 Z';
const PATH_HEAD_RIM =
  'M 176 70 Q 182 90, 178 110 Q 172 102, 170 92 Q 170 82, 176 70 Z';
const PATH_VISOR_SHADOW =
  'M 68 78 C 68 58, 86 50, 120 50 C 154 50, 172 58, 172 78 C 172 100, 154 110, 120 110 C 86 110, 68 100, 68 78 Z';
const PATH_VISOR =
  'M 72 78 C 72 62, 88 54, 120 54 C 152 54, 168 62, 168 78 C 168 96, 152 104, 120 104 C 88 104, 72 96, 72 78 Z';
const PATH_VISOR_TOP =
  'M 88 62 Q 104 56, 134 58 Q 116 64, 94 68 Q 88 66, 88 62 Z';
const PATH_VISOR_BOTTOM =
  'M 92 95 Q 120 99, 150 95 Q 132 102, 110 102 Q 96 100, 92 95 Z';

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
  // Correct-answer celebration — bright burst at peak, settles back
  spin: {
    opacity: [0.7, 0.5, 1.3, 1.1, 0.9, 0.7],
    scale: [1, 0.9, 1.25, 1.15, 1.05, 1],
    transition: {
      duration: 1.0,
      times: [0, 0.15, 0.4, 0.65, 0.85, 1],
      ease: 'easeInOut',
    },
  },
  tilt: { opacity: 0.8, scale: 1, transition: { duration: 0.4 } },
  // Dance — gentle aura pulse
  dance: {
    opacity: [0.85, 1.05, 0.85, 1.05, 0.85],
    scale: [1, 1.05, 1, 1.05, 1],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
  sleep: { opacity: 0.4, scale: 1, transition: { duration: 0.6 } },
};

export function Walle({
  state = 'idle',
  size = 100,
  className,
  label = 'Walle mascot',
  noShadow = false,
}: WalleProps) {
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

          {/* Eye scanline clip-paths — elliptical to match Eve's eye shape */}
          <clipPath id={`lec-${id}`}>
            <ellipse cx="102" cy="78" rx="14" ry="10" />
          </clipPath>
          <clipPath id={`rec-${id}`}>
            <ellipse cx="138" cy="78" rx="14" ry="10" />
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
            d={PATH_BODY}
            fill={`url(#b-${id})`}
            stroke="#B8C2D1"
            strokeWidth="0.9"
          />

          {/* Body specular highlight */}
          <path d={PATH_BODY_HIGHLIGHT} fill="#FFFFFF" opacity="0.55" />
        </motion.g>

        {/* ===== HEAD — smaller for proper Eve proportions ===== */}
        <motion.g variants={HEAD} animate={state} initial="idle" style={{ transformOrigin: '120px 90px' }}>
          {/* Head shadow on body */}
          <ellipse cx="120" cy="146" rx="42" ry="2.8" fill="#000" opacity="0.13" filter={`url(#sh-${id})`} />

          {/* Head dome — shrunk ~15% (now 132×106, was 156×128) */}
          <path
            d={PATH_HEAD}
            fill={`url(#h-${id})`}
            stroke="#C8D0DC"
            strokeWidth="0.9"
          />

          {/* Top sheen — re-positioned for smaller head */}
          <path d={PATH_HEAD_SHEEN} fill={`url(#hs-${id})`} />

          {/* Right-side rim light */}
          <path d={PATH_HEAD_RIM} fill="#FFFFFF" opacity="0.28" />

          {/* Visor inner shadow ring — egg-shape mirrors head silhouette */}
          <path d={PATH_VISOR_SHADOW} fill="#000" opacity="0.30" />

          {/* Visor face — same egg-shape as head, smaller */}
          <path d={PATH_VISOR} fill={`url(#v-${id})`} />

          {/* Visor cyan inner glow */}
          <path d={PATH_VISOR} fill={`url(#vg-${id})`} />

          {/* Visor top sheen — follows the egg's top curve */}
          <path d={PATH_VISOR_TOP} fill="#FFFFFF" opacity="0.14" />

          {/* Visor bottom subtle sheen */}
          <path d={PATH_VISOR_BOTTOM} fill="#FFFFFF" opacity="0.05" />

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
              ? { width: ['50%', '54%', '50%', '54%', '50%'], opacity: [0.16, 0.20, 0.16, 0.20, 0.16] }
              : state === 'spin'
              ? { width: ['52%', '60%', '32%', '38%', '60%', '52%'], opacity: [0.16, 0.24, 0.06, 0.10, 0.22, 0.16] }
              : { width: '50%', opacity: 0.16 }
          }
          transition={{
            duration: state === 'dance' ? 1.6 : state === 'spin' ? 1.0 : 4,
            times: state === 'spin' ? [0, 0.15, 0.4, 0.65, 0.85, 1] : undefined,
            repeat: state === 'spin' ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          style={{ height: size * 0.045, marginTop: -size * 0.04 }}
        />
      )}
    </div>
  );
}
