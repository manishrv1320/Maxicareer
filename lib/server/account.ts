import { NextResponse } from 'next/server';
import { col, COLLECTIONS, newId, nowIso } from './db';
import { createSession, setSessionCookie, toPublicUser, hashPassword, isStaff, demoLoginEnabled, HttpError, type UserDoc } from './auth';
import { StudentDoc, toPlatformStudent, buildStudent, type StudentSource } from './students';
import { recordSubmission } from './submissions';
import { str } from './http';

/**
 * The dashboard an account lands on after signing in: counsellors and mentors (including
 * staff with a workspace profile) go to /portal, other staff to /admin, students to their portal.
 */
export function homeFor(user: UserDoc) {
  if ((user.role === 'counselor' || user.role === 'mentor') && user.refId) return '/portal';
  if (isStaff(user)) return '/admin';
  if (user.role === 'student') return '/?portal=student';
  return '/';
}

/** What the browser receives about the signed-in account. */
export async function sessionPayload(user: UserDoc) {
  let student: ReturnType<typeof toPlatformStudent> | null = null;
  if (user.role === 'student' && user.refId) {
    const doc = await (await col<StudentDoc>(COLLECTIONS.students)).findOne({ _id: user.refId });
    if (doc) student = toPlatformStudent(doc);
  }
  return { user: toPublicUser(user), student, home: homeFor(user) };
}

/** Starts a session and returns a JSON response carrying the session cookie. */
export async function signInResponse(user: UserDoc, extra: Record<string, unknown> = {}, status = 200) {
  // Sample accounts have published passwords; they only work while sample sign-in is switched on.
  if (user.isDemo && !demoLoginEnabled()) throw new HttpError(403, 'Sample accounts are switched off on this site.');
  const { token, expiresAt } = await createSession(user._id);
  const res = NextResponse.json({ success: true, ...(await sessionPayload(user)), ...extra }, { status });
  setSessionCookie(res, token, expiresAt);
  return res;
}

/**
 * Creates a student login. If the email already has a student record (from an
 * enquiry or enrolment form) the account is linked to it; otherwise a new record is made.
 */
export async function createStudentAccount(
  input: Record<string, any>,
  opts: { password?: string; source: StudentSource; authProvider?: StudentDoc['authProvider'] }
): Promise<{ user: UserDoc; student: StudentDoc; linked: boolean }> {
  const users = await col<UserDoc>(COLLECTIONS.users);
  const students = await col<StudentDoc>(COLLECTIONS.students);
  const email = String(input.email).trim().toLowerCase();

  let student = await students.findOne({ email, userId: { $exists: false } }, { sort: { createdAt: 1 } });
  const linked = Boolean(student);
  const userId = newId('user');
  if (!student) {
    student = { ...buildStudent(input, opts.source), userId, authProvider: opts.authProvider || 'credentials' };
    await students.insertOne(student);
  } else {
    await students.updateOne({ _id: student._id }, { $set: { userId, authProvider: opts.authProvider || 'credentials', updatedAt: nowIso() } });
  }

  const user: UserDoc = {
    _id: userId,
    email,
    name: student.name,
    passwordHash: opts.password ? await hashPassword(opts.password) : undefined,
    role: 'student',
    refId: student._id,
    status: 'active',
    createdAt: nowIso(),
  };
  await users.insertOne(user);

  const enrolled = opts.source === 'portal_registration';
  await recordSubmission({
    form: enrolled ? 'program_registration' : 'student_signup',
    name: student.name,
    email,
    phone: str(input.phone, 40) || student.phone,
    subject: enrolled ? student.planName : `Created a student account${linked ? ' (had enquired before)' : ''}`,
    message: str(input.message || input.additionalNotes, 3000),
    fields: { ...input, planName: undefined, detail: undefined, signedUpWith: opts.authProvider === 'email' ? 'Email code' : 'Password' },
    studentId: student._id,
    // Same id as the dashboard's automatic "new registration" alert, so admins get one notification.
    notify: { id: linked ? undefined : `auto-reg-${student._id}` },
  });
  return { user, student, linked };
}
