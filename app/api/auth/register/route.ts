import { NextRequest } from 'next/server';
import { route, readJson, fail, str } from '@/lib/server/http';
import { col, COLLECTIONS } from '@/lib/server/db';
import { normaliseEmail, isValidEmail, validatePassword, rateLimit, type UserDoc } from '@/lib/server/auth';
import { createStudentAccount, signInResponse } from '@/lib/server/account';
import type { StudentDoc } from '@/lib/server/students';

export const dynamic = 'force-dynamic';

/**
 * Student sign-up. Also used by the enrolment form when the learner picks a password,
 * so the registration and the login are created together.
 */
export const POST = route(async (req: NextRequest) => {
  rateLimit(req, 'register', 10, 15 * 60_000);
  const body = await readJson<Record<string, any>>(req);
  const email = normaliseEmail(body.email);
  if (!str(body.name, 120)) return fail('Please enter your full name.');
  if (!isValidEmail(email)) return fail('Please enter a valid email address.');
  const pwError = validatePassword(body.password);
  if (pwError) return fail(pwError);

  const existing = await (await col<UserDoc>(COLLECTIONS.users)).findOne({ email });
  if (existing) return fail('An account with this email already exists. Please sign in instead.', 409);

  // An earlier enquiry or enrolment for this email holds that person's details. A password
  // sign-up doesn't prove the email is theirs, so they claim it with an emailed code instead.
  const unclaimed = await (await col<StudentDoc>(COLLECTIONS.students)).findOne({ email, userId: { $exists: false } }, { projection: { _id: 1 } });
  if (unclaimed) {
    return fail('We already have a registration for this email. To keep it safe, sign in with a code sent to this email ("Sign in with an email code"). Your details will be waiting.', 409);
  }

  const { user } = await createStudentAccount({ ...body, email }, { password: body.password, source: body.planName ? 'portal_registration' : 'self_signup' });
  return signInResponse(user, { linkedExistingRecord: false }, 201);
});
