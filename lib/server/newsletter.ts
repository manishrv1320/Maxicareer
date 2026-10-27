import crypto from 'node:crypto';
import { getDb, COLLECTIONS, newId, nowIso } from './db';
import { HttpError, normaliseEmail, isValidEmail, type UserDoc } from './auth';
import { sendMail, isMailConfigured, supportAddress } from './mail';
import { audit } from './notify';
import { str } from './http';

/**
 * Newsletter: visitors subscribe from the website footer, admins write issues in the admin
 * portal and send them by email. Every email carries the subscriber's own unsubscribe link.
 */

export interface SubscriberDoc {
  _id: string;
  email: string;
  name: string;
  /** 'website' (footer form) or 'admin' (added by staff). */
  source: string;
  status: 'subscribed' | 'unsubscribed';
  /** Secret in each email's unsubscribe link. Never sent to the admin portal. */
  unsubscribeToken: string;
  createdAt: string;
  unsubscribedAt?: string;
  resubscribedAt?: string;
}

export type NewsletterStatus = 'Draft' | 'Sending' | 'Sent';

const newToken = () => crypto.randomBytes(24).toString('base64url');

const subscribers = async () => (await getDb()).collection<SubscriberDoc>(COLLECTIONS.newsletterSubscribers);

/* ------------------------------------------------------------------ */
/* Website sign-up and unsubscribe                                     */
/* ------------------------------------------------------------------ */

/** Footer sign-up. Signing up again after unsubscribing turns the subscription back on. */
export async function subscribe(rawEmail: unknown, rawName: unknown) {
  const email = normaliseEmail(rawEmail);
  if (!isValidEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
  const subs = await subscribers();
  const existing = await subs.findOne({ email });
  if (existing) {
    if (existing.status !== 'subscribed') {
      await subs.updateOne({ _id: existing._id }, { $set: { status: 'subscribed', resubscribedAt: nowIso() }, $unset: { unsubscribedAt: '' } });
    }
    return;
  }
  try {
    await subs.insertOne({ _id: newId('sub'), email, name: str(rawName, 120), source: 'website', status: 'subscribed', unsubscribeToken: newToken(), createdAt: nowIso() });
  } catch (err: any) {
    // The same address signed up twice at once; the other request already added it.
    if (err?.code !== 11000) throw err;
  }
}

async function byToken(token: unknown) {
  const t = str(token, 100);
  const sub = t ? await (await subscribers()).findOne({ unsubscribeToken: t }) : null;
  if (!sub) throw new HttpError(404, "This unsubscribe link isn't valid. Use the link from your most recent Maxicareer newsletter.");
  return sub;
}

/** What the unsubscribe page shows. Reading changes nothing, because mail scanners open links. */
export async function subscriptionFor(token: unknown) {
  const sub = await byToken(token);
  return { email: sub.email, status: sub.status };
}

export async function unsubscribe(token: unknown) {
  const sub = await byToken(token);
  if (sub.status === 'subscribed') {
    await (await subscribers()).updateOne({ _id: sub._id }, { $set: { status: 'unsubscribed', unsubscribedAt: nowIso() } });
  }
  return { email: sub.email, status: 'unsubscribed' as const };
}

/* ------------------------------------------------------------------ */
/* Admin edits (through the shared admin collections)                  */
/* ------------------------------------------------------------------ */

/** Keeps the list clean: valid, unique emails, and only the subscriber can opt back in. */
export async function prepareSubscriber(doc: Record<string, any>, prev: Record<string, any> | undefined) {
  const email = normaliseEmail(doc.email);
  if (!isValidEmail(email)) throw new HttpError(400, `"${doc.email}" is not a valid email.`);
  if (!prev || prev.email !== email) {
    const taken = await (await subscribers()).findOne({ email, _id: { $ne: doc._id } }, { projection: { _id: 1 } });
    if (taken) throw new HttpError(409, `${email} is already on the list.`);
  }
  doc.email = email;
  doc.name = str(doc.name, 120);
  doc.source = prev?.source || 'admin';
  doc.createdAt = prev?.createdAt || str(doc.createdAt, 40) || nowIso();
  doc.unsubscribeToken = prev?.unsubscribeToken || newToken();
  doc.status = doc.status === 'unsubscribed' ? 'unsubscribed' : 'subscribed';
  if (prev?.status === 'unsubscribed' && doc.status === 'subscribed') {
    throw new HttpError(400, `${email} unsubscribed, so only they can sign up again (from the website).`);
  }
  if (doc.status === 'unsubscribed') doc.unsubscribedAt = prev?.unsubscribedAt || nowIso();
}

/** Written only by the server while an issue goes out. */
const DELIVERY_FIELDS = ['recipients', 'sentCount', 'failedCount', 'cursor', 'lockedUntil', 'startedAt', 'sentAt', 'sentBy'];

/** Admins edit drafts; once sending starts, the issue can't change. */
export function prepareNewsletter(doc: Record<string, any>, prev: Record<string, any> | undefined) {
  if (prev && prev.status !== 'Draft') throw new HttpError(409, "This newsletter has already gone out, so it can't be changed. Duplicate it instead.");
  doc.status = 'Draft';
  for (const f of DELIVERY_FIELDS) delete doc[f];
  doc.subject = str(doc.subject, 200);
  doc.body = str(doc.body, 20000);
  doc.createdAt = prev?.createdAt || str(doc.createdAt, 40) || nowIso();
  doc.updatedAt = nowIso();
}

/* ------------------------------------------------------------------ */
/* Sending                                                             */
/* ------------------------------------------------------------------ */

/** Each request stops sending after this long, well inside hosting time limits. */
const BATCH_MS = 6_000;
const BATCH_SIZE = 25;

const withFooter = (body: string, unsubscribeUrl: string) =>
  `${body}\n\n—\nYou're getting this email because you subscribed to the Maxicareer newsletter.\nUnsubscribe: ${unsubscribeUrl}`;

export type SendProgress = {
  status: NewsletterStatus;
  recipients: number;
  sentCount: number;
  failedCount: number;
};

const progressOf = (d: Record<string, any>): SendProgress => ({
  status: d.status,
  recipients: d.recipients || 0,
  sentCount: d.sentCount || 0,
  failedCount: d.failedCount || 0,
});

/**
 * Sends the next few emails of an issue to subscribers, in id order. The admin page calls
 * this until the status is 'Sent'. A short lock stops two admins (or two tabs) sending the
 * same batch twice.
 */
export async function sendNewsletterBatch(actor: UserDoc, id: string, baseUrl: string): Promise<SendProgress> {
  const db = await getDb();
  const issues = db.collection(COLLECTIONS.newsletters);
  const issue = await issues.findOne({ _id: id as any });
  if (!issue) throw new HttpError(404, 'That newsletter no longer exists.');
  if (issue.status === 'Sent') return progressOf(issue);
  if (!isMailConfigured()) throw new HttpError(503, "Email isn't set up yet, so newsletters can't be sent. Check Settings > Connections.");
  const subs = await subscribers();

  if (issue.status === 'Draft') {
    if (!issue.subject || !issue.body) throw new HttpError(400, 'Add a subject and a message first.');
    const recipients = await subs.countDocuments({ status: 'subscribed' });
    if (!recipients) throw new HttpError(400, 'Nobody is subscribed yet.');
    await issues.updateOne(
      { _id: id as any, status: 'Draft' },
      { $set: { status: 'Sending', recipients, sentCount: 0, failedCount: 0, cursor: '', startedAt: nowIso(), sentBy: actor.email } }
    );
  }

  const now = Date.now();
  const claimed = await issues.findOneAndUpdate(
    { _id: id as any, status: 'Sending', $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lt: now } }] },
    { $set: { lockedUntil: now + 60_000 } },
    { returnDocument: 'after' }
  );
  if (!claimed) {
    // Someone else is sending this batch (or just finished): report where it stands.
    const current = await issues.findOne({ _id: id as any });
    if (!current) throw new HttpError(404, 'That newsletter no longer exists.');
    return progressOf(current);
  }

  const batch = await subs
    .find({ status: 'subscribed', _id: { $gt: String(claimed.cursor || '') } })
    .sort({ _id: 1 })
    .limit(BATCH_SIZE)
    .toArray();
  const deadline = Date.now() + BATCH_MS;
  let cursor = String(claimed.cursor || '');
  let sent = 0;
  let failed = 0;
  for (const s of batch) {
    if (Date.now() > deadline) break;
    const token = encodeURIComponent(s.unsubscribeToken);
    const ok = await sendMail({
      to: s.email,
      subject: claimed.subject,
      text: withFooter(claimed.body, `${baseUrl}/newsletter/unsubscribe?token=${token}`),
      replyTo: supportAddress(),
      // One-click unsubscribe in Gmail, Outlook and Apple Mail (RFC 8058).
      headers: { 'List-Unsubscribe': `<${baseUrl}/api/newsletter/unsubscribe?token=${token}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    });
    if (ok) sent++;
    else failed++;
    cursor = s._id;
  }
  const finished = batch.length < BATCH_SIZE && (batch.length === 0 || cursor === batch[batch.length - 1]._id);

  const updated = await issues.findOneAndUpdate(
    { _id: id as any },
    { $set: { cursor, ...(finished ? { status: 'Sent', sentAt: nowIso() } : {}) }, $inc: { sentCount: sent, failedCount: failed }, $unset: { lockedUntil: '' } },
    { returnDocument: 'after' }
  );
  if (!updated) throw new HttpError(404, 'That newsletter no longer exists.');
  if (finished) {
    const failures = updated.failedCount ? `, ${updated.failedCount} failed` : '';
    await audit(actor.email, 'Newsletter', 'Sent newsletter', `${updated.subject} · ${updated.sentCount || 0} delivered${failures}`);
  }
  return progressOf(updated);
}

/** Sends an issue to the admin themself, to check it before it goes to everyone. */
export async function sendTestNewsletter(actor: UserDoc, rawSubject: unknown, rawBody: unknown, baseUrl: string) {
  const subject = str(rawSubject, 200);
  const body = str(rawBody, 20000);
  if (!subject || !body) throw new HttpError(400, 'Add a subject and a message first.');
  if (!isMailConfigured()) throw new HttpError(503, "Email isn't set up yet, so newsletters can't be sent. Check Settings > Connections.");
  const ok = await sendMail({ to: actor.email, subject: `[Test] ${subject}`, text: withFooter(body, `${baseUrl}/newsletter/unsubscribe`), replyTo: supportAddress() });
  if (!ok) throw new HttpError(502, "The mail server didn't accept the test email. Check Settings > Connections.");
  return { to: actor.email };
}
