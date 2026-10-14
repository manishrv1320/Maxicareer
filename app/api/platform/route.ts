import { NextRequest } from 'next/server';
import { route, ok, readJson } from '@/lib/server/http';
import { getCurrentUser } from '@/lib/server/auth';
import { buildState, runAction } from '@/lib/server/platform';

export const dynamic = 'force-dynamic';

/** Everything the signed-in user's dashboards need, scoped to what they may see. */
export const GET = route(async (req: NextRequest) => {
  const user = await getCurrentUser(req);
  return ok({ state: await buildState(user) });
});

/** Runs one server-validated action, then returns the refreshed state. */
export const POST = route(async (req: NextRequest) => {
  const user = await getCurrentUser(req);
  const { action, payload } = await readJson<{ action?: string; payload?: Record<string, any> }>(req);
  const result = await runAction(user, String(action || ''), payload || {}, req);
  return ok({ result: result ?? null, state: await buildState(user) });
});
