'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { OFFICIAL_EMAIL } from '../data/portalData';

export const POLICY_LINKS = [
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of service' },
  { href: '/refund-policy', label: 'Refund & cancellation' },
];

/** Header and footer for the website's standalone pages (events, policies). */
export const PublicPageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <a href="/" aria-label="Maxicareer home">
          <BrandLogo size="md" />
        </a>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm font-semibold" aria-label="Website">
          <a href="/" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4" /> Home
          </a>
          <a href="/events" className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            Events
          </a>
          <a href="/careers" className="hidden sm:inline-flex px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            Careers
          </a>
          <a href="/?portal=student" className="px-4 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700">
            Student portal
          </a>
        </nav>
      </div>
    </header>

    <main className="flex-1">{children}</main>

    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-sm text-slate-500 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <span suppressHydrationWarning>© {new Date().getFullYear()} Maxicareer</span>
        <nav className="flex flex-wrap gap-x-5 gap-y-1" aria-label="Policies">
          {POLICY_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-slate-800">
              {l.label}
            </a>
          ))}
          <a href={`mailto:${OFFICIAL_EMAIL}`} className="hover:text-slate-800">
            {OFFICIAL_EMAIL}
          </a>
        </nav>
      </div>
    </footer>
  </div>
);
