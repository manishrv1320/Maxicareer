import { NextRequest } from 'next/server';
import { route, ok, readJson, str, appUrl } from '@/lib/server/http';
import { requireAdmin, HttpError } from '@/lib/server/auth';
import { sendNewsletterBatch, sendTestNewsletter } from '@/lib/server/newsletter';

export const dynamic = 'force-dynamic';

/**
 * Body: { action: 'send', id } sends the next batch of an issue and returns its progress;
 * { action: 'test', subject, body } emails a preview to the signed-in admin.
 */
export const POST = route(async (req: NextRequest) => {
  const user = await requireAdmin(req);
  const body = await readJson<{ action?: string; id?: string; subject?: string; body?: string }>(req);
  if (body.action === 'send') return ok(await sendNewsletterBatch(user, str(body.id, 200), appUrl(req)));
  if (body.action === 'test') return ok(await sendTestNewsletter(user, body.subject, body.body, appUrl(req)));
  throw new HttpError(400, 'Unknown action.');
});
