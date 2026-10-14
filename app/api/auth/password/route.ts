import { NextRequest } from 'next/server';
import { route, readJson, fail, ok } from '@/lib/server/http';
import { col, COLLECTIONS } from '@/lib/server/db';
import { requireUser, verifyPassword, hashPassword, validatePassword, destroyOtherSessions, type UserDoc } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/** Change the signed-in user's password (required after a one-time staff password). Signs out other devices. */
export const POST = route(async (req: NextRequest) => {
  const user = await requireUser(req);
  const { currentPassword, newPassword } = await readJson<{ currentPassword?: string; newPassword?: string }>(req);
  if (user.passwordHash && !(await verifyPassword(String(currentPassword || ''), user.passwordHash))) {
    return fail('Your current password is incorrect.', 401);
  }
  const pwError = validatePassword(newPassword);
  if (pwError) return fail(pwError);
  await (await col<UserDoc>(COLLECTIONS.users)).updateOne(
    { _id: user._id },
    { $set: { passwordHash: await hashPassword(String(newPassword)) }, $unset: { mustChangePassword: '' } }
  );
  // Anyone else signed in with the old password is signed out; this browser stays in.
  await destroyOtherSessions(req, user._id);
  return ok({ message: 'Password updated.' });
});
