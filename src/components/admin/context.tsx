import React, { createContext, useContext } from 'react';
import {
  LayoutDashboard,
  Bell,
  Inbox,
  Users,
  UserRound,
  UserCog,
  Layers,
  Briefcase,
  CalendarClock,
  Route,
  FileStack,
  BarChart3,
  CheckCircle2,
  History,
  ShieldCheck,
  Home,
  Menu,
  PanelBottom,
  Contact,
  Megaphone,
  Image as ImageIcon,
  Search,
  Share2,
  Settings,
  BookOpen,
  ClipboardCheck,
  PartyPopper,
  MessageSquareHeart,
  Wallet,
  Receipt,
  BriefcaseBusiness,
  Newspaper,
  ScrollText,
} from 'lucide-react';
import { DbStudent, MongoStats } from '../../types';
import type { PlatformState } from '../../services/careerPlatformStore';

/** A student login made by an admin; `password` is only there if it couldn't be emailed. */
export interface StudentLogin {
  created: boolean;
  emailed?: boolean;
  password?: string;
}

export interface AdminSession {
  email: string;
  name: string;
  role: 'admin';
  /** Staff role from the server; decides which pages are visible. */
  staffRole?: string;
  loggedInAt: number;
}

export type AdminTab =
  | 'dashboard'
  | 'notifications'
  | 'submissions'
  | 'students'
  | 'counsellors'
  | 'users'
  | 'programs'
  | 'services'
  | 'roadmaps'
  | 'sessions'
  | 'applications'
  | 'reports'
  | 'feedback'
  | 'curriculum'
  | 'assessments'
  | 'events'
  | 'payments'
  | 'expenditure'
  | 'web-careers'
  | 'newsletter'
  | 'web-home'
  | 'web-nav'
  | 'web-footer'
  | 'web-contact'
  | 'web-cta'
  | 'web-articles'
  | 'web-seo'
  | 'web-social'
  | 'web-policies'
  | 'approvals'
  | 'audit'
  | 'access'
  | 'settings';

export interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'submissions', label: 'Form submissions', icon: Inbox },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'students', label: 'Students', icon: Users },
      { id: 'counsellors', label: 'Counsellors', icon: UserRound },
      { id: 'users', label: 'User management', icon: UserCog },
    ],
  },
  {
    label: 'Learning',
    items: [
      { id: 'programs', label: 'Programs & plans', icon: Layers },
      { id: 'services', label: 'Services', icon: Briefcase },
      { id: 'roadmaps', label: 'Roadmaps', icon: Route },
      { id: 'curriculum', label: 'Curriculum & resources', icon: BookOpen },
      { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
      { id: 'events', label: 'Events', icon: PartyPopper },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'applications', label: 'Applications', icon: FileStack },
      { id: 'sessions', label: 'Sessions', icon: CalendarClock },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'payments', label: 'Payments', icon: Wallet },
      { id: 'expenditure', label: 'Expenditure', icon: Receipt },
    ],
  },
  {
    label: 'Website',
    items: [
      { id: 'web-careers', label: 'Career page', icon: BriefcaseBusiness },
      { id: 'newsletter', label: 'Newsletter', icon: Newspaper },
      { id: 'web-home', label: 'Homepage', icon: Home },
      { id: 'web-nav', label: 'Navigation', icon: Menu },
      { id: 'web-footer', label: 'Footer', icon: PanelBottom },
      { id: 'web-contact', label: 'Contact page', icon: Contact },
      { id: 'web-cta', label: 'Calls to action', icon: Megaphone },
      { id: 'web-articles', label: 'Article covers', icon: ImageIcon },
      { id: 'web-seo', label: 'SEO', icon: Search },
      { id: 'web-social', label: 'Social links', icon: Share2 },
      { id: 'web-policies', label: 'Policies', icon: ScrollText },
    ],
  },
  {
    label: 'Governance',
    items: [
      { id: 'approvals', label: 'Approvals', icon: CheckCircle2 },
      { id: 'audit', label: 'Audit log', icon: History },
      { id: 'access', label: 'Page access', icon: ShieldCheck },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { id: 'settings', label: 'Settings', icon: Settings };

export const ALL_TABS: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];

export const tabLabel = (id: AdminTab) => ALL_TABS.find((t) => t.id === id)?.label || id;
export const tabGroup = (id: AdminTab) => NAV_GROUPS.find((g) => g.items.some((i) => i.id === id))?.label || 'Workspace';

/* ------------------------------------------------------------------ */
/* Domain types                                                        */
/* ------------------------------------------------------------------ */

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  module: string;
  action: string;
  target: string;
}

export type NotificationCategory = 'students' | 'applications' | 'sessions' | 'approvals' | 'website' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: 'normal' | 'high';
  read: boolean;
  createdAt: string;
  link?: AdminTab;
}

export type FormKind =
  | 'contact'
  | 'service_request'
  | 'program_registration'
  | 'student_signup'
  | 'counsellor_signup'
  | 'mentor_signup'
  | 'support_request';

export type SubmissionStatus = 'New' | 'Contacted' | 'Closed';

/** A form someone filled on the website or portal (see lib/server/submissions.ts). */
export interface FormSubmission {
  id: string;
  form: FormKind;
  formLabel: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  details: { label: string; value: string }[];
  studentId?: string;
  status: SubmissionStatus;
  adminNote: string;
  createdAt: string;
  updatedAt?: string;
  handledBy?: string;
}

export type ApplicationStage ='Draft' | 'Submitted' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';
export type ApplicationType = 'Job' | 'Internship' | 'University' | 'Scholarship' | 'Visa / PSW';

export interface Application {
  id: string;
  studentId?: string;
  studentName: string;
  studentEmail: string;
  type: ApplicationType;
  organisation: string;
  role: string;
  location: string;
  stage: ApplicationStage;
  appliedOn: string;
  deadline: string;
  owner: string;
  link: string;
  notes: string;
  updatedAt: string;
}

export interface RoadmapTemplate {
  id: string;
  cohort?: string;
  title: string;
  audience: string;
  duration: string;
  milestones: string[];
  status: 'Published' | 'Draft';
}

export type MilestoneStatus = 'todo' | 'doing' | 'done' | 'blocked';

export interface Milestone {
  id: string;
  title: string;
  status: MilestoneStatus;
  due: string;
  note: string;
}

export interface StudentRoadmap {
  studentId: string;
  templateId: string | null;
  goal: string;
  milestones: Milestone[];
  updatedAt: string;
}

export interface ApprovalItem {
  id: string;
  title: string;
  requester: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: string;
}

export interface SessionItem {
  id: string;
  date: string; // ISO date
  time: string;
  studentName: string;
  topic: string;
  mentor: string;
  mode: 'Video call' | 'Phone' | 'In person';
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  /** Set when the student booked this meeting with the admin team from their portal. */
  studentId?: string;
  requestedByStudent?: boolean;
  notes?: string;
  meetingLink?: string;
  /** False until an admin confirms a student-requested meeting. */
  confirmed?: boolean;
}

export const COHORT_LABEL: Record<string, string> = {
  school: 'School students',
  college: 'College students',
  fresher: 'Freshers / PSW',
  working_professional: 'Working professionals',
};

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

export interface AdminContextValue {
  session: AdminSession;
  go: (tab: AdminTab) => void;
  /** Whether the signed-in staff role may open this page (Page access). */
  canSee: (tab: AdminTab) => boolean;
  toast: (message: string, tone?: 'default' | 'error') => void;
  addAudit: (module: string, action: string, target: string) => void;
  notify: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt' | 'priority'> & { priority?: 'normal' | 'high'; id?: string }) => void;

  students: DbStudent[];
  stats: MongoStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  loadError: string | null;
  refreshStudents: (showIndicator?: boolean) => Promise<void>;
  patchStudent: (id: string, patch: Partial<DbStudent>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  /** Pass `createLogin: true` to also give them a login with an emailed one-time password. */
  createStudent: (data: Record<string, unknown>) => Promise<{ student: DbStudent; login?: StudentLogin } | null>;
  openStudent: (s: DbStudent) => void;

  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  submissions: FormSubmission[];
  setSubmissions: React.Dispatch<React.SetStateAction<FormSubmission[]>>;
  auditEntries: AuditEntry[];
  setAuditEntries: React.Dispatch<React.SetStateAction<AuditEntry[]>>;
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  templates: RoadmapTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<RoadmapTemplate[]>>;
  studentRoadmaps: Record<string, StudentRoadmap>;
  setStudentRoadmaps: React.Dispatch<React.SetStateAction<Record<string, StudentRoadmap>>>;
  approvals: ApprovalItem[];
  setApprovals: React.Dispatch<React.SetStateAction<ApprovalItem[]>>;
  sessions: SessionItem[];
  setSessions: React.Dispatch<React.SetStateAction<SessionItem[]>>;
  roadmapFocus: string | null;
  setRoadmapFocus: (id: string | null) => void;
  studentPrefilter: { cohort?: string; status?: string } | null;
  setStudentPrefilter: (f: { cohort?: string; status?: string } | null) => void;
  openAddStudent: () => void;

  /** Names of approved counsellors and mentors, for assignment dropdowns. */
  mentorOptions: string[];
  /** Approved industry mentors only (the student's "Mentor"). */
  mentorNames: string[];
  /** Approved counsellors only (the student's "Counsellor"). */
  counsellorNames: string[];
  /** Counsellors, mentors, bookings and sessions shared with the other dashboards. */
  platform: PlatformState;
  setProviderApproval: (kind: 'counselor' | 'mentor', id: string, status: 'approved' | 'rejected') => Promise<unknown>;
}

export const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminContext');
  return ctx;
}

export function roadmapProgress(r?: StudentRoadmap | null) {
  if (!r || r.milestones.length === 0) return 0;
  const done = r.milestones.filter((m) => m.status === 'done').length;
  const doing = r.milestones.filter((m) => m.status === 'doing').length;
  return Math.round(((done + doing * 0.5) / r.milestones.length) * 100);
}
