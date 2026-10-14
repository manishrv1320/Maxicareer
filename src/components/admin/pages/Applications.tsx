import React, { useMemo, useState } from 'react';
import { Plus, Upload, Download, FileStack, Pencil, Trash2, ExternalLink, LayoutGrid, Rows3, FileDown } from 'lucide-react';
import { useAdmin, Application, ApplicationStage, ApplicationType } from '../context';
import { PageHeader, Panel, Button, IconButton, Badge, Input, Textarea, Select, Field, Segmented, SearchInput, Stat, Th, Td, Avatar, Empty, Modal, Tone, cx } from '../ui';
import { uid, daysUntil, formatDate, downloadCsv, useCsvPicker, pick } from '../lib';

export const STAGES: ApplicationStage[] = ['Draft', 'Submitted', 'Shortlisted', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
const BOARD_STAGES: ApplicationStage[] = ['Draft', 'Submitted', 'Shortlisted', 'Interview', 'Offer'];
const TYPES: ApplicationType[] = ['Job', 'Internship', 'University', 'Scholarship', 'Visa / PSW'];

export const STAGE_TONE: Record<ApplicationStage, Tone> = {
  Draft: 'neutral',
  Submitted: 'blue',
  Shortlisted: 'violet',
  Interview: 'marigold',
  Offer: 'mint',
  Rejected: 'rose',
  Withdrawn: 'neutral',
};

const CSV_HEADERS = ['ID', 'Student', 'Student_Email', 'Type', 'Organisation', 'Role_or_Course', 'Location', 'Stage', 'Applied_On', 'Deadline', 'Owner', 'Link', 'Notes', 'Updated_At'];

const blank = (): Application => ({
  id: '',
  studentName: '',
  studentEmail: '',
  type: 'Job',
  organisation: '',
  role: '',
  location: '',
  stage: 'Draft',
  appliedOn: new Date().toISOString().slice(0, 10),
  deadline: '',
  owner: '',
  link: '',
  notes: '',
  updatedAt: '',
});

export const Applications: React.FC = () => {
  const { applications, setApplications, students, addAudit, notify, toast, mentorOptions } = useAdmin();
  const [view, setView] = useState<'board' | 'table'>('board');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string>('all');
  const [owner, setOwner] = useState<string>('all');
  const [editing, setEditing] = useState<Application | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications
      .filter((a) => (type === 'all' ? true : a.type === type))
      .filter((a) => (owner === 'all' ? true : a.owner === owner))
      .filter((a) => (!q ? true : [a.studentName, a.studentEmail, a.organisation, a.role, a.location].some((v) => v?.toLowerCase().includes(q))))
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [applications, query, type, owner]);

  const dueSoon = applications.filter((a) => {
    const d = daysUntil(a.deadline);
    return d !== null && d >= 0 && d <= 7 && !['Offer', 'Rejected', 'Withdrawn'].includes(a.stage);
  }).length;
  const decided = applications.filter((a) => ['Offer', 'Rejected'].includes(a.stage));
  const successRate = decided.length ? Math.round((applications.filter((a) => a.stage === 'Offer').length / decided.length) * 100) : 0;

  const setStage = (app: Application, stage: ApplicationStage) => {
    if (app.stage === stage) return;
    setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, stage, updatedAt: new Date().toISOString() } : a)));
    addAudit('Applications', 'Moved application', `${app.studentName} → ${app.organisation}: ${app.stage} → ${stage}`);
    if (stage === 'Offer' || stage === 'Interview')
      notify({
        title: stage === 'Offer' ? `Offer for ${app.studentName}` : `Interview for ${app.studentName}`,
        body: `${app.organisation}${app.role ? `, ${app.role}` : ''}`,
        category: 'applications',
        priority: stage === 'Offer' ? 'high' : 'normal',
        link: 'applications',
      });
  };

  const save = () => {
    if (!editing) return;
    const now = new Date().toISOString();
    if (editing.id) {
      const before = applications.find((a) => a.id === editing.id);
      setApplications((prev) => prev.map((a) => (a.id === editing.id ? { ...editing, updatedAt: now } : a)));
      addAudit('Applications', 'Edited application', `${editing.studentName} → ${editing.organisation}`);
      if (before && before.stage !== editing.stage) setStage(before, editing.stage);
    } else {
      const created = { ...editing, id: uid('app'), updatedAt: now };
      setApplications((prev) => [created, ...prev]);
      addAudit('Applications', 'Added application', `${editing.studentName} → ${editing.organisation}`);
    }
    setEditing(null);
  };

  const exportCsv = () => {
    downloadCsv(
      `maxicareer_applications_${new Date().toISOString().slice(0, 10)}.csv`,
      CSV_HEADERS,
      filtered.map((a) => [a.id, a.studentName, a.studentEmail, a.type, a.organisation, a.role, a.location, a.stage, a.appliedOn, a.deadline, a.owner, a.link, a.notes, a.updatedAt])
    );
    addAudit('Applications', 'Exported applications to CSV', `${filtered.length} rows`);
  };

  const importCsv = useCsvPicker((rows, fileName) => {
    const existing = new Set(applications.map((a) => a.id));
    const now = new Date().toISOString();
    const incoming: Application[] = [];
    let skipped = 0;
    rows.forEach((r) => {
      const studentName = pick(r, 'student', 'student_name', 'name');
      const organisation = pick(r, 'organisation', 'organization', 'company', 'university');
      const id = pick(r, 'id');
      if (!studentName || !organisation || (id && existing.has(id))) {
        skipped++;
        return;
      }
      const stage = STAGES.find((s) => s.toLowerCase() === pick(r, 'stage', 'status').toLowerCase()) || 'Submitted';
      const t = TYPES.find((x) => x.toLowerCase() === pick(r, 'type').toLowerCase()) || 'Job';
      const email = pick(r, 'student_email', 'email');
      const match = students.find((s) => s.email.toLowerCase() === email.toLowerCase());
      incoming.push({
        id: id || uid('app'),
        studentId: match?._id,
        studentName,
        studentEmail: email,
        type: t,
        organisation,
        role: pick(r, 'role_or_course', 'role', 'course', 'position'),
        location: pick(r, 'location', 'city', 'country'),
        stage,
        appliedOn: pick(r, 'applied_on', 'applied', 'date'),
        deadline: pick(r, 'deadline', 'due'),
        owner: pick(r, 'owner', 'mentor') || mentorOptions[0] || '',
        link: pick(r, 'link', 'url'),
        notes: pick(r, 'notes'),
        updatedAt: pick(r, 'updated_at') || now,
      });
    });
    setApplications((prev) => [...incoming, ...prev]);
    addAudit('Applications', 'Imported applications from CSV', `${incoming.length} added, ${skipped} skipped (${fileName})`);
    toast(`Imported ${incoming.length} application${incoming.length === 1 ? '' : 's'}${skipped ? `, skipped ${skipped}` : ''}.`);
  });

  const DeadlineChip: React.FC<{ a: Application }> = ({ a }) => {
    const d = daysUntil(a.deadline);
    if (d === null || ['Offer', 'Rejected', 'Withdrawn'].includes(a.stage)) return null;
    if (d < 0) return <Badge tone="rose">Deadline passed</Badge>;
    if (d <= 7) return <Badge tone="marigold">Due in {d === 0 ? 'today' : `${d}d`}</Badge>;
    return <span className="text-[12px] text-[#7A869E]">Due {formatDate(a.deadline)}</span>;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Applications"
        description="Every job, internship, university and scholarship application your students are making, from draft to offer."
        actions={
          <>
            <Button icon={Upload} onClick={importCsv}>
              Import CSV
            </Button>
            <Button icon={Download} onClick={exportCsv} disabled={!filtered.length}>
              Export CSV
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setEditing(blank())}>
              Add application
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="In progress" value={applications.filter((a) => !['Offer', 'Rejected', 'Withdrawn'].includes(a.stage)).length} hint="Draft through interview" />
        <Stat label="Interviews" value={applications.filter((a) => a.stage === 'Interview').length} hint="Students to prep this cycle" />
        <Stat label="Offers" value={applications.filter((a) => a.stage === 'Offer').length} hint={`${successRate}% of decided applications`} />
        <Stat label="Due this week" value={dueSoon} hint="Deadlines in the next 7 days" accent={dueSoon ? <span className="h-2 w-2 rounded-full bg-[#F2A93B]" /> : undefined} />
      </div>

      <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
        <SearchInput value={query} onChange={setQuery} placeholder="Search student, organisation or role" className="flex-1" />
        <Select value={type} onChange={(e) => setType(e.target.value)} className="lg:w-44" aria-label="Type">
          <option value="all">All types</option>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="lg:w-44" aria-label="Owner">
          <option value="all">Any owner</option>
          {mentorOptions.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Select>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'board', label: <><LayoutGrid className="w-3.5 h-3.5" /> Board</> },
            { value: 'table', label: <><Rows3 className="w-3.5 h-3.5" /> Table</> },
          ]}
        />
      </div>

      {applications.length === 0 ? (
        <Panel>
          <Empty
            icon={FileStack}
            title="No applications tracked yet"
            body="Add the first one, or import a CSV from the sheet your team uses today."
            action={
              <div className="flex gap-2 justify-center">
                <Button icon={Upload} onClick={importCsv}>
                  Import CSV
                </Button>
                <Button variant="primary" icon={Plus} onClick={() => setEditing(blank())}>
                  Add application
                </Button>
              </div>
            }
          />
        </Panel>
      ) : view === 'board' ? (
        <div className="relative overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-5 gap-3 min-w-[1000px]">
            {BOARD_STAGES.map((stage) => {
              const col = filtered.filter((a) => a.stage === stage);
              return (
                <div
                  key={stage}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const app = applications.find((a) => a.id === dragId);
                    if (app) setStage(app, stage);
                    setDragId(null);
                  }}
                  className={cx('rounded-[14px] bg-[#E9EEF5]/70 p-2 min-h-[320px]', dragId && 'ring-1 ring-dashed ring-[#B7C3D7]')}
                >
                  <div className="flex items-center justify-between px-2 pt-1 pb-2">
                    <Badge tone={STAGE_TONE[stage]} dot>
                      {stage}
                    </Badge>
                    <span className="mc-num text-[12.5px] text-[#5B6885]">{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.map((a) => (
                      <article
                        key={a.id}
                        draggable
                        onDragStart={() => setDragId(a.id)}
                        onDragEnd={() => setDragId(null)}
                        className="bg-white border border-[#DDE4EF] rounded-[11px] p-3 cursor-grab active:cursor-grabbing hover:border-[#B7C3D7]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold text-[#0D1B3E] truncate">{a.organisation}</div>
                            <div className="text-[12.5px] text-[#5B6885] truncate">{a.role || a.type}</div>
                          </div>
                          <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(a)} className="-mr-1 -mt-1" />
                        </div>
                        <div className="mt-2.5 flex items-center gap-2">
                          <Avatar name={a.studentName} size={22} />
                          <span className="text-[12.5px] text-[#26355A] truncate">{a.studentName}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[11.5px] text-[#7A869E]">{a.type}</span>
                          <DeadlineChip a={a} />
                        </div>
                        <select
                          value={a.stage}
                          onChange={(e) => setStage(a, e.target.value as ApplicationStage)}
                          aria-label="Move to stage"
                          className="mt-2 w-full h-7 rounded-[7px] border border-[#EAEFF6] bg-[#FAFBFD] text-[12px] px-1.5 lg:hidden"
                        >
                          {STAGES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </article>
                    ))}
                    {col.length === 0 && <p className="px-2 py-6 text-center text-[12.5px] text-[#8C97AE]">Drag a card here</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.some((a) => a.stage === 'Rejected' || a.stage === 'Withdrawn') && (
            <p className="mt-3 text-[12.5px] text-[#5B6885]">
              {filtered.filter((a) => a.stage === 'Rejected' || a.stage === 'Withdrawn').length} closed application(s) are hidden from the board. Switch to Table to see them.
            </p>
          )}
        </div>
      ) : (
        <div className="relative bg-white border border-[#DDE4EF] rounded-[14px] overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Organisation</Th>
                <Th>Type</Th>
                <Th>Stage</Th>
                <Th>Deadline</Th>
                <Th>Owner</Th>
                <Th className="text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF6]">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-[#F9FBFE]">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={a.studentName} size={28} />
                      <div className="min-w-0">
                        <div className="font-semibold text-[#0D1B3E] truncate">{a.studentName}</div>
                        <div className="text-[12px] text-[#7A869E] truncate">{a.studentEmail}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="font-medium">{a.organisation}</div>
                    <div className="text-[12px] text-[#7A869E]">{[a.role, a.location].filter(Boolean).join(', ')}</div>
                  </Td>
                  <Td>{a.type}</Td>
                  <Td>
                    <select value={a.stage} onChange={(e) => setStage(a, e.target.value as ApplicationStage)} className="h-8 rounded-[8px] border border-[#D3DBE8] bg-white px-2 text-[12.5px] font-medium" aria-label="Stage">
                      {STAGES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <DeadlineChip a={a} />
                  </Td>
                  <Td className="text-[13px]">{a.owner}</Td>
                  <Td className="text-right whitespace-nowrap">
                    {a.link && (
                      <a href={a.link} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#5B6885] hover:bg-[#EDF1F8]" aria-label="Open link">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(a)} />
                    <IconButton
                      icon={Trash2}
                      tone="danger"
                      label="Delete"
                      onClick={() => {
                        if (!window.confirm('Delete this application?')) return;
                        setApplications((prev) => prev.filter((x) => x.id !== a.id));
                        addAudit('Applications', 'Deleted application', `${a.studentName} → ${a.organisation}`);
                      }}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <Empty title="Nothing matches these filters" />}
        </div>
      )}

      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[#5B6885] hover:text-[#2563EB]"
        onClick={() =>
          downloadCsv('maxicareer_applications_template.csv', CSV_HEADERS, [
            ['', 'Ananya Rao', 'ananya@example.com', 'Job', 'Infosys', 'Data analyst', 'Bengaluru', 'Submitted', '2026-10-01', '2026-10-20', 'Sneha Sen', 'https://careers.infosys.com', 'Referred by alumni', ''],
          ])
        }
      >
        <FileDown className="w-3.5 h-3.5" /> Download import template
      </button>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit application' : 'Add application'}
        width="max-w-2xl"
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!editing?.studentName.trim() || !editing?.organisation.trim()}>
              {editing?.id ? 'Save changes' : 'Add application'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Student" className="sm:col-span-2" hint="Pick a registered student or type a name.">
              <Input
                list="mc-student-list"
                value={editing.studentName}
                onChange={(e) => {
                  const match = students.find((s) => s.name === e.target.value);
                  setEditing({ ...editing, studentName: e.target.value, studentEmail: match?.email || editing.studentEmail, studentId: match?._id || editing.studentId });
                }}
                placeholder="Student name"
              />
              <datalist id="mc-student-list">
                {students.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.email}
                  </option>
                ))}
              </datalist>
            </Field>
            <Field label="Student email">
              <Input type="email" value={editing.studentEmail} onChange={(e) => setEditing({ ...editing, studentEmail: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as ApplicationType })}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label={editing.type === 'University' ? 'University' : 'Organisation'}>
              <Input value={editing.organisation} onChange={(e) => setEditing({ ...editing, organisation: e.target.value })} placeholder={editing.type === 'University' ? 'University of Leeds' : 'Infosys'} />
            </Field>
            <Field label={editing.type === 'University' ? 'Course' : 'Role'}>
              <Input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} placeholder={editing.type === 'University' ? 'MSc Data Science' : 'Associate data analyst'} />
            </Field>
            <Field label="Location">
              <Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="Bengaluru" />
            </Field>
            <Field label="Stage">
              <Select value={editing.stage} onChange={(e) => setEditing({ ...editing, stage: e.target.value as ApplicationStage })}>
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Applied on">
              <Input type="date" value={editing.appliedOn} onChange={(e) => setEditing({ ...editing, appliedOn: e.target.value })} />
            </Field>
            <Field label="Deadline">
              <Input type="date" value={editing.deadline} onChange={(e) => setEditing({ ...editing, deadline: e.target.value })} />
            </Field>
            <Field label="Owner">
              <Select value={editing.owner} onChange={(e) => setEditing({ ...editing, owner: e.target.value })}>
                <option value="">Unassigned</option>
                {mentorOptions.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </Field>
            <Field label="Link to posting">
              <Input type="url" value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} placeholder="https://" />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Referral, documents still needed, interview panel…" />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
};
