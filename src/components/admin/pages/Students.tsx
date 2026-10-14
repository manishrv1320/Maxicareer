import React, { useEffect, useMemo, useState } from 'react';
import { Download, Upload, Plus, RefreshCw, MessageCircle, Mail, Trash2, Users, FileDown, Check, X } from 'lucide-react';
import { DbStudent } from '../../../types';
import { useAdmin, COHORT_LABEL, roadmapProgress } from '../context';
import { PageHeader, Button, IconButton, Badge, Select, SearchInput, Segmented, Th, Td, Avatar, Empty, StepMeter, Modal, Tone } from '../ui';
import { downloadCsv, formatDate, inr, pick, useCsvPicker, DAY_MS } from '../lib';

export const STATUS_TONE: Record<DbStudent['status'], Tone> = {
  pending: 'marigold',
  contacted: 'blue',
  enrolled: 'mint',
  completed: 'violet',
  cancelled: 'neutral',
};

export const STATUS_LABEL: Record<DbStudent['status'], string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  enrolled: 'Enrolled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const EXPORT_HEADERS = [
  'Registration_ID',
  'Name',
  'Email',
  'Phone',
  'City',
  'Cohort',
  'Institution_or_Company',
  'Background_Detail',
  'Plan_Name',
  'Fee_INR',
  'Status',
  'Assigned_Mentor',
  'Assigned_Counsellor',
  'Registration_Date',
  'Source',
];

const COHORT_FROM_TEXT = (t: string): DbStudent['profession'] => {
  const v = t.toLowerCase();
  if (v.includes('school')) return 'school';
  if (v.includes('fresher') || v.includes('psw')) return 'fresher';
  if (v.includes('work') || v.includes('professional')) return 'working_professional';
  return 'college';
};

/** 'Unassigned' for an empty or missing assignment. */
const assigned = (v?: string) => (v && v !== 'Unassigned' ? v : 'Unassigned');

/** Program name without the fee/duration suffix, e.g. "Step-Next career program". */
const programOf = (s: DbStudent) => (s.planName || '').split('(')[0].trim();

const REGISTERED: Record<string, string> = { '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 3 months', '365': 'Last 12 months' };

/** Inline dropdown in a table cell for assigning a mentor or counsellor. */
const AssignSelect: React.FC<{ value?: string; names: string[]; label: string; onChange: (name: string) => void }> = ({ value, names, label, onChange }) => {
  const current = assigned(value);
  return (
    <select
      value={current}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className={`max-w-[170px] bg-transparent text-[13.5px] font-medium rounded-[8px] px-1.5 py-1 -mx-1.5 hover:bg-[#EDF1F8] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 ${
        current === 'Unassigned' ? 'text-[#94570A]' : 'text-[#26355A]'
      }`}
    >
      <option value="Unassigned">Unassigned</option>
      {current !== 'Unassigned' && !names.includes(current) && <option>{current}</option>}
      {names.map((m) => (
        <option key={m}>{m}</option>
      ))}
    </select>
  );
};

export function exportStudents(students: DbStudent[]) {
  downloadCsv(
    `maxicareer_students_${new Date().toISOString().slice(0, 10)}.csv`,
    EXPORT_HEADERS,
    students.map((s) => [
      s._id,
      s.name,
      s.email,
      s.phone,
      s.city || '',
      s.professionLabel,
      s.institutionOrCompany || '',
      s.detail || '',
      s.planName,
      s.planPrice || 0,
      s.status,
      s.mentorAssigned,
      assigned(s.counselorAssigned),
      s.registeredDate,
      s.source,
    ])
  );
}

export const Students: React.FC = () => {
  const {
    students,
    isLoading,
    isRefreshing,
    loadError,
    refreshStudents,
    patchStudent,
    deleteStudent,
    createStudent,
    openStudent,
    studentPrefilter,
    setStudentPrefilter,
    studentRoadmaps,
    addAudit,
    toast,
    openAddStudent,
    mentorNames,
    counsellorNames,
  } = useAdmin();

  const [query, setQuery] = useState('');
  const [cohort, setCohort] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [mentor, setMentor] = useState<string>('all');
  const [counsellor, setCounsellor] = useState<string>('all');
  const [program, setProgram] = useState<string>('all');
  const [registered, setRegistered] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'fee'>('newest');
  const [importPreview, setImportPreview] = useState<{ rows: Record<string, string>[]; fileName: string } | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (studentPrefilter) {
      setCohort(studentPrefilter.cohort || 'all');
      setStatus(studentPrefilter.status || 'all');
      setStudentPrefilter(null);
    }
  }, [studentPrefilter, setStudentPrefilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => (cohort === 'all' ? true : s.profession === cohort))
      .filter((s) => (status === 'all' ? true : s.status === status))
      .filter((s) => (mentor === 'all' ? true : assigned(s.mentorAssigned) === mentor))
      .filter((s) => (counsellor === 'all' ? true : assigned(s.counselorAssigned) === counsellor))
      .filter((s) => (program === 'all' ? true : programOf(s) === program))
      .filter((s) => (registered === 'all' ? true : Date.now() - Date.parse(s.createdAt) <= Number(registered) * DAY_MS))
      .filter((s) =>
        !q
          ? true
          : [s.name, s.email, s.phone, s.institutionOrCompany, s.detail, s.planName, s.city].some((v) => v?.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'fee') return (b.planPrice || 0) - (a.planPrice || 0);
        if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [students, query, cohort, status, mentor, counsellor, program, registered, sortBy]);

  // Filter choices: approved people plus anyone already assigned (even if no longer listed).
  const withAssigned = (names: string[], values: (string | undefined)[]) =>
    Array.from(new Set([...names, ...values.map(assigned).filter((v) => v !== 'Unassigned')])).sort();
  const mentorChoices = useMemo(() => withAssigned(mentorNames, students.map((s) => s.mentorAssigned)), [mentorNames, students]);
  const counsellorChoices = useMemo(() => withAssigned(counsellorNames, students.map((s) => s.counselorAssigned)), [counsellorNames, students]);
  const programChoices = useMemo(() => Array.from(new Set(students.map(programOf).filter(Boolean))).sort(), [students]);
  const activeFilters = [status, mentor, counsellor, program, registered].filter((v) => v !== 'all').length + (query.trim() ? 1 : 0) + (cohort !== 'all' ? 1 : 0);
  const clearFilters = () => {
    setQuery('');
    setCohort('all');
    setStatus('all');
    setMentor('all');
    setCounsellor('all');
    setProgram('all');
    setRegistered('all');
  };

  const cohortCount = (k: string) => students.filter((s) => s.profession === k).length;

  const pickCsv = useCsvPicker((rows, fileName) => {
    if (!rows.length) {
      toast('That file has no rows under the header line.', 'error');
      return;
    }
    setImportPreview({ rows, fileName });
  });

  const runImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    let ok = 0;
    let skipped = 0;
    const existing = new Set(students.map((s) => s.email.toLowerCase()));
    for (const r of importPreview.rows) {
      const name = pick(r, 'name', 'full_name', 'student_name');
      const email = pick(r, 'email', 'email_address').toLowerCase();
      if (!name || !email || existing.has(email)) {
        skipped++;
        continue;
      }
      const fee = Number(pick(r, 'fee_inr', 'fee', 'plan_price', 'price').replace(/[^0-9.]/g, ''));
      const st = pick(r, 'status').toLowerCase();
      const created = await createStudent({
        name,
        email,
        phone: pick(r, 'phone', 'mobile', 'whatsapp'),
        city: pick(r, 'city', 'location'),
        profession: COHORT_FROM_TEXT(pick(r, 'cohort', 'profession', 'segment')),
        institutionOrCompany: pick(r, 'institution_or_company', 'institution', 'college', 'company'),
        detail: pick(r, 'background_detail', 'detail', 'goal'),
        planName: pick(r, 'plan_name', 'program', 'plan') || undefined,
        planPrice: Number.isFinite(fee) && fee > 0 ? fee : undefined,
        status: ['pending', 'contacted', 'enrolled', 'completed', 'cancelled'].includes(st) ? st : 'pending',
        mentorAssigned: pick(r, 'assigned_mentor', 'mentor') || 'Unassigned',
        counselorAssigned: pick(r, 'assigned_counsellor', 'assigned_counselor', 'counsellor', 'counselor') || 'Unassigned',
        notes: `Imported from ${importPreview.fileName}`,
        source: 'admin_manual',
      });
      if (created) {
        ok++;
        existing.add(email);
      } else skipped++;
    }
    setImporting(false);
    setImportPreview(null);
    addAudit('Students', 'Imported students from CSV', `${ok} added, ${skipped} skipped (${importPreview.fileName})`);
    toast(`Imported ${ok} student${ok === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} (missing name/email or already registered)` : ''}.`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        description="Everyone who registered through the website, a consultation, or was added by the team."
        actions={
          <>
            <Button icon={Upload} onClick={pickCsv}>
              Import CSV
            </Button>
            <Button
              icon={Download}
              onClick={() => {
                exportStudents(filtered);
                addAudit('Students', 'Exported students to CSV', `${filtered.length} rows`);
              }}
              disabled={!filtered.length}
            >
              Export CSV
            </Button>
            <Button variant="primary" icon={Plus} onClick={openAddStudent}>
              Add student
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <Segmented
          value={cohort}
          onChange={setCohort}
          options={[
            { value: 'all', label: 'All', count: students.length },
            ...Object.entries(COHORT_LABEL).map(([k, l]) => ({ value: k, label: l, count: cohortCount(k) })),
          ]}
        />
        <div className="flex flex-col md:flex-row gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, phone, college or program" className="flex-1" />
          <div className="flex gap-2">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="flex-1 md:w-40" aria-label="Sort">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
              <option value="fee">Highest fee</option>
            </Select>
            <IconButton icon={RefreshCw} label="Reload from database" onClick={() => refreshStudents(true)} className={`h-10 w-10 shrink-0 border border-[#D3DBE8] bg-white ${isRefreshing ? '[&>svg]:animate-spin' : ''}`} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="md:w-40" aria-label="Filter by status">
            <option value="all">Any status</option>
            {Object.entries(STATUS_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
          <Select value={mentor} onChange={(e) => setMentor(e.target.value)} className="md:w-44" aria-label="Filter by mentor">
            <option value="all">Any mentor</option>
            <option value="Unassigned">No mentor yet</option>
            {mentorChoices.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
          <Select value={counsellor} onChange={(e) => setCounsellor(e.target.value)} className="md:w-44" aria-label="Filter by counsellor">
            <option value="all">Any counsellor</option>
            <option value="Unassigned">No counsellor yet</option>
            {counsellorChoices.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
          <Select value={program} onChange={(e) => setProgram(e.target.value)} className="md:w-48" aria-label="Filter by program">
            <option value="all">Any program</option>
            {programChoices.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
          <Select value={registered} onChange={(e) => setRegistered(e.target.value)} className="md:w-40" aria-label="Filter by registration date">
            <option value="all">Registered any time</option>
            {Object.entries(REGISTERED).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" icon={X} onClick={clearFilters} className="col-span-2 md:col-span-1">
              Clear filters ({activeFilters})
            </Button>
          )}
        </div>
      </div>

      {loadError && <div className="rounded-[12px] bg-[#FCEBEC] text-[#B42F3B] px-4 py-3 text-[13.5px]">Couldn't load students: {loadError}. Use the reload button to try again.</div>}

      <div className="bg-white border border-[#DDE4EF] rounded-[14px] overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Cohort</Th>
                <Th>Program</Th>
                <Th>Status</Th>
                <Th>Mentor</Th>
                <Th>Counsellor</Th>
                <Th>Roadmap</Th>
                <Th>Registered</Th>
                <Th className="text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF6]">
              {isLoading ? (
                <tr>
                  <Td colSpan={9} className="py-14 text-center text-[#5B6885]">
                    Loading students…
                  </Td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <Td colSpan={9}>
                    <Empty
                      icon={Users}
                      title="No students match these filters"
                      body="Try a different search or filter."
                      action={
                        activeFilters > 0 ? (
                          <Button size="sm" icon={X} onClick={clearFilters}>
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  </Td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const r = studentRoadmaps[s._id];
                  const p = r ? roadmapProgress(r) : s.roadmapProgress || 0;
                  return (
                    <tr key={s._id} className="hover:bg-[#F9FBFE]">
                      <Td>
                        <button type="button" onClick={() => openStudent(s)} className="flex items-center gap-3 text-left group">
                          <Avatar name={s.name} />
                          <span className="min-w-0">
                            <span className="block font-semibold text-[#0D1B3E] group-hover:text-[#2563EB] truncate max-w-[200px]">{s.name}</span>
                            <span className="block text-[12.5px] text-[#5B6885] truncate max-w-[200px]">{s.email}</span>
                          </span>
                        </button>
                      </Td>
                      <Td>
                        <div className="text-[13.5px]">{COHORT_LABEL[s.profession] || s.professionLabel}</div>
                        {s.institutionOrCompany && <div className="text-[12px] text-[#7A869E] truncate max-w-[160px]">{s.institutionOrCompany}</div>}
                      </Td>
                      <Td>
                        <div className="truncate max-w-[200px]">{s.planName.split('(')[0].trim()}</div>
                        <div className="mc-num text-[12.5px] text-[#5B6885]">{inr(s.planPrice)}</div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <label className="relative inline-flex">
                            <span className="sr-only">Status for {s.name}</span>
                            <Badge tone={STATUS_TONE[s.status]} dot className="pr-6">
                              {STATUS_LABEL[s.status]}
                            </Badge>
                            <select
                              value={s.status}
                              onChange={(e) => {
                                patchStudent(s._id, { status: e.target.value as DbStudent['status'] });
                                addAudit('Students', 'Changed status', `${s.name}: ${STATUS_LABEL[s.status]} → ${STATUS_LABEL[e.target.value as DbStudent['status']]}`);
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            >
                              {Object.entries(STATUS_LABEL).map(([k, l]) => (
                                <option key={k} value={k}>
                                  {l}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] opacity-60">▼</span>
                          </label>
                          {s.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => {
                                patchStudent(s._id, {
                                  status: 'enrolled',
                                  mentorAssigned: !s.mentorAssigned || s.mentorAssigned === 'Unassigned' ? 'Sneha Sen' : s.mentorAssigned,
                                });
                                addAudit('Students', 'Confirmed course enrollment', `${s.name} for ${s.planName} → Enrolled`);
                                toast(`Course enrollment confirmed for ${s.name}! Assigned to ${!s.mentorAssigned || s.mentorAssigned === 'Unassigned' ? 'Sneha Sen' : s.mentorAssigned}.`);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors shrink-0"
                              title="1-Click Course Confirmation"
                            >
                              <Check className="w-3 h-3" />
                              <span>Confirm</span>
                            </button>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <AssignSelect
                          value={s.mentorAssigned}
                          names={mentorNames}
                          label={`Mentor for ${s.name}`}
                          onChange={(name) => {
                            patchStudent(s._id, { mentorAssigned: name });
                            addAudit('Students', 'Assigned mentor', `${s.name} → ${name}`);
                          }}
                        />
                      </Td>
                      <Td>
                        <AssignSelect
                          value={s.counselorAssigned}
                          names={counsellorNames}
                          label={`Counsellor for ${s.name}`}
                          onChange={(name) => {
                            patchStudent(s._id, { counselorAssigned: name });
                            addAudit('Students', 'Assigned counsellor', `${s.name} → ${name}`);
                          }}
                        />
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <StepMeter value={p} steps={5} height={16} width={44} tone={r ? 'blue' : 'sky'} />
                          <span className="mc-num text-[12.5px] text-[#5B6885]">{p}%</span>
                        </div>
                      </Td>
                      <Td className="text-[12.5px] text-[#5B6885] whitespace-nowrap" suppressHydrationWarning>
                        {formatDate(s.createdAt)}
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <a
                          href={`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${s.name}, this is Maxicareer regarding your registration for ${s.planName}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Message on WhatsApp"
                          aria-label={`Message ${s.name} on WhatsApp`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#0F9F6E] hover:bg-[#E3F6EE]"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                        <a
                          href={`mailto:${s.email}?subject=${encodeURIComponent(`Maxicareer: next steps for ${s.planName}`)}`}
                          title="Send email"
                          aria-label={`Email ${s.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#2563EB] hover:bg-[#E8F0FE]"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        <IconButton
                          icon={Trash2}
                          tone="danger"
                          label={`Delete ${s.name}`}
                          onClick={() => {
                            if (window.confirm(`Delete ${s.name}'s registration? This can't be undone.`)) {
                              deleteStudent(s._id);
                              addAudit('Students', 'Deleted student', s.email);
                            }
                          }}
                        />
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#EAEFF6] text-[12.5px] text-[#5B6885] bg-[#FAFBFD]">
          <span>
            Showing <span className="mc-num font-semibold text-[#26355A]">{filtered.length}</span> of {students.length}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 hover:text-[#2563EB]"
            onClick={() =>
              downloadCsv('maxicareer_students_template.csv', EXPORT_HEADERS, [
                ['', 'Ananya Rao', 'ananya@example.com', '+91 98765 43210', 'Bengaluru', 'College Student', 'RV College', 'Wants a data analyst role', 'Step-Next career program', 15999, 'pending', 'Sneha Sen', 'Unassigned', '', 'admin_manual'],
              ])
            }
          >
            <FileDown className="w-3.5 h-3.5" /> Download import template
          </button>
        </div>
      </div>

      <Modal
        open={!!importPreview}
        onClose={() => !importing && setImportPreview(null)}
        title="Import students"
        description={importPreview ? `${importPreview.rows.length} rows found in ${importPreview.fileName}` : ''}
        width="max-w-2xl"
        footer={
          <>
            <Button onClick={() => setImportPreview(null)} disabled={importing}>
              Cancel
            </Button>
            <Button variant="primary" icon={Upload} onClick={runImport} disabled={importing}>
              {importing ? 'Importing…' : `Import ${importPreview?.rows.length || 0} rows`}
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-[#5B6885] mb-3">
          Rows need at least a name and email. Emails that are already registered are skipped, so it's safe to re-import an export.
        </p>
        <div className="border border-[#DDE4EF] rounded-[12px] overflow-auto max-h-[300px]">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Cohort</Th>
                <Th>Program</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF6]">
              {importPreview?.rows.slice(0, 8).map((r, i) => (
                <tr key={i}>
                  <Td>{pick(r, 'name', 'full_name', 'student_name') || <span className="text-[#B42F3B]">missing</span>}</Td>
                  <Td>{pick(r, 'email', 'email_address') || <span className="text-[#B42F3B]">missing</span>}</Td>
                  <Td>{COHORT_LABEL[COHORT_FROM_TEXT(pick(r, 'cohort', 'profession'))]}</Td>
                  <Td>{pick(r, 'plan_name', 'program', 'plan') || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {importPreview && importPreview.rows.length > 8 && <p className="text-[12.5px] text-[#7A869E] mt-2">and {importPreview.rows.length - 8} more…</p>}
      </Modal>
    </div>
  );
};
