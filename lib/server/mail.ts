/**
 * Transactional email through Resend (https://resend.com). When RESEND_API_KEY is not
 * set, emails are logged to the server console instead so local development still works.
 */

export const isMailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/** Sender for account emails such as password resets. The domain must be verified in Resend. */
export const supportSender = () => process.env.SUPPORT_MAIL_FROM || 'Maxicareer Support <support@maxicareer.com>';

/** Plain address of the support sender, used as the reply-to. */
export const supportAddress = () => (supportSender().match(/<([^>]+)>/)?.[1] || supportSender()).trim();

export async function sendMail(opts: { to: string | string[]; subject: string; text: string; replyTo?: string; from?: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = opts.from || process.env.MAIL_FROM || 'Maxicareer <onboarding@resend.dev>';
  if (!key) {
    console.log(`[mail] (not sent; RESEND_API_KEY missing) from=${from} to=${opts.to} subject="${opts.subject}"\n${opts.text}`);
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
