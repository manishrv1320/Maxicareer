import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  GraduationCap,
  Link2,
  ListChecks,
  Lock,
  Printer,
  RotateCcw,
  Send,
  Timer,
  Trash2,
  Trophy,
  Upload,
} from 'lucide-react';
import { PageHeader, Panel, Button, Badge, Empty, Segmented, StepMeter, Field, Input, Select, Textarea, Modal, SearchInput, cx, Tone, Th, Td } from '../admin/ui';
import { useStudent, computeBadges } from './context';
import { RESOURCE_ITEMS } from '../../data/portalData';
import type { Assignment, Certificate, TestDef } from '../../types/portal';
import type { UploadedFile } from '../../lib/api';
import { FileLink, FilePicker, FormError, fileUrl, fmtDay, isoOf, daysFromToday, relativeDay, useAsyncAction, todayIso } from '../workspace/kit';

/* ------------------------------------------------------------------ */
/* Curriculum                                                          */
/* ------------------------------------------------------------------ */

export const CurriculumPage: React.FC = () => {
  const { modules, completedLessonIds, toggleLesson, curriculumProgress, lessonIds, me } = useStudent();
  const [source, setSource] = useState<'all' | 'cohort' | 'student'>('all');
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const firstOpen = modules.find((m) => m.lessons.some((l) => !completedLessonIds.includes(l.id)));
  useEffect(() => {
    if (firstOpen && open.size === 0) setOpen(new Set([firstOpen.id]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstOpen?.id]);

  const shown = modules.filter((m) => source === 'all' || m.scope === source);
  const done = completedLessonIds.filter((id) => lessonIds.includes(id)).length;
  const personal = modules.filter((m) => m.scope === 'student').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Curriculum & syllabus"
        description={`Modules for ${me?.planName || 'your program'}, set by the Maxicareer team and your mentor or counsellor. Tick lessons off as you finish them.`}
        actions={
          <span className="flex items-center gap-3 rounded-[12px] border border-[#DDE4EF] bg-white px-4 py-2">
            <StepMeter value={curriculumProgress} steps={8} height={24} width={96} tone="mint" />
            <span>
              <span className="mc-display mc-num block text-[20px] font-semibold leading-none">{curriculumProgress}%</span>
              <span className="text-[12px] text-[#5B6885]">{done || !curriculumProgress ? `${done} of ${lessonIds.length} lessons` : 'recorded by your mentor'}</span>
            </span>
          </span>
        }
      />
      {personal > 0 && (
        <Segmented
          value={source}
          onChange={setSource}
          options={[
            { value: 'all', label: 'All modules', count: modules.length },
            { value: 'cohort', label: 'Program syllabus', count: modules.length - personal },
            { value: 'student', label: 'From your proctor', count: personal },
          ]}
        />
      )}
      <div className="space-y-3">
        {shown.map((m) => {
          const ids = m.lessons.map((l) => l.id);
          const n = ids.filter((id) => completedLessonIds.includes(id)).length;
          const state = n === ids.length && ids.length ? 'done' : n > 0 ? 'doing' : 'todo';
          const isOpen = open.has(m.id);
          const index = modules.indexOf(m) + 1;
          return (
            <section key={m.id} className="bg-white border border-[#DDE4EF] rounded-[14px] overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  const next = new Set(open);
                  if (isOpen) next.delete(m.id);
                  else next.add(m.id);
                  setOpen(next);
                }}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#F7F9FC]"
              >
                <span
                  className={cx(
                    'mc-display mc-num h-10 w-10 rounded-[11px] flex items-center justify-center text-[15px] font-semibold shrink-0',
                    state === 'done' ? 'bg-[#E3F6EE] text-[#0B7A55]' : state === 'doing' ? 'bg-[#E8F0FE] text-[#1D4FD7]' : 'bg-[#EEF2F7] text-[#4A5875]'
                  )}
                >
                  {String(index).padStart(2, '0')}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="mc-display text-[16px] font-semibold">{m.title}</span>
                    <Badge tone={state === 'done' ? 'mint' : state === 'doing' ? 'blue' : 'neutral'}>{state === 'done' ? 'Completed' : state === 'doing' ? 'In progress' : 'Up next'}</Badge>
                    {m.scope === 'student' && <Badge tone="violet">From {m.createdByName}</Badge>}
                  </span>
                  <span className="block text-[13px] text-[#5B6885] mt-0.5">
                    {[m.weeks, `${n}/${ids.length} lessons`, m.description].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <ChevronDown className={cx('w-5 h-5 text-[#8C97AE] transition-transform shrink-0', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <ul className="border-t border-[#EAEFF6] divide-y divide-[#EAEFF6]">
                  {m.lessons.map((l) => {
                    const checked = completedLessonIds.includes(l.id);
                    return (
                      <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                        <button type="button" onClick={() => toggleLesson(l.id)} aria-pressed={checked} aria-label={checked ? `Mark "${l.title}" not done` : `Mark "${l.title}" done`} className="shrink-0">
                          {checked ? <CheckCircle2 className="w-5 h-5 text-[#0F9F6E] fill-[#E3F6EE]" /> : <Circle className="w-5 h-5 text-[#B7C3D7]" />}
                        </button>
                        <span className={cx('flex-1 min-w-0 text-[14px] font-medium', checked && 'line-through text-[#7A869E]')}>{l.title}</span>
                        <span className="hidden sm:inline-flex items-center gap-2 text-[12.5px] text-[#5B6885] shrink-0">
                          <Badge>{l.type}</Badge>
                          {l.duration && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {l.duration}
                            </span>
                          )}
                        </span>
                        {l.url && (
                          <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#2563EB] hover:underline shrink-0">
                            Open <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </li>
                    );
                  })}
                  {m.lessons.length === 0 && <li className="px-5 py-4 text-[13px] text-[#5B6885]">Lessons for this module will be added soon.</li>}
                </ul>
              )}
            </section>
          );
        })}
        {shown.length === 0 && (
          <Panel>
            <Empty icon={BookOpen} title="No modules yet" body="Your syllabus appears here once the Maxicareer team publishes it." />
          </Panel>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Tasks & assignments                                                 */
/* ------------------------------------------------------------------ */

const ASSIGNMENT_STATUS: Record<Assignment['status'], { label: string; tone: Tone }> = {
  submitted: { label: 'Waiting for review', tone: 'marigold' },
  reviewed: { label: 'Reviewed', tone: 'mint' },
  changes_requested: { label: 'Changes requested', tone: 'rose' },
};

const PRIORITY_TONE: Record<string, Tone> = { high: 'rose', medium: 'marigold', low: 'neutral' };

const SubmitWorkModal: React.FC<{ open: boolean; onClose: () => void; taskId?: string }> = ({ open, onClose, taskId }) => {
  const { state, store, providers, mentor, counselor, toast } = useStudent();
  const openTasks = state.followUpTasks.filter((t) => t.status !== 'completed');
  const [form, setForm] = useState({ kind: 'Assignment' as Assignment['kind'], taskId: '', counselorId: '', title: '', description: '', link: '' });
  const [file, setFile] = useState<UploadedFile | null>(null);
  const { busy, error, setError, run } = useAsyncAction();

  useEffect(() => {
    if (!open) return;
    const task = state.followUpTasks.find((t) => t.id === taskId);
    setForm({ kind: 'Assignment', taskId: taskId || '', counselorId: mentor?.id || counselor?.id || providers[0]?.id || '', title: task ? task.title : '', description: '', link: '' });
    setFile(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  const submit = async () => {
    const ok = await run(() =>
      store.submitAssignment({
        kind: form.kind,
        title: form.title,
        description: form.description,
        link: form.link,
        taskId: form.taskId || undefined,
        counselorId: form.taskId ? undefined : form.counselorId || undefined,
        fileId: file?.id,
        fileName: file?.name,
      })
    );
    if (ok) {
      toast('Submitted. Your reviewer has been notified.');
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit work"
      description="Upload an assignment or project for your mentor or counsellor to review."
      width="max-w-xl"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={Send} disabled={busy || !form.title.trim() || (!file && !form.link.trim() && !form.description.trim())} onClick={submit}>
            {busy ? 'Submitting…' : 'Submit'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormError message={error} />
        <Segmented
          value={form.kind}
          onChange={(kind) => setForm({ ...form, kind })}
          options={[
            { value: 'Assignment', label: 'Assignment' },
            { value: 'Project', label: 'Project' },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="For task (optional)">
            <Select
              value={form.taskId}
              onChange={(e) => {
                const t = openTasks.find((x) => x.id === e.target.value);
                setForm({ ...form, taskId: e.target.value, title: t && !form.title ? t.title : form.title });
              }}
            >
              <option value="">Not linked to a task</option>
              {openTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reviewer">
            {form.taskId ? (
              <Input value={state.followUpTasks.find((t) => t.id === form.taskId)?.counselorName || ''} disabled />
            ) : (
              <Select value={form.counselorId} onChange={(e) => setForm({ ...form, counselorId: e.target.value })}>
                {providers.length === 0 && <option value="">No mentor assigned yet</option>}
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.id === mentor?.id ? ' (mentor)' : p.id === counselor?.id ? ' (counsellor)' : ''}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Title">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Portfolio project: sales dashboard" />
        </Field>
        <Field label="Notes for your reviewer">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What you did, what you'd like feedback on." />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="File">
            <FilePicker value={file} onChange={setFile} category="attachment" label="Upload file (max 10 MB)" onError={setError} />
          </Field>
          <Field label="Link (GitHub, Drive, Figma…)">
            <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" />
          </Field>
        </div>
      </div>
    </Modal>
  );
};

export const TasksPage: React.FC = () => {
  const { state, store, toast } = useStudent();
  const [view, setView] = useState<'todo' | 'done' | 'submissions'>('todo');
  const [submitFor, setSubmitFor] = useState<string | null | undefined>(undefined);
  const tasks = [...state.followUpTasks].sort((a, b) => (isoOf(a.dueDate) || '9999').localeCompare(isoOf(b.dueDate) || '9999'));
  const todo = tasks.filter((t) => t.status !== 'completed');
  const done = tasks.filter((t) => t.status === 'completed');
  const submissions = [...state.assignments].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const list = view === 'todo' ? todo : done;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tasks & assignments"
        description="Tasks given by your mentor or counsellor, and the work you upload for review."
        actions={
          <Button variant="primary" icon={Upload} onClick={() => setSubmitFor(null)}>
            Submit work
          </Button>
        }
      />
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'todo', label: 'To do', count: todo.length },
          { value: 'done', label: 'Done', count: done.length },
          { value: 'submissions', label: 'My submissions', count: submissions.length },
        ]}
      />

      {view !== 'submissions' ? (
        list.length === 0 ? (
          <Panel>
            <Empty icon={ListChecks} title={view === 'todo' ? 'No open tasks' : 'Nothing completed yet'} body="Your mentor or counsellor adds tasks after your sessions." />
          </Panel>
        ) : (
          <div className="space-y-3">
            {list.map((t) => {
              const due = daysFromToday(t.dueDate);
              const overdue = t.status !== 'completed' && due !== null && due < 0;
              const linked = state.assignments.filter((a) => a.taskId === t.id);
              return (
                <Panel key={t.id}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => store.updateTaskStatus(t.id, t.status === 'completed' ? 'pending' : 'completed')}
                      aria-label={t.status === 'completed' ? 'Mark as not done' : 'Mark as done'}
                      className="shrink-0 mt-0.5"
                    >
                      {t.status === 'completed' ? <CheckCircle2 className="w-6 h-6 text-[#0F9F6E] fill-[#E3F6EE]" /> : <Circle className="w-6 h-6 text-[#B7C3D7] hover:text-[#2563EB]" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cx('text-[15px] font-semibold', t.status === 'completed' && 'line-through text-[#7A869E]')}>{t.title}</span>
                        <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority} priority</Badge>
                        {t.status === 'in_progress' && <Badge tone="blue">In progress</Badge>}
                      </div>
                      {t.description && <p className="mt-1 text-[13.5px] text-[#33415F] whitespace-pre-wrap">{t.description}</p>}
                      <p className="mt-1 text-[12.5px] text-[#7A869E]">
                        From {t.counselorName}
                        {t.dueDate && (
                          <>
                            {' · '}
                            <span className={cx(overdue && 'text-[#B42F3B] font-semibold')}>
                              Due {fmtDay(t.dueDate)} ({relativeDay(t.dueDate).toLowerCase()})
                            </span>
                          </>
                        )}
                      </p>
                      {linked.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {linked.map((a) => (
                            <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F6FB] px-2.5 py-1 text-[12px]">
                              <FileText className="w-3.5 h-3.5 text-[#5B6885]" />
                              {fmtDay(a.submittedAt, { day: 'numeric', month: 'short' })}
                              <Badge tone={ASSIGNMENT_STATUS[a.status].tone}>{ASSIGNMENT_STATUS[a.status].label}</Badge>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {t.status !== 'completed' && (
                      <Button size="sm" icon={Upload} onClick={() => setSubmitFor(t.id)}>
                        Submit work
                      </Button>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
        )
      ) : submissions.length === 0 ? (
        <Panel>
          <Empty
            icon={Upload}
            title="No submissions yet"
            body="Upload assignments and projects here. Your reviewer's grade and feedback appear on each one."
            action={
              <Button variant="primary" icon={Upload} onClick={() => setSubmitFor(null)}>
                Submit work
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {submissions.map((a) => (
            <Panel key={a.id}>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="ink">{a.kind}</Badge>
                    <span className="text-[15px] font-semibold">{a.title}</span>
                    <Badge tone={ASSIGNMENT_STATUS[a.status].tone} dot>
                      {ASSIGNMENT_STATUS[a.status].label}
                    </Badge>
                    {a.grade && <Badge tone="violet">Grade: {a.grade}</Badge>}
                  </div>
                  <p className="mt-1 text-[12.5px] text-[#7A869E]">
                    Submitted {fmtDay(a.submittedAt)} to {a.counselorName}
                    {a.reviewedAt ? ` · reviewed ${fmtDay(a.reviewedAt)}` : ''}
                  </p>
                  {a.description && <p className="mt-2 text-[13.5px] text-[#33415F] whitespace-pre-wrap">{a.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-4">
                    {a.fileId && <FileLink fileId={a.fileId} name={a.fileName} />}
                    {a.link && (
                      <a href={a.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563EB] hover:underline">
                        <Link2 className="w-3.5 h-3.5" /> Link
                      </a>
                    )}
                  </div>
                  {a.feedback && (
                    <div className="mt-3 rounded-[12px] border-l-[3px] border-[#2563EB] bg-[#F3F7FF] px-4 py-3">
                      <div className="text-[12px] font-semibold text-[#1D4FD7]">Feedback from {a.counselorName}</div>
                      <p className="text-[13.5px] text-[#26355A] whitespace-pre-wrap mt-0.5">{a.feedback}</p>
                    </div>
                  )}
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {a.status === 'changes_requested' && (
                    <Button size="sm" variant="primary" icon={RotateCcw} onClick={() => setSubmitFor(a.taskId || null)}>
                      Resubmit
                    </Button>
                  )}
                  {a.status === 'submitted' && (
                    <Button
                      size="sm"
                      variant="danger"
                      icon={Trash2}
                      onClick={async () => {
                        if (!window.confirm('Withdraw this submission?')) return;
                        try {
                          await store.deleteAssignment(a.id);
                          toast('Submission withdrawn.');
                        } catch (err) {
                          toast(err instanceof Error ? err.message : 'Could not withdraw it.', 'error');
                        }
                      }}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
      <SubmitWorkModal open={submitFor !== undefined} onClose={() => setSubmitFor(undefined)} taskId={submitFor || undefined} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Courses & tests                                                     */
/* ------------------------------------------------------------------ */

const TestRunner: React.FC<{ test: TestDef; onExit: () => void }> = ({ test, onExit }) => {
  const { store, toast } = useStudent();
  const [answers, setAnswers] = useState<(number | null)[]>(() => test.questions.map(() => null));
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<{ scorePercent: number; correct: number; total: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const deadline = useRef(Date.now() + Math.max(1, test.durationMins) * 60_000);
  const [remaining, setRemaining] = useState(Math.max(1, test.durationMins) * 60);
  const submittedRef = useRef(false);

  const submit = async (auto = false) => {
    if (submittedRef.current) return;
    if (!auto) {
      const blank = answers.filter((a) => a === null).length;
      if (blank && !window.confirm(`${blank} question${blank > 1 ? 's are' : ' is'} unanswered. Submit anyway?`)) return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    try {
      setResult(await store.submitTest(test.id, answers));
      if (auto) toast("Time's up. Your answers were submitted.");
    } catch (err) {
      submittedRef.current = false;
      toast(err instanceof Error ? err.message : 'Could not submit the test.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(t);
        submit(true);
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (result) {
    return (
      <div className="max-w-xl mx-auto">
        <Panel>
          <div className="text-center py-6">
            <span className={cx('mx-auto h-14 w-14 rounded-full flex items-center justify-center', result.passed ? 'bg-[#E3F6EE] text-[#0F9F6E]' : 'bg-[#FDF1DC] text-[#94570A]')}>
              {result.passed ? <Trophy className="w-7 h-7" /> : <RotateCcw className="w-7 h-7" />}
            </span>
            <h2 className="mt-4 mc-display text-[24px] font-semibold">{result.passed ? 'Well done, you passed!' : 'Not quite there yet'}</h2>
            <p className="mt-1 text-[14px] text-[#5B6885]">{test.title}</p>
            <div className="mt-5 mc-display mc-num text-[48px] font-semibold leading-none">{result.scorePercent}%</div>
            <p className="mt-2 text-[13.5px] text-[#5B6885]">
              {result.correct} of {result.total} correct · pass mark {test.passPercent}%
            </p>
            <Button className="mt-6" variant="primary" onClick={onExit}>
              Back to courses & tests
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  const q = test.questions[current];
  const answered = answers.filter((a) => a !== null).length;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[13px] text-[#5B6885]">{test.kind}</div>
          <h1 className="mc-display text-[26px] font-semibold">{test.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={cx('mc-num inline-flex items-center gap-2 rounded-[10px] px-3 h-10 text-[15px] font-semibold', remaining < 60 ? 'bg-[#FCEBEC] text-[#B42F3B]' : 'bg-white border border-[#DDE4EF]')}>
            <Timer className="w-4 h-4" /> {mm}:{ss}
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              if (window.confirm('Leave the test? Your answers will not be saved and the attempt is not used.')) onExit();
            }}
          >
            Leave
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Panel className="lg:col-span-8">
          <div className="pt-1 text-[13px] font-semibold text-[#5B6885]">
            Question {current + 1} of {test.questions.length}
          </div>
          <h2 className="mt-2 text-[18px] font-semibold leading-snug whitespace-pre-wrap">{q.prompt}</h2>
          <div className="mt-4 space-y-2" role="radiogroup" aria-label={`Question ${current + 1}`}>
            {q.options.map((opt, i) => {
              const picked = answers[current] === i;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={picked}
                  onClick={() => setAnswers(answers.map((a, k) => (k === current ? i : a)))}
                  className={cx(
                    'w-full flex items-center gap-3 rounded-[12px] border px-4 py-3 text-left text-[14.5px] transition-colors',
                    picked ? 'border-[#2563EB] bg-[#F3F7FF] ring-2 ring-[#2563EB]/15' : 'border-[#DDE4EF] hover:border-[#B7C3D7]'
                  )}
                >
                  <span className={cx('mc-display h-7 w-7 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0', picked ? 'bg-[#2563EB] text-white' : 'bg-[#EEF2F7] text-[#4A5875]')}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-between">
            <Button disabled={current === 0} onClick={() => setCurrent(current - 1)}>
              Previous
            </Button>
            {current < test.questions.length - 1 ? (
              <Button variant="primary" onClick={() => setCurrent(current + 1)}>
                Next
              </Button>
            ) : (
              <Button variant="primary" icon={Send} disabled={submitting} onClick={() => submit(false)}>
                {submitting ? 'Submitting…' : 'Submit test'}
              </Button>
            )}
          </div>
        </Panel>
        <Panel className="lg:col-span-4" title="Questions" description={`${answered} of ${test.questions.length} answered`}>
          <div className="grid grid-cols-6 gap-2">
            {test.questions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Question ${i + 1}${answers[i] !== null ? ', answered' : ''}`}
                className={cx(
                  'mc-num h-9 rounded-[9px] text-[13px] font-semibold border',
                  i === current ? 'border-[#2563EB] text-[#1D4FD7]' : 'border-[#DDE4EF]',
                  answers[i] !== null ? 'bg-[#E8F0FE]' : 'bg-white'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button className="mt-4 w-full" variant="primary" icon={Send} disabled={submitting} onClick={() => submit(false)}>
            Submit test
          </Button>
        </Panel>
      </div>
    </div>
  );
};

export const CoursesPage: React.FC = () => {
  const { state, me, profile, curriculumProgress, go } = useStudent();
  const [running, setRunning] = useState<TestDef | null>(null);
  const results = state.assessments.filter((a) => a.status === 'completed').sort((a, b) => (b.submittedAt || b.completionDate).localeCompare(a.submittedAt || a.completionDate));
  const paidServices = state.invoices.filter((i) => i.kind === 'Service' && i.status === 'Paid');
  const addOns = Array.from(new Set([...(me?.selectedAddOns || []), ...paidServices.map((i) => i.serviceName || '')].filter(Boolean)));
  const today = todayIso();

  if (running) return <TestRunner test={running} onExit={() => setRunning(null)} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Courses & tests" description="Your enrolled program, add-on courses, and the assessments set by the Maxicareer team." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2 flex flex-col" bodyClassName="flex-1 flex flex-col">
          <div className="flex items-start gap-4 pt-1">
            <span className="h-12 w-12 rounded-[12px] bg-[#0D1B3E] text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-[#5B6885]">Enrolled program</div>
              <div className="mc-display text-[20px] font-semibold">{me?.planName || profile.planName}</div>
              <div className="text-[13px] text-[#5B6885]">{me?.professionLabel || profile.professionLabel}</div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <StepMeter value={curriculumProgress} steps={10} height={28} width={160} tone="mint" />
            <span className="mc-display mc-num text-[22px] font-semibold">{curriculumProgress}%</span>
            <Button size="sm" className="ml-auto" onClick={() => go('curriculum')}>
              Continue learning
            </Button>
          </div>
        </Panel>
        <Panel title="Add-on courses" actions={<Button size="sm" onClick={() => go('services')}>Add</Button>}>
          {addOns.length === 0 ? (
            <p className="text-[13px] text-[#5B6885]">No add-ons yet. Resume reviews, mock interviews and coaching packs are in Add a service.</p>
          ) : (
            <ul className="space-y-1.5">
              {addOns.map((a) => (
                <li key={a} className="flex items-center gap-2 text-[13.5px]">
                  <CheckCircle2 className="w-4 h-4 text-[#0F9F6E] shrink-0" /> {a}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Tests & assessments" description="Take each test in one sitting. The timer starts when you begin." flush>
        {state.tests.length === 0 ? (
          <Empty icon={GraduationCap} title="No tests right now" body="When the Maxicareer team publishes a test for your program, it appears here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Test</Th>
                  <Th>Length</Th>
                  <Th>Due</Th>
                  <Th>Attempts</Th>
                  <Th>Best score</Th>
                  <Th className="text-right">&nbsp;</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF6]">
                {state.tests.map((t) => {
                  const mine = results.filter((r) => r.testId === t.id);
                  const best = mine.reduce((m, r) => Math.max(m, r.scorePercent || 0), -1);
                  const used = mine.length;
                  const left = Math.max(0, t.attemptsAllowed - used);
                  const overdue = t.dueDate && t.dueDate < today;
                  return (
                    <tr key={t.id}>
                      <Td>
                        <div className="font-semibold text-[#0D1B3E]">{t.title}</div>
                        <div className="text-[12.5px] text-[#7A869E]">
                          {t.kind}
                          {t.description ? ` · ${t.description}` : ''}
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap">
                        {t.questions.length} Q · {t.durationMins} min
                      </Td>
                      <Td className={cx('whitespace-nowrap', overdue && 'text-[#B42F3B]')}>{t.dueDate ? fmtDay(t.dueDate) : '—'}</Td>
                      <Td className="mc-num whitespace-nowrap">
                        {used}/{t.attemptsAllowed}
                      </Td>
                      <Td>
                        {best >= 0 ? (
                          <Badge tone={best >= t.passPercent ? 'mint' : 'marigold'}>
                            {best}% {best >= t.passPercent ? 'passed' : ''}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td className="text-right">
                        {t.questions.length === 0 ? (
                          <Badge>Coming soon</Badge>
                        ) : left > 0 ? (
                          <Button
                            size="sm"
                            variant={used ? 'secondary' : 'primary'}
                            onClick={() => {
                              if (window.confirm(`Start "${t.title}"? You have ${t.durationMins} minutes and ${left} attempt${left > 1 ? 's' : ''} left.`)) setRunning(t);
                            }}
                          >
                            {used ? 'Retake' : 'Start'}
                          </Button>
                        ) : (
                          <Badge>No attempts left</Badge>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Results" description="Online tests and assessments recorded by your counsellor." flush>
        {results.length === 0 ? (
          <Empty icon={Award} title="No results yet" />
        ) : (
          <ul className="divide-y divide-[#EAEFF6]">
            {results.map((r) => (
              <li key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">{r.assessmentName}</div>
                  <div className="text-[12.5px] text-[#7A869E]">
                    {r.kind || 'Assessment'} · {r.submittedAt ? fmtDay(r.submittedAt) : r.completionDate}
                    {r.attempt ? ` · attempt ${r.attempt}` : ''}
                    {r.strengths?.length ? ` · strengths: ${r.strengths.join(', ')}` : ''}
                  </div>
                </div>
                {typeof r.scorePercent === 'number' && (
                  <span className="flex items-center gap-2">
                    <StepMeter value={r.scorePercent} steps={6} height={18} width={60} tone={r.passed === false ? 'marigold' : 'mint'} />
                    <span className="mc-num text-[14px] font-semibold w-10 text-right">{r.scorePercent}%</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */

const KIND_TONE: Record<string, Tone> = { Guide: 'blue', Template: 'violet', Video: 'rose', Link: 'neutral', Worksheet: 'mint' };

export const ResourcesPage: React.FC = () => {
  const { state, profile, mentor, counselor, store, toast } = useStudent();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const list = state.resources
    .filter((r) => kind === 'all' || r.kind === kind)
    .filter((r) => !q.trim() || `${r.title} ${r.description} ${r.sharedByName}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const kinds = Array.from(new Set(state.resources.map((r) => r.kind)));
  const starter = RESOURCE_ITEMS[profile.profession] || RESOURCE_ITEMS.college;
  const reviewer = mentor || counselor;

  const request = async (title: string) => {
    if (!reviewer) {
      toast('Resources are shared by your mentor. One is assigned after enrolment.', 'error');
      return;
    }
    const sent = await store.sendMessage({ recipientId: reviewer.id, content: `Hi ${reviewer.name.split(' ')[0]}, could you share the "${title}" resource with me?` });
    if (sent) toast(`Requested from ${reviewer.name}. It will arrive in Chat or here.`);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Resources" description="Guides, templates and materials from the Maxicareer team and your mentor or counsellor." />
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search resources" className="sm:max-w-xs flex-1" />
        {kinds.length > 1 && <Segmented value={kind} onChange={setKind} options={[{ value: 'all', label: 'All' }, ...kinds.map((k) => ({ value: k, label: k }))]} />}
      </div>
      {list.length === 0 ? (
        <Panel>
          <Empty icon={FolderOpen} title={q || kind !== 'all' ? 'No matching resources' : 'No shared resources yet'} body="Materials shared with your cohort or with you personally appear here." />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((r) => (
            <Panel key={r.id} className="flex flex-col" bodyClassName="flex-1 flex flex-col">
              <div className="flex items-center gap-2 pt-1">
                <Badge tone={KIND_TONE[r.kind] || 'neutral'}>{r.kind}</Badge>
                {r.scope === 'student' && <Badge tone="violet">For you</Badge>}
              </div>
              <h3 className="mt-2 text-[15px] font-semibold">{r.title}</h3>
              {r.description && <p className="mt-1 text-[13px] text-[#5B6885] line-clamp-3">{r.description}</p>}
              <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                <span className="text-[12px] text-[#7A869E] truncate">
                  {r.sharedByName} · {fmtDay(r.createdAt, { day: 'numeric', month: 'short' })}
                </span>
                {r.fileId ? (
                  <a href={fileUrl(r.fileId)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] bg-[#2563EB] text-white text-[12.5px] font-semibold hover:bg-[#1D4FD7] shrink-0">
                    <Download className="w-3.5 h-3.5" /> Open
                  </a>
                ) : r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] bg-[#2563EB] text-white text-[12.5px] font-semibold hover:bg-[#1D4FD7] shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                ) : null}
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Panel title="Starter kit for your program" description="Ask your mentor for any of these and they'll send it to you.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {starter.map((r) => (
            <div key={r.title} className="rounded-[12px] border border-[#EAEFF6] p-4 flex flex-col">
              <div className="flex items-center gap-2 text-[12px] text-[#7A869E]">
                <FileText className="w-4 h-4" /> {r.type}
              </div>
              <div className="mt-1.5 text-[14px] font-semibold">{r.title}</div>
              <p className="text-[12.5px] text-[#5B6885] mt-1 flex-1">{r.description}</p>
              <Button size="sm" className="mt-3" icon={Send} onClick={() => request(r.title)}>
                Request from mentor
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Milestones, badges & certificates                                   */
/* ------------------------------------------------------------------ */

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function printCertificate(c: Certificate) {
  const w = window.open('', '_blank', 'width=1100,height=800');
  if (!w) return;
  const issued = fmtDay(c.issuedOn, { day: 'numeric', month: 'long', year: 'numeric' });
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(c.title)} – ${escapeHtml(c.studentName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600&family=Plus+Jakarta+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
@page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;font-family:'Plus Jakarta Sans',sans-serif;background:#F3F6FB;color:#0D1B3E}
.page{width:297mm;height:210mm;margin:0 auto;padding:16mm;background:#fff;position:relative}
.frame{height:100%;border:2px solid #0D1B3E;outline:6px solid #E8F0FE;outline-offset:-12px;padding:18mm 22mm;display:flex;flex-direction:column;align-items:center;text-align:center}
.brand{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;letter-spacing:.02em}.brand b{color:#2563EB}
.kicker{margin-top:14mm;font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:#5B6885}
h1{font-family:'Bricolage Grotesque',sans-serif;font-size:44px;margin:6mm 0 2mm}
.to{font-size:15px;color:#5B6885}.name{font-family:'Bricolage Grotesque',sans-serif;font-size:40px;margin:4mm 0;border-bottom:2px solid #38BDF8;padding:0 10mm 2mm}
.desc{max-width:180mm;font-size:15px;line-height:1.6;color:#26355A}
.foot{margin-top:auto;width:100%;display:flex;justify-content:space-between;font-size:12.5px;color:#5B6885}.foot b{display:block;color:#0D1B3E;font-size:14px}
.bars{display:flex;gap:4px;align-items:flex-end;height:22px;margin:4mm auto 0}.bars span{width:10px;background:#38BDF8;border-radius:2px}
.no-print{position:fixed;top:12px;right:12px}.no-print button{font:600 14px 'Plus Jakarta Sans';background:#2563EB;color:#fff;border:0;border-radius:10px;padding:10px 16px;cursor:pointer}
@media print{body{background:#fff}.no-print{display:none}}
</style></head><body>
<div class="no-print"><button onclick="window.print()">Print / save as PDF</button></div>
<div class="page"><div class="frame">
<div class="brand">Maxi<b>career</b></div><div class="bars"><span style="height:25%"></span><span style="height:50%"></span><span style="height:75%"></span><span style="height:100%"></span></div>
<div class="kicker">${escapeHtml(c.program || 'Maxicareer')}</div>
<h1>${escapeHtml(c.title)}</h1>
<div class="to">This certifies that</div>
<div class="name">${escapeHtml(c.studentName)}</div>
<p class="desc">${escapeHtml(c.description || `has successfully completed the requirements of ${c.program}.`)}</p>
<div class="foot"><div><b>${escapeHtml(issued)}</b>Date of issue</div><div><b>${escapeHtml(c.issuedBy || 'Maxicareer')}</b>Issued by</div><div><b>${escapeHtml(c.certificateNo)}</b>Certificate no.</div></div>
</div></div></body></html>`);
  w.document.close();
}

export const MilestonesPage: React.FC = () => {
  const { me, state, curriculumProgress } = useStudent();
  const badges = useMemo(() => computeBadges({ me, state, curriculumProgress }), [me, state, curriculumProgress]);
  const earned = badges.filter((b) => b.earned);
  const certificates = [...state.certificates].sort((a, b) => b.issuedOn.localeCompare(a.issuedOn));

  // A timeline of things the student has achieved
  const timeline = [
    ...(state.studentRoadmap?.milestones.filter((m) => m.status === 'done').map((m) => ({ id: m.id, date: isoOf(m.due) || '', title: m.title, what: 'Roadmap milestone' })) || []),
    ...state.assessments.filter((a) => a.passed).map((a) => ({ id: a.id, date: isoOf(a.submittedAt || a.completionDate), title: `${a.assessmentName} · ${a.scorePercent}%`, what: 'Test passed' })),
    ...state.assignments.filter((a) => a.status === 'reviewed').map((a) => ({ id: a.id, date: isoOf(a.reviewedAt || a.submittedAt), title: a.title, what: `${a.kind} reviewed${a.grade ? ` · ${a.grade}` : ''}` })),
    ...certificates.map((c) => ({ id: c.id, date: c.issuedOn, title: c.title, what: 'Certificate' })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <PageHeader title="Milestones & certificates" description="Badges you've earned, milestones you've reached and certificates from Maxicareer." meta={`${earned.length} of ${badges.length} badges earned`} />

      <Panel title="Certificates" flush>
        {certificates.length === 0 ? (
          <Empty icon={Award} title="No certificates yet" body="Certificates are issued when you complete your program or pass a certified assessment." />
        ) : (
          <ul className="divide-y divide-[#EAEFF6]">
            {certificates.map((c) => (
              <li key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                <span className="h-11 w-11 rounded-[12px] bg-[#FDF1DC] text-[#94570A] flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold">{c.title}</div>
                  <div className="text-[12.5px] text-[#7A869E]">
                    {c.program} · issued {fmtDay(c.issuedOn)} · no. {c.certificateNo}
                  </div>
                </div>
                <Button size="sm" icon={Printer} onClick={() => printCertificate(c)}>
                  View & print
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div>
        <h2 className="mc-display text-[18px] font-semibold mb-3">Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {badges.map((b) => (
            <div key={b.id} className={cx('rounded-[14px] border p-4 bg-white', b.earned ? 'border-[#BFE6D5]' : 'border-[#DDE4EF]')}>
              <div className="flex items-center gap-3">
                <span className={cx('h-10 w-10 rounded-[11px] flex items-center justify-center shrink-0', b.earned ? 'bg-[#0D1B3E] text-[#38BDF8]' : 'bg-[#EEF2F7] text-[#9AA5BB]')}>
                  {b.earned ? <Trophy className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </span>
                <div className="min-w-0">
                  <div className={cx('text-[14px] font-semibold', !b.earned && 'text-[#5B6885]')}>{b.title}</div>
                  <div className="text-[12px] text-[#7A869E]">{b.earned ? 'Earned' : b.hint}</div>
                </div>
              </div>
              <p className="mt-2 text-[12.5px] text-[#5B6885]">{b.description}</p>
              {!b.earned && (
                <div className="mt-3 h-1.5 rounded-full bg-[#EEF2F7] overflow-hidden" role="progressbar" aria-valuenow={b.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${b.title} progress`}>
                  <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${b.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Panel title="Milestones reached" flush>
        {timeline.length === 0 ? (
          <Empty icon={Trophy} title="Your milestones will show here" body="Finished roadmap steps, passed tests and reviewed projects are listed as you reach them." />
        ) : (
          <ul className="divide-y divide-[#EAEFF6]">
            {timeline.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                <CheckCircle2 className="w-5 h-5 text-[#0F9F6E] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate">{t.title}</div>
                  <div className="text-[12.5px] text-[#7A869E]">{t.what}</div>
                </div>
                <span className="text-[12.5px] text-[#7A869E] shrink-0">{t.date ? fmtDay(t.date) : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};
