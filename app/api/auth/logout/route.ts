import { NextRequest, NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { destroySession, clearSessionCookie } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export const POST = route(async (req: NextRequest) => {
  await destroySession(req).catch(() => {});
  const res = NextResponse.json({ success: true });
  clearSessionCookie(res);
  return res;
});
