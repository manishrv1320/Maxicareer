import React from 'react';

/**
 * High-performance, lightweight background graphic components for major sections.
 * Designed with strict low-opacity rules (0.05 - 0.20) to maintain WCAG contrast and readability.
 */

// -------------------------------------------------------------
// 1. HERO SECTION BACKGROUND
// -------------------------------------------------------------
export const HeroBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10"
    >
      {/* Soft Blue Gradient Blobs */}
      <div className="absolute -top-24 left-1/4 w-[38rem] h-[38rem] rounded-full bg-gradient-to-br from-blue-400/15 via-sky-300/10 to-transparent filter blur-3xl animate-pulse-glow" />
      <div className="absolute top-1/3 -right-20 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-sky-400/12 to-blue-600/10 filter blur-3xl animate-float-slow" />
      <div className="absolute -bottom-10 left-10 w-[28rem] h-[28rem] rounded-full bg-blue-100/30 filter blur-2xl animate-float-reverse" />

      {/* Large Transparent Abstract SVG Illustration: Career Growth, Staircase, Graph & Network */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.14]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="heroLineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="heroStairsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Career Growth Ascending Staircase / Isometric Blocks */}
        <g transform="translate(180, 480)" className="animate-float-slow">
          {/* Step 1 */}
          <path d="M0 120 L80 80 L160 120 L80 160 Z" fill="url(#heroStairsGrad)" stroke="#2563EB" strokeWidth="1.5" />
          <path d="M0 120 V160 L80 200 V160 Z" fill="#2563EB" fillOpacity="0.15" stroke="#2563EB" strokeWidth="1.5" />
          <path d="M80 160 V200 L160 160 V120 Z" fill="#38BDF8" fillOpacity="0.2" stroke="#2563EB" strokeWidth="1.5" />

          {/* Step 2 */}
          <path d="M80 40 L160 0 L240 40 L160 80 Z" fill="url(#heroStairsGrad)" stroke="#2563EB" strokeWidth="1.5" />
          <path d="M80 40 V80 L160 120 V80 Z" fill="#2563EB" fillOpacity="0.15" stroke="#2563EB" strokeWidth="1.5" />
          <path d="M160 80 V120 L240 80 V40 Z" fill="#38BDF8" fillOpacity="0.2" stroke="#2563EB" strokeWidth="1.5" />

          {/* Step 3 */}
          <path d="M160 -40 L240 -80 L320 -40 L240 0 Z" fill="url(#heroStairsGrad)" stroke="#2563EB" strokeWidth="1.5" />
          <path d="M160 -40 V0 L240 40 V0 Z" fill="#2563EB" fillOpacity="0.15" stroke="#2563EB" strokeWidth="1.5" />
          <path d="M240 0 V40 L320 0 V-40 Z" fill="#38BDF8" fillOpacity="0.2" stroke="#2563EB" strokeWidth="1.5" />
        </g>

        {/* Upward Growth Curved Trajectory with Animated Dash */}
        <path
          d="M80 720 C 350 680, 500 450, 750 380 C 1000 310, 1150 180, 1380 140"
          stroke="url(#heroLineGrad)"
          strokeWidth="2.5"
          className="animate-dash-flow"
        />

        {/* Secondary Supporting Curved Arc */}
        <path
          d="M40 580 C 280 500, 600 620, 920 440 S 1300 280, 1420 300"
          stroke="#93C5FD"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Milestone Nodes Along Trajectory */}
        <g transform="translate(420, 540)">
          <circle cx="0" cy="0" r="14" stroke="#2563EB" strokeWidth="1.5" fill="#EFF6FF" />
          <circle cx="0" cy="0" r="5" fill="#2563EB" />
          <line x1="0" y1="0" x2="60" y2="-40" stroke="#93C5FD" strokeWidth="1" strokeDasharray="3 3" />
        </g>

        <g transform="translate(750, 380)">
          <circle cx="0" cy="0" r="18" stroke="#38BDF8" strokeWidth="2" fill="#EFF6FF" />
          <circle cx="0" cy="0" r="7" fill="#38BDF8" />
          <circle cx="0" cy="0" r="28" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" className="animate-rotate-orbit" />
        </g>

        <g transform="translate(1120, 230)">
          <circle cx="0" cy="0" r="16" stroke="#2563EB" strokeWidth="2" fill="#EFF6FF" />
          <polygon points="0,-6 6,4 -6,4" fill="#2563EB" />
        </g>

        {/* Mentorship Network Constellation (Connecting lines and hubs) */}
        <g transform="translate(850, 180)" className="animate-float-reverse">
          <line x1="0" y1="0" x2="80" y2="60" stroke="#93C5FD" strokeWidth="1.2" />
          <line x1="80" y1="60" x2="150" y2="10" stroke="#93C5FD" strokeWidth="1.2" />
          <line x1="80" y1="60" x2="110" y2="120" stroke="#93C5FD" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="6" fill="#2563EB" />
          <circle cx="80" cy="60" r="9" fill="#38BDF8" />
          <circle cx="150" cy="10" r="5" fill="#2563EB" />
          <circle cx="110" cy="120" r="7" fill="#2563EB" />
        </g>

        {/* Floating Minimal Graduation Cap Silhouette */}
        <g transform="translate(680, 160)" className="animate-float-slow">
          <path d="M0 0 L40 -18 L80 0 L40 18 Z" stroke="#2563EB" strokeWidth="2" fill="#EFF6FF" fillOpacity="0.4" />
          <path d="M20 9 V26 C20 32 30 38 40 38 C50 38 60 32 60 26 V9" stroke="#2563EB" strokeWidth="1.75" />
          <path d="M75 3 V22" stroke="#38BDF8" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="75" cy="24" r="2.5" fill="#38BDF8" />
        </g>

        {/* Floating Document / Certification Glyph */}
        <g transform="translate(220, 240)" className="animate-float-reverse">
          <rect x="0" y="0" width="34" height="44" rx="4" stroke="#2563EB" strokeWidth="1.5" fill="#EFF6FF" fillOpacity="0.5" />
          <line x1="7" y1="12" x2="27" y2="12" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
          <line x1="7" y1="20" x2="27" y2="20" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
          <line x1="7" y1="28" x2="19" y2="28" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
          <circle cx="25" cy="32" r="4" fill="#2563EB" />
        </g>
      </svg>

      {/* Floating Concentric Circular Orbit Rings */}
      <div className="absolute top-20 right-1/3 w-64 h-64 opacity-[0.10] animate-rotate-orbit">
        <svg viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="90" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="8 8" />
          <circle cx="100" cy="100" r="60" stroke="#38BDF8" strokeWidth="1" />
          <circle cx="100" cy="10" r="5" fill="#2563EB" />
          <circle cx="160" cy="100" r="4" fill="#38BDF8" />
        </svg>
      </div>

      {/* Slowly Floating Micro-particles */}
      <div className="absolute top-1/4 left-[15%] w-2 h-2 rounded-full bg-blue-500/30 animate-particle-drift" />
      <div className="absolute top-1/2 left-[30%] w-3 h-3 rounded-full bg-sky-400/25 animate-particle-drift [animation-delay:2s]" />
      <div className="absolute top-1/3 right-[20%] w-2.5 h-2.5 rounded-full bg-blue-600/25 animate-particle-drift [animation-delay:3.5s]" />
      <div className="absolute bottom-1/4 right-[35%] w-2 h-2 rounded-full bg-sky-500/30 animate-particle-drift [animation-delay:1.2s]" />
    </div>
  );
};

// -------------------------------------------------------------
// 2. ABOUT SECTION BACKGROUND (Plain, clean background)
// -------------------------------------------------------------
export const AboutBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10 bg-slate-50/50"
    />
  );
};

// -------------------------------------------------------------
// 3. SERVICES SECTION BACKGROUND (Plain, clean background)
// -------------------------------------------------------------
export const ServicesBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10 bg-white"
    />
  );
};

// -------------------------------------------------------------
// 4. WHY CHOOSE US SECTION BACKGROUND (Plain, clean background)
// -------------------------------------------------------------
export const WhyChooseUsBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10 bg-slate-50/60"
    />
  );
};

// -------------------------------------------------------------
// 5. HOW IT WORKS SECTION BACKGROUND (Plain, clean background)
// -------------------------------------------------------------
export const HowItWorksBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10 bg-white"
    />
  );
};

// -------------------------------------------------------------
// 6. BENEFITS SECTION BACKGROUND (Plain, clean background)
// -------------------------------------------------------------
export const BenefitsBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10 bg-slate-50/50"
    />
  );
};

// -------------------------------------------------------------
// 7. CTA SECTION BACKGROUND
// -------------------------------------------------------------
export const CTABackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10 bg-[#1E293B]"
    />
  );
};

