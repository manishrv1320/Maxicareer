import { NextRequest } from 'next/server';
import { route, ok, readJson } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/auth';
import { subscribe } from '@/lib/server/newsletter';

export const dynamic = 'force-dynamic';

/**
 * Newsletter sign-up from the website footer. The reply is the same whether or not the
 * address was already on the list, so the list can't be probed.
 */
export const POST = route(async (req: NextRequest) => {
  rateLimit(req, 'newsletter', 10, 15 * 60_000);
  const { email, name } = await readJson<{ email?: string; name?: string }>(req);
  await subscribe(email, name);
  return ok({ message: "You're subscribed. Look out for career tips, events and openings from Maxicareer in your inbox." });
});
