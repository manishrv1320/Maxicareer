import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { route, readJson, fail, ok } from '@/lib/server/http';
import { col, COLLECTIONS, nowIso } from '@/lib/server/db';
import { normaliseEmail, isValidEmail, rateLimit, limitKey, hashResetToken, type UserDoc } from '@/lib/server/auth';
import { sendMail, supportSender, supportAddress, isMailConfigured } from '@/lib/server/mail';

export const dynamic = 'force-dynamic';

const LINK_MINUTES = 30;

/**
 * Public address for links in emails. Set APP_URL in production so a forged Host header
 * can never point a reset link at another site.
 */
function appUrl(req: NextRequest) {
  const fixed = process.env.APP_URL?.trim().replace(/\/+$/, '');
  if (fixed) return fixed;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!host) return req.nextUrl.origin;
  const proto = req.headers.get('x-forwarded-proto') || (/^(localhost|127\.)/.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}

/**
 * "Forgot password": emails a one-time reset link from the support address.
 * The answer is the same whether or not the account exists, so emails can't be probed.
 */
export const POST = route(async (req: NextRequest) => {
  rateLimit(req, 'pw-forgot', 8, 15 * 60_000);
  const { email: raw } = await readJson<{ email?: string }>(req);
  const email = normaliseEmail(raw);
  if (!isValidEmail(email)) return fail('Please enter a valid email address.');
  // Without an email provider nothing can be delivered, so say so instead of "on its way"
  // (in development the link is still printed to the server console for testing).
  const respond = () =>
    isMailConfigured()
      ? ok({ message: `If ${email} has a Maxicareer account, a reset link is on its way from ${supportAddress()}. It works for ${LINK_MINUTES} minutes.` })
      : fail(`Password reset emails aren't set up yet. Please contact ${supportAddress()} and we'll reset it for you.`, 503);
  const done = respond();

  // At most 3 emails per address per hour, so nobody can flood someone's inbox.
  try {
    limitKey(`pw-forgot:${email}`, 3, 60 * 60_000);
  } catch {
    return done;
  }

  const user = await (await col<UserDoc>(COLLECTIONS.users)).findOne({ email });
  if (!user || user.status === 'disabled' || user.status === 'rejected') return done;

  const token = crypto.randomBytes(32).toString('base64url');
  const resets = await col(COLLECTIONS.passwordResets);
  await resets.deleteMany({ userId: user._id });
  await resets.insertOne({ _id: hashResetToken(token) as any, userId: user._id, email, createdAt: nowIso(), expiresAt: new Date(Date.now() + LINK_MINUTES * 60_000) });

  const link = `${appUrl(req)}/login?reset=${token}`;
  await sendMail({
    from: supportSender(),
    replyTo: supportAddress(),
    to: email,
    subject: 'Reset your Maxicareer password',
    text: [
      `Hi ${user.name || 'there'},`,
      '',
      'We received a request to reset the password for your Maxicareer account.',
      'Open this link to choose a new password:',
      '',
      link,
      '',
      `The link works once and expires in ${LINK_MINUTES} minutes.`,
      "If you didn't ask for this, you can ignore this email. Your password won't change.",
      '',
      'Maxicareer Support',
      supportAddress(),
    ].join('\n'),
  });
  return done;
});
