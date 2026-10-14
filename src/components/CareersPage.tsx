'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, CalendarClock, ChevronDown, ExternalLink, Mail, MapPin, Search, Wallet } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import type { CareerOpening } from '../types/portal';

const fmt = (iso?: string) => (iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const daysLeft = (iso?: string) => {
  if (!iso) return null;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${iso.slice(0, 10)}T00:00:00`).getTime() - t.getTime()) / 86_400_000);
};

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[12px] font-semibold text-[#1D4ED8]">{children}</span>
);

/** Public list of jobs and internships posted from the admin Career page. */
export const CareersPage: React.FC = () => {
  const [openings, setOpenings] = useState<CareerOpening[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [mode, setMode] = useState('all');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/careers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((res) => {
        setOpenings(Array.isArray(res.openings) ? res.openings : []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  const shown = useMemo(
    () =>
      openings.filter(
        (o) =>
          (type === 'all' || o.type === type) &&
          (mode === 'all' || o.workMode === mode) &&
          (!q || `${o.title} ${o.company} ${o.location} ${o.department} ${o.description}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [openings, q, type, mode]
  );
  const types = Array.from(new Set(openings.map((o) => o.type)));

  const applyHref = (o: CareerOpening) =>
    o.applyUrl || `mailto:${o.applyEmail}?subject=${encodeURIComponent(`Application: ${o.title} (${o.company})`)}&body=${encodeURIComponent(`Hello,\n\nI'd like to apply for the ${o.title} role I found on Maxicareer.\n\nName:\nPhone:\nLinkedIn:\n\nI've attached my resume.\n`)}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="/" aria-label="Maxicareer home">
            <BrandLogo size="md" />
          </a>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <a href="/" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4" /> Home
            </a>
            <a href="/?portal=student" className="px-4 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700">
              Student portal
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-[#0F172A] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-300">
              <BriefcaseBusiness className="w-3.5 h-3.5" /> Careers
            </span>
            <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight max-w-3xl">Jobs and internships for the next step in your career</h1>
            <p className="mt-4 text-slate-300 max-w-2xl text-base sm:text-lg">
              Openings from Maxicareer and our hiring partners, picked for students, freshers and working professionals. Apply directly, then ask your mentor to review your application.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by role, company or city"
                aria-label="Search openings"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Job type" className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium">
              <option value="all">All types</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Work mode" className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium">
              <option value="all">Any location type</option>
              <option>On-site</option>
              <option>Hybrid</option>
              <option>Remote</option>
            </select>
          </div>

          {state === 'loading' && (
            <div className="py-20 flex justify-center">
              <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
            </div>
          )}
          {state === 'error' && <p className="py-16 text-center text-slate-500">We couldn't load openings right now. Please refresh in a moment.</p>}
          {state === 'ready' && (
            <>
              <p className="text-sm text-slate-500">
                {shown.length} opening{shown.length === 1 ? '' : 's'}
                {shown.length !== openings.length ? ` of ${openings.length}` : ''}
              </p>
              {shown.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <BriefcaseBusiness className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="mt-3 font-bold text-slate-800">{openings.length ? 'No openings match your search' : 'No openings right now'}</p>
                  <p className="mt-1 text-sm text-slate-500">New roles are posted regularly. Students get them in their portal too.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {shown.map((o) => {
                    const expanded = open === o.id;
                    const left = daysLeft(o.deadline);
                    return (
                      <li key={o.id} className="rounded-2xl border border-slate-200 bg-white hover:border-blue-200 transition-colors">
                        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-extrabold text-slate-900">{o.title}</h2>
                            <p className="text-sm font-semibold text-slate-600 mt-0.5">
                              {o.company}
                              {o.department ? ` · ${o.department}` : ''}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Chip>{o.type}</Chip>
                              <Chip>
                                <MapPin className="w-3 h-3" /> {o.location ? `${o.location} · ` : ''}
                                {o.workMode}
                              </Chip>
                              {o.experience && <Chip>{o.experience}</Chip>}
                              {o.salary && (
                                <Chip>
                                  <Wallet className="w-3 h-3" /> {o.salary}
                                </Chip>
                              )}
                              {o.deadline && (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${left !== null && left <= 7 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                  <CalendarClock className="w-3 h-3" /> Apply by {fmt(o.deadline)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setOpen(expanded ? null : o.id)}
                              aria-expanded={expanded}
                              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Details <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                            </button>
                            <a
                              href={applyHref(o)}
                              target={o.applyUrl ? '_blank' : undefined}
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#2563EB] text-sm font-bold text-white hover:bg-blue-700"
                            >
                              {o.applyUrl ? <ExternalLink className="w-4 h-4" /> : <Mail className="w-4 h-4" />} Apply
                            </a>
                          </div>
                        </div>
                        {expanded && (
                          <div className="px-5 sm:px-6 pb-6 border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 text-sm text-slate-700">
                            <div>
                              <h3 className="font-bold text-slate-900 mb-2">About the role</h3>
                              <p className="whitespace-pre-wrap leading-relaxed">{o.description || 'Details will be shared by the hiring team.'}</p>
                            </div>
                            {o.requirements?.length > 0 && (
                              <div>
                                <h3 className="font-bold text-slate-900 mb-2">What you'll need</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                  {o.requirements.map((r, i) => (
                                    <li key={i}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          <div className="rounded-3xl bg-[#EFF6FF] border border-blue-100 p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Want help landing one of these?</h2>
              <p className="text-sm text-slate-600 mt-1">Maxicareer mentors review your resume, LinkedIn and interview prep for the exact role you're applying to.</p>
            </div>
            <a href="/?portal=student" className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-[#0F172A] text-white text-sm font-bold hover:bg-slate-800 shrink-0">
              Open the student portal
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-sm text-slate-500 flex flex-col sm:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} Maxicareer</span>
          <a href="/" className="hover:text-slate-800">
            maxicareer.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default CareersPage;
