import { route, ok } from '@/lib/server/http';
import { isDbConfigured } from '@/lib/server/db';
import { readSetting } from '@/lib/server/adminData';

export const dynamic = 'force-dynamic';

/** Website content published from the admin portal (public, read-only). */
export const GET = route(async () => {
  if (!isDbConfigured()) return ok({ content: {} });
  const { value } = await readSetting('website_published');
  return ok({ content: value || {} }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } });
});
