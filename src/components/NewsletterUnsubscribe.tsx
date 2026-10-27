'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, MailX } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { apiGet, apiSend } from '../lib/api';

type State =
  | { step: 'loading' }
  | { step: 'confirm'; email: string; token: string }
  | { step: 'done'; email: string }
  | { step: 'error'; message: string };

/**
 * /newsletter/unsubscribe?token=… from the footer of every newsletter. Opening the link only
 * shows the address; the button unsubscribes (mail scanners open links on their own).
 */
export const NewsletterUnsubscribe: React.FC = () => {
  const [state, setState] = useState<State>({ step: 'loading' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    if (!token) {
      setState({ step: 'error', message: 'This link is missing its code. Use the unsubscribe link at the bottom of a Maxicareer newsletter.' });
      return;
    }
    apiGet<{ email: string; status: string }>(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => setState(res.status === 'unsubscribed' ? { step: 'done', email: res.email } : { step: 'confirm', email: res.email, token }))
      .catch((err) => setState({ step: 'error', message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' }));
  }, []);

  const confirm = async () => {
    if (state.step !== 'confirm') return;
    setBusy(true);
    try {
      await apiSend('/api/newsletter/unsubscribe', { token: state.token });
      setState({ step: 'done', email: state.email });
    } catch (err) {
      setState({ step: 'error', message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12">
      <a href="/" aria-label="Maxicareer home" className="mb-8">
        <BrandLogo size="lg" />
      </a>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-center">
        {state.step === 'loading' && <div className="mx-auto h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" aria-label="Loading" />}

        {state.step === 'confirm' && (
          <>
            <MailX className="mx-auto h-10 w-10 text-slate-400" />
            <h1 className="mt-4 text-2xl font-bold text-[#0F172A]">Unsubscribe from the newsletter?</h1>
            <p className="mt-2 text-sm text-slate-600 break-words">
              <span className="font-semibold text-[#0F172A]">{state.email}</span> will stop getting the Maxicareer newsletter. Emails about your account or sessions aren't affected.
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-[#2563EB] py-3 font-bold text-white hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
            >
              {busy ? 'Unsubscribing…' : 'Unsubscribe'}
            </button>
            <a href="/" className="mt-3 inline-block text-sm font-semibold text-slate-500 hover:text-slate-700">
              Keep me subscribed
            </a>
          </>
        )}

        {state.step === 'done' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-bold text-[#0F172A]">You're unsubscribed</h1>
            <p className="mt-2 text-sm text-slate-600 break-words">
              <span className="font-semibold text-[#0F172A]">{state.email}</span> won't get any more newsletters. Changed your mind? Sign up again at the bottom of our website.
            </p>
            <a href="/" className="mt-6 inline-block rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#0F172A] hover:bg-slate-50">
              Go to the website
            </a>
          </>
        )}

        {state.step === 'error' && (
          <>
            <MailX className="mx-auto h-10 w-10 text-rose-500" />
            <h1 className="mt-4 text-2xl font-bold text-[#0F172A]">We couldn't find that subscription</h1>
            <p className="mt-2 text-sm text-slate-600">{state.message}</p>
            <a href="/" className="mt-6 inline-block rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#0F172A] hover:bg-slate-50">
              Go to the website
            </a>
          </>
        )}
      </div>
    </main>
  );
};
