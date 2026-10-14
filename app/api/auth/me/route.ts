import { NextRequest } from 'next/server';
import { route, ok } from '@/lib/server/http';
import { getCurrentUser, demoLoginEnabled } from '@/lib/server/auth';
import { sessionPayload } from '@/lib/server/account';
import { isDbConfigured, col, COLLECTIONS } from '@/lib/server/db';
import { SAMPLE_LOGINS } from '@/lib/server/demo';

export const dynamic = 'force-dynamic';

export const GET = route(async (req: NextRequest) => {
  if (!isDbConfigured()) return ok({ user: null, student: null, configured: false });
  const [user, demo] = await Promise.all([getCurrentUser(req), (await col(COLLECTIONS.settings)).findOne({ _id: 'demo_loaded' as any })]);
  const demoAvailable = Boolean(demo?.value) && demoLoginEnabled();
  // Sample sign-ins are only listed while clearly-marked sample data is loaded.
  const sampleLogins = demoAvailable ? SAMPLE_LOGINS : undefined;
  if (!user) return ok({ user: null, student: null, configured: true, demoAvailable, sampleLogins });
  return ok({ ...(await sessionPayload(user)), configured: true, demoAvailable, sampleLogins });
});
