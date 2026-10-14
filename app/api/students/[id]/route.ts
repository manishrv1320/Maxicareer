import { NextRequest } from 'next/server';
import { route, ok, fail, readJson } from '@/lib/server/http';
import { col, COLLECTIONS, nowIso } from '@/lib/server/db';
import { requireStaff, requireAdmin, destroyAllSessionsFor, type UserDoc } from '@/lib/server/auth';
import { StudentDoc, computeStats, sanitizeAdminPatch } from '@/lib/server/students';
import { notifyUser } from '@/lib/server/notify';
import { findProviderByName } from '@/lib/server/viewer';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  await requireStaff(req);
  const { id } = await params;
  const student = await (await col<StudentDoc>(COLLECTIONS.students)).findOne({ _id: id });
  if (!student) return fail('Student not found.', 404);
  return ok({ data: student });
});

export const PATCH = route<Ctx>(async (req: NextRequest, { params }) => {
  await requireStaff(req);
  const { id } = await params;
  const patch = sanitizeAdminPatch(await readJson(req));
  const students = await col<StudentDoc>(COLLECTIONS.students);
  const before = await students.findOne({ _id: id });
  if (!before) return fail('Student not found.', 404);

  const updated = await students.findOneAndUpdate({ _id: id }, { $set: { ...patch, updatedAt: nowIso() } }, { returnDocument: 'after' });

  // Let the student know about changes they'd care about.
  if (patch.status && patch.status !== before.status && patch.status === 'enrolled') {
    await notifyUser({ recipientId: id, title: 'Enrolment confirmed', description: `You're enrolled in ${updated!.planName}.`, category: 'Courses', actionTab: 'courses' });
  }
  const newMentor = patch.mentorAssigned && patch.mentorAssigned !== before.mentorAssigned && patch.mentorAssigned !== 'Unassigned' ? patch.mentorAssigned : null;
  const newCounsellor = patch.counselorAssigned && patch.counselorAssigned !== before.counselorAssigned && patch.counselorAssigned !== 'Unassigned' ? patch.counselorAssigned : null;
  if (newMentor) {
    await notifyUser({ recipientId: id, title: 'Mentor assigned', description: `${newMentor} is now your mentor. You can message them from the Messages tab.`, category: 'Mentorship', actionTab: 'messages' });
  }
  if (newCounsellor) {
    await notifyUser({ recipientId: id, title: 'Counsellor assigned', description: `${newCounsellor} is now your counsellor. You can book a session or message them from your portal.`, category: 'Mentorship', actionTab: 'messages' });
  }
  // The counsellor or mentor sees the student in their workspace; tell them it happened.
  for (const name of [newMentor, newCounsellor]) {
    const provider = name ? await findProviderByName(name) : null;
    if (provider) {
      await notifyUser({ recipientId: provider.doc._id, title: `New student assigned: ${updated!.name}`, description: `${updated!.planName}. They're now in your mentee list.`, category: 'Mentorship', actionTab: 'mentees' });
    }
  }
  return ok({ message: 'Student updated.', data: updated, stats: await computeStats() });
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  const students = await col<StudentDoc>(COLLECTIONS.students);
  const doc = await students.findOne({ _id: id });
  if (!doc) return fail('Student not found.', 404);
  await students.deleteOne({ _id: id });
  // Remove the learner's login too, so a deleted record can't still sign in.
  const users = await col<UserDoc>(COLLECTIONS.users);
  const linked = await users.findOne({ refId: id, role: 'student' });
  if (linked) {
    await users.deleteOne({ _id: linked._id });
    await destroyAllSessionsFor(linked._id);
  }
  return ok({ message: 'Student deleted.', stats: await computeStats() });
});
