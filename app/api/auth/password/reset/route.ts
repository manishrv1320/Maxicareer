import { NextRequest } from 'next/server';
import { route, readJson, fail, ok, str } from '@/lib/server/http';
import { col, COLLECTIONS } from '@/lib/server/db';
import { rateLimit, hashPassword, validatePassword, hashResetToken, destroyAllSessionsFor, clearLimit, isStaff, type UserDoc } from '@/lib/server/auth';
import { signInResponse } from '@/lib/server/account';
import { audit } from '@/lib/server/notify';

export const dynamic = 'force-dynamic';

const EXPIRED = 'This reset link has expired or was already used. Ask for a new one from "Forgot password?".';

async function findReset(token: unknown) {
  const t = str(token, 200);
  if (!t) return null;
  const doc = await (await col(COLLECTIONS.passwordResets)).findOne({ _id: hashResetToken(t) as any });
  return doc && doc.expiresAt > new Date() ? doc : null;
}

/** Lets the reset page say straight away whether the link still works. */
export const GET = route(async (req: NextRequest) => {
  rateLimit(req, 'pw-reset-check', 30, 15 * 60_000);
  const doc = await findReset(req.nextUrl.searchParams.get('token'));
  if (!doc) return fail(EXPIRED, 410);
  return ok({ email: doc.email });
});

/** Sets the new password from an emailed link, signs out every other device and signs this one in. */
export const POST = route(async (req: NextRequest) => {
  rateLimit(req, 'pw-reset', 10, 15 * 60_000);
  const { token, newPassword } = await readJson<{ token?: string; newPassword?: string }>(req);
  const doc = await findReset(token);
  if (!doc) return fail(EXPIRED, 410);
  const pwError = validatePassword(newPassword);
  if (pwError) return fail(pwError);

  const users = await col<UserDoc>(COLLECTIONS.users);
  const user = await users.findOne({ _id: doc.userId });
  if (!user || user.status === 'disabled' || user.status === 'rejected') return fail(EXPIRED, 410);

  await users.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(String(newPassword)) }, $unset: { mustChangePassword: '' } });
  await (await col(COLLECTIONS.passwordResets)).deleteMany({ userId: user._id });
  await destroyAllSessionsFor(user._id);
  clearLimit(`login-fail:${user.email}`);
  if (isStaff(user)) await audit(user.email, 'Access', 'Reset password by email', user.email).catch(() => {});

  if (user.status === 'pending') return ok({ message: 'Password updated. You can sign in once an administrator approves your account.' });
  return signInResponse({ ...user, mustChangePassword: undefined }, { message: 'Password updated.' });
});
