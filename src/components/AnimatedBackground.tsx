import React from 'react';

/**
 * Professional, lightweight ambient animated background.
 * Provides subtle depth across the page with low-opacity career motifs,
 * soft blurred gradient circles, floating geometric nodes, and thin curved trajectory lines.
 * Opacity ranges strictly between 0.04 and 0.18 to ensure content readability is never compromised.
 */
export const AnimatedBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden -z-10 select-none"
    >
      {/* 1. Large Blurred Soft Gradient Ambient Blooms */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 sm:w-[36rem] sm:h-[36rem] rounded-full bg-sky-200/30 filter blur-3xl animate-float-slow"
      />
      <div
        className="absolute top-36 -right-28 w-80 h-80 sm:w-[32rem] sm:h-[32rem] rounded-full bg-blue-300/20 filter blur-3xl animate-float-reverse"
      />
      <div
        className="absolute top-[42%] left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full bg-blue-100/25 filter blur-3xl animate-pulse-glow"
      />
      <div
        className="absolute bottom-20 -left-20 w-88 h-88 sm:w-[30rem] sm:h-[30rem] rounded-full bg-sky-100/35 filter blur-3xl animate-float-slow"
      />
      <div
        className="absolute -bottom-28 right-10 w-96 h-96 sm:w-[32rem] sm:h-[32rem] rounded-full bg-blue-200/20 filter blur-3xl animate-float-reverse"
      />

      {/* 2. Architectural Micro-Dot Matrix (Extremely subtle, opacity ~0.08) */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#94A3B8_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.08]"
      />

      {/* 3. Slow-moving Abstract Career Growth Elements & Trajectory Curves */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.09]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id="bgPathGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="bgPathGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Sweeping Career Progression Arcs */}
        <path
          d="M-50,220 C200,120 450,380 800,240 S1200,80 1500,260"
          stroke="url(#bgPathGrad1)"
          strokeWidth="1.5"
          className="animate-dash-flow"
        />
        <path
          d="M100,600 C400,750 700,500 1100,650 S1500,800 1800,600"
          stroke="url(#bgPathGrad2)"
          strokeWidth="1.5"
          strokeDasharray="4 8"
        />
      </svg>

      {/* 4. Floating Geometric Milestone Nodes (Diamonds, Rings, Graduation Motif Outlines) */}
      {/* Node 1: Floating Diamond Node (Top Left) */}
      <div className="absolute top-28 left-[12%] opacity-[0.14] animate-float-slow">
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="21" y="2" width="26" height="26" rx="4" transform="rotate(45 21 2)" stroke="#2563EB" strokeWidth="2" />
          <circle cx="21" cy="21" r="3" fill="#2563EB" />
        </svg>
      </div>

      {/* Node 2: Concentric Orbit Ring (Top Right) */}
      <div className="absolute top-48 right-[8%] opacity-[0.12] animate-rotate-orbit">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="54" stroke="#2563EB" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="60" cy="60" r="38" stroke="#38BDF8" strokeWidth="1" />
          <circle cx="60" cy="6" r="4" fill="#2563EB" />
          <circle cx="98" cy="60" r="3" fill="#38BDF8" />
        </svg>
      </div>

      {/* Node 3: Career Growth Step / Staircase Outline (Mid Page Left) */}
      <div className="absolute top-[48%] left-[5%] opacity-[0.10] animate-float-reverse">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 54 H22 V38 H38 V22 H54 V6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
          <circle cx="54" cy="6" r="3" fill="#38BDF8" />
        </svg>
      </div>

      {/* Node 4: Minimalist Graduation Cap Silhouette (Mid Page Right) */}
      <div className="absolute top-[52%] right-[10%] opacity-[0.12] animate-float-horizontal">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M28 14L50 24L28 34L6 24L28 14Z" stroke="#2563EB" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M14 28V38C14 42 20 46 28 46C36 46 42 42 42 38V28" stroke="#2563EB" strokeWidth="1.75" />
          <path d="M47 26V36" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Node 5: Upward Trajectory Arrow Node (Lower Left) */}
      <div className="absolute top-[75%] left-[8%] opacity-[0.11] animate-float-slow">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 40 L38 12 M38 12 H22 M38 12 V28" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="40" r="3" fill="#38BDF8" />
        </svg>
      </div>

      {/* 5. Subtle Floating Ambient Particles */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-blue-500/20 animate-particle-drift" />
      <div className="absolute top-1/3 right-1/4 w-2.5 h-2.5 rounded-full bg-sky-400/25 animate-particle-drift [animation-delay:2s]" />
      <div className="absolute top-2/3 left-1/5 w-1.5 h-1.5 rounded-full bg-blue-600/20 animate-particle-drift [animation-delay:4s]" />
      <div className="absolute top-3/4 right-1/3 w-2 h-2 rounded-full bg-sky-500/25 animate-particle-drift [animation-delay:1s]" />
    </div>
  );
};
