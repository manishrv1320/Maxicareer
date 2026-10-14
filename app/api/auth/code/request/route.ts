import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { route, readJson, fail, ok } from '@/lib/server/http';
import { col, COLLECTIONS, nowIso } from '@/lib/server/db';
import { normaliseEmail, isValidEmail, rateLimit, hashOtp, type UserDoc } from '@/lib/server/auth';
import { sendMail, isMailConfigured } from '@/lib/server/mail';

export const dynamic = 'force-dynamic';

/** Emails a 6-digit sign-in code to a student (creates the account on verify if new). */
export const POST = route(async (req: NextRequest) => {
  rateLimit(req, 'otp', 5, 15 * 60_000);
  const { email: raw } = await readJson<{ email?: string }>(req);
  const email = normaliseEmail(raw);
  if (!isValidEmail(email)) return fail('Please enter a valid email address.');

  const user = await (await col<UserDoc>(COLLECTIONS.users)).findOne({ email });
  if (user && user.role !== 'student') return fail('Staff accounts sign in with a password.', 403);

  const code = String(crypto.randomInt(100000, 1000000));
  await (await col(COLLECTIONS.otpCodes)).updateOne(
    { _id: email as any },
    { $set: { codeHash: hashOtp(email, code), attempts: 0, createdAt: nowIso(), expiresAt: new Date(Date.now() + 10 * 60_000) } },
    { upsert: true }
  );
  const sent = await sendMail({
    to: email,
    subject: `Your Maxicareer sign-in code: ${code}`,
    text: `Your Maxicareer sign-in code is ${code}.\n\nIt expires in 10 minutes. If you didn't ask for it, you can ignore this email.`,
  });

  // Without an email provider in development, hand the code back so the flow can be tested.
  const devCode = !isMailConfigured() && process.env.NODE_ENV !== 'production' ? code : undefined;
  if (!sent && !devCode) return fail('We could not send the email right now. Please sign in with your password instead.', 503);
  return ok({ message: `We sent a 6-digit code to ${email}.`, devCode });
});
