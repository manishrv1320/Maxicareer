import { NextRequest } from 'next/server';
import { route, ok } from '@/lib/server/http';
import { requireAdmin } from '@/lib/server/auth';
import { loadDemoData } from '@/lib/server/demo';
import { computeStats } from '@/lib/server/students';

export const dynamic = 'force-dynamic';

/** Loads the sample students, counsellors and sessions (admin only). */
export const POST = route(async (req: NextRequest) => {
  const admin = await requireAdmin(req);
  const result = await loadDemoData(admin.email);
  return ok({ message: 'Sample data loaded.', ...result, stats: await computeStats() });
});
