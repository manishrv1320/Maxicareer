import { col, COLLECTIONS, newId, nowIso } from './db';

export type AdminNotificationCategory = 'students' | 'applications' | 'sessions' | 'approvals' | 'website' | 'system';

/** Adds an item to the admin portal's shared notification feed. */
export async function notifyAdmins(n: {
  id?: string;
  title: string;
  body: string;
  category: AdminNotificationCategory;
  priority?: 'normal' | 'high';
  link?: string;
}) {
  const notifications = await col(COLLECTIONS.adminNotifications);
  const _id = n.id || newId('n');
  await notifications.updateOne(
    { _id: _id as any },
    {
      $setOnInsert: {
        title: n.title,
        body: n.body,
        category: n.category,
        priority: n.priority || 'normal',
        link: n.link,
        read: false,
        createdAt: nowIso(),
      },
    },
    { upsert: true }
  );
}

export type UserNotificationCategory = 'Mentorship' | 'Sessions' | 'Courses' | 'System';

/** Adds a notification for one student, counsellor or mentor (keyed by their profile id). */
export async function notifyUser(n: {
  recipientId: string;
  title: string;
  description: string;
  category: UserNotificationCategory;
  actionTab?: string;
  actionText?: string;
}) {
  const notifications = await col(COLLECTIONS.userNotifications);
  await notifications.insertOne({
    _id: newId('un') as any,
    recipientId: n.recipientId,
    title: n.title,
    description: n.description,
    category: n.category,
    actionTab: n.actionTab,
    actionText: n.actionText,
    read: false,
    createdAt: nowIso(),
  });
}

export async function audit(actor: string, module: string, action: string, target: string) {
  const logs = await col(COLLECTIONS.auditLogs);
  await logs.insertOne({ _id: newId('log') as any, at: nowIso(), actor, module, action, target });
}
