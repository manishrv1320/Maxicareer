import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  ExternalLink,
  ClipboardCheck,
  Award,
  Download,
  Copy,
  PartyPopper,
  Video,
  MapPin,
  Users,
  Printer,
} from 'lucide-react';
import { useAdmin } from '../context';
import { PageHeader, Panel, Button, IconButton, Badge, Empty, Segmented, Modal, Field, Input, Select, Textarea, SearchInput, Th, Td, Stat, Toggle, cx, Tone } from '../ui';
import { useSharedCollection, uid, formatDate, downloadCsv, timeAgo, plural } from '../lib';
import type { CurriculumModule, CurriculumLesson, ResourceItem, TestDef, TestQuestion, TestKind, Certificate, PlatformEvent, Cohort, EventAudience } from '../../../types/portal';
import { COHORT_NAMES } from '../../../types/portal';
import type { StudentAssessment } from '../../../types/counselor';
import { DEFAULT_CURRICULUM } from '../../../data/curriculum';
import type { UploadedFile } from '../../../lib/api';
import { FileLink, FilePicker, fmtTime } from '../../workspace/kit';

const COHORTS = Object.keys(COHORT_NAMES) as Cohort[];
const todayIso = () => new Date().toISOString().slice(0, 10);

const CohortSelect: React.FC<{ value: Cohort; onChange: (c: Cohort) => void }> = ({ value, onChange }) => (
  <Select value={value} onChange={(e) => onChange(e.target.value as Cohort)}>
    {COHORTS.map((c) => (
      <option key={c} value={c}>
        {COHORT_NAMES[c]}
      </option>
    ))}
  </Select>
);

const StatusToggle: React.FC<{ value: 'Published' | 'Draft'; onChange: (v: 'Published' | 'Draft') => void }> = ({ value, onChange }) => (
  <Select value={value} onChange={(e) => onChange(e.target.value as 'Published' | 'Draft')}>
    <option value="Published">Published (students see it)</option>
    <option value="Draft">Draft (hidden)</option>
  </Select>
);

/* ================================================================== */
/* Curriculum & resources                                              */
/* ================================================================== */

type ModuleDraft = Omit<CurriculumModule, 'lessons'> & { lessons: CurriculumLesson[] };

const newModule = (order: number, by: string): ModuleDraft => ({
  id: '',
  scope: 'cohort',
  cohort: 'all',
  title: '',
  description: '',
  weeks: '',
  order,
  lessons: [{ id: uid('lesson'), title: '', duration: '', type: 'Lesson' }],
  status: 'Draft',
  createdBy: 'admin',
  createdByName: by,
  createdAt: new Date().toISOString(),
});

const ModuleEditor: React.FC<{ draft: ModuleDraft | null; onClose: () => void; onSave: (m: CurriculumModule) => void }> = ({ draft, onClose, onSave }) => {
  const [m, setM] = useState<ModuleDraft | null>(draft);
  React.useEffect(() => setM(draft), [draft]);
  if (!m) return <Modal open={false} onClose={onClose} title="" children={null} />;
  const patchLesson = (id: string, p: Partial<CurriculumLesson>) => setM({ ...m, lessons: m.lessons.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  const moveLesson = (i: number, d: -1 | 1) => {
    const next = [...m.lessons];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setM({ ...m, lessons: next });
  };
  const valid = m.title.trim() && m.lessons.some((l) => l.title.trim());
  return (
    <Modal
      open={!!draft}
      onClose={onClose}
      title={m.id ? 'Edit module' : 'Add module'}
      description="Lessons students tick off as they go. Their progress is the share of lessons done."
      width="max-w-3xl"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => onSave({ ...m, title: m.title.trim(), lessons: m.lessons.filter((l) => l.title.trim()).map((l) => ({ ...l, title: l.title.trim(), url: l.url?.trim() || undefined })) })}
          >
            Save module
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-4">
          <Field label="Title">
            <Input value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} placeholder="Portfolio projects & real deliverables" />
          </Field>
          <Field label="When" hint="Optional">
            <Input value={m.weeks || ''} onChange={(e) => setM({ ...m, weeks: e.target.value })} placeholder="Weeks 5–8" />
          </Field>
        </div>
        <Field label="Description">
          <Textarea rows={2} value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Who sees it">
            <CohortSelect value={m.cohort} onChange={(cohort) => setM({ ...m, cohort })} />
          </Field>
          <Field label="Status">
            <StatusToggle value={m.status} onChange={(status) => setM({ ...m, status })} />
          </Field>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-[#26355A]">Lessons ({m.lessons.length})</span>
            <Button size="sm" icon={Plus} onClick={() => setM({ ...m, lessons: [...m.lessons, { id: uid('lesson'), title: '', duration: '', type: 'Lesson' }] })}>
              Add lesson
            </Button>
          </div>
          <div className="space-y-2">
            {m.lessons.map((l, i) => (
              <div key={l.id} className="rounded-[12px] border border-[#DDE4EF] p-3 grid grid-cols-1 sm:grid-cols-[1fr_110px_130px_auto] gap-2 items-start">
                <Input value={l.title} onChange={(e) => patchLesson(l.id, { title: e.target.value })} placeholder={`Lesson ${i + 1}`} aria-label={`Lesson ${i + 1} title`} />
                <Input value={l.duration} onChange={(e) => patchLesson(l.id, { duration: e.target.value })} placeholder="45 mins" aria-label="Duration" />
                <Select value={l.type} onChange={(e) => patchLesson(l.id, { type: e.target.value })} aria-label="Type">
                  {Array.from(new Set(['Lesson', 'Video', 'Reading', 'Assessment', 'Blueprint', '1:1 Review', 'Hands-on', 'Masterclass', 'Interactive', l.type])).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
                <div className="flex">
                  <IconButton icon={ArrowUp} label="Move up" onClick={() => moveLesson(i, -1)} />
                  <IconButton icon={ArrowDown} label="Move down" onClick={() => moveLesson(i, 1)} />
                  <IconButton icon={Trash2} tone="danger" label="Remove lesson" onClick={() => setM({ ...m, lessons: m.lessons.filter((x) => x.id !== l.id) })} />
                </div>
                <Input className="sm:col-span-3" value={l.url || ''} onChange={(e) => patchLesson(l.id, { url: e.target.value })} placeholder="Link to material (optional)" aria-label="Link" />
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-[#7A869E]">Keep a lesson's place when you rename it: progress is saved per lesson, so deleting a lesson removes it from everyone's progress.</p>
        </div>
      </div>
    </Modal>
  );
};

const RESOURCE_KINDS: ResourceItem['kind'][] = ['Guide', 'Template', 'Video', 'Link', 'Worksheet'];

const ResourceEditor: React.FC<{ draft: ResourceItem | null; onClose: () => void; onSave: (r: ResourceItem) => void }> = ({ draft, onClose, onSave }) => {
  const [r, setR] = useState<ResourceItem | null>(draft);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [err, setErr] = useState('');
  React.useEffect(() => {
    setR(draft);
    setFile(null);
    setErr('');
  }, [draft]);
  if (!r) return <Modal open={false} onClose={onClose} title="" children={null} />;
  const hasFile = !!(file || r.fileId);
  return (
    <Modal
      open={!!draft}
      onClose={onClose}
      title={r.id ? 'Edit resource' : 'Add resource'}
      description="Templates, guides and videos in every learner's Resources page."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!r.title.trim() || (!r.url?.trim() && !hasFile)}
            onClick={() => onSave({ ...r, title: r.title.trim(), url: r.url?.trim() || undefined, ...(file ? { fileId: file.id, fileName: file.name } : {}) })}
          >
            Save resource
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {err && <p className="sm:col-span-2 text-[13px] text-[#B42F3B]">{err}</p>}
        <Field label="Title" className="sm:col-span-2">
          <Input value={r.title} onChange={(e) => setR({ ...r, title: e.target.value })} placeholder="ATS-friendly resume template" />
        </Field>
        <Field label="Type">
          <Select value={r.kind} onChange={(e) => setR({ ...r, kind: e.target.value as ResourceItem['kind'] })}>
            {RESOURCE_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </Field>
        <Field label="Who sees it">
          <CohortSelect value={r.cohort} onChange={(cohort) => setR({ ...r, cohort })} />
        </Field>
        <Field label="Link" className="sm:col-span-2">
          <Input value={r.url || ''} onChange={(e) => setR({ ...r, url: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label={r.fileId && !file ? `File: ${r.fileName || 'uploaded'}` : 'Or upload a file'} hint="Visible to every signed-in learner." className="sm:col-span-2">
          <FilePicker value={file} onChange={setFile} category="resource" onError={setErr} label={r.fileId ? 'Replace file' : 'Upload a file'} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea rows={2} value={r.description} onChange={(e) => setR({ ...r, description: e.target.value })} />
        </Field>
        <Field label="Status" className="sm:col-span-2">
          <StatusToggle value={r.status} onChange={(status) => setR({ ...r, status })} />
        </Field>
      </div>
    </Modal>
  );
};

export const Curriculum: React.FC = () => {
  const { session, addAudit, toast, students } = useAdmin();
  const [modules, setModules] = useSharedCollection<CurriculumModule>('curricula', DEFAULT_CURRICULUM);
  const [resources, setResources] = useSharedCollection<ResourceItem>('resources', []);
  const [tab, setTab] = useState<'modules' | 'personal' | 'resources'>('modules');
  const [cohort, setCohort] = useState<Cohort | 'every'>('every');
  const [editing, setEditing] = useState<ModuleDraft | null>(null);
  const [editingRes, setEditingRes] = useState<ResourceItem | null>(null);
  const [q, setQ] = useState('');

  const cohortModules = modules.filter((m) => m.scope !== 'student').sort((a, b) => a.order - b.order);
  const personal = modules.filter((m) => m.scope === 'student');
  const shown = cohortModules.filter((m) => cohort === 'every' || m.cohort === cohort);
  const libraryResources = resources.filter((r) => r.scope !== 'student');
  const sharedResources = resources.filter((r) => r.scope === 'student');
  const resShown = libraryResources.filter((r) => (cohort === 'every' || r.cohort === cohort) && (!q || `${r.title} ${r.description}`.toLowerCase().includes(q.toLowerCase())));
  const studentName = (id?: string) => students.find((s) => s._id === id)?.name || 'a student';

  const saveModule = (m: CurriculumModule) => {
    if (m.id) {
      setModules((prev) => prev.map((x) => (x.id === m.id ? m : x)));
      addAudit('Curriculum', 'Edited module', m.title);
    } else {
      setModules((prev) => [...prev, { ...m, id: uid('mod') }]);
      addAudit('Curriculum', 'Added module', `${m.title} (${COHORT_NAMES[m.cohort]})`);
    }
    toast(m.status === 'Published' ? 'Module saved and visible to students.' : 'Module saved as a draft.');
    setEditing(null);
  };

  const move = (m: CurriculumModule, d: -1 | 1) => {
    const list = shown;
    const i = list.findIndex((x) => x.id === m.id);
    const other = list[i + d];
    if (!other) return;
    setModules((prev) => prev.map((x) => (x.id === m.id ? { ...x, order: other.order } : x.id === other.id ? { ...x, order: m.order } : x)));
  };

  const saveResource = (r: ResourceItem) => {
    if (r.id) {
      setResources((prev) => prev.map((x) => (x.id === r.id ? r : x)));
      addAudit('Curriculum', 'Edited resource', r.title);
    } else {
      setResources((prev) => [{ ...r, id: uid('res') }, ...prev]);
      addAudit('Curriculum', 'Added resource', r.title);
    }
    toast('Resource saved.');
    setEditingRes(null);
  };

  const lessonCount = shown.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Curriculum & resources"
        description="The course syllabus and resource library students see in their portal. Mentors and counsellors can add personal modules for their own students."
        actions={
          tab === 'resources' ? (
            <Button variant="primary" icon={Plus} onClick={() => setEditingRes({ id: '', scope: 'cohort', cohort: 'all', title: '', description: '', kind: 'Guide', sharedBy: 'admin', sharedByName: session.name || 'Maxicareer team', status: 'Published', createdAt: new Date().toISOString() })}>
              Add resource
            </Button>
          ) : (
            <Button variant="primary" icon={Plus} onClick={() => setEditing(newModule(Math.max(0, ...cohortModules.map((m) => m.order)) + 1, session.name || 'Maxicareer team'))}>
              Add module
            </Button>
          )
        }
      />
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'modules', label: 'Syllabus modules', count: cohortModules.length },
            { value: 'personal', label: 'From mentors', count: personal.length + sharedResources.length },
            { value: 'resources', label: 'Resource library', count: libraryResources.length },
          ]}
        />
        {tab !== 'personal' && (
          <Select value={cohort} onChange={(e) => setCohort(e.target.value as Cohort | 'every')} className="lg:w-56" aria-label="Cohort">
            <option value="every">Every cohort</option>
            {COHORTS.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'Shared with all learners' : COHORT_NAMES[c]}
              </option>
            ))}
          </Select>
        )}
        {tab === 'resources' && <SearchInput value={q} onChange={setQ} placeholder="Search resources" className="lg:ml-auto lg:w-64" />}
      </div>

      {tab === 'modules' && (
        <>
          <p className="text-[13px] text-[#5B6885]">
            {shown.length} module{shown.length === 1 ? '' : 's'} · {plural(lessonCount, 'lesson')}. Modules for "All learners" appear for everyone; cohort modules only for that cohort.
          </p>
          <div className="space-y-3">
            {shown.length === 0 && (
              <Panel>
                <Empty icon={BookOpen} title="No modules here" action={<Button onClick={() => setEditing(newModule(Math.max(0, ...cohortModules.map((m) => m.order)) + 1, session.name))}>Add module</Button>} />
              </Panel>
            )}
            {shown.map((m, i) => (
              <section key={m.id} className="bg-white border border-[#DDE4EF] rounded-[14px] p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <span className="mc-display mc-num h-10 w-10 shrink-0 rounded-[10px] bg-[#0D1B3E] text-white flex items-center justify-center text-[15px] font-semibold">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="mc-display text-[17px] font-semibold text-[#0D1B3E]">{m.title}</h3>
                      <Badge tone={m.status === 'Published' ? 'mint' : 'marigold'} dot>
                        {m.status === 'Published' ? 'Live' : 'Draft'}
                      </Badge>
                      <Badge tone="blue">{COHORT_NAMES[m.cohort]}</Badge>
                      {m.weeks && <span className="text-[12.5px] text-[#7A869E]">{m.weeks}</span>}
                    </div>
                    {m.description && <p className="text-[13.5px] text-[#5B6885] mt-1">{m.description}</p>}
                    <ol className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                      {m.lessons.map((l, li) => (
                        <li key={l.id} className="flex items-center gap-2 text-[13px] text-[#26355A] min-w-0">
                          <span className="mc-num text-[#9AA5BB] w-5">{li + 1}.</span>
                          <span className="truncate">{l.title}</span>
                          <span className="ml-auto shrink-0 text-[12px] text-[#7A869E]">
                            {l.type}
                            {l.duration ? ` · ${l.duration}` : ''}
                          </span>
                          {l.url && (
                            <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[#2563EB]" aria-label="Open material">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="flex md:flex-col items-center gap-0.5 shrink-0">
                    <IconButton icon={ArrowUp} label="Move up" onClick={() => move(m, -1)} disabled={i === 0} />
                    <IconButton icon={ArrowDown} label="Move down" onClick={() => move(m, 1)} disabled={i === shown.length - 1} />
                    <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(m)} />
                    <IconButton
                      icon={Trash2}
                      tone="danger"
                      label="Delete"
                      onClick={() => {
                        if (!window.confirm(`Delete "${m.title}"? Students lose it from their syllabus.`)) return;
                        setModules((prev) => prev.filter((x) => x.id !== m.id));
                        addAudit('Curriculum', 'Deleted module', m.title);
                      }}
                    />
                  </div>
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {tab === 'personal' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          <Panel title="Personal modules" description="Added by mentors and counsellors for one student." flush>
            {personal.length === 0 ? (
              <Empty title="None yet" />
            ) : (
              <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
                {personal.map((m) => (
                  <li key={m.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold">{m.title}</div>
                      <div className="text-[12.5px] text-[#5B6885]">
                        For {m.studentName || studentName(m.studentId)} · by {m.createdByName} · {plural(m.lessons.length, 'lesson')}
                      </div>
                    </div>
                    <IconButton
                      icon={Trash2}
                      tone="danger"
                      label="Remove"
                      onClick={() => {
                        if (!window.confirm(`Remove "${m.title}"?`)) return;
                        setModules((prev) => prev.filter((x) => x.id !== m.id));
                        addAudit('Curriculum', 'Removed personal module', m.title);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Shared resources" description="Files and links mentors shared with one student." flush>
            {sharedResources.length === 0 ? (
              <Empty title="None yet" />
            ) : (
              <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
                {sharedResources.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold">
                        <Badge>{r.kind}</Badge> {r.title}
                      </div>
                      <div className="text-[12.5px] text-[#5B6885]">
                        For {studentName(r.studentId)} · by {r.sharedByName} · {timeAgo(r.createdAt)}
                      </div>
                    </div>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] p-2" aria-label="Open">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {tab === 'resources' && (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {resShown.length === 0 && <Empty icon={FolderOpen} title="No resources yet" body="Add ATS templates, interview guides, videos or worksheets for learners to use any time." />}
          {resShown.map((r) => (
            <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="violet">{r.kind}</Badge>
                  <span className="text-[14.5px] font-semibold">{r.title}</span>
                  <Badge tone={r.status === 'Published' ? 'mint' : 'marigold'} dot>
                    {r.status === 'Published' ? 'Live' : 'Draft'}
                  </Badge>
                  <Badge tone="blue">{COHORT_NAMES[r.cohort]}</Badge>
                </div>
                {r.description && <p className="text-[13px] text-[#5B6885] mt-0.5">{r.description}</p>}
                <div className="mt-1 flex flex-wrap gap-3">
                  {r.fileId && <FileLink fileId={r.fileId} name={r.fileName} />}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563EB] hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" /> Link
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <IconButton icon={Pencil} label="Edit" onClick={() => setEditingRes(r)} />
                <IconButton
                  icon={Trash2}
                  tone="danger"
                  label="Delete"
                  onClick={() => {
                    if (!window.confirm(`Delete "${r.title}"?`)) return;
                    setResources((prev) => prev.filter((x) => x.id !== r.id));
                    addAudit('Curriculum', 'Deleted resource', r.title);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ModuleEditor draft={editing} onClose={() => setEditing(null)} onSave={saveModule} />
      <ResourceEditor draft={editingRes} onClose={() => setEditingRes(null)} onSave={saveResource} />
    </div>
  );
};

/* ================================================================== */
/* Assessments: tests, results and certificates                        */
/* ================================================================== */

const TEST_KINDS: TestKind[] = ['Aptitude', 'Skill test', 'Mock test', 'Quiz', 'Psychometric'];

type Result = StudentAssessment & { studentName?: string };

const blankQuestion = (): TestQuestion => ({ id: uid('q'), prompt: '', options: ['', '', '', ''], answer: 0 });

const blankTest = (): TestDef => ({
  id: '',
  title: '',
  description: '',
  kind: 'Quiz',
  cohort: 'all',
  durationMins: 20,
  passPercent: 60,
  attemptsAllowed: 1,
  dueDate: '',
  questions: [blankQuestion()],
  status: 'Draft',
  createdAt: new Date().toISOString(),
});

const TestEditor: React.FC<{ draft: TestDef | null; onClose: () => void; onSave: (t: TestDef) => void }> = ({ draft, onClose, onSave }) => {
  const [t, setT] = useState<TestDef | null>(draft);
  React.useEffect(() => setT(draft), [draft]);
  if (!t) return <Modal open={false} onClose={onClose} title="" children={null} />;
  const patchQ = (id: string, p: Partial<TestQuestion>) => setT({ ...t, questions: t.questions.map((q) => (q.id === id ? { ...q, ...p } : q)) });
  const problems: string[] = [];
  if (!t.title.trim()) problems.push('Add a title.');
  t.questions.forEach((q, i) => {
    const opts = q.options.filter((o) => o.trim());
    if (!q.prompt.trim()) problems.push(`Question ${i + 1} needs a prompt.`);
    if (opts.length < 2) problems.push(`Question ${i + 1} needs at least two options.`);
    if (!q.options[q.answer ?? -1]?.trim()) problems.push(`Question ${i + 1}: mark the right answer.`);
  });

  const save = () => {
    // Drop empty options and keep the answer pointing at the same text.
    const questions = t.questions.map((q) => {
      const kept = q.options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o);
      return { id: q.id, prompt: q.prompt.trim(), options: kept.map((x) => x.o), answer: Math.max(0, kept.findIndex((x) => x.i === q.answer)) };
    });
    onSave({ ...t, title: t.title.trim(), questions });
  };

  return (
    <Modal
      open={!!draft}
      onClose={onClose}
      title={t.id ? 'Edit test' : 'New test'}
      description="Multiple-choice tests are marked automatically. Students never see the answer key."
      width="max-w-3xl"
      footer={
        <>
          <span className="mr-auto self-center text-[12.5px] text-[#B42F3B]">{problems[0] || ''}</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={problems.length > 0} onClick={save}>
            Save test
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4">
          <Field label="Title">
            <Input value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="Placement readiness check" />
          </Field>
          <Field label="Type">
            <Select value={t.kind} onChange={(e) => setT({ ...t, kind: e.target.value as TestKind })}>
              {TEST_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Instructions">
          <Textarea rows={2} value={t.description} onChange={(e) => setT({ ...t, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Minutes">
            <Input type="number" min={1} max={300} value={t.durationMins} onChange={(e) => setT({ ...t, durationMins: Math.max(1, Number(e.target.value) || 1) })} />
          </Field>
          <Field label="Pass mark %">
            <Input type="number" min={0} max={100} value={t.passPercent} onChange={(e) => setT({ ...t, passPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
          </Field>
          <Field label="Attempts">
            <Input type="number" min={1} max={10} value={t.attemptsAllowed} onChange={(e) => setT({ ...t, attemptsAllowed: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })} />
          </Field>
          <Field label="Due date" hint="Optional">
            <Input type="date" value={t.dueDate || ''} onChange={(e) => setT({ ...t, dueDate: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Who takes it">
            <CohortSelect value={t.cohort} onChange={(cohort) => setT({ ...t, cohort })} />
          </Field>
          <Field label="Status">
            <StatusToggle value={t.status} onChange={(status) => setT({ ...t, status })} />
          </Field>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-[#26355A]">Questions ({t.questions.length})</span>
            <Button size="sm" icon={Plus} onClick={() => setT({ ...t, questions: [...t.questions, blankQuestion()] })}>
              Add question
            </Button>
          </div>
          <div className="space-y-3">
            {t.questions.map((q, qi) => (
              <div key={q.id} className="rounded-[12px] border border-[#DDE4EF] p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mc-num text-[13px] font-semibold text-[#5B6885] pt-2.5 w-6">{qi + 1}.</span>
                  <Textarea rows={2} value={q.prompt} onChange={(e) => patchQ(q.id, { prompt: e.target.value })} placeholder="Question" aria-label={`Question ${qi + 1}`} />
                  <IconButton icon={Trash2} tone="danger" label="Remove question" onClick={() => setT({ ...t, questions: t.questions.filter((x) => x.id !== q.id) })} disabled={t.questions.length === 1} />
                </div>
                <div className="pl-8 space-y-1.5">
                  {q.options.map((o, oi) => (
                    <label key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`ans-${q.id}`} checked={q.answer === oi} onChange={() => patchQ(q.id, { answer: oi })} className="h-4 w-4 accent-[#0F9F6E]" aria-label={`Option ${oi + 1} is correct`} />
                      <Input
                        value={o}
                        onChange={(e) => patchQ(q.id, { options: q.options.map((x, i) => (i === oi ? e.target.value : x)) })}
                        placeholder={`Option ${oi + 1}`}
                        className={cx('h-9', q.answer === oi && 'border-[#0F9F6E]')}
                      />
                      {q.options.length > 2 && (
                        <IconButton
                          icon={Trash2}
                          label="Remove option"
                          onClick={() => patchQ(q.id, { options: q.options.filter((_, i) => i !== oi), answer: (q.answer ?? 0) > oi ? (q.answer ?? 0) - 1 : q.answer === oi ? 0 : q.answer })}
                        />
                      )}
                    </label>
                  ))}
                  {q.options.length < 6 && (
                    <button type="button" onClick={() => patchQ(q.id, { options: [...q.options, ''] })} className="text-[12.5px] font-semibold text-[#2563EB] hover:underline">
                      + Add option
                    </button>
                  )}
                  <p className="text-[12px] text-[#7A869E]">Select the circle next to the right answer.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export function printCertificateHtml(c: Certificate) {
  const w = window.open('', '_blank', 'width=1100,height=780');
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(c.title)} — ${esc(c.studentName)}</title>
<style>@page{size:A4 landscape;margin:0}body{margin:0;font-family:Georgia,serif;color:#0D1B3E}.c{box-sizing:border-box;width:297mm;height:210mm;padding:22mm;border:10px solid #0D1B3E;outline:2px solid #38BDF8;outline-offset:-18px;display:flex;flex-direction:column;justify-content:center;text-align:center}
h1{font-size:40px;margin:0 0 6px;letter-spacing:1px}.k{font-family:Arial,sans-serif;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#2563EB}.n{font-size:34px;margin:18px 0 6px;border-bottom:1px solid #C4CEDD;display:inline-block;padding:0 30px 6px}
p{font-size:16px;line-height:1.6;margin:8px auto;max-width:680px}.f{display:flex;justify-content:space-between;margin-top:34px;font-family:Arial,sans-serif;font-size:12px;color:#5B6885}</style></head>
<body><div class="c"><div class="k">Maxicareer</div><h1>${esc(c.title)}</h1><p>This certifies that</p><div class="n">${esc(c.studentName)}</div>
<p>has successfully completed <strong>${esc(c.program)}</strong>${c.description ? `<br>${esc(c.description)}` : ''}</p>
<div class="f"><span>Issued ${esc(new Date(c.issuedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}</span><span>${esc(c.issuedBy)}</span><span>No. ${esc(c.certificateNo)}</span></div></div>
<script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}

const CertificateModal: React.FC<{ open: boolean; preset?: Partial<Certificate>; onClose: () => void; onIssue: (c: Certificate) => void }> = ({ open, preset, onClose, onIssue }) => {
  const { students, session } = useAdmin();
  const blank = (): Certificate => ({
    id: '',
    studentId: '',
    studentName: '',
    title: 'Certificate of Completion',
    program: '',
    description: '',
    issuedOn: todayIso(),
    certificateNo: `MC-CERT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    issuedBy: session.name || 'Maxicareer',
    createdAt: new Date().toISOString(),
  });
  const [c, setC] = useState<Certificate>(blank);
  React.useEffect(() => {
    if (open) setC({ ...blank(), ...preset });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Issue a certificate"
      description="The student is notified and can download it from Milestones & certificates."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={Award} disabled={!c.studentId || !c.title.trim() || !c.program.trim()} onClick={() => onIssue({ ...c, id: uid('cert'), title: c.title.trim(), program: c.program.trim() })}>
            Issue certificate
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Student" className="sm:col-span-2">
          <Select
            value={c.studentId}
            onChange={(e) => {
              const s = students.find((x) => x._id === e.target.value);
              setC({ ...c, studentId: e.target.value, studentName: s?.name || '', program: c.program || s?.planName || '' });
            }}
          >
            <option value="">Choose a student</option>
            {sorted.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} · {s.email}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Certificate title" className="sm:col-span-2">
          <Input value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} />
        </Field>
        <Field label="Program or achievement" className="sm:col-span-2">
          <Input value={c.program} onChange={(e) => setC({ ...c, program: e.target.value })} placeholder="Step-Next career program" />
        </Field>
        <Field label="Issued on">
          <Input type="date" value={c.issuedOn} onChange={(e) => setC({ ...c, issuedOn: e.target.value })} />
        </Field>
        <Field label="Certificate number">
          <Input value={c.certificateNo} onChange={(e) => setC({ ...c, certificateNo: e.target.value })} />
        </Field>
        <Field label="Signed by" className="sm:col-span-2">
          <Input value={c.issuedBy} onChange={(e) => setC({ ...c, issuedBy: e.target.value })} />
        </Field>
        <Field label="Line under the program (optional)" className="sm:col-span-2">
          <Input value={c.description || ''} onChange={(e) => setC({ ...c, description: e.target.value })} placeholder="with distinction" />
        </Field>
      </div>
    </Modal>
  );
};

export const Assessments: React.FC = () => {
  const { addAudit, toast } = useAdmin();
  const [tests, setTests] = useSharedCollection<TestDef>('tests', [], { refreshMs: 60_000 });
  const [results, setResults] = useSharedCollection<Result>('results', [], { refreshMs: 60_000 });
  const [certs, setCerts] = useSharedCollection<Certificate>('certificates', []);
  const [tab, setTab] = useState<'tests' | 'results' | 'certificates'>('tests');
  const [editing, setEditing] = useState<TestDef | null>(null);
  const [testFilter, setTestFilter] = useState('all');
  const [certOpen, setCertOpen] = useState<Partial<Certificate> | null>(null);
  const [q, setQ] = useState('');

  const online = results.filter((r) => r.testId);
  const attemptsFor = (id: string) => online.filter((r) => r.testId === id);
  const resultsShown = online
    .filter((r) => (testFilter === 'all' || r.testId === testFilter) && (!q || `${r.studentName} ${r.assessmentName}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  const avg = online.length ? Math.round(online.reduce((s, r) => s + (r.scorePercent || 0), 0) / online.length) : null;
  const passRate = online.length ? Math.round((online.filter((r) => r.passed).length / online.length) * 100) : null;

  const saveTest = (t: TestDef) => {
    if (t.id) {
      setTests((prev) => prev.map((x) => (x.id === t.id ? t : x)));
      addAudit('Assessments', 'Edited test', t.title);
    } else {
      setTests((prev) => [{ ...t, id: uid('test'), createdAt: new Date().toISOString() }, ...prev]);
      addAudit('Assessments', 'Created test', t.title);
    }
    toast(t.status === 'Published' ? 'Test published. Students see it under Courses & tests.' : 'Test saved as a draft.');
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assessments"
        description="Build tests students take in their portal, review results, and issue certificates."
        actions={
          tab === 'certificates' ? (
            <Button variant="primary" icon={Award} onClick={() => setCertOpen({})}>
              Issue certificate
            </Button>
          ) : (
            <Button variant="primary" icon={Plus} onClick={() => setEditing(blankTest())}>
              New test
            </Button>
          )
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Live tests" value={tests.filter((t) => t.status === 'Published').length} hint={`${tests.length} in total`} />
        <Stat label="Attempts" value={online.length} />
        <Stat label="Average score" value={avg === null ? '—' : `${avg}%`} hint={passRate === null ? undefined : `${passRate}% passed`} />
        <Stat label="Certificates issued" value={certs.length} />
      </div>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'tests', label: 'Tests', count: tests.length },
          { value: 'results', label: 'Results', count: online.length },
          { value: 'certificates', label: 'Certificates', count: certs.length },
        ]}
      />

      {tab === 'tests' && (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {tests.length === 0 && <Empty icon={ClipboardCheck} title="No tests yet" body="Create aptitude checks, quizzes or mock tests. They're marked automatically." action={<Button onClick={() => setEditing(blankTest())}>New test</Button>} />}
          {tests.map((t) => {
            const attempts = attemptsFor(t.id);
            const tAvg = attempts.length ? Math.round(attempts.reduce((s, r) => s + (r.scorePercent || 0), 0) / attempts.length) : null;
            return (
              <div key={t.id} className="flex flex-col lg:flex-row lg:items-center gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold">{t.title}</span>
                    <Badge tone={t.status === 'Published' ? 'mint' : 'marigold'} dot>
                      {t.status === 'Published' ? 'Live' : 'Draft'}
                    </Badge>
                    <Badge tone="violet">{t.kind}</Badge>
                    <Badge tone="blue">{COHORT_NAMES[t.cohort]}</Badge>
                  </div>
                  <div className="text-[12.5px] text-[#5B6885] mt-0.5">
                    {t.questions.length} questions · {t.durationMins} min · pass {t.passPercent}% · {t.attemptsAllowed} attempt{t.attemptsAllowed > 1 ? 's' : ''}
                    {t.dueDate ? ` · due ${formatDate(t.dueDate)}` : ''}
                  </div>
                </div>
                <div className="text-[13px] text-[#5B6885] lg:w-40 shrink-0">
                  {attempts.length} attempt{attempts.length === 1 ? '' : 's'}
                  {tAvg !== null && <span> · avg {tAvg}%</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => {
                      setTests((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: x.status === 'Published' ? 'Draft' : 'Published' } : x)));
                      addAudit('Assessments', t.status === 'Published' ? 'Unpublished test' : 'Published test', t.title);
                    }}
                  >
                    {t.status === 'Published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={!attempts.length} onClick={() => { setTestFilter(t.id); setTab('results'); }}>
                    Results
                  </Button>
                  <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(t)} />
                  <IconButton icon={Copy} label="Duplicate" onClick={() => setEditing({ ...t, id: '', title: `${t.title} (copy)`, status: 'Draft', questions: t.questions.map((q) => ({ ...q, id: uid('q') })) })} />
                  <IconButton
                    icon={Trash2}
                    tone="danger"
                    label="Delete"
                    onClick={() => {
                      if (!window.confirm(`Delete "${t.title}"? Results already submitted are kept.`)) return;
                      setTests((prev) => prev.filter((x) => x.id !== t.id));
                      addAudit('Assessments', 'Deleted test', t.title);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'results' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={testFilter} onChange={(e) => setTestFilter(e.target.value)} className="sm:w-72" aria-label="Test">
              <option value="all">All tests</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
            <SearchInput value={q} onChange={setQ} placeholder="Search by student" className="sm:w-64" />
            <Button
              className="sm:ml-auto"
              icon={Download}
              disabled={!resultsShown.length}
              onClick={() =>
                downloadCsv(
                  `maxicareer_test_results_${todayIso()}.csv`,
                  ['Student', 'Test', 'Score %', 'Correct', 'Questions', 'Passed', 'Attempt', 'Submitted'],
                  resultsShown.map((r) => [r.studentName || r.studentId, r.assessmentName, r.scorePercent ?? '', r.correct ?? '', r.total ?? '', r.passed ? 'Yes' : 'No', r.attempt ?? '', r.submittedAt || r.completionDate])
                )
              }
            >
              Export
            </Button>
          </div>
          <Panel flush>
            {resultsShown.length === 0 ? (
              <Empty icon={ClipboardCheck} title="No results yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr>
                      <Th>Student</Th>
                      <Th>Test</Th>
                      <Th className="text-right">Score</Th>
                      <Th>Result</Th>
                      <Th>Submitted</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEFF6]">
                    {resultsShown.map((r) => (
                      <tr key={r.id}>
                        <Td className="font-semibold">{r.studentName || r.studentId}</Td>
                        <Td>
                          {r.assessmentName}
                          {r.attempt ? <span className="text-[12px] text-[#7A869E]"> · attempt {r.attempt}</span> : null}
                        </Td>
                        <Td className="mc-num text-right font-semibold">
                          {r.scorePercent ?? '—'}%{r.total ? <span className="text-[12px] font-normal text-[#7A869E]"> ({r.correct}/{r.total})</span> : null}
                        </Td>
                        <Td>
                          <Badge tone={r.passed ? 'mint' : 'rose'} dot>
                            {r.passed ? 'Passed' : 'Below pass mark'}
                          </Badge>
                        </Td>
                        <Td className="text-[12.5px]">{r.submittedAt ? timeAgo(r.submittedAt) : r.completionDate}</Td>
                        <Td className="text-right whitespace-nowrap">
                          {r.passed && (
                            <Button size="sm" variant="ghost" icon={Award} onClick={() => setCertOpen({ studentId: r.studentId, studentName: r.studentName || '', title: 'Certificate of Achievement', program: r.assessmentName, description: `Scored ${r.scorePercent}%` })}>
                              Certificate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (!window.confirm(`Delete this result so ${r.studentName || 'the student'} can take "${r.assessmentName}" again?`)) return;
                              setResults((prev) => prev.filter((x) => x.id !== r.id));
                              addAudit('Assessments', 'Reset test attempt', `${r.studentName}: ${r.assessmentName}`);
                            }}
                          >
                            Allow retake
                          </Button>
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

      {tab === 'certificates' && (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {certs.length === 0 && <Empty icon={Award} title="No certificates issued" body="Issue a certificate when a student completes their program or passes a test." />}
          {certs.map((c) => (
            <div key={c.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4">
              <span className="h-10 w-10 shrink-0 rounded-[10px] bg-[#FDF1DC] text-[#94570A] flex items-center justify-center">
                <Award className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-semibold">
                  {c.studentName} · {c.title}
                </div>
                <div className="text-[12.5px] text-[#5B6885]">
                  {c.program} · {formatDate(c.issuedOn)} · <span className="mc-num">{c.certificateNo}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" icon={Printer} onClick={() => printCertificateHtml(c)}>
                  View / print
                </Button>
                <IconButton
                  icon={Trash2}
                  tone="danger"
                  label="Revoke"
                  onClick={() => {
                    if (!window.confirm(`Revoke ${c.studentName}'s "${c.title}"?`)) return;
                    setCerts((prev) => prev.filter((x) => x.id !== c.id));
                    addAudit('Assessments', 'Revoked certificate', `${c.studentName}: ${c.certificateNo}`);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <TestEditor draft={editing} onClose={() => setEditing(null)} onSave={saveTest} />
      <CertificateModal
        open={certOpen !== null}
        preset={certOpen || undefined}
        onClose={() => setCertOpen(null)}
        onIssue={(c) => {
          setCerts((prev) => [c, ...prev]);
          addAudit('Assessments', 'Issued certificate', `${c.studentName}: ${c.title}`);
          toast(`Certificate issued to ${c.studentName}.`);
          setCertOpen(null);
          setTab('certificates');
        }}
      />
    </div>
  );
};

/* ================================================================== */
/* Events                                                              */
/* ================================================================== */

const EVENT_TYPES: PlatformEvent['type'][] = ['Webinar', 'Workshop', 'Masterclass', 'Career fair', 'Assessment', 'Other'];
const AUDIENCES: { value: EventAudience; label: string }[] = [
  { value: 'everyone', label: 'Everyone (students and staff)' },
  { value: 'students', label: 'All students' },
  { value: 'staff', label: 'Mentors & counsellors only' },
  { value: 'school', label: COHORT_NAMES.school },
  { value: 'college', label: COHORT_NAMES.college },
  { value: 'fresher', label: COHORT_NAMES.fresher },
  { value: 'working_professional', label: COHORT_NAMES.working_professional },
];
const EVENT_TONE: Record<PlatformEvent['type'], Tone> = { Webinar: 'blue', Workshop: 'violet', Masterclass: 'ink', 'Career fair': 'mint', Assessment: 'marigold', Other: 'neutral' };

const EventEditor: React.FC<{ draft: PlatformEvent | null; onClose: () => void; onSave: (e: PlatformEvent) => void }> = ({ draft, onClose, onSave }) => {
  const [ev, setEv] = useState<PlatformEvent | null>(draft);
  React.useEffect(() => setEv(draft), [draft]);
  if (!ev) return <Modal open={false} onClose={onClose} title="" children={null} />;
  return (
    <Modal
      open={!!draft}
      onClose={onClose}
      title={ev.id ? 'Edit event' : 'New event'}
      description="Published events show on students' Upcoming events page and calendar."
      width="max-w-xl"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!ev.title.trim() || !ev.date || !ev.time} onClick={() => onSave({ ...ev, title: ev.title.trim(), link: ev.link?.trim() || undefined, location: ev.location?.trim() || undefined })}>
            Save event
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Title" className="sm:col-span-2">
          <Input value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} placeholder="Cracking product-based company interviews" />
        </Field>
        <Field label="Type">
          <Select value={ev.type} onChange={(e) => setEv({ ...ev, type: e.target.value as PlatformEvent['type'] })}>
            {EVENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Host">
          <Input value={ev.host} onChange={(e) => setEv({ ...ev, host: e.target.value })} placeholder="Maxicareer team" />
        </Field>
        <Field label="Date">
          <Input type="date" value={ev.date} onChange={(e) => setEv({ ...ev, date: e.target.value })} />
        </Field>
        <Field label="Start time">
          <Input type="time" value={ev.time} onChange={(e) => setEv({ ...ev, time: e.target.value })} />
        </Field>
        <Field label="Length (minutes)">
          <Input type="number" min={15} max={600} step={15} value={ev.durationMins} onChange={(e) => setEv({ ...ev, durationMins: Math.max(15, Number(e.target.value) || 60) })} />
        </Field>
        <Field label="Format">
          <Select value={ev.mode} onChange={(e) => setEv({ ...ev, mode: e.target.value as PlatformEvent['mode'] })}>
            <option>Online</option>
            <option>In person</option>
          </Select>
        </Field>
        {ev.mode === 'Online' ? (
          <Field label="Joining link" className="sm:col-span-2">
            <Input value={ev.link || ''} onChange={(e) => setEv({ ...ev, link: e.target.value })} placeholder="https://meet.google.com/…" />
          </Field>
        ) : (
          <Field label="Venue" className="sm:col-span-2">
            <Input value={ev.location || ''} onChange={(e) => setEv({ ...ev, location: e.target.value })} />
          </Field>
        )}
        <Field label="Audience" className="sm:col-span-2">
          <Select value={ev.audience} onChange={(e) => setEv({ ...ev, audience: e.target.value as EventAudience })}>
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea rows={3} value={ev.description} onChange={(e) => setEv({ ...ev, description: e.target.value })} />
        </Field>
        <Field label="Website" className="sm:col-span-2">
          <div className="flex items-start gap-3">
            <Toggle checked={!!ev.public} onChange={(v) => setEv({ ...ev, public: v })} label="Show on the website's Events page" />
            <span className="text-[13px] text-[#26355A] leading-snug">
              Also show on the website's Events page, so anyone can see it{ev.mode === 'Online' ? ' and open the joining link' : ''}.
            </span>
          </div>
        </Field>
        <Field label="Status" className="sm:col-span-2">
          <StatusToggle value={ev.status} onChange={(status) => setEv({ ...ev, status })} />
        </Field>
      </div>
    </Modal>
  );
};

export const Events: React.FC = () => {
  const { session, addAudit, toast } = useAdmin();
  const [events, setEvents] = useSharedCollection<PlatformEvent>('events', []);
  const [view, setView] = useState<'upcoming' | 'past' | 'drafts'>('upcoming');
  const [editing, setEditing] = useState<PlatformEvent | null>(null);
  const today = todayIso();
  const sorted = useMemo(() => [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [events]);
  const upcoming = sorted.filter((e) => e.status === 'Published' && e.date >= today);
  const past = sorted.filter((e) => e.status === 'Published' && e.date < today).reverse();
  const drafts = sorted.filter((e) => e.status === 'Draft');
  const shown = view === 'upcoming' ? upcoming : view === 'past' ? past : drafts;

  const blank = (): PlatformEvent => ({
    id: '',
    title: '',
    type: 'Webinar',
    description: '',
    date: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
    time: '18:00',
    durationMins: 60,
    mode: 'Online',
    link: '',
    location: '',
    audience: 'students',
    host: session.name || 'Maxicareer team',
    status: 'Published',
    createdAt: new Date().toISOString(),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Events"
        description="Webinars, workshops, masterclasses and career fairs on students' and mentors' calendars. Turn on Website for an event to list it on the public Events page too."
        actions={
          <>
            <a href="/events" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#D3DBE8] bg-white px-4 text-[13.5px] font-semibold text-[#0D1B3E] hover:border-[#B7C3D7]">
              <ExternalLink className="w-4 h-4" /> View page
            </a>
            <Button variant="primary" icon={Plus} onClick={() => setEditing(blank())}>
              New event
            </Button>
          </>
        }
      />
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { value: 'past', label: 'Past', count: past.length },
          { value: 'drafts', label: 'Drafts', count: drafts.length },
        ]}
      />
      <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
        {shown.length === 0 && <Empty icon={PartyPopper} title={view === 'upcoming' ? 'Nothing scheduled' : view === 'past' ? 'No past events' : 'No drafts'} action={view === 'upcoming' ? <Button onClick={() => setEditing(blank())}>New event</Button> : undefined} />}
        {shown.map((e) => {
          const d = new Date(`${e.date}T00:00:00`);
          return (
            <div key={e.id} className="flex flex-col md:flex-row md:items-center gap-4 px-5 py-4">
              <div className="w-14 shrink-0 rounded-[12px] border border-[#DDE4EF] text-center py-1.5">
                <div className="text-[11px] font-semibold uppercase text-[#2563EB]">{d.toLocaleDateString('en-IN', { month: 'short' })}</div>
                <div className="mc-display mc-num text-[20px] font-semibold leading-none">{d.getDate()}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold">{e.title}</span>
                  <Badge tone={EVENT_TONE[e.type]}>{e.type}</Badge>
                  {e.public && <Badge tone="blue">On website</Badge>}
                  {e.status === 'Draft' && (
                    <Badge tone="marigold" dot>
                      Draft
                    </Badge>
                  )}
                </div>
                <div className="text-[12.5px] text-[#5B6885] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span>
                    {d.toLocaleDateString('en-IN', { weekday: 'short' })} · {fmtTime(e.time)} · {e.durationMins} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {e.mode === 'Online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    {e.mode === 'Online' ? 'Online' : e.location || 'In person'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {AUDIENCES.find((a) => a.value === e.audience)?.label}
                  </span>
                  <span>Host: {e.host}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {e.link && (
                  <a href={e.link} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-[#D3DBE8] bg-white px-3 text-[12.5px] font-semibold hover:border-[#B7C3D7]">
                    <ExternalLink className="w-3.5 h-3.5" /> Link
                  </a>
                )}
                <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(e)} />
                <IconButton icon={Copy} label="Duplicate" onClick={() => setEditing({ ...e, id: '', status: 'Draft', title: `${e.title} (copy)` })} />
                <IconButton
                  icon={Trash2}
                  tone="danger"
                  label="Delete"
                  onClick={() => {
                    if (!window.confirm(`Delete "${e.title}"?`)) return;
                    setEvents((prev) => prev.filter((x) => x.id !== e.id));
                    addAudit('Events', 'Deleted event', e.title);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <EventEditor
        draft={editing}
        onClose={() => setEditing(null)}
        onSave={(ev) => {
          if (ev.id) {
            setEvents((prev) => prev.map((x) => (x.id === ev.id ? ev : x)));
            addAudit('Events', 'Edited event', ev.title);
          } else {
            setEvents((prev) => [...prev, { ...ev, id: uid('evt'), createdAt: new Date().toISOString() }]);
            addAudit('Events', 'Created event', `${ev.title}, ${ev.date}`);
          }
          toast(ev.status === 'Published' ? 'Event published.' : 'Event saved as a draft.');
          setEditing(null);
        }}
      />
    </div>
  );
};
