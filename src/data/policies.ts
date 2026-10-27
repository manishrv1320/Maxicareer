import { OFFICIAL_EMAIL, OFFICIAL_PHONE } from './portalData';

/**
 * Website policies shown at /privacy, /terms and /refund-policy. Admins edit and publish
 * them under Website > Policies; the text below is used until something is published.
 */

export type PolicyKey = 'privacy' | 'terms' | 'refund';

export const POLICY_KEYS: PolicyKey[] = ['privacy', 'terms', 'refund'];

export const POLICY_PATH: Record<PolicyKey, string> = { privacy: '/privacy', terms: '/terms', refund: '/refund-policy' };

/** One section: a heading and plain text. A line starting with "- " is a bullet point. */
export interface PolicySection {
  id: string;
  heading: string;
  body: string;
}

export interface Policy {
  title: string;
  /** Shown as "Last updated …"; free text such as "25 October 2026". */
  updated: string;
  intro: string;
  sections: PolicySection[];
}

export type PolicyBlock = { type: 'p'; text: string } | { type: 'ul'; items: string[] };

/** Splits a section's text into paragraphs (separated by blank lines) and bullet lists. */
export function policyBlocks(body: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
    para = [];
  };
  for (const raw of (body || '').split(/\r?\n/)) {
    const line = raw.trim();
    const bullet = /^[-•*]\s+(.*)$/.exec(line);
    if (bullet) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last?.type === 'ul') last.items.push(bullet[1]);
      else blocks.push({ type: 'ul', items: [bullet[1]] });
    } else if (!line) flush();
    else para.push(line);
  }
  flush();
  return blocks;
}

/** Published policies over the built-in text, ignoring anything malformed. */
export function mergePolicies(published?: Partial<Record<PolicyKey, Partial<Policy>>> | null): Record<PolicyKey, Policy> {
  const out = { ...DEFAULT_POLICIES };
  for (const k of POLICY_KEYS) {
    const p = published?.[k];
    if (p && typeof p.title === 'string' && Array.isArray(p.sections)) out[k] = { ...DEFAULT_POLICIES[k], ...p } as Policy;
  }
  return out;
}

interface SourceSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface SourcePolicy extends Omit<Policy, 'sections'> {
  sections: SourceSection[];
}

const CONTACT = `${OFFICIAL_EMAIL} or ${OFFICIAL_PHONE} (call or WhatsApp)`;

const SOURCE: Record<PolicyKey, SourcePolicy> = {
  privacy: {
    title: 'Privacy policy',
    updated: '25 October 2026',
    intro:
      'This policy explains what personal information Maxicareer collects when you use our website, student portal and counsellor and mentor workspace, why we collect it, who can see it and the choices you have. We follow the Digital Personal Data Protection Act, 2023.',
    sections: [
      {
        heading: 'Information we collect',
        bullets: [
          'Account and profile details: your name, email, phone number, city, school, college or company, cohort, career goals, skills, profile photo and links you add (such as LinkedIn, GitHub or a portfolio).',
          'Program and session records: the program you join, sessions you book and attend, notes your mentor or counsellor writes after a session, tasks, assignments, files you upload (such as your resume), test results, certificates, and feedback or ratings you give.',
          'Messages you exchange with your mentor or counsellor in the portal, and support requests you send us.',
          'Payment records: invoices, amounts, the payment method and the transaction reference you enter. We do not collect or store card numbers, UPI PINs or bank passwords.',
          'Enquiries you send through forms on the website, and your email address if you subscribe to our newsletter.',
          'Technical information: a sign-in cookie that keeps you signed in, and your IP address in server logs, which we use for security and to stop abuse.',
        ],
      },
      {
        heading: 'How we use it',
        bullets: [
          'To run your program: assign your mentor and counsellor, schedule and hold sessions, track your roadmap and progress, and issue certificates.',
          'To send you messages about your account and program, such as sign-in codes, password resets, session confirmations and changes, invoices and renewal reminders.',
          'To send our newsletter, only if you subscribed. Every newsletter has an unsubscribe link.',
          'To answer your enquiries and support requests.',
          'To keep the platform secure, prevent fraud and meet our legal obligations, for example keeping invoice records.',
          'To understand what works and improve our programs. We use summaries for this, not your individual records.',
        ],
      },
      {
        heading: 'Who can see your information',
        paragraphs: ['We do not sell your personal information or share it for advertising.'],
        bullets: [
          'Your assigned mentor and counsellor can see your profile, progress, the work you share and your session history so they can guide you.',
          'Maxicareer staff can see it as their role needs. For example, the finance team sees invoices and website editors don’t see student records.',
          'Service providers who run parts of the platform for us: MongoDB Atlas (database), Microsoft Azure (file storage), our email provider (for system emails and the newsletter) and our hosting provider. They may only use the data to provide their service to us.',
          'Authorities, when the law requires us to share it.',
        ],
      },
      {
        heading: 'How we protect it',
        bullets: [
          'All pages and data are sent over encrypted (HTTPS) connections.',
          'Passwords are stored only as secure hashes, never in readable form.',
          'Uploaded files are kept private and opened through short-lived links.',
          'Staff access is limited by role, and important admin actions are recorded in an audit log.',
        ],
      },
      {
        heading: 'Cookies and browser storage',
        paragraphs: [
          'We use one essential cookie to keep you signed in. Your browser also stores a few preferences, such as the last page you opened and whether the menu is collapsed. We do not use advertising or tracking cookies.',
        ],
      },
      {
        heading: 'How long we keep it',
        paragraphs: [
          'We keep your information while your account is active and for as long as we need it for the purposes above. Some records, such as invoices, are kept for the period the law requires. When you ask us to delete your account, we delete or anonymise your information unless we must keep it by law.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [`You can ask us to do any of the following by writing to ${CONTACT}:`],
        bullets: [
          'See a summary of the personal information we hold about you.',
          'Correct or update it. You can also edit most of your profile yourself in the portal.',
          'Delete your account and personal information.',
          'Withdraw your consent, for example by unsubscribing from the newsletter.',
          'Raise a complaint about how we handled your information. If you are not satisfied with our answer, you can approach the Data Protection Board of India.',
        ],
      },
      {
        heading: 'Students under 18',
        paragraphs: [
          'Many of our school students are under 18. A parent or guardian must agree to this policy and our terms on their behalf, and can contact us at any time to review or delete their child’s information.',
        ],
      },
      {
        heading: 'Changes and contact',
        paragraphs: [
          'If we change this policy we will update the date at the top, and tell signed-in users about significant changes in the portal or by email.',
          `Questions or requests about your data: ${CONTACT}.`,
        ],
      },
    ],
  },

  terms: {
    title: 'Terms of service',
    updated: '25 October 2026',
    intro:
      'These terms apply when you use the Maxicareer website, student portal or counsellor and mentor workspace, and when you join one of our programs or services. By creating an account or paying for a program, you agree to them.',
    sections: [
      {
        heading: 'Our services',
        paragraphs: [
          'Maxicareer offers career guidance, counselling, mentoring, learning material, tests and related services for school students, college students, freshers and working professionals.',
          'Guidance is based on our mentors’ and counsellors’ experience. We will work with you towards your goals, but we cannot guarantee an admission, job offer, placement, salary or exam result.',
        ],
      },
      {
        heading: 'Your account',
        bullets: [
          'Give accurate details and keep them up to date.',
          'Keep your password private. Each account is for one person only.',
          `Tell us straight away at ${OFFICIAL_EMAIL} if you think someone else has used your account.`,
          'If you are under 18, a parent or guardian must agree to these terms on your behalf.',
        ],
      },
      {
        heading: 'Programs, fees and payment',
        bullets: [
          'Prices are shown in Indian rupees on our website and on your invoice.',
          'We send an invoice for each program, renewal or add-on service. Pay using the instructions on the invoice and enter your transaction reference in the portal.',
          'Your program or service starts once we confirm your payment. Program access runs for the period of the plan you chose and can be renewed from the portal.',
          'Refunds and cancellations follow our Refund and cancellation policy.',
        ],
      },
      {
        heading: 'Sessions',
        bullets: [
          'You book 1-on-1 sessions with the mentor and counsellor assigned to you, at the times they make available.',
          'You can reschedule or cancel a session from the portal. Please do this at least 24 hours before it starts so the time can be offered to someone else.',
          'Sessions take place on video-call services such as Google Meet, Zoom or Microsoft Teams, which have their own terms.',
          'Please don’t record a session without the agreement of everyone in it.',
        ],
      },
      {
        heading: 'Acceptable use',
        paragraphs: ['When you use Maxicareer, please do not:'],
        bullets: [
          'Harass, threaten or abuse anyone, including mentors, counsellors, staff and other students.',
          'Share another person’s personal information without their permission.',
          'Upload anything unlawful, harmful or that you don’t have the right to share, or any malicious software.',
          'Try to access accounts, data or parts of the platform you are not allowed to use.',
          'Copy, resell or publish our course material, tests or templates.',
        ],
      },
      {
        heading: 'Content and ownership',
        bullets: [
          'Our programs, curriculum, tests, templates and website content belong to Maxicareer. You may use them for your own learning.',
          'Work you upload, such as your resume or assignments, stays yours. You allow us to store it and show it to your mentor, counsellor and our staff so we can provide the service.',
        ],
      },
      {
        heading: 'Mentors and counsellors',
        paragraphs: [
          'Every mentor and counsellor is reviewed and approved by the Maxicareer team before they can take sessions. They must also follow these terms and treat students’ information as private.',
        ],
      },
      {
        heading: 'Links to other sites',
        paragraphs: [
          'Job openings, events and resources may link to other websites run by employers, colleges or partners. We are not responsible for their content or how they handle your information.',
        ],
      },
      {
        heading: 'Suspension and closing your account',
        paragraphs: [
          'We may suspend or close an account that breaks these terms, after telling you why where we reasonably can. You can ask us to close your account at any time.',
        ],
      },
      {
        heading: 'Limits on our responsibility',
        paragraphs: [
          'We work hard to keep Maxicareer available and accurate, but we provide it as it is and cannot promise it will always be uninterrupted or error-free. To the extent the law allows, our total responsibility to you for any claim is limited to the fees you paid for the program or service the claim relates to.',
        ],
      },
      {
        heading: 'Law and contact',
        paragraphs: [
          'These terms are governed by the laws of India, and disputes are subject to the jurisdiction of Indian courts.',
          'We may update these terms. If a change is significant, we will tell signed-in users before it applies.',
          `Questions: ${CONTACT}.`,
        ],
      },
    ],
  },

  refund: {
    title: 'Refund and cancellation policy',
    updated: '25 October 2026',
    intro: 'How to reschedule or cancel sessions, and when we refund program and service fees.',
    sections: [
      {
        heading: 'Rescheduling and cancelling sessions',
        bullets: [
          'You can reschedule a 1-on-1 session yourself from 1-on-1 sessions in the student portal, choosing another free time with the same mentor or counsellor. Please do this at least 24 hours before the session.',
          'If you miss a session without telling us, it may count as used.',
          'If your mentor or counsellor cancels or can’t attend, we will help you book another time at no extra cost.',
          'Meetings with the Maxicareer team can be cancelled from the portal at any time before they start.',
        ],
      },
      {
        heading: 'Program fees',
        bullets: [
          'Ask within 7 days of payment and before your first session or test, and we will refund the full program fee.',
          'After your program has started, fees for sessions and material already used are not refundable. We review requests for the unused part case by case, for example for medical or family reasons.',
          'Renewals follow the same rules from the date the renewal payment is confirmed.',
        ],
      },
      {
        heading: 'Add-on services',
        bullets: [
          'Services such as resume writing or LinkedIn reviews can be cancelled for a full refund before work on them has started.',
          'Once work has started or been delivered, they are not refundable, but we will revise the work if it doesn’t match what the service describes.',
        ],
      },
      {
        heading: 'How to ask for a refund',
        bullets: [
          `Email ${OFFICIAL_EMAIL} from the address on your account with your invoice number and the reason, or message us on WhatsApp at ${OFFICIAL_PHONE}.`,
          'We reply within 3 working days. Approved refunds are paid back to the original payment method, usually within 7 to 10 working days.',
        ],
      },
    ],
  },
};

const toPolicy = (key: PolicyKey, p: SourcePolicy): Policy => ({
  ...p,
  sections: p.sections.map((sec, i) => ({
    id: `${key}-${i + 1}`,
    heading: sec.heading,
    body: [...(sec.paragraphs || []), ...(sec.bullets?.length ? [sec.bullets.map((b) => `- ${b}`).join('\n')] : [])].join('\n\n'),
  })),
});

export const DEFAULT_POLICIES: Record<PolicyKey, Policy> = {
  privacy: toPolicy('privacy', SOURCE.privacy),
  terms: toPolicy('terms', SOURCE.terms),
  refund: toPolicy('refund', SOURCE.refund),
};
