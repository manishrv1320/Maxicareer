import { NextRequest } from 'next/server';
import { route, ok } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/auth';
import { subscriptionFor, unsubscribe } from '@/lib/server/newsletter';

export const dynamic = 'force-dynamic';

/** Which address a link belongs to, for the /newsletter/unsubscribe page. Changes nothing. */
export const GET = route(async (req: NextRequest) => {
  rateLimit(req, 'newsletter-unsub', 60, 15 * 60_000);
  return ok(await subscriptionFor(req.nextUrl.searchParams.get('token')));
});

/**
 * Unsubscribes. The token comes in the query string (one-click unsubscribe from the mail
 * app, RFC 8058) or as JSON from the unsubscribe page.
 */
export const POST = route(async (req: NextRequest) => {
  rateLimit(req, 'newsletter-unsub', 60, 15 * 60_000);
  let token = req.nextUrl.searchParams.get('token');
  if (!token && req.headers.get('content-type')?.includes('application/json')) {
    token = ((await req.json().catch(() => ({}))) as { token?: string }).token || null;
  }
  return ok(await unsubscribe(token));
});
