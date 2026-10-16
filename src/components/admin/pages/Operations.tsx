import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Plus, Pencil, Trash2, KeyRound, Copy, CalendarClock, Download, Briefcase, UserCog, Check, LogOut, ExternalLink, Database, Link2 } from 'lucide-react';
import { useAdmin, COHORT_LABEL, SessionItem } from '../context';
import { PageHeader, Panel, Button, IconButton, Badge, Input, Textarea, Select, Field, Segmented, Stat, StepMeter, Avatar, Empty, Modal, Th, Td, cx } from '../ui';
import { formatDate, inr, uid, daysUntil, DAY_MS, downloadCsv, useSharedCollection, readStore, writeStore, resetSharedData } from '../lib';
import { apiGet, apiSend } from '../../../lib/api';
import { platformStore } from '../../../services/careerPlatformStore';
import { CAREER_PROGRAMS_LIST } from '../../../data/portalData';
import { exportStudents, STATUS_LABEL } from './Students';
import { isMeetingLink, MEETING_LINK_HELP } from '../../workspace/kit';
import { STAGES, STAGE_TONE } from './Applications';

/* ------------------------------------------------------------------ */
/* Counsellors                                                         */
/* ------------------------------------------------------------------ */

export const Counsellors: React.FC = () => {
  const { students, sessions, go, platform, setProviderApproval, addAudit, toast, session } = useAdmin();
  const canDecide = session.staffRole === 'Global admin' || session.staffRole === 'Admin' || !session.staffRole;

  const providers = [
    ...platform.counselors.map((c) => ({
      kind: 'counselor' as const,
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.qualification || 'Career counsellor',
      specialty: c.specializations.join(', ') || '—',
      status: c.approvalStatus,
      rating: c.rating,
      registered: c.registeredDate,
    })),
    ...platform.mentors.map((m) => ({
      kind: 'mentor' as const,
      id: m.id,
      name: m.name,
      email: m.email,
      role: [m.role, m.company].filter(Boolean).join(' · ') || 'Industry mentor',
      specialty: m.domain || '—',
      status: m.approvalStatus,
      rating: undefined as number | undefined,
      registered: m.registeredDate,
    })),
  ];
  const pending = providers.filter((p) => p.status === 'pending');
  const active = providers.filter((p) => p.status === 'approved');
  const rejected = providers.filter((p) => p.status === 'rejected');

  const decide = async (p: (typeof providers)[number], status: 'approved' | 'rejected') => {
    await setProviderApproval(p.kind, p.id, status);
    addAudit('Counsellors', status === 'approved' ? 'Approved' : 'Rejected', `${p.kind === 'counselor' ? 'Counsellor' : 'Mentor'}: ${p.name}`);
    toast(status === 'approved' ? `${p.name} can now sign in and appears in the directory.` : `${p.name} was not approved.`);
  };

  const CAPACITY = 20;

  return (
    <div className="space-y-5">
      <PageHeader title="Counsellors" description="Counsellors and mentors, new sign-ups waiting for approval, and how full each caseload is." />

      {pending.length > 0 && (
        <Panel title="Waiting for approval" description={`${pending.length} sign-up${pending.length === 1 ? '' : 's'}`} flush>
          <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
            {pending.map((p) => (
              <li key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={p.name} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[#0D1B3E] truncate">
                      {p.name} <span className="text-[12.5px] font-normal text-[#5B6885]">· {p.kind === 'counselor' ? 'Counsellor' : 'Mentor'}</span>
                    </div>
                    <div className="text-[12.5px] text-[#5B6885] truncate">
                      {p.email} · {p.role} · registered {p.registered}
                    </div>
                  </div>
                </div>
                {canDecide ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="primary" icon={Check} onClick={() => decide(p, 'approved')}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => window.confirm(`Reject ${p.name}?`) && decide(p, 'rejected')}>
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge tone="marigold">Pending</Badge>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {active.length === 0 ? (
        <Panel>
          <Empty icon={Briefcase} title="No active counsellors yet" body="Counsellors and mentors sign up at /portal. Approve them here, or create staff accounts in User management." />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {active.map((c) => {
            const mentees = new Set<string>(students.filter((s) => s.mentorAssigned === c.name).map((s) => s._id));
            platform.appointments.filter((a) => a.counselorId === c.id).forEach((a) => mentees.add(a.studentId));
            const upcoming = sessions.filter((s) => s.mentor === c.name && s.status === 'Upcoming').length;
            const requests = platform.counselingRequests.filter((r) => r.counselorId === c.id && r.status === 'pending').length;
            const load = Math.round((mentees.size / CAPACITY) * 100);
            return (
              <Panel key={c.id}>
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} size={48} tone="ink" />
                  <div className="min-w-0 flex-1">
                    <h3 className="mc-display text-[18px] font-semibold text-[#0D1B3E]">{c.name}</h3>
                    <p className="text-[13px] text-[#5B6885]">{c.role}</p>
                  </div>
                  <Badge tone={c.kind === 'mentor' ? 'violet' : 'mint'} dot>
                    {c.kind === 'mentor' ? 'Mentor' : 'Counsellor'}
                  </Badge>
                </div>
                <p className="mt-3 text-[13.5px] text-[#26355A]">{c.specialty}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Mentees', mentees.size],
                    ['Upcoming', upcoming],
                    ['Requests', requests],
                  ].map(([l, v]) => (
                    <div key={l as string} className="rounded-[10px] bg-[#F5F7FB] py-2.5">
                      <div className="mc-display mc-num text-[20px] font-semibold text-[#0D1B3E]">{v}</div>
                      <div className="text-[12px] text-[#5B6885]">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-[12.5px] mb-1.5">
                    <span className="text-[#5B6885]">Caseload</span>
                    <span className={cx('mc-num font-semibold', load >= 100 ? 'text-[#B42F3B]' : load >= 85 ? 'text-[#94570A]' : 'text-[#26355A]')}>
                      {mentees.size} of {CAPACITY}
                    </span>
                  </div>
                  <StepMeter value={Math.min(100, load)} steps={10} height={20} tone={load >= 100 ? 'marigold' : 'blue'} label={`${c.name} caseload`} />
                </div>
                <div className="mt-4 flex gap-2">
                  <a href={`mailto:${c.email}`} className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-[#D3DBE8] text-[13px] font-semibold text-[#0D1B3E] hover:bg-[#F8FAFD]">
                    <Mail className="w-4 h-4" /> Email
                  </a>
                  <Button size="md" className="flex-1 h-9" onClick={() => go('sessions')}>
                    Sessions
                  </Button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {rejected.length > 0 && (
        <Panel title="Not approved" flush>
          <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
            {rejected.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3 text-[13.5px]">
                <span className="flex-1 truncate">
                  {p.name} <span className="text-[#5B6885]">· {p.email}</span>
                </span>
                {canDecide && (
                  <Button size="sm" onClick={() => decide(p, 'approved')}>
                    Approve after all
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* User management                                                     */
/* ------------------------------------------------------------------ */

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  /** Sent once to the server, which hashes it into a real login; never stored in the list. */
  tempPassword?: string;
  createdAt: string;
  active?: boolean;
}

const withoutPassword = ({ tempPassword, ...u }: ManagedUser): ManagedUser => u;

const makePassword = () => `MC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`;

export const UserManagement: React.FC = () => {
  const { addAudit } = useAdmin();
  const [users, setUsers] = useSharedCollection<ManagedUser>('users');
  const [form, setForm] = useState({ name: '', email: '', role: 'Counsellor' });
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader title="User management" description="Create staff accounts and issue one-time passwords. Staff change it on first sign-in. Counsellors and mentors also get a workspace at /portal." />
      <Panel title="Add a staff member">
        <form
          className="grid grid-cols-1 md:grid-cols-[1fr_1fr_180px_auto] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const email = form.email.trim().toLowerCase();
            if (!form.name.trim() || !email) return;
            if (users.some((u) => u.email === email)) {
              setIssued(null);
              window.alert('Someone with that email already has an account.');
              return;
            }
            const password = makePassword();
            setUsers([{ id: uid('u'), name: form.name.trim(), email, role: form.role, tempPassword: password, createdAt: new Date().toISOString(), active: true }, ...users.map(withoutPassword)]);
            addAudit('Users', 'Created account', `${form.role}: ${email}`);
            setIssued({ email, password });
            setForm({ name: '', email: '', role: form.role });
          }}
        >
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required aria-label="Full name" />
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@maxicareer.com" required aria-label="Email" />
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-label="Role">
            {['Counsellor', 'Mentor', 'Content editor', 'Admin'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
          <Button type="submit" variant="primary" icon={Plus}>
            Create account
          </Button>
        </form>
      </Panel>
      <Panel flush title="Staff accounts" description={`${users.length} account${users.length === 1 ? '' : 's'}`}>
        {users.length === 0 ? (
          <Empty icon={UserCog} title="No staff accounts yet" body="Add counsellors and mentors above. They'll get a one-time password to sign in." />
        ) : (
          <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
            {users.map((u) => (
              <li key={u.id} className={cx('flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5', u.active === false && 'opacity-60')}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={u.name} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[#0D1B3E] truncate">{u.name}</div>
                    <div className="text-[12.5px] text-[#5B6885] truncate">
                      {u.email} · added {formatDate(u.createdAt)}
                    </div>
                  </div>
                </div>
                <Badge tone={u.role === 'Admin' ? 'ink' : u.role === 'Content editor' ? 'violet' : 'blue'}>{u.role}</Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    icon={KeyRound}
                    onClick={() => {
                      const password = makePassword();
                      setUsers(users.map((x) => (x.id === u.id ? { ...withoutPassword(x), tempPassword: password } : withoutPassword(x))));
                      addAudit('Users', 'Reset password', u.email);
                      setIssued({ email: u.email, password });
                    }}
                  >
                    Reset password
                  </Button>
                  <Button
                    size="sm"
                    variant={u.active === false ? 'secondary' : 'ghost'}
                    onClick={() => {
                      setUsers(users.map((x) => (x.id === u.id ? { ...withoutPassword(x), active: x.active === false } : withoutPassword(x))));
                      addAudit('Users', u.active === false ? 'Reactivated account' : 'Deactivated account', u.email);
                    }}
                  >
                    {u.active === false ? 'Reactivate' : 'Deactivate'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Modal
        open={!!issued}
        onClose={() => {
          setIssued(null);
          setCopied(false);
        }}
        title="One-time password"
        description={issued ? `For ${issued.email}. It's shown only once, so share it securely now.` : ''}
        footer={<Button variant="primary" onClick={() => setIssued(null)}>Done</Button>}
      >
        <div className="flex items-center gap-2">
          <div className="mc-num flex-1 rounded-[10px] bg-[#0D1B3E] text-white text-[18px] tracking-wider px-4 py-3 select-all">{issued?.password}</div>
          <Button
            icon={copied ? Check : Copy}
            onClick={() => {
              navigator.clipboard?.writeText(issued?.password || '');
              setCopied(true);
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Programs                                                            */
/* ------------------------------------------------------------------ */

const PROGRAM_ORDER = ['school', 'college', 'fresher', 'working_professional'];

export const Programs: React.FC = () => {
  const { students, setStudentPrefilter, go } = useAdmin();
  const programs = [...CAREER_PROGRAMS_LIST].sort((a, b) => PROGRAM_ORDER.indexOf(a.profession) - PROGRAM_ORDER.indexOf(b.profession));
  return (
    <div className="space-y-5">
      <PageHeader title="Programs & plans" description="Four programs, one for each stage of a career. Prices match what visitors see on the website." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 xl:items-start">
        {programs.map((p, i) => {
          const learners = students.filter((s) => s.profession === p.profession);
          const enrolled = learners.filter((s) => s.status === 'enrolled' || s.status === 'completed').length;
          const revenue = learners.reduce((a, s) => a + (s.planPrice || 0), 0);
          return (
            <section key={p.id} className="flex flex-col">
              <div className="xl:block hidden" style={{ height: (3 - i) * 28 }} aria-hidden />
              <div className="rounded-[14px] border border-[#DDE4EF] bg-white overflow-hidden flex flex-col flex-1">
                <div className="bg-[#0D1B3E] text-white px-5 pt-4 pb-5 relative">
                  <div className="flex items-end gap-[3px] h-5 mb-3" aria-hidden>
                    {[0, 1, 2, 3].map((k) => (
                      <span key={k} className="w-3 rounded-[2px]" style={{ height: `${(k + 1) * 25}%`, background: k <= i ? '#38BDF8' : '#22356A' }} />
                    ))}
                  </div>
                  <div className="text-[12.5px] text-[#AFC0E3]">{COHORT_LABEL[p.profession]}</div>
                  <h3 className="mc-display text-[21px] font-semibold leading-tight mt-0.5">{p.name.replace(' career program', '')}</h3>
                  <p className="text-[13px] text-[#D6E0F5] mt-1">{p.tagline}</p>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="mc-display mc-num text-[28px] font-semibold text-[#0D1B3E]">{inr(p.price)}</span>
                    <span className="mc-num text-[13px] text-[#8C97AE] line-through">{inr(p.originalPrice)}</span>
                  </div>
                  {p.launchOffer && <span className="text-[12px] text-[#94570A] mt-0.5">Launch offer, {Math.round((1 - p.price / p.originalPrice) * 100)}% off</span>}
                  <ul className="mt-4 space-y-1.5 text-[13px] text-[#26355A] flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="w-4 h-4 text-[#0F9F6E] shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-3 border-t border-[#EAEFF6] grid grid-cols-3 gap-2 text-center">
                    {[
                      ['Learners', learners.length],
                      ['Enrolled', enrolled],
                      ['Value', revenue >= 100000 ? `₹${(revenue / 100000).toFixed(1)}L` : inr(revenue)],
                    ].map(([l, v]) => (
                      <div key={l as string}>
                        <div className="mc-display mc-num text-[17px] font-semibold text-[#0D1B3E]">{v}</div>
                        <div className="text-[11.5px] text-[#5B6885]">{l}</div>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setStudentPrefilter({ cohort: p.profession });
                      go('students');
                    }}
                  >
                    View learners
                  </Button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
      <p className="text-[12.5px] text-[#7A869E]">To change prices or features, edit CAREER_PROGRAMS_LIST in src/data/portalData.ts so the website and this page stay in sync.</p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  duration: string;
  status: 'Active' | 'Draft';
}

const DEFAULT_SERVICES: Service[] = [
  { id: 'svc-1', name: 'Career Discovery & Guidance', category: 'Career guidance', description: 'Strengths assessment, career options, and a personalised action plan.', price: '₹1,499', duration: '2 sessions', status: 'Active' },
  { id: 'svc-2', name: 'Skills & Portfolio Accelerator', category: 'Skill development', description: 'Practical skills, guided projects, and portfolio feedback.', price: '₹4,999', duration: '6 weeks', status: 'Active' },
  { id: 'svc-3', name: '1:1 Mentor Coaching', category: 'Mentorship', description: 'Focused mentor sessions with goals, feedback, and accountability.', price: '₹999', duration: '60 minutes', status: 'Active' },
  { id: 'svc-4', name: 'Resume & Interview Sprint', category: 'Job readiness', description: 'ATS resume review, mock interviews, and actionable feedback.', price: '₹1,999', duration: '2 weeks', status: 'Draft' },
];

export const Services: React.FC = () => {
  const { addAudit } = useAdmin();
  const [services, setServices] = useSharedCollection<Service>('services', DEFAULT_SERVICES);
  const [filter, setFilter] = useState<'all' | 'Active' | 'Draft'>('all');
  const [editing, setEditing] = useState<Service | null>(null);
  const shown = services.filter((s) => filter === 'all' || s.status === filter);
  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Services"
        description="Stand-alone services learners can buy on their own or add to a program."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({ id: '', name: '', category: categories[0] || 'Career guidance', description: '', price: '', duration: '', status: 'Draft' })}>
            Add service
          </Button>
        }
      />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All', count: services.length },
          { value: 'Active', label: 'Live', count: services.filter((s) => s.status === 'Active').length },
          { value: 'Draft', label: 'Drafts', count: services.filter((s) => s.status === 'Draft').length },
        ]}
      />
      <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
        {shown.length === 0 && <Empty icon={Briefcase} title="No services here" />}
        {shown.map((s) => (
          <div key={s.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 px-5 py-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="h-10 w-10 shrink-0 rounded-[10px] bg-[#E8F0FE] text-[#1D4FD7] flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[15px] font-semibold text-[#0D1B3E]">{s.name}</h3>
                  <Badge tone={s.status === 'Active' ? 'mint' : 'marigold'} dot>
                    {s.status === 'Active' ? 'Live' : 'Draft'}
                  </Badge>
                </div>
                <p className="text-[13px] text-[#5B6885] mt-0.5">{s.description || 'No description yet.'}</p>
                <p className="text-[12px] text-[#7A869E] mt-1">{s.category}</p>
              </div>
            </div>
            <div className="flex md:flex-col md:items-end gap-3 md:gap-0 md:w-32 shrink-0">
              <span className="mc-display mc-num text-[18px] font-semibold text-[#0D1B3E]">{s.price || '—'}</span>
              <span className="text-[12.5px] text-[#5B6885]">{s.duration}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                onClick={() => {
                  setServices(services.map((x) => (x.id === s.id ? { ...x, status: x.status === 'Active' ? 'Draft' : 'Active' } : x)));
                  addAudit('Services', s.status === 'Active' ? 'Moved to draft' : 'Made live', s.name);
                }}
              >
                {s.status === 'Active' ? 'Move to draft' : 'Make live'}
              </Button>
              <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(s)} />
              <IconButton
                icon={Trash2}
                tone="danger"
                label="Delete"
                onClick={() => {
                  if (!window.confirm(`Delete "${s.name}"?`)) return;
                  setServices(services.filter((x) => x.id !== s.id));
                  addAudit('Services', 'Deleted service', s.name);
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit service' : 'Add service'}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!editing?.name.trim()}
              onClick={() => {
                if (!editing) return;
                if (editing.id) {
                  setServices(services.map((x) => (x.id === editing.id ? editing : x)));
                  addAudit('Services', 'Edited service', editing.name);
                } else {
                  setServices([{ ...editing, id: uid('svc') }, ...services]);
                  addAudit('Services', 'Added service', editing.name);
                }
                setEditing(null);
              }}
            >
              Save service
            </Button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" className="sm:col-span-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Category">
              <Input list="svc-cats" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              <datalist id="svc-cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Status">
              <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Service['status'] })}>
                <option value="Draft">Draft</option>
                <option value="Active">Live</option>
              </Select>
            </Field>
            <Field label="Price">
              <Input value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} placeholder="₹1,999" />
            </Field>
            <Field label="Duration">
              <Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} placeholder="2 weeks" />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export const Sessions: React.FC = () => {
  const { sessions, setSessions, students, addAudit, notify, mentorOptions } = useAdmin();
  const isRequest = (s: SessionItem) => s.status === 'Upcoming' && !!s.requestedByStudent && !s.confirmed;
  const requests = sessions.filter(isRequest);
  const [view, setView] = useState<'Requests' | 'Upcoming' | 'Completed' | 'Cancelled'>(requests.length ? 'Requests' : 'Upcoming');
  const [editing, setEditing] = useState<SessionItem | null>(null);
  const linkInvalid = editing?.mode === 'Video call' && !!editing.meetingLink?.trim() && !isMeetingLink(editing.meetingLink);
  const shown = sessions
    .filter((s) => (view === 'Requests' ? isRequest(s) : s.status === view))
    .sort((a, b) => (view === 'Completed' || view === 'Cancelled' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));

  const confirm = (s: SessionItem) => {
    setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, confirmed: true } : x)));
    addAudit('Sessions', 'Confirmed meeting request', `${s.studentName}, ${formatDate(s.date)} ${s.time}`);
  };

  const byDay = useMemo(() => {
    const m = new Map<string, SessionItem[]>();
    shown.forEach((s) => m.set(s.date, [...(m.get(s.date) || []), s]));
    return Array.from(m.entries());
  }, [shown]);

  const dayLabel = (iso: string) => {
    const d = daysUntil(iso);
    if (d === 0) return 'Today';
    if (d === 1) return 'Tomorrow';
    if (d === -1) return 'Yesterday';
    return new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const setStatus = (s: SessionItem, status: SessionItem['status']) => {
    setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, status } : x)));
    addAudit('Sessions', status === 'Completed' ? 'Marked session done' : 'Cancelled session', `${s.studentName}, ${formatDate(s.date)}`);
    if (status === 'Cancelled') notify({ title: `Session cancelled: ${s.studentName}`, body: `${s.topic} on ${formatDate(s.date)}`, category: 'sessions', link: 'sessions' });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sessions"
        description="One-to-one counselling calls between students and mentors."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setEditing({ id: '', date: new Date(Date.now() + DAY_MS).toISOString().slice(0, 10), time: '17:00', studentName: '', topic: '', mentor: mentorOptions[0] || '', mode: 'Video call', status: 'Upcoming' })}
          >
            Schedule session
          </Button>
        }
      />
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'Requests' as const, label: 'Student requests', count: requests.length },
          ...(['Upcoming', 'Completed', 'Cancelled'] as const).map((v) => ({ value: v, label: v, count: sessions.filter((s) => s.status === v).length })),
        ]}
      />
      {byDay.length === 0 ? (
        <Panel>
          <Empty
            icon={CalendarClock}
            title={view === 'Requests' ? 'No meeting requests waiting' : `No ${view.toLowerCase()} sessions`}
            body={view === 'Requests' ? 'Students can ask to meet the admin team from their portal. Their requests land here for you to confirm.' : undefined}
          />
        </Panel>
      ) : (
        <div className="space-y-5">
          {byDay.map(([date, items]) => (
            <section key={date}>
              <h3 className="mc-display text-[15px] font-semibold text-[#0D1B3E] mb-2" suppressHydrationWarning>
                {dayLabel(date)}
              </h3>
              <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
                {items
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((s) => (
                    <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5">
                      <div className="mc-display mc-num text-[17px] font-semibold text-[#0D1B3E] w-20 shrink-0">{s.time}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-[#0D1B3E]">{s.studentName}</div>
                        <div className="text-[13px] text-[#5B6885]">
                          {s.topic} · {s.mode} with {s.mentor}
                          {s.id.startsWith('apt:') && <span className="ml-2 text-[12px] text-[#2563EB]">Booked by student</span>}
                          {s.requestedByStudent && (
                            <span className="ml-2">
                              <Badge tone={s.confirmed ? 'mint' : 'marigold'}>{s.confirmed ? 'Confirmed request' : 'Student request'}</Badge>
                            </span>
                          )}
                        </div>
                        {s.notes && <div className="text-[12.5px] text-[#7A869E] mt-0.5">“{s.notes}”</div>}
                      </div>
                      {s.status === 'Upcoming' && (
                        <div className="flex flex-wrap gap-1">
                          {s.meetingLink ? (
                            <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-[#D3DBE8] bg-white px-3 text-[12.5px] font-semibold text-[#0D1B3E] hover:border-[#B7C3D7]">
                              Join
                            </a>
                          ) : (
                            s.mode === 'Video call' &&
                            !s.id.startsWith('apt:') && (
                              <Button size="sm" icon={Link2} onClick={() => setEditing(s)}>
                                Add link
                              </Button>
                            )
                          )}
                          {isRequest(s) && (
                            <Button size="sm" variant="primary" icon={Check} onClick={() => confirm(s)}>
                              Confirm
                            </Button>
                          )}
                          <Button size="sm" icon={Check} onClick={() => setStatus(s, 'Completed')}>
                            Mark done
                          </Button>
                          {!s.id.startsWith('apt:') && <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(s)} />}
                          <Button size="sm" variant="ghost" onClick={() => window.confirm('Cancel this session?') && setStatus(s, 'Cancelled')}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit session' : 'Schedule session'}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!editing?.studentName.trim() || !editing?.date || linkInvalid}
              onClick={() => {
                if (!editing) return;
                const link = editing.mode === 'Video call' ? (editing.meetingLink || '').trim() : '';
                const saved = { ...editing, meetingLink: link || undefined };
                if (editing.id) {
                  setSessions((prev) => prev.map((x) => (x.id === editing.id ? saved : x)));
                  addAudit('Sessions', 'Edited session', `${editing.studentName}, ${formatDate(editing.date)}`);
                } else {
                  setSessions((prev) => [...prev, { ...saved, id: uid('sess') }]);
                  addAudit('Sessions', 'Scheduled session', `${editing.studentName} with ${editing.mentor}, ${formatDate(editing.date)} ${editing.time}`);
                  notify({ title: `Session booked: ${editing.studentName}`, body: `${editing.topic || 'Counselling'} on ${formatDate(editing.date)} at ${editing.time}`, category: 'sessions', link: 'sessions' });
                }
                setEditing(null);
              }}
            >
              Save session
            </Button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Student" className="sm:col-span-2">
              <Input list="sess-students" value={editing.studentName} onChange={(e) => setEditing({ ...editing, studentName: e.target.value })} />
              <datalist id="sess-students">
                {students.map((s) => (
                  <option key={s._id} value={s.name} />
                ))}
              </datalist>
            </Field>
            <Field label="Topic" className="sm:col-span-2">
              <Input value={editing.topic} onChange={(e) => setEditing({ ...editing, topic: e.target.value })} placeholder="Mock HR interview" />
            </Field>
            <Field label="Date">
              <Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            </Field>
            <Field label="Time">
              <Input type="time" value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} />
            </Field>
            <Field label="Mentor">
              <Select value={editing.mentor} onChange={(e) => setEditing({ ...editing, mentor: e.target.value })}>
                {!mentorOptions.includes(editing.mentor) && <option value={editing.mentor}>{editing.mentor || 'Choose a mentor'}</option>}
                {mentorOptions.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </Field>
            <Field label="How">
              <Select value={editing.mode} onChange={(e) => setEditing({ ...editing, mode: e.target.value as SessionItem['mode'] })}>
                <option>Video call</option>
                <option>Phone</option>
                <option>In person</option>
              </Select>
            </Field>
            {editing.mode === 'Video call' && (
              <Field label="Meeting link" className="sm:col-span-2" hint={linkInvalid ? MEETING_LINK_HELP : 'Google Meet, Zoom or Teams. The student gets a Join button and a notification.'}>
                <Input type="url" inputMode="url" value={editing.meetingLink || ''} onChange={(e) => setEditing({ ...editing, meetingLink: e.target.value })} placeholder="https://meet.google.com/abc-defg-hij" aria-invalid={linkInvalid} />
              </Field>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

export const Reports: React.FC = () => {
  const { students, applications, stats, addAudit } = useAdmin();

  const months = useMemo(() => {
    const out: { key: string; label: string; n: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-IN', { month: 'short' }), n: 0 });
    }
    students.forEach((s) => {
      const d = new Date(s.createdAt);
      const m = out.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) m.n++;
    });
    return out;
  }, [students]);
  const maxMonth = Math.max(1, ...months.map((m) => m.n));

  const byStatus = (Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).map((k) => ({ k, label: STATUS_LABEL[k], n: students.filter((s) => s.status === k).length }));
  const byProgram = useMemo(() => {
    const m = new Map<string, { n: number; value: number }>();
    students.forEach((s) => {
      const name = s.planName.split('(')[0].trim();
      const cur = m.get(name) || { n: 0, value: 0 };
      m.set(name, { n: cur.n + 1, value: cur.value + (s.planPrice || 0) });
    });
    return Array.from(m.entries()).sort((a, b) => b[1].value - a[1].value);
  }, [students]);
  const total = stats?.totalPipelineRevenue || students.reduce((a, s) => a + (s.planPrice || 0), 0);
  const realised = students.filter((s) => s.status === 'enrolled' || s.status === 'completed').reduce((a, s) => a + (s.planPrice || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Registrations, revenue and outcomes. Export any of it for your own spreadsheets."
        actions={
          <>
            <Button
              icon={Download}
              onClick={() => {
                exportStudents(students);
                addAudit('Reports', 'Exported students to CSV', `${students.length} rows`);
              }}
            >
              Students CSV
            </Button>
            <Button
              icon={Download}
              onClick={() => {
                downloadCsv(
                  `maxicareer_report_summary_${new Date().toISOString().slice(0, 10)}.csv`,
                  ['Metric', 'Value'],
                  [
                    ['Total students', students.length],
                    ...byStatus.map((s) => [`Status: ${s.label}`, s.n]),
                    ['Pipeline value (INR)', total],
                    ['Enrolled + completed value (INR)', realised],
                    ...STAGES.map((st) => [`Applications: ${st}`, applications.filter((a) => a.stage === st).length]),
                  ]
                );
                addAudit('Reports', 'Exported summary report', 'CSV');
              }}
            >
              Summary CSV
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Pipeline value" value={<span className="text-[26px]">{inr(total)}</span>} hint="All registrations" />
        <Stat label="Enrolled value" value={<span className="text-[26px]">{inr(realised)}</span>} hint={`${total ? Math.round((realised / total) * 100) : 0}% of pipeline`} />
        <Stat label="Average fee" value={<span className="text-[26px]">{inr(students.length ? Math.round(total / students.length) : 0)}</span>} />
        <Stat label="Offers" value={applications.filter((a) => a.stage === 'Offer').length} hint={`From ${applications.length} applications`} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="New registrations" description="Last six months">
          <div className="flex items-end gap-3 h-44 pt-4">
            {months.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="mc-num text-[12.5px] font-semibold text-[#26355A]">{m.n}</span>
                <div className="w-full max-w-[44px] rounded-t-[6px] bg-[#2563EB]" style={{ height: `${Math.max(4, (m.n / maxMonth) * 100)}%`, opacity: m.n ? 1 : 0.2 }} />
                <span className="text-[12px] text-[#5B6885]">{m.label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Where students are">
          <ul className="space-y-3">
            {byStatus.map((s) => (
              <li key={s.k} className="flex items-center gap-3">
                <span className="w-24 text-[13.5px] text-[#26355A]">{s.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#EEF2F7] overflow-hidden">
                  <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${students.length ? (s.n / students.length) * 100 : 0}%` }} />
                </div>
                <span className="mc-num w-10 text-right text-[13px] font-semibold text-[#0D1B3E]">{s.n}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Revenue by program" flush>
          <table className="w-full">
            <thead>
              <tr>
                <Th>Program</Th>
                <Th className="text-right">Learners</Th>
                <Th className="text-right">Value</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF6]">
              {byProgram.map(([name, v]) => (
                <tr key={name}>
                  <Td>{name}</Td>
                  <Td className="mc-num text-right">{v.n}</Td>
                  <Td className="mc-num text-right font-semibold">{inr(v.value)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {byProgram.length === 0 && <Empty title="No data yet" />}
        </Panel>
        <Panel title="Application outcomes">
          <ul className="space-y-2.5">
            {STAGES.map((st) => {
              const n = applications.filter((a) => a.stage === st).length;
              return (
                <li key={st} className="flex items-center justify-between">
                  <Badge tone={STAGE_TONE[st]} dot>
                    {st}
                  </Badge>
                  <span className="mc-num text-[13.5px] font-semibold text-[#0D1B3E]">{n}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

/** Data an earlier version kept in this browser, and where it lives now. */
const LEGACY_COLLECTIONS: [string, string][] = [
  ['maxicareer_applications', 'applications'],
  ['maxicareer_roadmap_templates', 'templates'],
  ['maxicareer_student_roadmaps', 'roadmaps'],
  ['maxicareer_approvals', 'approvals'],
  ['maxicareer_sessions', 'sessions'],
  ['maxicareer_audit_logs', 'audit'],
  ['maxicareer_notifications', 'notifications'],
  ['maxicareer_services', 'services'],
];
const LEGACY_SETTINGS: [string, string][] = [
  ['maxicareer_website_draft', 'website_draft'],
  ['maxicareer_website_published', 'website_published'],
  ['maxicareer_website_published_at', 'website_published_at'],
  ['maxicareer_notification_prefs', 'notification_prefs'],
  ['maxicareer_role_pages_v2', 'role_pages'],
  ['maxicareer_audit_retention', 'audit_retention'],
];

interface Health {
  data: { isRealMongo: boolean; dbName: string; uriHost: string; totalStudents: number; lastPingMs: number };
  storage: { configured: boolean; ok: boolean; container: string; ms: number; error?: string };
  mail: { configured: boolean; ok: boolean; ms: number; via: 'smtp' | 'resend' | 'none'; host?: string; user?: string; trimmed: string[]; error?: string };
}

export const SettingsPage: React.FC<{ onLogout: () => void; onBackToSite: () => void }> = ({ onLogout, onBackToSite }) => {
  const { session, platform, toast, addAudit, refreshStudents } = useAdmin();
  const isAdmin = !session.staffRole || session.staffRole === 'Global admin' || session.staffRole === 'Admin';
  const [health, setHealth] = useState<Health | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const check = async () => {
    setChecking(true);
    try {
      setHealth(await apiGet<Health>('/api/database/status'));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not check the connections.', 'error');
    } finally {
      setChecking(false);
    }
  };
  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const legacyCount = useMemo(() => {
    if (readStore<string | null>('maxicareer_imported_at', null)) return 0;
    return LEGACY_COLLECTIONS.reduce((n, [key]) => {
      const v = readStore<unknown>(key, null);
      return n + (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0);
    }, 0);
  }, []);

  const importBrowserData = async () => {
    setBusy('import');
    try {
      for (const [key, collection] of LEGACY_COLLECTIONS) {
        const raw = readStore<unknown>(key, null);
        let items: Record<string, unknown>[] = [];
        if (Array.isArray(raw)) items = raw as Record<string, unknown>[];
        else if (raw && typeof raw === 'object') items = Object.entries(raw as Record<string, object>).map(([id, v]) => ({ ...v, id }));
        items = items
          .filter((i) => i && typeof i.id === 'string')
          .map((i, idx) => (collection === 'audit' ? { module: 'General', ...i } : collection === 'templates' || collection === 'services' ? { ...i, _order: idx } : i));
        if (items.length) await apiSend(`/api/admin/data/${collection}`, { upserts: items, deletes: [] });
      }
      for (const [key, setting] of LEGACY_SETTINGS) {
        const raw = readStore<unknown>(key, null);
        if (raw === null) continue;
        const existing = await apiGet<{ exists: boolean }>(`/api/admin/settings/${setting}`);
        if (!existing.exists) await apiSend(`/api/admin/settings/${setting}`, { value: raw }, 'PUT');
      }
      writeStore('maxicareer_imported_at', new Date().toISOString());
      addAudit('Settings', 'Imported browser data', `${legacyCount} items`);
      resetSharedData();
      window.location.reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import failed.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const sampleData = async (action: 'loadDemoData' | 'clearDemoData') => {
    if (action === 'clearDemoData' && !window.confirm('Remove all sample students, counsellors, sessions and accounts? Real records are kept.')) return;
    setBusy(action);
    try {
      await platformStore.act(action);
      await refreshStudents(true);
      check();
      addAudit('Settings', action === 'loadDemoData' ? 'Loaded sample data' : 'Cleared sample data', '');
      toast(action === 'loadDemoData' ? 'Sample data loaded.' : 'Sample data removed.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const row = (label: string, ok: boolean | null, detail: string) => (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-[#EAEFF6] last:border-0">
      <div>
        <div className="text-[14px] font-semibold text-[#0D1B3E]">{label}</div>
        <div className="text-[12.5px] text-[#5B6885] break-all">{detail}</div>
      </div>
      <Badge tone={ok === null ? 'neutral' : ok ? 'mint' : 'rose'} dot>
        {ok === null ? 'Checking' : ok ? 'Connected' : 'Not connected'}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Settings" description="Your account and how this workspace connects to data." />
      <Panel title="Your account">
        <div className="flex items-center gap-4">
          <Avatar name={session.name} size={52} tone="blue" />
          <div className="flex-1">
            <div className="text-[16px] font-semibold text-[#0D1B3E]">{session.name}</div>
            <div className="text-[13px] text-[#5B6885]">
              {session.email} · {session.staffRole || 'Administrator'}
            </div>
            <div className="text-[12.5px] text-[#7A869E] mt-0.5">Signed in {formatDate(new Date(session.loggedInAt).toISOString(), true)}</div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button icon={ExternalLink} onClick={onBackToSite}>
            View website
          </Button>
          <Button variant="danger" icon={LogOut} onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </Panel>

      <Panel
        title="Connections"
        actions={
          <Button size="sm" icon={Database} onClick={check} disabled={checking}>
            {checking ? 'Checking…' : 'Check again'}
          </Button>
        }
      >
        {row(
          'MongoDB',
          health ? health.data.isRealMongo : null,
          health ? `${health.data.uriHost} / ${health.data.dbName} · ${health.data.totalStudents} students · ${health.data.lastPingMs} ms` : 'Students, sessions, messages and all admin data'
        )}
        {row(
          'Azure Blob Storage',
          health ? health.storage.ok : null,
          health
            ? health.storage.configured
              ? `Container "${health.storage.container}"${health.storage.ok ? ` · ${health.storage.ms} ms` : ` · ${health.storage.error}`}`
              : 'Not configured: set AZURE_STORAGE_CONNECTION_STRING to enable uploads'
            : 'Uploaded photos, attachments and website images'
        )}
        {row(
          health?.mail.via === 'smtp' ? 'Email (SMTP)' : 'Email (Resend)',
          health ? health.mail.ok : null,
          !health
            ? 'Password resets, sign-in codes and enquiry alerts'
            : !health.mail.configured
              ? 'Not configured: set SMTP_HOST, SMTP_USER and SMTP_PASS (or RESEND_API_KEY) to send emails'
              : health.mail.via === 'smtp'
                ? `${health.mail.user} via ${health.mail.host}${health.mail.ok ? ` · ${health.mail.ms} ms` : ` · ${health.mail.error}`}${health.mail.trimmed.length ? ` · extra spaces ignored in ${health.mail.trimmed.join(', ')}` : ''}`
                : 'Password resets, sign-in codes and enquiry alerts are emailed'
        )}
      </Panel>

      {isAdmin && (
        <Panel title="Sample data" description="Clearly-marked sample students, counsellors, sessions and accounts for walkthroughs.">
          <p className="text-[13.5px] text-[#26355A]">
            {platform.environment === 'demo'
              ? 'Sample data is loaded. Sample accounts use the password "password123" (staff: admin123 / mentor123).'
              : 'No sample data is loaded. Everything you see is real.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {platform.environment === 'demo' ? (
              <Button variant="danger" onClick={() => sampleData('clearDemoData')} disabled={busy !== null}>
                {busy === 'clearDemoData' ? 'Removing…' : 'Remove sample data'}
              </Button>
            ) : (
              <Button onClick={() => sampleData('loadDemoData')} disabled={busy !== null}>
                {busy === 'loadDemoData' ? 'Loading…' : 'Load sample data'}
              </Button>
            )}
          </div>
        </Panel>
      )}

      {isAdmin && legacyCount > 0 && (
        <Panel title="Data saved in this browser" description="An earlier version kept admin data in this browser only.">
          <p className="text-[13.5px] text-[#26355A]">
            This browser has {legacyCount} item{legacyCount === 1 ? '' : 's'} (applications, roadmaps, sessions, notifications, audit entries, website drafts) that
            aren&apos;t in the database yet. Import them so every admin can see them.
          </p>
          <Button className="mt-4" variant="primary" onClick={importBrowserData} disabled={busy !== null}>
            {busy === 'import' ? 'Importing…' : 'Import into the database'}
          </Button>
        </Panel>
      )}
    </div>
  );
};
