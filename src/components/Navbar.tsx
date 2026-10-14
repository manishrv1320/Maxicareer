import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Mail, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { scrollToSection } from '../lib/utils';
import { BrandLogo } from './BrandLogo';
import { StudentProfile } from '../types';
import { OFFICIAL_EMAIL } from '../data/portalData';
import { CornerProfileMenu } from './CornerProfileMenu';

interface NavbarProps {
  onBookConsultation: () => void;
  onOpenStudentPortal: () => void;
  onOpenSignIn: () => void;
  onOpenRegister?: () => void;
  userProfile?: StudentProfile | null;
  onOpenDashboard?: () => void;
  onLogout?: () => void;
  onSwitchProfile?: (profile: StudentProfile) => void;
  isAdminView?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onBookConsultation,
  onOpenStudentPortal,
  onOpenSignIn,
  onOpenRegister,
  userProfile,
  onOpenDashboard,
  onLogout,
  onSwitchProfile,
  isAdminView = false,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navLinks = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'services', label: 'Programs & Courses', href: '#services' },
    { id: 'addon-services', label: 'Services', href: '#addon-services' },
    { id: 'about', label: 'About', href: '#about' },
    { id: 'why-us', label: 'Why Us', href: '#why-us' },
    { id: 'contact', label: 'Contact', href: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Section spy
      const sections = [
        'home',
        'services',
        'addon-services',
        'about',
        'why-us',
        'contact',
      ];
      const scrollPosition = window.scrollY + 120;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    scrollToSection(href, 76);
  };

  const handleBookClick = () => {
    setMobileMenuOpen(false);
    onBookConsultation();
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md shadow-slate-900/5 border-b border-slate-200/80 py-2 sm:py-2.5'
          : 'bg-white/90 backdrop-blur-md border-b border-slate-100 py-3 sm:py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 lg:gap-6 h-14 sm:h-16">
          {/* Top-Left: Maxicareer Logo */}
          <a
            id="brand-logo-link"
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center group transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl p-1 -ml-1 flex-shrink-0"
            aria-label="Maxicareer - Back to Homepage"
          >
            <BrandLogo variant="default" size="md" alt="Maxicareer logo" className="max-sm:[&_img]:h-8" />
          </a>

          {/* Center: Desktop Navigation Links with animated hover underline */}
          <nav
            id="desktop-nav"
            className="hidden lg:flex items-center space-x-1 xl:space-x-2 flex-shrink-0"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`relative px-2.5 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm font-semibold transition-colors duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg group ${
                    isActive ? 'text-[#2563EB]' : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                  {/* Hover & Active Animated Underline Bar */}
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0.5 left-2.5 right-2.5 xl:left-3 xl:right-3 h-0.5 bg-[#2563EB] rounded-full transition-all duration-300 origin-center ${
                      isActive
                        ? 'opacity-100 scale-x-100'
                        : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Far Right: Contact Email, and Corner Login / Profile when logged in */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
            {/* Official Contact Email */}
            <a
              id="navbar-contact-email"
              href={`mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent('Maxicareer Career Guidance Inquiry')}`}
              className="hidden 2xl:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#2563EB] px-2.5 py-1.5 rounded-xl hover:bg-blue-50/70 border border-slate-200/60 hover:border-blue-200 transition-all duration-200 whitespace-nowrap flex-shrink-0"
              aria-label={`Email Maxicareer: ${OFFICIAL_EMAIL}`}
              title={`Send email to ${OFFICIAL_EMAIL}`}
            >
              <Mail className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
              <span>{OFFICIAL_EMAIL}</span>
            </a>

            {/* Right Corner: one Login button (the login page also creates accounts), or Profile menu when logged in */}
            {!userProfile ? (
              <button
                id="navbar-login-btn"
                type="button"
                onClick={onOpenSignIn}
                className="inline-flex items-center gap-2 px-4 py-2 xl:px-5 rounded-xl text-xs xl:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md hover:shadow-blue-500/20 transition-all duration-200 whitespace-nowrap active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Login / Sign up</span>
              </button>
            ) : (
              <CornerProfileMenu
                userProfile={userProfile}
                onOpenSignIn={onOpenSignIn}
                onOpenRegister={onOpenRegister || onOpenStudentPortal}
                onOpenDashboard={onOpenDashboard || onOpenStudentPortal}
                onLogout={onLogout || (() => {})}
                onSwitchProfile={onSwitchProfile || (() => {})}
                onBookConsultation={handleBookClick}
              />
            )}
          </div>

          {/* Mobile & Tablet Right Controls: Login or Profile + Hamburger Toggle */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
            {!userProfile ? (
              <button
                id="mobile-header-login-btn"
                type="button"
                onClick={onOpenSignIn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login / Sign up</span>
              </button>
            ) : (
              <CornerProfileMenu
                userProfile={userProfile}
                onOpenSignIn={onOpenSignIn}
                onOpenRegister={onOpenRegister || onOpenStudentPortal}
                onOpenDashboard={onOpenDashboard || onOpenStudentPortal}
                onLogout={onLogout || (() => {})}
                onSwitchProfile={onSwitchProfile || (() => {})}
                onBookConsultation={handleBookClick}
              />
            )}

            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-[#2563EB] hover:bg-slate-100/80 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Smooth Animated Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-xl"
          >
            <div className="px-4 pt-3 pb-6 flex flex-col space-y-1.5">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    id={`mobile-nav-${link.id}`}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 flex items-center justify-between active:scale-[0.98] ${
                      isActive
                        ? 'text-[#2563EB] bg-blue-50/90 font-bold'
                        : 'text-slate-700 hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#2563EB]" />}
                  </a>
                );
              })}

              {/* Student Portal & Auth Section in Mobile Menu */}
              <div className="pt-2 pb-1 border-t border-slate-100 my-1 space-y-2">
                {userProfile ? (
                  <div className="space-y-2">
                    <button
                      id="mobile-nav-dashboard-btn"
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onOpenDashboard) onOpenDashboard();
                        else onOpenStudentPortal();
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                          {userProfile.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold">{userProfile.name}</div>
                          <div className="text-[11px] text-emerald-700">{userProfile.planName}</div>
                        </div>
                      </div>
                      <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Dashboard
                      </span>
                    </button>

                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors text-center"
                      >
                        Sign Out / Log Out
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      id="mobile-nav-login-btn"
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenSignIn();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm hover:border-blue-300 hover:text-[#2563EB] transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login / Sign up</span>
                    </button>

                    <button
                      id="mobile-nav-book-btn"
                      type="button"
                      onClick={handleBookClick}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm transition-colors shadow-xs"
                    >
                      <span>Book a Consultation</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Official Contact Email in Mobile Menu Drawer */}
              <div className="space-y-1.5 pt-1">
                <a
                  id="mobile-nav-email-link"
                  href={`mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent('Maxicareer Inquiry')}`}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-slate-700 hover:text-[#2563EB] hover:bg-blue-50 transition-colors active:scale-[0.98]"
                  aria-label={`Email: ${OFFICIAL_EMAIL}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">Official Email</span>
                    <span className="text-xs font-semibold text-[#0F172A] break-all">{OFFICIAL_EMAIL}</span>
                  </div>
                </a>
              </div>

              <div className="pt-2">
                <button
                  id="mobile-book-btn"
                  type="button"
                  onClick={handleBookClick}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-base font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] active:translate-y-0 shadow-md shadow-blue-500/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span>Book a Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
