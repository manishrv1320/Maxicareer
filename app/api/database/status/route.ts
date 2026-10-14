import { NextRequest } from 'next/server';
import { MongoClient } from 'mongodb';
import { route, ok, fail, readJson } from '@/lib/server/http';
import { requireStaff, requireAdmin } from '@/lib/server/auth';
import { computeStats } from '@/lib/server/students';
import { isBlobConfigured, pingBlob, containerName } from '@/lib/server/blob';
import { isMailConfigured } from '@/lib/server/mail';

export const dynamic = 'force-dynamic';

/** Health of MongoDB, Azure Blob Storage and email for the admin Settings page. */
export const GET = route(async (req: NextRequest) => {
  await requireStaff(req);
  const [stats, blob] = await Promise.all([
    computeStats(),
    isBlobConfigured() ? pingBlob() : Promise.resolve({ ok: false, ms: 0, container: containerName(), error: 'Not configured' }),
  ]);
  return ok({
    data: stats,
    storage: { configured: isBlobConfigured(), ...blob },
    mail: { configured: isMailConfigured() },
  });
});

/** Tests a MongoDB connection string without saving it (admin only). */
export const POST = route(async (req: NextRequest) => {
  await requireAdmin(req);
  const { mongoUri } = await readJson<{ mongoUri?: string }>(req);
  if (!mongoUri || !/^mongodb(\+srv)?:\/\//.test(mongoUri)) return fail('The URI must start with mongodb:// or mongodb+srv://');
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
  const start = Date.now();
  try {
    await client.connect();
    await client.db().command({ ping: 1 });
    return ok({ message: 'Connected successfully.', pingMs: Date.now() - start });
  } catch (err: any) {
    return ok({ success: false, message: `Connection failed: ${err?.message || 'timeout'}` });
  } finally {
    await client.close().catch(() => {});
  }
});
