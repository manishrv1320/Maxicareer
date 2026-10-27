'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, PartyPopper, Video } from 'lucide-react';
import { PublicPageShell } from './PublicPageShell';
import type { PlatformEvent } from '../types/portal';

type PublicEvent = Pick<PlatformEvent, 'id' | 'title' | 'type' | 'description' | 'date' | 'time' | 'durationMins' | 'mode' | 'link' | 'location' | 'host'>;

const pad = (n: number) => String(n).padStart(2, '0');
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const dayOf = (iso: string) => new Date(`${iso}T00:00:00`);

/** "18:30" -> "6:30 PM". */
const time12 = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t || '');
  if (!m) return t;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
};

/** Public list of the events an admin chose to show on the website. */
export const WebsiteEventsPage: React.FC = () => {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [type, setType] = useState('all');

  useEffect(() => {
    fetch('/api/events', { cache: 'no-store' })
      .then((r) => r.json())
      .then((res) => {
        setEvents(Array.isArray(res.events) ? res.events : []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  const today = todayIso();
  const upcoming = useMemo(() => events.filter((e) => e.date >= today), [events, today]);
  const types = Array.from(new Set(upcoming.map((e) => e.type)));
  const shown = upcoming.filter((e) => type === 'all' || e.type === type);

  return (
    <PublicPageShell>
      <section className="bg-[#0F172A] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-300">
            <PartyPopper className="w-3.5 h-3.5" /> Events
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight max-w-3xl">Webinars, workshops and career fairs</h1>
          <p className="mt-4 text-slate-300 max-w-2xl text-base sm:text-lg">
            Free and open sessions from Maxicareer mentors and hiring partners: placement prep, career paths, study abroad and more. Students also see these in their portal calendar.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {types.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Event type">
            {['all', ...types].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={`h-9 px-4 rounded-full text-sm font-semibold border transition-colors ${type === t ? 'bg-[#0F172A] border-[#0F172A] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                {t === 'all' ? 'All events' : t}
              </button>
            ))}
          </div>
        )}

        {state === 'loading' && (
          <div className="py-20 flex justify-center">
            <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
          </div>
        )}
        {state === 'error' && <p className="py-16 text-center text-slate-500">We couldn't load events right now. Please refresh in a moment.</p>}
        {state === 'ready' &&
          (shown.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <CalendarDays className="w-8 h-8 mx-auto text-slate-300" />
              <p className="mt-3 font-bold text-slate-800">No upcoming events right now</p>
              <p className="mt-1 text-sm text-slate-500">
                New events are added regularly.{' '}
                <a href="/#newsletter" className="font-semibold text-[#2563EB] hover:underline">
                  Subscribe to the newsletter
                </a>{' '}
                to hear about them first.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {shown.map((e) => {
                const d = dayOf(e.date);
                const isToday = e.date === today;
                return (
                  <li key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col md:flex-row gap-5">
                    <div className="w-16 h-16 shrink-0 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
                      <span className="text-[11px] font-bold uppercase text-[#2563EB]">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                      <span className="text-2xl font-black leading-none">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[12px] font-semibold text-[#1D4ED8]">{e.type}</span>
                        {isToday && <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-semibold text-amber-700">Today</span>}
                      </div>
                      <h2 className="mt-2 text-lg font-extrabold text-slate-900">{e.title}</h2>
                      <div className="mt-1 text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}, {time12(e.time)} · {e.durationMins} min
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          {e.mode === 'Online' ? <Video className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
                          {e.mode === 'Online' ? 'Online' : e.location || 'In person'}
                        </span>
                        {e.host && <span>Hosted by {e.host}</span>}
                      </div>
                      {e.description && <p className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{e.description}</p>}
                    </div>
                    {e.mode === 'Online' && e.link && (
                      <div className="md:self-center shrink-0">
                        <a
                          href={e.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#2563EB] text-sm font-bold text-white hover:bg-blue-700"
                        >
                          <Video className="w-4 h-4" /> {isToday ? 'Join now' : 'Joining link'}
                        </a>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ))}

        <div className="rounded-3xl bg-[#EFF6FF] border border-blue-100 p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Want 1-on-1 guidance after the event?</h2>
            <p className="text-sm text-slate-600 mt-1">Enrolled students get a dedicated mentor and counsellor, plus every event on their calendar.</p>
          </div>
          <a href="/#services" className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-[#0F172A] text-white text-sm font-bold hover:bg-slate-800 shrink-0">
            See programs
          </a>
        </div>
      </section>
    </PublicPageShell>
  );
};
