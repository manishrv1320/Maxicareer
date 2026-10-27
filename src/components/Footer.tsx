import React, { useState } from 'react';
import { scrollToSection } from '../lib/utils';
import { Mail, Phone, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { OFFICIAL_EMAIL } from '../data/portalData';
import { EmailModal, EmailModalData } from './EmailModal';
import { apiSend } from '../lib/api';
import { POLICY_LINKS } from './PublicPageShell';

export const Footer: React.FC = () => {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalData, setEmailModalData] = useState<EmailModalData | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletter, setNewsletter] = useState<{ state: 'idle' | 'sending' | 'done' | 'error'; message?: string }>({ state: 'idle' });

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletter({ state: 'sending' });
    try {
      const res = await apiSend<{ message: string }>('/api/newsletter', { email: newsletterEmail });
      setNewsletter({ state: 'done', message: res.message });
      setNewsletterEmail('');
    } catch (err) {
      setNewsletter({ state: 'error', message: err instanceof Error ? err.message : 'Could not subscribe. Please try again.' });
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    scrollToSection(href, 76);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F172A] text-slate-400 pt-16 pb-12 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter sign-up */}
        <section id="newsletter" aria-labelledby="newsletter-heading" className="mb-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="lg:flex-1">
            <h3 id="newsletter-heading" className="text-lg sm:text-xl font-bold text-white">
              Get career tips in your inbox
            </h3>
            <p className="mt-1 text-sm text-slate-400 leading-relaxed max-w-xl">
              The Maxicareer newsletter: placement and interview tips, upcoming events and new openings. At most twice a month; unsubscribe any time.
            </p>
          </div>
          {newsletter.state === 'done' ? (
            <p className="lg:w-[440px] flex items-start gap-2 text-sm font-medium text-emerald-400" role="status">
              <CheckCircle2 className="w-5 h-5 shrink-0" /> {newsletter.message}
            </p>
          ) : (
            <form onSubmit={subscribe} className="lg:w-[440px]">
              <div className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 min-w-0 h-11 rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/25"
                />
                <button
                  type="submit"
                  disabled={newsletter.state === 'sending'}
                  className="h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {newsletter.state === 'sending' ? 'Subscribing…' : 'Subscribe'}
                </button>
              </div>
              {newsletter.state === 'error' && (
                <p className="mt-2 text-sm text-rose-400" role="alert">
                  {newsletter.message}
                </p>
              )}
            </form>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
          {/* Brand Info (Col 1-4) */}
          <div className="lg:col-span-4 space-y-4">
            <a
              id="footer-logo-link"
              href="#home"
              onClick={(e) => handleNavClick(e, '#home')}
              className="inline-block p-1 -ml-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg group"
              aria-label="Maxicareer - Return to Homepage"
            >
              <BrandLogo variant="dark" size="xl" alt="Maxicareer" />
            </a>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Your Career Journey Starts with the Right Guidance. Maxicareer helps students and
              aspiring professionals build clarity, master in-demand skills, and move confidently
              toward career fulfillment.
            </p>

            <div className="pt-2 text-xs text-slate-500 font-medium">
              <span>Guidance • Skills • Mentorship • Confidence</span>
            </div>
          </div>

          {/* Quick Links (Col 5-7) */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Quick Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#home"
                  onClick={(e) => handleNavClick(e, '#home')}
                  className="hover:text-white transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleNavClick(e, '#about')}
                  className="hover:text-white transition-colors"
                >
                  About Maxicareer
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleNavClick(e, '#services')}
                  className="hover:text-white transition-colors"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="#why-us"
                  onClick={(e) => handleNavClick(e, '#why-us')}
                  className="hover:text-white transition-colors"
                >
                  Why Us
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleNavClick(e, '#how-it-works')}
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleNavClick(e, '#contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a href="/events" className="hover:text-white transition-colors">
                  Events
                </a>
              </li>
              <li>
                <a href="/careers" className="hover:text-white transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="/portal" className="hover:text-white transition-colors">
                  Counsellor &amp; mentor login
                </a>
              </li>
            </ul>
          </div>

          {/* Services (Col 8-9) */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Our Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleNavClick(e, '#services')}
                  className="hover:text-white transition-colors"
                >
                  Career Guidance
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleNavClick(e, '#services')}
                  className="hover:text-white transition-colors"
                >
                  Skill Development
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleNavClick(e, '#services')}
                  className="hover:text-white transition-colors"
                >
                  One-to-One Mentorship
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleNavClick(e, '#services')}
                  className="hover:text-white transition-colors"
                >
                  Interview &amp; Resume Prep
                </a>
              </li>
            </ul>
          </div>

          {/* Direct Contact (Col 10-12) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Contact Information
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Have questions about our guidance, mentorship, or career services? Reach out to us directly via WhatsApp or Email.
            </p>

            {/* Email Contact */}
            <div className="pt-2 flex items-start gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-[#38BDF8] flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-700/60">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email
                </span>
                <button
                  type="button"
                  id="footer-email-link"
                  onClick={() => {
                    setEmailModalData({
                      recipient: OFFICIAL_EMAIL,
                      subject: 'Maxicareer Mentorship & Career Inquiry',
                      body: 'Dear Maxicareer Team,\n\nI would like to get in touch regarding career guidance and mentorship programs.\n\nThank you!',
                      title: 'Contact Maxicareer via Email',
                      subtitle: `Direct to ${OFFICIAL_EMAIL}`,
                    });
                    setEmailModalOpen(true);
                  }}
                  className="text-sm sm:text-base font-bold text-[#38BDF8] hover:text-white transition-colors break-all text-left cursor-pointer"
                  aria-label="Email Maxicareer: contact@maxicareer.com"
                >
                  contact@maxicareer.com
                </button>
              </div>
            </div>

            {/* Phone & WhatsApp Contact */}
            <div className="pt-1 flex items-start gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-700/60">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Phone &bull; WhatsApp
                </span>
                <a
                  id="footer-phone-link"
                  href="https://wa.me/919789730097"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base font-bold text-emerald-400 hover:text-white transition-colors"
                  aria-label="WhatsApp or Call Maxicareer: +91 9789730097"
                >
                  +91 9789730097
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-500 pt-2">
              Virtual 1-on-1 Mentorship Sessions &bull; Flexible Scheduling &bull; India &amp; Global
            </p>
          </div>
        </div>

        {/* Bottom Bar with exact copyright spelling */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p suppressHydrationWarning>© {currentYear} Maxicareer. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {POLICY_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-slate-300 transition-colors">
                {l.label}
              </a>
            ))}
            <a
              id="footer-admin-link"
              href="/admin"
              className="hover:text-blue-400 transition-colors focus:outline-none inline-flex items-center gap-1 font-semibold text-slate-400"
              title="Open Admin Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Admin Portal</span>
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Email Dispatch Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        data={emailModalData}
        onClose={() => setEmailModalOpen(false)}
      />
    </footer>
  );
};
