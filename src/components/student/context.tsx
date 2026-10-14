import { createContext, useContext } from 'react';
import type { StudentProfile } from '../../types';
import type { CounselorStudentDetail } from '../../types/counselor';
import type { CurriculumModule } from '../../types/portal';
import type { PlatformState } from '../../services/careerPlatformStore';
import type { useCareerStore } from '../../hooks/useCareerStore';
import { DEFAULT_CURRICULUM } from '../../data/curriculum';
import { parseDay, todayIso } from '../workspace/kit';

export type StudentPage =
  | 'dashboard'
  | 'notifications'
  | 'curriculum'
  | 'tasks'
  | 'courses'
  | 'resources'
  | 'milestones'
  | 'sessions'
  | 'calendar'
  | 'chat'
  | 'events'
  | 'profile'
  | 'services'
  | 'invoices'
  | 'renewal'
  | 'support'
  | 'feedback'
  | 'tutorials';

/** Older notifications point at the previous tab names. */
export const PAGE_ALIASES: Record<string, StudentPage> = { messages: 'chat', courses: 'courses', tasks: 'tasks', sessions: 'sessions' };

export interface Provider {
  id: string;
  name: string;
  avatarUrl?: string;
  title: string;
  kind: 'counselor' | 'mentor';
}

export interface StudentCtx {
  profile: StudentProfile;
  /** Live record from the server (falls back to the sign-in profile fields until loaded). */
  me: CounselorStudentDetail | null;
  state: PlatformState;
  store: ReturnType<typeof useCareerStore>;
  go: (page: StudentPage) => void;
  toast: (message: string, tone?: 'default' | 'error') => void;
  mentor: Provider | null;
  counselor: Provider | null;
  /** Everyone the student may message or book (assigned + worked with). */
  providers: Provider[];
  modules: CurriculumModule[];
  lessonIds: string[];
  completedLessonIds: string[];
  toggleLesson: (id: string) => void;
  curriculumProgress: number;
  openBooking: (providerId?: string) => void;
  openAdminMeeting: () => void;
  chatWith: (providerId: string) => void;
  chatPartnerId: string | null;
  setChatPartnerId: (id: string | null) => void;
  whatsappUrl: string;
}

export const StudentContext = createContext<StudentCtx | null>(null);

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used inside the student portal');
  return ctx;
}

/** Cohort modules first (by order), then modules a mentor or counsellor assigned. */
export function studentModules(curricula: CurriculumModule[]): CurriculumModule[] {
  const cohort = curricula.filter((m) => m.scope === 'cohort').sort((a, b) => a.order - b.order);
  const personal = curricula.filter((m) => m.scope === 'student').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return [...(cohort.length ? cohort : DEFAULT_CURRICULUM), ...personal];
}

export function nextOpenDay(values: (string | undefined)[]) {
  const today = todayIso();
  return values.filter((v): v is string => Boolean(v && v >= today)).sort()[0];
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export interface Badge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  /** 0–100 while still locked. */
  progress: number;
  hint: string;
}

export function profileCompleteness(me: CounselorStudentDetail | null) {
  if (!me) return 0;
  const checks = [me.avatarUrl, me.headline, me.about, (me.skills || []).length >= 3, me.linkedinUrl, me.resumeFileId, me.careerGoal, me.phone];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function computeBadges(ctx: Pick<StudentCtx, 'me' | 'state' | 'curriculumProgress'>): Badge[] {
  const { me, state, curriculumProgress } = ctx;
  const sessionsDone = state.appointments.filter((a) => a.status === 'completed').length;
  const tasksDone = state.followUpTasks.filter((t) => t.status === 'completed').length;
  const results = state.assessments.filter((a) => a.status === 'completed');
  const best = results.reduce((m, r) => Math.max(m, r.scorePercent || 0), 0);
  const milestonesDone = state.studentRoadmap?.milestones.filter((m) => m.status === 'done').length || 0;
  const reviewed = state.assignments.filter((a) => a.status === 'reviewed').length;
  const completeness = profileCompleteness(me);
  const pct = (n: number, of: number) => Math.min(100, Math.round((n / of) * 100));
  return [
    { id: 'enrolled', title: 'Enrolled', description: 'Your place in the program is confirmed.', earned: me?.status === 'enrolled' || me?.status === 'completed', progress: me?.status === 'pending' ? 30 : 60, hint: 'Our team confirms your enrolment.' },
    { id: 'first-session', title: 'First conversation', description: 'Completed your first 1-on-1 session.', earned: sessionsDone >= 1, progress: pct(sessionsDone, 1), hint: 'Book and attend a session.' },
    { id: 'regular', title: 'Regular', description: 'Five 1-on-1 sessions completed.', earned: sessionsDone >= 5, progress: pct(sessionsDone, 5), hint: `${sessionsDone} of 5 sessions` },
    { id: 'finisher', title: 'Finisher', description: 'Completed five tasks from your mentor.', earned: tasksDone >= 5, progress: pct(tasksDone, 5), hint: `${tasksDone} of 5 tasks` },
    { id: 'builder', title: 'Builder', description: 'A submitted assignment or project was reviewed.', earned: reviewed >= 1, progress: pct(reviewed, 1), hint: 'Submit work for review.' },
    { id: 'halfway', title: 'Halfway there', description: 'Half of your curriculum is complete.', earned: curriculumProgress >= 50, progress: pct(curriculumProgress, 50), hint: `${curriculumProgress}% of lessons done` },
    { id: 'graduate', title: 'Curriculum complete', description: 'Every lesson in your curriculum is done.', earned: curriculumProgress >= 100, progress: curriculumProgress, hint: `${curriculumProgress}% of lessons done` },
    { id: 'test-taker', title: 'Test taker', description: 'Completed an assessment or test.', earned: results.length >= 1, progress: pct(results.length, 1), hint: 'Take a test in Courses & tests.' },
    { id: 'high-scorer', title: 'High scorer', description: 'Scored 80% or more in a test.', earned: best >= 80, progress: pct(best, 80), hint: best ? `Best score ${best}%` : 'No scores yet' },
    { id: 'on-track', title: 'On track', description: 'Reached a milestone in your personal roadmap.', earned: milestonesDone >= 1, progress: pct(milestonesDone, 1), hint: 'Complete a roadmap milestone.' },
    { id: 'profile-pro', title: 'Profile pro', description: 'Your career profile is at least 80% complete.', earned: completeness >= 80, progress: pct(completeness, 80), hint: `Profile ${completeness}% complete` },
    { id: 'voice', title: 'Voice heard', description: 'Shared feedback with the Maxicareer team.', earned: state.feedback.length >= 1, progress: pct(state.feedback.length, 1), hint: 'Send feedback.' },
  ];
}

/** Days until program access ends (negative once it has). */
export function daysLeft(programEndsAt?: string) {
  const d = parseDay(programEndsAt);
  if (!d) return null;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
}
