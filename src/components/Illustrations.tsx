import React from 'react';

/**
 * High-fidelity inline SVG illustrations
 * Completely self-contained: No external HTTP calls, no binary file downloads, works in any sandbox.
 */

export const HeroIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 540 420"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-auto drop-shadow-md select-none ${className}`}
    aria-label="Maxicareer Career Guidance and Mentorship Interactive Roadmap"
  >
    <defs>
      <linearGradient id="heroGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EFF6FF" />
        <stop offset="100%" stopColor="#DBEAFE" />
      </linearGradient>
      <linearGradient id="heroCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F8FAFC" />
      </linearGradient>
      <linearGradient id="heroBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <linearGradient id="heroAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>
      <filter id="heroShadow" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0F172A" floodOpacity="0.08" />
      </filter>
      <filter id="heroCardShadow" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#2563EB" floodOpacity="0.15" />
      </filter>
    </defs>

    {/* Background Board */}
    <rect x="25" y="25" width="490" height="370" rx="24" fill="url(#heroGradBg)" stroke="#BFDBFE" strokeWidth="2" />

    {/* Header Navigation Bar Simulation */}
    <rect x="25" y="25" width="490" height="48" rx="24" fill="#FFFFFF" fillOpacity="0.8" />
    <circle cx="55" cy="49" r="6" fill="#EF4444" />
    <circle cx="73" cy="49" r="6" fill="#F59E0B" />
    <circle cx="91" cy="49" r="6" fill="#10B981" />
    <rect x="130" y="41" width="160" height="16" rx="8" fill="#E2E8F0" />
    <rect x="420" y="37" width="75" height="24" rx="8" fill="#2563EB" />
    <circle cx="435" cy="49" r="4" fill="#FFFFFF" />
    <rect x="445" y="46" width="35" height="6" rx="3" fill="#FFFFFF" />

    {/* Central Pathway Curves */}
    <path
      d="M80 310 C 140 310, 160 210, 240 210 C 320 210, 340 120, 440 120"
      stroke="#93C5FD"
      strokeWidth="6"
      strokeDasharray="8 8"
      strokeLinecap="round"
    />
    <path
      d="M80 310 C 140 310, 160 210, 240 210"
      stroke="#2563EB"
      strokeWidth="6"
      strokeLinecap="round"
    />

    {/* Milestones along the path */}
    <g transform="translate(80, 310)">
      <circle cx="0" cy="0" r="16" fill="#2563EB" />
      <circle cx="0" cy="0" r="8" fill="#FFFFFF" />
      <rect x="-40" y="24" width="80" height="20" rx="6" fill="#FFFFFF" filter="url(#heroCardShadow)" />
      <text x="0" y="38" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Discovery</text>
    </g>

    <g transform="translate(240, 210)">
      <circle cx="0" cy="0" r="18" fill="#38BDF8" />
      <circle cx="0" cy="0" r="9" fill="#FFFFFF" />
      <rect x="-48" y="24" width="96" height="20" rx="6" fill="#FFFFFF" filter="url(#heroCardShadow)" />
      <text x="0" y="38" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Skill Mastery</text>
    </g>

    <g transform="translate(440, 120)">
      <circle cx="0" cy="0" r="22" fill="#10B981" />
      <circle cx="0" cy="0" r="11" fill="#FFFFFF" />
      <path d="M-6 -1 L -2 4 L 7 -5" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="-48" y="28" width="96" height="20" rx="6" fill="#0F172A" />
      <text x="0" y="42" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Dream Role</text>
    </g>

    {/* Floating Card: 1-on-1 Mentorship */}
    <g transform="translate(55, 110)" filter="url(#heroShadow)">
      <rect width="180" height="88" rx="14" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="14" y="14" width="36" height="36" rx="10" fill="url(#heroBlueGrad)" />
      <circle cx="32" cy="28" r="7" fill="#FFFFFF" />
      <path d="M22 43 C 22 37, 42 37, 42 43" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <text x="58" y="28" fill="#0F172A" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Expert Mentorship</text>
      <text x="58" y="42" fill="#64748B" fontSize="10" fontFamily="sans-serif">Direct 1-on-1 Guidance</text>
      <rect x="14" y="60" width="152" height="12" rx="4" fill="#EFF6FF" />
      <rect x="14" y="60" width="110" height="12" rx="4" fill="#2563EB" />
      <text x="175" y="70" textAnchor="end" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">85%</text>
    </g>

    {/* Floating Card: Career Readiness */}
    <g transform="translate(290, 250)" filter="url(#heroShadow)">
      <rect width="195" height="95" rx="14" fill="#FFFFFF" stroke="#E2E8F0" />
      <circle cx="32" cy="35" r="16" fill="#EFF6FF" />
      <path d="M26 35 L 30 39 L 39 30" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
      <text x="56" y="30" fill="#0F172A" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Interview Mastery</text>
      <text x="56" y="44" fill="#64748B" fontSize="10" fontFamily="sans-serif">Resume &amp; Technical Drills</text>
      <rect x="16" y="62" width="60" height="18" rx="6" fill="#DCFCE7" />
      <text x="46" y="75" textAnchor="middle" fill="#15803D" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Job Ready</text>
      <rect x="82" y="62" width="95" height="18" rx="6" fill="#F1F5F9" />
      <text x="129" y="75" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold" fontFamily="sans-serif">ATS Optimized</text>
    </g>
  </svg>
);

export const MentorIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 500 380"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-auto drop-shadow-md select-none ${className}`}
    aria-label="Maxicareer Mentor and Student Collaboration"
  >
    <defs>
      <linearGradient id="mGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#EFF6FF" />
      </linearGradient>
      <linearGradient id="mBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <filter id="mShadow" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.08" />
      </filter>
    </defs>

    {/* Card Canvas */}
    <rect x="15" y="15" width="470" height="350" rx="20" fill="url(#mGradBg)" stroke="#E2E8F0" strokeWidth="1.5" />

    {/* Video Session Frame */}
    <rect x="40" y="40" width="420" height="230" rx="14" fill="#0F172A" />

    {/* Two Split Video Feeds */}
    {/* Left: Mentor Screen */}
    <rect x="52" y="52" width="192" height="170" rx="10" fill="#1E293B" stroke="#334155" />
    <circle cx="148" cy="115" r="30" fill="#2563EB" />
    <circle cx="148" cy="105" r="14" fill="#FFFFFF" />
    <path d="M130 135 C 130 125, 166 125, 166 135" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <rect x="62" y="192" width="70" height="20" rx="5" fill="#0F172A" fillOpacity="0.8" />
    <text x="97" y="206" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Senior Mentor</text>

    {/* Right: Student Screen */}
    <rect x="256" y="52" width="192" height="170" rx="10" fill="#1E293B" stroke="#334155" />
    <circle cx="352" cy="115" r="30" fill="#38BDF8" />
    <circle cx="352" cy="105" r="14" fill="#FFFFFF" />
    <path d="M334 135 C 334 125, 370 125, 370 135" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <rect x="266" y="192" width="55" height="20" rx="5" fill="#0F172A" fillOpacity="0.8" />
    <text x="293" y="206" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Student</text>

    {/* Live Meeting Controls Pill */}
    <rect x="180" y="235" width="140" height="28" rx="14" fill="#1E293B" stroke="#475569" />
    <circle cx="205" cy="249" r="6" fill="#10B981" />
    <circle cx="230" cy="249" r="6" fill="#38BDF8" />
    <circle cx="255" cy="249" r="6" fill="#EF4444" />
    <circle cx="280" cy="249" r="6" fill="#94A3B8" />

    {/* Bottom Status & Feedback Banner */}
    <g transform="translate(40, 285)" filter="url(#mShadow)">
      <rect width="420" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0" />
      <circle cx="32" cy="30" r="14" fill="#DCFCE7" />
      <path d="M26 30 L 30 34 L 38 26" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="56" y="26" fill="#0F172A" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Session Completed: Portfolio Review</text>
      <text x="56" y="42" fill="#64748B" fontSize="10" fontFamily="sans-serif">Action item: Finalize full-stack architecture milestone by Friday.</text>
      <rect x="340" y="18" width="65" height="24" rx="6" fill="#2563EB" />
      <text x="372" y="34" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Notes (4)</text>
    </g>
  </svg>
);

export const StudentIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 500 380"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-auto rounded-2xl drop-shadow-sm select-none ${className}`}
    aria-label="Student Career Growth with Maxicareer"
  >
    <defs>
      <linearGradient id="sGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
      <linearGradient id="sGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <filter id="sShadow" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="5" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.08" />
      </filter>
    </defs>

    {/* Background Frame */}
    <rect x="15" y="15" width="470" height="350" rx="20" fill="url(#sGradBg)" stroke="#E2E8F0" strokeWidth="1.5" />

    {/* Dashboard Top Header */}
    <rect x="35" y="35" width="430" height="50" rx="12" fill="#FFFFFF" stroke="#E2E8F0" />
    <circle cx="60" cy="60" r="12" fill="url(#sGradBlue)" />
    <path d="M56 60 L 59 63 L 65 57" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <text x="82" y="57" fill="#0F172A" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Alex Johnson — Career Track</text>
    <text x="82" y="70" fill="#64748B" fontSize="9" fontFamily="sans-serif">Level: Graduate / Entry Associate</text>
    <rect x="375" y="47" width="75" height="24" rx="6" fill="#EFF6FF" stroke="#BFDBFE" />
    <text x="412" y="63" textAnchor="middle" fill="#2563EB" fontSize="10" fontWeight="bold" fontFamily="sans-serif">On Track</text>

    {/* 3 Metric Cards */}
    <g transform="translate(35, 100)">
      <rect width="135" height="75" rx="12" fill="#FFFFFF" stroke="#E2E8F0" />
      <text x="14" y="24" fill="#64748B" fontSize="9" fontWeight="bold" fontFamily="sans-serif">SKILLS DEVELOPED</text>
      <text x="14" y="52" fill="#0F172A" fontSize="22" fontWeight="800" fontFamily="sans-serif">14 / 16</text>
      <rect x="14" y="60" width="107" height="4" rx="2" fill="#E2E8F0" />
      <rect x="14" y="60" width="94" height="4" rx="2" fill="#2563EB" />
    </g>

    <g transform="translate(182, 100)">
      <rect width="135" height="75" rx="12" fill="#FFFFFF" stroke="#E2E8F0" />
      <text x="14" y="24" fill="#64748B" fontSize="9" fontWeight="bold" fontFamily="sans-serif">MENTOR SESSIONS</text>
      <text x="14" y="52" fill="#0F172A" fontSize="22" fontWeight="800" fontFamily="sans-serif">8 Completed</text>
      <rect x="14" y="60" width="107" height="4" rx="2" fill="#E2E8F0" />
      <rect x="14" y="60" width="107" height="4" rx="2" fill="#10B981" />
    </g>

    <g transform="translate(330, 100)">
      <rect width="135" height="75" rx="12" fill="#FFFFFF" stroke="#E2E8F0" />
      <text x="14" y="24" fill="#64748B" fontSize="9" fontWeight="bold" fontFamily="sans-serif">PORTFOLIO READINESS</text>
      <text x="14" y="52" fill="#0F172A" fontSize="22" fontWeight="800" fontFamily="sans-serif">92%</text>
      <rect x="14" y="60" width="107" height="4" rx="2" fill="#E2E8F0" />
      <rect x="14" y="60" width="98" height="4" rx="2" fill="#38BDF8" />
    </g>

    {/* Roadmap Milestones Checklist */}
    <g transform="translate(35, 190)">
      <rect width="430" height="155" rx="12" fill="#FFFFFF" stroke="#E2E8F0" />
      <text x="20" y="28" fill="#0F172A" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Career Progression Milestones</text>

      {/* Row 1 */}
      <circle cx="32" cy="55" r="8" fill="#10B981" />
      <path d="M29 55 L 31 57 L 35 53" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <text x="48" y="58" fill="#1E293B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">1. Goal Discovery &amp; Career Trajectory Mapping</text>
      <rect x="360" y="47" width="55" height="16" rx="4" fill="#DCFCE7" />
      <text x="387" y="59" textAnchor="middle" fill="#15803D" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Passed</text>

      {/* Row 2 */}
      <circle cx="32" cy="85" r="8" fill="#10B981" />
      <path d="M29 85 L 31 87 L 35 83" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <text x="48" y="88" fill="#1E293B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">2. Industry Tooling Mastery (Git, Full-Stack, Cloud)</text>
      <rect x="360" y="77" width="55" height="16" rx="4" fill="#DCFCE7" />
      <text x="387" y="89" textAnchor="middle" fill="#15803D" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Passed</text>

      {/* Row 3 */}
      <circle cx="32" cy="115" r="8" fill="#2563EB" />
      <circle cx="32" cy="115" r="3" fill="#FFFFFF" />
      <text x="48" y="118" fill="#1E293B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">3. Mock Technical Interviews &amp; Resume Optimization</text>
      <rect x="360" y="107" width="55" height="16" rx="4" fill="#EFF6FF" />
      <text x="387" y="119" textAnchor="middle" fill="#2563EB" fontSize="8" fontWeight="bold" fontFamily="sans-serif">In Progress</text>

      {/* Row 4 */}
      <circle cx="32" cy="142" r="8" fill="#E2E8F0" />
      <text x="48" y="145" fill="#94A3B8" fontSize="10" fontFamily="sans-serif">4. Direct Placement Introductions &amp; Offer Advisory</text>
      <rect x="360" y="134" width="55" height="16" rx="4" fill="#F8FAFC" stroke="#E2E8F0" />
      <text x="387" y="146" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">Upcoming</text>
    </g>
  </svg>
);
