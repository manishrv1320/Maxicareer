import React from 'react';
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { UserRole } from '../../types/counselor';
import { useCareerStore } from '../../hooks/useCareerStore';

interface InternalPortalLandingProps {
  onSelectRole: (role: UserRole) => void;
  onReturnToPublic: () => void;
}

export const InternalPortalLanding: React.FC<InternalPortalLandingProps> = ({
  onSelectRole,
  onReturnToPublic,
}) => {
  const { state } = useCareerStore();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Hero Welcome */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>maxicareer_internal.com &bull; Unified Professional Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          MaxiCareer Internal Portal
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Access your dedicated professional workspace. Connect as a Student, accredited Counselor,
          industry Mentor, or platform Administrator with role-specific authentication and data access.
        </p>
      </div>

      {/* 4 Connected Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Student Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xl hover:border-blue-300 transition-all duration-300 group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Learner Workspace
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Student</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore career tracks, review milestones, complete aptitude assessments, book certified
              counseling sessions, and follow action tasks.
            </p>
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Career Roadmap &amp; Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>1:1 Counseling &amp; Tasks</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectRole('student')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-xs text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer"
          >
            <span>Access Student Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Counselor Card (Primary Focus) */}
        <div className="bg-white rounded-3xl border-2 border-blue-600/60 p-6 flex flex-col justify-between shadow-lg shadow-blue-600/5 hover:shadow-2xl hover:border-blue-600 transition-all duration-300 relative group">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
            Primary Role
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25 group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Guidance Specialist
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Counselor</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Professional counselor workspace to manage assigned students, review requests,
              conduct 1:1 sessions, document notes, and assign follow-up tasks.
            </p>
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Dedicated Counselor Workspace</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Session Notes &amp; Recommendations</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectRole('counselor')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <span>Counselor Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Mentor Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xl hover:border-blue-300 transition-all duration-300 group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Industry Practitioner
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Mentor</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Industry practitioners conducting mock technical interviews, domain mentorship,
              portfolio reviews, and alumni networking advisory.
            </p>
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Domain Guidance Hub</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Technical Interview Prep</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectRole('mentor')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer"
          >
            <span>Mentor Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4. Admin Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xl hover:border-blue-300 transition-all duration-300 group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Platform Operations
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Admin</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Platform administration, credential verification, counselor approvals, user
              oversight, and institutional quality governance.
            </p>
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Counselor Verification &amp; Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Restricted Access Control</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectRole('admin')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-xs text-purple-700 bg-purple-50 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer"
          >
            <span>Admin Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Information Notice */}
      <div className="mt-12 p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h3 className="text-sm font-bold text-slate-900">
            Professional Governance &amp; Data Security
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access ensures confidential student session notes and assessment records are
            never exposed publicly.
          </p>
        </div>
        <button
          type="button"
          onClick={onReturnToPublic}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
        >
          Return to Public Website
        </button>
      </div>
    </div>
  );
};
