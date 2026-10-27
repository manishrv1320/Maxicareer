import { useState, useEffect } from 'react';
import { platformStore, PlatformState } from '../services/careerPlatformStore';

type Store = typeof platformStore;

/** Runs an action; on failure shows the error toast instead of throwing. */
function reported<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  return (...args: A): Promise<R | undefined> =>
    fn(...args).catch((err) => {
      platformStore.reportError(err);
      return undefined;
    });
}

export function useCareerStore() {
  const [state, setState] = useState<PlatformState>(() => platformStore.getState());

  useEffect(() => {
    const unsubscribe = platformStore.subscribe(() => {
      setState(platformStore.getState());
    });
    setState(platformStore.getState());
    return () => {
      unsubscribe();
    };
  }, []);

  const s: Store = platformStore;
  return {
    state,
    refresh: () => s.refresh(),
    // These reject on failure so forms can show the message inline.
    login: (email: string, password: string, portal: 'student' | 'counselor' | 'mentor' | 'admin') => s.login(email, password, portal),
    registerCounselor: (data: Parameters<Store['registerCounselor']>[0]) => s.registerCounselor(data),
    registerMentor: (data: Parameters<Store['registerMentor']>[0]) => s.registerMentor(data),
    createCounselingRequest: (data: Parameters<Store['createCounselingRequest']>[0]) => s.createCounselingRequest(data),
    // These report failures through <PlatformToaster />.
    logout: reported(() => s.logout()),
    setEnvironment: reported((env: 'production' | 'demo') => s.setEnvironment(env)),
    resetToCleanProduction: reported(() => s.resetToCleanProduction()),
    updateCounselorApproval: reported((id: string, status: 'approved' | 'rejected') => s.updateCounselorApproval(id, status)),
    updateCounselorProfile: reported((id: string, updates: Parameters<Store['updateCounselorProfile']>[1]) => s.updateCounselorProfile(id, updates)),
    setActiveCounselor: reported((id: string | null) => s.setActiveCounselor(id)),
    getActiveCounselor: () => s.getActiveCounselor(),
    getApprovedCounselors: () => s.getApprovedCounselors(),
    syncStudentFromPortal: reported((profile?: unknown) => s.syncStudentFromPortal(profile)),
    updateStudentProgress: reported((ids: string[], progress?: number) => s.updateStudentProgress(ids, progress)),
    updateStudentProfile: reported((updates: Parameters<Store['updateStudentProfile']>[0]) => s.updateStudentProfile(updates)),
    createSupportTicket: (data: Parameters<Store['createSupportTicket']>[0]) => s.createSupportTicket(data),
    acceptCounselingRequest: reported((id: string) => s.acceptCounselingRequest(id)),
    rejectCounselingRequest: reported((id: string) => s.rejectCounselingRequest(id)),
    completeSession: reported((id: string, data: Parameters<Store['completeSession']>[1]) => s.completeSession(id, data)),
    updateAppointmentStatus: reported((id: string, status: 'scheduled' | 'completed' | 'cancelled') => s.updateAppointmentStatus(id, status)),
    // These reject on failure so the dialog can show the message inline.
    rescheduleAppointment: (id: string, date: string, time: string) => s.rescheduleAppointment(id, date, time),
    bookedSlots: (counselorId: string) => s.bookedSlots(counselorId),
    addRecommendation: reported((data: Parameters<Store['addRecommendation']>[0]) => s.addRecommendation(data)),
    updateRecommendationStatus: reported((id: string, status: Parameters<Store['updateRecommendationStatus']>[1]) => s.updateRecommendationStatus(id, status)),
    addFollowUpTask: reported((data: Parameters<Store['addFollowUpTask']>[0]) => s.addFollowUpTask(data)),
    updateTaskStatus: reported((id: string, status: 'pending' | 'in_progress' | 'completed') => s.updateTaskStatus(id, status)),
    sendMessage: reported((data: Parameters<Store['sendMessage']>[0]) => s.sendMessage(data)),
    markConversationRead: reported((conversationId: string) => s.markConversationRead(conversationId)),
    markNotificationsRead: reported((ids?: string[]) => s.markNotificationsRead(ids)),
    setActiveAdmin: reported((id: string | null) => s.setActiveAdmin(id)),
    setActiveMentor: reported((id: string | null) => s.setActiveMentor(id)),
    updateMentorApproval: reported((id: string, status: 'approved' | 'rejected') => s.updateMentorApproval(id, status)),
    updateMentorProfile: reported((id: string, updates: Parameters<Store['updateMentorProfile']>[1]) => s.updateMentorProfile(id, updates)),
    getApprovedMentors: () => s.getApprovedMentors(),
    // Portal features. These reject on failure so forms can show the message inline.
    submitAssignment: (data: Parameters<Store['submitAssignment']>[0]) => s.submitAssignment(data),
    reviewAssignment: (id: string, data: Parameters<Store['reviewAssignment']>[1]) => s.reviewAssignment(id, data),
    deleteAssignment: (id: string) => s.deleteAssignment(id),
    saveCalendarNote: (data: Parameters<Store['saveCalendarNote']>[0]) => s.saveCalendarNote(data),
    deleteCalendarNote: (id: string) => s.deleteCalendarNote(id),
    purchaseService: (serviceId: string) => s.purchaseService(serviceId),
    requestRenewal: (optionId: string) => s.requestRenewal(optionId),
    reportPayment: (invoiceId: string, reference: string, method?: string) => s.reportPayment(invoiceId, reference, method),
    cancelInvoice: (invoiceId: string) => s.cancelInvoice(invoiceId),
    submitTest: (testId: string, answers: (number | null)[]) => s.submitTest(testId, answers),
    submitFeedback: (data: Parameters<Store['submitFeedback']>[0]) => s.submitFeedback(data),
    requestAdminMeeting: (data: Parameters<Store['requestAdminMeeting']>[0]) => s.requestAdminMeeting(data),
    cancelAdminMeeting: (id: string) => s.cancelAdminMeeting(id),
    setAppointmentLink: (id: string, meetingLink: string) => s.setAppointmentLink(id, meetingLink),
    logWork: (data: Parameters<Store['logWork']>[0]) => s.logWork(data),
    deleteWorkLog: (id: string) => s.deleteWorkLog(id),
    submitExpense: (data: Parameters<Store['submitExpense']>[0]) => s.submitExpense(data),
    deleteExpense: (id: string) => s.deleteExpense(id),
    assignCurriculumModule: (data: Parameters<Store['assignCurriculumModule']>[0]) => s.assignCurriculumModule(data),
    deleteCurriculumModule: (id: string) => s.deleteCurriculumModule(id),
    shareResource: (data: Parameters<Store['shareResource']>[0]) => s.shareResource(data),
    deleteResource: (id: string) => s.deleteResource(id),
  };
}
