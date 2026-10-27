import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, LifeBuoy, Mail, MessageCircle, MessageSquareHeart, Phone, PlayCircle, Send, ShieldCheck } from 'lucide-react';
import { PageHeader, Panel, Button, Badge, Empty, Segmented, Field, Input, Select, Textarea, cx } from '../admin/ui';
import { timeAgo } from '../admin/lib';
import { useStudent, StudentPage } from './context';
import { EmailModal, EmailModalData } from '../EmailModal';
import { OFFICIAL_EMAIL, OFFICIAL_PHONE, OFFICIAL_PHONE_DIGITS } from '../../data/portalData';
import type { FeedbackItem } from '../../types/portal';
import { FormError, StarRating, useAsyncAction } from '../workspace/kit';

/* ------------------------------------------------------------------ */
/* Support                                                             */
/* ------------------------------------------------------------------ */

const FAQ: { q: string; a: string }[] = [
  { q: 'How do I book a 1-on-1 session?', a: 'Open 1-on-1 sessions (or the Dashboard) and choose Book a session. Pick your mentor or counsellor (they appear once the Maxicareer team assigns them) and a time; once they confirm and share their meeting link, a Join button appears in Sessions and on your Calendar.' },
  { q: 'How do I meet the admin team?', a: 'Use "Meet admin team" in 1-on-1 sessions or on your Dashboard. Choose a date, time and topic and we will confirm by notification.' },
  { q: 'How do I submit an assignment?', a: 'Go to Tasks & assignments, choose Submit work on a task (or the button at the top), attach your file or link and send it. Your reviewer’s grade and feedback appear on the submission.' },
  { q: 'How do I pay for a service or renewal?', a: 'Every order creates an invoice in Invoices. Pay by UPI or bank transfer, then click "I have paid" and enter the transaction reference. We mark it paid after checking.' },
  { q: 'Will I get a certificate?', a: 'Yes. When you complete your program or pass a certified assessment, your certificate appears in Milestones & certificates, ready to print or save as PDF.' },
];

export const SupportPage: React.FC = () => {
  const { profile, store, whatsappUrl, openAdminMeeting } = useStudent();
  const [form, setForm] = useState({ subject: '', category: 'Sessions & scheduling', priority: 'Normal (within 24 hours)', message: '' });
  const [ticket, setTicket] = useState<string | null>(null);
  const [faq, setFaq] = useState<number | null>(0);
  const [email, setEmail] = useState<EmailModalData | null>(null);
  const { busy, error, run } = useAsyncAction();

  return (
    <div className="space-y-5">
      <PageHeader title="Support" description="Questions about your program, sessions, payments or your account? We are here to help." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-[14px] border border-[#BFE6D5] bg-[#F1FBF6] p-5 hover:border-[#0F9F6E]">
          <MessageCircle className="w-6 h-6 text-[#0F9F6E]" />
          <div className="mt-2 text-[15px] font-semibold">WhatsApp</div>
          <div className="text-[13px] text-[#5B6885]">Fastest replies, 10 AM – 7 PM</div>
          <div className="mt-2 text-[13px] font-semibold text-[#0B7A55] inline-flex items-center gap-1">
            {OFFICIAL_PHONE} <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </a>
        <button
          type="button"
          onClick={() =>
            setEmail({
              recipient: OFFICIAL_EMAIL,
              subject: `Student support - ${profile.name} (${profile.id})`,
              body: `Student ID: ${profile.id}\nName: ${profile.name}\nProgram: ${profile.planName}\n\nI need help with:\n`,
              title: 'Email student support',
              subtitle: `To ${OFFICIAL_EMAIL}`,
            })
          }
          className="text-left rounded-[14px] border border-[#C8D8F8] bg-[#F3F7FF] p-5 hover:border-[#2563EB]"
        >
          <Mail className="w-6 h-6 text-[#2563EB]" />
          <div className="mt-2 text-[15px] font-semibold">Email</div>
          <div className="text-[13px] text-[#5B6885]">Written replies within 24 hours</div>
          <div className="mt-2 text-[13px] font-semibold text-[#1D4FD7] inline-flex items-center gap-1">
            {OFFICIAL_EMAIL} <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
        <a href={`tel:${OFFICIAL_PHONE_DIGITS}`} className="rounded-[14px] border border-[#DDE4EF] bg-white p-5 hover:border-[#B7C3D7]">
          <Phone className="w-6 h-6 text-[#0D1B3E]" />
          <div className="mt-2 text-[15px] font-semibold">Call us</div>
          <div className="text-[13px] text-[#5B6885]">Phone support, 10 AM – 7 PM</div>
          <div className="mt-2 text-[13px] font-semibold inline-flex items-center gap-1">
            Call now <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </a>
        <button type="button" onClick={openAdminMeeting} className="text-left rounded-[14px] border border-[#DDE4EF] bg-white p-5 hover:border-[#B7C3D7]">
          <ShieldCheck className="w-6 h-6 text-[#0D1B3E]" />
          <div className="mt-2 text-[15px] font-semibold">Meet the admin team</div>
          <div className="text-[13px] text-[#5B6885]">Book a call for anything account related</div>
          <div className="mt-2 text-[13px] font-semibold inline-flex items-center gap-1">
            Request a meeting <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <Panel className="xl:col-span-7" title="Raise a support request" description="Our student operations team replies by email and in Notifications.">
          {ticket ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-[#0F9F6E] mx-auto" />
              <div className="mt-3 mc-display text-[18px] font-semibold">Request received</div>
              <p className="mt-1 text-[13.5px] text-[#5B6885]">Reference {ticket.slice(-8).toUpperCase()}. We'll get back to you by email.</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setTicket(null);
                  setForm({ ...form, subject: '', message: '' });
                }}
              >
                Raise another request
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                let id = '';
                if (
                  await run(async () => {
                    id = (await store.createSupportTicket(form)).id;
                  })
                )
                  setTicket(id);
              }}
            >
              <FormError message={error} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category">
                  <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option>Sessions & scheduling</option>
                    <option>Mentor or counsellor</option>
                    <option>Curriculum & materials</option>
                    <option>Assignments & tests</option>
                    <option>Payments & invoices</option>
                    <option>Account & login</option>
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option>Normal (within 24 hours)</option>
                    <option>High (within 6 hours)</option>
                    <option>Urgent (within 1 hour)</option>
                  </Select>
                </Field>
              </div>
              <Field label="Subject">
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="I can't join my session link" />
              </Field>
              <Field label="Details">
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={5} />
              </Field>
              <Button type="submit" variant="primary" icon={Send} disabled={busy || !form.subject.trim() || !form.message.trim()}>
                {busy ? 'Sending…' : 'Send request'}
              </Button>
            </form>
          )}
        </Panel>

        <Panel className="xl:col-span-5" title="Frequently asked questions" flush>
          <ul className="divide-y divide-[#EAEFF6]">
            {FAQ.map((f, i) => (
              <li key={f.q}>
                <button type="button" onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i} className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left text-[14px] font-semibold hover:bg-[#F7F9FC]">
                  {f.q}
                  <ChevronDown className={cx('w-4 h-4 text-[#8C97AE] shrink-0 transition-transform', faq === i && 'rotate-180')} />
                </button>
                {faq === i && <p className="px-5 pb-4 -mt-1 text-[13.5px] text-[#33415F] leading-relaxed">{f.a}</p>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <EmailModal isOpen={!!email} data={email} onClose={() => setEmail(null)} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

const ABOUT_OPTIONS: FeedbackItem['about'][] = ['Mentor', 'Counsellor', 'Course', 'Platform'];

export const FeedbackPage: React.FC = () => {
  const { state, providers, mentor, counselor, store, toast } = useStudent();
  const [about, setAbout] = useState<FeedbackItem['about']>('Mentor');
  const [targetId, setTargetId] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { busy, error, run } = useAsyncAction();
  const people = providers.filter((p) => (about === 'Mentor' ? p.kind === 'mentor' || p.id === mentor?.id : p.kind === 'counselor' || p.id === counselor?.id));
  const needsPerson = about === 'Mentor' || about === 'Counsellor';
  const target = needsPerson ? targetId || (about === 'Mentor' ? mentor?.id : counselor?.id) || people[0]?.id || '' : '';
  const mine = [...state.feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-5">
      <PageHeader title="Feedback" description="Tell us how your mentor, counsellor, course and this portal are working for you. Low ratings go straight to the team lead." />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <Panel className="xl:col-span-7" title="Share feedback">
          <div className="space-y-4">
            <FormError message={error} />
            <Segmented
              value={about}
              onChange={(v) => {
                setAbout(v);
                setTargetId('');
              }}
              options={ABOUT_OPTIONS.map((o) => ({ value: o, label: o === 'Platform' ? 'This portal' : o }))}
            />
            {needsPerson && (
              <Field label={`Which ${about.toLowerCase()}?`}>
                {people.length ? (
                  <Select value={target} onChange={(e) => setTargetId(e.target.value)}>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p className="text-[13px] text-[#5B6885]">You haven't worked with a {about.toLowerCase()} yet.</p>
                )}
              </Field>
            )}
            <Field label="Your rating">
              <StarRating value={rating} onChange={setRating} size={30} />
            </Field>
            <Field label="Comments">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="What's going well? What should we improve?" />
            </Field>
            <Button
              variant="primary"
              icon={Send}
              disabled={busy || !rating || (needsPerson && !target)}
              onClick={async () => {
                if (await run(() => store.submitFeedback({ about, rating, comment, targetId: needsPerson ? target : undefined }))) {
                  toast('Thank you, your feedback was sent.');
                  setRating(0);
                  setComment('');
                }
              }}
            >
              {busy ? 'Sending…' : 'Send feedback'}
            </Button>
          </div>
        </Panel>
        <Panel className="xl:col-span-5" title="Your feedback" flush>
          {mine.length === 0 ? (
            <Empty icon={MessageSquareHeart} title="Nothing sent yet" />
          ) : (
            <ul className="divide-y divide-[#EAEFF6]">
              {mine.map((f) => (
                <li key={f.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <StarRating value={f.rating} size={15} />
                    <span className="text-[12px] text-[#7A869E]">{timeAgo(f.createdAt)}</span>
                  </div>
                  <div className="mt-1 text-[13px] font-semibold">
                    {f.about}
                    {f.targetName ? ` · ${f.targetName}` : ''}
                  </div>
                  {f.comment && <p className="text-[13px] text-[#5B6885] mt-0.5">{f.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Tutorials                                                           */
/* ------------------------------------------------------------------ */

const GUIDES: { title: string; minutes: number; page: StudentPage; tag: string; steps: string[] }[] = [
  { title: 'Book your first 1-on-1 session', minutes: 2, page: 'sessions', tag: 'Sessions', steps: ['Open 1-on-1 sessions and click Book a session.', 'Choose your mentor or counsellor, a focus area, a date and a time slot.', 'Wait for the confirmation notification; the Join button appears in Sessions and Calendar once the meeting link is shared.', 'After the call, read the notes and next steps in Meeting history.'] },
  { title: 'Submit an assignment or project', minutes: 2, page: 'tasks', tag: 'Tasks', steps: ['Open Tasks & assignments.', 'Click Submit work on a task, or at the top for a standalone project.', 'Attach a file (up to 10 MB) or paste a GitHub / Drive link, add notes for your reviewer.', 'Track the review in My submissions; resubmit if changes are requested.'] },
  { title: 'Follow your curriculum', minutes: 1, page: 'curriculum', tag: 'Learning', steps: ['Open Curriculum & syllabus to see every module and lesson.', 'Modules your mentor adds just for you are marked "From …".', 'Tick each lesson as you finish it; your progress updates on the Dashboard.'] },
  { title: 'Plan your weeks with the calendar', minutes: 2, page: 'calendar', tag: 'Planning', steps: ['Sessions, due dates, tests, targets and events appear automatically.', 'Click Add (or double-click a day) to add your own note, reminder or target.', 'Use the legend chips to hide what you don’t need.'] },
  { title: 'Take a test', minutes: 2, page: 'courses', tag: 'Tests', steps: ['Open Courses & tests and find the test in Tests & assessments.', 'Click Start; the timer begins and answers are submitted when it ends.', 'See your score straight away; results are shared with your mentor.'] },
  { title: 'Build your profile and resume', minutes: 3, page: 'profile', tag: 'Career', steps: ['Open Profile & resume and fill in your headline, about and skills.', 'Add your LinkedIn, GitHub and portfolio links.', 'Upload your resume and ask your mentor to review it.'] },
  { title: 'Buy a service and pay the invoice', minutes: 2, page: 'services', tag: 'Billing', steps: ['Open Add a service and choose Buy.', 'Pay the invoice by UPI or bank transfer.', 'In Invoices, click I have paid and enter the transaction reference.'] },
  { title: 'Renew your program', minutes: 1, page: 'renewal', tag: 'Billing', steps: ['Open Renewal to see when your access ends.', 'Choose a renewal period and request it.', 'Pay the renewal invoice; your access is extended once it’s confirmed.'] },
];

export const TutorialsPage: React.FC = () => {
  const { go } = useStudent();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-5">
      <PageHeader title="Tutorials" description="Short walkthroughs for everything in your portal." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {GUIDES.map((g, i) => (
          <section key={g.title} className="bg-white border border-[#DDE4EF] rounded-[14px] overflow-hidden">
            <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#F7F9FC]">
              <span className="h-10 w-10 rounded-[11px] bg-[#E8F0FE] text-[#1D4FD7] flex items-center justify-center shrink-0">
                <PlayCircle className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold">{g.title}</span>
                <span className="flex items-center gap-2 mt-0.5">
                  <Badge>{g.tag}</Badge>
                  <span className="text-[12px] text-[#7A869E]">{g.minutes} min</span>
                </span>
              </span>
              <ChevronDown className={cx('w-4 h-4 text-[#8C97AE] transition-transform', open === i && 'rotate-180')} />
            </button>
            {open === i && (
              <div className="px-5 pb-5">
                <ol className="space-y-2">
                  {g.steps.map((s, k) => (
                    <li key={k} className="flex gap-3 text-[13.5px] text-[#26355A]">
                      <span className="mc-num h-6 w-6 rounded-full bg-[#0D1B3E] text-white text-[12px] font-semibold flex items-center justify-center shrink-0">{k + 1}</span>
                      <span className="pt-0.5">{s}</span>
                    </li>
                  ))}
                </ol>
                <Button size="sm" variant="primary" className="mt-4" icon={ArrowRight} onClick={() => go(g.page)}>
                  Try it now
                </Button>
              </div>
            )}
          </section>
        ))}
      </div>
      <Panel>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <LifeBuoy className="w-5 h-5 text-[#2563EB] shrink-0" />
          <p className="flex-1 text-[13.5px] text-[#33415F]">Still stuck? Our team can walk you through anything on a quick call.</p>
          <Button onClick={() => go('support')}>Contact support</Button>
        </div>
      </Panel>
    </div>
  );
};
