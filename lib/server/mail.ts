import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Transactional email. Sent through SMTP when SMTP_HOST, SMTP_USER and SMTP_PASS are set
 * (e.g. Zoho Mail), otherwise through Resend (https://resend.com) when RESEND_API_KEY is set.
 * With neither, emails are logged to the server console instead so local development still works.
 */

const smtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export const isMailConfigured = () => smtpConfigured() || Boolean(process.env.RESEND_API_KEY);

/** Sender for account emails such as password resets. The mail provider must allow sending as it. */
export const supportSender = () => process.env.SUPPORT_MAIL_FROM || 'Maxicareer Support <support@maxicareer.com>';

/** Plain address of the support sender, used as the reply-to. */
export const supportAddress = () => (supportSender().match(/<([^>]+)>/)?.[1] || supportSender()).trim();

let transport: Transporter | undefined;

function smtp() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 is TLS from the first byte; 587 upgrades with STARTTLS.
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transport;
}

export async function sendMail(opts: { to: string | string[]; subject: string; text: string; replyTo?: string; from?: string }): Promise<boolean> {
  if (smtpConfigured()) {
    // SMTP servers only accept the signed-in account (or one of its aliases) as the sender.
    const from = opts.from || process.env.MAIL_FROM || `Maxicareer <${process.env.SMTP_USER}>`;
    try {
      await smtp().sendMail({ from, to: opts.to, subject: opts.subject, text: opts.text, replyTo: opts.replyTo });
      return true;
    } catch (err) {
      console.error('[mail] SMTP server rejected the email:', err);
      return false;
    }
  }

  const key = process.env.RESEND_API_KEY;
  const from = opts.from || process.env.MAIL_FROM || 'Maxicareer <onboarding@resend.dev>';
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
