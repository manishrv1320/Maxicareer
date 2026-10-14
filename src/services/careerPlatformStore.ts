import {
  Counselor,
  Mentor,
  AdminUser,
  CounselingRequest,
  Appointment,
  SessionNote,
  Recommendation,
  FollowUpTask,
  ChatMessage,
  StudentAssessment,
  CounselorStudentDetail,
  UserNotification,
  PersonalRoadmap,
} from '../types/counselor';
import type {
  Assignment,
  CalendarNote,
  Invoice,
  Payout,
  Expense,
  WorkLog,
  FeedbackItem,
  PlatformEvent,
  TestDef,
  Certificate,
  CurriculumModule,
  ResourceItem,
  ServiceOffering,
  AdminMeeting,
  RenewalOption,
  CalendarNoteKind,
} from '../types/portal';
import { apiGet, apiSend, auth, ApiError, SessionUser } from '../lib/api';

export type PlatformEnvironment = 'production' | 'demo';

export interface PlatformState {
  /** False until the first response from the server arrives. */
  loaded: boolean;
  environment: PlatformEnvironment;
  currentUser: SessionUser | null;
  students: CounselorStudentDetail[];
  counselors: Counselor[];
  mentors: Mentor[];
  admins: AdminUser[];
  counselingRequests: CounselingRequest[];
  appointments: Appointment[];
  sessionNotes: SessionNote[];
  recommendations: Recommendation[];
  followUpTasks: FollowUpTask[];
  messages: ChatMessage[];
  assessments: StudentAssessment[];
  notifications: UserNotification[];
  studentRoadmap: PersonalRoadmap | null;
  // Portal features (scoped by the server to what the viewer may see)
  assignments: Assignment[];
  calendarNotes: CalendarNote[];
  invoices: Invoice[];
  payouts: Payout[];
  expenses: Expense[];
  workLogs: WorkLog[];
  feedback: FeedbackItem[];
  events: PlatformEvent[];
  tests: TestDef[];
  certificates: Certificate[];
  curricula: CurriculumModule[];
  resources: ResourceItem[];
  services: ServiceOffering[];
  adminMeetings: AdminMeeting[];
  renewalOptions: RenewalOption[];
  paymentInstructions: string;
  activeCounselorId: string | null;
  activeMentorId: string | null;
  activeAdminId: string | null;
  /** Last failed action, shown by <PlatformToaster />. */
  lastError: { message: string; at: number } | null;
}

export const EMPTY_STATE: PlatformState = {
  loaded: false,
  environment: 'production',
  currentUser: null,
  students: [],
  counselors: [],
  mentors: [],
  admins: [],
  counselingRequests: [],
  appointments: [],
  sessionNotes: [],
  recommendations: [],
  followUpTasks: [],
  messages: [],
  assessments: [],
  notifications: [],
  studentRoadmap: null,
  assignments: [],
  calendarNotes: [],
  invoices: [],
  payouts: [],
  expenses: [],
  workLogs: [],
  feedback: [],
  events: [],
  tests: [],
  certificates: [],
  curricula: [],
  resources: [],
  services: [],
  adminMeetings: [],
  renewalOptions: [],
  paymentInstructions: '',
  activeCounselorId: null,
  activeMentorId: null,
  activeAdminId: null,
  lastError: null,
};

const POLL_MS = 15_000;

/**
 * Client view of the shared platform data in MongoDB. Every dashboard (student,
 * counsellor, mentor, admin) reads from here; every change is a server action that
 * returns the refreshed state, and open dashboards poll so others' changes show up.
 */
class CareerPlatformStoreService {
  private state: PlatformState = EMPTY_STATE;
  private listeners: Set<() => void> = new Set();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private inflight: Promise<void> | null = null;

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.startPolling();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stopPolling();
    };
  }

  public getState(): PlatformState {
    return this.state;
  }

  private setState(next: Partial<PlatformState>) {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((l) => l());
  }

  private onVisible = () => {
    if (document.visibilityState === 'visible') this.refresh();
  };

  private startPolling() {
    if (typeof window === 'undefined') return;
    this.refresh();
    this.pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') this.refresh();
    }, POLL_MS);
    document.addEventListener('visibilitychange', this.onVisible);
  }

  private stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    if (typeof window !== 'undefined') document.removeEventListener('visibilitychange', this.onVisible);
  }

  /** Re-reads the state from the server. Concurrent calls share one request. */
  public refresh(): Promise<void> {
    if (this.inflight) return this.inflight;
    this.inflight = apiGet<{ state: Omit<PlatformState, 'lastError'> }>('/api/platform')
      .then((res) => this.setState({ ...res.state, loaded: true }))
      .catch((err) => {
        console.warn('[platform] refresh failed:', err);
        this.setState({ loaded: true });
      })
      .finally(() => {
        this.inflight = null;
      });
    return this.inflight;
  }

  public reportError(err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    this.setState({ lastError: { message, at: Date.now() } });
  }

  public clearError() {
    this.setState({ lastError: null });
  }

  /** Runs a server action and adopts the refreshed state it returns. */
  public async act<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
    const res = await apiSend<{ result: T; state: PlatformState }>('/api/platform', { action, payload });
    this.setState({ ...res.state, loaded: true });
    return res.result;
  }

  /* ---------------- auth ---------------- */

  public async login(email: string, password: string, portal: 'student' | 'counselor' | 'mentor' | 'admin') {
    const res = await auth.login(email, password, portal);
    await this.refresh();
    return res;
  }

  public async logout() {
    await auth.logout().catch(() => {});
    this.setState({ ...EMPTY_STATE });
    await this.refresh();
  }

  /* ---------------- environment ---------------- */

  public setEnvironment(env: PlatformEnvironment) {
    return env === 'demo' ? this.act('loadDemoData') : this.act('clearDemoData');
  }

  public resetToCleanProduction() {
    return this.act('clearDemoData');
  }

  /* ---------------- counsellors ---------------- */

  public registerCounselor(data: Omit<Counselor, 'id' | 'approvalStatus' | 'registeredDate'> & { password: string }) {
    return this.act<Counselor>('registerCounselor', data as any);
  }

  public updateCounselorApproval(id: string, status: 'approved' | 'rejected') {
    return this.act('updateCounselorApproval', { id, status });
  }

  public updateCounselorProfile(id: string, updates: Partial<Counselor>) {
    return this.act('updateCounselorProfile', { id, updates });
  }

  /** Signing in or out is done with login()/logout(); this only clears a session. */
  public setActiveCounselor(id: string | null) {
    return id ? this.refresh() : this.logout();
  }

  public getActiveCounselor(): Counselor | null {
    return this.state.counselors.find((c) => c.id === this.state.activeCounselorId) || null;
  }

  public getApprovedCounselors(): Counselor[] {
    return this.state.counselors.filter((c) => c.approvalStatus === 'approved');
  }

  /* ---------------- students ---------------- */

  /** Kept for compatibility: the server already holds the student's record. */
  public syncStudentFromPortal(_profile?: unknown) {
    return this.refresh();
  }

  public updateStudentProgress(completedLessonIds: string[], roadmapProgress?: number) {
    return this.act('updateStudentProgress', { completedLessonIds, roadmapProgress });
  }

  public updateStudentProfile(
    updates: Partial<
      Pick<
        CounselorStudentDetail,
        'phone' | 'city' | 'avatarUrl' | 'careerGoal' | 'careerInterests' | 'headline' | 'about' | 'skills' | 'linkedinUrl' | 'githubUrl' | 'portfolioUrl' | 'resumeFileId' | 'resumeFileName'
      >
    >
  ) {
    return this.act('updateStudentProfile', updates as Record<string, unknown>);
  }

  public createSupportTicket(data: { subject: string; category: string; priority: string; message: string }) {
    return this.act<{ id: string }>('createSupportTicket', data);
  }

  /* ---------------- requests & sessions ---------------- */

  public createCounselingRequest(data: Omit<CounselingRequest, 'id' | 'requestDate' | 'status'>) {
    return this.act<CounselingRequest>('createCounselingRequest', data as any);
  }

  public acceptCounselingRequest(id: string) {
    return this.act<Appointment>('acceptCounselingRequest', { id });
  }

  public rejectCounselingRequest(id: string) {
    return this.act('rejectCounselingRequest', { id });
  }

  public completeSession(
    appointmentId: string,
    data: { summary: string; keyDiscussionPoints: string[]; studentConcerns: string; recommendations: string; nextSteps: string; followUpDate?: string }
  ) {
    return this.act<SessionNote>('completeSession', { appointmentId, data });
  }

  public updateAppointmentStatus(id: string, status: 'scheduled' | 'completed' | 'cancelled') {
    return this.act('updateAppointmentStatus', { id, status });
  }

  /** Pastes (or clears, with '') the video link for one upcoming session. */
  public setAppointmentLink(id: string, meetingLink: string) {
    return this.act('setAppointmentLink', { id, meetingLink });
  }

  /* ---------------- recommendations & tasks ---------------- */

  public addRecommendation(data: Omit<Recommendation, 'id' | 'createdAt' | 'status'>) {
    return this.act<Recommendation>('addRecommendation', data as any);
  }

  public updateRecommendationStatus(id: string, status: Recommendation['status']) {
    return this.act('updateRecommendationStatus', { id, status });
  }

  public addFollowUpTask(data: Omit<FollowUpTask, 'id' | 'createdAt' | 'status'>) {
    return this.act<FollowUpTask>('addFollowUpTask', data as any);
  }

  public updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed') {
    return this.act('updateTaskStatus', { id, status });
  }

  /* ---------------- messages & notifications ---------------- */

  public sendMessage(message: Partial<Omit<ChatMessage, 'id' | 'timestamp' | 'read'>> & { recipientId: string; content: string }) {
    return this.act<ChatMessage>('sendMessage', { recipientId: message.recipientId, content: message.content, attachment: message.attachment });
  }

  public markConversationRead(conversationId: string) {
    return this.act('markConversationRead', { conversationId });
  }

  public markNotificationsRead(ids?: string[]) {
    return this.act('markNotificationsRead', { ids });
  }

  /* ---------------- admin & mentors ---------------- */

  public setActiveAdmin(_id: string | null) {
    return this.refresh();
  }

  public registerMentor(data: Omit<Mentor, 'id' | 'approvalStatus' | 'registeredDate'> & { password: string }) {
    return this.act<Mentor>('registerMentor', data as any);
  }

  public updateMentorApproval(id: string, status: 'approved' | 'rejected') {
    return this.act('updateMentorApproval', { id, status });
  }

  public updateMentorProfile(id: string, updates: Partial<Mentor>) {
    return this.act('updateMentorProfile', { id, updates });
  }

  public setActiveMentor(id: string | null) {
    return id ? this.refresh() : this.logout();
  }

  public getApprovedMentors(): Mentor[] {
    return this.state.mentors.filter((m) => m.approvalStatus === 'approved');
  }

  /* ---------------- assignments ---------------- */

  public submitAssignment(data: { title: string; description?: string; kind?: Assignment['kind']; taskId?: string; counselorId?: string; link?: string; fileId?: string; fileName?: string }) {
    return this.act<Assignment>('submitAssignment', data);
  }

  public reviewAssignment(id: string, data: { status: 'reviewed' | 'changes_requested'; grade?: string; feedback?: string }) {
    return this.act('reviewAssignment', { id, ...data });
  }

  public deleteAssignment(id: string) {
    return this.act('deleteAssignment', { id });
  }

  /* ---------------- calendar ---------------- */

  public saveCalendarNote(data: { id?: string; date: string; time?: string; title: string; note?: string; kind: CalendarNoteKind; done?: boolean }) {
    return this.act<CalendarNote>('saveCalendarNote', data);
  }

  public deleteCalendarNote(id: string) {
    return this.act('deleteCalendarNote', { id });
  }

  /* ---------------- billing ---------------- */

  public purchaseService(serviceId: string) {
    return this.act<Invoice>('purchaseService', { serviceId });
  }

  public requestRenewal(optionId: string) {
    return this.act<Invoice>('requestRenewal', { optionId });
  }

  public reportPayment(invoiceId: string, reference: string, method?: string) {
    return this.act('reportPayment', { invoiceId, reference, method });
  }

  public cancelInvoice(invoiceId: string) {
    return this.act('cancelInvoice', { invoiceId });
  }

  /* ---------------- tests, feedback, meetings ---------------- */

  public submitTest(testId: string, answers: (number | null)[]) {
    return this.act<{ scorePercent: number; correct: number; total: number; passed: boolean }>('submitTest', { testId, answers });
  }

  public submitFeedback(data: { about: FeedbackItem['about']; rating: number; comment?: string; targetId?: string; appointmentId?: string }) {
    return this.act<FeedbackItem>('submitFeedback', data);
  }

  public requestAdminMeeting(data: { date: string; time: string; topic: string; mode: AdminMeeting['mode']; notes?: string }) {
    return this.act<AdminMeeting>('requestAdminMeeting', data);
  }

  public cancelAdminMeeting(id: string) {
    return this.act('cancelAdminMeeting', { id });
  }

  /* ---------------- counsellor / mentor ---------------- */

  public logWork(data: { date: string; hours: number; activity: string; studentId?: string; notes?: string }) {
    return this.act<WorkLog>('logWork', data);
  }

  public deleteWorkLog(id: string) {
    return this.act('deleteWorkLog', { id });
  }

  public submitExpense(data: { date: string; category: string; amount: number; description: string; vendor?: string; receiptFileId?: string; receiptFileName?: string }) {
    return this.act<Expense>('submitExpense', data);
  }

  public deleteExpense(id: string) {
    return this.act('deleteExpense', { id });
  }

  public assignCurriculumModule(data: { studentId: string; title: string; description?: string; weeks?: string; lessons: { title: string; duration?: string; type?: string; url?: string }[] }) {
    return this.act<CurriculumModule>('assignCurriculumModule', data);
  }

  public deleteCurriculumModule(id: string) {
    return this.act('deleteCurriculumModule', { id });
  }

  public shareResource(data: { studentId: string; title: string; description?: string; kind: ResourceItem['kind']; url?: string; fileId?: string; fileName?: string }) {
    return this.act<ResourceItem>('shareResource', data);
  }

  public deleteResource(id: string) {
    return this.act('deleteResource', { id });
  }
}

export { ApiError };
export const platformStore = new CareerPlatformStoreService();
