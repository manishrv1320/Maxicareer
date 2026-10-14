import { createContext, useContext } from 'react';
import type { Counselor, Mentor, CounselorStudentDetail, Appointment, CounselingRequest, SessionNote, FollowUpTask } from '../../types/counselor';
import type { PlatformState } from '../../services/careerPlatformStore';
import type { useCareerStore } from '../../hooks/useCareerStore';
import { isoOf, minutesOf } from '../workspace/kit';

/** Pages of the counsellor / mentor workspace. Server notifications link to some of these ids. */
export type ProviderPage =
  | 'dashboard'
  | 'notifications'
  | 'calendar'
  | 'mentees'
  | 'sessions'
  | 'availability'
  | 'pending'
  | 'notes'
  | 'assignments'
  | 'followups'
  | 'chat'
  | 'reports'
  | 'hours'
  | 'payments'
  | 'expenses'
  | 'profile'
  | 'support';

/** Older notification links (from the previous workspace) mapped onto the new pages. */
export const PAGE_ALIASES: Record<string, ProviderPage> = {
  requests: 'sessions',
  appointments: 'sessions',
  messages: 'chat',
  students: 'mentees',
  recommendations: 'mentees',
  courses: 'mentees',
};

export type ProviderKind = 'counselor' | 'mentor';

export interface ProviderCtx {
  kind: ProviderKind;
  /** The signed-in counsellor or mentor. */
  me: Counselor | Mentor;
  state: PlatformState;
  store: ReturnType<typeof useCareerStore>;
  go: (page: ProviderPage) => void;
  toast: (message: string, tone?: 'default' | 'error') => void;

  mentees: CounselorStudentDetail[];
  requests: CounselingRequest[];
  appointments: Appointment[];
  notes: SessionNote[];
  tasks: FollowUpTask[];
  /** Minutes in one session, from the profile's session duration. */
  sessionMinutes: number;

  openMentee: (studentId: string) => void;
  chatWith: (studentId: string) => void;
  chatPartnerId: string | null;
  setChatPartnerId: (id: string | null) => void;
  /** Opens the "complete session and write notes" form. */
  writeNotes: (appointment: Appointment) => void;
  /** Opens the "paste the meeting link" form for one upcoming session. */
  editLink: (appointment: Appointment) => void;
  /** Opens the new task / assignment form, optionally for one mentee. */
  newTask: (studentId?: string) => void;
}

export const ProviderContext = createContext<ProviderCtx | null>(null);

export function useProvider() {
  const ctx = useContext(ProviderContext);
  if (!ctx) throw new Error('useProvider must be used inside ProviderContext');
  return ctx;
}

export const roleLabel = (kind: ProviderKind) => (kind === 'counselor' ? 'Counsellor' : 'Mentor');

export function providerSubtitle(kind: ProviderKind, me: Counselor | Mentor) {
  if (kind === 'counselor') return (me as Counselor).qualification || 'Career counsellor';
  const m = me as Mentor;
  return [m.role, m.company].filter(Boolean).join(' · ') || 'Industry mentor';
}

export function sessionMinutesOf(me: Counselor | Mentor) {
  return minutesOf(me.sessionDuration || '45 mins');
}

/** "Dr. Ananya Sen" -> "Ananya". */
export const firstName = (name: string) => name.split(/\s+/).find((w) => w && !/^(dr|mr|mrs|ms|miss|prof)\.?$/i.test(w)) || name;

/** A scheduled session that hasn't happened yet (past ones still need notes, they aren't upcoming). */
export const isUpcoming = (a: Appointment, today: string) => a.status === 'scheduled' && isoOf(a.date) >= today;

/** Sessions that need a summary: completed without notes, or past and never marked complete. */
export const needsNotes = (a: Appointment, notedIds: Set<string | undefined>, today: string) =>
  (a.status === 'completed' && !notedIds.has(a.id)) || (a.status === 'scheduled' && isoOf(a.date) !== '' && isoOf(a.date) < today);

/** Mentees this provider was assigned by an admin (as mentor or counsellor). */
export const isAssignedTo = (s: CounselorStudentDetail, name: string) => s.mentorAssigned === name || s.counselorAssigned === name;
