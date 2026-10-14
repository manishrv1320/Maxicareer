/**
 * Utility functions for Maxicareer
 */

export function scrollToSection(sectionId: string, offset: number = 80): void {
  const cleanId = sectionId.replace('#', '');
  const element = document.getElementById(cleanId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function createGmailComposeUrl(recipient: string, subject?: string, body?: string): string {
  const encSubject = encodeURIComponent(subject || 'Maxicareer Career Consultation & Mentorship');
  const encBody = encodeURIComponent(body || 'Hello Maxicareer Team,\n\nI would like to inquire about career guidance programs.');
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encSubject}&body=${encBody}`;
}

export function createOutlookComposeUrl(recipient: string, subject?: string, body?: string): string {
  const encSubject = encodeURIComponent(subject || 'Maxicareer Career Consultation & Mentorship');
  const encBody = encodeURIComponent(body || 'Hello Maxicareer Team,\n\nI would like to inquire about career guidance programs.');
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(recipient)}&subject=${encSubject}&body=${encBody}`;
}

export function createMailtoUrl(recipient: string, subject?: string, body?: string): string {
  const encSubject = encodeURIComponent(subject || 'Maxicareer Career Consultation & Mentorship');
  const encBody = encodeURIComponent(body || 'Hello Maxicareer Team,\n\nI would like to inquire about career guidance programs.');
  return `mailto:${recipient}?subject=${encSubject}&body=${encBody}`;
}

/**
 * Opens email composer addressed to Maxicareer.
 * Uses Gmail web compose in a new tab or triggers the email modal event,
 * avoiding iframe sandbox blockage where window.location.href = "mailto:..." fails silently.
 */
export function openEmailComposer(recipient: string, subject?: string, body?: string): void {
  if (typeof window === 'undefined') return;

  const detail = {
    recipient,
    subject: subject || 'Maxicareer Career Consultation & Mentorship',
    body: body || 'Hello Maxicareer Team,\n\nI would like to know more about career guidance and mentorship programs.\n\nThank you.',
  };

  // Dispatch custom event for EmailModal
  const event = new CustomEvent('maxicareer:open-email', { detail });
  window.dispatchEvent(event);

  // Also open Gmail web compose in a new tab if supported
  const gmailUrl = createGmailComposeUrl(detail.recipient, detail.subject, detail.body);
  try {
    const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      // If popup blocked, create safe anchor
      const a = document.createElement('a');
      a.href = createMailtoUrl(detail.recipient, detail.subject, detail.body);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch {
    // safe fallback
  }
}
