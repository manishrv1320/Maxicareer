import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Bell,
  BookOpen,
  ListChecks,
  GraduationCap,
  FolderOpen,
  Award,
  Video,
  CalendarDays,
  MessageSquare,
  PartyPopper,
  UserRound,
  ShoppingBag,
  Receipt,
  RefreshCcw,
  LifeBuoy,
  MessageSquareHeart,
  PlayCircle,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentProfile } from '../types';
import { OFFICIAL_PHONE_DIGITS } from '../data/portalData';
import { CounselorDirectoryModal } from './counseling/CounselorDirectoryModal';
import { ChangePasswordGate } from './workspace/ChangePasswordGate';
import { PlatformToaster } from './PlatformToaster';
import { useCareerStore } from '../hooks/useCareerStore';
import { WorkspaceShell, ShellNavGroup } from './workspace/WorkspaceShell';
import { fmtDay, isoOf } from './workspace/kit';
import { StudentContext, StudentCtx, StudentPage, Provider, PAGE_ALIASES, studentModules, daysLeft } from './student/context';
import { DashboardPage, NotificationsPage } from './student/OverviewPages';
import { CurriculumPage, TasksPage, CoursesPage, ResourcesPage, MilestonesPage } from './student/LearningPages';
import { SessionsPage, CalendarPage, ChatPage, EventsPage, AdminMeetingModal } from './student/GuidancePages';
import { ProfilePage, ServicesPage, InvoicesPage, RenewalPage } from './student/AccountPages';
import { SupportPage, FeedbackPage, TutorialsPage } from './student/HelpPages';

interface StudentDashboardProps {
  profile: StudentProfile;
  onLogout: () => void;
  onSwitchProfile?: (profile: StudentProfile) => void;
}

export type StudentDashboardTab = StudentPage;

const PAGE_KEY = 'maxicareer_student_page';

/** The student portal: a vertical-menu workspace like the admin portal. */
export const StudentDashboard: React.FC<StudentDashboardProps> = ({ profile, onLogout }) => {
  const store = useCareerStore();
  const { state, updateStudentProgress, markNotificationsRead } = store;

  const [page, setPage] = useState<StudentPage>('dashboard');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PAGE_KEY) as StudentPage | null;
      if (saved) setPage(saved);
    } catch {}
  }, []);
  const go = useCallback((p: StudentPage) => {
    setPage(p);
    try {
      localStorage.setItem(PAGE_KEY, p);
    } catch {}
  }, []);

  const [toasts, setToasts] = useState<{ id: number; message: string; tone: 'default' | 'error' }[]>([]);
  const toast = useCallback((message: string, tone: 'default' | 'error' = 'default') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const [bookingFor, setBookingFor] = useState<string | null | undefined>(undefined);
  const [adminMeetingOpen, setAdminMeetingOpen] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState<string | null>(null);

  const me = state.students.find((s) => s.id === profile.id) || null;

  /* ---------------- people ---------------- */

  const directory: Provider[] = useMemo(
    () => [
      ...state.counselors.map((c) => ({ id: c.id, name: c.name, avatarUrl: c.avatarUrl, title: c.qualification || 'Career counsellor', kind: 'counselor' as const })),
      ...state.mentors.map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl, title: [m.role, m.company].filter(Boolean).join(' · ') || 'Industry mentor', kind: 'mentor' as const })),
    ],
    [state.counselors, state.mentors]
  );
  const byName = (name?: string, prefer?: 'counselor' | 'mentor') => {
    if (!name || name === 'Unassigned') return null;
    const matches = directory.filter((p) => p.name === name);
    return matches.find((p) => p.kind === prefer) || matches[0] || null;
  };
  const assignedAsMentor = byName(me?.mentorAssigned, 'mentor');
  // Older records put a counsellor in the mentor field; show them as the counsellor.
  const counselor = byName(me?.counselorAssigned, 'counselor') || (assignedAsMentor?.kind === 'counselor' ? assignedAsMentor : null);
  const mentor = assignedAsMentor && assignedAsMentor !== counselor ? assignedAsMentor : null;

  const providers = useMemo(() => {
    const ids = new Set<string>();
    [state.counselingRequests, state.appointments, state.followUpTasks, state.assignments].forEach((list) => list.forEach((r: { counselorId: string }) => ids.add(r.counselorId)));
    state.messages.forEach((m) => {
      ids.add(m.senderId);
      ids.add(m.recipientId);
    });
    if (mentor) ids.add(mentor.id);
    if (counselor) ids.add(counselor.id);
    const list = directory.filter((p) => ids.has(p.id));
    // Assigned people first.
    return list.sort((a, b) => Number(b.id === mentor?.id || b.id === counselor?.id) - Number(a.id === mentor?.id || a.id === counselor?.id));
  }, [directory, state.counselingRequests, state.appointments, state.followUpTasks, state.assignments, state.messages, mentor, counselor]);

  // Students book only with the mentor and counsellor the Maxicareer team assigned them.
  const bookableIds = [mentor?.id, counselor?.id].filter((id): id is string => Boolean(id));
  const canBookWith = (id?: string) => Boolean(id && bookableIds.includes(id));

  /* ---------------- curriculum ---------------- */

  const modules = useMemo(() => studentModules(state.curricula), [state.curricula]);
  const lessonIds = useMemo(() => modules.flatMap((m) => m.lessons.map((l) => l.id)), [modules]);
  const [pendingLessons, setPendingLessons] = useState<string[] | null>(null);
  const completedLessonIds = pendingLessons ?? me?.completedLessonIds ?? [];
  // Until the student ticks a lesson, show the stored progress (what mentors and admins see);
  // ticking saves the computed value, so both sides stay in step.
  const curriculumProgress = completedLessonIds.length
    ? lessonIds.length
      ? Math.round((completedLessonIds.filter((id) => lessonIds.includes(id)).length / lessonIds.length) * 100)
      : 0
    : me?.roadmapProgress ?? profile.roadmapProgress ?? 0;
  const toggleLesson = async (id: string) => {
    const next = completedLessonIds.includes(id) ? completedLessonIds.filter((x) => x !== id) : [...completedLessonIds, id];
    setPendingLessons(next);
    const pct = lessonIds.length ? Math.round((next.filter((x) => lessonIds.includes(x)).length / lessonIds.length) * 100) : 0;
    await updateStudentProgress(next, pct);
    setPendingLessons(null);
  };

  /* ---------------- counts ---------------- */

  const unreadNotifications = state.notifications.filter((n) => !n.read).length;
  const unreadMessages = state.messages.filter((m) => m.recipientId === profile.id && !m.read).length;
  const openTasks = state.followUpTasks.filter((t) => t.status !== 'completed').length;
  const reviewedWork = state.assignments.filter((a) => a.status === 'changes_requested').length;
  const dueInvoices = state.invoices.filter((i) => i.status === 'Due').length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcomingSessions =
    state.appointments.filter((a) => a.status === 'scheduled' && isoOf(a.date) >= todayIso).length +
    state.adminMeetings.filter((m) => m.status === 'Upcoming' && m.date >= todayIso).length;
  const resultsByTest = new Set(state.assessments.map((a) => a.testId).filter(Boolean));
  const openTests = state.tests.filter((t) => !resultsByTest.has(t.id)).length;
  const left = daysLeft(me?.programEndsAt);

  const groups: ShellNavGroup<StudentPage>[] = [
    {
      label: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications, alert: unreadNotifications > 0 },
      ],
    },
    {
      label: 'Learning',
      items: [
        { id: 'curriculum', label: 'Curriculum & syllabus', icon: BookOpen },
        { id: 'tasks', label: 'Tasks & assignments', icon: ListChecks, badge: openTasks + reviewedWork, alert: reviewedWork > 0 },
        { id: 'courses', label: 'Courses & tests', icon: GraduationCap, badge: openTests, alert: openTests > 0 },
        { id: 'resources', label: 'Resources', icon: FolderOpen },
        { id: 'milestones', label: 'Milestones & certificates', icon: Award },
      ],
    },
    {
      label: 'Guidance',
      items: [
        { id: 'sessions', label: '1-on-1 sessions', icon: Video, badge: upcomingSessions },
        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
        { id: 'chat', label: 'Chat', icon: MessageSquare, badge: unreadMessages, alert: unreadMessages > 0 },
        { id: 'events', label: 'Upcoming events', icon: PartyPopper, badge: state.events.filter((e) => e.date >= todayIso).length },
      ],
    },
    {
      label: 'Career & account',
      items: [
        { id: 'profile', label: 'Profile & resume', icon: UserRound },
        { id: 'services', label: 'Add a service', icon: ShoppingBag },
        { id: 'invoices', label: 'Invoices', icon: Receipt, badge: dueInvoices, alert: dueInvoices > 0 },
        { id: 'renewal', label: 'Renewal', icon: RefreshCcw, badge: left !== null && left <= 30 ? 1 : undefined, alert: left !== null && left <= 30 },
      ],
    },
    {
      label: 'Help',
      items: [
        { id: 'support', label: 'Support', icon: LifeBuoy },
        { id: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
        { id: 'tutorials', label: 'Tutorials', icon: PlayCircle },
      ],
    },
  ];

  const whatsappUrl = `https://wa.me/${OFFICIAL_PHONE_DIGITS}?text=${encodeURIComponent(
    `Hello Maxicareer! I am ${profile.name} (ID: ${profile.id}), enrolled in ${profile.planName}.`
  )}`;

  const ctx: StudentCtx = {
    profile,
    me,
    state,
    store,
    go,
    toast,
    mentor,
    counselor,
    providers,
    canBookWith,
    modules,
    lessonIds,
    completedLessonIds,
    toggleLesson,
    curriculumProgress,
    openBooking: (providerId) => {
      if (!bookableIds.length) return;
      setBookingFor(canBookWith(providerId) ? providerId : bookableIds.length === 1 ? bookableIds[0] : null);
    },
    openAdminMeeting: () => setAdminMeetingOpen(true),
    chatWith: (providerId) => {
      setChatPartnerId(providerId);
      go('chat');
    },
    chatPartnerId,
    setChatPartnerId,
    whatsappUrl,
  };

  const body = (() => {
    switch (page) {
      case 'notifications':
        return <NotificationsPage />;
      case 'curriculum':
        return <CurriculumPage />;
      case 'tasks':
        return <TasksPage />;
      case 'courses':
        return <CoursesPage />;
      case 'resources':
        return <ResourcesPage />;
      case 'milestones':
        return <MilestonesPage />;
      case 'sessions':
        return <SessionsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'chat':
        return <ChatPage />;
      case 'events':
        return <EventsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'services':
        return <ServicesPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'renewal':
        return <RenewalPage />;
      case 'support':
        return <SupportPage />;
      case 'feedback':
        return <FeedbackPage />;
      case 'tutorials':
        return <TutorialsPage />;
      default:
        return <DashboardPage />;
    }
  })();

  const banner =
    left !== null && left <= 30 && page !== 'renewal' ? (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-[14px] border border-[#F4D49B] bg-[#FDF1DC] px-4 py-3 text-[13.5px] text-[#6B4100]">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="flex-1">
          {left < 0 ? `Your program access ended on ${fmtDay(me?.programEndsAt)}.` : `Your program access ends ${left === 0 ? 'today' : `in ${left} day${left > 1 ? 's' : ''}`} (${fmtDay(me?.programEndsAt)}).`} Renew to keep your sessions and materials.
        </span>
        <button type="button" onClick={() => go('renewal')} className="font-semibold text-[#94570A] underline underline-offset-2 self-start sm:self-auto">
          Renew now
        </button>
      </div>
    ) : null;

  return (
    <StudentContext.Provider value={ctx}>
      <WorkspaceShell
        portalLabel="Student portal"
        groups={groups}
        active={page}
        onNavigate={go}
        storageKey="maxicareer_student_sidebar_collapsed"
        user={{ name: me?.name || profile.name, email: profile.email, subtitle: me?.professionLabel || profile.professionLabel, avatarUrl: me?.avatarUrl || profile.avatarUrl }}
        notifications={state.notifications.map((n) => ({ id: n.id, title: n.title, body: n.description, createdAt: n.createdAt, read: n.read }))}
        onOpenNotification={(n) => {
          const full = state.notifications.find((x) => x.id === n.id);
          if (full && !full.read) markNotificationsRead([full.id]);
          const target = full?.actionTab ? PAGE_ALIASES[full.actionTab] || (full.actionTab as StudentPage) : 'notifications';
          go(groups.some((g) => g.items.some((i) => i.id === target)) ? target : 'notifications');
        }}
        onMarkAllRead={() => markNotificationsRead()}
        onViewAllNotifications={() => go('notifications')}
        onSignOut={onLogout}
        websiteUrl="/"
        profilePage="profile"
        banner={banner}
        topBarExtra={
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#BFE6D5] bg-[#E3F6EE] px-3 text-[13px] font-semibold text-[#0B7A55] hover:bg-[#D4F0E3]"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        }
      >
        {body}
      </WorkspaceShell>

      <CounselorDirectoryModal
        isOpen={bookingFor !== undefined}
        onClose={() => setBookingFor(undefined)}
        currentUser={profile}
        initialCounselorId={bookingFor || undefined}
        allowedIds={bookableIds}
        onBookSuccess={() => toast('Request sent. You will be notified when it is confirmed.')}
      />
      <AdminMeetingModal open={adminMeetingOpen} onClose={() => setAdminMeetingOpen(false)} />
      <ChangePasswordGate onDone={toast} />
      <PlatformToaster />

      <div className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={`mc-admin pointer-events-auto max-w-[min(92vw,380px)] rounded-[12px] px-4 py-3 text-[13.5px] font-medium shadow-lg flex items-start gap-2 ${t.tone === 'error' ? 'bg-[#B42F3B] text-white' : 'bg-[#0D1B3E] text-white'}`}
              role="status"
            >
              {t.tone === 'error' ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#38BDF8]" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </StudentContext.Provider>
  );
};
