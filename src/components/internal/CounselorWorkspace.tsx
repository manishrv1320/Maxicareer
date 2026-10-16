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
  Send,
  Sparkles,
  CalendarCheck,
  ListTodo,
} from 'lucide-react';
import { Counselor, CounselorStudentDetail, Appointment, SessionNote, Recommendation, FollowUpTask } from '../../types/counselor';
import { useCareerStore } from '../../hooks/useCareerStore';
import { AvatarUploader } from '../AvatarUploader';

interface CounselorWorkspaceProps {
  counselor: Counselor;
  onLogout: () => void;
  onBackToPortal: () => void;
}

type CounselorTab =
  | 'dashboard'
  | 'students'
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

export const CounselorWorkspace: React.FC<CounselorWorkspaceProps> = ({
  counselor,
  onLogout,
}) => {
  const {
    state,
    acceptCounselingRequest,
    rejectCounselingRequest,
    completeSession,
    addRecommendation,
    addFollowUpTask,
    updateTaskStatus,
    updateCounselorProfile,
  } = useCareerStore();

  const [activeTab, setActiveTab] = useState<CounselorTab>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeConductAppointment, setActiveConductAppointment] = useState<Appointment | null>(null);

  // Modals
  const [showAddRecModal, setShowAddRecModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Sub-filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'assessment_done' | 'followup_needed'>('all');

  // Active counselor's associated data
  const myRequests = useMemo(
    () => state.counselingRequests.filter((r) => r.counselorId === counselor.id),
    [state.counselingRequests, counselor.id]
  );
  const myAppointments = useMemo(
    () => state.appointments.filter((a) => a.counselorId === counselor.id),
    [state.appointments, counselor.id]
  );
  const mySessionNotes = useMemo(
    () => state.sessionNotes.filter((n) => n.counselorId === counselor.id),
    [state.sessionNotes, counselor.id]
  );
  const myRecommendations = useMemo(
    () => state.recommendations.filter((r) => r.counselorId === counselor.id),
    [state.recommendations, counselor.id]
  );
  const myFollowUpTasks = useMemo(
    () => state.followUpTasks.filter((t) => t.counselorId === counselor.id),
    [state.followUpTasks, counselor.id]
  );

  // Students connected to this counselor
  const myStudents = useMemo(() => {
    const studentIds = new Set<string>();
    myRequests.forEach((r) => studentIds.add(r.studentId));
    myAppointments.forEach((a) => studentIds.add(a.studentId));
    mySessionNotes.forEach((n) => studentIds.add(n.studentId));
    myRecommendations.forEach((r) => studentIds.add(r.studentId));
    myFollowUpTasks.forEach((t) => studentIds.add(t.studentId));
    // Also include learners an admin assigned to this counsellor by name.
    const assigned = state.students.filter((s) => studentIds.has(s.id) || s.mentorAssigned === counselor.name);
    return assigned;
  }, [state.students, myRequests, myAppointments, mySessionNotes, myRecommendations, myFollowUpTasks, counselor.name]);

  // Selected student for detail drilldown
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return state.students.find((s) => s.id === selectedStudentId) || null;
  }, [state.students, selectedStudentId]);

  // Statistics
  const pendingRequestsCount = myRequests.filter((r) => r.status === 'pending').length;
  const upcomingAppointmentsCount = myAppointments.filter((a) => a.status === 'scheduled').length;
  const completedAppointmentsCount = myAppointments.filter((a) => a.status === 'completed').length;
  const pendingTasksCount = myFollowUpTasks.filter((t) => t.status === 'pending').length;
  const studentsNeedingFollowup = myStudents.filter((s) => (s.pendingTasksCount || 0) > 0).length;

  // Search & Filter students
  const filteredStudents = myStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (student.careerGoal && student.careerGoal.toLowerCase().includes(studentSearch.toLowerCase()));
    if (studentFilter === 'assessment_done') {
      return matchesSearch && student.assessmentStatus === 'completed';
    }
    if (studentFilter === 'followup_needed') {
      return matchesSearch && (student.pendingTasksCount || 0) > 0;
    }
    return matchesSearch;
  });

  const handleStartSession = (apt: Appointment) => {
    setActiveConductAppointment(apt);
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'students',
      label: 'My Students',
      icon: Users,
      count: myStudents.length,
    },
    {
      id: 'requests',
      label: 'Counseling Requests',
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
            {/* Counselor details */}
            <div className="flex items-center gap-3.5">
              <img
                src={counselor.avatarUrl}
                alt={counselor.name}
                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900">{counselor.name}</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Counselor
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{counselor.qualification}</p>
              </div>
            </div>

            {/* Quick stats & actions */}
            <div className="flex items-center gap-2.5 sm:gap-4 text-xs">
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">
                  My Students
                </span>
                <span className="text-sm font-black text-slate-900">{myStudents.length}</span>
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">
                  Pending Requests
                </span>
                <span className="text-sm font-black text-blue-600">{pendingRequestsCount}</span>
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
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* HORIZONTAL NAVIGATION BAR */}
          <nav
            aria-label="Counselor Navigation"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 border-t border-slate-100 text-xs whitespace-nowrap"
          >
            {navigationItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && !selectedStudentId && !activeConductAppointment;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as CounselorTab);
                    setSelectedStudentId(null);
                    setActiveConductAppointment(null);
                  }}
                  className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : tab.countAlert
                          ? 'bg-blue-100 text-blue-700'
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
          <ConductSessionView
            appointment={activeConductAppointment}
            student={
              state.students.find((s) => s.id === activeConductAppointment.studentId) || null
            }
            counselor={counselor}
            onClose={() => setActiveConductAppointment(null)}
            onSaveSession={(sessionData) => {
              completeSession(activeConductAppointment.id, sessionData);
              setActiveConductAppointment(null);
              setActiveTab('notes');
            }}
          />
        )}

        {/* VIEW 2: STUDENT PROFILE DRILLDOWN FOR COUNSELOR */}
        {!activeConductAppointment && selectedStudent && (
          <StudentDetailForCounselor
            student={selectedStudent}
            counselor={counselor}
            onBack={() => setSelectedStudentId(null)}
            onOpenAddRec={() => setShowAddRecModal(true)}
            onOpenAddTask={() => setShowAddTaskModal(true)}
            onStartSessionWithStudent={(student) => {
              const existingApt = myAppointments.find(
                (a) => a.studentId === student.id && a.status === 'scheduled'
              );
              if (existingApt) {
                setActiveConductAppointment(existingApt);
              } else {
                const quickApt: Appointment = {
                  id: `apt-instant-${Date.now()}`,
                  studentId: student.id,
                  studentName: student.name,
                  counselorId: counselor.id,
                  counselorName: counselor.name,
                  date: new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                  time: 'Live Consultation',
                  counselingType: '1:1 Career Guidance',
                  topic: student.careerGoal || 'Strategic Career Review',
                  status: 'scheduled',
                };
                setActiveConductAppointment(quickApt);
              }
            }}
          />
        )}

        {/* VIEW 3: STANDARD TABS */}
        {!activeConductAppointment && !selectedStudent && (
          <>
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* 5 Responsive Metric Cards */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      Counselor Performance &amp; Student Workload Overview
                    </h2>
                    <span className="text-xs text-slate-500">
                      {state.environment === 'demo' ? 'Sample Demo Metrics' : 'Live Real-Time Data'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total Students
                      </span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">
                        {myStudents.length}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {myStudents.length === 0 ? '0 students assigned' : 'Active learner cohort'}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                        Pending Requests
                      </span>
                      <span className="text-2xl font-black text-blue-700 mt-1 block">
                        {pendingRequestsCount}
                      </span>
                      <span className="text-[10px] text-blue-600">Awaiting acceptance</span>
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
                      <span className="text-[10px] text-amber-700">Pending student action</span>
                    </div>
                  </div>
                </div>

                {/* Grid: Appointments & Pending Requests */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Today's & Upcoming Appointments */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-sm text-slate-900">
                          Upcoming Counseling Sessions ({upcomingAppointmentsCount})
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('appointments')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        View Calendar &rarr;
                      </button>
                    </div>
                    {upcomingAppointmentsCount === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                        <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-semibold text-slate-600">No scheduled sessions</p>
                        <p>When you accept student booking requests, sessions appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myAppointments
                          .filter((a) => a.status === 'scheduled')
                          .slice(0, 3)
                          .map((apt) => (
                            <div
                              key={apt.id}
                              className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between gap-3 bg-slate-50/50"
                            >
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">{apt.studentName}</h4>
                                <p className="text-[11px] text-blue-700 font-medium">
                                  {apt.topic || apt.counselingType}
                                </p>
                                <span className="text-[10px] text-slate-500">
                                  {apt.date} &bull; {apt.time}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleStartSession(apt)}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Start Session</span>
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Counseling Requests */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-sm text-slate-900">
                          Counseling Requests ({pendingRequestsCount} Pending)
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('requests')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        All Requests &rarr;
                      </button>
                    </div>
                    {pendingRequestsCount === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                        <p className="font-semibold text-slate-600">All requests reviewed</p>
                        <p>No student counseling requests currently awaiting response.</p>
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
                                  Pref: {req.preferredDate} at {req.preferredTime} &bull; Email:{' '}
                                  {req.studentEmail} &bull; Phone: {req.studentPhone}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => acceptCounselingRequest(req.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
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

                {/* Students Requiring Follow-up */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-bold text-sm text-slate-900">
                      Students Requiring Follow-up ({studentsNeedingFollowup})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('students');
                        setStudentFilter('followup_needed');
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Filter Students &rarr;
                    </button>
                  </div>
                  {studentsNeedingFollowup === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No active follow-up tasks currently overdue or pending.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {myStudents
                        .filter((s) => (s.pendingTasksCount || 0) > 0)
                        .map((student) => (
                          <div
                            key={student.id}
                            className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 flex items-center justify-between gap-3"
                          >
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">{student.name}</h4>
                              <p className="text-[11px] text-amber-800 font-medium">
                                {student.pendingTasksCount} pending tasks
                              </p>
                              <span className="text-[10px] text-slate-500">
                                Goal: {student.careerGoal}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentId(student.id)}
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

            {/* TAB 2: MY STUDENTS */}
            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      My Assigned Students ({myStudents.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Learners connected to your counseling practice. Review career goals, assessment
                      results, and roadmaps.
                    </p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStudentFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        studentFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      All ({myStudents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentFilter('assessment_done')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        studentFilter === 'assessment_done'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Assessment Done
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentFilter('followup_needed')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        studentFilter === 'followup_needed'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Follow-up Needed ({studentsNeedingFollowup})
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by student name, email, or career target..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>

                {/* Students List or Empty State */}
                {filteredStudents.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
                    <Users className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No students assigned yet</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {myStudents.length === 0
                        ? 'As learners book counseling sessions or submit roadmap reviews, they will be assigned to your workspace here.'
                        : 'No students matched the active search or filter criteria.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{student.id.slice(-6).toUpperCase()}
                              </span>
                              <h3 className="font-bold text-base text-slate-900">{student.name}</h3>
                              <p className="text-xs text-slate-500">{student.email}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                              {student.professionLabel || student.profession}
                            </span>
                          </div>

                          <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div>
                              <span className="text-slate-400 font-medium">Goal: </span>
                              <span className="font-semibold text-slate-800">
                                {student.careerGoal || student.detail}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium">College/School: </span>
                              <span className="text-slate-700 font-medium">
                                {student.academicInfo?.schoolOrCollege ||
                                  student.institutionOrCompany ||
                                  'Independent'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                            <span className="text-slate-500">
                              Sessions:{' '}
                              <strong className="text-slate-900">
                                {student.counselingSessionsCount || 0}
                              </strong>
                            </span>
                            <span className="text-slate-500">
                              Roadmap:{' '}
                              <strong className="text-blue-600">
                                {student.roadmapProgress || 0}%
                              </strong>
                            </span>
                            <span className="text-slate-500">
                              Tasks:{' '}
                              <strong
                                className={
                                  (student.pendingTasksCount || 0) > 0
                                    ? 'text-amber-600 font-bold'
                                    : 'text-slate-900'
                                }
                              >
                                {student.pendingTasksCount || 0} pending
                              </strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedStudentId(student.id)}
                          className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>View Student Profile &amp; Roadmap</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: COUNSELING REQUESTS */}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Counseling Requests ({myRequests.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review student booking inquiries. Accept to confirm an appointment or decline.
                  </p>
                </div>

                {myRequests.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <Calendar className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No requests yet</h3>
                    <p className="text-xs text-slate-500">
                      When students select you in the public directory, their requests will appear here.
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
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {req.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 space-y-0.5">
                            <p>
                              <strong className="text-slate-800">Topic:</strong>{' '}
                              <span className="font-semibold text-blue-700">{req.counselingType}</span>{' '}
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
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
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
                            onClick={() => setSelectedStudentId(req.studentId)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            View Student
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
                    Counseling Appointments ({myAppointments.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confirmed calendar sessions with students. Start session to launch live review
                    and document notes.
                  </p>
                </div>

                {myAppointments.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <Calendar className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No appointments booked</h3>
                    <p className="text-xs text-slate-500">
                      When counseling requests are accepted, appointments appear on your calendar.
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
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {apt.status.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="font-bold text-base text-slate-900">{apt.studentName}</h3>
                          <p className="text-xs text-blue-700 font-semibold">{apt.counselingType}</p>
                          <p className="text-xs text-slate-600 line-clamp-2">{apt.topic}</p>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(apt.studentId)}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            Student Profile &rarr;
                          </button>
                          {apt.status !== 'completed' ? (
                            <button
                              type="button"
                              onClick={() => handleStartSession(apt)}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
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
                  <h2 className="text-xl font-black text-slate-900">Student Aptitude Assessments</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review analytical battery and career profiler results submitted by learners.
                  </p>
                </div>

                {state.assessments.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <Award className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No assessments completed</h3>
                    <p className="text-xs text-slate-500">
                      When students complete the Maxicareer assessment batteries, scores and
                      suggested fields are indexed here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.assessments.map((asm) => {
                      const student = state.students.find((s) => s.id === asm.studentId);
                      return (
                        <div
                          key={asm.id}
                          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-slate-900">{asm.assessmentName}</h3>
                            {asm.scorePercent && (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                                {asm.scorePercent}% Score
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Student: <strong className="text-slate-800">{student?.name || asm.studentId}</strong> &bull; Completed {asm.completionDate}
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
                                Suggested Career Fields:
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
                  <h2 className="text-xl font-black text-slate-900">Learner Career Roadmaps</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track milestone completion, project submissions, and skill acquisition across
                    student roadmaps.
                  </p>
                </div>

                {myStudents.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <Compass className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No active roadmaps</h3>
                    <p className="text-xs text-slate-500">
                      As assigned students progress through their milestones, roadmaps will populate
                      here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myStudents.map((student) => (
                      <div
                        key={student.id}
                        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-base text-slate-900">{student.name}</h3>
                            <p className="text-xs text-slate-500">{student.careerGoal}</p>
                          </div>
                          <span className="text-lg font-black text-blue-600">
                            {student.roadmapProgress || 0}%
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${student.roadmapProgress || 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                          <span>Plan: {student.planName || 'Standard Track'}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(student.id)}
                            className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
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
                    Documented Session Notes ({mySessionNotes.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Formal counseling records documenting student concerns, recommendations, and
                    agreed next steps.
                  </p>
                </div>

                {mySessionNotes.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No session notes recorded</h3>
                    <p className="text-xs text-slate-500">
                      When you conduct counseling sessions and complete the post-session
                      documentation form, notes are saved here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mySessionNotes.map((note) => {
                      const student = state.students.find((s) => s.id === note.studentId);
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
                                {student?.name || 'Student'}: {note.counselingTopic}
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
                                <strong className="text-slate-900 block mb-1">Key Discussion Points:</strong>
                                <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-600">
                                  {note.keyDiscussionPoints.map((pt, i) => (
                                    <li key={i}>{pt}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {note.studentConcerns && (
                              <p>
                                <strong className="text-slate-900">Student Concerns:</strong>{' '}
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
                      Counselor Recommendations ({myRecommendations.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Curated courses, certifications, and project targets assigned to learners.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddRecModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Assign Recommendation</span>
                  </button>
                </div>

                {myRecommendations.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                    <Sparkles className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="font-bold text-slate-900 text-base">No recommendations assigned</h3>
                    <p className="text-xs text-slate-500">
                      Click 'Assign Recommendation' to suggest strategic skills, projects, or
                      certifications to your students.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myRecommendations.map((rec) => {
                      const student = state.students.find((s) => s.id === rec.studentId);
                      return (
                        <div
                          key={rec.id}
                          className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
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
                            Assigned to: <strong className="text-slate-800">{student?.name || 'Student'}</strong> &bull; {rec.createdAt}
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
                      Actionable assignments for learners. Students can check these off in their
                      Student Portal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                      Add follow-up tasks to keep students accountable between counseling sessions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myFollowUpTasks.map((task) => {
                      const student = state.students.find((s) => s.id === task.studentId);
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
                              Student: <strong className="text-slate-800">{student?.name}</strong> &bull; Due: {task.dueDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                updateTaskStatus(
                                  task.id,
                                  e.target.value as 'pending' | 'in_progress' | 'completed'
                                )
                              }
                              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
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
              <CounselorMessagesView counselor={counselor} students={myStudents} />
            )}

            {/* TAB 11: REPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Counseling Practice Analytics</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time workload metrics, session completion rates, and student retention.
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
                      Follow-up assignments fulfilled by learners
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Cohort Size
                    </span>
                    <span className="text-3xl font-black text-blue-600 block">
                      {myStudents.length} Students
                    </span>
                    <p className="text-xs text-slate-500">Active learners guided this term</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 12: MY PROFILE */}
            {activeTab === 'profile' && (
              <CounselorProfileEditor counselor={counselor} onUpdate={updateCounselorProfile} />
            )}
          </>
        )}
      </main>

      {/* MODAL: ADD RECOMMENDATION */}
      {showAddRecModal && (
        <AddRecommendationModal
          counselor={counselor}
          students={myStudents}
          preselectedStudentId={selectedStudentId || undefined}
          onClose={() => setShowAddRecModal(false)}
          onAdd={(data) => {
            addRecommendation(data);
            setShowAddRecModal(false);
          }}
        />
      )}

      {/* MODAL: ADD FOLLOW-UP TASK */}
      {showAddTaskModal && (
        <AddFollowUpTaskModal
          counselor={counselor}
          students={myStudents}
          preselectedStudentId={selectedStudentId || undefined}
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

// ==========================================
// SUB-VIEW: CONDUCT COUNSELING SESSION
// ==========================================
interface ConductSessionViewProps {
  appointment: Appointment;
  student: CounselorStudentDetail | null;
  counselor: Counselor;
  onClose: () => void;
  onSaveSession: (data: {
    summary: string;
    keyDiscussionPoints: string[];
    studentConcerns: string;
    recommendations: string;
    nextSteps: string;
    followUpDate?: string;
  }) => void;
}

const ConductSessionView: React.FC<ConductSessionViewProps> = ({
  appointment,
  student,
  onClose,
  onSaveSession,
}) => {
  const [summary, setSummary] = useState('');
  const [pointsText, setPointsText] = useState('');
  const [concerns, setConcerns] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError('Please provide a brief session summary.');
      return;
    }
    onSaveSession({
      summary: summary.trim(),
      keyDiscussionPoints: pointsText
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean),
      studentConcerns: concerns.trim(),
      recommendations: recommendations.trim(),
      nextSteps: nextSteps.trim(),
      followUpDate: followUpDate || undefined,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Live Counseling Documentation
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">
              Conduct Session &bull; {appointment.studentName}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
        >
          Close Session
        </button>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Student context */}
        <div className="space-y-5 lg:border-r lg:border-slate-200 lg:pr-6">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
            Student Context &amp; Objectives
          </h3>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Goal</span>
              <span className="font-bold text-slate-900 text-sm">
                {student?.careerGoal || appointment.topic}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Education Level</span>
              <span className="font-semibold text-slate-700">
                {student?.professionLabel || student?.profession || 'Student'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Roadmap Progress</span>
              <span className="font-bold text-blue-600">{student?.roadmapProgress || 0}% Completed</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs space-y-1">
            <span className="font-bold text-blue-900 block">Session Scheduled For:</span>
            <p className="text-blue-700 font-semibold">
              {appointment.date} at {appointment.time}
            </p>
            <p className="text-slate-500 text-[11px]">Type: {appointment.counselingType}</p>
          </div>
        </div>

        {/* Right column: Documentation Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Session Summary *
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Synthesize the core takeaway of today's conversation and overall progress..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Key Discussion Points (1 per line)
            </label>
            <textarea
              value={pointsText}
              onChange={(e) => setPointsText(e.target.value)}
              rows={3}
              placeholder="e.g.&#10;  Discussed target hiring calendar&#10;  Audited GitHub portfolio&#10;  Solved system design ambiguity"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Student Concerns / Challenges
              </label>
              <textarea
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                rows={2}
                placeholder="What roadblocks or worries did the student raise?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Strategic Recommendations
              </label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={2}
                placeholder="Specific guidance or priority shifts given to student..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Agreed Next Action Steps
              </label>
              <input
                type="text"
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="e.g. Update resume with metrics before Friday"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Recommended Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save &amp; Complete Counseling Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-VIEW: STUDENT DETAIL DRILLDOWN
// ==========================================
interface StudentDetailForCounselorProps {
  student: CounselorStudentDetail;
  counselor: Counselor;
  onBack: () => void;
  onOpenAddRec: () => void;
  onOpenAddTask: () => void;
  onStartSessionWithStudent: (student: CounselorStudentDetail) => void;
}

const StudentDetailForCounselor: React.FC<StudentDetailForCounselorProps> = ({
  student,
  onBack,
  onOpenAddRec,
  onOpenAddTask,
  onStartSessionWithStudent,
}) => {
  const { state } = useCareerStore();
  const studentNotes = state.sessionNotes.filter((n) => n.studentId === student.id);
  const studentRecs = state.recommendations.filter((r) => r.studentId === student.id);
  const studentTasks = state.followUpTasks.filter((t) => t.studentId === student.id);
  const studentAssessments = state.assessments.filter((a) => a.studentId === student.id);

  return (
    <div className="space-y-6">
      {/* Top back & actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to Students Cohort
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenAddRec}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            + Assign Recommendation
          </button>
          <button
            type="button"
            onClick={onOpenAddTask}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            + Assign Follow-up Task
          </button>
          <button
            type="button"
            onClick={() => onStartSessionWithStudent(student)}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Launch Session</span>
          </button>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Student ID: #{student.id.slice(-8).toUpperCase()}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">{student.name}</h2>
            <p className="text-xs text-slate-500">
              {student.email} &bull; {student.phone} &bull; Registered: {student.registeredDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Roadmap Progress
              </span>
              <span className="text-xl font-black text-blue-600">
                {student.roadmapProgress || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Academic & Goal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Target Career Goal
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {student.careerGoal || student.detail}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Education &amp; Institution
            </span>
            <span className="font-bold text-slate-800 block">
              {student.academicInfo?.schoolOrCollege || student.institutionOrCompany || 'Independent'}
            </span>
            <span className="text-slate-500 text-[11px]">
              {student.academicInfo?.degreeOrGrade || student.professionLabel || student.profession}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Counseling Stats
            </span>
            <div className="space-y-0.5 text-[11px] text-slate-600">
              <div>
                Completed Sessions: <strong>{student.counselingSessionsCount || 0}</strong>
              </div>
              <div>
                Pending Tasks: <strong>{student.pendingTasksCount || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Assessments, Recommendations & Follow-up Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Assessment Results ({studentAssessments.length})</span>
          </h3>
          {studentAssessments.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              Student has not completed their assessment battery yet.
            </p>
          ) : (
            studentAssessments.map((asm) => (
              <div key={asm.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">{asm.assessmentName}</span>
                  <span className="font-black text-blue-600">{asm.scorePercent}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Strengths:</span>
                  <span className="text-slate-700">{asm.strengths.join(', ')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Suggested:</span>
                  <span className="text-slate-700">{asm.careerAreasSuggested.join(', ')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Assigned Recommendations */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Assigned Recommendations ({studentRecs.length})</span>
            </h3>
            <button
              type="button"
              onClick={onOpenAddRec}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              + Add
            </button>
          </div>
          {studentRecs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No recommendations assigned to this student yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {studentRecs.map((rec) => (
                <div key={rec.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex justify-between font-bold text-slate-900 mb-1">
                    <span>{rec.title}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-blue-100 text-blue-800">
                      {rec.category}
                    </span>
                  </div>
                  <p className="text-slate-600">{rec.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Follow-up Tasks for this student */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-blue-600" />
            <span>Follow-up Tasks ({studentTasks.length})</span>
          </h3>
          <button
            type="button"
            onClick={onOpenAddTask}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            + Add Task
          </button>
        </div>
        {studentTasks.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No active tasks assigned to this student.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {studentTasks.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{t.title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      t.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="text-slate-600">{t.description}</p>
                <span className="text-[10px] text-slate-400 block pt-1">Due: {t.dueDate}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Notes History */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Past Session Documentation ({studentNotes.length})</span>
        </h3>
        {studentNotes.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No completed session notes on file for this student yet.
          </p>
        ) : (
          <div className="space-y-4">
            {studentNotes.map((note) => (
              <div key={note.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">{note.counselingTopic}</span>
                  <span className="text-slate-500">{note.sessionDate}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{note.summary}</p>
                {note.recommendations && (
                  <p className="text-blue-800 font-medium">
                    Guidance Given: {note.recommendations}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// SUB-VIEW: MESSAGES VIEW
// ==========================================
const CounselorMessagesView: React.FC<{
  counselor: Counselor;
  students: CounselorStudentDetail[];
}> = ({ counselor, students }) => {
  const { state, sendMessage } = useCareerStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [messageText, setMessageText] = useState('');

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Filter messages between counselor and selected student
  const conversationMessages = state.messages.filter(
    (m) =>
      (m.senderId === counselor.id && m.recipientId === selectedStudentId) ||
      (m.senderId === selectedStudentId && m.recipientId === counselor.id)
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedStudent) return;
    sendMessage({
      conversationId: `${selectedStudent.id}_${counselor.id}`,
      senderId: counselor.id,
      senderName: counselor.name,
      senderRole: 'counselor',
      recipientId: selectedStudent.id,
      recipientName: selectedStudent.name,
      content: messageText.trim(),
    });
    setMessageText('');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[600px]">
      {/* Student conversation list */}
      <div className="border-r border-slate-200 p-4 overflow-y-auto space-y-2">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 px-2">
          Assigned Students ({students.length})
        </h3>
        {students.length === 0 ? (
          <p className="text-xs text-slate-400 p-2">No students assigned to chat with.</p>
        ) : (
          students.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => setSelectedStudentId(student.id)}
              className={`w-full p-3 rounded-2xl text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                selectedStudentId === student.id
                  ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="font-bold">{student.name}</div>
                <div className="text-[10px] text-slate-500 font-normal truncate max-w-[150px]">
                  {student.careerGoal}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Chat pane */}
      <div className="md:col-span-2 flex flex-col justify-between h-full bg-slate-50">
        {selectedStudent ? (
          <>
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{selectedStudent.name}</h4>
                <p className="text-[11px] text-slate-500">{selectedStudent.email}</p>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {conversationMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No message history yet. Send a guidance message to {selectedStudent.name}.
                </div>
              ) : (
                conversationMessages.map((msg) => {
                  const isMe = msg.senderId === counselor.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message ${selectedStudent.name}...`}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="m-auto text-xs text-slate-400">Select a student to view messages.</div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// SUB-VIEW: PROFILE EDITOR
// ==========================================
const CounselorProfileEditor: React.FC<{
  counselor: Counselor;
  onUpdate: (id: string, updates: Partial<Counselor>) => unknown;
}> = ({ counselor, onUpdate }) => {
  const [name, setName] = useState(counselor.name);
  const [qualification, setQualification] = useState(counselor.qualification);
  const [experienceYears, setExperienceYears] = useState(counselor.experienceYears);
  const [bio, setBio] = useState(counselor.bio);
  const [languagesText, setLanguagesText] = useState(counselor.languages.join(', '));
  const [duration, setDuration] = useState(counselor.sessionDuration || '45 mins');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(counselor.id, {
      name: name.trim(),
      qualification: qualification.trim(),
      experienceYears: Number(experienceYears) || 1,
      bio: bio.trim(),
      languages: languagesText
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
      sessionDuration: duration,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-3xl shadow-2xs space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">Counselor Profile Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          These credentials and session settings are displayed to learners in the public directory.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <AvatarUploader src={counselor.avatarUrl} name={counselor.name} onUploaded={(url) => onUpdate(counselor.id, { avatarUrl: url })} />

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Qualification &amp; Certifications
          </label>
          <input
            type="text"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Languages Spoken (Comma-separated)
          </label>
          <input
            type="text"
            value={languagesText}
            onChange={(e) => setLanguagesText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Standard Session Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="30 mins">30 mins</option>
            <option value="45 mins">45 mins</option>
            <option value="60 mins">60 mins</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Professional Biography
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            required
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
        >
          Save Profile Updates
        </button>
      </form>
    </div>
  );
};

// ==========================================
// MODAL: ADD RECOMMENDATION
// ==========================================
const AddRecommendationModal: React.FC<{
  counselor: Counselor;
  students: CounselorStudentDetail[];
  preselectedStudentId?: string;
  onClose: () => void;
  onAdd: (data: Omit<Recommendation, 'id' | 'createdAt' | 'status'>) => void;
}> = ({ counselor, students, preselectedStudentId, onClose, onAdd }) => {
  const [studentId, setStudentId] = useState(preselectedStudentId || students[0]?.id || '');
  const [category, setCategory] = useState<Recommendation['category']>('Skills to Learn');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !title.trim()) return;
    onAdd({
      studentId,
      counselorId: counselor.id,
      counselorName: counselor.name,
      category,
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-black text-lg text-slate-900">Assign Recommendation</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Select Student
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
              required
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.careerGoal})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
            >
              <option value="Skills to Learn">Skills to Learn</option>
              <option value="Courses to Explore">Courses to Explore</option>
              <option value="Projects to Complete">Projects to Complete</option>
              <option value="Certifications">Certifications</option>
              <option value="Career Areas to Research">Career Areas to Research</option>
              <option value="Higher Education Options">Higher Education Options</option>
              <option value="Resume & Portfolio">Resume & Portfolio</option>
              <option value="Interview Preparation">Interview Preparation</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Redis Caching Strategies"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Description / Action Context
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Explain why this step matters and how the student should execute it..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// MODAL: ADD FOLLOW-UP TASK
// ==========================================
const AddFollowUpTaskModal: React.FC<{
  counselor: Counselor;
  students: CounselorStudentDetail[];
  preselectedStudentId?: string;
  onClose: () => void;
  onAdd: (data: Omit<FollowUpTask, 'id' | 'createdAt' | 'status'>) => void;
}> = ({ counselor, students, preselectedStudentId, onClose, onAdd }) => {
  const [studentId, setStudentId] = useState(preselectedStudentId || students[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<FollowUpTask['priority']>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !title.trim() || !dueDate) return;
    onAdd({
      studentId,
      counselorId: counselor.id,
      counselorName: counselor.name,
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-black text-lg text-slate-900">Assign Follow-up Task</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Select Student
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
              required
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.careerGoal})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete 10 System Architecture case studies"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Task Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Details for the student to complete..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
