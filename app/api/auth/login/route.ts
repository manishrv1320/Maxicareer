import { NextRequest } from 'next/server';
import { route, readJson, fail } from '@/lib/server/http';
import { col, COLLECTIONS } from '@/lib/server/db';
import { verifyPassword, normaliseEmail, rateLimit, limitKey, assertNotLimited, isStaff, type UserDoc } from '@/lib/server/auth';
import { signInResponse } from '@/lib/server/account';
import { audit } from '@/lib/server/notify';

export const dynamic = 'force-dynamic';

type Portal = 'student' | 'counselor' | 'mentor' | 'admin';
/** 'auto' (the shared /login page) accepts any active account and the response says where to go. */
type PortalOrAuto = Portal | 'auto';

const PORTAL_NAME: Record<Portal, string> = {
  student: 'student portal',
  counselor: 'counsellor workspace',
  mentor: 'mentor workspace',
  admin: 'admin portal',
};

function canUse(user: UserDoc, portal: Portal) {
  if (portal === 'admin') return isStaff(user);
  return user.role === portal;
}

export const POST = route(async (req: NextRequest) => {
  rateLimit(req, 'login', 60, 15 * 60_000);
  const body = await readJson<{ email?: string; password?: string; portal?: PortalOrAuto }>(req);
  const email = normaliseEmail(body.email);
  const password = String(body.password || '');
  const portal: PortalOrAuto = ['student', 'counselor', 'mentor', 'admin', 'auto'].includes(body.portal as string) ? (body.portal as PortalOrAuto) : 'student';
  if (!email || !password) return fail('Enter your email and password.');
  // Per-account lockout (checked before the password) so guesses can't be spread across IPs.
  const failKey = `login-fail:${email}`;
  assertNotLimited(failKey, 8);

  const user = await (await col<UserDoc>(COLLECTIONS.users)).findOne({ email });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    limitKey(failKey, 8, 15 * 60_000);
    return fail('That email and password combination is incorrect.', 401);
  }
  if (user.status === 'pending') {
    return fail('Your account is pending verification. An administrator will review it before you can sign in.', 403);
  }
  if (user.status === 'rejected') return fail('This registration was not approved. Please contact Maxicareer support.', 403);
  if (user.status === 'disabled') return fail('This account has been deactivated. Please contact an administrator.', 403);
  if (portal !== 'auto' && !canUse(user, portal)) {
    return fail(`This account can't open the ${PORTAL_NAME[portal]}. Use the sign-in page for your role.`, 403);
  }
  if (isStaff(user)) await audit(user.email, 'Access', 'Signed in', user.email).catch(() => {});
  return signInResponse(user);
});
