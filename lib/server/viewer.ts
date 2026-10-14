import { getDb, col, COLLECTIONS } from './db';
import { HttpError, UserDoc, isStaff } from './auth';
import type { StudentDoc } from './students';

/**
 * Who is asking, and how they relate to students. Shared by the platform actions
 * (platform.ts) and the portal feature actions (portal.ts).
 */

type Approval = 'pending' | 'approved' | 'rejected';

export interface CounselorDoc {
  _id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  experienceYears: number;
  specializations: string[];
  areasOfExpertise: string[];
  languages: string[];
  bio: string;
  avatarUrl: string;
  approvalStatus: Approval;
  registeredDate: string;
  sessionDuration: string;
  availabilityDays: string[];
  availableTimeSlots: string[];
  /** Days off (YYYY-MM-DD) students can't book. */
  blockedDates?: string[];
  /** Personal video-call room (Meet, Zoom, Teams). Used for every session they accept. */
  meetingLink?: string;
  rating?: number;
  reviewsCount?: number;
  isDemo?: boolean;
}

export interface MentorDoc {
  _id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  domain: string;
  company: string;
  role: string;
  experienceYears: number;
  bio: string;
  avatarUrl: string;
  approvalStatus: Approval;
  registeredDate: string;
  availableTimeSlots: string[];
  availabilityDays?: string[];
  sessionDuration?: string;
  blockedDates?: string[];
  /** Personal video-call room (Meet, Zoom, Teams). Used for every session they accept. */
  meetingLink?: string;
  isDemo?: boolean;
}

export interface Viewer {
  user: UserDoc | null;
  /** Full read access to everything (admin staff accounts). */
  full: boolean;
  /** students / counselors / mentors document id for portal users. */
  profileId?: string;
  kind: 'anonymous' | 'student' | 'counselor' | 'mentor' | 'staff';
}

export function viewerOf(user: UserDoc | null): Viewer {
  if (!user) return { user, full: false, kind: 'anonymous' };
  if (user.role === 'staff') return { user, full: isStaff(user), kind: 'staff' };
  return { user, full: false, profileId: user.refId, kind: user.role };
}

/** Replaces `_id` with `id` and drops server-only fields. */
export const strip = <T extends { _id: string }>(d: T, extraOmit: string[] = []) => {
  const { _id, userId, isDemo, ...rest } = d as any;
  for (const k of extraOmit) delete rest[k];
  return { ...rest, id: _id };
};

export const requireSignedIn = (v: Viewer) => {
  if (!v.user) throw new HttpError(401, 'Please sign in to continue.');
};

export const actorOf = (v: Viewer) => v.user?.email || 'system';

export async function findProvider(id: string): Promise<{ kind: 'counselor' | 'mentor'; doc: CounselorDoc | MentorDoc } | null> {
  if (!id) return null;
  const c = await (await col<CounselorDoc>(COLLECTIONS.counselors)).findOne({ _id: id });
  if (c) return { kind: 'counselor', doc: c };
  const m = await (await col<MentorDoc>(COLLECTIONS.mentors)).findOne({ _id: id });
  if (m) return { kind: 'mentor', doc: m };
  return null;
}

/** Finds an approved counsellor or mentor by display name (admins assign by name). */
export async function findProviderByName(name?: string): Promise<{ kind: 'counselor' | 'mentor'; doc: CounselorDoc | MentorDoc } | null> {
  if (!name || name === 'Unassigned') return null;
  const c = await (await col<CounselorDoc>(COLLECTIONS.counselors)).findOne({ name });
  if (c) return { kind: 'counselor', doc: c };
  const m = await (await col<MentorDoc>(COLLECTIONS.mentors)).findOne({ name });
  if (m) return { kind: 'mentor', doc: m };
  return null;
}

/** True when the student and counsellor/mentor have any working relationship. */
export async function isConnected(studentId: string, providerId: string): Promise<boolean> {
  const db = await getDb();
  const q = { studentId, counselorId: providerId };
  for (const name of [COLLECTIONS.counselingRequests, COLLECTIONS.appointments, COLLECTIONS.recommendations, COLLECTIONS.followUpTasks]) {
    if (await db.collection(name).countDocuments(q, { limit: 1 })) return true;
  }
  const provider = await findProvider(providerId);
  if (!provider) return false;
  const student = await db
    .collection<StudentDoc>(COLLECTIONS.students)
    .findOne({ _id: studentId }, { projection: { mentorAssigned: 1, counselorAssigned: 1 } });
  return Boolean(student && (student.mentorAssigned === provider.doc.name || student.counselorAssigned === provider.doc.name));
}

/** The counsellor/mentor on a record must be the caller, unless the caller is admin staff. */
export function assertOwnsRelation(v: Viewer, counselorId: string) {
  if (v.full) return;
  if ((v.kind === 'counselor' || v.kind === 'mentor') && v.profileId === counselorId) return;
  throw new HttpError(403, 'You can only manage your own students and sessions.');
}

export const isProvider = (v: Viewer) => (v.kind === 'counselor' || v.kind === 'mentor') && Boolean(v.profileId);
