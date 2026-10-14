import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Calendar,
  Lock,
  LogOut,
  Mail,
  UserCheck,
  RefreshCw,
  Award,
  BookOpen,
} from 'lucide-react';
import { useCareerStore } from '../../hooks/useCareerStore';

interface AdminWorkspaceProps {
  onBackToPortal: () => void;
  onLogout: () => void;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  onBackToPortal,
  onLogout,
}) => {
  const {
    state,
    updateCounselorApproval,
    updateMentorApproval,
    setEnvironment,
    resetToCleanProduction,
  } = useCareerStore();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [adminEmail, setAdminEmail] = useState('admin@maxicareer.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'counselors' | 'mentors' | 'sessions' | 'system'
  >('overview');

  const pendingCounselors = state.counselors.filter((c) => c.approvalStatus === 'pending');
  const pendingMentors = state.mentors.filter((m) => m.approvalStatus === 'pending');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setAuthError('Please enter admin credentials.');
      return;
    }
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 border border-purple-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-center text-slate-900">Admin Portal Sign In</h2>
          <p className="text-xs text-slate-500 text-center mt-1 mb-6">
            Institutional verification &amp; credential approvals
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="admin@maxicareer.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Access Admin Workspace
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={onBackToPortal}
              className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              &larr; Back to Role Portal
            </button>
            <span className="text-[11px] text-purple-600 font-medium">Demo: Auto-filled</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Institutional Governance &bull; MaxiCareer Administrator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Administrator Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review counselor &amp; mentor applications, supervise student allocations, and govern credential approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToPortal}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            &larr; Role Selection
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 border-b border-slate-200 mb-6">
        {[
          { id: 'overview', label: 'Platform Overview', count: null },
          {
            id: 'counselors',
            label: 'Counselors',
            count: pendingCounselors.length > 0 ? pendingCounselors.length : null,
          },
          {
            id: 'mentors',
            label: 'Mentors',
            count: pendingMentors.length > 0 ? pendingMentors.length : null,
          },
          { id: 'sessions', label: 'Sessions & Appointments', count: state.appointments.length },
          { id: 'system', label: 'System & Governance', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Counselors
              </span>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {state.counselors.length}
              </div>
              <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
                {state.counselors.filter((c) => c.approvalStatus === 'approved').length} Active &bull;{' '}
                {pendingCounselors.length} Pending
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Industry Mentors
              </span>
              <div className="text-3xl font-black text-slate-900 mt-2">{state.mentors.length}</div>
              <span className="text-xs text-blue-600 font-semibold mt-1 inline-block">
                {state.mentors.filter((m) => m.approvalStatus === 'approved').length} Active &bull;{' '}
                {pendingMentors.length} Pending
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Registered Students
              </span>
              <div className="text-3xl font-black text-slate-900 mt-2">{state.students.length}</div>
              <span className="text-xs text-slate-500 font-semibold mt-1 inline-block">
                Active learners
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Appointments
              </span>
              <div className="text-3xl font-black text-purple-600 mt-2">
                {state.appointments.length}
              </div>
              <span className="text-xs text-purple-700 font-semibold mt-1 inline-block">
                {state.counselingRequests.length} Total Requests
              </span>
            </div>
          </div>

          {/* Pending Verifications Banner */}
          {(pendingCounselors.length > 0 || pendingMentors.length > 0) && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    Pending Credentials Awaiting Review
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    There are {pendingCounselors.length} counselor application(s) and{' '}
                    {pendingMentors.length} mentor application(s) awaiting administrative validation.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {pendingCounselors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('counselors')}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition cursor-pointer"
                  >
                    Review Counselors ({pendingCounselors.length})
                  </button>
                )}
                {pendingMentors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('mentors')}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition cursor-pointer"
                  >
                    Review Mentors ({pendingMentors.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent Counseling Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Recent Counseling Requests</span>
            </h3>

            {state.counselingRequests.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No counseling requests filed yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {state.counselingRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{req.studentName}</div>
                      <div className="text-slate-500 text-[11px]">
                        Session: {req.counselingType} &bull; Requested for {req.preferredDate} at{' '}
                        {req.preferredTime}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          req.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Counselors */}
      {activeTab === 'counselors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Accredited Counselors ({state.counselors.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.counselors.map((counselor) => (
              <div
                key={counselor.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={counselor.avatarUrl}
                        alt={counselor.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{counselor.name}</h4>
                        <p className="text-xs text-slate-500">{counselor.qualification}</p>
                        <p className="text-[11px] text-slate-400">
                          {counselor.email} &bull; {counselor.phone}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                        counselor.approvalStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : counselor.approvalStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {counselor.approvalStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">{counselor.bio}</p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {counselor.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Exp: {counselor.experienceYears} yrs &bull; Joined: {counselor.registeredDate}
                  </span>
                  <div className="flex items-center gap-2">
                    {counselor.approvalStatus !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => updateCounselorApproval(counselor.id, 'approved')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    {counselor.approvalStatus !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => updateCounselorApproval(counselor.id, 'rejected')}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Mentors */}
      {activeTab === 'mentors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Industry Mentors ({state.mentors.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={mentor.avatarUrl}
                        alt={mentor.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{mentor.name}</h4>
                        <p className="text-xs text-blue-700 font-semibold">
                          {mentor.role} at {mentor.company}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {mentor.email} &bull; {mentor.domain}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                        mentor.approvalStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mentor.approvalStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {mentor.approvalStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">{mentor.bio}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Exp: {mentor.experienceYears} yrs &bull; Joined: {mentor.registeredDate}
                  </span>
                  <div className="flex items-center gap-2">
                    {mentor.approvalStatus !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => updateMentorApproval(mentor.id, 'approved')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    {mentor.approvalStatus !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => updateMentorApproval(mentor.id, 'rejected')}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Sessions */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            All Scheduled Appointments ({state.appointments.length})
          </h2>

          {state.appointments.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No appointments scheduled.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {state.appointments.map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{app.studentName}</div>
                    <div className="text-slate-500 text-[11px]">
                      Type: {app.counselingType} &bull; Counselor: {app.counselorName} &bull; Date:{' '}
                      {app.date} at {app.time}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        app.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: System & Governance */}
      {activeTab === 'system' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">Environment Controls</h3>
            <p className="text-xs text-slate-500 mb-4">
              Switch between Demo mode (sample students and counselor records) and clean Production mode.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEnvironment('demo')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  state.environment === 'demo'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Environment (with seed data)</span>
              </button>

              <button
                type="button"
                onClick={() => resetToCleanProduction()}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  state.environment === 'production'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clean Production State</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
