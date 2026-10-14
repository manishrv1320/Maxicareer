import React from 'react';
import { BrandLogo } from '../BrandLogo';
import { useCareerStore } from '../../hooks/useCareerStore';
import { ExternalLink, Database, Sparkles, RefreshCw } from 'lucide-react';

interface InternalHeaderProps {
  onReturnToPublic: () => void;
  activeRole?: string;
  onSelectRole?: (role: 'landing' | 'student' | 'counselor' | 'mentor' | 'admin') => void;
  userEmail?: string;
  onLogout?: () => void;
}

export const InternalHeader: React.FC<InternalHeaderProps> = ({
  onReturnToPublic,
  activeRole,
  onSelectRole,
  userEmail,
  onLogout,
}) => {
  const { state, setEnvironment, resetToCleanProduction } = useCareerStore();
  const isDemo = state.environment === 'demo';
  const canManageData = state.currentUser?.staffRole === 'Global admin' || state.currentUser?.staffRole === 'Admin';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      {/* Top Environment & Domain Simulation Bar */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800/80 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400">maxicareer_internal.com</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Multi-Role Professional Management System</span>
        </div>
        {/* Mode indicator; only administrators can load or clear sample data */}
        <div className="flex items-center gap-3">
          {isDemo ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px]">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Sample data loaded
              </span>
              {canManageData && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Remove all sample students, counsellors, sessions and accounts? Real records are kept.')) resetToCleanProduction();
                  }}
                  className="text-[10px] font-semibold text-slate-300 hover:text-white underline decoration-slate-600 flex items-center gap-1 cursor-pointer"
                  title="Delete every sample record; real data is untouched"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Clear sample data</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[10px]">
                <Database className="w-3 h-3 text-emerald-400" />
                Live data
              </span>
              {canManageData && (
                <button
                  type="button"
                  onClick={() => setEnvironment('demo')}
                  className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 underline decoration-blue-500/50 flex items-center gap-1 cursor-pointer"
                  title="Add clearly-marked sample records to preview populated views"
                >
                  <span>Load sample data</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Internal Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectRole && onSelectRole('landing')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
              title="Internal Portal Landing"
            >
              <BrandLogo variant="dark" size="md" />
              <div className="border-l border-slate-700 pl-2.5">
                <span className="block text-xs font-black uppercase tracking-wider text-blue-400">
                  Internal Portal
                </span>
                <span className="block text-[10px] text-slate-400 font-medium">
                  Workspace
                </span>
              </div>
            </button>
            {activeRole && activeRole !== 'landing' && (
              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                {activeRole} Workspace
              </span>
            )}
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {userEmail && (
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200">{userEmail}</span>
                <span className="text-[10px] text-slate-400 capitalize">{activeRole}</span>
              </div>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            )}
            <button
              type="button"
              onClick={onReturnToPublic}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-xs cursor-pointer"
            >
              <span>Public Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
