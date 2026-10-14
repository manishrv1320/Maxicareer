import { NextRequest } from 'next/server';
import { route, ok, readJson } from '@/lib/server/http';
import { requireStaff } from '@/lib/server/auth';
import { listCollection, applyChanges } from '@/lib/server/adminData';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ collection: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  const user = await requireStaff(req);
  const { collection } = await params;
  return ok(await listCollection(collection, user));
});

/** Body: { upserts: Item[], deletes: string[] } */
export const POST = route<Ctx>(async (req: NextRequest, { params }) => {
  const user = await requireStaff(req);
  const { collection } = await params;
  const { upserts = [], deletes = [] } = await readJson<{ upserts?: any[]; deletes?: string[] }>(req);
  await applyChanges(collection, user, upserts, deletes);
  return ok(await listCollection(collection, user));
});
