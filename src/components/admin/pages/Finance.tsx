import React, { useMemo, useState } from 'react';
import { Plus, Download, Check, X, Printer, Pencil, Trash2, Receipt, Wallet, Undo2, Settings2, Timer } from 'lucide-react';
import { useAdmin } from '../context';
import { PageHeader, Panel, Stat, Badge, Button, IconButton, Empty, Segmented, Modal, Field, Input, Select, Textarea, SearchInput, Th, Td, cx, Tone } from '../ui';
import { useSharedCollection, useSharedValue, uid, formatDate, downloadCsv, inr, plural } from '../lib';
import type { Invoice, InvoiceLine, InvoiceStatus, Payout, Expense, WorkLog, RenewalOption } from '../../../types/portal';
import type { UploadedFile } from '../../../lib/api';
import { FileLink, FilePicker, isoOf, minutesOf } from '../../workspace/kit';
import { OFFICIAL_EMAIL, OFFICIAL_PHONE } from '../../../data/portalData';

const todayIso = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const money = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/** Same format the server uses: MC-YYYYMMDD-XXXX. */
const invoiceNumber = () => `MC-${todayIso().replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const INVOICE_TONE: Record<InvoiceStatus, Tone> = { Due: 'marigold', Verifying: 'blue', Paid: 'mint', Cancelled: 'neutral' };
const INVOICE_LABEL: Record<InvoiceStatus, string> = { Due: 'Due', Verifying: 'Payment to verify', Paid: 'Paid', Cancelled: 'Cancelled' };

const DEFAULT_RENEWAL_OPTIONS: RenewalOption[] = [
  { id: 'renew-6', label: '6 months', months: 6, percent: 50 },
  { id: 'renew-12', label: '12 months', months: 12, percent: 90 },
];
const DEFAULT_PAYMENT_INSTRUCTIONS =
  'Pay by UPI or bank transfer using the details our team shares on WhatsApp or email. After paying, click "I have paid" on the invoice and enter the transaction reference so we can confirm it.';

const monthKeyOf = (iso: string) => iso.slice(0, 7);
const monthLabel = (key: string) => new Date(`${key}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const recentMonths = (n: number) => {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) out.push(new Date(d.getFullYear(), d.getMonth() - i, 1).toISOString().slice(0, 7));
  return out;
};

function printInvoice(inv: Invoice) {
  const w = window.open('', '_blank', 'width=860,height=1000');
  if (!w) return;
  const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
  const rows = inv.lines.map((l) => `<tr><td>${esc(l.description)}</td><td class="r">₹${l.amount.toLocaleString('en-IN')}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(inv.number)}</title>
<style>body{font-family:Arial,sans-serif;color:#0D1B3E;margin:40px}h1{margin:0;font-size:28px}.m{color:#5B6885;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:28px}th,td{padding:10px;border-bottom:1px solid #DDE4EF;text-align:left;font-size:14px}.r{text-align:right}.t td{font-weight:bold;border-bottom:2px solid #0D1B3E}.s{display:inline-block;padding:4px 10px;border-radius:99px;background:#EEF2F7;font-size:12px;font-weight:bold}.g{display:flex;justify-content:space-between;margin-top:24px}</style></head>
<body><div class="g"><div><h1>Maxicareer</h1><div class="m">${esc(OFFICIAL_EMAIL)} · ${esc(OFFICIAL_PHONE)}</div></div><div style="text-align:right"><h1>Invoice</h1><div class="m">${esc(inv.number)}</div><div class="s">${esc(INVOICE_LABEL[inv.status])}</div></div></div>
<div class="g"><div><div class="m">Billed to</div><strong>${esc(inv.studentName)}</strong><div class="m">${esc(inv.studentEmail)}</div></div><div style="text-align:right"><div class="m">Issued ${esc(formatDate(inv.issuedAt))}</div><div class="m">Due ${esc(formatDate(inv.dueDate))}</div>${inv.paidAt ? `<div class="m">Paid ${esc(formatDate(inv.paidAt))}${inv.paymentReference ? ` · ref ${esc(inv.paymentReference)}` : ''}</div>` : ''}</div></div>
<table><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody>${rows}<tr class="t"><td>Total</td><td class="r">₹${inv.total.toLocaleString('en-IN')}</td></tr></tbody></table>
${inv.notes ? `<p class="m" style="margin-top:20px">${esc(inv.notes)}</p>` : ''}<script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}

/* ================================================================== */
/* Payments                                                            */
/* ================================================================== */

const InvoiceEditor: React.FC<{ open: boolean; onClose: () => void; onSave: (inv: Invoice) => void }> = ({ open, onClose, onSave }) => {
  const { students } = useAdmin();
  const [studentId, setStudentId] = useState('');
  const [kind, setKind] = useState<Invoice['kind']>('Enrolment');
  const [lines, setLines] = useState<(InvoiceLine & { key: number })[]>([{ key: 1, description: '', amount: 0 }]);
  const [dueDate, setDueDate] = useState(plusDays(7));
  const [months, setMonths] = useState(12);
  const [notes, setNotes] = useState('');
  const student = students.find((s) => s._id === studentId);
  React.useEffect(() => {
    if (open) {
      setStudentId('');
      setKind('Enrolment');
      setLines([{ key: Date.now(), description: '', amount: 0 }]);
      setDueDate(plusDays(7));
      setNotes('');
    }
  }, [open]);
  const pickStudent = (id: string) => {
    setStudentId(id);
    const s = students.find((x) => x._id === id);
    if (s && kind === 'Enrolment' && !lines.some((l) => l.description.trim())) setLines([{ key: Date.now(), description: s.planName, amount: s.planPrice || 0 }]);
  };
  const total = money(lines.reduce((s, l) => s + (Number(l.amount) || 0), 0));
  const valid = student && total > 0 && lines.every((l) => l.description.trim() || !l.amount);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New invoice"
      description="The student sees it under Invoices and is notified."
      width="max-w-2xl"
      footer={
        <>
          <span className="mr-auto self-center mc-display mc-num text-[18px] font-semibold">Total {inr(total)}</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() =>
              student &&
              onSave({
                id: uid('inv'),
                number: invoiceNumber(),
                studentId: student._id,
                studentName: student.name,
                studentEmail: student.email,
                kind,
                lines: lines.filter((l) => l.description.trim()).map(({ description, amount }) => ({ description: description.trim(), amount: money(amount) })),
                total,
                status: 'Due',
                issuedAt: new Date().toISOString(),
                dueDate,
                notes: notes.trim() || undefined,
                ...(kind === 'Renewal' ? { renewalMonths: months } : {}),
              })
            }
          >
            Issue invoice
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Student" className="sm:col-span-2">
            <Select value={studentId} onChange={(e) => pickStudent(e.target.value)}>
              <option value="">Choose a student</option>
              {[...students]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} · {s.email}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={kind} onChange={(e) => setKind(e.target.value as Invoice['kind'])}>
              {(['Enrolment', 'Service', 'Renewal', 'Other'] as const).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          {kind === 'Renewal' && (
            <Field label="Extends access by (months)" hint="Applied when you mark it paid." className="sm:col-span-2">
              <Input type="number" min={1} max={36} value={months} onChange={(e) => setMonths(Math.max(1, Math.min(36, Number(e.target.value) || 12)))} className="max-w-[160px]" />
            </Field>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-[#26355A]">Items</span>
            <div className="flex gap-1.5">
              {student && (
                <Button size="sm" onClick={() => setLines((ls) => [...ls.filter((l) => l.description.trim()), { key: Date.now(), description: student.planName, amount: student.planPrice || 0 }])}>
                  + Program fee
                </Button>
              )}
              <Button size="sm" icon={Plus} onClick={() => setLines((ls) => [...ls, { key: Date.now(), description: '', amount: 0 }])}>
                Item
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {lines.map((l) => (
              <div key={l.key} className="grid grid-cols-[1fr_140px_32px] gap-2">
                <Input value={l.description} onChange={(e) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, description: e.target.value } : x)))} placeholder="Description" aria-label="Description" />
                <Input type="number" min={0} value={l.amount || ''} onChange={(e) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, amount: Number(e.target.value) || 0 } : x)))} placeholder="₹" aria-label="Amount" />
                <IconButton icon={Trash2} tone="danger" label="Remove item" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))} />
              </div>
            ))}
          </div>
        </div>
        <Field label="Note on the invoice" hint="Optional">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
};

const MarkPaidModal: React.FC<{ invoice: Invoice | null; onClose: () => void; onSave: (inv: Invoice) => void }> = ({ invoice, onClose, onSave }) => {
  const [method, setMethod] = useState('UPI');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(todayIso());
  React.useEffect(() => {
    if (invoice) {
      setMethod(invoice.paymentMethod || 'UPI');
      setReference(invoice.paymentReference || '');
      setDate(todayIso());
    }
  }, [invoice]);
  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title="Record payment"
      description={invoice ? `${invoice.number} · ${invoice.studentName} · ${inr(invoice.total)}` : undefined}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={Check} onClick={() => invoice && onSave({ ...invoice, status: 'Paid', paymentMethod: method, paymentReference: reference.trim(), paidAt: new Date(`${date}T12:00:00`).toISOString() })}>
            Mark as paid
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {invoice?.status === 'Verifying' && (
          <p className="sm:col-span-2 rounded-[10px] bg-[#E8F0FE] px-3.5 py-2.5 text-[13px] text-[#1D4FD7]">
            The student reported paying by {invoice.paymentMethod || 'UPI / bank transfer'} with reference <strong>{invoice.paymentReference}</strong>. Check your bank statement before confirming.
          </p>
        )}
        <Field label="Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {Array.from(new Set(['UPI', 'Bank transfer', 'Card', 'Cash', 'Cheque', method])).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Paid on">
          <Input type="date" max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Reference / transaction ID" className="sm:col-span-2">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        {invoice?.kind === 'Renewal' && <p className="sm:col-span-2 text-[12.5px] text-[#5B6885]">Marking paid extends the student's access by {invoice.renewalMonths || 12} months.</p>}
      </div>
    </Modal>
  );
};

type PayoutDraft = Payout & { rate: number };

const PayoutEditor: React.FC<{ draft: PayoutDraft | null; worklogs: WorkLog[]; onClose: () => void; onSave: (p: Payout) => void }> = ({ draft, worklogs, onClose, onSave }) => {
  const { platform } = useAdmin();
  const [p, setP] = useState<PayoutDraft | null>(draft);
  const [month, setMonth] = useState(recentMonths(2)[1]);
  React.useEffect(() => setP(draft), [draft]);
  const providers = useMemo(
    () => [
      ...platform.counselors.filter((c) => c.approvalStatus === 'approved').map((c) => ({ id: c.id, name: c.name, kind: 'counselor' as const, minutes: minutesOf(c.sessionDuration) })),
      ...platform.mentors.filter((m) => m.approvalStatus === 'approved').map((m) => ({ id: m.id, name: m.name, kind: 'mentor' as const, minutes: minutesOf(m.sessionDuration) })),
    ].sort((a, b) => a.name.localeCompare(b.name)),
    [platform.counselors, platform.mentors]
  );
  if (!p) return <Modal open={false} onClose={onClose} title="" children={null} />;

  /** Fill sessions and hours from completed sessions and logged work in a month. */
  const calc = (providerId: string, key: string, rate: number) => {
    const prov = providers.find((x) => x.id === providerId);
    const sessions = platform.appointments.filter((a) => a.counselorId === providerId && a.status === 'completed' && isoOf(a.date).startsWith(key)).length;
    const logged = worklogs.filter((w) => w.providerId === providerId && w.date.startsWith(key)).reduce((s, w) => s + w.hours, 0);
    const hours = money((sessions * (prov?.minutes || 45)) / 60 + logged);
    return { sessions, hours, amount: money(hours * rate), period: monthLabel(key) };
  };
  const prov = providers.find((x) => x.id === p.providerId);

  return (
    <Modal
      open={!!draft}
      onClose={onClose}
      title={p.id ? 'Edit payout' : 'New payout'}
      description="Pay a counsellor or mentor for their sessions and logged hours."
      width="max-w-xl"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!p.providerId || !(p.amount > 0) || !p.period.trim()}
            onClick={() => {
              const { rate, ...rest } = p;
              onSave({ ...rest, id: p.id || uid('pay'), providerName: prov?.name || p.providerName, providerKind: prov?.kind || p.providerKind, paidOn: p.status === 'Paid' ? p.paidOn || todayIso() : undefined });
            }}
          >
            Save payout
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Counsellor or mentor" className="sm:col-span-2">
          <Select
            value={p.providerId}
            onChange={(e) => {
              const id = e.target.value;
              setP({ ...p, providerId: id, ...(p.id ? {} : calc(id, month, p.rate)) });
            }}
          >
            <option value="">Choose…</option>
            {providers.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} ({x.kind === 'counselor' ? 'Counsellor' : 'Mentor'})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Work month" hint="Fills sessions and hours from the records.">
          <Select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              if (p.providerId) setP({ ...p, ...calc(p.providerId, e.target.value, p.rate) });
            }}
          >
            {recentMonths(12).map((k) => (
              <option key={k} value={k}>
                {monthLabel(k)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Rate per hour (₹)">
          <Input type="number" min={0} value={p.rate || ''} onChange={(e) => { const rate = Number(e.target.value) || 0; setP({ ...p, rate, amount: money(p.hours * rate) }); }} />
        </Field>
        <Field label="Period label">
          <Input value={p.period} onChange={(e) => setP({ ...p, period: e.target.value })} placeholder="October 2026" />
        </Field>
        <Field label="Sessions">
          <Input type="number" min={0} value={p.sessions} onChange={(e) => setP({ ...p, sessions: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Hours">
          <Input type="number" min={0} step={0.25} value={p.hours} onChange={(e) => { const hours = Number(e.target.value) || 0; setP({ ...p, hours, amount: p.rate ? money(hours * p.rate) : p.amount }); }} />
        </Field>
        <Field label="Amount (₹)">
          <Input type="number" min={0} value={p.amount || ''} onChange={(e) => setP({ ...p, amount: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Status">
          <Select value={p.status} onChange={(e) => setP({ ...p, status: e.target.value as Payout['status'] })}>
            <option>Pending</option>
            <option>Paid</option>
          </Select>
        </Field>
        <Field label="Method">
          <Input value={p.method} onChange={(e) => setP({ ...p, method: e.target.value })} placeholder="Bank transfer" />
        </Field>
        <Field label="Reference" className="sm:col-span-2">
          <Input value={p.reference} onChange={(e) => setP({ ...p, reference: e.target.value })} placeholder="UTR / transaction ID" />
        </Field>
        <Field label="Note for them" className="sm:col-span-2">
          <Input value={p.notes || ''} onChange={(e) => setP({ ...p, notes: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
};

export const Payments: React.FC = () => {
  const { addAudit, toast } = useAdmin();
  const [invoices, setInvoices] = useSharedCollection<Invoice>('invoices', [], { refreshMs: 30_000 });
  const [payouts, setPayouts] = useSharedCollection<Payout>('payouts', []);
  const [worklogs] = useSharedCollection<WorkLog>('worklogs', []);
  const [renewalOptions, setRenewalOptions] = useSharedValue<RenewalOption[]>('renewal_options', DEFAULT_RENEWAL_OPTIONS);
  const [instructions, setInstructions] = useSharedValue<string>('payment_instructions', DEFAULT_PAYMENT_INSTRUCTIONS);
  const [tab, setTab] = useState<'invoices' | 'payouts' | 'settings'>('invoices');
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all');
  const [q, setQ] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [payout, setPayout] = useState<PayoutDraft | null>(null);

  const live = invoices.filter((i) => i.status !== 'Cancelled');
  const billed = live.reduce((s, i) => s + i.total, 0);
  const collected = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter((i) => i.status === 'Due' || i.status === 'Verifying').reduce((s, i) => s + i.total, 0);
  const verifying = invoices.filter((i) => i.status === 'Verifying');
  const shown = [...invoices]
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
    .filter((i) => (filter === 'all' || i.status === filter) && (!q || `${i.number} ${i.studentName} ${i.studentEmail}`.toLowerCase().includes(q.toLowerCase())));
  const update = (inv: Invoice, action: string) => {
    setInvoices((prev) => prev.map((x) => (x.id === inv.id ? inv : x)));
    addAudit('Payments', action, `${inv.number} · ${inv.studentName}`);
  };

  const year = String(new Date().getFullYear());
  const paidOut = payouts.filter((p) => p.status === 'Paid' && (p.paidOn || p.createdAt).startsWith(year)).reduce((s, p) => s + p.amount, 0);
  const pendingOut = payouts.filter((p) => p.status === 'Pending');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        description="Student invoices and payments, and payouts to counsellors and mentors."
        actions={
          tab === 'invoices' ? (
            <>
              <Button
                icon={Download}
                disabled={!shown.length}
                onClick={() =>
                  downloadCsv(
                    `maxicareer_invoices_${todayIso()}.csv`,
                    ['Number', 'Student', 'Email', 'Type', 'Issued', 'Due', 'Total (INR)', 'Status', 'Paid on', 'Method', 'Reference'],
                    shown.map((i) => [i.number, i.studentName, i.studentEmail, i.kind, i.issuedAt.slice(0, 10), i.dueDate, i.total, i.status, i.paidAt?.slice(0, 10) || '', i.paymentMethod || '', i.paymentReference || ''])
                  )
                }
              >
                Export
              </Button>
              <Button variant="primary" icon={Plus} onClick={() => setNewOpen(true)}>
                New invoice
              </Button>
            </>
          ) : tab === 'payouts' ? (
            <Button variant="primary" icon={Plus} onClick={() => setPayout({ id: '', providerId: '', providerName: '', providerKind: 'mentor', period: '', sessions: 0, hours: 0, amount: 0, method: 'Bank transfer', reference: '', status: 'Pending', createdAt: new Date().toISOString(), rate: 500 })}>
              New payout
            </Button>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Collected" value={<span className="text-[26px]">{inr(collected)}</span>} hint={`of ${inr(billed)} billed`} />
        <Stat label="Outstanding" value={<span className="text-[26px]">{inr(outstanding)}</span>} hint={(() => {
            const n = invoices.filter((i) => i.status === 'Due').length;
            return `${n} invoice${n === 1 ? '' : 's'} due`;
          })()} />
        <Stat
          label="Payments to verify"
          value={verifying.length}
          accent={verifying.length ? <span className="h-2.5 w-2.5 rounded-full bg-[#F2A93B]" /> : undefined}
          onClick={() => {
            setTab('invoices');
            setFilter('Verifying');
          }}
        />
        <Stat label={`Paid out in ${year}`} value={<span className="text-[26px]">{inr(paidOut)}</span>} hint={`${pendingOut.length} payout${pendingOut.length === 1 ? '' : 's'} pending`} onClick={() => setTab('payouts')} />
      </div>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'invoices', label: 'Invoices', count: invoices.length },
          { value: 'payouts', label: 'Payouts', count: payouts.length },
          { value: 'settings', label: 'Renewal & payment settings' },
        ]}
      />

      {tab === 'invoices' && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all' as const, label: 'All', count: invoices.length },
                ...(['Verifying', 'Due', 'Paid', 'Cancelled'] as const).map((s) => ({ value: s, label: s === 'Verifying' ? 'To verify' : s, count: invoices.filter((i) => i.status === s).length })),
              ]}
            />
            <SearchInput value={q} onChange={setQ} placeholder="Invoice number or student" className="lg:ml-auto lg:w-72" />
          </div>
          <Panel flush>
            {shown.length === 0 ? (
              <Empty icon={Receipt} title={invoices.length ? 'No invoices match' : 'No invoices yet'} body="Invoices appear when students buy a service or request a renewal, or when you issue one." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr>
                      <Th>Invoice</Th>
                      <Th>Student</Th>
                      <Th>Issued</Th>
                      <Th>Due</Th>
                      <Th className="text-right">Amount</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEFF6]">
                    {shown.map((i) => {
                      const overdue = i.status === 'Due' && i.dueDate < todayIso();
                      return (
                        <tr key={i.id} className={cx(i.status === 'Verifying' && 'bg-[#F5F8FF]')}>
                          <Td>
                            <div className="mc-num font-semibold">{i.number}</div>
                            <div className="text-[12px] text-[#7A869E] truncate max-w-[220px]">
                              {i.kind} · {i.lines.map((l) => l.description).join(', ')}
                            </div>
                          </Td>
                          <Td>
                            <div className="font-semibold">{i.studentName}</div>
                            <div className="text-[12px] text-[#7A869E]">{i.studentEmail}</div>
                          </Td>
                          <Td className="whitespace-nowrap">{formatDate(i.issuedAt)}</Td>
                          <Td className={cx('whitespace-nowrap', overdue && 'text-[#B42F3B] font-semibold')}>{formatDate(i.dueDate)}</Td>
                          <Td className="mc-num text-right font-semibold">{inr(i.total)}</Td>
                          <Td>
                            <Badge tone={overdue ? 'rose' : INVOICE_TONE[i.status]} dot>
                              {overdue ? 'Overdue' : INVOICE_LABEL[i.status]}
                            </Badge>
                            {i.status === 'Verifying' && <div className="text-[11.5px] text-[#1D4FD7] mt-0.5 mc-num">ref {i.paymentReference}</div>}
                            {i.status === 'Paid' && i.paymentReference && <div className="text-[11.5px] text-[#7A869E] mt-0.5 mc-num">ref {i.paymentReference}</div>}
                          </Td>
                          <Td className="text-right whitespace-nowrap">
                            <div className="inline-flex gap-1">
                              {(i.status === 'Due' || i.status === 'Verifying') && (
                                <Button size="sm" variant={i.status === 'Verifying' ? 'primary' : 'secondary'} icon={Check} onClick={() => setPaying(i)}>
                                  {i.status === 'Verifying' ? 'Confirm' : 'Mark paid'}
                                </Button>
                              )}
                              {i.status === 'Verifying' && (
                                <IconButton
                                  icon={Undo2}
                                  label="Payment not found"
                                  onClick={() => {
                                    if (!window.confirm(`Send ${i.number} back to "Due"? ${i.studentName} will be asked to check the reference.`)) return;
                                    update({ ...i, status: 'Due' }, 'Payment not confirmed');
                                  }}
                                />
                              )}
                              <IconButton icon={Printer} label="View / print" onClick={() => printInvoice(i)} />
                              {i.status === 'Due' && (
                                <IconButton
                                  icon={X}
                                  tone="danger"
                                  label="Cancel invoice"
                                  onClick={() => {
                                    if (!window.confirm(`Cancel ${i.number}?`)) return;
                                    update({ ...i, status: 'Cancelled' }, 'Cancelled invoice');
                                  }}
                                />
                              )}
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}

      {tab === 'payouts' && (
        <Panel flush>
          {payouts.length === 0 ? (
            <Empty icon={Wallet} title="No payouts yet" body="Record what you pay counsellors and mentors. They see each payout in their Payment history." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr>
                    <Th>Payee</Th>
                    <Th>Period</Th>
                    <Th className="text-right">Sessions</Th>
                    <Th className="text-right">Hours</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFF6]">
                  {[...payouts]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((p) => (
                      <tr key={p.id}>
                        <Td>
                          <div className="font-semibold">{p.providerName}</div>
                          <div className="text-[12px] text-[#7A869E]">{p.providerKind === 'counselor' ? 'Counsellor' : 'Mentor'}</div>
                        </Td>
                        <Td>{p.period}</Td>
                        <Td className="mc-num text-right">{p.sessions}</Td>
                        <Td className="mc-num text-right">{p.hours}</Td>
                        <Td className="mc-num text-right font-semibold">{inr(p.amount)}</Td>
                        <Td>
                          <Badge tone={p.status === 'Paid' ? 'mint' : 'marigold'} dot>
                            {p.status}
                          </Badge>
                          {p.paidOn && <div className="text-[11.5px] text-[#7A869E] mt-0.5">{formatDate(p.paidOn)}</div>}
                        </Td>
                        <Td className="text-right whitespace-nowrap">
                          <div className="inline-flex gap-1">
                            {p.status === 'Pending' && (
                              <Button
                                size="sm"
                                icon={Check}
                                onClick={() => {
                                  const reference = window.prompt(`Reference for the ${inr(p.amount)} payment to ${p.providerName} (optional):`, p.reference || '');
                                  if (reference === null) return;
                                  setPayouts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: 'Paid', paidOn: todayIso(), reference: reference.trim() || x.reference } : x)));
                                  addAudit('Payments', 'Paid payout', `${p.providerName} · ${inr(p.amount)}`);
                                }}
                              >
                                Mark paid
                              </Button>
                            )}
                            <IconButton icon={Pencil} label="Edit" onClick={() => setPayout({ ...p, rate: p.hours ? money(p.amount / p.hours) : 0 })} />
                            <IconButton
                              icon={Trash2}
                              tone="danger"
                              label="Delete"
                              onClick={() => {
                                if (!window.confirm(`Delete this payout to ${p.providerName}?`)) return;
                                setPayouts((prev) => prev.filter((x) => x.id !== p.id));
                                addAudit('Payments', 'Deleted payout', `${p.providerName} · ${p.period}`);
                              }}
                            />
                          </div>
                        </Td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === 'settings' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <Panel title="Renewal options" description="What students can choose on their Renewal page. Price is a share of their program fee.">
            <div className="space-y-2">
              {renewalOptions.map((o, i) => (
                <div key={o.id} className="grid grid-cols-[1fr_90px_90px_32px] gap-2 items-end">
                  <Field label={i === 0 ? 'Label' : ''}>
                    <Input value={o.label} onChange={(e) => setRenewalOptions(renewalOptions.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)))} />
                  </Field>
                  <Field label={i === 0 ? 'Months' : ''}>
                    <Input type="number" min={1} max={36} value={o.months} onChange={(e) => setRenewalOptions(renewalOptions.map((x) => (x.id === o.id ? { ...x, months: Math.max(1, Number(e.target.value) || 1) } : x)))} />
                  </Field>
                  <Field label={i === 0 ? '% of fee' : ''}>
                    <Input type="number" min={0} max={200} value={o.percent} onChange={(e) => setRenewalOptions(renewalOptions.map((x) => (x.id === o.id ? { ...x, percent: Math.max(0, Number(e.target.value) || 0) } : x)))} />
                  </Field>
                  <IconButton icon={Trash2} tone="danger" label="Remove option" onClick={() => setRenewalOptions(renewalOptions.filter((x) => x.id !== o.id))} />
                </div>
              ))}
            </div>
            <Button size="sm" className="mt-3" icon={Plus} onClick={() => setRenewalOptions([...renewalOptions, { id: uid('renew'), label: '3 months', months: 3, percent: 30 }])}>
              Add option
            </Button>
            <p className="mt-3 text-[12.5px] text-[#7A869E]">Example: a ₹15,999 program with 90% for 12 months renews at {inr(Math.round(15999 * 0.9))}. Changes save automatically.</p>
          </Panel>
          <Panel title="Payment instructions" description="Shown to students when they open an unpaid invoice.">
            <Textarea rows={6} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            <p className="mt-2 text-[12.5px] text-[#7A869E] flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" /> Add your UPI ID or bank details here. Changes save automatically.
            </p>
          </Panel>
        </div>
      )}

      <InvoiceEditor
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={(inv) => {
          setInvoices((prev) => [inv, ...prev]);
          addAudit('Payments', 'Issued invoice', `${inv.number} · ${inv.studentName} · ${inr(inv.total)}`);
          toast(`Invoice ${inv.number} sent to ${inv.studentName}.`);
          setNewOpen(false);
        }}
      />
      <MarkPaidModal
        invoice={paying}
        onClose={() => setPaying(null)}
        onSave={(inv) => {
          update(inv, 'Recorded payment');
          toast(`${inv.number} marked paid. ${inv.studentName} has been notified.`);
          setPaying(null);
        }}
      />
      <PayoutEditor
        draft={payout}
        worklogs={worklogs}
        onClose={() => setPayout(null)}
        onSave={(p) => {
          const exists = payouts.some((x) => x.id === p.id);
          setPayouts((prev) => (exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]));
          addAudit('Payments', exists ? 'Edited payout' : 'Created payout', `${p.providerName} · ${inr(p.amount)}`);
          toast(exists ? 'Payout updated.' : `Payout recorded. ${p.providerName} can see it in their workspace.`);
          setPayout(null);
        }}
      />
    </div>
  );
};

/* ================================================================== */
/* Expenditure                                                         */
/* ================================================================== */

const COMPANY_CATEGORIES = ['Marketing & ads', 'Mentor & counsellor fees', 'Salaries', 'Software & tools', 'Rent & utilities', 'Travel', 'Events & workshops', 'Office supplies', 'Taxes & fees', 'Other'];
const EXPENSE_TONE: Record<Expense['status'], Tone> = { Submitted: 'marigold', Approved: 'blue', Rejected: 'rose', Reimbursed: 'mint', Recorded: 'neutral' };

const ExpenseEditor: React.FC<{ open: boolean; onClose: () => void; onSave: (e: Expense) => void }> = ({ open, onClose, onSave }) => {
  const blank = { date: todayIso(), category: COMPANY_CATEGORIES[0], amount: '', vendor: '', description: '' };
  const [f, setF] = useState(blank);
  const [receipt, setReceipt] = useState<UploadedFile | null>(null);
  const [err, setErr] = useState('');
  React.useEffect(() => {
    if (open) {
      setF(blank);
      setReceipt(null);
      setErr('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record an expense"
      description="Company spending, for the expenditure report."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!(Number(f.amount) > 0) || !f.description.trim()}
            onClick={() =>
              onSave({
                id: uid('exp'),
                source: 'company',
                date: f.date,
                category: f.category,
                amount: money(Number(f.amount)),
                description: f.description.trim(),
                vendor: f.vendor.trim() || undefined,
                receiptFileId: receipt?.id,
                receiptFileName: receipt?.name,
                status: 'Recorded',
                createdAt: new Date().toISOString(),
              })
            }
          >
            Save expense
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {err && <p className="sm:col-span-2 text-[13px] text-[#B42F3B]">{err}</p>}
        <Field label="Date">
          <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </Field>
        <Field label="Amount (₹)">
          <Input type="number" min={0} step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        </Field>
        <Field label="Category">
          <Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {COMPANY_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Paid to">
          <Input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} placeholder="Google Ads, landlord…" />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <Field label="Receipt" hint="Optional" className="sm:col-span-2">
          <FilePicker value={receipt} onChange={setReceipt} label="Upload receipt" onError={setErr} />
        </Field>
      </div>
    </Modal>
  );
};

export const Expenditure: React.FC = () => {
  const { addAudit, toast, platform } = useAdmin();
  const [expenses, setExpenses] = useSharedCollection<Expense>('expenses', [], { refreshMs: 60_000 });
  const [worklogs] = useSharedCollection<WorkLog>('worklogs', []);
  const [tab, setTab] = useState<'company' | 'claims' | 'hours'>('company');
  const [range, setRange] = useState<'month' | 'year' | 'all'>('month');
  const [claimView, setClaimView] = useState<Expense['status']>('Submitted');
  const [hoursMonth, setHoursMonth] = useState(recentMonths(1)[0]);
  const [addOpen, setAddOpen] = useState(false);

  const month = todayIso().slice(0, 7);
  const year = todayIso().slice(0, 4);
  const inRange = (d: string) => (range === 'month' ? d.startsWith(month) : range === 'year' ? d.startsWith(year) : true);
  const company = expenses.filter((e) => e.source === 'company');
  const claims = expenses.filter((e) => e.source === 'provider');
  // Money actually spent: company expenses plus claims we reimbursed.
  const spent = expenses.filter((e) => e.status === 'Recorded' || e.status === 'Reimbursed');
  const spentInRange = spent.filter((e) => inRange(e.date));
  const total = spentInRange.reduce((s, e) => s + e.amount, 0);
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    spentInRange.forEach((e) => m.set(e.category, (m.get(e.category) || 0) + e.amount));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [spentInRange]);
  const pendingClaims = claims.filter((c) => c.status === 'Submitted');
  const approvedClaims = claims.filter((c) => c.status === 'Approved');

  const setClaim = (c: Expense, status: Expense['status'], reviewNote?: string) => {
    setExpenses((prev) => prev.map((x) => (x.id === c.id ? { ...x, status, reviewNote: reviewNote ?? x.reviewNote } : x)));
    addAudit('Expenditure', `Claim ${status.toLowerCase()}`, `${c.providerName} · ${inr(c.amount)}`);
    toast(`Claim ${status.toLowerCase()}. ${c.providerName} has been notified.`);
  };

  const hoursRows = useMemo(() => {
    const providers = [
      ...platform.counselors.map((c) => ({ id: c.id, name: c.name, kind: 'Counsellor', minutes: minutesOf(c.sessionDuration) })),
      ...platform.mentors.map((m) => ({ id: m.id, name: m.name, kind: 'Mentor', minutes: minutesOf(m.sessionDuration) })),
    ];
    return providers
      .map((p) => {
        const sessions = platform.appointments.filter((a) => a.counselorId === p.id && a.status === 'completed' && isoOf(a.date).startsWith(hoursMonth)).length;
        const logged = worklogs.filter((w) => w.providerId === p.id && w.date.startsWith(hoursMonth)).reduce((s, w) => s + w.hours, 0);
        return { ...p, sessions, sessionHours: money((sessions * p.minutes) / 60), logged: money(logged) };
      })
      .filter((r) => r.sessions || r.logged)
      .sort((a, b) => b.sessionHours + b.logged - (a.sessionHours + a.logged));
  }, [platform.counselors, platform.mentors, platform.appointments, worklogs, hoursMonth]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenditure"
        description="Company spending, expense claims from counsellors and mentors, and the hours they worked."
        actions={
          <>
            <Button
              icon={Download}
              disabled={!spentInRange.length}
              onClick={() =>
                downloadCsv(
                  `maxicareer_expenditure_${range}_${todayIso()}.csv`,
                  ['Date', 'Source', 'Category', 'Description', 'Paid to / claimed by', 'Amount (INR)', 'Status'],
                  spentInRange.map((e) => [e.date, e.source === 'company' ? 'Company' : 'Claim', e.category, e.description, e.source === 'company' ? e.vendor || '' : e.providerName || '', e.amount, e.status])
                )
              }
            >
              Export
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
              Record expense
            </Button>
          </>
        }
      />
      <div className="flex items-center gap-3">
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: 'month', label: 'This month' },
            { value: 'year', label: 'This year' },
            { value: 'all', label: 'All time' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Spent" value={<span className="text-[26px]">{inr(total)}</span>} hint={plural(spentInRange.length, 'entry', 'entries')} />
        <Stat label="Largest category" value={<span className="text-[20px]">{byCategory[0]?.[0] || '—'}</span>} hint={byCategory[0] ? inr(byCategory[0][1]) : undefined} />
        <Stat
          label="Claims to review"
          value={pendingClaims.length}
          hint={inr(pendingClaims.reduce((s, c) => s + c.amount, 0))}
          accent={pendingClaims.length ? <span className="h-2.5 w-2.5 rounded-full bg-[#F2A93B]" /> : undefined}
          onClick={() => {
            setTab('claims');
            setClaimView('Submitted');
          }}
        />
        <Stat label="Approved, to reimburse" value={<span className="text-[26px]">{inr(approvedClaims.reduce((s, c) => s + c.amount, 0))}</span>} onClick={() => { setTab('claims'); setClaimView('Approved'); }} />
      </div>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'company', label: 'Company expenses', count: company.length },
          { value: 'claims', label: 'Mentor & counsellor claims', count: claims.length },
          { value: 'hours', label: 'Work hours' },
        ]}
      />

      {tab === 'company' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5 items-start">
          <Panel flush>
            {company.filter((e) => inRange(e.date)).length === 0 ? (
              <Empty icon={Receipt} title="No company expenses in this period" action={<Button onClick={() => setAddOpen(true)}>Record expense</Button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr>
                      <Th>Date</Th>
                      <Th>Expense</Th>
                      <Th>Receipt</Th>
                      <Th className="text-right">Amount</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEFF6]">
                    {company
                      .filter((e) => inRange(e.date))
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((e) => (
                        <tr key={e.id}>
                          <Td className="whitespace-nowrap">{formatDate(e.date)}</Td>
                          <Td>
                            <div className="font-semibold">{e.category}</div>
                            <div className="text-[12.5px] text-[#5B6885]">
                              {e.description}
                              {e.vendor ? ` · ${e.vendor}` : ''}
                            </div>
                          </Td>
                          <Td>{e.receiptFileId ? <FileLink fileId={e.receiptFileId} name={e.receiptFileName || 'Receipt'} /> : <span className="text-[#9AA5BB]">—</span>}</Td>
                          <Td className="mc-num text-right font-semibold">{inr(e.amount)}</Td>
                          <Td className="text-right">
                            <IconButton
                              icon={Trash2}
                              tone="danger"
                              label="Delete"
                              onClick={() => {
                                if (!window.confirm('Delete this expense?')) return;
                                setExpenses((prev) => prev.filter((x) => x.id !== e.id));
                                addAudit('Expenditure', 'Deleted expense', `${e.category} · ${inr(e.amount)}`);
                              }}
                            />
                          </Td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <Panel title="By category" description="Company expenses and reimbursed claims">
            {byCategory.length === 0 ? (
              <p className="text-[13px] text-[#5B6885]">Nothing spent in this period.</p>
            ) : (
              <ul className="space-y-3">
                {byCategory.map(([cat, amt]) => (
                  <li key={cat} className="flex items-center gap-3">
                    <span className="w-36 text-[13px] text-[#26355A] truncate">{cat}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[#EEF2F7] overflow-hidden">
                      <div className="h-full rounded-full bg-[#6D4AE0]" style={{ width: `${(amt / byCategory[0][1]) * 100}%` }} />
                    </div>
                    <span className="mc-num w-24 text-right text-[13px] font-semibold">{inr(amt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {tab === 'claims' && (
        <>
          <Segmented
            value={claimView}
            onChange={setClaimView}
            options={(['Submitted', 'Approved', 'Reimbursed', 'Rejected'] as const).map((s) => ({ value: s, label: s === 'Submitted' ? 'To review' : s, count: claims.filter((c) => c.status === s).length }))}
          />
          <Panel flush>
            {claims.filter((c) => c.status === claimView).length === 0 ? (
              <Empty icon={Receipt} title="Nothing here" body="Counsellors and mentors submit claims from their workspace." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr>
                      <Th>Claimed by</Th>
                      <Th>Expense</Th>
                      <Th>Receipt</Th>
                      <Th className="text-right">Amount</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEFF6]">
                    {claims
                      .filter((c) => c.status === claimView)
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((c) => (
                        <tr key={c.id}>
                          <Td>
                            <div className="font-semibold">{c.providerName}</div>
                            <div className="text-[12px] text-[#7A869E]">{formatDate(c.date)}</div>
                          </Td>
                          <Td>
                            <div className="font-semibold">{c.category}</div>
                            <div className="text-[12.5px] text-[#5B6885] max-w-[320px]">
                              {c.description}
                              {c.vendor ? ` · ${c.vendor}` : ''}
                            </div>
                            {c.reviewNote && <div className="text-[12px] text-[#94570A]">Note: {c.reviewNote}</div>}
                          </Td>
                          <Td>{c.receiptFileId ? <FileLink fileId={c.receiptFileId} name={c.receiptFileName || 'Receipt'} /> : <Badge tone="rose">No receipt</Badge>}</Td>
                          <Td className="mc-num text-right font-semibold">{inr(c.amount)}</Td>
                          <Td className="text-right whitespace-nowrap">
                            <div className="inline-flex gap-1">
                              {c.status === 'Submitted' && (
                                <>
                                  <Button size="sm" variant="primary" icon={Check} onClick={() => setClaim(c, 'Approved')}>
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    icon={X}
                                    onClick={() => {
                                      const note = window.prompt('Why is this claim rejected? (shown to them)', '');
                                      if (note === null) return;
                                      setClaim(c, 'Rejected', note.trim() || undefined);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {c.status === 'Approved' && (
                                <Button size="sm" variant="primary" icon={Check} onClick={() => setClaim(c, 'Reimbursed')}>
                                  Mark reimbursed
                                </Button>
                              )}
                              <Badge tone={EXPENSE_TONE[c.status]} dot>
                                {c.status}
                              </Badge>
                            </div>
                          </Td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}

      {tab === 'hours' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Select value={hoursMonth} onChange={(e) => setHoursMonth(e.target.value)} className="sm:w-56" aria-label="Month">
              {recentMonths(12).map((k) => (
                <option key={k} value={k}>
                  {monthLabel(k)}
                </option>
              ))}
            </Select>
            <Button
              className="sm:ml-auto"
              icon={Download}
              disabled={!hoursRows.length}
              onClick={() =>
                downloadCsv(
                  `maxicareer_work_hours_${hoursMonth}.csv`,
                  ['Name', 'Role', 'Completed sessions', 'Session hours', 'Logged hours', 'Total hours'],
                  hoursRows.map((r) => [r.name, r.kind, r.sessions, r.sessionHours, r.logged, money(r.sessionHours + r.logged)])
                )
              }
            >
              Export
            </Button>
          </div>
          <Panel flush>
            {hoursRows.length === 0 ? (
              <Empty icon={Timer} title={`No hours in ${monthLabel(hoursMonth)}`} body="Completed sessions and hours logged by counsellors and mentors appear here. Use them to create payouts." />
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th className="text-right">Sessions</Th>
                    <Th className="text-right">Session hours</Th>
                    <Th className="text-right">Logged hours</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFF6]">
                  {hoursRows.map((r) => (
                    <tr key={r.id}>
                      <Td>
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-[12px] text-[#7A869E]">{r.kind}</div>
                      </Td>
                      <Td className="mc-num text-right">{r.sessions}</Td>
                      <Td className="mc-num text-right">{r.sessionHours}</Td>
                      <Td className="mc-num text-right">{r.logged}</Td>
                      <Td className="mc-num text-right font-semibold">{money(r.sessionHours + r.logged)} h</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
          <p className="text-[12.5px] text-[#7A869E]">Session hours use each person's session length. To pay someone for these hours, create a payout on the Payments page; it fills in the same numbers.</p>
        </>
      )}

      <ExpenseEditor
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(e) => {
          setExpenses((prev) => [e, ...prev]);
          addAudit('Expenditure', 'Recorded expense', `${e.category} · ${inr(e.amount)}`);
          toast('Expense recorded.');
          setAddOpen(false);
        }}
      />
    </div>
  );
};
