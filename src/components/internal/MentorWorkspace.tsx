import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Compass,
  MessageSquare,
  BarChart3,
  User,
  Search,
  Plus,
  ShieldCheck,
  Award,
  Video,
  ChevronRight,
  Sparkles,
  CalendarCheck,
  ListTodo,
} from 'lucide-react';
import {
  Appointment,
} from '../../types/counselor';
import { useCareerStore } from '../../hooks/useCareerStore';
import { MentorAuth } from '../mentor/MentorAuth';
import { ConductMentoringSessionView } from '../mentor/ConductMentoringSessionView';
import { MenteeDetailForMentor } from '../mentor/MenteeDetailForMentor';
import { MentorMessagesView } from '../mentor/MentorMessagesView';
import {
  AddMentorRecommendationModal,
  AddMentorFollowUpTaskModal,
} from '../mentor/MentorModals';
import { MentorProfileEditor } from '../mentor/MentorProfileEditor';

interface MentorWorkspaceProps {
  onBackToPortal: () => void;
}

type MentorTab =
  | 'dashboard'
  | 'mentees'
  | 'requests'
  | 'appointments'
  | 'assessments'
  | 'roadmaps'
  | 'notes'
  | 'recommendations'
  | 'followups'
  | 'messages'
  | 'reports'
  | 'profile';

export const MentorWorkspace: React.FC<MentorWorkspaceProps> = ({ onBackToPortal }) => {
  const {
    state,
    setActiveMentor,
    acceptCounselingRequest,
    rejectCounselingRequest,
    completeSession,
    addRecommendation,
    addFollowUpTask,
    updateMentorProfile,
  } = useCareerStore();

  const [activeTab, setActiveTab] = useState<MentorTab>('dashboard');
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [activeConductAppointment, setActiveConductAppointment] = useState<Appointment | null>(
    null
  );

  // Modals
  const [showAddRecModal, setShowAddRecModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Sub-filters
  const [menteeSearch, setMenteeSearch] = useState('');
  const [menteeFilter, setMenteeFilter] = useState<'all' | 'assessment_done' | 'followup_needed'>(
    'all'
  );

  const activeMentor = state.mentors.find((m) => m.id === state.activeMentorId) || null;

  // Active mentor's associated data
  const myRequests = useMemo(() => {
    if (!activeMentor) return [];
    return state.counselingRequests.filter(
      (r) => r.counselorId === activeMentor.id || (r as any).mentorId === activeMentor.id
    );
  }, [state.counselingRequests, activeMentor]);

  const myAppointments = useMemo(() => {
    if (!activeMentor) return [];
    return state.appointments.filter(
      (a) => a.counselorId === activeMentor.id || (a as any).mentorId === activeMentor.id
    );
  }, [state.appointments, activeMentor]);

  const mySessionNotes = useMemo(() => {
    if (!activeMentor) return [];
    return state.sessionNotes.filter(
      (n) => n.counselorId === activeMentor.id || (n as any).mentorId === activeMentor.id
    );
  }, [state.sessionNotes, activeMentor]);

  const myRecommendations = useMemo(() => {
    if (!activeMentor) return [];
    return state.recommendations.filter(
      (r) => r.counselorId === activeMentor.id || (r as any).mentorId === activeMentor.id
    );
  }, [state.recommendations, activeMentor]);

  const myFollowUpTasks = useMemo(() => {
    if (!activeMentor) return [];
    return state.followUpTasks.filter(
      (t) => t.counselorId === activeMentor.id || (t as any).mentorId === activeMentor.id
    );
  }, [state.followUpTasks, activeMentor]);

  // STRICT: Only mentees who are actually connected to this mentor
  const myMentees = useMemo(() => {
    if (!activeMentor) return [];
    const menteeIds = new Set<string>();
    myRequests.forEach((r) => menteeIds.add(r.studentId));
    myAppointments.forEach((a) => menteeIds.add(a.studentId));
    mySessionNotes.forEach((n) => menteeIds.add(n.studentId));
    myRecommendations.forEach((r) => menteeIds.add(r.studentId));
    myFollowUpTasks.forEach((t) => menteeIds.add(t.studentId));
    // Also include learners an admin assigned to this mentor by name.
    return state.students.filter((s) => menteeIds.has(s.id) || s.mentorAssigned === activeMentor.name);
  }, [
    state.students,
    activeMentor,
    myRequests,
    myAppointments,
    mySessionNotes,
    myRecommendations,
    myFollowUpTasks,
  ]);

  // Selected mentee for drilldown
  const selectedMentee = useMemo(() => {
    if (!selectedMenteeId) return null;
    return state.students.find((s) => s.id === selectedMenteeId) || null;
  }, [state.students, selectedMenteeId]);

  // Statistics
  const pendingRequestsCount = myRequests.filter((r) => r.status === 'pending').length;
  const upcomingAppointmentsCount = myAppointments.filter((a) => a.status === 'scheduled').length;
  const completedAppointmentsCount = myAppointments.filter((a) => a.status === 'completed').length;
  const pendingTasksCount = myFollowUpTasks.filter((t) => t.status === 'pending').length;
  const menteesNeedingFollowup = myMentees.filter((s) => (s.pendingTasksCount || 0) > 0).length;

  // Search & Filter mentees
  const filteredMentees = myMentees.filter((mentee) => {
    const matchesSearch =
      mentee.name.toLowerCase().includes(menteeSearch.toLowerCase()) ||
      mentee.email.toLowerCase().includes(menteeSearch.toLowerCase()) ||
      (mentee.careerGoal &&
        mentee.careerGoal.toLowerCase().includes(menteeSearch.toLowerCase()));
    if (menteeFilter === 'assessment_done') {
      return matchesSearch && mentee.assessmentStatus === 'completed';
    }
    if (menteeFilter === 'followup_needed') {
      return matchesSearch && (mentee.pendingTasksCount || 0) > 0;
    }
    return matchesSearch;
  });

  // Handle Start Session
  const handleStartSession = (apt: Appointment) => {
    setActiveConductAppointment(apt);
  };

  const handleLogout = () => {
    setActiveMentor(null);
  };

  // If mentor is not logged in, display the dedicated Mentor Auth view
  if (!activeMentor) {
    return (
      <MentorAuth
        onLoginSuccess={(m) => setActiveMentor(m.id)}
        onBackToPortal={onBackToPortal}
      />
    );
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'mentees',
      label: 'My Mentees',
      icon: Users,
      count: myMentees.length,
    },
    {
      id: 'requests',
      label: 'Mentorship Requests',
      icon: Calendar,
      count: pendingRequestsCount,
      countAlert: pendingRequestsCount > 0,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Clock,
      count: upcomingAppointmentsCount,
    },
    { id: 'assessments', label: 'Assessments', icon: Award },
    { id: 'roadmaps', label: 'Career Roadmaps', icon: Compass },
    {
      id: 'notes',
      label: 'Session Notes',
      icon: FileText,
      count: mySessionNotes.length,
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: Sparkles,
      count: myRecommendations.length,
    },
    {
      id: 'followups',
      label: 'Follow-ups',
      icon: ListTodo,
      count: pendingTasksCount,
      countAlert: pendingTasksCount > 0,
    },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 flex flex-col">
      {/* TOP HEADER & HORIZONTAL NAVIGATION */}
      <header className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-4">
            {/* Mentor details */}
            <div className="flex items-center gap-3.5">
              <img
                src={activeMentor.avatarUrl}
                alt={activeMentor.name}
                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900">
                    {activeMentor.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Industry Mentor
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {activeMentor.role} at {activeMentor.company} &bull; {activeMentor.domain}
                </p>
              </div>
            </div>

            {/* Quick stats & actions */}
            <div className="flex items-center gap-2.5 sm:gap-4 text-xs">
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">
                  My Mentees
                </span>
                <span className="text-sm font-black text-slate-900">{myMentees.length}</span>
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">
                  Pending Requests
                </span>
                <span className="text-sm font-black text-emerald-600">
                  {pendingRequestsCount}
                </span>
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">
                  Completed Sessions
                </span>
                <span className="text-sm font-black text-emerald-600">
                  {completedAppointmentsCount}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* HORIZONTAL NAVIGATION BAR */}
          <nav
            aria-label="Mentor Navigation"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 border-t border-slate-100 text-xs whitespace-nowrap"
          >
            {navigationItems.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                activeTab === tab.id && !selectedMenteeId && !activeConductAppointment;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as MentorTab);
                    setSelectedMenteeId(null);
                    setActiveConductAppointment(null);
                  }}
                  className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : tab.countAlert
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* VIEW 1: CONDUCT SESSION VIEW */}
        {activeConductAppointment && (
          <ConductMentoringSessionView
            appointment={activeConductAppointment}
            mentee={
              state.students.find((s) => s.id === activeConductAppointment.studentId) || null
            }
            mentor={activeMentor}
            onClose={() => setActiveConductAppointment(null)}
            onSaveSession={(sessionData) => {
              completeSession(activeConductAppointment.id, sessionData);
              setActiveConductAppointment(null);
              setActiveTab('notes');
            }}
          />
        )}

        {/* VIEW 2: MENTEE PROFILE DRILLDOWN */}
        {!activeConductAppointment && selectedMentee && (
          <MenteeDetailForMentor
            mentee={selectedMentee}
            mentor={activeMentor}
            onBack={() => setSelectedMenteeId(null)}
            onOpenAddRec={() => setShowAddRecModal(true)}
            onOpenAddTask={() => setShowAddTaskModal(true)}
            onStartSessionWithMentee={(mentee) => {
              const existingApt = myAppointments.find(
                (a) => a.studentId === mentee.id && a.status === 'scheduled'
              );
              if (existingApt) {
                setActiveConductAppointment(existingApt);
              } else {
                const quickApt: Appointment = {
                  id: `apt-instant-${Date.now()}`,
                  studentId: mentee.id,
                  studentName: mentee.name,
                  counselorId: activeMentor.id,
                  counselorName: activeMentor.name,
                  date: new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                  time: 'Live Consultation',
                  counselingType: '1:1 Industry Mentorship',
                  topic: mentee.careerGoal || 'Strategic Architecture Review',
                  status: 'scheduled',
                };
                setActiveConductAppointment(quickApt);
              }
            }}
          />
        )}

        {/* VIEW 3: STANDARD TABS */}
        {!activeConductAppointment && !selectedMentee && (
          <>
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* 5 Responsive Metric Cards */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      Mentor Performance &amp; Mentee Workload Overview
                    </h2>
                    <span className="text-xs text-slate-500">
                      {state.environment === 'demo' ? 'Sample Demo Metrics' : 'Live Real-Time Data'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        My Mentees
                      </span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">
                        {myMentees.length}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {myMentees.length === 0 ? '0 mentees connected' : 'Active mentee cohort'}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Pending Requests
                      </span>
                      <span className="text-2xl font-black text-emerald-700 mt-1 block">
                        {pendingRequestsCount}
                      </span>
                      <span className="text-[10px] text-emerald-600">Awaiting acceptance</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Upcoming Sessions
                      </span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">
                        {upcomingAppointmentsCount}
                      </span>
                      <span className="text-[10px] text-slate-500">Confirmed on calendar</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Completed Sessions
                      </span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">
                        {completedAppointmentsCount}
                      </span>
                      <span className="text-[10px] text-slate-500">With documented notes</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        Follow-up Tasks
                      </span>
                      <span className="text-2xl font-black text-amber-700 mt-1 block">
                        {pendingTasksCount}
                      </span>
                      <span className="text-[10px] text-amber-700">Pending mentee action</span>
                    </div>
                  </div>
                </div>

                {/* Grid: Appointments & Pending Requests */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Today's & Upcoming Mentoring Sessions */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-sm text-slate-900">
                          Upcoming Mentoring Sessions ({upcomingAppointmentsCount})
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('appointments')}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 cursor-pointer"
                      >
                        View Calendar &rarr;
                      </button>
                    </div>
                    {upcomingAppointmentsCount === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                        <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-semibold text-slate-600">
                          No upcoming mentoring sessions
                        </p>
                        <p>Accepted mentorship requests will appear on your calendar.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myAppointments
                          .filter((a) => a.status === 'scheduled')
                          .slice(0, 3)
                          .map((apt) => (
                            <div
                              key={apt.id}
                              className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 bg-white shadow-2xs"
                            >
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900">
                                  {apt.studentName}
                                </h4>
                                <p className="text-[11px] text-slate-600 truncate">
                                  {apt.counselingType}: {apt.topic}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {apt.date} at {apt.time}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleStartSession(apt)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1 flex-shrink-0 cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Start Session</span>
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Pending Mentorship Requests */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-sm text-slate-900">
                          Pending Mentorship Requests ({pendingRequestsCount})
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('requests')}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 cursor-pointer"
                      >
                        All Requests &rarr;
                      </button>
                    </div>
                    {pendingRequestsCount === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                        <p className="font-semibold text-slate-600">All requests reviewed</p>
                        <p>No mentee mentorship requests currently awaiting response.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myRequests
                          .filter((r) => r.status === 'pending')
                          .slice(0, 3)
                          .map((req) => (
                            <div
                              key={req.id}
                              className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 bg-white shadow-2xs"
                            >
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900">{req.studentName}</h4>
                                <p className="text-[11px] text-slate-600 truncate">
                                  {req.counselingType}: {req.topic}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  Pref: {req.preferredDate} at {req.preferredTime}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => acceptCounselingRequest(req.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => rejectCounselingRequest(req.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mentees Requiring Follow-up */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-bold text-sm text-slate-900">
                      Mentees Requiring Follow-up ({menteesNeedingFollowup})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('mentees');
                        setMenteeFilter('followup_needed');
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 cursor-pointer"
                    >
                      Filter Mentees &rarr;
                    </button>
                  </div>
                  {menteesNeedingFollowup === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No active follow-up tasks currently pending for your mentees.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {myMentees
                        .filter((s) => (s.pendingTasksCount || 0) > 0)
                        .map((mentee) => (
                          <div
                            key={mentee.id}
                            className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 flex items-center justify-between gap-3"
                          >
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">{mentee.name}</h4>
                              <p className="text-[11px] text-amber-800 font-medium">
                                {mentee.pendingTasksCount} pending tasks
                              </p>
                              <span className="text-[10px] text-slate-500">
                                Goal: {mentee.careerGoal}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedMenteeId(mentee.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
                            >
                              Profile
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MY MENTEES */}
            {activeTab === 'mentees' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      My Assigned Mentees ({myMentees.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Learners connected to your mentorship practice. Review placement goals, technical
                      aptitude, and engineering roadmaps.
                    </p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMenteeFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        menteeFilter === 'all'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      All ({myMentees.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenteeFilter('assessment_done')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        menteeFilter === 'assessment_done'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Assessment Done
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenteeFilter('followup_needed')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        menteeFilter === 'followup_needed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Follow-up Needed ({menteesNeedingFollowup})
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={menteeSearch}
                    onChange={(e) => setMenteeSearch(e.target.value)}
                    placeholder="Search by mentee name, email, or placement target..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>

                {/* Mentees List or Strict Empty State */}
                {filteredMentees.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
                    <Users className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">
                      {myMentees.length === 0
                        ? 'No mentees registered yet'
                        : 'No matching mentees found'}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {myMentees.length === 0
                        ? 'As learners book mock interviews or request technical mentorship with you, they will appear in your workspace.'
                        : 'No mentees match your active search and filter criteria.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredMentees.map((mentee) => (
                      <div
                        key={mentee.id}
                        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{mentee.id.slice(-6).toUpperCase()}
                              </span>
                              <h3 className="font-bold text-base text-slate-900">{mentee.name}</h3>
                              <p className="text-xs text-slate-500">{mentee.email}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              {mentee.professionLabel || mentee.profession}
                            </span>
                          </div>

                          <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div>
                              <span className="text-slate-400 font-medium">Goal: </span>
                              <span className="font-semibold text-slate-800">
                                {mentee.careerGoal || mentee.detail}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium">Institution/Org: </span>
                              <span className="text-slate-700 font-medium">
                                {mentee.academicInfo?.schoolOrCollege ||
                                  mentee.institutionOrCompany ||
                                  'Independent'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                            <span className="text-slate-500">
                              Sessions:{' '}
                              <strong className="text-slate-900">
                                {mySessionNotes.filter((n) => n.studentId === mentee.id).length}
                              </strong>
                            </span>
                            <span className="text-slate-500">
                              Roadmap:{' '}
                              <strong className="text-emerald-600">
                                {mentee.roadmapProgress || 0}%
                              </strong>
                            </span>
                            <span className="text-slate-500">
                              Tasks:{' '}
                              <strong
                                className={
                                  (mentee.pendingTasksCount || 0) > 0
                                    ? 'text-amber-600 font-bold'
                                    : 'text-slate-900'
                                }
                              >
                                {mentee.pendingTasksCount || 0} pending
                              </strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedMenteeId(mentee.id)}
                          className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>View Mentee Profile &amp; Roadmap</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MENTORSHIP REQUESTS */}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Mentorship Requests ({myRequests.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review incoming booking inquiries for mock technical interviews, architecture
                    reviews, and career guidance.
                  </p>
                </div>

                {myRequests.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <Calendar className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No mentorship requests yet</h3>
                    <p className="text-xs text-slate-500">
                      When learners book sessions with you from the mentor directory, their requests
                      will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {myRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900">{req.studentName}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                req.status === 'accepted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {req.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 space-y-0.5">
                            <p>
                              <strong className="text-slate-800">Topic:</strong>{' '}
                              <span className="font-semibold text-emerald-700">
                                {req.counselingType}
                              </span>{' '}
                              &bull; {req.topic}
                            </p>
                            {req.notes && <p className="italic text-slate-500">"{req.notes}"</p>}
                            <p className="text-[11px] text-slate-400">
                              Requested Schedule: {req.preferredDate} at {req.preferredTime} &bull; Email:{' '}
                              {req.studentEmail} &bull; Phone: {req.studentPhone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                          {req.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => acceptCounselingRequest(req.id)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                              >
                                Accept &amp; Schedule
                              </button>
                              <button
                                type="button"
                                onClick={() => rejectCounselingRequest(req.id)}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedMenteeId(req.studentId)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            View Mentee
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: APPOINTMENTS */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Mentoring Appointments ({myAppointments.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confirmed calendar sessions with mentees. Start session to launch live technical
                    review and document notes.
                  </p>
                </div>

                {myAppointments.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <Clock className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No appointments booked</h3>
                    <p className="text-xs text-slate-500">
                      When mentorship requests are accepted, appointments appear on your calendar.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">
                              {apt.date} &bull; {apt.time}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                apt.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {apt.status.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="font-bold text-base text-slate-900">{apt.studentName}</h3>
                          <p className="text-xs text-emerald-700 font-semibold">
                            {apt.counselingType}
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-2">{apt.topic}</p>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setSelectedMenteeId(apt.studentId)}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            Mentee Profile &rarr;
                          </button>
                          {apt.status !== 'completed' ? (
                            <button
                              type="button"
                              onClick={() => handleStartSession(apt)}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Start Session</span>
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: ASSESSMENTS */}
            {activeTab === 'assessments' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Mentee Skill &amp; Aptitude Assessments
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review technical aptitude, problem solving, and domain profiler results submitted
                    by mentees.
                  </p>
                </div>

                {state.assessments.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <Award className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No assessments completed</h3>
                    <p className="text-xs text-slate-500">
                      When mentees complete assessment batteries, scores and recommended technical
                      tracks will populate here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.assessments.map((asm) => {
                      const mentee = state.students.find((s) => s.id === asm.studentId);
                      return (
                        <div
                          key={asm.id}
                          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-slate-900">{asm.assessmentName}</h3>
                            {asm.scorePercent && (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {asm.scorePercent}% Score
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Mentee: <strong className="text-slate-800">{mentee?.name || asm.studentId}</strong> &bull; Completed {asm.completionDate}
                          </p>
                          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                            <div>
                              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                                Core Strengths:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {asm.strengths.map((st) => (
                                  <span
                                    key={st}
                                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold"
                                  >
                                    {st}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                                Recommended Tracks:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {asm.careerAreasSuggested.map((c) => (
                                  <span
                                    key={c}
                                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: CAREER ROADMAPS */}
            {activeTab === 'roadmaps' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Mentee Technical &amp; Career Roadmaps
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track milestone completion, architecture projects, and skill acquisition across
                    mentee roadmaps.
                  </p>
                </div>

                {myMentees.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <Compass className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No active roadmaps</h3>
                    <p className="text-xs text-slate-500">
                      As connected mentees progress through their milestone tracks, roadmaps will
                      populate here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myMentees.map((mentee) => (
                      <div
                        key={mentee.id}
                        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-base text-slate-900">{mentee.name}</h3>
                            <p className="text-xs text-slate-500">{mentee.careerGoal}</p>
                          </div>
                          <span className="text-lg font-black text-emerald-600">
                            {mentee.roadmapProgress || 0}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                            style={{ width: `${mentee.roadmapProgress || 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                          <span>Plan: {mentee.planName || 'Tech Mentorship Track'}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedMenteeId(mentee.id)}
                            className="font-bold text-emerald-600 hover:text-emerald-800 cursor-pointer"
                          >
                            Review Milestones &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: SESSION NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Documented Mentoring Notes ({mySessionNotes.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Formal mentorship records documenting discussion points, code/system reviews, and
                    agreed next steps.
                  </p>
                </div>

                {mySessionNotes.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No session notes recorded</h3>
                    <p className="text-xs text-slate-500">
                      When you conduct mentoring sessions and complete documentation, records are
                      saved here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mySessionNotes.map((note) => {
                      const mentee = state.students.find((s) => s.id === note.studentId);
                      return (
                        <div
                          key={note.id}
                          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {note.sessionDate}
                              </span>
                              <h3 className="font-bold text-base text-slate-900">
                                {mentee?.name || 'Mentee'}: {note.counselingTopic}
                              </h3>
                            </div>
                            {note.followUpDate && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                                Follow-up: {note.followUpDate}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 leading-relaxed">
                            <p>
                              <strong className="text-slate-900">Summary:</strong> {note.summary}
                            </p>
                            {note.keyDiscussionPoints.length > 0 && (
                              <div>
                                <strong className="text-slate-900 block mb-1">
                                  Key Discussion Points:
                                </strong>
                                <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-600">
                                  {note.keyDiscussionPoints.map((pt, i) => (
                                    <li key={i}>{pt}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {note.studentConcerns && (
                              <p>
                                <strong className="text-slate-900">Technical Challenges:</strong>{' '}
                                {note.studentConcerns}
                              </p>
                            )}
                            {note.recommendations && (
                              <p>
                                <strong className="text-slate-900">Recommendations:</strong>{' '}
                                {note.recommendations}
                              </p>
                            )}
                            {note.nextSteps && (
                              <p>
                                <strong className="text-slate-900">Next Action Steps:</strong>{' '}
                                {note.nextSteps}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 8: RECOMMENDATIONS */}
            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Mentor Recommendations ({myRecommendations.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Curated system design projects, DSA patterns, tools, and certifications assigned
                      to mentees.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddRecModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Assign Recommendation</span>
                  </button>
                </div>

                {myRecommendations.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <Sparkles className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">
                      No recommendations assigned
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click 'Assign Recommendation' to suggest technical projects, interview prep, or
                      certifications to your mentees.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myRecommendations.map((rec) => {
                      const mentee = state.students.find((s) => s.id === rec.studentId);
                      return (
                        <div
                          key={rec.id}
                          className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              {rec.category}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                rec.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-base text-slate-900">{rec.title}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                            Assigned to: <strong className="text-slate-800">{mentee?.name || 'Mentee'}</strong> &bull; {rec.createdAt}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 9: FOLLOW-UPS */}
            {activeTab === 'followups' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Follow-up Tasks ({myFollowUpTasks.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Actionable assignments and coding targets. Mentees can check these off in their
                      Student Portal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Follow-up Task</span>
                  </button>
                </div>

                {myFollowUpTasks.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <ListTodo className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No tasks created</h3>
                    <p className="text-xs text-slate-500">
                      Add follow-up tasks to keep mentees accountable between mentoring sessions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myFollowUpTasks.map((task) => {
                      const mentee = state.students.find((s) => s.id === task.studentId);
                      return (
                        <div
                          key={task.id}
                          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  task.priority === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : task.priority === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {task.priority} priority
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">{task.description}</p>
                            <p className="text-[11px] text-slate-400">
                              Mentee: <strong className="text-slate-800">{mentee?.name}</strong> &bull; Due: {task.dueDate}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 10: MESSAGES */}
            {activeTab === 'messages' && (
              <MentorMessagesView mentor={activeMentor} mentees={myMentees} />
            )}

            {/* TAB 11: REPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Mentoring Practice Analytics
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time workload metrics, session completion rates, and mentee skill
                    progression.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Session Completion Rate
                    </span>
                    <span className="text-3xl font-black text-slate-900 block">
                      {myAppointments.length > 0
                        ? Math.round(
                            (completedAppointmentsCount / myAppointments.length) * 100
                          )
                        : 100}
                      %
                    </span>
                    <p className="text-xs text-slate-500">
                      {completedAppointmentsCount} completed of {myAppointments.length} booked
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Task Execution Rate
                    </span>
                    <span className="text-3xl font-black text-emerald-600 block">
                      {myFollowUpTasks.length > 0
                        ? Math.round(
                            (myFollowUpTasks.filter((t) => t.status === 'completed').length /
                              myFollowUpTasks.length) *
                              100
                          )
                        : 100}
                      %
                    </span>
                    <p className="text-xs text-slate-500">
                      Follow-up assignments fulfilled by mentees
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Cohort Size
                    </span>
                    <span className="text-3xl font-black text-emerald-600 block">
                      {myMentees.length} Mentees
                    </span>
                    <p className="text-xs text-slate-500">
                      Active learners guided in this mentorship track
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 12: MY PROFILE */}
            {activeTab === 'profile' && (
              <MentorProfileEditor mentor={activeMentor} onUpdate={updateMentorProfile} />
            )}
          </>
        )}
      </main>

      {/* MODAL: ADD RECOMMENDATION */}
      {showAddRecModal && (
        <AddMentorRecommendationModal
          mentor={activeMentor}
          mentees={myMentees.length > 0 ? myMentees : state.students}
          preselectedMenteeId={selectedMenteeId || undefined}
          onClose={() => setShowAddRecModal(false)}
          onAdd={(data) => {
            addRecommendation(data);
            setShowAddRecModal(false);
          }}
        />
      )}

      {/* MODAL: ADD FOLLOW-UP TASK */}
      {showAddTaskModal && (
        <AddMentorFollowUpTaskModal
          mentor={activeMentor}
          mentees={myMentees.length > 0 ? myMentees : state.students}
          preselectedMenteeId={selectedMenteeId || undefined}
          onClose={() => setShowAddTaskModal(false)}
          onAdd={(data) => {
            addFollowUpTask(data);
            setShowAddTaskModal(false);
          }}
        />
      )}
    </div>
  );
};
