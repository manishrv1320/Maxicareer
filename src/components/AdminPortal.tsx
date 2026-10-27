import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ChevronDown, ExternalLink, LogOut, PanelLeft, Menu, X, Search, AlertCircle, MessageCircle, Mail, Route, FileStack, Check, UserRound } from 'lucide-react';
import { DbStudent, MongoStats, StudentProfile, UserProfession } from '../types';
import { BrandLogo } from './BrandLogo';
import {
  AdminContext,
  AdminContextValue,
  AdminSession,
  AdminTab,
  AppNotification,
  Application,
  FormSubmission,
  ApprovalItem,
  AuditEntry,
  RoadmapTemplate,
  SessionItem,
  StudentRoadmap,
  NAV_GROUPS,
  SETTINGS_ITEM,
  ALL_TABS,
  tabLabel,
  tabGroup,
  COHORT_LABEL,
  roadmapProgress,
} from './admin/context';
import {
  usePersistentState,
  useDraft,
  confirmLeave,
  useSharedCollection,
  useSharedRecord,
  useSharedValue,
  setSharedErrorHandler,
  resetSharedData,
  uid,
  timeAgo,
  formatDate,
  inr,
  DAY_MS,
} from './admin/lib';
import { auth, SessionUser } from '../lib/api';
import { useCareerStore } from '../hooks/useCareerStore';
import { Button, Badge, Drawer, Modal, OneTimePasswordModal, Field, Input, Select, Textarea, StepMeter, Avatar, cx } from './admin/ui';
import { Dashboard } from './admin/pages/Dashboard';
import { Students, STATUS_LABEL, STATUS_TONE } from './admin/pages/Students';
import { Roadmaps } from './admin/pages/Roadmaps';
import { Applications, STAGE_TONE } from './admin/pages/Applications';
import { Notifications, CATEGORY_META, DEFAULT_PREFS, NotificationPrefs } from './admin/pages/Notifications';
import { Website } from './admin/pages/Website';
import { Approvals, AuditLog, PageAccess, DEFAULT_ROLE_PAGES, effectiveRolePages } from './admin/pages/Governance';
import { Counsellors, UserManagement, Programs, Services, Sessions, Reports, SettingsPage } from './admin/pages/Operations';
import { Curriculum, Assessments, Events } from './admin/pages/Learning';
import { Payments, Expenditure } from './admin/pages/Finance';
import { Feedback } from './admin/pages/Feedback';
import { Submissions } from './admin/pages/Submissions';
import { CareerPage } from './admin/pages/Careers';
import { Newsletter } from './admin/pages/Newsletter';

export type { AdminSession } from './admin/context';

interface AdminPortalProps {
  /** Public website, opened in a new tab so the admin portal stays open. */
  websiteUrl?: string;
  currentUserProfile?: StudentProfile | null;
  onStudentLogout?: () => void;
  onAdminAuthenticated?: (session: AdminSession) => void;
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_TEMPLATES: RoadmapTemplate[] = [
  { id: 'rm-1', cohort: 'school', title: 'Step-Ready: school career discovery', audience: 'Class 9–12', duration: '12 weeks', status: 'Published', milestones: ['Aptitude and strengths assessment', 'Explore streams and career families', 'Entrance exam strategy (CUET / JEE / SAT)', 'Shortlist colleges and courses', 'Build a 12-month action plan'] },
  { id: 'rm-2', cohort: 'college', title: 'Step-Next: placement ready', audience: 'Undergraduate and postgraduate students', duration: '16 weeks', status: 'Published', milestones: ['Skill gap and profile audit', 'Complete two portfolio projects', 'ATS resume and LinkedIn review', 'Mock technical and HR interviews', 'Off-campus applications and referrals', 'Offer evaluation'] },
  { id: 'rm-3', cohort: 'fresher', title: 'Step-In: first job launch', audience: 'Fresh graduates and PSW holders', duration: '8 weeks', status: 'Published', milestones: ['Career path and market mapping', 'Resume and cover letter overhaul', 'LinkedIn optimisation and recruiter outreach', 'Interview preparation and mock sessions', 'Industry networking and placement'] },
  { id: 'rm-4', cohort: 'working_professional', title: 'Step-Up: career transition', audience: 'Working professionals', duration: '10 weeks', status: 'Published', milestones: ['Benchmark current role and market value', 'Define transition goal and constraints', 'Executive narrative and resume redesign', 'Leadership and system design scenarios', 'Networking, interviews and negotiation'] },
];

/** "September 22, 2026" -> "2026-09-22" (local date). */
function toIsoDay(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "04:00 PM" -> "16:00". */
function to24h(value: string) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  if (!m) return value;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

const sessionFromUser = (u: SessionUser): AdminSession => ({ email: u.email, name: u.name, role: 'admin', staffRole: u.staffRole, loggedInAt: Date.now() });

const PROFESSION_LABEL: Record<UserProfession, string> = {
  school: 'School Student',
  college: 'College Student',
  fresher: 'Fresher / PSW',
  working_professional: 'Working Professional',
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const AdminPortal: React.FC<AdminPortalProps> = ({ websiteUrl = '/' }) => {
  const [hasMounted, setHasMounted] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [greeting, setGreeting] = useState('Good evening');

  // Signing in happens on the shared /login page; staff without a session are sent there.
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState<string | null>(null);

  // Shell
  const [activeTab, setActiveTab] = usePersistentState<AdminTab>('maxicareer_admin_tab', 'dashboard');
  const [collapsed, setCollapsed] = usePersistentState<boolean>('maxicareer_admin_sidebar_collapsed', false);
  const [mobileNav, setMobileNav] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [jump, setJump] = useState('');
  const [jumpOpen, setJumpOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; tone: 'default' | 'error' }[]>([]);

  // Data
  const [students, setStudents] = useState<DbStudent[]>([]);
  const [stats, setStats] = useState<MongoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Shared with every admin through MongoDB (loaded once signed in)
  const enabled = !!session;
  const [notifications, setNotifications] = useSharedCollection<AppNotification>('notifications', [], { enabled, refreshMs: 30_000 });
  const [submissions, setSubmissions] = useSharedCollection<FormSubmission>('submissions', [], { enabled, refreshMs: 30_000 });
  const [dismissedAuto, setDismissedAuto] = useSharedValue<string[]>('notifications_seen', [], { enabled });
  const [auditEntries, setAuditEntries] = useSharedCollection<AuditEntry>('audit', [], { enabled });
  const [applications, setApplications] = useSharedCollection<Application>('applications', [], { enabled });
  const [templates, setTemplates] = useSharedCollection<RoadmapTemplate>('templates', DEFAULT_TEMPLATES, { enabled });
  const [studentRoadmaps, setStudentRoadmaps] = useSharedRecord<StudentRoadmap>('roadmaps', { enabled });
  const [approvals, setApprovals] = useSharedCollection<ApprovalItem>('approvals', [], { enabled, refreshMs: 60_000 });
  const [adminSessions, setAdminSessions] = useSharedCollection<SessionItem>('sessions', [], { enabled });
  const [notificationPrefs] = useSharedValue<NotificationPrefs>('notification_prefs', DEFAULT_PREFS, { enabled });
  const [rolePages] = useSharedValue<Record<string, string[]>>('role_pages', DEFAULT_ROLE_PAGES, { enabled });
  const prefsRef = useRef(notificationPrefs);
  prefsRef.current = notificationPrefs;

  // Counsellors, mentors and student bookings from the shared platform data
  const { state: platform, updateAppointmentStatus, updateCounselorApproval, updateMentorApproval } = useCareerStore();
  const mentorOptions = useMemo(
    () =>
      Array.from(
        new Set([...platform.counselors, ...platform.mentors].filter((p) => p.approvalStatus === 'approved').map((p) => p.name))
      ).sort(),
    [platform.counselors, platform.mentors]
  );

  const approvedNames = (list: { name: string; approvalStatus: string }[]) =>
    Array.from(new Set(list.filter((p) => p.approvalStatus === 'approved').map((p) => p.name))).sort();
  const mentorNames = useMemo(() => approvedNames(platform.mentors), [platform.mentors]);
  const counsellorNames = useMemo(() => approvedNames(platform.counselors), [platform.counselors]);

  // Sessions = ones scheduled here + sessions students booked with counsellors
  const appointmentSessions = useMemo<SessionItem[]>(
    () =>
      platform.appointments.map((a) => ({
        id: `apt:${a.id}`,
        date: toIsoDay(a.date),
        time: to24h(a.time),
        studentName: a.studentName,
        topic: a.topic || a.counselingType,
        mentor: a.counselorName,
        mode: 'Video call',
        status: a.status === 'completed' ? 'Completed' : a.status === 'cancelled' ? 'Cancelled' : 'Upcoming',
      })),
    [platform.appointments]
  );
  const sessions = useMemo(() => [...adminSessions, ...appointmentSessions], [adminSessions, appointmentSessions]);
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const setSessions = useCallback<React.Dispatch<React.SetStateAction<SessionItem[]>>>(
    (next) => {
      const prev = sessionsRef.current;
      const value = typeof next === 'function' ? next(prev) : next;
      setAdminSessions(value.filter((x) => !x.id.startsWith('apt:')));
      value
        .filter((x) => x.id.startsWith('apt:'))
        .forEach((x) => {
          const old = prev.find((o) => o.id === x.id);
          if (old && old.status !== x.status) {
            updateAppointmentStatus(x.id.slice(4), x.status === 'Completed' ? 'completed' : x.status === 'Cancelled' ? 'cancelled' : 'scheduled');
          }
        });
    },
    [setAdminSessions, updateAppointmentStatus]
  );

  const [roadmapFocus, setRoadmapFocus] = useState<string | null>(null);
  const [studentPrefilter, setStudentPrefilter] = useState<{ cohort?: string; status?: string } | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newLogin, setNewLogin] = useState(true);
  const [issuedPassword, setIssuedPassword] = useState<{ email: string; password: string } | null>(null);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', phone: '+91 ', city: '', profession: 'college' as UserProfession, institutionOrCompany: '', planName: 'Step-Next career program', planPrice: 15999, mentorAssigned: 'Unassigned', detail: '' });

  const sessionRef = useRef<AdminSession | null>(null);
  sessionRef.current = session;

  /* ---------------- helpers ---------------- */

  const toast = useCallback((message: string, tone: 'default' | 'error' = 'default') => {
    const id = uid('t');
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const addAudit = useCallback(
    (module: string, action: string, target: string) => {
      const entry: AuditEntry = { id: uid('log'), at: new Date().toISOString(), actor: sessionRef.current?.email || 'admin@maxicareer.com', module, action, target };
      setAuditEntries((prev) => [entry, ...prev].slice(0, 5000));
    },
    [setAuditEntries]
  );

  const notify = useCallback<AdminContextValue['notify']>(
    (n) => {
      if (prefsRef.current.categories?.[n.category]?.inApp === false) return;
      setNotifications((prev) => [{ id: n.id || uid('n'), title: n.title, body: n.body, category: n.category, link: n.link, priority: n.priority || 'normal', read: false, createdAt: new Date().toISOString() }, ...prev].slice(0, 300));
    },
    [setNotifications]
  );

  /** Opens a page without asking about unsaved edits (the caller already did). */
  const navigate = useCallback(
    (tab: AdminTab) => {
      setActiveTab(tab);
      setMobileNav(false);
      setBellOpen(false);
      setUserMenu(false);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
    },
    [setActiveTab]
  );
  const go = useCallback(
    (tab: AdminTab) => {
      if (confirmLeave()) navigate(tab);
    },
    [navigate]
  );

  /* ---------------- students API ---------------- */

  const refreshStudents = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.success) {
        setStudents(data.data || []);
        if (data.stats) setStats(data.stats);
      } else setLoadError(data.message || 'The server returned an error');
    } catch (err: any) {
      setLoadError(err?.message || 'Network error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const patchStudent = useCallback(async (id: string, patch: Partial<DbStudent>) => {
    setStudents((prev) => prev.map((s) => (s._id === id ? { ...s, ...patch } : s)));
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const data = await res.json();
      if (data.success && data.data) setStudents((prev) => prev.map((s) => (s._id === id ? data.data : s)));
      if (data.stats) setStats(data.stats);
    } catch {
      toast("Couldn't save that change. Check your connection and try again.", 'error');
    }
  }, [toast]);

  const deleteStudent = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) => prev.filter((s) => s._id !== id));
        if (data.stats) setStats(data.stats);
        setSelectedStudentId((cur) => (cur === id ? null : cur));
      }
    } catch {
      toast("Couldn't delete the student.", 'error');
    }
  }, [toast]);

  const createStudent = useCallback(async (body: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success && data.data) {
        setStudents((prev) => [data.data, ...prev]);
        if (data.stats) setStats(data.stats);
        return { student: data.data as DbStudent, login: data.login };
      }
    } catch {}
    return null;
  }, []);

  /* ---------------- mount ---------------- */

  useEffect(() => {
    setHasMounted(true);
    setSharedErrorHandler((m) => toast(m, 'error'));
    auth
      .me()
      .then((res) => {
        if (res.user?.staffRole && res.user.status === 'active') {
          setSession(sessionFromUser(res.user));
          setMustChangePassword(Boolean(res.user.mustChangePassword));
        } else {
          window.location.replace('/login');
        }
      })
      .catch(() => window.location.replace('/login'));
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load student records once a staff member is signed in, and keep them fresh.
  useEffect(() => {
    if (!session) return;
    refreshStudents();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') refreshStudents();
    }, 30_000);
    return () => clearInterval(t);
  }, [session, refreshStudents]);

  /* ---------------- automatic notifications ---------------- */
  useEffect(() => {
    if (!session || isLoading) return;
    const seen = new Set(dismissedAuto);
    const fresh: AppNotification[] = [];
    const now = Date.now();
    const push = (id: string, n: Omit<AppNotification, 'id' | 'read'>) => {
      if (seen.has(id) || notifications.some((x) => x.id === id)) return;
      seen.add(id);
      fresh.push({ ...n, id, read: false });
    };
    students.forEach((s) => {
      const age = now - new Date(s.createdAt).getTime();
      if (age < 7 * DAY_MS) push(`auto-reg-${s._id}`, { title: `New registration: ${s.name}`, body: `${COHORT_LABEL[s.profession] || s.professionLabel} · ${s.planName.split('(')[0].trim()}`, category: 'students', priority: 'normal', createdAt: s.createdAt, link: 'students' });
    });
    sessions.forEach((s) => {
      const d = Math.round((new Date(s.date).getTime() - now) / DAY_MS);
      if (s.status === 'Upcoming' && d >= -1 && d <= 1) push(`auto-sess-${s.id}`, { title: `Session soon: ${s.studentName}`, body: `${s.topic}, ${formatDate(s.date)} at ${s.time} with ${s.mentor}`, category: 'sessions', priority: 'normal', createdAt: new Date().toISOString(), link: 'sessions' });
    });
    applications.forEach((a) => {
      if (!a.deadline || ['Offer', 'Rejected', 'Withdrawn'].includes(a.stage)) return;
      const d = Math.round((new Date(a.deadline).getTime() - now) / DAY_MS);
      if (d >= 0 && d <= 3) push(`auto-dl-${a.id}-${a.deadline}`, { title: `Deadline in ${d === 0 ? 'under a day' : `${d} day${d > 1 ? 's' : ''}`}`, body: `${a.studentName} → ${a.organisation}`, category: 'applications', priority: 'high', createdAt: new Date().toISOString(), link: 'applications' });
    });
    if (fresh.length) {
      const prefs = prefsRef.current;
      setNotifications((prev) => [...fresh.filter((n) => prefs.categories?.[n.category]?.inApp !== false), ...prev].slice(0, 300));
      setDismissedAuto(Array.from(seen).slice(-1000));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isLoading, students, sessions, applications]);

  /* ---------------- auth ---------------- */

  const handleLogout = async () => {
    if (!confirmLeave()) return;
    addAudit('Access', 'Signed out', session?.email || '');
    await auth.logout().catch(() => {});
    resetSharedData();
    window.location.assign('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (pwForm.next.length < 8) return setPwError('Use at least 8 characters.');
    if (pwForm.next !== pwForm.confirm) return setPwError("The new passwords don't match.");
    try {
      await auth.changePassword(pwForm.current, pwForm.next);
      setMustChangePassword(false);
      setPwForm({ current: '', next: '', confirm: '' });
      addAudit('Access', 'Changed password', session?.email || '');
      toast('Password updated.');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Could not change the password.');
    }
  };

  /* ---------------- derived ---------------- */

  const allowedTabs = useMemo(() => {
    const role = session?.staffRole;
    if (!role || role === 'Global admin') return null; // everything
    return new Set<string>([...(effectiveRolePages(rolePages)[role] || ['dashboard']), 'settings']);
  }, [session?.staffRole, rolePages]);
  const canSee = (tab: AdminTab) => !allowedTabs || allowedTabs.has(tab);
  const visibleGroups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => canSee(i.id)) })).filter((g) => g.items.length);

  useEffect(() => {
    if (session && !canSee(activeTab)) setActiveTab((visibleGroups[0]?.items[0]?.id as AdminTab) || 'settings');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, allowedTabs, activeTab]);

  const unread = notifications.filter((n) => !n.read).length;
  const selectedStudent = students.find((s) => s._id === selectedStudentId) || null;

  // Status, mentor, counsellor and notes in the student drawer save with its Save button.
  const studentSaved = useMemo(
    () =>
      selectedStudent && {
        status: selectedStudent.status,
        mentorAssigned: selectedStudent.mentorAssigned || 'Unassigned',
        counselorAssigned: selectedStudent.counselorAssigned || 'Unassigned',
        notes: selectedStudent.notes || '',
      },
    [selectedStudent]
  );
  const [studentEdits, setStudentEdits, studentDraft] = useDraft(studentSaved, selectedStudentId);
  const closeStudent = () => {
    if (studentDraft.dirty && !window.confirm(`Close without saving your changes for ${selectedStudent?.name || 'this student'}?`)) return;
    setSelectedStudentId(null);
  };
  const saveStudentEdits = async () => {
    if (!selectedStudent || !studentSaved || !studentEdits) return;
    const s = selectedStudent;
    const patch: Partial<DbStudent> = {};
    if (studentEdits.status !== studentSaved.status) patch.status = studentEdits.status;
    if (studentEdits.mentorAssigned !== studentSaved.mentorAssigned) patch.mentorAssigned = studentEdits.mentorAssigned;
    if (studentEdits.counselorAssigned !== studentSaved.counselorAssigned) patch.counselorAssigned = studentEdits.counselorAssigned;
    if (studentEdits.notes !== studentSaved.notes) patch.notes = studentEdits.notes;
    await patchStudent(s._id, patch);
    if (patch.status) addAudit('Students', 'Changed status', `${s.name} → ${STATUS_LABEL[patch.status]}`);
    if (patch.mentorAssigned) addAudit('Students', 'Assigned mentor', `${s.name} → ${patch.mentorAssigned}`);
    if (patch.counselorAssigned) addAudit('Students', 'Assigned counsellor', `${s.name} → ${patch.counselorAssigned}`);
    if (patch.notes !== undefined) addAudit('Students', 'Updated notes', s.name);
    toast(`Saved changes for ${s.name}.`);
  };

  const jumpResults = useMemo(() => {
    const q = jump.trim().toLowerCase();
    if (!q) return { pages: ALL_TABS.filter((t) => canSee(t.id)).slice(0, 6), people: [] as DbStudent[] };
    return {
      pages: ALL_TABS.filter((t) => canSee(t.id) && (t.label.toLowerCase().includes(q) || tabGroup(t.id).toLowerCase().includes(q))).slice(0, 6),
      people: students.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)).slice(0, 5),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump, students, allowedTabs]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('mc-jump')?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* ================================================================== */
  /* Render: loading                                                     */
  /* ================================================================== */

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#0D1B3E] flex items-center justify-center">
        <div className="flex items-end gap-1 h-8" aria-label="Loading">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="w-2.5 rounded-sm bg-[#38BDF8] animate-pulse" style={{ height: `${(i + 1) * 25}%`, animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  // No staff session: the redirect to /login is already under way.
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0D1B3E] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#38BDF8] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  /* ================================================================== */
  /* Render: workspace                                                   */
  /* ================================================================== */

  const ctx: AdminContextValue = {
    session,
    go,
    canSee,
    toast,
    addAudit,
    notify,
    students,
    stats,
    isLoading,
    isRefreshing,
    loadError,
    refreshStudents,
    patchStudent,
    deleteStudent,
    createStudent,
    openStudent: (s) => setSelectedStudentId(s._id),
    notifications,
    setNotifications,
    submissions,
    setSubmissions,
    auditEntries,
    setAuditEntries,
    applications,
    setApplications,
    templates,
    setTemplates,
    studentRoadmaps,
    setStudentRoadmaps,
    approvals,
    setApprovals,
    sessions,
    setSessions,
    roadmapFocus,
    setRoadmapFocus,
    studentPrefilter,
    setStudentPrefilter,
    openAddStudent: () => setAddOpen(true),
    mentorOptions,
    mentorNames,
    counsellorNames,
    platform,
    setProviderApproval: (kind, id, status) => (kind === 'counselor' ? updateCounselorApproval(id, status) : updateMentorApproval(id, status)),
  };

  const badgeFor = (id: AdminTab): React.ReactNode => {
    if (id === 'notifications' && unread) return <span className="mc-num rounded-full bg-[#F2A93B] text-[#0D1B3E] text-[11px] font-semibold px-1.5 min-w-[20px] text-center">{unread > 99 ? '99+' : unread}</span>;
    if (id === 'students') return <span className="mc-num text-[11.5px] text-[#8FA3CC]">{students.length}</span>;
    if (id === 'submissions') {
      const n = submissions.filter((s) => s.status === 'New').length;
      return n ? <span className="mc-num rounded-full bg-[#F2A93B] text-[#0D1B3E] text-[11px] font-semibold px-1.5 min-w-[20px] text-center">{n > 99 ? '99+' : n}</span> : null;
    }
    if (id === 'approvals') {
      const n = approvals.filter((a) => a.status === 'Pending').length;
      return n ? <span className="mc-num rounded-full bg-[#F2A93B] text-[#0D1B3E] text-[11px] font-semibold px-1.5 min-w-[20px] text-center">{n}</span> : null;
    }
    if (id === 'applications') {
      const n = applications.filter((a) => !['Offer', 'Rejected', 'Withdrawn'].includes(a.stage)).length;
      return n ? <span className="mc-num text-[11.5px] text-[#8FA3CC]">{n}</span> : null;
    }
    return null;
  };

  const sidebar = (isMobile: boolean) => {
    const narrow = collapsed && !isMobile;
    return (
      <div className="flex h-full flex-col">
        <div className={cx('h-16 flex items-center shrink-0 border-b border-white/[0.07]', narrow ? 'justify-center px-2' : 'justify-between px-5')}>
          {!narrow && (
            <button type="button" onClick={() => go('dashboard')} aria-label="Dashboard">
              <BrandLogo variant="dark" className="h-7 w-auto" />
            </button>
          )}
          {isMobile ? (
            <button type="button" onClick={() => setMobileNav(false)} className="p-2 rounded-[8px] text-[#AFC0E3] hover:bg-white/10" aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-[8px] text-[#8FA3CC] hover:text-white hover:bg-white/10" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 mc-scroll-dark" aria-label="Admin">
          {visibleGroups.map((g) => (
            <div key={g.label}>
              {!narrow ? <div className="px-3 mb-1.5 text-[12px] font-medium text-[#7C8FB8]">{g.label}</div> : <div className="mx-3 mb-2 h-px bg-white/[0.08]" />}
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active = activeTab === it.id;
                  return (
                    <li key={it.id}>
                      <button
                        type="button"
                        onClick={() => go(it.id)}
                        title={narrow ? it.label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={cx(
                          'relative w-full flex items-center gap-3 rounded-[9px] text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]',
                          narrow ? 'justify-center h-10' : 'h-9 px-3',
                          active ? 'bg-white/[0.09] text-white font-semibold' : 'text-[#C3D0EA] hover:text-white hover:bg-white/[0.05] font-medium'
                        )}
                      >
                        {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#38BDF8]" aria-hidden />}
                        <Icon className={cx('w-[17px] h-[17px] shrink-0', active ? 'text-[#38BDF8]' : 'text-[#8FA3CC]')} />
                        {!narrow && <span className="flex-1 text-left truncate">{it.label}</span>}
                        {!narrow && badgeFor(it.id)}
                        {narrow && it.id === 'notifications' && unread > 0 && <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-[#F2A93B]" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/[0.07] p-3 space-y-0.5">
          <button
            type="button"
            onClick={() => go('settings')}
            className={cx('w-full flex items-center gap-3 rounded-[9px] text-[13.5px] font-medium', narrow ? 'justify-center h-10' : 'h-9 px-3', activeTab === 'settings' ? 'bg-white/[0.09] text-white' : 'text-[#C3D0EA] hover:text-white hover:bg-white/[0.05]')}
          >
            <SETTINGS_ITEM.icon className="w-[17px] h-[17px] text-[#8FA3CC]" />
            {!narrow && 'Settings'}
          </button>
          <button type="button" onClick={handleLogout} className={cx('w-full flex items-center gap-3 rounded-[9px] text-[13.5px] font-medium text-[#C3D0EA] hover:text-white hover:bg-white/[0.05]', narrow ? 'justify-center h-10' : 'h-9 px-3')}>
            <LogOut className="w-[17px] h-[17px] text-[#8FA3CC]" />
            {!narrow && 'Sign out'}
          </button>
        </div>
      </div>
    );
  };

  const page = (() => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard greeting={greeting} />;
      case 'notifications':
        return <Notifications />;
      case 'submissions':
        return <Submissions />;
      case 'students':
        return <Students />;
      case 'counsellors':
        return <Counsellors />;
      case 'users':
        return <UserManagement />;
      case 'programs':
        return <Programs />;
      case 'services':
        return <Services />;
      case 'roadmaps':
        return <Roadmaps />;
      case 'sessions':
        return <Sessions />;
      case 'applications':
        return <Applications />;
      case 'reports':
        return <Reports />;
      case 'feedback':
        return <Feedback />;
      case 'curriculum':
        return <Curriculum />;
      case 'assessments':
        return <Assessments />;
      case 'events':
        return <Events />;
      case 'payments':
        return <Payments />;
      case 'expenditure':
        return <Expenditure />;
      case 'web-careers':
        return <CareerPage />;
      case 'newsletter':
        return <Newsletter />;
      case 'approvals':
        return <Approvals />;
      case 'audit':
        return <AuditLog />;
      case 'access':
        return <PageAccess />;
      case 'settings':
        return <SettingsPage onLogout={handleLogout} websiteUrl={websiteUrl} />;
      default:
        if (activeTab.startsWith('web-')) return <Website key={activeTab} tab={activeTab} />;
        return <Dashboard greeting={greeting} />;
    }
  })();

  const latest = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const studentRoadmap = selectedStudent ? studentRoadmaps[selectedStudent._id] : undefined;
  const studentApps = selectedStudent ? applications.filter((a) => a.studentId === selectedStudent._id || a.studentEmail.toLowerCase() === selectedStudent.email.toLowerCase()) : [];

  return (
    <AdminContext.Provider value={ctx}>
      <div className="mc-admin min-h-screen bg-[#F3F6FB] text-[#0D1B3E] flex">
        {/* Desktop sidebar */}
        <aside className={cx('hidden lg:block shrink-0 bg-[#0D1B3E] sticky top-0 h-screen transition-[width] duration-200 z-30', collapsed ? 'w-[72px]' : 'w-[248px]')}>{sidebar(false)}</aside>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {mobileNav && (
            <div className="lg:hidden fixed inset-0 z-[60]">
              <motion.div className="absolute inset-0 bg-[#0D1B3E]/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)} />
              <motion.aside className="absolute left-0 top-0 h-full w-[272px] bg-[#0D1B3E]" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween', duration: 0.2 }}>
                {sidebar(true)}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-40 h-16 bg-[#F3F6FB]/90 backdrop-blur-md border-b border-[#DDE4EF] flex items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setMobileNav(true)} className="lg:hidden p-2 -ml-2 rounded-[8px] text-[#26355A] hover:bg-[#E9EEF5]" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[13.5px] min-w-0">
              <span className="text-[#7A869E]">{tabGroup(activeTab)}</span>
              <span className="text-[#B7C3D7]">/</span>
              <span className="font-semibold text-[#0D1B3E] truncate">{tabLabel(activeTab)}</span>
            </div>

            {/* Jump to */}
            <div className="relative ml-auto w-full max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C97AE]" />
              <input
                id="mc-jump"
                value={jump}
                onChange={(e) => setJump(e.target.value)}
                onFocus={() => setJumpOpen(true)}
                onBlur={() => setTimeout(() => setJumpOpen(false), 150)}
                placeholder="Jump to a page or student"
                className="w-full h-9 rounded-[10px] border border-[#D3DBE8] bg-white pl-9 pr-12 text-[13.5px] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                aria-label="Jump to a page or student"
              />
              <kbd className="hidden md:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#8C97AE] border border-[#DDE4EF] rounded px-1.5">Ctrl K</kbd>
              {jumpOpen && (
                <div className="absolute left-0 right-0 mt-2 rounded-[14px] border border-[#DDE4EF] bg-white shadow-[0_12px_32px_-12px_rgba(13,27,62,0.25)] py-2 z-50">
                  {jumpResults.pages.length > 0 && <div className="px-3 pb-1 text-[12px] text-[#7A869E]">Pages</div>}
                  {jumpResults.pages.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button key={p.id} type="button" onMouseDown={() => { go(p.id); setJump(''); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13.5px] hover:bg-[#F3F6FB]">
                        <Icon className="w-4 h-4 text-[#7A869E]" /> {p.label}
                        <span className="ml-auto text-[12px] text-[#8C97AE]">{tabGroup(p.id)}</span>
                      </button>
                    );
                  })}
                  {jumpResults.people.length > 0 && <div className="px-3 pt-2 pb-1 text-[12px] text-[#7A869E] border-t border-[#EAEFF6] mt-1">Students</div>}
                  {jumpResults.people.map((s) => (
                    <button key={s._id} type="button" onMouseDown={() => { setSelectedStudentId(s._id); setJump(''); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13.5px] hover:bg-[#F3F6FB]">
                      <Avatar name={s.name} size={22} /> <span className="truncate">{s.name}</span>
                      <span className="ml-auto text-[12px] text-[#8C97AE] truncate max-w-[120px]">{s.email}</span>
                    </button>
                  ))}
                  {!jumpResults.pages.length && !jumpResults.people.length && <div className="px-3 py-3 text-[13px] text-[#5B6885]">No matches for "{jump}"</div>}
                </div>
              )}
            </div>

            {/* Bell */}
            <div className="relative">
              <button type="button" onClick={() => { setBellOpen(!bellOpen); setUserMenu(false); }} className="relative h-9 w-9 flex items-center justify-center rounded-[10px] text-[#26355A] hover:bg-[#E9EEF5]" aria-label={`Notifications, ${unread} unread`}>
                <Bell className="w-[18px] h-[18px]" />
                {unread > 0 && <span className="mc-num absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F2A93B] text-[#0D1B3E] text-[10.5px] font-bold flex items-center justify-center ring-2 ring-[#F3F6FB]">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-[16px] border border-[#DDE4EF] bg-white shadow-[0_16px_40px_-16px_rgba(13,27,62,0.3)] z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEFF6]">
                      <span className="mc-display text-[15px] font-semibold">Notifications</span>
                      {unread > 0 && (
                        <button type="button" className="text-[12.5px] font-semibold text-[#2563EB] inline-flex items-center gap-1" onClick={() => setNotifications((p) => p.map((n) => ({ ...n, read: true })))}>
                          <Check className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>
                    <ul className="max-h-[360px] overflow-y-auto divide-y divide-[#EAEFF6]">
                      {latest.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-[#5B6885]">Nothing new.</li>}
                      {latest.map((n) => {
                        const meta = CATEGORY_META[n.category];
                        const Icon = meta.icon;
                        return (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setNotifications((p) => p.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                                go(n.link || 'notifications');
                              }}
                              className={cx('w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#F7F9FC]', !n.read && 'bg-[#FFFBF3]')}
                            >
                              <span className={cx('h-8 w-8 shrink-0 rounded-[9px] flex items-center justify-center', meta.cls)}>
                                <Icon className="w-4 h-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className={cx('block text-[13.5px] truncate', n.read ? 'font-medium' : 'font-semibold')}>{n.title}</span>
                                <span className="block text-[12px] text-[#7A869E]">{timeAgo(n.createdAt)}</span>
                              </span>
                              {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-[#F2A93B] shrink-0" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <button type="button" onClick={() => go('notifications')} className="w-full px-4 py-3 text-[13px] font-semibold text-[#2563EB] border-t border-[#EAEFF6] hover:bg-[#F7F9FC]">
                      Open notifications
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* User */}
            <div className="relative">
              <button type="button" onClick={() => { setUserMenu(!userMenu); setBellOpen(false); }} className="flex items-center gap-2 rounded-[10px] p-1 pr-2 hover:bg-[#E9EEF5]" aria-label="Account menu">
                <Avatar name={session.name} size={30} tone="blue" />
                <span className="hidden md:block text-left">
                  <span className="block text-[13px] font-semibold leading-tight">{session.name}</span>
                  <span className="block text-[11.5px] text-[#7A869E] leading-tight">{session.staffRole || 'Administrator'}</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C97AE]" />
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-60 rounded-[14px] border border-[#DDE4EF] bg-white shadow-[0_16px_40px_-16px_rgba(13,27,62,0.3)] p-1.5 z-50">
                    <div className="px-3 py-2.5 border-b border-[#EAEFF6] mb-1">
                      <div className="text-[13.5px] font-semibold">{session.name}</div>
                      <div className="text-[12px] text-[#7A869E] truncate">{session.email}</div>
                    </div>
                    <button type="button" onClick={() => go('settings')} className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13.5px] hover:bg-[#F3F6FB]">
                      <UserRound className="w-4 h-4 text-[#7A869E]" /> My profile
                    </button>
                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer" onClick={() => setUserMenu(false)} className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13.5px] hover:bg-[#F3F6FB]">
                      <ExternalLink className="w-4 h-4 text-[#7A869E]" /> View website
                    </a>
                    <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13.5px] text-[#B42F3B] hover:bg-[#FCEBEC]">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </header>

          <main className="mc-canvas flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="max-w-[1320px] mx-auto">{page}</div>
          </main>
        </div>

        {/* Student drawer */}
        <Drawer
          open={!!selectedStudent}
          onClose={closeStudent}
          title={selectedStudent?.name}
          subtitle={selectedStudent && <span className="mc-num">{selectedStudent.email}</span>}
          footer={
            selectedStudent && (
              <>
                <a href={`https://wa.me/${selectedStudent.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0F9F6E] px-4 text-[13.5px] font-semibold text-white hover:bg-[#0B8A5F]">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <a href={`mailto:${selectedStudent.email}`} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#2563EB] px-4 text-[13.5px] font-semibold text-white hover:bg-[#1D4FD7]">
                  <Mail className="w-4 h-4" /> Email
                </a>
              </>
            )
          }
        >
          {selectedStudent && (
            <div className="space-y-6">
              {/* Course Confirmation Banner for Pending Registrations */}
              {selectedStudent.status === 'pending' && (
                <div className="rounded-[14px] border border-amber-300 bg-amber-50/80 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>New Course Registration • Awaiting Confirmation</span>
                      </div>
                      <h4 className="text-[15px] font-bold text-[#0D1B3E] mt-0.5">
                        {selectedStudent.planName}
                      </h4>
                      <p className="text-[12.5px] text-[#5B6885]">
                        Review registration details and confirm course enrollment to assign a mentor and activate their roadmap.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        patchStudent(selectedStudent._id, {
                          status: 'enrolled',
                          mentorAssigned:
                            !selectedStudent.mentorAssigned || selectedStudent.mentorAssigned === 'Unassigned'
                              ? mentorOptions[0] || 'Unassigned'
                              : selectedStudent.mentorAssigned,
                        });
                        addAudit(
                          'Students',
                          'Confirmed course enrollment',
                          `${selectedStudent.name}: ${selectedStudent.planName} → Enrolled`
                        );
                        notify({
                          title: `Course enrollment confirmed: ${selectedStudent.name}`,
                          body: `Confirmed for ${selectedStudent.planName}. Mentor: ${selectedStudent.mentorAssigned && selectedStudent.mentorAssigned !== 'Unassigned' ? selectedStudent.mentorAssigned : mentorOptions[0] || 'not assigned yet'}.`,
                          category: 'applications',
                          priority: 'high',
                          link: 'students',
                        });
                        toast(`Course confirmed for ${selectedStudent.name}! Enrolled in ${selectedStudent.planName}.`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-bold shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Course &amp; Enroll</span>
                    </button>

                    <a
                      href={`https://wa.me/${selectedStudent.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hello ${selectedStudent.name}! Congratulations, your course registration for "${selectedStudent.planName}" at Maxicareer has been verified and confirmed! Our mentorship team is ready to schedule your 1:1 onboarding session.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[12.5px] font-semibold border border-emerald-300/80 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Send WhatsApp Confirmation</span>
                    </a>

                    <a
                      href={`mailto:${selectedStudent.email}?subject=${encodeURIComponent(
                        `Maxicareer Course Confirmation: ${selectedStudent.planName}`
                      )}&body=${encodeURIComponent(
                        `Dear ${selectedStudent.name},\n\nWe are delighted to confirm your registration for the ${selectedStudent.planName} at Maxicareer!\n\nOur team has verified your details and your assigned mentor will be in touch shortly to schedule your personalized 1:1 strategy session.\n\nWarm regards,\nMaxicareer Team`
                      )}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-blue-100 hover:bg-blue-200 text-blue-900 text-[12.5px] font-semibold border border-blue-300/80 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-700" />
                      <span>Send Email Confirmation</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Status">
                  <Select
                    value={studentEdits?.status || selectedStudent.status}
                    onChange={(e) => setStudentEdits((d) => d && { ...d, status: e.target.value as DbStudent['status'] })}
                  >
                    {Object.entries(STATUS_LABEL).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Mentor">
                  <Select
                    value={studentEdits?.mentorAssigned || 'Unassigned'}
                    onChange={(e) => setStudentEdits((d) => d && { ...d, mentorAssigned: e.target.value })}
                  >
                    <option>Unassigned</option>
                    {selectedStudent.mentorAssigned && selectedStudent.mentorAssigned !== 'Unassigned' && !mentorNames.includes(selectedStudent.mentorAssigned) && (
                      <option>{selectedStudent.mentorAssigned}</option>
                    )}
                    {mentorNames.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Counsellor">
                  <Select
                    value={studentEdits?.counselorAssigned || 'Unassigned'}
                    onChange={(e) => setStudentEdits((d) => d && { ...d, counselorAssigned: e.target.value })}
                  >
                    <option>Unassigned</option>
                    {selectedStudent.counselorAssigned && selectedStudent.counselorAssigned !== 'Unassigned' && !counsellorNames.includes(selectedStudent.counselorAssigned) && (
                      <option>{selectedStudent.counselorAssigned}</option>
                    )}
                    {counsellorNames.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13.5px]">
                {[
                  ['Phone', selectedStudent.phone || '—'],
                  ['City', selectedStudent.city || '—'],
                  ['Cohort', COHORT_LABEL[selectedStudent.profession] || selectedStudent.professionLabel],
                  ['Institution', selectedStudent.institutionOrCompany || '—'],
                  ['Program', selectedStudent.planName],
                  ['Fee', inr(selectedStudent.planPrice)],
                  ['Registered', formatDate(selectedStudent.createdAt)],
                  ['Source', selectedStudent.source.replace(/_/g, ' ')],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[12.5px] text-[#7A869E]">{k}</dt>
                    <dd className="font-medium text-[#0D1B3E] break-words">{v}</dd>
                  </div>
                ))}
              </dl>

              {selectedStudent.detail && (
                <div>
                  <div className="text-[12.5px] text-[#7A869E] mb-1">Goals and background</div>
                  <p className="text-[13.5px] text-[#26355A] leading-relaxed">{selectedStudent.detail}</p>
                </div>
              )}

              <section className="rounded-[14px] border border-[#DDE4EF] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-[#2563EB]" />
                    <span className="mc-display text-[15px] font-semibold">Roadmap</span>
                  </div>
                  <Button size="sm" onClick={() => { if (!confirmLeave()) return; setRoadmapFocus(selectedStudent._id); setSelectedStudentId(null); navigate('roadmaps'); }}>
                    {studentRoadmap ? 'Edit roadmap' : 'Create roadmap'}
                  </Button>
                </div>
                {studentRoadmap ? (
                  <>
                    <div className="mt-3 flex items-end gap-3">
                      <StepMeter value={roadmapProgress(studentRoadmap)} steps={8} height={26} width={120} />
                      <span className="mc-display mc-num text-[22px] font-semibold leading-none">{roadmapProgress(studentRoadmap)}%</span>
                    </div>
                    <ul className="mt-3 space-y-1 text-[13px]">
                      {studentRoadmap.milestones.slice(0, 5).map((m) => (
                        <li key={m.id} className="flex items-center gap-2">
                          <span className={cx('h-2 w-2 rounded-full', m.status === 'done' ? 'bg-[#0F9F6E]' : m.status === 'doing' ? 'bg-[#2563EB]' : m.status === 'blocked' ? 'bg-[#D93F4C]' : 'bg-[#CBD4E2]')} />
                          <span className={m.status === 'done' ? 'text-[#7A869E] line-through' : 'text-[#26355A]'}>{m.title}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-2 text-[13px] text-[#5B6885]">No personal roadmap yet.</p>
                )}
              </section>

              <section className="rounded-[14px] border border-[#DDE4EF] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileStack className="w-4 h-4 text-[#6D4AE0]" />
                    <span className="mc-display text-[15px] font-semibold">Applications</span>
                  </div>
                  <Button size="sm" onClick={() => { if (!confirmLeave()) return; setSelectedStudentId(null); navigate('applications'); }}>
                    Open applications
                  </Button>
                </div>
                {studentApps.length ? (
                  <ul className="mt-3 space-y-2">
                    {studentApps.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 text-[13px]">
                        <span className="truncate">
                          {a.organisation} <span className="text-[#7A869E]">· {a.role || a.type}</span>
                        </span>
                        <Badge tone={STAGE_TONE[a.stage]}>{a.stage}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[13px] text-[#5B6885]">None tracked yet.</p>
                )}
              </section>

              <Field label="Counsellor notes">
                <Textarea
                  rows={4}
                  value={studentEdits?.notes || ''}
                  onChange={(e) => setStudentEdits((d) => d && { ...d, notes: e.target.value })}
                  placeholder="Call summary, next steps, target universities, interview dates…"
                />
              </Field>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {studentDraft.dirty && <span className="mr-auto text-[12.5px] font-medium text-[#94570A]">Unsaved changes</span>}
                <Button onClick={studentDraft.reset} disabled={!studentDraft.dirty}>
                  Cancel
                </Button>
                <Button variant="primary" icon={Check} onClick={saveStudentEdits} disabled={!studentDraft.dirty}>
                  Save changes
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[selectedStudent.status]} dot>
                  {STATUS_LABEL[selectedStudent.status]}
                </Badge>
                <span className="mc-num text-[12px] text-[#8C97AE] truncate">ID {selectedStudent._id}</span>
              </div>
            </div>
          )}
        </Drawer>

        {/* Add student */}
        <Modal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          title="Add student"
          description="For walk-ins, phone enquiries and referrals."
          width="max-w-xl"
          footer={
            <>
              <Button onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!newStudent.name.trim() || !newStudent.email.trim()}
                onClick={async () => {
                  const created = await createStudent({ ...newStudent, professionLabel: PROFESSION_LABEL[newStudent.profession], source: 'admin_manual', notes: 'Added from the admin portal.', createLogin: newLogin });
                  if (created) {
                    const { student: added, login } = created;
                    addAudit('Students', login?.created ? 'Added student with login' : 'Added student', added.email);
                    if (login?.password) setIssuedPassword({ email: added.email, password: login.password });
                    toast(
                      !login
                        ? `${added.name} added.`
                        : !login.created
                          ? `${added.name} added. ${added.email} already has a login, so no new password was sent.`
                          : login.emailed
                            ? `${added.name} added. Sign-in details with a one-time password were emailed to ${added.email}.`
                            : `${added.name} added. The email couldn't be sent, so share the one-time password yourself.`
                    );
                    setAddOpen(false);
                    setNewStudent({ ...newStudent, name: '', email: '', phone: '+91 ', city: '', institutionOrCompany: '', detail: '' });
                  } else toast("Couldn't add the student. Check the email and try again.", 'error');
                }}
              >
                Add student
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" className="sm:col-span-2">
              <Input value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} placeholder="Varun Chawla" />
            </Field>
            <Field label="Email">
              <Input type="email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} />
            </Field>
            <Field label="Phone / WhatsApp">
              <Input value={newStudent.phone} onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })} />
            </Field>
            <Field label="City">
              <Input value={newStudent.city} onChange={(e) => setNewStudent({ ...newStudent, city: e.target.value })} />
            </Field>
            <Field label="Cohort">
              <Select
                value={newStudent.profession}
                onChange={(e) => {
                  const p = e.target.value as UserProfession;
                  const plan = { school: ['Step-Ready career program', 13999], college: ['Step-Next career program', 15999], fresher: ['Step-In career program', 15999], working_professional: ['Step-Up career program', 19999] }[p] as [string, number];
                  setNewStudent({ ...newStudent, profession: p, planName: plan[0], planPrice: plan[1] });
                }}
              >
                {Object.entries(COHORT_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="School, college or company" className="sm:col-span-2">
              <Input value={newStudent.institutionOrCompany} onChange={(e) => setNewStudent({ ...newStudent, institutionOrCompany: e.target.value })} />
            </Field>
            <Field label="Program">
              <Input value={newStudent.planName} onChange={(e) => setNewStudent({ ...newStudent, planName: e.target.value })} />
            </Field>
            <Field label="Fee (₹)">
              <Input type="number" value={newStudent.planPrice} onChange={(e) => setNewStudent({ ...newStudent, planPrice: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Mentor">
              <Select value={newStudent.mentorAssigned} onChange={(e) => setNewStudent({ ...newStudent, mentorAssigned: e.target.value })}>
                <option>Unassigned</option>
                {mentorOptions.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </Field>
            <Field label="Goal" className="sm:col-span-2">
              <Textarea rows={2} value={newStudent.detail} onChange={(e) => setNewStudent({ ...newStudent, detail: e.target.value })} placeholder="What do they want help with?" />
            </Field>
            <label className="sm:col-span-2 flex items-start gap-2.5 text-[13.5px] text-[#26355A] cursor-pointer">
              <input type="checkbox" checked={newLogin} onChange={(e) => setNewLogin(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#2563EB]" />
              <span>
                Create their student login and email them a one-time password
                <span className="block text-[12.5px] text-[#7A869E]">They choose their own password when they first sign in. They can also sign in with an email code.</span>
              </span>
            </label>
          </div>
        </Modal>
        <OneTimePasswordModal issued={issuedPassword} onClose={() => setIssuedPassword(null)} />

        {/* First sign-in with a one-time password */}
        <Modal
          open={mustChangePassword}
          onClose={() => {}}
          title="Choose a new password"
          description="You signed in with a one-time password. Set your own before continuing."
          width="max-w-md"
          footer={
            <Button variant="primary" type="submit" form="mc-change-pw">
              Save password
            </Button>
          }
        >
          <form id="mc-change-pw" onSubmit={handleChangePassword} className="space-y-4">
            {pwError && (
              <div className="flex items-start gap-2 rounded-[10px] bg-[#FCEBEC] px-3.5 py-3 text-[13.5px] text-[#B42F3B]" role="alert">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {pwError}
              </div>
            )}
            <Field label="One-time password">
              <Input type="password" autoComplete="current-password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} />
            </Field>
            <Field label="New password" hint="At least 8 characters.">
              <Input type="password" autoComplete="new-password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" autoComplete="new-password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </Field>
          </form>
        </Modal>

        {/* Toasts */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] flex flex-col items-center gap-2 w-[min(92vw,440px)]" aria-live="polite">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className={cx('w-full rounded-[12px] px-4 py-3 text-[13.5px] font-medium shadow-[0_12px_32px_-12px_rgba(13,27,62,0.45)]', t.tone === 'error' ? 'bg-[#B42F3B] text-white' : 'bg-[#0D1B3E] text-white')}
              >
                {t.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AdminContext.Provider>
  );
};
