import { NextRequest } from 'next/server';
import { route, ok, readJson, str, appUrl } from '@/lib/server/http';
import { requireAdmin, HttpError } from '@/lib/server/auth';
import { listAccounts, updateAccount, createStaffAccount, type AccountAction } from '@/lib/server/adminData';

export const dynamic = 'force-dynamic';

const ACTIONS: AccountAction[] = ['disable', 'enable', 'reset'];

/** Every account on the platform, for User management. */
export const GET = route(async (req: NextRequest) => {
  await requireAdmin(req);
  return ok({ accounts: await listAccounts() });
});

/**
 * Body: { action: 'create', name, email, role } adds a staff member, or
 * { id, action: 'disable' | 'enable' | 'reset' } changes an account. New and reset passwords
 * are emailed; the reply carries the password only if the email couldn't be sent.
 */
export const POST = route(async (req: NextRequest) => {
  const user = await requireAdmin(req);
  const body = await readJson<{ id?: string; action?: string; name?: string; email?: string; role?: string }>(req);
  if (body.action === 'create') return ok({ ...(await createStaffAccount(user, body, appUrl(req))) });
  if (!ACTIONS.includes(body.action as AccountAction)) throw new HttpError(400, 'Unknown action.');
  return ok({ ...(await updateAccount(user, str(body.id, 200), body.action as AccountAction, appUrl(req))) });
});
