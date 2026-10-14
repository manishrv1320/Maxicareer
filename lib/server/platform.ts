import type { Filter } from 'mongodb';
import type { NextRequest } from 'next/server';
import { getDb, col, COLLECTIONS, newId, nowIso, longDate } from './db';
import {
  HttpError,
  UserDoc,
  hashPassword,
  validatePassword,
  normaliseEmail,
  isValidEmail,
  isAdmin,
  destroyAllSessionsFor,
  rateLimit,
} from './auth';
import { str, strList, meetingUrl } from './http';
import { StudentDoc, toPlatformStudent, recordPublicLead } from './students';
import { notifyAdmins, notifyUser, audit } from './notify';
import { recordSubmission } from './submissions';
import {
  CounselorDoc,
  MentorDoc,
  Viewer,
  viewerOf,
  strip,
  requireSignedIn,
  actorOf,
  findProvider,
  isConnected,
  assertOwnsRelation,
} from './viewer';
import { buildPortalState, PORTAL_ACTIONS, isIsoDay } from './portal';

export type { CounselorDoc, MentorDoc } from './viewer';

/* ------------------------------------------------------------------ */
/* Document shapes (mirror src/types/counselor.ts, keyed by _id)       */
/* ------------------------------------------------------------------ */

interface RelationDoc {
  _id: string;
  studentId: string;
  counselorId: string;
  isDemo?: boolean;
  [k: string]: any;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80';

const timeLabel = () =>
  `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const weekdays = (v: unknown) => strList(v, 7, 12).filter((d) => WEEKDAYS.includes(d));
const isoDays = (v: unknown) => Array.from(new Set(strList(v, 120, 10).filter(isIsoDay))).sort();
const httpUrl = (v: unknown) => {
  const s = str(v, 500);
  return !s || /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export async function buildState(user: UserDoc | null) {
  const db = await getDb();
  const C = COLLECTIONS;
  const v = viewerOf(user);
  const self = v.profileId;

  await deliverDueBroadcasts().catch((err) => console.error('[platform] broadcast delivery failed:', err));

  // Directory of counsellors and mentors
  const directoryFilter = v.full ? {} : { approvalStatus: 'approved' as const };
  const [counselorDocs, mentorDocs] = await Promise.all([
    db.collection<CounselorDoc>(C.counselors).find(directoryFilter).sort({ registeredDate: 1 }).toArray(),
    db.collection<MentorDoc>(C.mentors).find(directoryFilter).sort({ registeredDate: 1 }).toArray(),
  ]);
  if (v.kind === 'counselor' && self && !counselorDocs.some((c) => c._id === self)) {
    const mine = await db.collection<CounselorDoc>(C.counselors).findOne({ _id: self });
    if (mine) counselorDocs.push(mine);
  }
  if (v.kind === 'mentor' && self && !mentorDocs.some((m) => m._id === self)) {
    const mine = await db.collection<MentorDoc>(C.mentors).findOne({ _id: self });
    if (mine) mentorDocs.push(mine);
  }

  // Relationship records
  let relFilter: Filter<RelationDoc> | null = null;
  if (v.full) relFilter = {};
  else if (v.kind === 'student' && self) relFilter = { studentId: self };
  else if ((v.kind === 'counselor' || v.kind === 'mentor') && self) relFilter = { counselorId: self };

  const find = (name: string) => (relFilter ? db.collection<RelationDoc>(name).find(relFilter).toArray() : Promise.resolve([] as RelationDoc[]));
  const [requests, appointments, notes, recs, tasks] = await Promise.all([
    find(C.counselingRequests),
    find(C.appointments),
    find(C.sessionNotes),
    find(C.recommendations),
    find(C.followUpTasks),
  ]);

  // Students visible to this viewer
  const studentsCol = db.collection<StudentDoc>(C.students);
  let studentDocs: StudentDoc[] = [];
  if (v.full) {
    studentDocs = await studentsCol.find({}).sort({ createdAt: -1 }).limit(5000).toArray();
  } else if (v.kind === 'student' && self) {
    const me = await studentsCol.findOne({ _id: self });
    studentDocs = me ? [me] : [];
  } else if ((v.kind === 'counselor' || v.kind === 'mentor') && self) {
    const ids = new Set<string>();
    [requests, appointments, notes, recs, tasks].forEach((list) => list.forEach((r) => ids.add(r.studentId)));
    const myName = (v.kind === 'counselor' ? counselorDocs : mentorDocs).find((p) => p._id === self)?.name;
    studentDocs = await studentsCol
      .find({ $or: [{ _id: { $in: Array.from(ids) } }, ...(myName ? [{ mentorAssigned: myName }, { counselorAssigned: myName }] : [])] })
      .toArray();
  }
  const studentIds = studentDocs.map((s) => s._id);

  // Messages: only the participants see them
  const messages =
    self && !v.full
      ? await db
          .collection(C.messages)
          .find({ $or: [{ senderId: self }, { recipientId: self }] })
          .sort({ createdAt: 1 })
          .limit(2000)
          .toArray()
      : [];

  const assessments = studentIds.length
    ? await db.collection(C.assessments).find({ studentId: { $in: studentIds } }).toArray()
    : [];

  const notifications = self
    ? await db.collection(C.userNotifications).find({ recipientId: self }).sort({ createdAt: -1 }).limit(100).toArray()
    : [];

  const studentRoadmap = v.kind === 'student' && self ? await db.collection(C.studentRoadmaps).findOne({ _id: self as any }) : null;

  const demo = await db.collection(C.settings).findOne({ _id: 'demo_loaded' as any });

  // Phone numbers and personal meeting rooms are for the provider and staff only.
  const hidePrivate = (id: string) => !v.full && id !== self;

  const portal = await buildPortalState(v, studentDocs);

  return {
    ...portal,
    loaded: true,
    environment: demo?.value ? ('demo' as const) : ('production' as const),
    currentUser: user
      ? { id: user._id, email: user.email, name: user.name, role: user.role, staffRole: user.staffRole, refId: user.refId, status: user.status }
      : null,
    students: studentDocs.map(toPlatformStudent),
    counselors: counselorDocs.map((c) => strip(c, hidePrivate(c._id) ? ['phone', 'meetingLink'] : [])),
    mentors: mentorDocs.map((m) => strip(m, hidePrivate(m._id) ? ['phone', 'meetingLink'] : [])),
    admins: [],
    counselingRequests: requests.map((r) => strip(r)),
    appointments: appointments.map((a) => strip(a)),
    sessionNotes: notes.map((n) => strip(n)),
    recommendations: recs.map((r) => strip(r)),
    followUpTasks: tasks.map((t) => strip(t)),
    messages: messages.map((m: any) => strip(m)),
    assessments: assessments.map((a: any) => strip(a)),
    notifications: notifications.map((n: any) => strip(n)),
    studentRoadmap: studentRoadmap ? strip(studentRoadmap as any) : null,
    activeCounselorId: v.kind === 'counselor' ? self || null : null,
    activeMentorId: v.kind === 'mentor' ? self || null : null,
    activeAdminId: v.full ? user!._id : null,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function getRelation(name: string, id: unknown) {
  const doc = await (await col<RelationDoc>(name)).findOne({ _id: str(id, 100) });
  if (!doc) throw new HttpError(404, 'That record no longer exists.');
  return doc;
}

/** Rooms the platform made itself before providers pasted their own links. */
const isAutoRoom = (link?: string) => !link || link.startsWith('https://meet.jit.si/maxicareer-');

/**
 * A counsellor or mentor saved a new personal meeting link: move their upcoming sessions
 * that had no link (or the old personal one) onto it and tell those students.
 */
async function applyPersonalLink(providerId: string, previous: string | undefined, link: string) {
  if (!link || link === previous) return;
  const today = Date.parse(new Date().toISOString().slice(0, 10));
  const apts = await col<RelationDoc>(COLLECTIONS.appointments);
  for (const a of await apts.find({ counselorId: providerId, status: 'scheduled' }).toArray()) {
    if (!(Date.parse(a.date) >= today)) continue;
    if (!isAutoRoom(a.meetingLink) && a.meetingLink !== previous) continue;
    await apts.updateOne({ _id: a._id }, { $set: { meetingLink: link } });
    await notifyUser({
      recipientId: a.studentId,
      title: a.meetingLink ? 'Meeting link updated' : 'Meeting link added',
      description: `${a.counselorName} shared the link for your session on ${a.date} at ${a.time}.`,
      category: 'Sessions',
      actionTab: 'sessions',
      actionText: 'View session',
    });
  }
}

async function providerIdentity(v: Viewer, explicitCounselorId?: string) {
  const id = v.full ? str(explicitCounselorId, 100) : v.profileId;
  if (!id) throw new HttpError(400, 'Choose the counsellor or mentor for this record.');
  const provider = await findProvider(id);
  if (!provider) throw new HttpError(404, 'Counsellor or mentor not found.');
  return { id, name: provider.doc.name, kind: provider.kind };
}

/* ------------------------------------------------------------------ */
/* Registration & approval                                             */
/* ------------------------------------------------------------------ */

async function createProviderAccount(kind: 'counselor' | 'mentor', p: Record<string, any>) {
  const email = normaliseEmail(p.email);
  const name = str(p.name, 120);
  if (!name) throw new HttpError(400, 'Please enter your full name.');
  if (!isValidEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
  const pwError = validatePassword(p.password);
  if (pwError) throw new HttpError(400, pwError);

  const users = await col<UserDoc>(COLLECTIONS.users);
  if (await users.findOne({ email })) throw new HttpError(409, 'An account with this email already exists. Please sign in instead.');

  const profileId = newId(kind);
  const userId = newId('user');
  const base = {
    _id: profileId,
    userId,
    name,
    email,
    phone: str(p.phone, 40),
    bio: str(p.bio, 3000),
    avatarUrl: str(p.avatarUrl, 1000) || DEFAULT_AVATAR,
    approvalStatus: 'pending' as const,
    registeredDate: longDate(),
    experienceYears: Math.max(0, Math.min(60, Number(p.experienceYears) || 0)),
  };
  const doc: CounselorDoc | MentorDoc =
    kind === 'counselor'
      ? {
          ...base,
          qualification: str(p.qualification, 300),
          specializations: strList(p.specializations),
          areasOfExpertise: strList(p.areasOfExpertise),
          languages: strList(p.languages),
          sessionDuration: str(p.sessionDuration, 30) || '45 mins',
          availabilityDays: strList(p.availabilityDays).length ? strList(p.availabilityDays) : ['Monday', 'Wednesday', 'Friday'],
          availableTimeSlots: strList(p.availableTimeSlots).length ? strList(p.availableTimeSlots) : ['10:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'],
        }
      : {
          ...base,
          domain: str(p.domain, 200),
          company: str(p.company, 200),
          role: str(p.role, 200),
          availableTimeSlots: strList(p.availableTimeSlots).length ? strList(p.availableTimeSlots) : ['05:00 PM', '07:00 PM', '08:30 PM'],
        };

  await users.insertOne({
    _id: userId,
    email,
    name,
    passwordHash: await hashPassword(p.password),
    role: kind,
    refId: profileId,
    status: 'pending',
    createdAt: nowIso(),
  });
  await (await col(kind === 'counselor' ? COLLECTIONS.counselors : COLLECTIONS.mentors)).insertOne(doc as any);

  const label = kind === 'counselor' ? 'Counsellor' : 'Mentor';
  await (await col(COLLECTIONS.approvals)).insertOne({
    _id: `appr-${profileId}` as any,
    title: `${label} sign-up: ${name}`,
    requester: `${name} (${email})`,
    status: 'Pending',
    createdAt: nowIso(),
    kind,
    refId: profileId,
  });
  await notifyAdmins({
    title: `New ${label.toLowerCase()} awaiting approval`,
    body: `${name} · ${email}`,
    category: 'approvals',
    priority: 'high',
    link: 'counsellors',
  });
  await recordSubmission({
    form: kind === 'counselor' ? 'counsellor_signup' : 'mentor_signup',
    name,
    email,
    phone: base.phone,
    subject: `${label} sign-up (awaiting approval)`,
    fields: { ...p, avatarUrl: undefined },
    notify: false,
  });
  return strip(doc as any);
}

/** Approves or rejects a counsellor/mentor and keeps their login and approval item in sync. */
export async function setProviderApproval(kind: 'counselor' | 'mentor', id: string, status: 'approved' | 'rejected', actor: string) {
  const profiles = await col<CounselorDoc | MentorDoc>(kind === 'counselor' ? COLLECTIONS.counselors : COLLECTIONS.mentors);
  const doc = await profiles.findOne({ _id: id });
  if (!doc) throw new HttpError(404, 'Profile not found.');
  await profiles.updateOne({ _id: id }, { $set: { approvalStatus: status } });
  const users = await col<UserDoc>(COLLECTIONS.users);
  const user = await users.findOne({ refId: id });
  if (user) {
    await users.updateOne({ _id: user._id }, { $set: { status: status === 'approved' ? 'active' : 'rejected' } });
    if (status === 'rejected') await destroyAllSessionsFor(user._id);
  }
  await (await col(COLLECTIONS.approvals)).updateOne({ _id: `appr-${id}` as any }, { $set: { status: status === 'approved' ? 'Approved' : 'Rejected' } });
  await audit(actor, 'Approvals', status === 'approved' ? 'Approved' : 'Rejected', `${kind}: ${doc.name}`);
  if (status === 'approved') {
    await notifyUser({ recipientId: id, title: 'Your profile is approved', description: 'You now have full access to your workspace and appear in the public directory.', category: 'System' });
  }
}

/* ------------------------------------------------------------------ */
/* Scheduled broadcasts                                                */
/* ------------------------------------------------------------------ */

/** Delivers admin broadcasts to students' and staff's in-app notifications. */
export async function deliverBroadcast(b: Record<string, any>) {
  const db = await getDb();
  if (!Array.isArray(b.channels) || !b.channels.includes('inapp')) return 0;
  let recipientIds: string[] = [];
  const audience: string = b.audience || 'all';
  if (audience === 'staff') {
    const [cs, ms] = await Promise.all([
      db.collection(COLLECTIONS.counselors).find({ approvalStatus: 'approved' }, { projection: { _id: 1 } }).toArray(),
      db.collection(COLLECTIONS.mentors).find({ approvalStatus: 'approved' }, { projection: { _id: 1 } }).toArray(),
    ]);
    recipientIds = [...cs, ...ms].map((d) => String(d._id));
  } else {
    let filter: Filter<StudentDoc> = {};
    if (audience === 'student') filter = { email: normaliseEmail(b.studentEmail || b.audienceLabel) };
    else if (audience.startsWith('status:')) filter = { status: audience.slice(7) as any };
    else if (audience !== 'all') filter = { profession: audience as any };
    recipientIds = (await db.collection<StudentDoc>(COLLECTIONS.students).find(filter, { projection: { _id: 1 } }).toArray()).map((d) => d._id);
  }
  if (!recipientIds.length) return 0;
  const createdAt = nowIso();
  await db.collection(COLLECTIONS.userNotifications).insertMany(
    recipientIds.map((recipientId) => ({
      _id: newId('un') as any,
      recipientId,
      title: str(b.title, 200),
      description: str(b.message, 2000),
      category: 'System',
      read: false,
      createdAt,
      broadcastId: b._id || b.id,
    }))
  );
  return recipientIds.length;
}

let lastBroadcastCheck = 0;
export async function deliverDueBroadcasts() {
  if (Date.now() - lastBroadcastCheck < 30_000) return;
  lastBroadcastCheck = Date.now();
  const broadcasts = await col(COLLECTIONS.broadcasts);
  const due = await broadcasts.find({ status: 'Scheduled', sendAt: { $lte: nowIso() } }).toArray();
  for (const b of due) {
    const claimed = await broadcasts.updateOne({ _id: b._id, status: 'Scheduled' }, { $set: { status: 'Sent', deliveredAt: nowIso() } });
    if (claimed.modifiedCount) await deliverBroadcast(b);
  }
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

type ActionFn = (v: Viewer, p: Record<string, any>, req: NextRequest) => Promise<unknown>;

const requireAdminViewer = (v: Viewer) => {
  if (!isAdmin(v.user)) throw new HttpError(403, 'Only administrators can do that.');
};

const ACTIONS: Record<string, ActionFn> = {
  ...PORTAL_ACTIONS,
  /* ---------- sign-ups & approvals ---------- */
  async registerCounselor(_v, p, req) {
    rateLimit(req, 'register', 10, 15 * 60_000);
    return createProviderAccount('counselor', p);
  },
  async registerMentor(_v, p, req) {
    rateLimit(req, 'register', 10, 15 * 60_000);
    return createProviderAccount('mentor', p);
  },
  async updateCounselorApproval(v, p) {
    requireAdminViewer(v);
    await setProviderApproval('counselor', str(p.id, 100), p.status === 'approved' ? 'approved' : 'rejected', actorOf(v));
  },
  async updateMentorApproval(v, p) {
    requireAdminViewer(v);
    await setProviderApproval('mentor', str(p.id, 100), p.status === 'approved' ? 'approved' : 'rejected', actorOf(v));
  },

  /* ---------- profiles ---------- */
  async updateCounselorProfile(v, p) {
    const id = str(p.id, 100);
    if (!(isAdmin(v.user) || (v.kind === 'counselor' && v.profileId === id))) throw new HttpError(403, 'You can only edit your own profile.');
    const u = p.updates || {};
    const set: Record<string, unknown> = {};
    for (const k of ['name', 'phone', 'qualification', 'bio', 'avatarUrl', 'sessionDuration']) if (k in u) set[k] = str(u[k], k === 'bio' ? 3000 : 1000);
    for (const k of ['specializations', 'areasOfExpertise', 'languages', 'availableTimeSlots']) if (k in u) set[k] = strList(u[k]);
    if ('availabilityDays' in u) set.availabilityDays = weekdays(u.availabilityDays);
    if ('blockedDates' in u) set.blockedDates = isoDays(u.blockedDates);
    if ('experienceYears' in u) set.experienceYears = Math.max(0, Math.min(60, Number(u.experienceYears) || 0));
    if ('meetingLink' in u) set.meetingLink = meetingUrl(u.meetingLink);
    const counselors = await col<CounselorDoc>(COLLECTIONS.counselors);
    const before = 'meetingLink' in set ? await counselors.findOne({ _id: id }) : null;
    await counselors.updateOne({ _id: id }, { $set: set });
    if (set.name) await (await col<UserDoc>(COLLECTIONS.users)).updateOne({ refId: id }, { $set: { name: set.name as string } });
    if (before) await applyPersonalLink(id, before.meetingLink, set.meetingLink as string);
  },
  async updateMentorProfile(v, p) {
    const id = str(p.id, 100);
    if (!(isAdmin(v.user) || (v.kind === 'mentor' && v.profileId === id))) throw new HttpError(403, 'You can only edit your own profile.');
    const u = p.updates || {};
    const set: Record<string, unknown> = {};
    for (const k of ['name', 'phone', 'domain', 'company', 'role', 'bio', 'avatarUrl', 'sessionDuration']) if (k in u) set[k] = str(u[k], k === 'bio' ? 3000 : 1000);
    if ('availableTimeSlots' in u) set.availableTimeSlots = strList(u.availableTimeSlots);
    if ('availabilityDays' in u) set.availabilityDays = weekdays(u.availabilityDays);
    if ('blockedDates' in u) set.blockedDates = isoDays(u.blockedDates);
    if ('experienceYears' in u) set.experienceYears = Math.max(0, Math.min(60, Number(u.experienceYears) || 0));
    if ('meetingLink' in u) set.meetingLink = meetingUrl(u.meetingLink);
    const mentors = await col<MentorDoc>(COLLECTIONS.mentors);
    const before = 'meetingLink' in set ? await mentors.findOne({ _id: id }) : null;
    await mentors.updateOne({ _id: id }, { $set: set });
    if (set.name) await (await col<UserDoc>(COLLECTIONS.users)).updateOne({ refId: id }, { $set: { name: set.name as string } });
    if (before) await applyPersonalLink(id, before.meetingLink, set.meetingLink as string);
  },
  async updateStudentProfile(v, p) {
    if (v.kind !== 'student' || !v.profileId) throw new HttpError(403, 'Only students can edit their portal profile.');
    const set: Record<string, unknown> = { updatedAt: nowIso() };
    for (const k of ['phone', 'city', 'avatarUrl', 'careerGoal', 'headline']) if (k in p) set[k] = str(p[k], 1000);
    if ('about' in p) set.about = str(p.about, 3000);
    for (const k of ['linkedinUrl', 'githubUrl', 'portfolioUrl']) if (k in p) set[k] = httpUrl(p[k]);
    if ('careerInterests' in p) set.careerInterests = strList(p.careerInterests);
    if ('skills' in p) set.skills = strList(p.skills, 40, 60);
    const students = await col<StudentDoc>(COLLECTIONS.students);
    if ('resumeFileId' in p) {
      const fileId = str(p.resumeFileId, 100);
      if (fileId) {
        // The student's mentor and counsellor may open the resume.
        const files = await col(COLLECTIONS.files);
        const file = await files.findOne({ _id: fileId as any });
        if (!file || file.ownerUserId !== v.user!._id) throw new HttpError(403, 'Upload the resume again and retry.');
        const me = await students.findOne({ _id: v.profileId }, { projection: { mentorAssigned: 1, counselorAssigned: 1 } });
        const names = [me?.mentorAssigned, me?.counselorAssigned].filter((n) => n && n !== 'Unassigned') as string[];
        const db = await getDb();
        const providers = names.length
          ? [
              ...(await db.collection(COLLECTIONS.counselors).find({ name: { $in: names } }, { projection: { _id: 1 } }).toArray()),
              ...(await db.collection(COLLECTIONS.mentors).find({ name: { $in: names } }, { projection: { _id: 1 } }).toArray()),
            ].map((d) => String(d._id))
          : [];
        if (providers.length) await files.updateOne({ _id: fileId as any }, { $addToSet: { allowedProfileIds: { $each: providers } } });
        set.resumeFileId = fileId;
        set.resumeFileName = str(p.resumeFileName, 200) || String(file.originalName || 'Resume');
        set.resumeUpdatedAt = nowIso();
      } else {
        set.resumeFileId = '';
        set.resumeFileName = '';
      }
    }
    await students.updateOne({ _id: v.profileId }, { $set: set });
  },
  async updateStudentProgress(v, p) {
    if (v.kind !== 'student' || !v.profileId) throw new HttpError(403, 'Only students can update their course progress.');
    const set: Record<string, unknown> = { updatedAt: nowIso(), completedLessonIds: strList(p.completedLessonIds, 500, 100) };
    if (typeof p.roadmapProgress === 'number') set.roadmapProgress = Math.max(0, Math.min(100, Math.round(p.roadmapProgress)));
    await (await col<StudentDoc>(COLLECTIONS.students)).updateOne({ _id: v.profileId }, { $set: set });
  },

  /* ---------- counselling requests ---------- */
  async createCounselingRequest(v, p, req) {
    const provider = await findProvider(str(p.counselorId, 100));
    if (!provider || provider.doc.approvalStatus !== 'approved') throw new HttpError(404, 'That counsellor is not available for booking.');
    const preferredDate = str(p.preferredDate, 60);
    const preferredTime = str(p.preferredTime, 30);
    if (!preferredDate || !preferredTime) throw new HttpError(400, 'Choose a preferred date and time.');

    let student: StudentDoc | null = null;
    const students = await col<StudentDoc>(COLLECTIONS.students);
    if (v.kind === 'student' && v.profileId) {
      student = await students.findOne({ _id: v.profileId });
    } else {
      rateLimit(req, 'booking', 8, 15 * 60_000);
      const email = normaliseEmail(p.studentEmail);
      if (!isValidEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
      ({ student } = await recordPublicLead(
        { name: p.studentName, email, phone: p.studentPhone, planName: 'Career counselling', detail: p.topic, message: p.notes },
        'counseling_request'
      ));
    }
    if (!student) throw new HttpError(404, 'Student profile not found.');

    const doc = {
      _id: newId('req'),
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      studentPhone: student.phone,
      counselorId: provider.doc._id,
      counselorName: provider.doc.name,
      topic: str(p.topic, 300) || `${str(p.counselingType, 100) || 'Career'} consultation`,
      counselingType: str(p.counselingType, 100) || 'Career Exploration',
      preferredDate,
      preferredTime,
      notes: str(p.notes, 3000),
      requestDate: longDate(),
      status: 'pending',
      createdAt: nowIso(),
    };
    await (await col(COLLECTIONS.counselingRequests)).insertOne(doc as any);
    await notifyUser({
      recipientId: provider.doc._id,
      title: `New session request from ${student.name}`,
      description: `${doc.counselingType} on ${preferredDate} at ${preferredTime}`,
      category: 'Sessions',
    });
    await notifyAdmins({ title: `Session requested: ${student.name}`, body: `With ${provider.doc.name} · ${preferredDate} ${preferredTime}`, category: 'sessions', link: 'sessions' });
    return strip(doc);
  },
  async acceptCounselingRequest(v, p) {
    const reqDoc = await getRelation(COLLECTIONS.counselingRequests, p.id);
    assertOwnsRelation(v, reqDoc.counselorId);
    if (reqDoc.status !== 'pending' && reqDoc.status !== 'rescheduled') throw new HttpError(409, 'This request has already been handled.');
    await (await col(COLLECTIONS.counselingRequests)).updateOne({ _id: reqDoc._id as any }, { $set: { status: 'accepted' } });
    // The counsellor's own room; they can paste a different link for this session later.
    const meetingLink = (await findProvider(reqDoc.counselorId))?.doc.meetingLink || undefined;
    const apt = {
      _id: newId('apt'),
      requestId: reqDoc._id,
      studentId: reqDoc.studentId,
      studentName: reqDoc.studentName,
      studentEmail: reqDoc.studentEmail,
      studentPhone: reqDoc.studentPhone,
      counselorId: reqDoc.counselorId,
      counselorName: reqDoc.counselorName,
      date: reqDoc.preferredDate,
      time: reqDoc.preferredTime,
      counselingType: reqDoc.counselingType,
      topic: reqDoc.topic,
      status: 'scheduled',
      meetingLink,
      createdAt: nowIso(),
    };
    await (await col(COLLECTIONS.appointments)).insertOne(apt as any);
    await (await col<StudentDoc>(COLLECTIONS.students)).updateOne({ _id: reqDoc.studentId }, { $set: { nextSessionDate: `${apt.date} at ${apt.time}` } });
    await notifyUser({
      recipientId: reqDoc.studentId,
      title: 'Session confirmed',
      description: `${reqDoc.counselorName} accepted your ${reqDoc.counselingType} session on ${apt.date} at ${apt.time}.${meetingLink ? '' : ' The meeting link will be shared before the session.'}`,
      category: 'Sessions',
      actionTab: 'sessions',
      actionText: 'View session',
    });
    return strip(apt);
  },
  async rejectCounselingRequest(v, p) {
    const reqDoc = await getRelation(COLLECTIONS.counselingRequests, p.id);
    assertOwnsRelation(v, reqDoc.counselorId);
    await (await col(COLLECTIONS.counselingRequests)).updateOne({ _id: reqDoc._id as any }, { $set: { status: 'rejected' } });
    await notifyUser({
      recipientId: reqDoc.studentId,
      title: 'Session request declined',
      description: `${reqDoc.counselorName} couldn't take the ${reqDoc.preferredDate} slot. Please pick another time or counsellor.`,
      category: 'Sessions',
      actionTab: 'sessions',
    });
  },

  /* ---------- appointments & notes ---------- */
  async completeSession(v, p) {
    const apt = await getRelation(COLLECTIONS.appointments, p.appointmentId);
    assertOwnsRelation(v, apt.counselorId);
    const d = p.data || {};
    // Notes can be added to a session someone already marked done; count it only once.
    const firstCompletion = apt.status !== 'completed';
    if (firstCompletion) {
      await (await col(COLLECTIONS.appointments)).updateOne({ _id: apt._id as any }, { $set: { status: 'completed' } });
      if (apt.requestId) await (await col(COLLECTIONS.counselingRequests)).updateOne({ _id: apt.requestId }, { $set: { status: 'completed' } });
    }
    const note = {
      _id: newId('note'),
      appointmentId: apt._id,
      studentId: apt.studentId,
      counselorId: apt.counselorId,
      sessionDate: apt.date,
      counselingTopic: apt.topic || apt.counselingType,
      summary: str(d.summary, 5000),
      keyDiscussionPoints: strList(d.keyDiscussionPoints, 30, 500),
      studentConcerns: str(d.studentConcerns, 3000),
      recommendations: str(d.recommendations, 3000),
      nextSteps: str(d.nextSteps, 3000),
      followUpDate: str(d.followUpDate, 60) || undefined,
      createdAt: longDate(),
    };
    await (await col(COLLECTIONS.sessionNotes)).insertOne(note as any);
    if (firstCompletion) {
      await (await col<StudentDoc>(COLLECTIONS.students)).updateOne(
        { _id: apt.studentId },
        { $inc: { counselingSessionsCount: 1 }, $set: { lastSessionDate: apt.date }, $unset: { nextSessionDate: '' } }
      );
    }
    await notifyUser({
      recipientId: apt.studentId,
      title: 'Session summary available',
      description: `${apt.counselorName} shared notes and next steps from your ${apt.date} session.`,
      category: 'Mentorship',
      actionTab: 'sessions',
    });
    return strip(note);
  },
  async updateAppointmentStatus(v, p) {
    const apt = await getRelation(COLLECTIONS.appointments, p.id);
    assertOwnsRelation(v, apt.counselorId);
    const status = ['scheduled', 'completed', 'cancelled'].includes(p.status) ? p.status : null;
    if (!status) throw new HttpError(400, 'Unknown appointment status.');
    await (await col(COLLECTIONS.appointments)).updateOne({ _id: apt._id as any }, { $set: { status } });
    if (status === 'cancelled') {
      await (await col<StudentDoc>(COLLECTIONS.students)).updateOne({ _id: apt.studentId }, { $unset: { nextSessionDate: '' } });
      await notifyUser({ recipientId: apt.studentId, title: 'Session cancelled', description: `Your session on ${apt.date} at ${apt.time} was cancelled.`, category: 'Sessions', actionTab: 'sessions' });
    }
  },

  /** The counsellor or mentor pastes (or clears) the video link for one upcoming session. */
  async setAppointmentLink(v, p) {
    const apt = await getRelation(COLLECTIONS.appointments, p.id);
    assertOwnsRelation(v, apt.counselorId);
    if (apt.status !== 'scheduled') throw new HttpError(409, 'Only upcoming sessions can get a meeting link.');
    const meetingLink = meetingUrl(p.meetingLink);
    await (await col(COLLECTIONS.appointments)).updateOne({ _id: apt._id as any }, meetingLink ? { $set: { meetingLink } } : { $unset: { meetingLink: '' } });
    if (meetingLink && meetingLink !== apt.meetingLink) {
      await notifyUser({
        recipientId: apt.studentId,
        title: apt.meetingLink ? 'Meeting link updated' : 'Meeting link added',
        description: `${apt.counselorName} shared the link for your session on ${apt.date} at ${apt.time}.`,
        category: 'Sessions',
        actionTab: 'sessions',
        actionText: 'View session',
      });
    }
  },

  /* ---------- recommendations & tasks ---------- */
  async addRecommendation(v, p) {
    const provider = await providerIdentity(v, p.counselorId);
    const studentId = str(p.studentId, 100);
    if (!v.full && !(await isConnected(studentId, provider.id))) throw new HttpError(403, 'This student is not connected to you.');
    const doc = {
      _id: newId('rec'),
      studentId,
      counselorId: provider.id,
      counselorName: provider.name,
      category: str(p.category, 60) || 'Skills to Learn',
      title: str(p.title, 300),
      description: str(p.description, 3000),
      actionUrl: str(p.actionUrl, 1000) || undefined,
      createdAt: longDate(),
      status: 'recommended',
    };
    if (!doc.title) throw new HttpError(400, 'Give the recommendation a title.');
    await (await col(COLLECTIONS.recommendations)).insertOne(doc as any);
    await notifyUser({ recipientId: studentId, title: `New recommendation from ${provider.name}`, description: doc.title, category: 'Mentorship', actionTab: 'courses' });
    return strip(doc);
  },
  async updateRecommendationStatus(v, p) {
    const rec = await getRelation(COLLECTIONS.recommendations, p.id);
    const isStudent = v.kind === 'student' && v.profileId === rec.studentId;
    if (!isStudent) assertOwnsRelation(v, rec.counselorId);
    const status = ['recommended', 'in_progress', 'completed'].includes(p.status) ? p.status : 'recommended';
    await (await col(COLLECTIONS.recommendations)).updateOne({ _id: rec._id as any }, { $set: { status } });
  },
  async addFollowUpTask(v, p) {
    const provider = await providerIdentity(v, p.counselorId);
    const studentId = str(p.studentId, 100);
    if (!v.full && !(await isConnected(studentId, provider.id))) throw new HttpError(403, 'This student is not connected to you.');
    const doc = {
      _id: newId('task'),
      studentId,
      counselorId: provider.id,
      counselorName: provider.name,
      title: str(p.title, 300),
      description: str(p.description, 3000),
      dueDate: str(p.dueDate, 60),
      priority: ['low', 'medium', 'high'].includes(p.priority) ? p.priority : 'medium',
      status: 'pending',
      createdAt: longDate(),
    };
    if (!doc.title) throw new HttpError(400, 'Give the task a title.');
    await (await col(COLLECTIONS.followUpTasks)).insertOne(doc as any);
    await (await col<StudentDoc>(COLLECTIONS.students)).updateOne({ _id: studentId }, { $inc: { pendingTasksCount: 1 } });
    await notifyUser({ recipientId: studentId, title: `New task from ${provider.name}`, description: `${doc.title}${doc.dueDate ? ` · due ${doc.dueDate}` : ''}`, category: 'Mentorship', actionTab: 'tasks' });
    return strip(doc);
  },
  async updateTaskStatus(v, p) {
    const task = await getRelation(COLLECTIONS.followUpTasks, p.id);
    const isStudent = v.kind === 'student' && v.profileId === task.studentId;
    if (!isStudent) assertOwnsRelation(v, task.counselorId);
    const status = ['pending', 'in_progress', 'completed'].includes(p.status) ? p.status : null;
    if (!status) throw new HttpError(400, 'Unknown task status.');
    const set: Record<string, unknown> = { status };
    if (status === 'completed') set.completedAt = longDate();
    await (await col(COLLECTIONS.followUpTasks)).updateOne({ _id: task._id as any }, { $set: set });
    const students = await col<StudentDoc>(COLLECTIONS.students);
    if (task.status !== 'completed' && status === 'completed') {
      await students.updateOne({ _id: task.studentId }, { $inc: { pendingTasksCount: -1, completedTasksCount: 1 } });
    } else if (task.status === 'completed' && status !== 'completed') {
      await students.updateOne({ _id: task.studentId }, { $inc: { pendingTasksCount: 1, completedTasksCount: -1 } });
    }
    if (isStudent && status === 'completed') {
      await notifyUser({ recipientId: task.counselorId, title: 'Task completed by student', description: task.title, category: 'Mentorship' });
    }
  },

  /* ---------- messages ---------- */
  async sendMessage(v, p) {
    requireSignedIn(v);
    if (!v.profileId || v.kind === 'staff' || v.kind === 'anonymous') throw new HttpError(403, 'Messaging is available to students, counsellors and mentors.');
    const recipientId = str(p.recipientId, 100);
    const content = str(p.content, 5000);
    const attachment = p.attachment && typeof p.attachment === 'object' ? { fileId: str(p.attachment.fileId, 100), name: str(p.attachment.name, 200) } : undefined;
    if (!content && !attachment) throw new HttpError(400, 'Message is empty.');

    let studentId: string, providerId: string, senderName: string, recipientName: string;
    const students = await col<StudentDoc>(COLLECTIONS.students);
    if (v.kind === 'student') {
      const provider = await findProvider(recipientId);
      const me = await students.findOne({ _id: v.profileId });
      if (!provider || !me) throw new HttpError(404, 'Recipient not found.');
      studentId = v.profileId;
      providerId = recipientId;
      senderName = me.name;
      recipientName = provider.doc.name;
    } else {
      const provider = await findProvider(v.profileId);
      const student = await students.findOne({ _id: recipientId });
      if (!provider || !student) throw new HttpError(404, 'Recipient not found.');
      studentId = recipientId;
      providerId = v.profileId;
      senderName = provider.doc.name;
      recipientName = student.name;
    }
    if (!(await isConnected(studentId, providerId))) throw new HttpError(403, 'You can message counsellors you have booked or been assigned to.');

    if (attachment?.fileId) {
      const files = await col(COLLECTIONS.files);
      const file = await files.findOne({ _id: attachment.fileId as any });
      if (!file || file.ownerUserId !== v.user!._id) throw new HttpError(403, 'Attachment not found.');
      await files.updateOne({ _id: attachment.fileId as any }, { $addToSet: { allowedProfileIds: recipientId } });
    }

    const msg = {
      _id: newId('msg'),
      conversationId: `${studentId}_${providerId}`,
      senderId: v.profileId,
      senderName,
      senderRole: v.kind,
      recipientId,
      recipientName,
      content,
      attachment,
      timestamp: timeLabel(),
      createdAt: nowIso(),
      read: false,
    };
    await (await col(COLLECTIONS.messages)).insertOne(msg as any);
    return strip(msg);
  },
  async markConversationRead(v, p) {
    requireSignedIn(v);
    if (!v.profileId) return;
    await (await col(COLLECTIONS.messages)).updateMany({ conversationId: str(p.conversationId, 200), recipientId: v.profileId, read: false }, { $set: { read: true } });
  },
  async markNotificationsRead(v, p) {
    requireSignedIn(v);
    if (!v.profileId) return;
    const filter: Record<string, unknown> = { recipientId: v.profileId };
    if (Array.isArray(p.ids)) filter._id = { $in: strList(p.ids, 200, 100) };
    await (await col(COLLECTIONS.userNotifications)).updateMany(filter, { $set: { read: true } });
  },

  /* ---------- support ---------- */
  async createSupportTicket(v, p, req) {
    requireSignedIn(v);
    rateLimit(req, 'ticket', 10, 60 * 60_000);
    const subject = str(p.subject, 200);
    const message = str(p.message, 5000);
    if (!subject || !message) throw new HttpError(400, 'Add a subject and a message.');
    const ticket = {
      _id: newId('ticket'),
      userId: v.user!._id,
      profileId: v.profileId,
      name: v.user!.name,
      email: v.user!.email,
      subject,
      category: str(p.category, 100),
      priority: str(p.priority, 30) || 'Normal',
      message,
      status: 'open',
      createdAt: nowIso(),
    };
    await (await col(COLLECTIONS.supportTickets)).insertOne(ticket as any);
    await recordSubmission({
      form: 'support_request',
      name: ticket.name,
      email: ticket.email,
      subject,
      message,
      fields: { category: ticket.category, priority: ticket.priority, sentFrom: v.user!.role === 'student' ? 'Student portal' : 'Counsellor / mentor portal' },
      studentId: v.user!.role === 'student' ? v.profileId : undefined,
      notify: { priority: /high|urgent/i.test(ticket.priority) ? 'high' : 'normal' },
    });
    return { id: ticket._id };
  },

  /* ---------- demo data ---------- */
  async loadDemoData(v) {
    requireAdminViewer(v);
    const { loadDemoData } = await import('./demo');
    return loadDemoData(actorOf(v));
  },
  async clearDemoData(v) {
    requireAdminViewer(v);
    const { clearDemoData } = await import('./demo');
    return clearDemoData(actorOf(v));
  },
};

export async function runAction(user: UserDoc | null, action: string, payload: Record<string, any>, req: NextRequest) {
  const fn = Object.prototype.hasOwnProperty.call(ACTIONS, action) ? ACTIONS[action] : undefined;
  if (!fn) throw new HttpError(400, `Unknown action "${action}".`);
  return fn(viewerOf(user), payload || {}, req);
}
