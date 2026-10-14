import type { Db } from 'mongodb';
import { COLLECTIONS, nowIso } from './db';
import { hashPassword, normaliseEmail, type UserDoc } from './auth';

/**
 * Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD when the
 * database has no staff accounts yet. Runs once per process on first connect.
 */
export async function ensureBootstrapAdmin(db: Db) {
  const users = db.collection<UserDoc>(COLLECTIONS.users);
  const email = normaliseEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;

  const hasStaff = await users.countDocuments({ staffRole: { $in: ['Global admin', 'Admin'] }, status: 'active' }, { limit: 1 });
  if (hasStaff) return;

  if (!email || !password) {
    console.warn('[bootstrap] No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local, then restart, to create one.');
    return;
  }

  await users.updateOne(
    { email },
    {
      $set: { role: 'staff', staffRole: 'Global admin', status: 'active', passwordHash: await hashPassword(password) },
      $setOnInsert: { _id: `user-admin-${Date.now().toString(36)}`, email, name: process.env.ADMIN_NAME || 'Maxicareer Admin', createdAt: nowIso() },
    },
    { upsert: true }
  );
  console.log(`[bootstrap] Created administrator account ${email}.`);
}
