import { NextRequest } from 'next/server';
import { route, ok, readJson } from '@/lib/server/http';
import { requireStaff } from '@/lib/server/auth';
import { getSettingConfig, readSetting, writeSetting } from '@/lib/server/adminData';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ key: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  await requireStaff(req);
  const { key } = await params;
  getSettingConfig(key);
  return ok(await readSetting(key));
});

export const PUT = route<Ctx>(async (req: NextRequest, { params }) => {
  const user = await requireStaff(req);
  const { key } = await params;
  const { value } = await readJson<{ value: unknown }>(req);
  await writeSetting(key, value, user);
  return ok(await readSetting(key));
});
