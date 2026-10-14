import { NextRequest } from 'next/server';
import { route, readJson, fail } from '@/lib/server/http';
import { col, COLLECTIONS } from '@/lib/server/db';
import { normaliseEmail, rateLimit, hashOtp, type UserDoc } from '@/lib/server/auth';
import { createStudentAccount, signInResponse } from '@/lib/server/account';

export const dynamic = 'force-dynamic';

export const POST = route(async (req: NextRequest) => {
  rateLimit(req, 'otp-verify', 15, 15 * 60_000);
  const body = await readJson<{ email?: string; code?: string; profession?: string }>(req);
  const email = normaliseEmail(body.email);
  const code = String(body.code || '').trim();
  const codes = await col<{ _id: string; codeHash: string; attempts: number; expiresAt: Date }>(COLLECTIONS.otpCodes);
  const entry = await codes.findOne({ _id: email });
  if (!entry || entry.expiresAt.getTime() < Date.now()) return fail('That code has expired. Request a new one.', 400);
  if (entry.attempts >= 5) {
    await codes.deleteOne({ _id: email });
    return fail('Too many incorrect attempts. Request a new code.', 429);
  }
  if (entry.codeHash !== hashOtp(email, code)) {
    await codes.updateOne({ _id: email }, { $inc: { attempts: 1 } });
    return fail('That code is incorrect.', 400);
  }
  await codes.deleteOne({ _id: email });

  let user = await (await col<UserDoc>(COLLECTIONS.users)).findOne({ email });
  if (user && user.status !== 'active') return fail('This account is not active. Please contact support.', 403);
  if (!user) {
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    ({ user } = await createStudentAccount({ email, name, profession: body.profession }, { source: 'self_signup', authProvider: 'email' }));
  }
  return signInResponse(user);
});
