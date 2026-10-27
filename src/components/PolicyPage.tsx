'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PublicPageShell } from './PublicPageShell';
import { POLICY_KEYS, POLICY_PATH, Policy, PolicyKey, policyBlocks } from '../data/policies';

/** The policy text itself; also used as the preview in the admin website editor. */
export const PolicyArticle: React.FC<{ policy: Policy }> = ({ policy }) => (
  <article className="min-w-0 max-w-3xl">
    <span className="inline-flex items-center gap-2 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
      <ShieldCheck className="w-3.5 h-3.5" /> Policies
    </span>
    <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">{policy.title}</h1>
    {policy.updated && <p className="mt-2 text-sm text-slate-500">Last updated {policy.updated}</p>}
    {policy.intro && <p className="mt-5 text-base text-slate-700 leading-relaxed whitespace-pre-line">{policy.intro}</p>}

    <div className="mt-8 space-y-8">
      {policy.sections.map((s, i) => (
        <section key={s.id || i} aria-labelledby={`policy-${i}`}>
          <h2 id={`policy-${i}`} className="text-lg font-extrabold text-slate-900">
            {s.heading}
          </h2>
          {policyBlocks(s.body).map((b, j) =>
            b.type === 'p' ? (
              <p key={j} className="mt-2 text-[15px] text-slate-700 leading-relaxed">
                {b.text}
              </p>
            ) : (
              <ul key={j} className="mt-2 list-disc pl-5 space-y-1.5 text-[15px] text-slate-700 leading-relaxed">
                {b.items.map((item, k) => (
                  <li key={k}>{item}</li>
                ))}
              </ul>
            )
          )}
        </section>
      ))}
    </div>
  </article>
);

/** /privacy, /terms and /refund-policy, with the text published from the admin portal. */
export const PolicyPage: React.FC<{ policy: PolicyKey; policies: Record<PolicyKey, Policy> }> = ({ policy, policies }) => (
  <PublicPageShell>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-12">
      <nav aria-label="Policies" className="lg:sticky lg:top-24 self-start flex lg:flex-col gap-1 overflow-x-auto">
        {POLICY_KEYS.map((k) => (
          <a
            key={k}
            href={POLICY_PATH[k]}
            aria-current={k === policy ? 'page' : undefined}
            className={`whitespace-nowrap px-3 py-2 rounded-xl text-sm font-semibold ${k === policy ? 'bg-white border border-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
          >
            {policies[k].title}
          </a>
        ))}
      </nav>
      <PolicyArticle policy={policies[policy]} />
    </div>
  </PublicPageShell>
);
