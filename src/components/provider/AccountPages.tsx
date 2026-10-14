import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, Mail, MessageCircle, Phone, Save, Send, ShieldCheck, Star } from 'lucide-react';
import { PageHeader, Panel, Badge, Button, Field, Input, Select, Textarea, Avatar, cx } from '../admin/ui';
import type { Counselor, Mentor } from '../../types/counselor';
import { OFFICIAL_EMAIL, OFFICIAL_PHONE, OFFICIAL_PHONE_DIGITS } from '../../data/portalData';
import { AvatarUploader } from '../AvatarUploader';
import { plural } from '../admin/lib';
import { FormError, StarRating, fmtDay, useAsyncAction } from '../workspace/kit';
import { useProvider, roleLabel } from './context';

const list = (v: string) =>
  v
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export const ProfilePage: React.FC = () => {
  const { kind, me, store, state, toast } = useProvider();
  const c = me as Counselor;
  const m = me as Mentor;
  const [form, setForm] = useState({
    name: me.name,
    phone: me.phone || '',
    bio: me.bio || '',
    experienceYears: String(me.experienceYears || 0),
    qualification: c.qualification || '',
    specializations: (c.specializations || []).join(', '),
    areasOfExpertise: (c.areasOfExpertise || []).join(', '),
    languages: (c.languages || []).join(', '),
    domain: m.domain || '',
    company: m.company || '',
    role: m.role || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  const avg = state.feedback.length ? state.feedback.reduce((s, f) => s + f.rating, 0) / state.feedback.length : null;

  const update = (updates: Partial<Counselor> & Partial<Mentor>) => (kind === 'counselor' ? store.updateCounselorProfile(me.id, updates) : store.updateMentorProfile(me.id, updates));

  const save = async () => {
    if (!form.name.trim()) return setError('Your name is required.');
    setError(null);
    setSaving(true);
    const common = { name: form.name.trim(), phone: form.phone.trim(), bio: form.bio.trim(), experienceYears: Number(form.experienceYears) || 0 };
    const res =
      kind === 'counselor'
        ? await update({ ...common, qualification: form.qualification.trim(), specializations: list(form.specializations), areasOfExpertise: list(form.areasOfExpertise), languages: list(form.languages) })
        : await update({ ...common, domain: form.domain.trim(), company: form.company.trim(), role: form.role.trim() });
    setSaving(false);
    if (res !== undefined) toast('Profile saved.');
  };

  const tags = kind === 'counselor' ? list(form.specializations) : [form.domain].filter(Boolean);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profile"
        description="What students see in the counsellor and mentor directory when they book."
        actions={
          <Button variant="primary" icon={Save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        }
      />
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5 items-start">
        <Panel title="Your details">
          <div className="space-y-5">
            <FormError message={error} />
            <AvatarUploader
              src={me.avatarUrl}
              name={me.name}
              onUploaded={async (url) => {
                const res = await update({ avatarUrl: url });
                if (res !== undefined) toast('Photo updated.');
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name">
                <Input value={form.name} onChange={set('name')} />
              </Field>
              <Field label="Phone / WhatsApp" hint="Visible to Maxicareer staff only.">
                <Input value={form.phone} onChange={set('phone')} />
              </Field>
              <Field label="Email" hint="Contact support to change your sign-in email.">
                <Input value={me.email} disabled />
              </Field>
              <Field label="Years of experience">
                <Input type="number" min={0} max={60} value={form.experienceYears} onChange={set('experienceYears')} />
              </Field>
              {kind === 'counselor' ? (
                <>
                  <Field label="Qualification" className="sm:col-span-2">
                    <Input value={form.qualification} onChange={set('qualification')} placeholder="M.A. Psychology, certified career coach" />
                  </Field>
                  <Field label="Specialisations" hint="Comma separated." className="sm:col-span-2">
                    <Input value={form.specializations} onChange={set('specializations')} placeholder="Career Exploration, Study Abroad" />
                  </Field>
                  <Field label="Areas of expertise" hint="Comma separated.">
                    <Input value={form.areasOfExpertise} onChange={set('areasOfExpertise')} />
                  </Field>
                  <Field label="Languages" hint="Comma separated.">
                    <Input value={form.languages} onChange={set('languages')} placeholder="English, Hindi, Tamil" />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Current role">
                    <Input value={form.role} onChange={set('role')} placeholder="Senior Product Manager" />
                  </Field>
                  <Field label="Company">
                    <Input value={form.company} onChange={set('company')} />
                  </Field>
                  <Field label="Domain" className="sm:col-span-2">
                    <Input value={form.domain} onChange={set('domain')} placeholder="Product management, data science…" />
                  </Field>
                </>
              )}
              <Field label="Bio" className="sm:col-span-2" hint="A few lines about how you help students.">
                <Textarea rows={5} value={form.bio} onChange={set('bio')} />
              </Field>
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="How students see you">
            <div className="rounded-[14px] border border-[#DDE4EF] p-4">
              <div className="flex items-center gap-3">
                {me.avatarUrl ? <img src={me.avatarUrl} alt="" className="h-14 w-14 rounded-[12px] object-cover" /> : <Avatar name={form.name} size={56} />}
                <div className="min-w-0">
                  <div className="mc-display text-[17px] font-semibold truncate">{form.name || 'Your name'}</div>
                  <div className="text-[13px] text-[#5B6885] truncate">{kind === 'counselor' ? form.qualification || 'Career counsellor' : [form.role, form.company].filter(Boolean).join(' · ') || 'Industry mentor'}</div>
                  {avg && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#5B6885]">
                      <StarRating value={Math.round(avg)} size={12} /> {avg.toFixed(1)} · {plural(state.feedback.length, 'review')}
                    </div>
                  )}
                </div>
              </div>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Badge key={t} tone="blue">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[13px] text-[#33415F] line-clamp-4">{form.bio || 'Add a bio so students know how you can help.'}</p>
              <p className="mt-3 text-[12.5px] text-[#7A869E]">
                {Number(form.experienceYears) || 0} years' experience · {me.sessionDuration || '45 mins'} sessions
              </p>
            </div>
          </Panel>
          <Panel title="Account">
            <dl className="space-y-2.5 text-[13.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[#7A869E]">Role</dt>
                <dd className="font-semibold">{roleLabel(kind)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7A869E]">Status</dt>
                <dd>
                  {me.approvalStatus === 'approved' ? (
                    <Badge tone="mint" dot>
                      <ShieldCheck className="w-3 h-3" /> Approved
                    </Badge>
                  ) : (
                    <Badge tone="marigold" dot>
                      Awaiting approval
                    </Badge>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7A869E]">Member since</dt>
                <dd>{fmtDay(me.registeredDate)}</dd>
              </div>
              {avg && (
                <div className="flex justify-between gap-3">
                  <dt className="text-[#7A869E]">Rating</dt>
                  <dd className="inline-flex items-center gap-1 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-[#F2A93B] text-[#F2A93B]" /> {avg.toFixed(1)}
                  </dd>
                </div>
              )}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Support                                                             */
/* ------------------------------------------------------------------ */

const FAQ = [
  ['How do students book me?', 'They pick you from the directory in their portal and choose one of your available days and time slots. You get a request under 1-on-1 sessions. When you accept, they get your personal meeting link (set it on the Availability page), or you can paste a link for that one session.'],
  ['How are my hours counted?', 'Every completed session counts as one session length (set on the Availability page). Log prep, reviews and other work yourself on Work hours.'],
  ['When do I get paid?', 'The finance team records payouts for your sessions and hours. Each payout appears under Payment history with its reference number.'],
  ['How do I claim an expense?', 'Open Expenditure, click "Claim an expense", add the amount and a receipt. You can withdraw it until the team reviews it.'],
  ['A student is unresponsive. What should I do?', 'Nudge them from Follow-ups or Chat. If they stay silent for two weeks, raise a support request so the team can step in.'],
];

export const SupportPage: React.FC = () => {
  const { me, kind, store } = useProvider();
  const [form, setForm] = useState({ category: 'Payouts & invoices', priority: 'Normal', subject: '', message: '' });
  const [sent, setSent] = useState<string | null>(null);
  const [faq, setFaq] = useState<number | null>(0);
  const { busy, error, run } = useAsyncAction();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let ref = '';
    const ok = await run(async () => {
      const res = await store.createSupportTicket({ subject: form.subject.trim(), category: form.category, priority: form.priority, message: form.message.trim() });
      ref = res.id;
    });
    if (ok) {
      setSent(ref);
      setForm({ ...form, subject: '', message: '' });
    }
  };

  const whatsapp = `https://wa.me/${OFFICIAL_PHONE_DIGITS}?text=${encodeURIComponent(`Hello Maxicareer team, this is ${me.name} (${roleLabel(kind)}, ${me.email}).`)}`;

  return (
    <div className="space-y-5">
      <PageHeader title="Support" description="Questions about payouts, scheduling, a student or the workspace? The operations team is here to help." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-[14px] border border-[#BFE6D5] bg-[#E3F6EE] p-5 hover:border-[#0F9F6E]">
          <MessageCircle className="w-5 h-5 text-[#0B7A55]" />
          <div className="mt-2 text-[14.5px] font-semibold">WhatsApp</div>
          <div className="text-[13px] text-[#33415F]">{OFFICIAL_PHONE}</div>
        </a>
        <a href={`mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent(`${roleLabel(kind)} support: ${me.name}`)}`} className="rounded-[14px] border border-[#C9DAFB] bg-[#E8F0FE] p-5 hover:border-[#2563EB]">
          <Mail className="w-5 h-5 text-[#1D4FD7]" />
          <div className="mt-2 text-[14.5px] font-semibold">Email</div>
          <div className="text-[13px] text-[#33415F]">{OFFICIAL_EMAIL}</div>
        </a>
        <a href={`tel:+${OFFICIAL_PHONE_DIGITS}`} className="rounded-[14px] border border-[#DDE4EF] bg-white p-5 hover:border-[#B7C3D7]">
          <Phone className="w-5 h-5 text-[#5B6885]" />
          <div className="mt-2 text-[14.5px] font-semibold">Call</div>
          <div className="text-[13px] text-[#33415F]">10 AM – 7 PM, Mon–Sat</div>
        </a>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5 items-start">
        <Panel title="Raise a support request" description="We reply by email, usually within a working day.">
          {sent !== null ? (
            <div className="rounded-[12px] bg-[#E3F6EE] p-5 text-center">
              <CheckCircle2 className="w-7 h-7 mx-auto text-[#0F9F6E]" />
              <p className="mt-2 text-[14px] font-semibold text-[#0B7A55]">Request sent</p>
              {sent && <p className="text-[13px] text-[#33415F]">Reference {sent.slice(-8).toUpperCase()}</p>}
              <Button size="sm" className="mt-3" onClick={() => setSent(null)}>
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormError message={error} />
              <Field label="Topic">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {['Payouts & invoices', 'Expense claims', 'Scheduling & availability', 'A student', 'Technical problem', 'Account & profile', 'Other'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </Select>
              </Field>
              <Field label="Subject" className="sm:col-span-2">
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </Field>
              <Field label="Details" className="sm:col-span-2">
                <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit" variant="primary" icon={Send} disabled={busy || !form.subject.trim() || !form.message.trim()}>
                  {busy ? 'Sending…' : 'Send request'}
                </Button>
              </div>
            </form>
          )}
        </Panel>
        <Panel title="Common questions" flush>
          <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
            {FAQ.map(([q, a], i) => (
              <li key={q}>
                <button type="button" onClick={() => setFaq(faq === i ? null : i)} className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left text-[13.5px] font-semibold" aria-expanded={faq === i}>
                  {q}
                  <ChevronDown className={cx('w-4 h-4 text-[#8C97AE] shrink-0 transition-transform', faq === i && 'rotate-180')} />
                </button>
                {faq === i && <p className="px-5 pb-4 text-[13.5px] text-[#5B6885] leading-relaxed">{a}</p>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
};
