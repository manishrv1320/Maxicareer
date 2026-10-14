import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Linkedin,
  MessageCircle,
  Printer,
  Receipt,
  RefreshCcw,
  Send,
  ShoppingBag,
} from 'lucide-react';
import { PageHeader, Panel, Button, Badge, Empty, Stat, Field, Input, Select, Textarea, Modal, StepMeter, Avatar, Th, Td, cx, Tone } from '../admin/ui';
import { useStudent, profileCompleteness, daysLeft } from './context';
import { STATUS_META } from './OverviewPages';
import { AvatarUploader } from '../AvatarUploader';
import { platformStore } from '../../services/careerPlatformStore';
import type { Invoice, ServiceOffering } from '../../types/portal';
import type { UploadedFile } from '../../lib/api';
import { FileLink, FilePicker, FormError, fmtDay, inr, useAsyncAction } from '../workspace/kit';

/* ------------------------------------------------------------------ */
/* Profile building, resume & LinkedIn                                 */
/* ------------------------------------------------------------------ */

const LINKEDIN_TIPS = [
  'A clear, friendly headshot and a simple banner image',
  'A headline that names the role you want, not just your current status',
  'An About section with 3–4 lines: who you help, your strongest skills, what you are looking for',
  'At least 5 skills that match the jobs you apply for',
  'Projects and certificates in the Featured section',
  'Turn on "Open to work" for recruiters only',
];

const splitList = (v: string) =>
  Array.from(
    new Set(
      v
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );

export const ProfilePage: React.FC = () => {
  const { me, profile, mentor, counselor, store, toast } = useStudent();
  const initial = useMemo(
    () => ({
      headline: me?.headline || '',
      about: me?.about || '',
      careerGoal: me?.careerGoal || '',
      skills: (me?.skills || []).join(', '),
      careerInterests: (me?.careerInterests || []).join(', '),
      linkedinUrl: me?.linkedinUrl || '',
      githubUrl: me?.githubUrl || '',
      portfolioUrl: me?.portfolioUrl || '',
      phone: me?.phone || profile.phone || '',
      city: me?.city || profile.city || '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me?.id, me?.headline, me?.about, me?.careerGoal, me?.linkedinUrl, me?.githubUrl, me?.portfolioUrl, me?.phone, me?.city, (me?.skills || []).join(), (me?.careerInterests || []).join()]
  );
  const [form, setForm] = useState(initial);
  const [resume, setResume] = useState<UploadedFile | null>(null);
  useEffect(() => setForm(initial), [initial]);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const { busy, error, setError, run } = useAsyncAction();
  const completeness = profileCompleteness(me);
  const reviewer = mentor || counselor;

  const save = async () => {
    const ok = await run(() =>
      platformStore.updateStudentProfile({
        headline: form.headline,
        about: form.about,
        careerGoal: form.careerGoal,
        skills: splitList(form.skills),
        careerInterests: splitList(form.careerInterests),
        linkedinUrl: form.linkedinUrl,
        githubUrl: form.githubUrl,
        portfolioUrl: form.portfolioUrl,
        phone: form.phone,
        city: form.city,
      })
    );
    if (ok) toast('Profile saved.');
  };

  const saveResume = async (file: UploadedFile | null) => {
    setResume(file);
    if (!file) return;
    if (await run(() => platformStore.updateStudentProfile({ resumeFileId: file.id, resumeFileName: file.name }))) {
      toast(reviewer ? `Resume saved. ${reviewer.name} can now open it.` : 'Resume saved.');
      setResume(null);
    }
  };

  const checks: [string, boolean][] = [
    ['Profile photo', Boolean(me?.avatarUrl)],
    ['Headline', Boolean(me?.headline)],
    ['About you', Boolean(me?.about)],
    ['3+ skills', (me?.skills || []).length >= 3],
    ['LinkedIn profile', Boolean(me?.linkedinUrl)],
    ['Resume uploaded', Boolean(me?.resumeFileId)],
    ['Career goal', Boolean(me?.careerGoal)],
    ['Phone number', Boolean(me?.phone)],
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profile & resume"
        description="Build the career profile your mentor and counsellor work from, keep your resume current and polish your LinkedIn."
        actions={
          <Button variant="primary" disabled={!dirty || busy} onClick={save}>
            {busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </Button>
        }
      />
      <FormError message={error} />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-5">
          <Panel title="Career profile">
            <div className="space-y-4">
              <AvatarUploader
                src={me?.avatarUrl || profile.avatarUrl}
                name={me?.name || profile.name}
                onUploaded={(url) => run(() => platformStore.updateStudentProfile({ avatarUrl: url })).then((ok) => ok && toast('Photo updated.'))}
              />
              <Field label="Headline" hint="One line, e.g. “Final-year CSE student · aspiring data analyst · SQL, Power BI”">
                <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} maxLength={200} />
              </Field>
              <Field label="About you">
                <Textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={4} maxLength={3000} placeholder="Who you are, what you're good at and the role you're aiming for." />
              </Field>
              <Field label="Career goal">
                <Input value={form.careerGoal} onChange={(e) => setForm({ ...form, careerGoal: e.target.value })} placeholder="Business analyst at a product company" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Skills" hint="Separate with commas.">
                  <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="SQL, Excel, Python, Communication" />
                </Field>
                <Field label="Interests" hint="Separate with commas.">
                  <Input value={form.careerInterests} onChange={(e) => setForm({ ...form, careerInterests: e.target.value })} placeholder="Product management, Analytics" />
                </Field>
                <Field label="Phone / WhatsApp">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="City">
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel title="Links" description="Your mentor reviews these with you.">
            <div className="grid grid-cols-1 gap-4">
              {(
                [
                  ['linkedinUrl', 'LinkedIn', Linkedin, 'https://www.linkedin.com/in/your-name'],
                  ['githubUrl', 'GitHub', Github, 'https://github.com/your-name'],
                  ['portfolioUrl', 'Portfolio or website', Globe, 'https://'],
                ] as const
              ).map(([key, label, Icon, ph]) => (
                <Field key={key} label={label}>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C97AE]" />
                    <Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={ph} className="pl-9" />
                  </div>
                </Field>
              ))}
            </div>
          </Panel>

          <Panel title="LinkedIn checklist" description="Small changes that make recruiters stop scrolling." actions={me?.linkedinUrl && (
            <a href={me.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563EB] hover:underline">
              Open my LinkedIn <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {LINKEDIN_TIPS.map((t) => (
                <li key={t} className="flex gap-2 text-[13.5px] text-[#26355A]">
                  <BadgeCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="xl:col-span-4 space-y-5">
          <Panel title="Profile strength">
            <div className="flex items-end gap-3">
              <span className="mc-display mc-num text-[34px] font-semibold leading-none">{completeness}%</span>
              <StepMeter value={completeness} steps={8} height={28} width={110} tone={completeness >= 80 ? 'mint' : 'blue'} />
            </div>
            <ul className="mt-4 space-y-1.5">
              {checks.map(([label, ok]) => (
                <li key={label} className="flex items-center gap-2 text-[13.5px]">
                  {ok ? <CheckCircle2 className="w-4 h-4 text-[#0F9F6E]" /> : <Circle className="w-4 h-4 text-[#B7C3D7]" />}
                  <span className={ok ? 'text-[#26355A]' : 'text-[#7A869E]'}>{label}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Resume" description="PDF or Word, up to 10 MB. Shared with your mentor and counsellor.">
            {me?.resumeFileId ? (
              <div className="rounded-[12px] border border-[#EAEFF6] p-3 flex items-center gap-3 mb-3">
                <span className="h-10 w-10 rounded-[10px] bg-[#E8F0FE] text-[#1D4FD7] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <FileLink fileId={me.resumeFileId} name={me.resumeFileName || 'Resume'} />
                  {me.resumeUpdatedAt && <div className="text-[12px] text-[#7A869E]">Updated {fmtDay(me.resumeUpdatedAt)}</div>}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#5B6885] mb-3">No resume uploaded yet.</p>
            )}
            <FilePicker value={resume} onChange={saveResume} category="document" accept=".pdf,.doc,.docx" label={me?.resumeFileId ? 'Replace resume' : 'Upload resume'} onError={setError} />
            {reviewer && me?.resumeFileId && (
              <Button
                size="sm"
                className="mt-3 w-full"
                icon={Send}
                onClick={async () => {
                  const sent = await store.sendMessage({ recipientId: reviewer.id, content: `Hi ${reviewer.name.split(' ')[0]}, I've uploaded my latest resume (${me.resumeFileName || 'resume'}). Could you review it and suggest changes?` });
                  if (sent) toast(`Asked ${reviewer.name} for a review.`);
                }}
              >
                Ask {reviewer.name.split(' ')[0]} to review
              </Button>
            )}
          </Panel>

          <Panel title="Preview">
            <div className="flex items-center gap-3">
              {me?.avatarUrl ? <img src={me.avatarUrl} alt="" className="h-12 w-12 rounded-[12px] object-cover" /> : <Avatar name={me?.name || profile.name} size={48} tone="blue" />}
              <div className="min-w-0">
                <div className="mc-display text-[16px] font-semibold truncate">{me?.name || profile.name}</div>
                <div className="text-[12.5px] text-[#5B6885] line-clamp-2">{form.headline || 'Add a headline'}</div>
              </div>
            </div>
            {splitList(form.skills).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {splitList(form.skills).map((s) => (
                  <Badge key={s} tone="blue">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

export const ServicesPage: React.FC = () => {
  const { state, me, store, toast, go } = useStudent();
  const [buying, setBuying] = useState<ServiceOffering | null>(null);
  const { busy, error, setError, run } = useAsyncAction();
  const owned = new Set([...(me?.selectedAddOns || []), ...state.invoices.filter((i) => i.kind === 'Service' && i.status === 'Paid').map((i) => i.serviceName || '')]);
  const pending = new Map(state.invoices.filter((i) => i.kind === 'Service' && (i.status === 'Due' || i.status === 'Verifying')).map((i) => [i.serviceId, i]));
  const categories = Array.from(new Set(state.services.map((s) => s.category)));

  return (
    <div className="space-y-5">
      <PageHeader title="Add a service" description="Stand-alone services you can add to your program. You'll get an invoice; the service starts once payment is confirmed." />
      {state.services.length === 0 ? (
        <Panel>
          <Empty icon={ShoppingBag} title="No services available right now" body="Message support if you need something specific." />
        </Panel>
      ) : (
        categories.map((cat) => (
          <section key={cat}>
            <h2 className="mc-display text-[17px] font-semibold mb-3">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {state.services
                .filter((s) => s.category === cat)
                .map((s) => {
                  const inv = pending.get(s.id);
                  const has = owned.has(s.name);
                  return (
                    <Panel key={s.id} className="flex flex-col" bodyClassName="flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 pt-1">
                        <h3 className="text-[15.5px] font-semibold leading-snug">{s.name}</h3>
                        {has && <Badge tone="mint">Active</Badge>}
                        {!has && inv && <Badge tone="marigold">{inv.status === 'Verifying' ? 'Verifying payment' : 'Awaiting payment'}</Badge>}
                      </div>
                      <p className="mt-1.5 text-[13.5px] text-[#5B6885] flex-1">{s.description}</p>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <div className="mc-display mc-num text-[22px] font-semibold">{s.price}</div>
                          <div className="text-[12px] text-[#7A869E]">{s.duration}</div>
                        </div>
                        {inv ? (
                          <Button size="sm" onClick={() => go('invoices')}>
                            View invoice
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={has ? 'secondary' : 'primary'}
                            icon={ShoppingBag}
                            onClick={() => {
                              setError(null);
                              setBuying(s);
                            }}
                          >
                            {has ? 'Buy again' : 'Buy'}
                          </Button>
                        )}
                      </div>
                    </Panel>
                  );
                })}
            </div>
          </section>
        ))
      )}
      <Modal
        open={!!buying}
        onClose={() => setBuying(null)}
        title={`Add ${buying?.name || ''}`}
        description="We'll create an invoice. Pay it from Invoices and the service starts once we confirm."
        footer={
          <>
            <Button onClick={() => setBuying(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={busy}
              onClick={async () => {
                if (!buying) return;
                if (await run(() => store.purchaseService(buying.id))) {
                  toast('Invoice created. Pay it to start the service.');
                  setBuying(null);
                  go('invoices');
                }
              }}
            >
              {busy ? 'Creating…' : `Get invoice for ${buying?.price || ''}`}
            </Button>
          </>
        }
      >
        <FormError message={error} />
        {buying && (
          <dl className="mt-2 grid grid-cols-2 gap-3 text-[13.5px]">
            <div>
              <dt className="text-[#7A869E]">Service</dt>
              <dd className="font-semibold">{buying.name}</dd>
            </div>
            <div>
              <dt className="text-[#7A869E]">Duration</dt>
              <dd className="font-semibold">{buying.duration || '—'}</dd>
            </div>
            <div>
              <dt className="text-[#7A869E]">Price</dt>
              <dd className="font-semibold">{buying.price}</dd>
            </div>
            <div>
              <dt className="text-[#7A869E]">Payment due</dt>
              <dd className="font-semibold">Within 7 days</dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

export const INVOICE_TONE: Record<Invoice['status'], Tone> = { Due: 'marigold', Verifying: 'blue', Paid: 'mint', Cancelled: 'neutral' };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function printInvoice(inv: Invoice) {
  const w = window.open('', '_blank', 'width=900,height=900');
  if (!w) return;
  const rows = inv.lines.map((l) => `<tr><td>${esc(l.description)}</td><td class="r">₹${l.amount.toLocaleString('en-IN')}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(inv.number)}</title>
<style>body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0D1B3E;margin:0;background:#F3F6FB}.page{max-width:760px;margin:24px auto;background:#fff;padding:48px;border-radius:12px}
h1{margin:0;font-size:28px}.muted{color:#5B6885}.row{display:flex;justify-content:space-between;gap:24px;margin-top:28px}table{width:100%;border-collapse:collapse;margin-top:28px}
th,td{padding:10px 0;border-bottom:1px solid #DDE4EF;text-align:left;font-size:14px}.r{text-align:right}.total td{font-weight:700;font-size:16px;border-bottom:0}
.status{display:inline-block;padding:4px 10px;border-radius:99px;background:#EEF2F7;font-weight:600;font-size:12px}.brand{font-weight:800;font-size:20px}.brand b{color:#2563EB}
.np{text-align:right;max-width:760px;margin:16px auto 0}.np button{font:600 14px system-ui;background:#2563EB;color:#fff;border:0;border-radius:10px;padding:10px 16px;cursor:pointer}@media print{.np{display:none}body{background:#fff}.page{margin:0}}</style></head><body>
<div class="np"><button onclick="window.print()">Print / save as PDF</button></div>
<div class="page"><div class="row" style="margin-top:0"><div><div class="brand">Maxi<b>career</b></div><div class="muted">contact@maxicareer.com</div></div><div style="text-align:right"><h1>Invoice</h1><div class="muted">${esc(inv.number)}</div><div class="status">${esc(inv.status)}</div></div></div>
<div class="row"><div><div class="muted">Billed to</div><strong>${esc(inv.studentName)}</strong><div>${esc(inv.studentEmail)}</div></div><div style="text-align:right"><div><span class="muted">Issued</span> ${esc(fmtDay(inv.issuedAt))}</div><div><span class="muted">Due</span> ${esc(fmtDay(inv.dueDate))}</div>${inv.paidAt ? `<div><span class="muted">Paid</span> ${esc(fmtDay(inv.paidAt))}</div>` : ''}</div></div>
<table><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody>${rows}<tr class="total"><td>Total</td><td class="r">₹${inv.total.toLocaleString('en-IN')}</td></tr></tbody></table>
${inv.paymentReference ? `<p class="muted">Payment reference: ${esc(inv.paymentReference)}${inv.paymentMethod ? ` (${esc(inv.paymentMethod)})` : ''}</p>` : ''}
${inv.notes ? `<p class="muted">${esc(inv.notes)}</p>` : ''}
</div></body></html>`);
  w.document.close();
}

export const InvoicesPage: React.FC = () => {
  const { state, store, toast, whatsappUrl } = useStudent();
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [ref, setRef] = useState('');
  const [method, setMethod] = useState('UPI');
  const { busy, error, setError, run } = useAsyncAction();
  const invoices = [...state.invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const outstanding = invoices.filter((i) => i.status === 'Due' || i.status === 'Verifying').reduce((a, i) => a + i.total, 0);
  const paid = invoices.filter((i) => i.status === 'Paid').reduce((a, i) => a + i.total, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Invoices" description="Your program, service and renewal invoices. Print any invoice for your records." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Outstanding" value={inr(outstanding)} hint={`${invoices.filter((i) => i.status === 'Due').length} to pay`} />
        <Stat label="Paid" value={inr(paid)} hint={(() => {
            const n = invoices.filter((i) => i.status === 'Paid').length;
            return `${n} invoice${n === 1 ? '' : 's'}`;
          })()} />
        <Stat label="Awaiting confirmation" value={invoices.filter((i) => i.status === 'Verifying').length} hint="We check payments within 1 working day" />
      </div>

      {invoices.some((i) => i.status === 'Due') && (
        <Panel title="How to pay">
          <p className="text-[13.5px] text-[#33415F] whitespace-pre-wrap">{state.paymentInstructions}</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#BFE6D5] bg-[#E3F6EE] px-3 text-[13px] font-semibold text-[#0B7A55]">
            <MessageCircle className="w-4 h-4" /> Get payment details on WhatsApp
          </a>
        </Panel>
      )}

      <Panel flush>
        {invoices.length === 0 ? (
          <Empty icon={Receipt} title="No invoices yet" body="Invoices for services and renewals you request appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>For</Th>
                  <Th>Issued</Th>
                  <Th>Due</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Status</Th>
                  <Th className="text-right">&nbsp;</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF6]">
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <Td className="mc-num font-semibold whitespace-nowrap">{i.number}</Td>
                    <Td>
                      <div className="font-medium">{i.lines[0]?.description || i.kind}</div>
                      <div className="text-[12px] text-[#7A869E]">{i.kind}</div>
                    </Td>
                    <Td className="whitespace-nowrap">{fmtDay(i.issuedAt)}</Td>
                    <Td className="whitespace-nowrap">{fmtDay(i.dueDate)}</Td>
                    <Td className="mc-num text-right font-semibold whitespace-nowrap">{inr(i.total)}</Td>
                    <Td>
                      <Badge tone={INVOICE_TONE[i.status]} dot>
                        {i.status === 'Verifying' ? 'Verifying' : i.status}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {i.status === 'Due' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setRef('');
                              setMethod('UPI');
                              setError(null);
                              setPaying(i);
                            }}
                          >
                            I have paid
                          </Button>
                        )}
                        <Button size="sm" icon={Printer} onClick={() => printInvoice(i)}>
                          View
                        </Button>
                        {i.status === 'Due' && (i.kind === 'Service' || i.kind === 'Renewal') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              if (!window.confirm(`Cancel ${i.number}?`)) return;
                              try {
                                await store.cancelInvoice(i.id);
                                toast('Order cancelled.');
                              } catch (err) {
                                toast(err instanceof Error ? err.message : 'Could not cancel.', 'error');
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={!!paying}
        onClose={() => setPaying(null)}
        title={`Confirm payment for ${paying?.number || ''}`}
        description={paying ? `${inr(paying.total)} · our team checks the reference and marks the invoice paid.` : ''}
        footer={
          <>
            <Button onClick={() => setPaying(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={busy || !ref.trim()}
              onClick={async () => {
                if (!paying) return;
                if (await run(() => store.reportPayment(paying.id, ref, method))) {
                  toast('Thanks! We will confirm your payment shortly.');
                  setPaying(null);
                }
              }}
            >
              {busy ? 'Sending…' : 'Send for confirmation'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormError message={error} />
          <Field label="Paid by">
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>UPI</option>
              <option>Bank transfer</option>
              <option>Card</option>
              <option>Cash</option>
            </Select>
          </Field>
          <Field label="Transaction reference" hint="UPI reference / UTR number from your payment app or bank.">
            <Input value={ref} onChange={(e) => setRef(e.target.value)} autoFocus placeholder="e.g. 428117263511" />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Renewal                                                             */
/* ------------------------------------------------------------------ */

export const RenewalPage: React.FC = () => {
  const { state, me, profile, store, toast, go } = useStudent();
  const { busy, error, run } = useAsyncAction();
  const left = daysLeft(me?.programEndsAt);
  const planPrice = me?.planPrice ?? profile.planPrice ?? 0;
  const openRenewal = state.invoices.find((i) => i.kind === 'Renewal' && (i.status === 'Due' || i.status === 'Verifying'));
  const history = state.invoices.filter((i) => i.kind === 'Renewal').sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const status = STATUS_META[me?.status || 'pending'] || STATUS_META.pending;

  return (
    <div className="space-y-5">
      <PageHeader title="Renewal" description="Extend your program to keep your mentor, sessions, curriculum and resources." />
      <FormError message={error} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Program" value={<span className="text-[20px]">{me?.planName || profile.planName}</span>} hint={<Badge tone={status.tone}>{status.label}</Badge>} />
        <Stat label="Access until" value={<span className="text-[24px]">{me?.programEndsAt ? fmtDay(me.programEndsAt) : '—'}</span>} />
        <Stat
          label="Days left"
          value={<span className={cx(left !== null && left <= 30 && 'text-[#B42F3B]')}>{left === null ? '—' : Math.max(0, left)}</span>}
          hint={left !== null && left < 0 ? 'Your access has ended' : left !== null && left <= 30 ? 'Renew soon to avoid a gap' : 'You are all set'}
        />
      </div>

      {openRenewal ? (
        <Panel>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <RefreshCcw className="w-5 h-5 text-[#2563EB] shrink-0" />
            <div className="flex-1">
              <div className="text-[14.5px] font-semibold">Renewal requested · invoice {openRenewal.number}</div>
              <div className="text-[13px] text-[#5B6885]">
                {inr(openRenewal.total)} · {openRenewal.status === 'Verifying' ? 'we are confirming your payment' : `due ${fmtDay(openRenewal.dueDate)}`}
              </div>
            </div>
            <Button variant="primary" onClick={() => go('invoices')}>
              {openRenewal.status === 'Due' ? 'Pay now' : 'View invoice'}
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.renewalOptions.map((o) => {
            const price = Math.round((planPrice * o.percent) / 100);
            return (
              <Panel key={o.id} className="flex flex-col" bodyClassName="flex-1 flex flex-col">
                <div className="text-[13px] text-[#5B6885] pt-1">Renew for</div>
                <div className="mc-display text-[24px] font-semibold">{o.label}</div>
                <div className="mt-3 mc-display mc-num text-[30px] font-semibold">{price ? inr(price) : 'On request'}</div>
                <ul className="mt-3 space-y-1.5 text-[13px] text-[#33415F] flex-1">
                  {['Same mentor and counsellor', 'Unlimited chat between sessions', 'Curriculum, tests and resources'].map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0F9F6E] shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4"
                  variant="primary"
                  disabled={busy || !price}
                  onClick={async () => {
                    if (!window.confirm(`Request a ${o.label} renewal for ${inr(price)}? We'll create an invoice for you to pay.`)) return;
                    if (await run(() => store.requestRenewal(o.id))) {
                      toast('Renewal invoice created.');
                      go('invoices');
                    }
                  }}
                >
                  Request renewal
                </Button>
              </Panel>
            );
          })}
          {state.renewalOptions.length === 0 && (
            <Panel>
              <Empty icon={RefreshCcw} title="Renewal options aren't set up yet" body="Message support and our team will help you renew." />
            </Panel>
          )}
        </div>
      )}

      {history.length > 0 && (
        <Panel title="Renewal history" flush>
          <ul className="divide-y divide-[#EAEFF6]">
            {history.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-semibold truncate">{i.lines[0]?.description}</span>
                  <span className="block text-[12.5px] text-[#7A869E]">
                    {i.number} · {fmtDay(i.issuedAt)}
                  </span>
                </span>
                <span className="mc-num text-[14px] font-semibold">{inr(i.total)}</span>
                <Badge tone={INVOICE_TONE[i.status]}>{i.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
};

