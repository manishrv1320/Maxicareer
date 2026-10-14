import { NextRequest } from 'next/server';
import type { Filter } from 'mongodb';
import { route, ok, fail, readJson, str } from '@/lib/server/http';
import { col, COLLECTIONS } from '@/lib/server/db';
import { getCurrentUser, requireStaff, canSeeStudentData, isValidEmail, normaliseEmail, rateLimit } from '@/lib/server/auth';
import { StudentDoc, buildStudent, recordPublicLead, computeStats, sanitizeAdminPatch } from '@/lib/server/students';
import { recordSubmission } from '@/lib/server/submissions';

export const dynamic = 'force-dynamic';

const SORTABLE = new Set(['createdAt', 'updatedAt', 'name', 'planPrice', 'status', 'roadmapProgress']);

/** Student records for the admin portal (staff only). */
export const GET = route(async (req: NextRequest) => {
  const user = await requireStaff(req);
  if (!canSeeStudentData(user)) return ok({ count: 0, data: [], stats: await computeStats([]) });
  const sp = req.nextUrl.searchParams;
  const filter: Filter<StudentDoc> = {};
  const profession = sp.get('profession');
  const status = sp.get('status');
  const search = sp.get('search')?.trim();
  if (profession && profession !== 'all') filter.profession = profession as StudentDoc['profession'];
  if (status && status !== 'all') filter.status = status as StudentDoc['status'];
  if (search) {
    const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { institutionOrCompany: rx }, { planName: rx }];
  }
  const sortBy = SORTABLE.has(sp.get('sortBy') || '') ? (sp.get('sortBy') as string) : 'createdAt';
  const sortOrder = sp.get('sortOrder') === 'asc' ? 1 : -1;

  const students = await (await col<StudentDoc>(COLLECTIONS.students)).find(filter).sort({ [sortBy]: sortOrder }).limit(5000).toArray();
  const stats = await computeStats(Object.keys(filter).length ? undefined : students);
  return ok({ count: students.length, data: students, stats });
});

/**
 * Creates a student record. Staff can add anyone; the public enrolment and
 * registration forms land here too (rate-limited, and never overwrite an existing record).
 */
export const POST = route(async (req: NextRequest) => {
  const body = await readJson<Record<string, any>>(req);
  const user = await getCurrentUser(req);
  const email = normaliseEmail(body.email);
  if (!str(body.name, 120) || !isValidEmail(email)) return fail('Student name and a valid email are required.');

  if (canSeeStudentData(user)) {
    const doc = buildStudent({ ...body, email }, 'admin_manual');
    const patch = sanitizeAdminPatch(body);
    Object.assign(doc, patch, { source: 'admin_manual' });
    await (await col<StudentDoc>(COLLECTIONS.students)).insertOne(doc);
    return ok({ message: 'Student added.', data: doc, stats: await computeStats() }, { status: 201 });
  }

  rateLimit(req, 'public-registration', 10, 15 * 60_000);
  const source = body.source === 'quick_consultation' ? 'quick_consultation' : 'portal_registration';
  const { student, created } = await recordPublicLead({ ...body, email }, source);
  await recordSubmission({
    form: source === 'quick_consultation' ? 'contact' : 'program_registration',
    name: str(body.name, 120),
    email,
    phone: str(body.phone, 40),
    subject: str(body.planName, 200) || student.planName,
    message: str(body.message || body.additionalNotes, 3000),
    // The program is the subject, and `detail` only repeats the academic details.
    fields: { ...body, planName: undefined, detail: undefined },
    studentId: student._id,
    notify: { id: created ? `auto-reg-${student._id}` : undefined },
  });
  // Public callers only learn that the registration was received.
  return ok({ message: 'Registration received.', data: { id: student._id, name: student.name, email } }, { status: 201 });
});
