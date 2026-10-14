import { col, COLLECTIONS, newId, nowIso, longDate, dbName, pingDb } from './db';
import { str, strList } from './http';

export type Profession = 'school' | 'college' | 'fresher' | 'working_professional';
export type StudentStatus = 'pending' | 'contacted' | 'enrolled' | 'completed' | 'cancelled';
export type StudentSource =
  | 'portal_registration'
  | 'quick_consultation'
  | 'synthetic_seed'
  | 'admin_manual'
  | 'self_signup'
  | 'counseling_request';

/** One document per learner. Shared by the admin CRM, the student portal and counsellor workspaces. */
export interface StudentDoc {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  profession: Profession;
  professionLabel: string;
  institutionOrCompany: string;
  detail: string;
  planName: string;
  planPrice: number;
  selectedAddOns: string[];
  status: StudentStatus;
  mentorAssigned: string;
  /** Name of the counsellor an admin assigned (mentorAssigned holds the mentor). */
  counselorAssigned?: string;
  notes: string;
  academicDetails?: Record<string, string | number | boolean | undefined>;
  roadmapProgress: number;
  registeredDate: string;
  createdAt: string;
  updatedAt: string;
  source: StudentSource;
  // Portal / counselling fields
  userId?: string;
  avatarUrl?: string;
  authProvider?: 'google' | 'email' | 'credentials';
  careerGoal?: string;
  careerInterests?: string[];
  assessmentStatus?: 'completed' | 'in_progress' | 'not_started';
  counselingSessionsCount?: number;
  lastSessionDate?: string;
  nextSessionDate?: string;
  pendingTasksCount?: number;
  completedTasksCount?: number;
  academicInfo?: { schoolOrCollege: string; degreeOrGrade: string; yearOrStream: string; gpaOrPercentage?: string };
  completedLessonIds?: string[];
  inquiries?: { at: string; source: string; planName?: string; message?: string }[];
  // Profile building (shown to the student's mentor and counsellor)
  headline?: string;
  about?: string;
  skills?: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeFileId?: string;
  resumeFileName?: string;
  resumeUpdatedAt?: string;
  /** Program access ends on this day (YYYY-MM-DD); extended by paid renewals. */
  programEndsAt?: string;
  isDemo?: boolean;
}

/** Program access lasts a year from registration unless a renewal or admin changed it. */
export function programEndOf(s: Pick<StudentDoc, 'programEndsAt' | 'createdAt'>) {
  if (s.programEndsAt) return s.programEndsAt;
  const start = new Date(s.createdAt || Date.now());
  if (Number.isNaN(start.getTime())) return undefined;
  start.setFullYear(start.getFullYear() + 1);
  return start.toISOString().slice(0, 10);
}

export const PROFESSIONS: Profession[] = ['school', 'college', 'fresher', 'working_professional'];
export const STATUSES: StudentStatus[] = ['pending', 'contacted', 'enrolled', 'completed', 'cancelled'];

export const PROFESSION_LABEL: Record<Profession, string> = {
  school: 'School Student',
  college: 'College Student',
  fresher: 'Fresher / PSW',
  working_professional: 'Working Professional',
};

const asProfession = (v: unknown): Profession => (PROFESSIONS.includes(v as Profession) ? (v as Profession) : 'college');
const asStatus = (v: unknown): StudentStatus => (STATUSES.includes(v as StudentStatus) ? (v as StudentStatus) : 'pending');
const asNumber = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || fallback);

/** Shapes the student for counsellor / mentor / portal views (the `CounselorStudentDetail` type). */
export function toPlatformStudent(s: StudentDoc) {
  return {
    id: s._id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    city: s.city,
    profession: s.profession,
    professionLabel: s.professionLabel,
    institutionOrCompany: s.institutionOrCompany,
    detail: s.detail,
    planName: s.planName,
    planPrice: s.planPrice,
    selectedAddOns: s.selectedAddOns,
    registeredDate: s.registeredDate,
    roadmapProgress: s.roadmapProgress ?? 0,
    avatarUrl: s.avatarUrl,
    authProvider: s.authProvider,
    status: s.status,
    mentorAssigned: s.mentorAssigned,
    counselorAssigned: s.counselorAssigned || 'Unassigned',
    careerGoal: s.careerGoal || s.detail || 'Career advancement',
    careerInterests: s.careerInterests || [],
    assessmentStatus: s.assessmentStatus || 'not_started',
    counselingSessionsCount: s.counselingSessionsCount || 0,
    lastSessionDate: s.lastSessionDate,
    nextSessionDate: s.nextSessionDate,
    pendingTasksCount: s.pendingTasksCount || 0,
    completedTasksCount: s.completedTasksCount || 0,
    academicInfo: s.academicInfo,
    completedLessonIds: s.completedLessonIds || [],
    headline: s.headline || '',
    about: s.about || '',
    skills: s.skills || [],
    linkedinUrl: s.linkedinUrl || '',
    githubUrl: s.githubUrl || '',
    portfolioUrl: s.portfolioUrl || '',
    resumeFileId: s.resumeFileId,
    resumeFileName: s.resumeFileName,
    resumeUpdatedAt: s.resumeUpdatedAt,
    createdAt: s.createdAt,
    programEndsAt: programEndOf(s),
  };
}

/** Fields an admin may change through PATCH /api/students/:id. */
const ADMIN_EDITABLE: (keyof StudentDoc)[] = [
  'name', 'email', 'phone', 'city', 'profession', 'professionLabel', 'institutionOrCompany', 'detail',
  'planName', 'planPrice', 'selectedAddOns', 'status', 'mentorAssigned', 'counselorAssigned', 'notes', 'academicDetails', 'roadmapProgress',
  'careerGoal', 'careerInterests', 'assessmentStatus', 'programEndsAt',
];

export function sanitizeAdminPatch(patch: Record<string, unknown>): Partial<StudentDoc> {
  const out: Record<string, unknown> = {};
  for (const key of ADMIN_EDITABLE) {
    if (!(key in patch)) continue;
    const v = patch[key];
    if (key === 'profession') out[key] = asProfession(v);
    else if (key === 'status') out[key] = asStatus(v);
    else if (key === 'planPrice' || key === 'roadmapProgress') out[key] = Math.max(0, asNumber(v, 0));
    else if (key === 'selectedAddOns' || key === 'careerInterests') out[key] = strList(v);
    else if (key === 'academicDetails') out[key] = v && typeof v === 'object' ? v : {};
    else if (key === 'email') out[key] = str(v, 200).toLowerCase();
    else if (key === 'notes' || key === 'detail') out[key] = str(v, 5000);
    else out[key] = str(v, 300);
  }
  return out as Partial<StudentDoc>;
}

/** Builds a complete student document from loosely-typed form input. */
export function buildStudent(input: Record<string, any>, source: StudentSource): StudentDoc {
  const now = nowIso();
  const profession = asProfession(input.profession);
  const academic = input.academicDetails && typeof input.academicDetails === 'object' ? input.academicDetails : undefined;
  return {
    _id: newId('stu'),
    name: str(input.name, 120) || 'Unnamed learner',
    email: str(input.email, 200).toLowerCase(),
    phone: str(input.phone, 40),
    city: str(input.city, 120) || undefined,
    profession,
    professionLabel: str(input.professionLabel, 120) || PROFESSION_LABEL[profession],
    institutionOrCompany: str(input.institutionOrCompany || input.schoolName || input.collegeName || input.company, 200),
    detail: str(input.detail || input.targetRole || input.careerGoal || input.targetDomain, 1000),
    planName: str(input.planName, 200) || 'Career guidance consultation',
    planPrice: Math.max(0, asNumber(input.planPrice ?? input.price, 0)),
    selectedAddOns: strList(input.selectedAddOns ?? input.addOns),
    status: 'pending',
    mentorAssigned: 'Unassigned',
    notes: str(input.notes || input.additionalNotes || input.message, 5000),
    academicDetails: academic,
    roadmapProgress: 0,
    registeredDate: longDate(),
    createdAt: now,
    updatedAt: now,
    source,
    careerGoal: str(input.careerGoal || input.targetRole || input.targetDomain, 300) || undefined,
    assessmentStatus: 'not_started',
    counselingSessionsCount: 0,
    pendingTasksCount: 0,
    completedTasksCount: 0,
  };
}

/**
 * Records a registration or enquiry from a public form. A new email creates a student;
 * a known email gets the enquiry appended instead, so strangers can't overwrite records.
 */
export async function recordPublicLead(input: Record<string, any>, source: StudentSource): Promise<{ student: StudentDoc; created: boolean }> {
  const students = await col<StudentDoc>(COLLECTIONS.students);
  const email = str(input.email, 200).toLowerCase();
  const existing = email ? await students.findOne({ email }, { sort: { createdAt: 1 } }) : null;
  if (!existing) {
    const doc = buildStudent(input, source);
    await students.insertOne(doc);
    return { student: doc, created: true };
  }
  const inquiry = { at: nowIso(), source, planName: str(input.planName, 200) || undefined, message: str(input.message || input.notes || input.additionalNotes, 2000) || undefined };
  await students.updateOne({ _id: existing._id }, { $push: { inquiries: { $each: [inquiry], $slice: -50 } }, $set: { updatedAt: nowIso() } });
  return { student: existing, created: false };
}

export async function computeStats(list?: StudentDoc[]) {
  const students = list ?? (await (await col<StudentDoc>(COLLECTIONS.students)).find({}).toArray());
  const cohortBreakdown: Record<string, number> = { school: 0, college: 0, fresher: 0, working_professional: 0 };
  const statusBreakdown: Record<string, number> = { pending: 0, contacted: 0, enrolled: 0, completed: 0, cancelled: 0 };
  let totalPipelineRevenue = 0;
  for (const s of students) {
    if (s.profession in cohortBreakdown) cohortBreakdown[s.profession]++;
    if (s.status in statusBreakdown) statusBreakdown[s.status]++;
    totalPipelineRevenue += s.planPrice || 0;
  }
  const ping = await pingDb();
  let uriHost = 'mongodb';
  try {
    uriHost = new URL((process.env.MONGODB_URI || '').replace(/^mongodb(\+srv)?:\/\//, 'https://')).hostname;
  } catch {}
  return {
    mode: 'mongodb' as const,
    status: ping.ok ? ('connected' as const) : ('disconnected' as const),
    dbName: dbName(),
    collection: COLLECTIONS.students,
    totalStudents: students.length,
    totalPipelineRevenue,
    cohortBreakdown,
    statusBreakdown,
    uriHost,
    lastPingMs: ping.ms,
    isRealMongo: ping.ok,
    version: 'MongoDB',
  };
}
