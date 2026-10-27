import { route, ok } from '@/lib/server/http';
import { isDbConfigured, col, COLLECTIONS } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

/** Published events an admin chose to show on the website (public, read-only). */
export const GET = route(async () => {
  if (!isDbConfigured()) return ok({ events: [] });
  // A day of slack: the page hides anything before the visitor's own today.
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const docs = await (await col(COLLECTIONS.events))
    .find({ status: 'Published', public: true, date: { $gte: yesterday } })
    .sort({ date: 1, time: 1 })
    .limit(100)
    .toArray();
  const events = docs.map((d: any) => ({
    id: String(d._id),
    title: d.title,
    type: d.type,
    description: d.description,
    date: d.date,
    time: d.time,
    durationMins: d.durationMins,
    mode: d.mode,
    link: d.mode === 'Online' ? d.link || '' : '',
    location: d.mode === 'Online' ? '' : d.location || '',
    host: d.host,
  }));
  return ok({ events }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } });
});
