import { MongoClient, Db, Collection, Document } from 'mongodb';

/**
 * MongoDB connection shared by every API route.
 * The client is cached on `globalThis` so Next.js dev reloads reuse one pool.
 */

declare global {
  // eslint-disable-next-line no-var
  var __mc_mongo: { client: MongoClient; db: Db; ready: Promise<void> } | undefined;
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('MONGODB_URI is not set. Add it to .env.local (see .env.example).');
    this.name = 'DatabaseNotConfiguredError';
  }
}

export const COLLECTIONS = {
  users: 'users',
  authSessions: 'auth_sessions',
  otpCodes: 'otp_codes',
  /** One-time links from 'Forgot password' (token hash only, expire after 30 minutes). */
  passwordResets: 'password_resets',
  students: 'students',
  counselors: 'counselors',
  mentors: 'mentors',
  counselingRequests: 'counseling_requests',
  appointments: 'appointments',
  sessionNotes: 'session_notes',
  recommendations: 'recommendations',
  followUpTasks: 'follow_up_tasks',
  messages: 'messages',
  assessments: 'assessments',
  userNotifications: 'user_notifications',
  supportTickets: 'support_tickets',
  files: 'files',
  settings: 'settings',
  /** Every form filled on the website or portal (admin "Form submissions" inbox). */
  formSubmissions: 'form_submissions',
  // Admin workspace collections
  adminNotifications: 'admin_notifications',
  auditLogs: 'audit_logs',
  applications: 'applications',
  roadmapTemplates: 'roadmap_templates',
  studentRoadmaps: 'student_roadmaps',
  approvals: 'approvals',
  mentoringSessions: 'mentoring_sessions',
  managedUsers: 'managed_users',
  services: 'services',
  broadcasts: 'broadcasts',
  // Portal features shared by students, counsellors, mentors and admins
  assignments: 'assignments',
  calendarNotes: 'calendar_notes',
  invoices: 'invoices',
  payouts: 'payouts',
  expenses: 'expenses',
  workLogs: 'work_logs',
  feedback: 'feedback',
  events: 'events',
  tests: 'tests',
  certificates: 'certificates',
  careers: 'careers',
  curricula: 'curricula',
  resources: 'resources',
} as const;

export function isDbConfigured() {
  const uri = process.env.MONGODB_URI;
  return Boolean(uri && !uri.includes('<username>') && !uri.includes('<password>'));
}

export function dbName() {
  return process.env.MONGODB_DB_NAME || 'maxicareer';
}

async function ensureIndexes(db: Db) {
  const c = COLLECTIONS;
  await Promise.all([
    db.collection(c.users).createIndex({ email: 1 }, { unique: true }),
    db.collection(c.users).createIndex({ refId: 1 }),
    db.collection(c.authSessions).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection(c.authSessions).createIndex({ userId: 1 }),
    db.collection(c.otpCodes).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection(c.passwordResets).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection(c.passwordResets).createIndex({ userId: 1 }),
    db.collection(c.students).createIndex({ email: 1 }),
    db.collection(c.students).createIndex({ createdAt: -1 }),
    db.collection(c.students).createIndex({ status: 1, profession: 1 }),
    db.collection(c.counselors).createIndex({ email: 1 }),
    db.collection(c.mentors).createIndex({ email: 1 }),
    db.collection(c.counselingRequests).createIndex({ counselorId: 1, status: 1 }),
    db.collection(c.counselingRequests).createIndex({ studentId: 1 }),
    db.collection(c.appointments).createIndex({ counselorId: 1 }),
    db.collection(c.appointments).createIndex({ studentId: 1 }),
    db.collection(c.sessionNotes).createIndex({ counselorId: 1 }),
    db.collection(c.sessionNotes).createIndex({ studentId: 1 }),
    db.collection(c.recommendations).createIndex({ studentId: 1 }),
    db.collection(c.recommendations).createIndex({ counselorId: 1 }),
    db.collection(c.followUpTasks).createIndex({ studentId: 1 }),
    db.collection(c.followUpTasks).createIndex({ counselorId: 1 }),
    db.collection(c.messages).createIndex({ conversationId: 1, createdAt: 1 }),
    db.collection(c.messages).createIndex({ senderId: 1 }),
    db.collection(c.messages).createIndex({ recipientId: 1 }),
    db.collection(c.assessments).createIndex({ studentId: 1 }),
    db.collection(c.userNotifications).createIndex({ recipientId: 1, createdAt: -1 }),
    db.collection(c.auditLogs).createIndex({ at: -1 }),
    db.collection(c.formSubmissions).createIndex({ createdAt: -1 }),
    db.collection(c.formSubmissions).createIndex({ email: 1 }),
    db.collection(c.adminNotifications).createIndex({ createdAt: -1 }),
    db.collection(c.broadcasts).createIndex({ status: 1, sendAt: 1 }),
    db.collection(c.assignments).createIndex({ studentId: 1 }),
    db.collection(c.assignments).createIndex({ counselorId: 1 }),
    db.collection(c.calendarNotes).createIndex({ ownerId: 1, date: 1 }),
    db.collection(c.invoices).createIndex({ studentId: 1 }),
    db.collection(c.invoices).createIndex({ issuedAt: -1 }),
    db.collection(c.payouts).createIndex({ providerId: 1 }),
    db.collection(c.expenses).createIndex({ providerId: 1 }),
    db.collection(c.workLogs).createIndex({ providerId: 1, date: -1 }),
    db.collection(c.feedback).createIndex({ targetId: 1 }),
    db.collection(c.feedback).createIndex({ fromId: 1 }),
    db.collection(c.events).createIndex({ date: 1 }),
    db.collection(c.certificates).createIndex({ studentId: 1 }),
    db.collection(c.curricula).createIndex({ scope: 1, cohort: 1 }),
    db.collection(c.resources).createIndex({ scope: 1, cohort: 1 }),
  ]);
}

async function connect() {
  if (!isDbConfigured()) throw new DatabaseNotConfiguredError();
  if (globalThis.__mc_mongo) {
    await globalThis.__mc_mongo.ready;
    return globalThis.__mc_mongo;
  }
  const client = new MongoClient(process.env.MONGODB_URI as string, {
    serverSelectionTimeoutMS: 8000,
    appName: 'maxicareer',
  });
  const db = client.db(dbName());
  const ready = (async () => {
    await client.connect();
    await ensureIndexes(db);
    // Lazily imported to avoid a module cycle (bootstrap uses getDb).
    const { ensureBootstrapAdmin } = await import('./bootstrap');
    await ensureBootstrapAdmin(db);
  })();
  globalThis.__mc_mongo = { client, db, ready };
  try {
    await ready;
  } catch (err) {
    // Let the next request retry instead of caching a failed connection.
    globalThis.__mc_mongo = undefined;
    await client.close().catch(() => {});
    throw err;
  }
  return globalThis.__mc_mongo;
}

export async function getDb(): Promise<Db> {
  return (await connect()).db;
}

export async function col<T extends Document = Document>(name: string): Promise<Collection<T>> {
  return (await getDb()).collection<T>(name);
}

export async function pingDb(): Promise<{ ok: boolean; ms: number; error?: string }> {
  const start = Date.now();
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return { ok: true, ms: Date.now() - start };
  } catch (err: any) {
    return { ok: false, ms: Date.now() - start, error: err?.message || String(err) };
  }
}

/** Short random id with a readable prefix, e.g. `req-lq3k9a-7f2c1`. */
export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const nowIso = () => new Date().toISOString();

export const longDate = (d = new Date()) =>
  d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

/** Replace Mongo's `_id` with the `id` field the UI types expect. */
export function withId<T extends { _id: any }>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { ...(rest as any), id: String(_id) };
}
