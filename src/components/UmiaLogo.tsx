import React from 'react';

export interface UmiaLogoProps {
  className?: string;
  size?: number;
  variant?: 'color' | 'white' | 'dark' | 'badge';
  withGlow?: boolean;
}

/**
 * Umia Decision Market Logo
 * Depicts the futarchy decision branching:
 * - Left branch: Status Quo (No-Op baseline)
 * - Right branch: Winning conditional proposal path
 * - Focal node: Base network settlement / consensus point
 * Forming the unified signature 'U' lettermark.
 */
export const UmiaLogo: React.FC<UmiaLogoProps> = ({
  className = 'w-8 h-8',
  size,
  variant = 'color',
  withGlow = true,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  // Unique ID prefix to avoid SVG gradient collisions if multiple logos exist
  const id = React.useId().replace(/:/g, '');

  if (variant === 'badge') {
    return (
      <div
        style={style}
        className={`relative rounded-xl bg-slate-900/90 border border-white/15 p-1.5 flex items-center justify-center shadow-lg shadow-black/40 ${className}`}
      >
        <UmiaLogo variant="color" withGlow={withGlow} className="w-full h-full" />
      </div>
    );
  }

  const isWhite = variant === 'white';
  const isDark = variant === 'dark';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={`shrink-0 select-none ${className}`}
      aria-label="Umia Logo"
    >
      <defs>
        {/* Futarchy Emerald Gradient */}
        <linearGradient id={`emeraldGrad-${id}`} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="60%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Base Cyan Gradient */}
        <linearGradient id={`cyanGrad-${id}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Unifying Bridging Gradient */}
        <linearGradient id={`bridgeGrad-${id}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* White Monochrome Gradients */}
        <linearGradient id={`whiteGrad1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`whiteGrad2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.75" />
        </linearGradient>

        {/* Soft Ambient Glow Filter */}
        {withGlow && !isWhite && (
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      <g filter={withGlow && !isWhite ? `url(#glow-${id})` : undefined}>
        {/* Left 'U' Branch: Status Quo / Baseline */}
        <path
          d="M 28 26 
             C 28 26, 38 28, 42 42
             C 45 53, 40 68, 28 68
             C 18 68, 14 55, 14 42
             L 14 26 
             C 14 26, 24 26, 28 26 Z"
          fill={isWhite ? `url(#whiteGrad1-${id})` : isDark ? '#0f172a' : `url(#emeraldGrad-${id})`}
          opacity={isWhite ? 0.95 : 1}
        />

        {/* Inner Arc of Left Pillar */}
        <path
          d="M 26 34
             C 26 34, 32 38, 34 46
             C 36 54, 32 62, 26 62
             L 26 34 Z"
          fill={isWhite ? '#ffffff' : isDark ? '#334155' : '#6ee7b7'}
          opacity={0.35}
        />

        {/* Base Foundation Crossbar / Swelling Loop */}
        <path
          d="M 10 70
             C 10 67, 12 65, 15 65
             L 42 65
             C 54 65, 62 57, 65 48
             C 68 39, 68 28, 78 26
             C 84 25, 87 29, 87 31
             C 87 31, 80 32, 76 40
             C 72 49, 68 62, 54 70
             C 44 76, 30 76, 15 76
             C 12 76, 10 73, 10 70 Z"
          fill={isWhite ? `url(#whiteGrad2-${id})` : isDark ? '#1e293b' : `url(#bridgeGrad-${id})`}
        />

        {/* Right 'U' Branch: Elevated Decision Premium Vector */}
        <path
          d="M 52 64
             C 60 58, 68 47, 72 38
             C 74 33, 76 29, 84 27
             L 84 32
             C 77 34, 73 40, 71 47
             C 67 61, 58 72, 45 74
             L 52 64 Z"
          fill={isWhite ? `url(#whiteGrad1-${id})` : isDark ? '#0284c7' : `url(#cyanGrad-${id})`}
        />

        {/* Secondary Ascending Wing on Right */}
        <path
          d="M 76 34
             C 80 33, 84 34, 84 34
             C 84 34, 81 48, 77 56
             C 74 62, 69 68, 61 74
             C 67 68, 73 58, 76 48
             C 78 40, 76 34, 76 34 Z"
          fill={isWhite ? '#ffffff' : isDark ? '#38bdf8' : `url(#cyanGrad-${id})`}
          opacity={isWhite ? 0.75 : 0.85}
        />

        {/* Central Decision Settlement Core / Consensus Node */}
        <circle
          cx="62"
          cy="49"
          r="4.5"
          fill={isWhite ? '#ffffff' : '#ffffff'}
          stroke={isWhite ? '#0f172a' : '#10b981'}
          strokeWidth="1.5"
        />

        {/* Glowing Center Pupil of Settlement Node */}
        <circle
          cx="62"
          cy="49"
          r="2"
          fill={isWhite ? '#94a3b8' : '#67e8f9'}
        />
      </g>
    </svg>
  );
};
