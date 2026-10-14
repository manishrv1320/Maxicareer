import React, { useState } from 'react';
import {
  Compass,
  GraduationCap,
  ShieldCheck,
  Globe,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { StudentProfile } from '../types';
import { DEMO_STUDENT_PROFILES } from '../data/portalData';

interface PlatformSwitcherBarProps {
  currentView: 'landing' | 'dashboard' | 'internal';
  onNavigateLanding: () => void;
  onNavigateStudentDashboard: (profile?: StudentProfile) => void;
  onNavigateInternalPortal: () => void;
  onOpenCounselorDirectory: () => void;
  currentUser?: StudentProfile | null;
}

export const PlatformSwitcherBar: React.FC<PlatformSwitcherBarProps> = ({
  currentView,
  onNavigateLanding,
  onNavigateStudentDashboard,
  onNavigateInternalPortal,
  onOpenCounselorDirectory,
  currentUser,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <aside
      aria-label="Platform preview bar"
      className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md backdrop-blur-md bg-opacity-95"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Quick Label & Status */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Interactive Live Workspaces:</span>
          </span>
          <span className="hidden md:inline text-[11px] text-slate-400">
            Click any workspace below to immediately test the new features
          </span>
        </div>

        {/* Right / Middle: Workspace Action Buttons */}
        {!isMinimized && (
          <nav aria-label="Workspace switch" className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* 1. Public Landing */}
            <button
              type="button"
              onClick={onNavigateLanding}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                currentView === 'landing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>

            {/* 2. Student Dashboard */}
            <button
              type="button"
              onClick={() =>
                onNavigateStudentDashboard(currentUser || DEMO_STUDENT_PROFILES.college)
              }
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title="View student roadmap, 1:1 action plans, interactive tasks, and notes"
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
              <span>Student Dashboard</span>
              <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 bg-blue-500/30 text-blue-200 rounded">
                Action Plan &amp; Tasks
              </span>
            </button>

            {/* 3. 1:1 Counselor Directory */}
            <button
              type="button"
              onClick={onOpenCounselorDirectory}
              className="px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs bg-purple-900/40 text-purple-200 hover:bg-purple-800/60 border border-purple-700/50 cursor-pointer"
              title="Open the certified 1:1 career counselor booking directory"
            >
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>1:1 Counselor Directory</span>
            </button>

            {/* 4. Staff Portal */}
            <button
              type="button"
              onClick={onNavigateInternalPortal}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                currentView === 'internal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-700/40'
              }`}
              title="Open Admin, Counselor, and Industry Mentor workspaces"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Staff Portal</span>
              <span className="hidden lg:inline-block text-[10px] px-1.5 py-0.2 bg-emerald-500/30 text-emerald-200 rounded">
                Admin &bull; Counselor &bull; Mentor
              </span>
            </button>
          </nav>
        )}

        {/* Toggle Minimize */}
        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          title={isMinimized ? 'Expand workspace bar' : 'Minimize workspace bar'}
        >
          {isMinimized ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400">
              <span>Show Switcher</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </aside>
  );
};
