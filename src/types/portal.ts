import type { UserProfession } from './index';

/** Records behind the student, counsellor/mentor and admin portal features (see lib/server/portal.ts). */

export type Cohort = UserProfession | 'all';

export interface Assignment {
  id: string;
  studentId: string;
  studentName: string;
  /** The mentor or counsellor who reviews it. */
  counselorId: string;
  counselorName: string;
  taskId?: string;
  kind: 'Assignment' | 'Project';
  title: string;
  description: string;
  link?: string;
  fileId?: string;
  fileName?: string;
  status: 'submitted' | 'reviewed' | 'changes_requested';
  grade?: string;
  feedback?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export type CalendarNoteKind = 'note' | 'reminder' | 'target' | 'task';

export interface CalendarNote {
  id: string;
  ownerId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or ''
  title: string;
  note: string;
  kind: CalendarNoteKind;
  done: boolean;
  createdAt: string;
}

export interface InvoiceLine {
  description: string;
  amount: number;
}

export type InvoiceStatus = 'Due' | 'Verifying' | 'Paid' | 'Cancelled';

export interface Invoice {
  id: string;
  number: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  kind: 'Enrolment' | 'Service' | 'Renewal' | 'Other';
  serviceId?: string;
  serviceName?: string;
  renewalMonths?: number;
  lines: InvoiceLine[];
  total: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  paymentReference?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface Payout {
  id: string;
  providerId: string;
  providerName: string;
  providerKind: 'counselor' | 'mentor';
  period: string;
  sessions: number;
  hours: number;
  amount: number;
  method: string;
  reference: string;
  status: 'Pending' | 'Paid';
  paidOn?: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseStatus = 'Submitted' | 'Approved' | 'Rejected' | 'Reimbursed' | 'Recorded';

export interface Expense {
  id: string;
  source: 'company' | 'provider';
  providerId?: string;
  providerName?: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  vendor?: string;
  receiptFileId?: string;
  receiptFileName?: string;
  status: ExpenseStatus;
  reviewNote?: string;
  createdAt: string;
}

export interface WorkLog {
  id: string;
  providerId: string;
  providerName: string;
  date: string;
  hours: number;
  activity: string;
  studentId?: string;
  studentName?: string;
  notes: string;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  fromId: string;
  fromName: string;
  fromRole: 'student' | 'counselor' | 'mentor';
  about: 'Session' | 'Mentor' | 'Counsellor' | 'Course' | 'Platform';
  targetId?: string;
  targetName?: string;
  appointmentId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type EventAudience = 'everyone' | 'students' | 'staff' | UserProfession;

export interface PlatformEvent {
  id: string;
  title: string;
  type: 'Webinar' | 'Workshop' | 'Masterclass' | 'Career fair' | 'Assessment' | 'Other';
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMins: number;
  mode: 'Online' | 'In person';
  link?: string;
  location?: string;
  audience: EventAudience;
  host: string;
  status: 'Published' | 'Draft';
  createdAt: string;
}

export interface TestQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index of the right option. Never sent to students. */
  answer?: number;
}

export type TestKind = 'Aptitude' | 'Skill test' | 'Mock test' | 'Quiz' | 'Psychometric';

export interface TestDef {
  id: string;
  title: string;
  description: string;
  kind: TestKind;
  cohort: Cohort;
  durationMins: number;
  passPercent: number;
  attemptsAllowed: number;
  dueDate?: string;
  questions: TestQuestion[];
  status: 'Published' | 'Draft';
  createdAt: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  program: string;
  description?: string;
  issuedOn: string;
  certificateNo: string;
  issuedBy: string;
  createdAt: string;
}

export interface CareerOpening {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: 'On-site' | 'Remote' | 'Hybrid';
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  department: string;
  experience: string;
  salary?: string;
  description: string;
  requirements: string[];
  applyUrl?: string;
  applyEmail?: string;
  deadline?: string;
  status: 'Published' | 'Draft' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumLesson {
  id: string;
  title: string;
  duration: string;
  type: string;
  url?: string;
}

export interface CurriculumModule {
  id: string;
  /** cohort: for every learner in a cohort (admin). student: for one learner (their mentor or counsellor). */
  scope: 'cohort' | 'student';
  cohort: Cohort;
  studentId?: string;
  studentName?: string;
  title: string;
  description: string;
  weeks?: string;
  order: number;
  lessons: CurriculumLesson[];
  status: 'Published' | 'Draft';
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface ResourceItem {
  id: string;
  scope: 'cohort' | 'student';
  cohort: Cohort;
  studentId?: string;
  title: string;
  description: string;
  kind: 'Guide' | 'Template' | 'Video' | 'Link' | 'Worksheet';
  url?: string;
  fileId?: string;
  fileName?: string;
  sharedBy: string;
  sharedByName: string;
  status: 'Published' | 'Draft';
  createdAt: string;
}

export interface ServiceOffering {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  duration: string;
  status: 'Active' | 'Draft';
}

/** A meeting with the admin team (stored with the admin portal's sessions). */
export interface AdminMeeting {
  id: string;
  date: string;
  time: string;
  studentId?: string;
  studentName: string;
  topic: string;
  notes?: string;
  mentor: string;
  mode: 'Video call' | 'Phone' | 'In person';
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  requestedByStudent?: boolean;
  meetingLink?: string;
}

export interface RenewalOption {
  id: string;
  label: string;
  months: number;
  /** Share of the plan price charged for this renewal. */
  percent: number;
}

export const COHORT_NAMES: Record<Cohort, string> = {
  all: 'All learners',
  school: 'School students',
  college: 'College students',
  fresher: 'Freshers / PSW',
  working_professional: 'Working professionals',
};
