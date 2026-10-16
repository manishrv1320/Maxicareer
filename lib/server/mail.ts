import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Transactional email. Sent through SMTP when SMTP_HOST, SMTP_USER and SMTP_PASS are set
 * (e.g. Zoho Mail), otherwise through Resend (https://resend.com) when RESEND_API_KEY is set.
 * With neither, emails are logged to the server console instead so local development still works.
 */

const MAIL_VARS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'SUPPORT_MAIL_FROM', 'RESEND_API_KEY'] as const;

/** Mail settings with stray spaces/newlines from copy-pasting into a hosting dashboard removed. */
const env = (name: (typeof MAIL_VARS)[number]) => process.env[name]?.trim() || '';

const smtpConfigured = () => Boolean(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'));

export const isMailConfigured = () => smtpConfigured() || Boolean(env('RESEND_API_KEY'));

/** Sender for account emails such as password resets. The mail provider must allow sending as it. */
export const supportSender = () => env('SUPPORT_MAIL_FROM') || 'Maxicareer Support <support@maxicareer.com>';

/** Plain address of the support sender, used as the reply-to. */
export const supportAddress = () => (supportSender().match(/<([^>]+)>/)?.[1] || supportSender()).trim();

let transport: Transporter | undefined;

function smtp() {
  if (!transport) {
    const port = Number(env('SMTP_PORT')) || 465;
    transport = nodemailer.createTransport({
      host: env('SMTP_HOST'),
      port,
      // 465 is TLS from the first byte; 587 upgrades with STARTTLS.
      secure: port === 465,
      auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transport;
}

/** Default sender: SMTP servers only accept the signed-in account (or one of its aliases). */
const defaultSender = () => env('MAIL_FROM') || `Maxicareer <${env('SMTP_USER')}>`;

/**
 * For the admin status page: signs in to the mail server without sending anything, and lists
 * settings that had stray spaces (already ignored). Never returns the password.
 */
export async function pingMail(): Promise<{ ok: boolean; ms: number; via: 'smtp' | 'resend' | 'none'; host?: string; user?: string; from?: string; supportFrom?: string; trimmed: string[]; error?: string }> {
  const trimmed = MAIL_VARS.filter((name) => {
    const raw = process.env[name];
    return raw !== undefined && raw !== raw.trim();
  });
  const start = Date.now();
  if (!smtpConfigured()) {
    return { ok: Boolean(env('RESEND_API_KEY')), ms: 0, via: env('RESEND_API_KEY') ? 'resend' : 'none', trimmed };
  }
  const details = { via: 'smtp' as const, host: `${env('SMTP_HOST')}:${Number(env('SMTP_PORT')) || 465}`, user: env('SMTP_USER'), from: defaultSender(), supportFrom: supportSender(), trimmed };
  try {
    await smtp().verify();
    return { ok: true, ms: Date.now() - start, ...details };
  } catch (err: any) {
    return { ok: false, ms: Date.now() - start, ...details, error: [err?.code, err?.responseCode, err?.response || err?.message].filter(Boolean).join(' ') };
  }
}

export async function sendMail(opts: { to: string | string[]; subject: string; text: string; replyTo?: string; from?: string }): Promise<boolean> {
  if (smtpConfigured()) {
    const from = opts.from || defaultSender();
    try {
      await smtp().sendMail({ from, to: opts.to, subject: opts.subject, text: opts.text, replyTo: opts.replyTo });
      return true;
    } catch (err) {
      console.error('[mail] SMTP server rejected the email:', err);
      return false;
    }
  }

  const key = env('RESEND_API_KEY');
  const from = opts.from || env('MAIL_FROM') || 'Maxicareer <onboarding@resend.dev>';
  if (!key) {
    console.log(`[mail] (not sent; no SMTP_* or RESEND_API_KEY) from=${from} to=${opts.to} subject="${opts.subject}"\n${opts.text}`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, text: opts.text, reply_to: opts.replyTo }),
    });
    if (!res.ok) {
      console.error('[mail] Resend rejected the email:', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[mail] Failed to reach Resend:', err);
    return false;
  }
}
