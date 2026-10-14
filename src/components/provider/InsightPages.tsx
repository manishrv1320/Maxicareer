import React, { useMemo, useState } from 'react';
import { Download, Plus, Timer, Trash2, Wallet, Receipt, Star, LifeBuoy } from 'lucide-react';
import { PageHeader, Panel, Stat, Badge, Button, Empty, Segmented, Modal, Field, Input, Select, Textarea, Th, Td, IconButton, Tone } from '../admin/ui';
import { downloadCsv, timeAgo, plural } from '../admin/lib';
import type { Expense } from '../../types/portal';
import type { UploadedFile } from '../../lib/api';
import { FileLink, FilePicker, FormError, StarRating, fmtDay, inr, isoOf, todayIso, useAsyncAction } from '../workspace/kit';
import { useProvider } from './context';

const lastMonths = (count: number) => {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-IN', { month: 'short' }) });
  }
  return out;
};

const MonthBars: React.FC<{ data: { key: string; label: string; n: number }[]; format?: (n: number) => string; color?: string }> = ({ data, format = String, color = '#2563EB' }) => {
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="flex items-end gap-3 h-44 pt-4">
      {data.map((m) => (
        <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <span className="mc-num text-[12.5px] font-semibold text-[#26355A]">{format(m.n)}</span>
          <div className="w-full max-w-[44px] rounded-t-[6px]" style={{ background: color, height: `${Math.max(4, (m.n / max) * 100)}%`, opacity: m.n ? 1 : 0.2 }} />
          <span className="text-[12px] text-[#5B6885]">{m.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Report analysis                                                     */
/* ------------------------------------------------------------------ */

export const ReportsPage: React.FC = () => {
  const { state, mentees, appointments, tasks, requests, notes, sessionMinutes, openMentee } = useProvider();
  const completed = appointments.filter((a) => a.status === 'completed');
  const sessionsByMonth = lastMonths(6).map((m) => ({ ...m, n: completed.filter((a) => isoOf(a.date).startsWith(m.key)).length }));
  const doneTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskRate = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : null;
  const ratings = state.feedback;
  const avg = ratings.length ? ratings.reduce((s, f) => s + f.rating, 0) / ratings.length : null;
  const dist = [5, 4, 3, 2, 1].map((r) => ({ r, n: ratings.filter((f) => f.rating === r).length }));
  const answered = requests.filter((r) => r.status !== 'pending');
  const acceptRate = answered.length ? Math.round((answered.filter((r) => r.status === 'accepted' || r.status === 'completed').length / answered.length) * 100) : null;
  const noted = new Set(notes.map((n) => n.appointmentId));
  const notesRate = completed.length ? Math.round((completed.filter((a) => noted.has(a.id)).length / completed.length) * 100) : null;
  const reviewed = state.assignments.filter((a) => a.status !== 'submitted');
  const tests = state.assessments.filter((a) => typeof a.scorePercent === 'number');
  const avgScore = tests.length ? Math.round(tests.reduce((s, a) => s + (a.scorePercent || 0), 0) / tests.length) : null;

  const menteeRows = mentees
    .map((s) => {
      const st = tasks.filter((t) => t.studentId === s.id);
      const sessions = completed.filter((a) => a.studentId === s.id).length;
      const scores = tests.filter((a) => a.studentId === s.id).map((a) => a.scorePercent || 0);
      return { s, sessions, tasksDone: st.filter((t) => t.status === 'completed').length, tasksTotal: st.length, avgTest: scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null };
    })
    .sort((a, b) => (b.s.roadmapProgress || 0) - (a.s.roadmapProgress || 0));

  const exportCsv = () =>
    downloadCsv(
      `maxicareer_my_mentees_${todayIso()}.csv`,
      ['Student', 'Email', 'Program', 'Status', 'Syllabus progress %', 'Sessions with me', 'Tasks done', 'Tasks total', 'Average test %'],
      menteeRows.map((r) => [r.s.name, r.s.email, r.s.planName, r.s.status || '', r.s.roadmapProgress || 0, r.sessions, r.tasksDone, r.tasksTotal, r.avgTest ?? ''])
    );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Report analysis"
        description="How your sessions, students and feedback are trending."
        actions={
          <Button icon={Download} onClick={exportCsv} disabled={!menteeRows.length}>
            Mentee report CSV
          </Button>
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Sessions delivered" value={completed.length} hint={`${Math.round(((completed.length * sessionMinutes) / 60) * 10) / 10} hours`} />
        <Stat label="Average rating" value={avg ? avg.toFixed(1) : '—'} hint={`${ratings.length} review${ratings.length === 1 ? '' : 's'}`} accent={avg ? <Star className="w-4 h-4 fill-[#F2A93B] text-[#F2A93B]" /> : undefined} />
        <Stat label="Task completion" value={taskRate === null ? '—' : `${taskRate}%`} hint={`${doneTasks} of ${plural(tasks.length, 'task')}`} />
        <Stat label="Mentee test average" value={avgScore === null ? '—' : `${avgScore}%`} hint={plural(tests.length, 'attempt')} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Sessions per month" description="Completed 1-on-1 sessions, last six months">
          <MonthBars data={sessionsByMonth} />
        </Panel>
        <Panel title="Quality">
          <ul className="space-y-3">
            {[
              ['Requests accepted', acceptRate],
              ['Sessions with notes', notesRate],
              ['Tasks completed by students', taskRate],
              ['Submissions reviewed', state.assignments.length ? Math.round((reviewed.length / state.assignments.length) * 100) : null],
            ].map(([label, pct]) => (
              <li key={label as string} className="flex items-center gap-3">
                <span className="w-52 text-[13.5px] text-[#26355A]">{label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#EEF2F7] overflow-hidden">
                  <div className="h-full rounded-full bg-[#0F9F6E]" style={{ width: `${pct ?? 0}%` }} />
                </div>
                <span className="mc-num w-12 text-right text-[13px] font-semibold text-[#0D1B3E]">{pct === null ? '—' : `${pct}%`}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Feedback from students" description={avg ? `Average ${avg.toFixed(1)} out of 5` : 'No ratings yet'}>
          <ul className="space-y-2">
            {dist.map(({ r, n }) => (
              <li key={r} className="flex items-center gap-3">
                <span className="w-10 text-[13px] text-[#26355A] mc-num">{r} ★</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#EEF2F7] overflow-hidden">
                  <div className="h-full rounded-full bg-[#F2A93B]" style={{ width: `${ratings.length ? (n / ratings.length) * 100 : 0}%` }} />
                </div>
                <span className="mc-num w-8 text-right text-[13px] font-semibold">{n}</span>
              </li>
            ))}
          </ul>
          {ratings.length > 0 && (
            <ul className="mt-4 pt-4 border-t border-[#EAEFF6] space-y-3 max-h-64 overflow-y-auto">
              {[...ratings]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .slice(0, 8)
                .map((f) => (
                  <li key={f.id} className="text-[13px]">
                    <div className="flex items-center gap-2">
                      <StarRating value={f.rating} size={13} />
                      <span className="text-[12px] text-[#7A869E]">
                        {f.fromName} · {f.about} · {timeAgo(f.createdAt)}
                      </span>
                    </div>
                    {f.comment && <p className="mt-0.5 text-[#33415F]">{f.comment}</p>}
                  </li>
                ))}
            </ul>
          )}
        </Panel>
        <Panel title="Student progress" flush>
          {menteeRows.length === 0 ? (
            <Empty title="No students yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th className="text-right">Syllabus</Th>
                    <Th className="text-right">Sessions</Th>
                    <Th className="text-right">Tasks</Th>
                    <Th className="text-right">Tests</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFF6]">
                  {menteeRows.map((r) => (
                    <tr key={r.s.id} className="hover:bg-[#F7F9FC] cursor-pointer" onClick={() => openMentee(r.s.id)}>
                      <Td className="font-semibold">{r.s.name}</Td>
                      <Td className="mc-num text-right">{r.s.roadmapProgress || 0}%</Td>
                      <Td className="mc-num text-right">{r.sessions}</Td>
                      <Td className="mc-num text-right">
                        {r.tasksDone}/{r.tasksTotal}
                      </Td>
                      <Td className="mc-num text-right">{r.avgTest === null ? '—' : `${r.avgTest}%`}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Work hours                                                          */
/* ------------------------------------------------------------------ */

const ACTIVITIES = ['Mentoring', 'Session preparation', 'Resume / profile review', 'Assignment review', 'Content creation', 'Event or workshop', 'Admin & reporting', 'Other'];

const LogHoursModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { store, mentees, toast } = useProvider();
  const [form, setForm] = useState({ date: todayIso(), hours: '1', activity: ACTIVITIES[0], studentId: '', notes: '' });
  const { busy, error, setError, run } = useAsyncAction();

  const save = async () => {
    const ok = await run(() => store.logWork({ date: form.date, hours: Number(form.hours), activity: form.activity, studentId: form.studentId || undefined, notes: form.notes.trim() || undefined }));
    if (ok) {
      toast(`${form.hours} h logged.`);
      setForm({ date: todayIso(), hours: '1', activity: ACTIVITIES[0], studentId: '', notes: '' });
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title="Log hours"
      description="For work outside booked sessions. Session hours are counted automatically."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Log hours'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormError message={error} />
        <Field label="Date">
          <Input type="date" max={todayIso()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Hours" hint="Quarter hours, up to 16.">
          <Input type="number" min={0.25} max={16} step={0.25} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
        </Field>
        <Field label="Activity">
          <Select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}>
            {ACTIVITIES.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </Field>
        <Field label="Student" hint="Optional">
          <Select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
            <option value="">None</option>
            {mentees.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
};

type Range = 'month' | 'last' | 'quarter' | 'all';

export const HoursPage: React.FC = () => {
  const { me, state, store, toast, appointments, sessionMinutes } = useProvider();
  const [range, setRange] = useState<Range>('month');
  const [logOpen, setLogOpen] = useState(false);

  const rows = useMemo(() => {
    const sessionRows = appointments
      .filter((a) => a.status === 'completed' && isoOf(a.date))
      .map((a) => ({ id: `apt-${a.id}`, date: isoOf(a.date), hours: sessionMinutes / 60, activity: '1-on-1 session', student: a.studentName, notes: a.topic || a.counselingType, source: 'Session' as const, logId: null as string | null }));
    const logged = state.workLogs.map((w) => ({ id: w.id, date: w.date, hours: w.hours, activity: w.activity, student: w.studentName || '', notes: w.notes, source: 'Logged' as const, logId: w.id }));
    return [...sessionRows, ...logged].sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, state.workLogs, sessionMinutes]);

  const now = new Date();
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = ym(now);
  const lastMonth = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const quarterStart = `${ym(new Date(now.getFullYear(), now.getMonth() - 2, 1))}-01`;
  const inRange = rows.filter((r) => (range === 'month' ? r.date.startsWith(thisMonth) : range === 'last' ? r.date.startsWith(lastMonth) : range === 'quarter' ? r.date >= quarterStart : true));
  const total = inRange.reduce((s, r) => s + r.hours, 0);
  const sessionHours = inRange.filter((r) => r.source === 'Session').reduce((s, r) => s + r.hours, 0);
  const round = (n: number) => Math.round(n * 100) / 100;
  const byMonth = lastMonths(6).map((m) => ({ ...m, n: round(rows.filter((r) => r.date.startsWith(m.key)).reduce((s, r) => s + r.hours, 0)) }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Work hours"
        description={`Completed sessions count ${me.sessionDuration || '45 mins'} each. Log anything else you worked on.`}
        actions={
          <>
            <Button
              icon={Download}
              disabled={!inRange.length}
              onClick={() =>
                downloadCsv(
                  `maxicareer_hours_${range}_${todayIso()}.csv`,
                  ['Date', 'Source', 'Activity', 'Student', 'Hours', 'Notes'],
                  inRange.map((r) => [r.date, r.source, r.activity, r.student, round(r.hours), r.notes])
                )
              }
            >
              Export
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setLogOpen(true)}>
              Log hours
            </Button>
          </>
        }
      />
      <Segmented
        value={range}
        onChange={setRange}
        options={[
          { value: 'month', label: 'This month' },
          { value: 'last', label: 'Last month' },
          { value: 'quarter', label: 'Last 3 months' },
          { value: 'all', label: 'All time' },
        ]}
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Total hours" value={round(total)} />
        <Stat label="Session hours" value={round(sessionHours)} hint={plural(inRange.filter((r) => r.source === 'Session').length, 'session')} />
        <Stat label="Logged hours" value={round(total - sessionHours)} hint={plural(inRange.filter((r) => r.source === 'Logged').length, 'entry', 'entries')} />
        <Stat label="Paid so far" value={<span className="text-[26px]">{inr(state.payouts.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0))}</span>} hint="All time" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.6fr] gap-4 items-start">
        <Panel title="Hours per month" description="Last six months">
          <MonthBars data={byMonth} color="#6D4AE0" />
        </Panel>
        <Panel title="Entries" flush>
          {inRange.length === 0 ? (
            <Empty icon={Timer} title="No hours in this period" body="Completed sessions are added automatically. Log prep, reviews and other work yourself." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Activity</Th>
                    <Th>Student</Th>
                    <Th className="text-right">Hours</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFF6]">
                  {inRange.map((r) => (
                    <tr key={r.id}>
                      <Td className="whitespace-nowrap">{fmtDay(r.date, { day: 'numeric', month: 'short' })}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Badge tone={r.source === 'Session' ? 'blue' : 'violet'}>{r.source}</Badge>
                          <span className="truncate">{r.activity}</span>
                        </div>
                        {r.notes && <div className="text-[12px] text-[#7A869E] truncate max-w-[260px]">{r.notes}</div>}
                      </Td>
                      <Td>{r.student || '—'}</Td>
                      <Td className="mc-num text-right font-semibold">{round(r.hours)}</Td>
                      <Td className="text-right">
                        {r.logId && (
                          <IconButton
                            icon={Trash2}
                            tone="danger"
                            label="Delete entry"
                            onClick={async () => {
                              if (!window.confirm('Delete this entry?')) return;
                              try {
                                await store.deleteWorkLog(r.logId!);
                                toast('Entry deleted.');
                              } catch (err) {
                                toast(err instanceof Error ? err.message : 'Could not delete it.', 'error');
                              }
                            }}
                          />
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
      <LogHoursModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Payment history                                                     */
/* ------------------------------------------------------------------ */

export const PaymentsPage: React.FC = () => {
  const { state, go } = useProvider();
  const payouts = [...state.payouts].sort((a, b) => (b.paidOn || b.createdAt).localeCompare(a.paidOn || a.createdAt));
  const year = String(new Date().getFullYear());
  const paidYear = payouts.filter((p) => p.status === 'Paid' && (p.paidOn || p.createdAt).startsWith(year)).reduce((s, p) => s + p.amount, 0);
  const pending = payouts.filter((p) => p.status === 'Pending');
  const lastPaid = payouts.find((p) => p.status === 'Paid');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payment history"
        description="Payouts from Maxicareer for your sessions and hours. The finance team records each payment."
        actions={
          <Button
            icon={Download}
            disabled={!payouts.length}
            onClick={() =>
              downloadCsv(
                `maxicareer_payouts_${todayIso()}.csv`,
                ['Period', 'Sessions', 'Hours', 'Amount (INR)', 'Status', 'Paid on', 'Method', 'Reference', 'Notes'],
                payouts.map((p) => [p.period, p.sessions, p.hours, p.amount, p.status, p.paidOn || '', p.method, p.reference, p.notes || ''])
              )
            }
          >
            Export
          </Button>
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label={`Paid in ${year}`} value={<span className="text-[26px]">{inr(paidYear)}</span>} />
        <Stat label="Awaiting payment" value={<span className="text-[26px]">{inr(pending.reduce((s, p) => s + p.amount, 0))}</span>} hint={`${pending.length} payout${pending.length === 1 ? '' : 's'}`} />
        <Stat label="Last payment" value={<span className="text-[26px]">{lastPaid ? inr(lastPaid.amount) : '—'}</span>} hint={lastPaid ? fmtDay(lastPaid.paidOn) : undefined} />
        <Stat label="Payouts" value={payouts.length} />
      </div>
      <Panel flush>
        {payouts.length === 0 ? (
          <Empty icon={Wallet} title="No payouts yet" body="Once the finance team records a payout for your work, it shows up here with its reference number." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr>
                  <Th>Period</Th>
                  <Th className="text-right">Sessions</Th>
                  <Th className="text-right">Hours</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Status</Th>
                  <Th>Paid on</Th>
                  <Th>Reference</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF6]">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-semibold">
                      {p.period}
                      {p.notes && <div className="text-[12px] font-normal text-[#7A869E]">{p.notes}</div>}
                    </Td>
                    <Td className="mc-num text-right">{p.sessions}</Td>
                    <Td className="mc-num text-right">{p.hours}</Td>
                    <Td className="mc-num text-right font-semibold">{inr(p.amount)}</Td>
                    <Td>
                      <Badge tone={p.status === 'Paid' ? 'mint' : 'marigold'} dot>
                        {p.status}
                      </Badge>
                    </Td>
                    <Td>{p.paidOn ? fmtDay(p.paidOn) : '—'}</Td>
                    <Td className="text-[12.5px]">
                      {p.method && <div>{p.method}</div>}
                      <div className="mc-num text-[#7A869E]">{p.reference || '—'}</div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="text-[12.5px] text-[#7A869E] flex items-center gap-1.5">
        <LifeBuoy className="w-3.5 h-3.5" /> Something missing or wrong?{' '}
        <button type="button" className="font-semibold text-[#2563EB] hover:underline" onClick={() => go('support')}>
          Raise a support request
        </button>
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Expenditure (expense claims)                                        */
/* ------------------------------------------------------------------ */

const CATEGORIES = ['Travel', 'Internet & phone', 'Software & tools', 'Books & materials', 'Event & venue', 'Food & hospitality', 'Other'];
const EXPENSE_TONE: Record<Expense['status'], Tone> = { Submitted: 'marigold', Approved: 'blue', Rejected: 'rose', Reimbursed: 'mint', Recorded: 'neutral' };

const ClaimModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { store, toast } = useProvider();
  const blank = { date: todayIso(), category: CATEGORIES[0], amount: '', vendor: '', description: '' };
  const [form, setForm] = useState(blank);
  const [receipt, setReceipt] = useState<UploadedFile | null>(null);
  const { busy, error, setError, run } = useAsyncAction();

  const close = () => {
    setForm(blank);
    setReceipt(null);
    setError(null);
    onClose();
  };
  const save = async () => {
    const ok = await run(() =>
      store.submitExpense({ date: form.date, category: form.category, amount: Number(form.amount), description: form.description.trim(), vendor: form.vendor.trim() || undefined, receiptFileId: receipt?.id, receiptFileName: receipt?.name })
    );
    if (ok) {
      toast('Claim submitted. The finance team will review it.');
      close();
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Claim an expense"
      description="Spent money on Maxicareer work? Submit it for reimbursement."
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? 'Submitting…' : 'Submit claim'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormError message={error} />
        <Field label="Date spent">
          <Input type="date" max={todayIso()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Amount (₹)">
          <Input type="number" min={1} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="1200" />
        </Field>
        <Field label="Category">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Paid to" hint="Optional">
          <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Ola, Amazon, venue name…" />
        </Field>
        <Field label="What was it for?" className="sm:col-span-2">
          <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Cab to the campus workshop on 12 Oct" />
        </Field>
        <Field label="Receipt" hint="Photo or PDF, up to 10 MB." className="sm:col-span-2">
          <FilePicker value={receipt} onChange={setReceipt} label="Upload receipt" onError={(m) => setError(m)} />
        </Field>
      </div>
    </Modal>
  );
};

export const ExpensesPage: React.FC = () => {
  const { state, store, toast } = useProvider();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'all' | Expense['status']>('all');
  const claims = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date));
  const shown = claims.filter((c) => view === 'all' || c.status === view);
  const sum = (s: Expense['status']) => claims.filter((c) => c.status === s).reduce((t, c) => t + c.amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenditure"
        description="Your expense claims and where each one stands."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
            Claim an expense
          </Button>
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Waiting for review" value={<span className="text-[26px]">{inr(sum('Submitted'))}</span>} />
        <Stat label="Approved, not yet paid" value={<span className="text-[26px]">{inr(sum('Approved'))}</span>} />
        <Stat label="Reimbursed" value={<span className="text-[26px]">{inr(sum('Reimbursed'))}</span>} />
        <Stat label="Rejected" value={<span className="text-[26px]">{inr(sum('Rejected'))}</span>} />
      </div>
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'all', label: 'All', count: claims.length },
          ...(['Submitted', 'Approved', 'Reimbursed', 'Rejected'] as const).map((s) => ({ value: s, label: s, count: claims.filter((c) => c.status === s).length })),
        ]}
      />
      <Panel flush>
        {shown.length === 0 ? (
          <Empty icon={Receipt} title={claims.length ? 'Nothing here' : 'No claims yet'} body="Travel, tools or materials you paid for while working with students can be reimbursed." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Expense</Th>
                  <Th>Receipt</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF6]">
                {shown.map((c) => (
                  <tr key={c.id}>
                    <Td className="whitespace-nowrap">{fmtDay(c.date, { day: 'numeric', month: 'short', year: 'numeric' })}</Td>
                    <Td>
                      <div className="font-semibold">{c.category}</div>
                      <div className="text-[12.5px] text-[#5B6885] max-w-[300px]">
                        {c.description}
                        {c.vendor ? ` · ${c.vendor}` : ''}
                      </div>
                      {c.reviewNote && <div className="text-[12px] text-[#94570A] mt-0.5">Finance: {c.reviewNote}</div>}
                    </Td>
                    <Td>{c.receiptFileId ? <FileLink fileId={c.receiptFileId} name={c.receiptFileName || 'Receipt'} /> : <span className="text-[#9AA5BB]">—</span>}</Td>
                    <Td className="mc-num text-right font-semibold">{inr(c.amount)}</Td>
                    <Td>
                      <Badge tone={EXPENSE_TONE[c.status]} dot>
                        {c.status}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      {c.status === 'Submitted' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (!window.confirm('Withdraw this claim?')) return;
                            try {
                              await store.deleteExpense(c.id);
                              toast('Claim withdrawn.');
                            } catch (err) {
                              toast(err instanceof Error ? err.message : 'Could not withdraw it.', 'error');
                            }
                          }}
                        >
                          Withdraw
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <ClaimModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
};
