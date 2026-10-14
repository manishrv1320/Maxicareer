import type { NextRequest } from 'next/server';
import { getDb, col, COLLECTIONS, newId, nowIso, longDate } from './db';
import { HttpError, rateLimit } from './auth';
import { str } from './http';
import { StudentDoc, programEndOf } from './students';
import { notifyAdmins, notifyUser } from './notify';
import { Viewer, strip, requireSignedIn, findProvider, findProviderByName, isConnected, assertOwnsRelation, isProvider } from './viewer';

/**
 * Portal features added on top of counselling: assignments, calendar notes, invoices and
 * renewals, tests, feedback, events, curriculum, resources, work hours and expense claims.
 * Admins manage the shared lists (events, tests, curriculum…) through /api/admin/data;
 * students, counsellors and mentors act through the server actions below.
 */

const C = COLLECTIONS;

export const isIsoDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const todayIso = () => new Date().toISOString().slice(0, 10);
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);
const money = (v: unknown) => Math.round(Math.max(0, Number(v) || 0) * 100) / 100;
const httpUrl = (v: unknown) => {
  const s = str(v, 1000);
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

/** "₹1,499" or "From ₹999" -> 1499 / 999. */
export function parsePrice(v: unknown): number {
  if (typeof v === 'number') return money(v);
  const m = /(\d[\d,]*)(\.\d+)?/.exec(String(v || ''));
  return m ? money(Number(m[1].replace(/,/g, '') + (m[2] || ''))) : 0;
}

export const invoiceNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `MC-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

/** Same defaults the admin Services page seeds, used until an admin has opened it. */
const DEFAULT_SERVICES = [
  { _id: 'svc-1', name: 'Career Discovery & Guidance', category: 'Career guidance', description: 'Strengths assessment, career options, and a personalised action plan.', price: '₹1,499', duration: '2 sessions', status: 'Active' },
  { _id: 'svc-2', name: 'Skills & Portfolio Accelerator', category: 'Skill development', description: 'Practical skills, guided projects, and portfolio feedback.', price: '₹4,999', duration: '6 weeks', status: 'Active' },
  { _id: 'svc-3', name: '1:1 Mentor Coaching', category: 'Mentorship', description: 'Focused mentor sessions with goals, feedback, and accountability.', price: '₹999', duration: '60 minutes', status: 'Active' },
];

export const DEFAULT_RENEWAL_OPTIONS = [
  { id: 'renew-6', label: '6 months', months: 6, percent: 50 },
  { id: 'renew-12', label: '12 months', months: 12, percent: 90 },
];

export const DEFAULT_PAYMENT_INSTRUCTIONS =
  'Pay by UPI or bank transfer using the details our team shares on WhatsApp or email. After paying, click "I have paid" on the invoice and enter the transaction reference so we can confirm it.';

interface RenewalOption {
  id: string;
  label: string;
  months: number;
  percent: number;
}

async function readSettingValue<T>(key: string, fallback: T): Promise<T> {
  const doc = await (await col(C.settings)).findOne({ _id: key as any });
  return doc && doc.value !== undefined && doc.value !== null ? (doc.value as T) : fallback;
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

const EMPTY = {
  assignments: [] as any[],
  calendarNotes: [] as any[],
  invoices: [] as any[],
  payouts: [] as any[],
  expenses: [] as any[],
  workLogs: [] as any[],
  feedback: [] as any[],
  events: [] as any[],
  tests: [] as any[],
  certificates: [] as any[],
  curricula: [] as any[],
  resources: [] as any[],
  services: [] as any[],
  adminMeetings: [] as any[],
  renewalOptions: [] as RenewalOption[],
  paymentInstructions: '',
};

export type PortalState = typeof EMPTY;

/** The portal records the viewer may see. `studentDocs` are the students already visible to them. */
export async function buildPortalState(v: Viewer, studentDocs: StudentDoc[]): Promise<PortalState> {
  if (!v.user || !v.profileId) return EMPTY;
  const db = await getDb();
  const self = v.profileId;
  const recentDay = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
  const all = (name: string, filter: Record<string, unknown>, sort: Record<string, 1 | -1> = { createdAt: -1 }, limit = 500) =>
    db.collection(name).find(filter as any).sort(sort).limit(limit).toArray();
  const out = (docs: any[]) => docs.map((d) => strip(d));

  if (v.kind === 'student') {
    const me = studentDocs.find((s) => s._id === self);
    const cohorts = ['all', me?.profession || 'college'];
    const [assignments, notes, invoices, feedback, events, tests, certificates, curricula, resources, services, servicesInit, meetings, renewalOptions, paymentInstructions] =
      await Promise.all([
        all(C.assignments, { studentId: self }, { submittedAt: -1 }),
        all(C.calendarNotes, { ownerId: self }, { date: 1 }),
        all(C.invoices, { studentId: self }, { issuedAt: -1 }),
        all(C.feedback, { fromId: self }),
        all(C.events, { status: 'Published', date: { $gte: recentDay }, audience: { $in: ['everyone', 'students', me?.profession || 'college'] } }, { date: 1 }),
        all(C.tests, { status: 'Published', cohort: { $in: cohorts } }),
        all(C.certificates, { studentId: self }, { issuedOn: -1 }),
        all(C.curricula, { status: 'Published', $or: [{ scope: 'cohort', cohort: { $in: cohorts } }, { scope: 'student', studentId: self }] }, { order: 1 }),
        all(C.resources, { status: 'Published', $or: [{ scope: 'cohort', cohort: { $in: cohorts } }, { scope: 'student', studentId: self }] }),
        all(C.services, { status: 'Active' }, { _order: 1 }),
        db.collection(C.settings).findOne({ _id: 'init:services' as any }),
        all(C.mentoringSessions, { studentId: self }, { date: -1 }, 100),
        readSettingValue<RenewalOption[]>('renewal_options', DEFAULT_RENEWAL_OPTIONS),
        readSettingValue<string>('payment_instructions', DEFAULT_PAYMENT_INSTRUCTIONS),
      ]);
    return {
      ...EMPTY,
      assignments: out(assignments),
      calendarNotes: out(notes),
      invoices: out(invoices),
      feedback: out(feedback),
      events: out(events),
      // Students never receive the answer key.
      tests: tests.map((t: any) => ({ ...strip(t), questions: (t.questions || []).map(({ answer, ...q }: any) => q) })),
      certificates: out(certificates),
      curricula: out(curricula),
      resources: out(resources),
      services: (services.length || servicesInit ? services : DEFAULT_SERVICES).map((s: any) => strip(s, ['_order'])),
      adminMeetings: out(meetings),
      renewalOptions,
      paymentInstructions,
    };
  }

  if (isProvider(v)) {
    const [assignments, notes, payouts, expenses, workLogs, feedback, events, curricula, resources] = await Promise.all([
      all(C.assignments, { counselorId: self }, { submittedAt: -1 }),
      all(C.calendarNotes, { ownerId: self }, { date: 1 }),
      all(C.payouts, { providerId: self }),
      all(C.expenses, { providerId: self }, { date: -1 }),
      all(C.workLogs, { providerId: self }, { date: -1 }, 1000),
      all(C.feedback, { targetId: self }),
      all(C.events, { status: 'Published', date: { $gte: recentDay }, audience: { $in: ['everyone', 'staff'] } }, { date: 1 }),
      all(C.curricula, { $or: [{ createdBy: self }, { scope: 'cohort', status: 'Published' }] }, { order: 1 }),
      all(C.resources, { $or: [{ sharedBy: self }, { scope: 'cohort', status: 'Published' }] }),
    ]);
    return {
      ...EMPTY,
      assignments: out(assignments),
      calendarNotes: out(notes),
      payouts: out(payouts),
      expenses: out(expenses),
      workLogs: out(workLogs),
      feedback: out(feedback),
      events: out(events),
      curricula: out(curricula),
      resources: out(resources),
    };
  }

  return EMPTY;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type ActionFn = (v: Viewer, p: Record<string, any>, req: NextRequest) => Promise<unknown>;

function requireStudent(v: Viewer) {
  if (v.kind !== 'student' || !v.profileId) throw new HttpError(403, 'Only students can do that.');
  return v.profileId;
}

function requireProvider(v: Viewer) {
  if (!isProvider(v)) throw new HttpError(403, 'Only counsellors and mentors can do that.');
  return v.profileId!;
}

async function loadStudent(id: string) {
  const s = await (await col<StudentDoc>(C.students)).findOne({ _id: id });
  if (!s) throw new HttpError(404, 'Student profile not found.');
  return s;
}

/** The uploaded file must belong to the caller. */
async function ownFile(v: Viewer, fileId: string) {
  const file = await (await col(C.files)).findOne({ _id: fileId as any });
  if (!file || file.ownerUserId !== v.user?._id) throw new HttpError(403, 'Upload the file again and retry.');
  return file;
}

async function shareFile(fileId: string, profileIds: string[]) {
  if (!fileId || !profileIds.length) return;
  await (await col(C.files)).updateOne({ _id: fileId as any }, { $addToSet: { allowedProfileIds: { $each: profileIds } } });
}

async function getOwned(name: string, id: unknown, ownerField: string, ownerId: string) {
  const doc = await (await col(name)).findOne({ _id: str(id, 100) as any });
  if (!doc) throw new HttpError(404, 'That record no longer exists.');
  if (doc[ownerField] !== ownerId) throw new HttpError(403, 'You can only change your own records.');
  return doc;
}

async function providerName(id: string) {
  const p = await findProvider(id);
  if (!p) throw new HttpError(404, 'Your workspace profile was not found.');
  return p.doc.name;
}

/** Student ids an admin assigned to this provider plus everyone they have worked with. */
async function assertConnected(studentId: string, providerId: string) {
  if (!studentId || !(await isConnected(studentId, providerId))) throw new HttpError(403, 'This student is not connected to you.');
}

function newInvoice(student: StudentDoc, kind: 'Service' | 'Renewal' | 'Enrolment' | 'Other', lines: { description: string; amount: number }[], extra: Record<string, unknown> = {}) {
  const due = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  return {
    _id: newId('inv'),
    number: invoiceNumber(),
    studentId: student._id,
    studentName: student.name,
    studentEmail: student.email,
    kind,
    lines,
    total: money(lines.reduce((a, l) => a + l.amount, 0)),
    status: 'Due',
    issuedAt: nowIso(),
    dueDate: due,
    ...extra,
  };
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export const PORTAL_ACTIONS: Record<string, ActionFn> = {
  /* ---------- assignments & projects ---------- */
  async submitAssignment(v, p) {
    const studentId = requireStudent(v);
    const me = await loadStudent(studentId);
    const title = str(p.title, 200);
    if (!title) throw new HttpError(400, 'Give your submission a title.');
    const description = str(p.description, 3000);
    const link = httpUrl(p.link);
    const fileId = str(p.fileId, 100);
    if (!fileId && !link && !description) throw new HttpError(400, 'Attach a file, add a link or describe your work.');

    let reviewer: { id: string; name: string } | null = null;
    const taskId = str(p.taskId, 100) || undefined;
    if (taskId) {
      const task = await (await col(C.followUpTasks)).findOne({ _id: taskId as any, studentId });
      if (!task) throw new HttpError(404, 'That task no longer exists.');
      reviewer = { id: task.counselorId, name: task.counselorName };
      if (task.status === 'pending') await (await col(C.followUpTasks)).updateOne({ _id: taskId as any }, { $set: { status: 'in_progress' } });
    } else if (p.counselorId) {
      const prov = await findProvider(str(p.counselorId, 100));
      if (!prov || !(await isConnected(studentId, prov.doc._id))) throw new HttpError(403, 'Choose your own mentor or counsellor.');
      reviewer = { id: prov.doc._id, name: prov.doc.name };
    } else {
      const prov = (await findProviderByName(me.mentorAssigned)) || (await findProviderByName(me.counselorAssigned));
      if (prov) reviewer = { id: prov.doc._id, name: prov.doc.name };
    }
    if (!reviewer) throw new HttpError(400, 'You can submit work once a mentor or counsellor is assigned to you.');

    let fileName: string | undefined;
    if (fileId) {
      const file = await ownFile(v, fileId);
      fileName = str(p.fileName, 200) || String(file.originalName || 'Submission');
      await shareFile(fileId, [reviewer.id]);
    }
    const doc = {
      _id: newId('asg'),
      studentId,
      studentName: me.name,
      counselorId: reviewer.id,
      counselorName: reviewer.name,
      taskId,
      kind: oneOf(p.kind, ['Assignment', 'Project'] as const, 'Assignment'),
      title,
      description,
      link: link || undefined,
      fileId: fileId || undefined,
      fileName,
      status: 'submitted',
      submittedAt: nowIso(),
    };
    await (await col(C.assignments)).insertOne(doc as any);
    await notifyUser({ recipientId: reviewer.id, title: `New ${doc.kind.toLowerCase()} from ${me.name}`, description: title, category: 'Mentorship', actionTab: 'assignments', actionText: 'Review' });
    return strip(doc);
  },
  async reviewAssignment(v, p) {
    const doc = await (await col(C.assignments)).findOne({ _id: str(p.id, 100) as any });
    if (!doc) throw new HttpError(404, 'That submission no longer exists.');
    assertOwnsRelation(v, doc.counselorId);
    const status = oneOf(p.status, ['reviewed', 'changes_requested'] as const, 'reviewed');
    const set = { status, grade: str(p.grade, 30), feedback: str(p.feedback, 3000), reviewedAt: nowIso() };
    await (await col(C.assignments)).updateOne({ _id: doc._id }, { $set: set });
    await notifyUser({
      recipientId: doc.studentId,
      title: status === 'reviewed' ? 'Your work was reviewed' : 'Changes requested on your work',
      description: `${doc.title}${set.grade ? ` · ${set.grade}` : ''}`,
      category: 'Mentorship',
      actionTab: 'tasks',
      actionText: 'See feedback',
    });
  },
  async deleteAssignment(v, p) {
    const studentId = requireStudent(v);
    const doc = await getOwned(C.assignments, p.id, 'studentId', studentId);
    if (doc.status !== 'submitted') throw new HttpError(409, 'Reviewed work can no longer be withdrawn.');
    await (await col(C.assignments)).deleteOne({ _id: doc._id });
  },

  /* ---------- calendar notes, reminders, targets and personal to-dos ---------- */
  async saveCalendarNote(v, p) {
    requireSignedIn(v);
    if (!v.profileId || v.kind === 'staff') throw new HttpError(403, 'Notes are available in the student, counsellor and mentor portals.');
    const date = str(p.date, 10);
    if (!isIsoDay(date)) throw new HttpError(400, 'Pick a date.');
    const title = str(p.title, 200);
    if (!title) throw new HttpError(400, 'Give the note a title.');
    const time = str(p.time, 5);
    const fields = {
      date,
      time: isTime(time) ? time : '',
      title,
      note: str(p.note, 2000),
      kind: oneOf(p.kind, ['note', 'reminder', 'target', 'task'] as const, 'note'),
      done: Boolean(p.done),
      updatedAt: nowIso(),
    };
    const notes = await col(C.calendarNotes);
    if (p.id) {
      const doc = await getOwned(C.calendarNotes, p.id, 'ownerId', v.profileId);
      await notes.updateOne({ _id: doc._id }, { $set: fields });
      return strip({ ...doc, ...fields } as any);
    }
    const count = await notes.countDocuments({ ownerId: v.profileId });
    if (count >= 1000) throw new HttpError(409, 'You have reached the limit of 1,000 notes. Delete a few old ones first.');
    const doc = { _id: newId('note'), ownerId: v.profileId, ...fields, createdAt: nowIso() };
    await notes.insertOne(doc as any);
    return strip(doc);
  },
  async deleteCalendarNote(v, p) {
    requireSignedIn(v);
    const doc = await getOwned(C.calendarNotes, p.id, 'ownerId', v.profileId || '');
    await (await col(C.calendarNotes)).deleteOne({ _id: doc._id });
  },

  /* ---------- services, invoices and renewal ---------- */
  async purchaseService(v, p) {
    const studentId = requireStudent(v);
    const me = await loadStudent(studentId);
    const serviceId = str(p.serviceId, 100);
    const db = await getDb();
    const [stored, init] = await Promise.all([db.collection(C.services).findOne({ _id: serviceId as any }), db.collection(C.settings).findOne({ _id: 'init:services' as any })]);
    const service = stored || (!init ? DEFAULT_SERVICES.find((s) => s._id === serviceId) : null);
    if (!service || service.status !== 'Active') throw new HttpError(404, 'That service is no longer offered.');
    const price = parsePrice(service.price);
    if (!price) throw new HttpError(400, 'This service is priced on request. Please message support and we will send you a quote.');

    const invoices = db.collection(C.invoices);
    const open = await invoices.findOne({ studentId, serviceId, status: { $in: ['Due', 'Verifying'] } });
    if (open) return strip(open as any);
    const inv = newInvoice(me, 'Service', [{ description: `${service.name}${service.duration ? ` (${service.duration})` : ''}`, amount: price }], { serviceId, serviceName: service.name });
    await invoices.insertOne(inv as any);
    await notifyAdmins({ title: `Service ordered: ${me.name}`, body: `${service.name} · ₹${price.toLocaleString('en-IN')} · invoice ${inv.number}`, category: 'students', link: 'payments' });
    return strip(inv);
  },
  async requestRenewal(v, p) {
    const studentId = requireStudent(v);
    const me = await loadStudent(studentId);
    const options = await readSettingValue<RenewalOption[]>('renewal_options', DEFAULT_RENEWAL_OPTIONS);
    const option = options.find((o) => o.id === str(p.optionId, 60));
    if (!option) throw new HttpError(400, 'Choose a renewal period.');
    const amount = Math.round(((me.planPrice || 0) * (Number(option.percent) || 0)) / 100);
    if (!amount) throw new HttpError(400, 'We could not price a renewal for your plan. Please message support.');
    const invoices = await col(C.invoices);
    const open = await invoices.findOne({ studentId, kind: 'Renewal', status: { $in: ['Due', 'Verifying'] } });
    if (open) throw new HttpError(409, `You already have an open renewal invoice (${open.number}). Pay or cancel it first.`);
    const inv = newInvoice(me, 'Renewal', [{ description: `${me.planName} renewal, ${option.label}`, amount }], { renewalMonths: Math.max(1, Math.min(36, Number(option.months) || 12)) });
    await invoices.insertOne(inv as any);
    await notifyAdmins({ title: `Renewal requested: ${me.name}`, body: `${me.planName} · ${option.label} · ₹${amount.toLocaleString('en-IN')}`, category: 'students', priority: 'high', link: 'payments' });
    return strip(inv);
  },
  async reportPayment(v, p) {
    const studentId = requireStudent(v);
    const inv = await getOwned(C.invoices, p.invoiceId, 'studentId', studentId);
    if (inv.status !== 'Due') throw new HttpError(409, 'This invoice is not awaiting payment.');
    const reference = str(p.reference, 120);
    if (!reference) throw new HttpError(400, 'Enter the transaction reference from your payment.');
    await (await col(C.invoices)).updateOne(
      { _id: inv._id },
      { $set: { status: 'Verifying', paymentReference: reference, paymentMethod: str(p.method, 60) || 'UPI / bank transfer', reportedAt: nowIso() } }
    );
    await notifyAdmins({ title: `Payment to verify: ${inv.studentName}`, body: `${inv.number} · ₹${Number(inv.total).toLocaleString('en-IN')} · ref ${reference}`, category: 'students', priority: 'high', link: 'payments' });
  },
  async cancelInvoice(v, p) {
    const studentId = requireStudent(v);
    const inv = await getOwned(C.invoices, p.invoiceId, 'studentId', studentId);
    if (inv.status !== 'Due' || (inv.kind !== 'Service' && inv.kind !== 'Renewal')) throw new HttpError(409, 'Only unpaid service and renewal orders can be cancelled.');
    await (await col(C.invoices)).updateOne({ _id: inv._id }, { $set: { status: 'Cancelled', cancelledAt: nowIso() } });
  },

  /* ---------- tests ---------- */
  async submitTest(v, p) {
    const studentId = requireStudent(v);
    const me = await loadStudent(studentId);
    const test = await (await col(C.tests)).findOne({ _id: str(p.testId, 100) as any, status: 'Published' });
    if (!test || !(test.cohort === 'all' || test.cohort === me.profession)) throw new HttpError(404, 'That test is not available.');
    const results = await col(C.assessments);
    const attempts = await results.countDocuments({ studentId, testId: test._id });
    const allowed = Math.max(1, Number(test.attemptsAllowed) || 1);
    if (attempts >= allowed) throw new HttpError(409, `You have used all ${allowed} attempt${allowed > 1 ? 's' : ''} for this test.`);
    const questions: any[] = Array.isArray(test.questions) ? test.questions : [];
    if (!questions.length) throw new HttpError(409, 'This test has no questions yet.');
    const answers: unknown[] = Array.isArray(p.answers) ? p.answers : [];
    const correct = questions.filter((q, i) => Number.isInteger(q.answer) && answers[i] === q.answer).length;
    const scorePercent = Math.round((correct / questions.length) * 100);
    const passed = scorePercent >= (Number(test.passPercent) || 0);
    const doc = {
      _id: newId('res'),
      studentId,
      studentName: me.name,
      testId: test._id,
      kind: test.kind,
      assessmentName: test.title,
      completionDate: longDate(),
      submittedAt: nowIso(),
      scorePercent,
      correct,
      total: questions.length,
      passed,
      attempt: attempts + 1,
      strengths: [],
      interestAreas: [],
      careerAreasSuggested: [],
      status: 'completed',
    };
    await results.insertOne(doc as any);
    await (await col<StudentDoc>(C.students)).updateOne({ _id: studentId }, { $set: { assessmentStatus: 'completed', updatedAt: nowIso() } });
    for (const name of new Set([me.mentorAssigned, me.counselorAssigned])) {
      const prov = await findProviderByName(name);
      if (prov) await notifyUser({ recipientId: prov.doc._id, title: `${me.name} completed a test`, description: `${test.title}: ${scorePercent}% (${passed ? 'passed' : 'below the pass mark'})`, category: 'Courses' });
    }
    return { scorePercent, correct, total: questions.length, passed };
  },

  /* ---------- feedback ---------- */
  async submitFeedback(v, p, req) {
    requireSignedIn(v);
    if (!v.profileId || (v.kind !== 'student' && v.kind !== 'counselor' && v.kind !== 'mentor')) throw new HttpError(403, 'Feedback is sent from the student, counsellor or mentor portal.');
    rateLimit(req, `feedback:${v.profileId}`, 20, 60 * 60_000);
    const rating = Math.round(Number(p.rating));
    if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Choose a rating from 1 to 5.');
    const comment = str(p.comment, 2000);
    const about = oneOf(p.about, ['Session', 'Mentor', 'Counsellor', 'Course', 'Platform'] as const, 'Platform');
    let target: { id: string; name: string } | null = null;
    if (p.targetId) {
      const prov = await findProvider(str(p.targetId, 100));
      if (!prov) throw new HttpError(404, 'That mentor or counsellor was not found.');
      if (v.kind === 'student' && !(await isConnected(v.profileId, prov.doc._id))) throw new HttpError(403, 'You can rate mentors and counsellors you have worked with.');
      target = { id: prov.doc._id, name: prov.doc.name };
    }
    const fromName = v.kind === 'student' ? (await loadStudent(v.profileId)).name : await providerName(v.profileId);
    const doc = {
      _id: newId('fb'),
      fromId: v.profileId,
      fromName,
      fromRole: v.kind,
      about,
      targetId: target?.id,
      targetName: target?.name,
      appointmentId: str(p.appointmentId, 100) || undefined,
      rating,
      comment,
      createdAt: nowIso(),
    };
    await (await col(C.feedback)).insertOne(doc as any);
    await notifyAdmins({ title: `New feedback: ${rating}/5 (${about.toLowerCase()})`, body: `${fromName}${target ? ` about ${target.name}` : ''}${comment ? ` · ${comment.slice(0, 200)}` : ''}`, category: 'system', priority: rating <= 2 ? 'high' : 'normal', link: 'feedback' });
    if (target) await notifyUser({ recipientId: target.id, title: `New ${rating}/5 feedback`, description: comment ? comment.slice(0, 200) : `${fromName} rated a ${about.toLowerCase()}.`, category: 'System', actionTab: 'reports' });
    return strip(doc);
  },

  /* ---------- meetings with the admin team ---------- */
  async requestAdminMeeting(v, p) {
    const studentId = requireStudent(v);
    const me = await loadStudent(studentId);
    const date = str(p.date, 10);
    const time = str(p.time, 5);
    const topic = str(p.topic, 200);
    if (!isIsoDay(date) || date < todayIso()) throw new HttpError(400, 'Pick a date from today onwards.');
    if (!isTime(time)) throw new HttpError(400, 'Pick a time.');
    if (!topic) throw new HttpError(400, 'Tell us what the meeting is about.');
    const mode = oneOf(p.mode, ['Video call', 'Phone', 'In person'] as const, 'Video call');
    const _id = newId('sess');
    const doc = {
      _id,
      date,
      time,
      studentId,
      studentName: me.name,
      topic,
      notes: str(p.notes, 2000),
      mentor: 'Maxicareer admin team',
      mode,
      status: 'Upcoming',
      requestedByStudent: true,
      // The admin team pastes the video link when they confirm the meeting.
      createdAt: nowIso(),
    };
    await (await col(C.mentoringSessions)).insertOne(doc as any);
    await notifyAdmins({ title: `Meeting request: ${me.name}`, body: `${topic} · ${date} ${time} · ${mode}`, category: 'sessions', priority: 'high', link: 'sessions' });
    return strip(doc);
  },
  async cancelAdminMeeting(v, p) {
    const studentId = requireStudent(v);
    const doc = await getOwned(C.mentoringSessions, p.id, 'studentId', studentId);
    if (doc.status !== 'Upcoming') throw new HttpError(409, 'Only upcoming meetings can be cancelled.');
    await (await col(C.mentoringSessions)).updateOne({ _id: doc._id }, { $set: { status: 'Cancelled' } });
    await notifyAdmins({ title: `Meeting cancelled by ${doc.studentName}`, body: `${doc.topic} · ${doc.date} ${doc.time}`, category: 'sessions', link: 'sessions' });
  },

  /* ---------- counsellor / mentor: hours and expenses ---------- */
  async logWork(v, p) {
    const providerId = requireProvider(v);
    const date = str(p.date, 10);
    if (!isIsoDay(date) || date > todayIso()) throw new HttpError(400, 'Pick a date up to today.');
    const hours = Math.round((Number(p.hours) || 0) * 4) / 4;
    if (!(hours >= 0.25 && hours <= 16)) throw new HttpError(400, 'Hours must be between 0.25 and 16.');
    const studentId = str(p.studentId, 100);
    let studentName: string | undefined;
    if (studentId) {
      await assertConnected(studentId, providerId);
      studentName = (await loadStudent(studentId)).name;
    }
    const doc = {
      _id: newId('work'),
      providerId,
      providerName: await providerName(providerId),
      date,
      hours,
      activity: str(p.activity, 80) || 'Mentoring',
      studentId: studentId || undefined,
      studentName,
      notes: str(p.notes, 1000),
      createdAt: nowIso(),
    };
    await (await col(C.workLogs)).insertOne(doc as any);
    return strip(doc);
  },
  async deleteWorkLog(v, p) {
    const providerId = requireProvider(v);
    const doc = await getOwned(C.workLogs, p.id, 'providerId', providerId);
    await (await col(C.workLogs)).deleteOne({ _id: doc._id });
  },
  async submitExpense(v, p) {
    const providerId = requireProvider(v);
    const date = str(p.date, 10);
    if (!isIsoDay(date) || date > todayIso()) throw new HttpError(400, 'Pick the date you spent the money (up to today).');
    const amount = money(p.amount);
    if (!(amount > 0 && amount <= 1_000_000)) throw new HttpError(400, 'Enter an amount between ₹1 and ₹10,00,000.');
    const description = str(p.description, 1000);
    if (!description) throw new HttpError(400, 'Describe what the expense was for.');
    const receiptFileId = str(p.receiptFileId, 100);
    let receiptFileName: string | undefined;
    if (receiptFileId) receiptFileName = str(p.receiptFileName, 200) || String((await ownFile(v, receiptFileId)).originalName || 'Receipt');
    const name = await providerName(providerId);
    const doc = {
      _id: newId('exp'),
      source: 'provider',
      providerId,
      providerName: name,
      date,
      category: str(p.category, 60) || 'Other',
      amount,
      description,
      vendor: str(p.vendor, 120) || undefined,
      receiptFileId: receiptFileId || undefined,
      receiptFileName,
      status: 'Submitted',
      createdAt: nowIso(),
    };
    await (await col(C.expenses)).insertOne(doc as any);
    await notifyAdmins({ title: `Expense claim: ${name}`, body: `₹${amount.toLocaleString('en-IN')} · ${doc.category} · ${description.slice(0, 120)}`, category: 'system', link: 'expenditure' });
    return strip(doc);
  },
  async deleteExpense(v, p) {
    const providerId = requireProvider(v);
    const doc = await getOwned(C.expenses, p.id, 'providerId', providerId);
    if (doc.status !== 'Submitted') throw new HttpError(409, 'Claims that were already reviewed cannot be withdrawn.');
    await (await col(C.expenses)).deleteOne({ _id: doc._id });
  },

  /* ---------- counsellor / mentor: modules and resources for one student ---------- */
  async assignCurriculumModule(v, p) {
    const providerId = requireProvider(v);
    const studentId = str(p.studentId, 100);
    await assertConnected(studentId, providerId);
    const student = await loadStudent(studentId);
    const title = str(p.title, 200);
    if (!title) throw new HttpError(400, 'Give the module a title.');
    const lessons = (Array.isArray(p.lessons) ? p.lessons : [])
      .slice(0, 30)
      .map((l: any) => ({ id: newId('lesson'), title: str(l?.title, 200), duration: str(l?.duration, 40), type: str(l?.type, 40) || 'Lesson', url: httpUrl(l?.url) || undefined }))
      .filter((l: any) => l.title);
    if (!lessons.length) throw new HttpError(400, 'Add at least one lesson.');
    const doc = {
      _id: newId('mod'),
      scope: 'student',
      cohort: 'all',
      studentId,
      studentName: student.name,
      title,
      description: str(p.description, 2000),
      weeks: str(p.weeks, 40) || undefined,
      order: Date.now(),
      lessons,
      status: 'Published',
      createdBy: providerId,
      createdByName: await providerName(providerId),
      createdAt: nowIso(),
    };
    await (await col(C.curricula)).insertOne(doc as any);
    await notifyUser({ recipientId: studentId, title: `New module from ${doc.createdByName}`, description: title, category: 'Courses', actionTab: 'curriculum', actionText: 'Open module' });
    return strip(doc);
  },
  async deleteCurriculumModule(v, p) {
    const providerId = requireProvider(v);
    const doc = await getOwned(C.curricula, p.id, 'createdBy', providerId);
    await (await col(C.curricula)).deleteOne({ _id: doc._id });
  },
  async shareResource(v, p) {
    const providerId = requireProvider(v);
    const studentId = str(p.studentId, 100);
    await assertConnected(studentId, providerId);
    const title = str(p.title, 200);
    if (!title) throw new HttpError(400, 'Give the resource a title.');
    const url = httpUrl(p.url);
    const fileId = str(p.fileId, 100);
    if (!url && !fileId) throw new HttpError(400, 'Add a link or upload a file.');
    let fileName: string | undefined;
    if (fileId) {
      fileName = str(p.fileName, 200) || String((await ownFile(v, fileId)).originalName || 'File');
      await shareFile(fileId, [studentId]);
    }
    const doc = {
      _id: newId('res'),
      scope: 'student',
      cohort: 'all',
      studentId,
      title,
      description: str(p.description, 1000),
      kind: oneOf(p.kind, ['Guide', 'Template', 'Video', 'Link', 'Worksheet'] as const, 'Guide'),
      url: url || undefined,
      fileId: fileId || undefined,
      fileName,
      sharedBy: providerId,
      sharedByName: await providerName(providerId),
      status: 'Published',
      createdAt: nowIso(),
    };
    await (await col(C.resources)).insertOne(doc as any);
    await notifyUser({ recipientId: studentId, title: `${doc.sharedByName} shared a resource`, description: title, category: 'Courses', actionTab: 'resources', actionText: 'Open' });
    return strip(doc);
  },
  async deleteResource(v, p) {
    const providerId = requireProvider(v);
    const doc = await getOwned(C.resources, p.id, 'sharedBy', providerId);
    await (await col(C.resources)).deleteOne({ _id: doc._id });
  },
};

/** Shared with adminData: invoice bookkeeping when an admin marks one paid. */
export async function applyPaidInvoice(inv: Record<string, any>) {
  const students = await col<StudentDoc>(C.students);
  const student = await students.findOne({ _id: inv.studentId });
  if (!student) return;
  if (inv.kind === 'Renewal' && inv.renewalMonths) {
    // Extend from today or from the current end date, whichever is later.
    const current = programEndOf(student);
    const base = new Date(Math.max(Date.now(), current ? Date.parse(current) : 0));
    base.setMonth(base.getMonth() + Number(inv.renewalMonths));
    const programEndsAt = base.toISOString().slice(0, 10);
    await students.updateOne({ _id: student._id }, { $set: { programEndsAt, updatedAt: nowIso() } });
    await notifyUser({ recipientId: student._id, title: 'Program renewed', description: `Your access now runs until ${new Date(programEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`, category: 'System', actionTab: 'renewal' });
    return;
  }
  if (inv.kind === 'Service' && inv.serviceName) {
    await students.updateOne({ _id: student._id }, { $addToSet: { selectedAddOns: String(inv.serviceName) }, $set: { updatedAt: nowIso() } });
  }
  await notifyUser({ recipientId: student._id, title: 'Payment received', description: `Invoice ${inv.number} is paid. Thank you!`, category: 'System', actionTab: 'invoices', actionText: 'View invoice' });
}
