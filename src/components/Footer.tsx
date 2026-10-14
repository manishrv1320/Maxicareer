import React, { useState } from 'react';
import { scrollToSection } from '../lib/utils';
import { Shield, FileText, Mail, Phone, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { OFFICIAL_EMAIL } from '../data/portalData';
import { EmailModal, EmailModalData } from './EmailModal';

export const Footer: React.FC = () => {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalData, setEmailModalData] = useState<EmailModalData | null>(null);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    scrollToSection(href, 76);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F172A] text-slate-400 pt-16 pb-12 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setModalType('privacy')}
              className="hover:text-slate-300 transition-colors focus:outline-none"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setModalType('terms')}
              className="hover:text-slate-300 transition-colors focus:outline-none"
            >
              Terms of Service
            </button>
            <span>•</span>
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

      {/* Policy Placeholder Modal */}
      {modalType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setModalType(null)}
        >
          <div
            className="bg-white text-[#0F172A] p-6 sm:p-8 rounded-2xl max-w-lg w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-[#2563EB] mb-2 font-bold text-sm">
              {modalType === 'privacy' ? <Shield className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              <span>Legal Notice</span>
            </div>

            <h3 className="text-2xl font-bold mb-4">
              {modalType === 'privacy' ? 'Maxicareer Privacy Policy' : 'Maxicareer Terms of Service'}
            </h3>

            <div className="text-sm text-slate-600 space-y-3 leading-relaxed mb-6">
              <p>
                Maxicareer is committed to safeguarding student data and mentorship records. We only gather information strictly required to coordinate career mentorship sessions and track educational roadmap milestones.
              </p>
              <p>
                This policy outlines our commitment to student confidentiality, safe learning environments, and ethical guidance standards.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalType(null)}
              className="w-full py-2.5 rounded-xl font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Interactive Email Dispatch Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        data={emailModalData}
        onClose={() => setEmailModalOpen(false)}
      />
    </footer>
  );
};
