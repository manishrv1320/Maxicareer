import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Bell,
  CalendarDays,
  Users,
  Video,
  CalendarClock,
  ListTodo,
  FileText,
  FolderKanban,
  ListChecks,
  MessageSquare,
  BarChart3,
  Timer,
  Wallet,
  Receipt,
  UserRound,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { Appointment, Counselor, Mentor } from '../../types/counselor';
import { useCareerStore } from '../../hooks/useCareerStore';
import { PlatformToaster } from '../PlatformToaster';
import { WorkspaceShell, ShellNavGroup } from '../workspace/WorkspaceShell';
import { isoOf, todayIso } from '../workspace/kit';
import { ProviderContext, ProviderCtx, ProviderKind, ProviderPage, PAGE_ALIASES, providerSubtitle, roleLabel, sessionMinutesOf, isUpcoming, needsNotes } from './context';
import { SessionNotesModal, TaskModal, MeetingLinkModal } from './modals';
import { DashboardPage, CalendarPage, NotificationsPage } from './OverviewPages';
import { MenteesPage, SessionsPage, AvailabilityPage, MenteeDrawer } from './MenteePages';
import { PendingPage, NotesPage, AssignmentsPage, FollowUpsPage, ChatPage } from './WorkPages';
import { ReportsPage, HoursPage, PaymentsPage, ExpensesPage } from './InsightPages';
import { ProfilePage, SupportPage } from './AccountPages';

const PAGE_KEY = 'maxicareer_provider_page';

interface ProviderPortalProps {
  kind: ProviderKind;
  me: Counselor | Mentor;
  onSignOut: () => void;
}

/** The counsellor / mentor workspace: a vertical-menu layout like the admin portal. */
export const ProviderPortal: React.FC<ProviderPortalProps> = ({ kind, me, onSignOut }) => {
  const store = useCareerStore();
  const { state, markNotificationsRead } = store;

  const [page, setPage] = useState<ProviderPage>('dashboard');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PAGE_KEY) as ProviderPage | null;
      if (saved) setPage(saved);
    } catch {}
  }, []);
  const go = useCallback((p: ProviderPage) => {
    setPage(p);
    try {
      localStorage.setItem(PAGE_KEY, p);
    } catch {}
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  const [toasts, setToasts] = useState<{ id: number; message: string; tone: 'default' | 'error' }[]>([]);
  const toast = useCallback((message: string, tone: 'default' | 'error' = 'default') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const [menteeId, setMenteeId] = useState<string | null>(null);
  const [chatPartnerId, setChatPartnerId] = useState<string | null>(null);
  const [notesFor, setNotesFor] = useState<Appointment | null>(null);
  const [linkFor, setLinkFor] = useState<Appointment | null>(null);
  const [taskFor, setTaskFor] = useState<string | null | undefined>(undefined);

  /* ---------------- my records (the server already scopes these to me) ---------------- */

  const requests = useMemo(() => state.counselingRequests.filter((r) => r.counselorId === me.id), [state.counselingRequests, me.id]);
  const appointments = useMemo(() => state.appointments.filter((a) => a.counselorId === me.id), [state.appointments, me.id]);
  const notes = useMemo(() => state.sessionNotes.filter((n) => n.counselorId === me.id), [state.sessionNotes, me.id]);
  const tasks = useMemo(() => state.followUpTasks.filter((t) => t.counselorId === me.id), [state.followUpTasks, me.id]);
  const mentees = useMemo(() => [...state.students].sort((a, b) => a.name.localeCompare(b.name)), [state.students]);

  /* ---------------- counts for the menu ---------------- */

  const today = todayIso();
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const upcoming = appointments.filter((a) => isUpcoming(a, today)).length;
  const toReview = state.assignments.filter((a) => a.status === 'submitted').length;
  const notedIds = new Set(notes.map((n) => n.appointmentId));
  const missingNotes = appointments.filter((a) => needsNotes(a, notedIds, today)).length;
  const openTodos = state.calendarNotes.filter((n) => n.kind === 'task' && !n.done).length;
  const overdueTasks = tasks.filter((t) => t.status !== 'completed' && isoOf(t.dueDate) !== '' && isoOf(t.dueDate) < today).length;
  const unreadMessages = state.messages.filter((m) => m.recipientId === me.id && !m.read).length;
  const unreadNotifications = state.notifications.filter((n) => !n.read).length;
  const pendingTotal = pendingRequests + toReview + missingNotes + openTodos;
  const pendingClaims = state.expenses.filter((e) => e.status === 'Submitted').length;

  const groups: ShellNavGroup<ProviderPage>[] = [
    {
      label: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications, alert: unreadNotifications > 0 },
        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
      ],
    },
    {
      label: 'Mentees',
      items: [
        { id: 'mentees', label: kind === 'mentor' ? 'My mentees' : 'My students', icon: Users, badge: mentees.length },
        { id: 'sessions', label: '1-on-1 sessions', icon: Video, badge: pendingRequests || upcoming, alert: pendingRequests > 0 },
        { id: 'availability', label: 'Appointment availability', icon: CalendarClock },
      ],
    },
    {
      label: 'Work',
      items: [
        { id: 'pending', label: 'Pending tasks', icon: ListTodo, badge: pendingTotal, alert: pendingTotal > 0 },
        { id: 'notes', label: 'Session notes', icon: FileText, badge: notes.length },
        { id: 'assignments', label: 'Projects & assignments', icon: FolderKanban, badge: toReview, alert: toReview > 0 },
        { id: 'followups', label: 'Follow-ups', icon: ListChecks, badge: overdueTasks, alert: overdueTasks > 0 },
        { id: 'chat', label: 'Chat', icon: MessageSquare, badge: unreadMessages, alert: unreadMessages > 0 },
      ],
    },
    {
      label: 'Insights & pay',
      items: [
        { id: 'reports', label: 'Report analysis', icon: BarChart3 },
        { id: 'hours', label: 'Work hours', icon: Timer },
        { id: 'payments', label: 'Payment history', icon: Wallet },
        { id: 'expenses', label: 'Expenditure', icon: Receipt, badge: pendingClaims },
      ],
    },
    {
      label: 'Account',
      items: [
        { id: 'profile', label: 'Profile', icon: UserRound },
        { id: 'support', label: 'Support', icon: LifeBuoy },
      ],
    },
  ];

  const ctx: ProviderCtx = {
    kind,
    me,
    state,
    store,
    go,
    toast,
    mentees,
    requests,
    appointments,
    notes,
    tasks,
    sessionMinutes: sessionMinutesOf(me),
    openMentee: (id) => setMenteeId(id),
    chatWith: (id) => {
      setChatPartnerId(id);
      setMenteeId(null);
      go('chat');
    },
    chatPartnerId,
    setChatPartnerId,
    writeNotes: (apt) => setNotesFor(apt),
    editLink: (apt) => setLinkFor(apt),
    newTask: (studentId) => setTaskFor(studentId ?? null),
  };

  const body = (() => {
    switch (page) {
      case 'notifications':
        return <NotificationsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'mentees':
        return <MenteesPage />;
      case 'sessions':
        return <SessionsPage />;
      case 'availability':
        return <AvailabilityPage />;
      case 'pending':
        return <PendingPage />;
      case 'notes':
        return <NotesPage />;
      case 'assignments':
        return <AssignmentsPage />;
      case 'followups':
        return <FollowUpsPage />;
      case 'chat':
        return <ChatPage />;
      case 'reports':
        return <ReportsPage />;
      case 'hours':
        return <HoursPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'profile':
        return <ProfilePage />;
      case 'support':
        return <SupportPage />;
      default:
        return <DashboardPage />;
    }
  })();

  const pageIds = new Set(groups.flatMap((g) => g.items.map((i) => i.id)));

  const banner =
    me.approvalStatus !== 'approved' ? (
      <div className="flex items-start gap-3 rounded-[14px] border border-[#F4D49B] bg-[#FDF1DC] px-4 py-3 text-[13.5px] text-[#6B4100]">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        Your profile is awaiting approval by the Maxicareer team. Students can book you once it's approved.
      </div>
    ) : state.environment === 'demo' ? (
      <div className="flex items-center gap-2 rounded-[14px] border border-[#DDE4EF] bg-white px-4 py-2.5 text-[13px] text-[#5B6885]">
        <Sparkles className="w-4 h-4 text-[#F2A93B]" /> Sample data is loaded, so some students and sessions here are examples.
      </div>
    ) : null;

  return (
    <ProviderContext.Provider value={ctx}>
      <WorkspaceShell
        portalLabel={kind === 'mentor' ? 'Mentor workspace' : 'Counsellor workspace'}
        groups={groups}
        active={page}
        onNavigate={go}
        storageKey="maxicareer_provider_sidebar_collapsed"
        user={{ name: me.name, email: me.email, subtitle: `${roleLabel(kind)} · ${providerSubtitle(kind, me)}`, avatarUrl: me.avatarUrl }}
        notifications={state.notifications.map((n) => ({ id: n.id, title: n.title, body: n.description, createdAt: n.createdAt, read: n.read }))}
        onOpenNotification={(n) => {
          const full = state.notifications.find((x) => x.id === n.id);
          if (full && !full.read) markNotificationsRead([full.id]);
          const target = full?.actionTab ? PAGE_ALIASES[full.actionTab] || (full.actionTab as ProviderPage) : 'notifications';
          go(pageIds.has(target) ? target : 'notifications');
        }}
        onMarkAllRead={() => markNotificationsRead()}
        onViewAllNotifications={() => go('notifications')}
        onSignOut={onSignOut}
        onBackToSite={() => {
          window.location.href = '/';
        }}
        banner={banner}
      >
        {body}
      </WorkspaceShell>

      <MenteeDrawer studentId={menteeId} onClose={() => setMenteeId(null)} />
      <SessionNotesModal appointment={notesFor} onClose={() => setNotesFor(null)} />
      <MeetingLinkModal appointment={linkFor} onClose={() => setLinkFor(null)} />
      <TaskModal open={taskFor !== undefined} studentId={taskFor || undefined} onClose={() => setTaskFor(undefined)} />
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
    </ProviderContext.Provider>
  );
};
