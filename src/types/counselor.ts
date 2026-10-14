import { StudentProfile, UserProfession } from './index';

export type UserRole = 'student' | 'counselor' | 'mentor' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Counselor {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  qualification: string;
  experienceYears: number;
  specializations: string[];
  areasOfExpertise: string[];
  languages: string[];
  bio: string;
  avatarUrl: string;
  approvalStatus: ApprovalStatus;
  registeredDate: string;
  sessionDuration: string;
  availabilityDays: string[];
  availableTimeSlots: string[];
  /** Days off (YYYY-MM-DD) that students can't book. */
  blockedDates?: string[];
  /** Personal video-call room (Meet, Zoom, Teams). Used for every session they accept. */
  meetingLink?: string;
  rating?: number;
  reviewsCount?: number;
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  domain: string;
  company: string;
  role: string;
  experienceYears: number;
  bio: string;
  avatarUrl: string;
  approvalStatus: ApprovalStatus;
  registeredDate: string;
  availableTimeSlots: string[];
  availabilityDays?: string[];
  sessionDuration?: string;
  blockedDates?: string[];
  /** Personal video-call room (Meet, Zoom, Teams). Used for every session they accept. */
  meetingLink?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

export type CounselingRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rescheduled'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface CounselingRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  counselorId: string;
  counselorName: string;
  topic: string;
  counselingType: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  requestDate: string;
  status: CounselingRequestStatus;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export interface Appointment {
  id: string;
  requestId?: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  counselorId: string;
  counselorName: string;
  date: string;
  time: string;
  counselingType: string;
  topic: string;
  status: AppointmentStatus;
  meetingLink?: string;
}

export interface SessionNote {
  id: string;
  appointmentId?: string;
  studentId: string;
  counselorId: string;
  sessionDate: string;
  counselingTopic: string;
  summary: string;
  keyDiscussionPoints: string[];
  studentConcerns: string;
  recommendations: string;
  nextSteps: string;
  followUpDate?: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  studentId: string;
  counselorId: string;
  counselorName: string;
  category:
    | 'Skills to Learn'
    | 'Courses to Explore'
    | 'Projects to Complete'
    | 'Certifications'
    | 'Career Areas to Research'
    | 'Higher Education Options'
    | 'Resume & Portfolio'
    | 'Interview Preparation';
  title: string;
  description: string;
  actionUrl?: string;
  createdAt: string;
  status: 'recommended' | 'in_progress' | 'completed';
}

export interface FollowUpTask {
  id: string;
  studentId: string;
  counselorId: string;
  counselorName: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  createdAt: string;
  completedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string; // e.g. studentId_counselorId
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  createdAt?: string;
  read: boolean;
  attachment?: { fileId: string; name: string };
}

/** In-app notification for a student, counsellor or mentor. */
export interface UserNotification {
  id: string;
  recipientId: string;
  title: string;
  description: string;
  category: 'Mentorship' | 'Sessions' | 'Courses' | 'System';
  actionTab?: string;
  actionText?: string;
  read: boolean;
  createdAt: string;
}

/** A personal roadmap an admin builds for one student. */
export interface PersonalRoadmap {
  id: string;
  studentId: string;
  templateId: string | null;
  goal: string;
  milestones: { id: string; title: string; status: 'todo' | 'doing' | 'done' | 'blocked'; due: string; note: string }[];
  updatedAt: string;
}

export interface StudentAssessment {
  id: string;
  studentId: string;
  assessmentName: string;
  completionDate: string;
  scorePercent?: number;
  strengths: string[];
  interestAreas: string[];
  careerAreasSuggested: string[];
  status: 'completed' | 'in_progress' | 'not_started';
  /** Set when the result came from an online test. */
  testId?: string;
  kind?: string;
  correct?: number;
  total?: number;
  passed?: boolean;
  attempt?: number;
  submittedAt?: string;
}

export interface CounselorStudentDetail extends StudentProfile {
  status?: 'pending' | 'contacted' | 'enrolled' | 'completed' | 'cancelled';
  mentorAssigned?: string;
  counselorAssigned?: string;
  createdAt?: string;
  /** Program access ends on this day (YYYY-MM-DD). */
  programEndsAt?: string;
  // Profile building
  headline?: string;
  about?: string;
  skills?: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeFileId?: string;
  resumeFileName?: string;
  resumeUpdatedAt?: string;
  completedLessonIds?: string[];
  academicInfo?: {
    schoolOrCollege: string;
    degreeOrGrade: string;
    yearOrStream: string;
    gpaOrPercentage?: string;
  };
  careerGoal: string;
  careerInterests: string[];
  assessmentStatus: 'completed' | 'in_progress' | 'not_started';
  counselingSessionsCount: number;
  lastSessionDate?: string;
  nextSessionDate?: string;
  pendingTasksCount: number;
  completedTasksCount: number;
}
