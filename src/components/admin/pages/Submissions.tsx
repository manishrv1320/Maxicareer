import React, { useEffect, useMemo, useState } from 'react';
import { Download, Inbox, Mail, Phone, Trash2, UserRound, Check } from 'lucide-react';
import { useAdmin, FormKind, FormSubmission, SubmissionStatus } from '../context';
import { PageHeader, Badge, Button, Drawer, Empty, Field, Segmented, Select, SearchInput, Stat, Textarea, Avatar, Tone } from '../ui';
import { DAY_MS, downloadCsv, formatDate, timeAgo } from '../lib';

export const FORM_KINDS: { value: FormKind; label: string; tone: Tone }[] = [
  { value: 'contact', label: 'Contact form', tone: 'blue' },
  { value: 'service_request', label: 'Service request', tone: 'violet' },
  { value: 'program_registration', label: 'Program registration', tone: 'mint' },
  { value: 'student_signup', label: 'Student sign-up', tone: 'neutral' },
  { value: 'counsellor_signup', label: 'Counsellor sign-up', tone: 'marigold' },
  { value: 'mentor_signup', label: 'Mentor sign-up', tone: 'marigold' },
  { value: 'support_request', label: 'Support request', tone: 'rose' },
];

const kindTone = (k: FormKind): Tone => FORM_KINDS.find((f) => f.value === k)?.tone || 'neutral';

export const SUBMISSION_STATUS_TONE: Record<SubmissionStatus, Tone> = { New: 'marigold', Contacted: 'blue', Closed: 'neutral' };
const STATUSES: SubmissionStatus[] = ['New', 'Contacted', 'Closed'];

let pendingFocus: string | null = null;
/** Opens this submission the next time the Form submissions page mounts (used by the dashboard). */
export function focusSubmission(id: string) {
  pendingFocus = id;
}

export const Submissions: React.FC = () => {
  const { session, submissions, setSubmissions, students, openStudent, addAudit, toast } = useAdmin();
  const [status, setStatus] = useState<'all' | SubmissionStatus>('all');
  const [kind, setKind] = useState<'all' | FormKind>('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(() => {
    const id = pendingFocus;
    pendingFocus = null;
    return id;
  });
  const [note, setNote] = useState('');

  const sorted = useMemo(() => [...submissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [submissions]);
  const ofKind = kind === 'all' ? sorted : sorted.filter((s) => s.form === kind);
  const needle = q.trim().toLowerCase();
  const shown = ofKind.filter(
    (s) =>
      (status === 'all' || s.status === status) &&
      (!needle || `${s.name} ${s.email} ${s.phone} ${s.subject} ${s.message}`.toLowerCase().includes(needle))
  );
  const open = submissions.find((s) => s.id === openId) || null;
  const linkedStudent = open?.studentId ? students.find((st) => st._id === open.studentId) : undefined;

  useEffect(() => {
    setNote(open?.adminNote || '');
    // Reset the note only when another submission is opened, not on every refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id]);

  const update = (s: FormSubmission, patch: Partial<FormSubmission>) =>
    setSubmissions((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...patch, updatedAt: new Date().toISOString(), handledBy: session.email } : x)));

  const setStatusOf = (s: FormSubmission, next: SubmissionStatus) => {
    if (s.status === next) return;
    update(s, { status: next });
    addAudit('Form submissions', `Marked ${next.toLowerCase()}`, `${s.formLabel}: ${s.name}`);
  };

  const remove = (s: FormSubmission) => {
    if (!window.confirm(`Delete this ${s.formLabel.toLowerCase()} from ${s.name}? This can't be undone.`)) return;
    setSubmissions((prev) => prev.filter((x) => x.id !== s.id));
    setOpenId(null);
    addAudit('Form submissions', 'Deleted submission', `${s.formLabel}: ${s.name}`);
  };

  const count = (st: SubmissionStatus) => ofKind.filter((s) => s.status === st).length;
  const lastWeek = submissions.filter((s) => Date.now() - new Date(s.createdAt).getTime() < 7 * DAY_MS).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Form submissions"
        description="Every form filled on the website and portals: contact enquiries, service requests, program registrations, sign-ups and support requests."
        actions={
          <Button
            icon={Download}
            disabled={!shown.length}
            onClick={() =>
              downloadCsv(
                `maxicareer_form_submissions_${new Date().toISOString().slice(0, 10)}.csv`,
                ['Received', 'Form', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Details', 'Status', 'Admin note'],
                shown.map((s) => [
                  s.createdAt,
                  s.formLabel,
                  s.name,
                  s.email,
                  s.phone,
                  s.subject,
                  s.message,
                  (s.details || []).map((d) => `${d.label}: ${d.value}`).join(' | '),
                  s.status,
                  s.adminNote,
                ])
              )
            }
          >
            Export
          </Button>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat
          label="New, not yet answered"
          value={submissions.filter((s) => s.status === 'New').length}
          accent={submissions.some((s) => s.status === 'New') ? <span className="h-2.5 w-2.5 rounded-full bg-[#F2A93B]" /> : undefined}
          onClick={() => setStatus('New')}
        />
        <Stat label="Last 7 days" value={lastWeek} />
        <Stat label="Contacted" value={submissions.filter((s) => s.status === 'Contacted').length} onClick={() => setStatus('Contacted')} />
        <Stat label="All submissions" value={submissions.length} onClick={() => setStatus('all')} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[{ value: 'all' as const, label: 'All', count: ofKind.length }, ...STATUSES.map((st) => ({ value: st, label: st, count: count(st) }))]}
        />
        <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="lg:w-56" aria-label="Form">
          <option value="all">All forms</option>
          {FORM_KINDS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email, phone or message" className="lg:flex-1" />
      </div>

      <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6] overflow-hidden">
        {shown.length === 0 && (
          <Empty
            icon={Inbox}
            title={submissions.length ? 'No submissions match' : 'No form submissions yet'}
            body="When someone fills a form on the website or portal, it appears here with every detail they entered."
          />
        )}
        {shown.map((s) => (
          <button key={s.id} type="button" onClick={() => setOpenId(s.id)} className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-[#F7F9FC] focus-visible:outline-none focus-visible:bg-[#F7F9FC]">
            <Avatar name={s.name} />
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2 flex-wrap">
                <span className="text-[14px] font-semibold text-[#0D1B3E]">{s.name}</span>
                <Badge tone={kindTone(s.form)}>{s.formLabel}</Badge>
              </span>
              <span className="block mt-1 text-[13.5px] text-[#26355A] truncate">{s.subject || s.message || 'No message'}</span>
              <span className="block mt-0.5 text-[12.5px] text-[#7A869E] truncate">
                {s.email}
                {s.phone ? ` · ${s.phone}` : ''} · {timeAgo(s.createdAt)}
              </span>
            </span>
            <Badge tone={SUBMISSION_STATUS_TONE[s.status]} dot={s.status === 'New'}>
              {s.status}
            </Badge>
          </button>
        ))}
      </div>

      <Drawer
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.name || ''}
        subtitle={open ? `${open.formLabel} · received ${formatDate(open.createdAt, true)}` : undefined}
        footer={
          open && (
            <>
              <Button variant="danger" icon={Trash2} onClick={() => remove(open)} className="mr-auto">
                Delete
              </Button>
              {open.status === 'New' ? (
                <Button variant="primary" icon={Check} onClick={() => setStatusOf(open, 'Contacted')}>
                  Mark as contacted
                </Button>
              ) : (
                <Button onClick={() => setOpenId(null)}>Close</Button>
              )}
            </>
          )
        }
      >
        {open && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a href={`mailto:${open.email}`} className="flex items-center gap-2.5 rounded-[12px] border border-[#DDE4EF] px-3.5 py-3 hover:border-[#B7C3D7] min-w-0">
                <Mail className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="text-[13.5px] font-medium text-[#0D1B3E] truncate">{open.email}</span>
              </a>
              {open.phone ? (
                <a href={`tel:${open.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2.5 rounded-[12px] border border-[#DDE4EF] px-3.5 py-3 hover:border-[#B7C3D7]">
                  <Phone className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span className="mc-num text-[13.5px] font-medium text-[#0D1B3E]">{open.phone}</span>
                </a>
              ) : (
                <div className="flex items-center gap-2.5 rounded-[12px] border border-dashed border-[#DDE4EF] px-3.5 py-3 text-[13px] text-[#7A869E]">
                  <Phone className="w-4 h-4 shrink-0" /> No phone given
                </div>
              )}
            </div>

            {open.subject && (
              <section>
                <h4 className="text-[12px] font-semibold uppercase tracking-wide text-[#7A869E]">Subject</h4>
                <p className="mt-1 text-[15px] font-semibold text-[#0D1B3E]">{open.subject}</p>
              </section>
            )}

            <section>
              <h4 className="text-[12px] font-semibold uppercase tracking-wide text-[#7A869E]">Message</h4>
              {open.message ? (
                <p className="mt-1.5 rounded-[12px] bg-[#F7F9FC] border border-[#EAEFF6] px-4 py-3 text-[14px] leading-relaxed text-[#26355A] whitespace-pre-wrap">{open.message}</p>
              ) : (
                <p className="mt-1 text-[13px] text-[#9AA5BB]">No message was written.</p>
              )}
            </section>

            {open.details?.length > 0 && (
              <section>
                <h4 className="text-[12px] font-semibold uppercase tracking-wide text-[#7A869E]">Details</h4>
                <dl className="mt-1.5 rounded-[12px] border border-[#EAEFF6] divide-y divide-[#EAEFF6]">
                  {open.details.map((d) => (
                    <div key={d.label} className="grid grid-cols-[minmax(110px,40%)_1fr] gap-3 px-4 py-2.5">
                      <dt className="text-[13px] text-[#5B6885]">{d.label}</dt>
                      <dd className="text-[13.5px] text-[#0D1B3E] break-words whitespace-pre-wrap">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section className="space-y-3">
              <h4 className="text-[12px] font-semibold uppercase tracking-wide text-[#7A869E]">Follow-up</h4>
              <Segmented value={open.status} onChange={(v) => setStatusOf(open, v)} options={STATUSES.map((st) => ({ value: st, label: st }))} />
              <Field label="Admin note" hint="Only staff can see this.">
                <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called on Monday, sending the brochure…" />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={note === (open.adminNote || '')}
                  onClick={() => {
                    update(open, { adminNote: note.trim() });
                    toast('Note saved.');
                  }}
                >
                  Save note
                </Button>
                {linkedStudent && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={UserRound}
                    onClick={() => {
                      setOpenId(null);
                      openStudent(linkedStudent);
                    }}
                  >
                    Open student record
                  </Button>
                )}
              </div>
              {open.handledBy && open.updatedAt && (
                <p className="text-[12px] text-[#7A869E]">
                  Last updated by {open.handledBy}, {timeAgo(open.updatedAt)}
                </p>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
};
