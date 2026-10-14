import { NextRequest } from 'next/server';
import { route, readJson, fail } from '@/lib/server/http';
import { col, COLLECTIONS } from '@/lib/server/db';
import { demoLoginEnabled, type UserDoc } from '@/lib/server/auth';
import { signInResponse } from '@/lib/server/account';
import { DEMO_STUDENT_LOGINS } from '@/lib/server/demo';

export const dynamic = 'force-dynamic';

/**
 * One-click sign-in to a sample student. Only works while an administrator has
 * sample data loaded and ENABLE_DEMO_LOGIN=true.
 */
export const POST = route(async (req: NextRequest) => {
  if (!demoLoginEnabled()) return fail('Demo sign-in is turned off.', 403);
  const demo = await (await col(COLLECTIONS.settings)).findOne({ _id: 'demo_loaded' as any });
  if (!demo?.value) return fail('Sample accounts are not loaded. Sign in with your own account.', 404);

  const { profession } = await readJson<{ profession?: keyof typeof DEMO_STUDENT_LOGINS }>(req);
  const email = DEMO_STUDENT_LOGINS[profession || 'college'] || DEMO_STUDENT_LOGINS.college;
  const user = await (await col<UserDoc>(COLLECTIONS.users)).findOne({ email, isDemo: true, role: 'student' });
  if (!user) return fail('That sample account is not available.', 404);
  return signInResponse(user);
});
