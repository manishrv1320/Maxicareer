import type { Sort, AnyBulkWriteOperation } from 'mongodb';
import { getDb, COLLECTIONS, newId, nowIso } from './db';
import { HttpError, UserDoc, isAdmin, canEditWebsite, canSeeStudentData, hashPassword, destroyAllSessionsFor, normaliseEmail, isValidEmail, type StaffRole } from './auth';
import { setProviderApproval, deliverBroadcast } from './platform';
import { applyPaidInvoice } from './portal';
import { notifyUser } from './notify';
import { assertProviderNameFree } from './viewer';
import { str, meetingUrl } from './http';

/**
 * Admin-portal collections, stored one document per item. The browser sends only the
 * items it added, changed or removed, so two admins working at once don't overwrite each other.
 */
interface CollectionConfig {
  name: string;
  sort: Sort;
  limit?: number;
  /** Keep the order items were arranged in (stored as `_order`). */
  ordered?: boolean;
  /**
   * Who may read. Others get an empty list (not an error) so their pages still load.
   * Default: every staff member.
   */
  read?: (u: UserDoc) => boolean;
  /** Who may write. Default: whoever may read. */
  write?: (u: UserDoc) => boolean;
}

export const ADMIN_COLLECTIONS: Record<string, CollectionConfig> = {
  notifications: { name: COLLECTIONS.adminNotifications, sort: { createdAt: -1 }, limit: 300 },
  // Contact details people typed into forms, the audit trail and staff accounts: admins only.
  submissions: { name: COLLECTIONS.formSubmissions, sort: { createdAt: -1 }, limit: 3000, read: isAdmin },
  audit: { name: COLLECTIONS.auditLogs, sort: { at: -1 }, limit: 5000, read: isAdmin },
  applications: { name: COLLECTIONS.applications, sort: { updatedAt: -1 }, read: canSeeStudentData },
  templates: { name: COLLECTIONS.roadmapTemplates, sort: { _order: 1 }, ordered: true },
  roadmaps: { name: COLLECTIONS.studentRoadmaps, sort: { updatedAt: -1 }, read: canSeeStudentData },
  // Approving a sign-up unlocks a login, so only admins can.
  approvals: { name: COLLECTIONS.approvals, sort: { createdAt: -1 }, read: isAdmin },
  sessions: { name: COLLECTIONS.mentoringSessions, sort: { date: 1, time: 1 }, read: canSeeStudentData },
  users: { name: COLLECTIONS.managedUsers, sort: { createdAt: -1 }, read: isAdmin },
  services: { name: COLLECTIONS.services, sort: { _order: 1 }, ordered: true },
  broadcasts: { name: COLLECTIONS.broadcasts, sort: { createdAt: -1 } },
  // Finance
  invoices: { name: COLLECTIONS.invoices, sort: { issuedAt: -1 }, read: isAdmin },
  payouts: { name: COLLECTIONS.payouts, sort: { createdAt: -1 }, read: isAdmin },
  expenses: { name: COLLECTIONS.expenses, sort: { date: -1 }, read: isAdmin },
  worklogs: { name: COLLECTIONS.workLogs, sort: { date: -1 }, limit: 3000, read: isAdmin, write: () => false },
  // Learning
  curricula: { name: COLLECTIONS.curricula, sort: { order: 1 } },
  resources: { name: COLLECTIONS.resources, sort: { createdAt: -1 } },
  tests: { name: COLLECTIONS.tests, sort: { createdAt: -1 }, write: isAdmin },
  results: { name: COLLECTIONS.assessments, sort: { submittedAt: -1 }, read: canSeeStudentData, write: isAdmin },
  certificates: { name: COLLECTIONS.certificates, sort: { issuedOn: -1 }, read: canSeeStudentData, write: isAdmin },
  // Operations & website
  events: { name: COLLECTIONS.events, sort: { date: 1 } },
  feedback: { name: COLLECTIONS.feedback, sort: { createdAt: -1 }, read: canSeeStudentData, write: isAdmin },
  careers: { name: COLLECTIONS.careers, sort: { updatedAt: -1 }, write: canEditWebsite },
};

/** Single-value settings shared by every admin. */
export const ADMIN_SETTINGS: Record<string, { write?: (u: UserDoc) => boolean; public?: boolean }> = {
  notification_prefs: {},
  notifications_seen: {},
  audit_retention: { write: isAdmin },
  role_pages: { write: isAdmin },
  website_draft: { write: canEditWebsite },
  website_published: { write: canEditWebsite, public: true },
  website_published_at: { write: canEditWebsite },
  renewal_options: { write: isAdmin },
  payment_instructions: { write: isAdmin },
};

export function getConfig(key: string) {
  const cfg = Object.prototype.hasOwnProperty.call(ADMIN_COLLECTIONS, key) ? ADMIN_COLLECTIONS[key] : undefined;
  if (!cfg) throw new HttpError(404, `Unknown collection "${key}".`);
  return cfg;
}

const canRead = (cfg: CollectionConfig, user: UserDoc) => (cfg.read ? cfg.read(user) : true);
const canWrite = (cfg: CollectionConfig, user: UserDoc) => (cfg.write ? cfg.write(user) : canRead(cfg, user));

export async function listCollection(key: string, user: UserDoc) {
  const cfg = getConfig(key);
  if (!canRead(cfg, user)) return { items: [], initialized: true };
  const db = await getDb();
  const [docs, init] = await Promise.all([
    db.collection(cfg.name).find({}).sort(cfg.sort).limit(cfg.limit || 5000).toArray(),
    db.collection(COLLECTIONS.settings).findOne({ _id: `init:${key}` as any }),
  ]);
  const items = docs.map(({ _id, _order, tempPassword, ...rest }: any) => ({ ...rest, id: String(_id) }));
  return { items, initialized: Boolean(init) || docs.length > 0 };
}

type Item = Record<string, any> & { id: string };

export async function applyChanges(key: string, user: UserDoc, upserts: Item[], deletes: string[]) {
  const cfg = getConfig(key);
  if (!canWrite(cfg, user)) throw new HttpError(403, 'You do not have permission to change this.');
  const db = await getDb();
  const collection = db.collection(cfg.name);

  const clean = upserts
    .filter((u) => u && typeof u === 'object' && typeof u.id === 'string' && u.id)
    .slice(0, 5000)
    .map(({ id, _id, ...rest }): Record<string, any> & { _id: string } => ({ _id: String(id).slice(0, 200), ...rest }));
  const existing = new Map(
    (await collection.find({ _id: { $in: clean.map((c) => c._id) as any[] } }).toArray()).map((d) => [String(d._id), d])
  );

  // Side effects that connect admin actions to the rest of the platform
  if (key === 'sessions') for (const doc of clean) if (doc.meetingLink) doc.meetingLink = meetingUrl(doc.meetingLink);
  if (key === 'users') for (const doc of clean) await syncStaffAccount(doc, existing.get(doc._id), user);
  if (key === 'approvals') {
    for (const doc of clean) {
      const prev = existing.get(doc._id);
      if ((doc.kind === 'counselor' || doc.kind === 'mentor') && prev && prev.status !== doc.status && doc.status !== 'Pending') {
        await setProviderApproval(doc.kind, doc.refId, doc.status === 'Approved' ? 'approved' : 'rejected', user.email);
      }
    }
  }
  if (key === 'broadcasts') {
    for (const doc of clean) {
      if (!existing.has(doc._id) && doc.status === 'Sent') {
        const delivered = await deliverBroadcast(doc);
        doc.recipients = delivered || doc.recipients;
        doc.deliveredAt = nowIso();
      }
    }
  }
  await notifyPortalUsers(key, clean, existing);

  const ops: AnyBulkWriteOperation[] = clean.map((doc) => ({
    replaceOne: { filter: { _id: doc._id as any }, replacement: doc, upsert: true },
  }));
  const deleteIds = (Array.isArray(deletes) ? deletes : []).map((d) => String(d).slice(0, 200));
  if (key === 'users' && deleteIds.length) {
    for (const id of deleteIds) await disableStaffAccount(id);
  }
  if (deleteIds.length) ops.push({ deleteMany: { filter: { _id: { $in: deleteIds as any[] } } } });
  if (ops.length) await collection.bulkWrite(ops, { ordered: false });
  await db.collection(COLLECTIONS.settings).updateOne({ _id: `init:${key}` as any }, { $set: { value: true } }, { upsert: true });
}

/* ------------------------------------------------------------------ */
/* Finance & certificates: tell the student or provider what changed   */
/* ------------------------------------------------------------------ */

const rupees = (n: unknown) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

async function notifyPortalUsers(key: string, docs: Record<string, any>[], existing: Map<string, Record<string, any>>) {
  for (const doc of docs) {
    const prev = existing.get(doc._id);
    if (key === 'invoices' && doc.studentId) {
      if (!prev && doc.status === 'Due') {
        await notifyUser({ recipientId: doc.studentId, title: `New invoice ${doc.number}`, description: `${rupees(doc.total)} due by ${doc.dueDate}`, category: 'System', actionTab: 'invoices', actionText: 'View invoice' });
      }
      if (doc.status === 'Paid' && prev?.status !== 'Paid') {
        doc.paidAt = doc.paidAt || nowIso();
        await applyPaidInvoice(doc);
      }
      if (prev && prev.status === 'Verifying' && doc.status === 'Due') {
        await notifyUser({ recipientId: doc.studentId, title: `We couldn't confirm payment for ${doc.number}`, description: 'Please check the reference you entered or message support.', category: 'System', actionTab: 'invoices' });
      }
    }
    if (key === 'payouts' && doc.providerId) {
      if (doc.status === 'Paid' && prev?.status !== 'Paid') {
        await notifyUser({ recipientId: doc.providerId, title: `Payout sent: ${rupees(doc.amount)}`, description: `${doc.period}${doc.reference ? ` · ref ${doc.reference}` : ''}`, category: 'System', actionTab: 'payments' });
      } else if (!prev) {
        await notifyUser({ recipientId: doc.providerId, title: `Payout scheduled: ${rupees(doc.amount)}`, description: doc.period || 'Upcoming payout', category: 'System', actionTab: 'payments' });
      }
    }
    if (key === 'expenses' && doc.source === 'provider' && doc.providerId && prev && prev.status !== doc.status) {
      await notifyUser({ recipientId: doc.providerId, title: `Expense claim ${String(doc.status).toLowerCase()}`, description: `${rupees(doc.amount)} · ${doc.description}${doc.reviewNote ? ` · ${doc.reviewNote}` : ''}`, category: 'System', actionTab: 'expenses' });
    }
    if (key === 'sessions' && doc.studentId && prev) {
      const when = `${doc.date} ${doc.time}`;
      const linkNote = doc.meetingLink ? ' The join link is on your Sessions page.' : '';
      if (doc.status === 'Cancelled' && prev.status !== 'Cancelled') {
        await notifyUser({ recipientId: doc.studentId, title: 'Meeting cancelled', description: `${doc.topic} on ${when} was cancelled by the Maxicareer team.`, category: 'Sessions', actionTab: 'sessions' });
      } else if (doc.status === 'Completed' && prev.status !== 'Completed') {
        await notifyUser({ recipientId: doc.studentId, title: 'Meeting completed', description: `${doc.topic} on ${when} is marked done.`, category: 'Sessions', actionTab: 'sessions' });
      } else if (doc.status === 'Upcoming' && (doc.date !== prev.date || doc.time !== prev.time)) {
        await notifyUser({ recipientId: doc.studentId, title: `Meeting moved to ${when}`, description: `${doc.topic} with ${doc.mentor || 'the Maxicareer team'}.${linkNote}`, category: 'Sessions', actionTab: 'sessions' });
      } else if (doc.confirmed && !prev.confirmed) {
        await notifyUser({ recipientId: doc.studentId, title: 'Meeting confirmed', description: `${doc.topic} on ${when} with ${doc.mentor || 'the Maxicareer team'}.${linkNote}`, category: 'Sessions', actionTab: 'sessions' });
      } else if (doc.status === 'Upcoming' && doc.meetingLink && doc.meetingLink !== prev.meetingLink) {
        await notifyUser({ recipientId: doc.studentId, title: prev.meetingLink ? 'Meeting link updated' : 'Meeting link added', description: `${doc.topic} on ${when}.${linkNote}`, category: 'Sessions', actionTab: 'sessions', actionText: 'View meeting' });
      }
    }
    if (key === 'certificates' && doc.studentId && !prev) {
      await notifyUser({ recipientId: doc.studentId, title: 'You earned a certificate', description: doc.title, category: 'Courses', actionTab: 'milestones', actionText: 'View certificate' });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Staff accounts created from User management                         */
/* ------------------------------------------------------------------ */

const STAFF_ROLE: Record<string, StaffRole> = {
  Admin: 'Admin',
  'Global admin': 'Global admin',
  'Content editor': 'Content editor',
  Counsellor: 'Counsellor',
  Mentor: 'Mentor',
};

/**
 * Turns a "managed user" row into a real login. The one-time password is hashed into
 * the users collection and never stored in the admin list. Counsellors and mentors also
 * get a workspace profile so they can use the counsellor / mentor portals.
 */
async function syncStaffAccount(doc: Record<string, any>, prev: Record<string, any> | undefined, actor: UserDoc) {
  const db = await getDb();
  const users = db.collection<UserDoc>(COLLECTIONS.users);
  const email = normaliseEmail(doc.email);
  if (!isValidEmail(email)) throw new HttpError(400, `"${doc.email}" is not a valid email.`);
  const staffRole = STAFF_ROLE[doc.role] || 'Counsellor';
  if (staffRole === 'Global admin' && actor.staffRole !== 'Global admin') throw new HttpError(403, 'Only a global admin can create another global admin.');
  const tempPassword: string | undefined = typeof doc.tempPassword === 'string' && doc.tempPassword ? doc.tempPassword : undefined;
  delete doc.tempPassword;
  doc.email = email;

  let user = await users.findOne({ email });
  if (user && !prev && user.staffRole) throw new HttpError(409, 'Someone with that email already has a staff account.');

  const set: Partial<UserDoc> = { name: str(doc.name, 120) || email, staffRole, status: doc.active === false ? 'disabled' : 'active' };
  if (tempPassword) {
    set.passwordHash = await hashPassword(tempPassword);
    set.mustChangePassword = true;
    doc.passwordIssuedAt = nowIso();
  }

  if (!user) {
    const userId = newId('user');
    let role: UserDoc['role'] = 'staff';
    let refId: string | undefined;
    if (staffRole === 'Counsellor' || staffRole === 'Mentor') {
      role = staffRole === 'Counsellor' ? 'counselor' : 'mentor';
      await assertProviderNameFree(set.name as string);
      refId = newId(role);
      const base = {
        _id: refId,
        userId,
        name: set.name,
        email,
        phone: '',
        bio: '',
        avatarUrl: '',
        approvalStatus: 'approved',
        registeredDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        experienceYears: 0,
      };
      if (role === 'counselor') {
        await db.collection(COLLECTIONS.counselors).insertOne({
          ...base, qualification: '', specializations: [], areasOfExpertise: [], languages: ['English'], sessionDuration: '45 mins',
          availabilityDays: ['Monday', 'Wednesday', 'Friday'], availableTimeSlots: ['10:00 AM', '02:00 PM', '04:00 PM'],
        } as any);
      } else {
        await db.collection(COLLECTIONS.mentors).insertOne({ ...base, domain: '', company: '', role: '', availableTimeSlots: ['05:00 PM', '07:00 PM'] } as any);
      }
    }
    user = { _id: userId, email, role, refId, createdAt: nowIso(), ...set } as UserDoc;
    await users.insertOne(user);
    doc.userId = userId;
  } else {
    await users.updateOne({ _id: user._id }, { $set: set });
    doc.userId = user._id;
  }
  if (set.status === 'disabled' || tempPassword) await destroyAllSessionsFor(user._id);
}

async function disableStaffAccount(managedId: string) {
  const db = await getDb();
  const row = await db.collection(COLLECTIONS.managedUsers).findOne({ _id: managedId as any });
  if (!row?.userId) return;
  await db.collection<UserDoc>(COLLECTIONS.users).updateOne({ _id: row.userId }, { $set: { status: 'disabled' } });
  await destroyAllSessionsFor(row.userId);
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export function getSettingConfig(key: string) {
  const cfg = Object.prototype.hasOwnProperty.call(ADMIN_SETTINGS, key) ? ADMIN_SETTINGS[key] : undefined;
  if (!cfg) throw new HttpError(404, `Unknown setting "${key}".`);
  return cfg;
}

export async function readSetting(key: string) {
  const db = await getDb();
  const doc = await db.collection(COLLECTIONS.settings).findOne({ _id: key as any });
  return doc ? { exists: true, value: doc.value, updatedAt: doc.updatedAt } : { exists: false, value: null };
}

export async function writeSetting(key: string, value: unknown, user: UserDoc) {
  const cfg = getSettingConfig(key);
  if (cfg.write && !cfg.write(user)) throw new HttpError(403, 'You do not have permission to change this.');
  const size = JSON.stringify(value ?? null).length;
  if (size > 4_000_000) throw new HttpError(413, 'That is too large to save. Upload images instead of pasting them.');
  const db = await getDb();
  await db.collection(COLLECTIONS.settings).updateOne(
    { _id: key as any },
    { $set: { value, updatedAt: nowIso(), updatedBy: user.email } },
    { upsert: true }
  );
}
