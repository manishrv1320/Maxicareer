import { route, ok } from '@/lib/server/http';
import { isDbConfigured, col, COLLECTIONS } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

/** Openings published from the admin Career page (public, read-only). */
export const GET = route(async () => {
  if (!isDbConfigured()) return ok({ openings: [] });
  const today = new Date().toISOString().slice(0, 10);
  const docs = await (await col(COLLECTIONS.careers))
    .find({ status: 'Published', $or: [{ deadline: { $exists: false } }, { deadline: '' }, { deadline: { $gte: today } }] })
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();
  const openings = docs.map(({ _id, isDemo, ...rest }: any) => ({ ...rest, id: String(_id) }));
  return ok({ openings }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } });
});
