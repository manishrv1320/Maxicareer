import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, FileText, FolderKanban, Inbox, ListChecks, ListPlus, MessageSquare, Paperclip, Plus, Search, Send, AlarmClock, ExternalLink } from 'lucide-react';
import { PageHeader, Panel, Badge, Button, Empty, Segmented, Avatar, Modal, Field, Input, Select, Textarea, SearchInput, cx, Tone } from '../admin/ui';
import { timeAgo } from '../admin/lib';
import type { Assignment } from '../../types/portal';
import type { FollowUpTask } from '../../types/counselor';
import { pickFile, uploadFile } from '../../lib/api';
import { platformStore } from '../../services/careerPlatformStore';
import { FileLink, FormError, fmtDay, isoOf, relativeDay, todayIso, useAsyncAction } from '../workspace/kit';
import { useProvider, needsNotes } from './context';

/* ------------------------------------------------------------------ */
/* Pending tasks                                                       */
/* ------------------------------------------------------------------ */

/** One group in the pending queue; hidden when empty. */
const Section: React.FC<{ title: string; count: number; children: React.ReactNode; action?: React.ReactNode }> = ({ title, count, children, action }) =>
  count === 0 ? null : (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          {title} <Badge tone="marigold">{count}</Badge>
        </span>
      }
      actions={action}
      flush
    >
      <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">{children}</ul>
    </Panel>
  );

export const PendingPage: React.FC = () => {
  const { me, state, store, toast, go, requests, appointments, notes, tasks, writeNotes, chatWith, openMentee } = useProvider();
  const today = todayIso();
  const [todo, setTodo] = useState({ title: '', date: today });
  const { busy, error, run } = useAsyncAction();

  const pending = requests.filter((r) => r.status === 'pending');
  const toReview = state.assignments.filter((a) => a.status === 'submitted');
  const noted = new Set(notes.map((n) => n.appointmentId));
  const needNotes = appointments.filter((a) => needsNotes(a, noted, today));
  const overdue = tasks.filter((t) => t.status !== 'completed' && isoOf(t.dueDate) !== '' && isoOf(t.dueDate) < today);
  const unreadBy = state.students
    .map((s) => ({ s, n: state.messages.filter((m) => m.senderId === s.id && m.recipientId === me.id && !m.read).length }))
    .filter((x) => x.n > 0);
  const todos = state.calendarNotes.filter((n) => n.kind === 'task').sort((a, b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date));
  const openTodos = todos.filter((t) => !t.done);
  const total = pending.length + toReview.length + needNotes.length + overdue.length + unreadBy.length + openTodos.length;

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todo.title.trim()) return;
    const ok = await run(() => store.saveCalendarNote({ date: todo.date || today, title: todo.title.trim(), kind: 'task' }));
    if (ok) setTodo({ title: '', date: today });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Pending tasks" description="Everything waiting on you, in one queue, plus your own to-do list." meta={total ? `${total} open item${total > 1 ? 's' : ''}` : 'Nothing waiting'} />

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5 items-start">
        <div className="space-y-5">
          {total - openTodos.length === 0 && (
            <Panel>
              <Empty icon={Check} title="Nothing waiting on you" body="Requests, submissions, session notes, overdue mentee tasks and unread messages show up here." />
            </Panel>
          )}
          <Section title="Session requests to answer" count={pending.length} action={<Button size="sm" variant="ghost" onClick={() => go('sessions')}>Open</Button>}>
            {pending.map((r) => (
              <li key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3">
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-semibold">{r.studentName}</span>
                  <span className="block text-[12.5px] text-[#5B6885]">
                    {r.counselingType} · {fmtDay(r.preferredDate)} {r.preferredTime}
                  </span>
                </span>
                <span className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Check}
                    onClick={async () => {
                      if (await store.acceptCounselingRequest(r.id)) toast(`Session with ${r.studentName} confirmed.`);
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!window.confirm(`Decline ${r.studentName}'s request?`)) return;
                      await store.rejectCounselingRequest(r.id);
                      toast('Request declined.');
                    }}
                  >
                    Decline
                  </Button>
                </span>
              </li>
            ))}
          </Section>
          <Section title="Work to review" count={toReview.length} action={<Button size="sm" variant="ghost" onClick={() => go('assignments')}>Open</Button>}>
            {toReview.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <FolderKanban className="w-4 h-4 text-[#6D4AE0] shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-semibold truncate">{a.title}</span>
                  <span className="block text-[12.5px] text-[#5B6885]">
                    {a.kind} from {a.studentName} · {timeAgo(a.submittedAt)}
                  </span>
                </span>
                <Button size="sm" onClick={() => go('assignments')}>
                  Review
                </Button>
              </li>
            ))}
          </Section>
          <Section title="Sessions that need notes" count={needNotes.length}>
            {needNotes.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-semibold truncate">{a.studentName}</span>
                  <span className="block text-[12.5px] text-[#5B6885]">
                    {fmtDay(a.date)} · {a.topic || a.counselingType} · {a.status === 'scheduled' ? 'not marked complete' : 'completed, no notes'}
                  </span>
                </span>
                <Button size="sm" variant="primary" onClick={() => writeNotes(a)}>
                  Write notes
                </Button>
              </li>
            ))}
          </Section>
          <Section title="Overdue mentee tasks" count={overdue.length} action={<Button size="sm" variant="ghost" onClick={() => go('followups')}>Follow-ups</Button>}>
            {overdue.map((t) => {
              const s = state.students.find((x) => x.id === t.studentId);
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <AlarmClock className="w-4 h-4 text-[#B42F3B] shrink-0" />
                  <button type="button" onClick={() => openMentee(t.studentId)} className="flex-1 min-w-0 text-left">
                    <span className="block text-[13.5px] font-semibold truncate">{t.title}</span>
                    <span className="block text-[12.5px] text-[#5B6885]">
                      {s?.name || 'Mentee'} · due {fmtDay(t.dueDate)} ({relativeDay(t.dueDate)})
                    </span>
                  </button>
                  <Button size="sm" icon={MessageSquare} onClick={() => chatWith(t.studentId)}>
                    Nudge
                  </Button>
                </li>
              );
            })}
          </Section>
          <Section title="Unread messages" count={unreadBy.length}>
            {unreadBy.map(({ s, n }) => (
              <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={s.name} size={30} />
                <span className="flex-1 text-[13.5px] font-semibold">{s.name}</span>
                <Badge tone="marigold">{n} new</Badge>
                <Button size="sm" onClick={() => chatWith(s.id)}>
                  Reply
                </Button>
              </li>
            ))}
          </Section>
        </div>

        <Panel title="My to-do list" description="Private to you. Also shown on your calendar.">
          <form onSubmit={addTodo} className="flex flex-col sm:flex-row gap-2">
            <Input value={todo.title} onChange={(e) => setTodo({ ...todo, title: e.target.value })} placeholder="Prepare mock interview questions" aria-label="To-do" />
            <Input type="date" value={todo.date} onChange={(e) => setTodo({ ...todo, date: e.target.value })} className="sm:w-40" aria-label="Date" />
            <Button type="submit" variant="primary" icon={Plus} disabled={busy || !todo.title.trim()}>
              Add
            </Button>
          </form>
          <FormError message={error} />
          <ul className="mt-3 space-y-1.5">
            {todos.length === 0 && <li className="text-[13px] text-[#5B6885] py-2">No to-dos yet.</li>}
            {todos.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-[#F7F9FC]">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => store.saveCalendarNote({ id: t.id, date: t.date, time: t.time, title: t.title, note: t.note, kind: 'task', done: !t.done }).catch((err) => toast(err.message, 'error'))}
                  className="h-4 w-4 accent-[#0F9F6E]"
                  aria-label={`Done: ${t.title}`}
                />
                <span className={cx('flex-1 text-[13.5px]', t.done && 'line-through text-[#9AA5BB]')}>{t.title}</span>
                <span className={cx('text-[12px]', !t.done && t.date < today ? 'text-[#B42F3B] font-semibold' : 'text-[#7A869E]')}>{fmtDay(t.date, { day: 'numeric', month: 'short' })}</span>
                <button
                  type="button"
                  onClick={() => store.deleteCalendarNote(t.id).catch((err) => toast(err.message, 'error'))}
                  className="text-[12px] text-[#9AA5BB] hover:text-[#B42F3B]"
                  aria-label={`Delete ${t.title}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Session notes                                                       */
/* ------------------------------------------------------------------ */

export const NotesPage: React.FC = () => {
  const { state, notes, openMentee } = useProvider();
  const [q, setQ] = useState('');
  const [student, setStudent] = useState('all');
  const [open, setOpen] = useState<string | null>(null);
  const nameOf = (id: string) => state.students.find((s) => s.id === id)?.name || 'Student';
  const shown = [...notes]
    .sort((a, b) => isoOf(b.sessionDate).localeCompare(isoOf(a.sessionDate)))
    .filter((n) => (student === 'all' || n.studentId === student) && (!q || `${n.summary} ${n.counselingTopic} ${n.nextSteps} ${nameOf(n.studentId)}`.toLowerCase().includes(q.toLowerCase())));
  const studentsWithNotes = Array.from(new Set(notes.map((n) => n.studentId)));

  return (
    <div className="space-y-5">
      <PageHeader title="Session notes" description="Summaries you've shared after each session. Students see these on their dashboard." />
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search notes" className="sm:w-72" />
        <Select value={student} onChange={(e) => setStudent(e.target.value)} className="sm:w-56" aria-label="Student">
          <option value="all">All students</option>
          {studentsWithNotes.map((id) => (
            <option key={id} value={id}>
              {nameOf(id)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-3">
        {shown.length === 0 && (
          <Panel>
            <Empty icon={FileText} title={notes.length ? 'No notes match' : 'No session notes yet'} body="Complete a session from 1-on-1 sessions to write your first summary." />
          </Panel>
        )}
        {shown.map((n) => {
          const expanded = open === n.id;
          return (
            <article key={n.id} className="bg-white border border-[#DDE4EF] rounded-[14px]">
              <button type="button" onClick={() => setOpen(expanded ? null : n.id)} className="w-full flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-4 text-left">
                <span className="flex-1 min-w-0">
                  <span className="block text-[14.5px] font-semibold text-[#0D1B3E]">{n.counselingTopic}</span>
                  <span className="block text-[13px] text-[#5B6885] truncate">{n.summary}</span>
                </span>
                <span className="text-[12.5px] text-[#7A869E] shrink-0">
                  {nameOf(n.studentId)} · {fmtDay(n.sessionDate)}
                </span>
              </button>
              {expanded && (
                <div className="px-5 pb-5 space-y-3 text-[13.5px] text-[#26355A] border-t border-[#EAEFF6] pt-4">
                  <p>{n.summary}</p>
                  {n.keyDiscussionPoints?.length > 0 && (
                    <div>
                      <div className="text-[12.5px] font-semibold text-[#5B6885] mb-1">Discussed</div>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {n.keyDiscussionPoints.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {n.studentConcerns && (
                    <p>
                      <span className="font-semibold text-[#5B6885]">Concerns: </span>
                      {n.studentConcerns}
                    </p>
                  )}
                  {n.nextSteps && (
                    <p>
                      <span className="font-semibold text-[#5B6885]">Next steps: </span>
                      {n.nextSteps}
                    </p>
                  )}
                  {n.followUpDate && <Badge tone="mint">Follow up {fmtDay(n.followUpDate)}</Badge>}
                  <div>
                    <Button size="sm" variant="ghost" onClick={() => openMentee(n.studentId)}>
                      Open {nameOf(n.studentId)}
                    </Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Projects & assignments                                              */
/* ------------------------------------------------------------------ */

const WORK_STATUS: Record<Assignment['status'], { label: string; tone: Tone }> = {
  submitted: { label: 'To review', tone: 'marigold' },
  reviewed: { label: 'Reviewed', tone: 'mint' },
  changes_requested: { label: 'Changes requested', tone: 'rose' },
};

const ReviewModal: React.FC<{ item: Assignment | null; onClose: () => void }> = ({ item, onClose }) => {
  const { store, toast } = useProvider();
  const [form, setForm] = useState({ status: 'reviewed' as 'reviewed' | 'changes_requested', grade: '', feedback: '' });
  const { busy, error, setError, run } = useAsyncAction();

  useEffect(() => {
    if (item) {
      setForm({ status: item.status === 'changes_requested' ? 'changes_requested' : 'reviewed', grade: item.grade || '', feedback: item.feedback || '' });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const save = async () => {
    if (!item) return;
    if (form.status === 'changes_requested' && !form.feedback.trim()) return setError('Tell the student what to change.');
    const ok = await run(() => store.reviewAssignment(item.id, { status: form.status, grade: form.grade.trim() || undefined, feedback: form.feedback.trim() || undefined }));
    if (ok) {
      toast(`Feedback sent to ${item.studentName}.`);
      onClose();
    }
  };

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title="Review submission"
      description={item ? `${item.kind} from ${item.studentName} · ${timeAgo(item.submittedAt)}` : undefined}
      width="max-w-xl"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? 'Sending…' : 'Send feedback'}
          </Button>
        </>
      }
    >
      {item && (
        <div className="space-y-4">
          <FormError message={error} />
          <div className="rounded-[12px] bg-[#F7F9FC] p-4 space-y-2">
            <div className="text-[14.5px] font-semibold">{item.title}</div>
            {item.description && <p className="text-[13.5px] text-[#33415F] whitespace-pre-wrap">{item.description}</p>}
            <div className="flex flex-wrap gap-3">
              {item.fileId && <FileLink fileId={item.fileId} name={item.fileName} />}
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563EB] hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> Open link
                </a>
              )}
            </div>
          </div>
          <Segmented
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={[
              { value: 'reviewed', label: 'Approve' },
              { value: 'changes_requested', label: 'Ask for changes' },
            ]}
          />
          <Field label="Grade or score" hint="Optional, e.g. A, 8/10, Pass.">
            <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="max-w-[200px]" />
          </Field>
          <Field label="Feedback">
            <Textarea rows={4} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder="What worked, what to improve, what to do next." />
          </Field>
        </div>
      )}
    </Modal>
  );
};

export const AssignmentsPage: React.FC = () => {
  const { state, tasks, newTask, openMentee } = useProvider();
  const [view, setView] = useState<'review' | 'done' | 'waiting'>('review');
  const [reviewing, setReviewing] = useState<Assignment | null>(null);
  const work = [...state.assignments].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const toReview = work.filter((w) => w.status === 'submitted');
  const done = work.filter((w) => w.status !== 'submitted');
  const submittedTaskIds = new Set(work.map((w) => w.taskId).filter(Boolean));
  const waiting = tasks.filter((t) => t.status !== 'completed' && !submittedTaskIds.has(t.id));
  const list = view === 'review' ? toReview : done;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projects & assignments"
        description="Work your students submitted for review, and tasks still waiting for a submission."
        actions={
          <Button variant="primary" icon={ListPlus} onClick={() => newTask()}>
            New assignment
          </Button>
        }
      />
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'review', label: 'To review', count: toReview.length },
          { value: 'done', label: 'Reviewed', count: done.length },
          { value: 'waiting', label: 'Awaiting submission', count: waiting.length },
        ]}
      />
      {view === 'waiting' ? (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {waiting.length === 0 && <Empty icon={ListChecks} title="Nothing outstanding" body="Every open task has a submission." />}
          {waiting.map((t) => {
            const s = state.students.find((x) => x.id === t.studentId);
            const late = isoOf(t.dueDate) !== '' && isoOf(t.dueDate) < todayIso();
            return (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                <button type="button" onClick={() => openMentee(t.studentId)} className="flex-1 min-w-0 text-left">
                  <span className="block text-[14px] font-semibold truncate">{t.title}</span>
                  <span className="block text-[12.5px] text-[#5B6885]">{s?.name || 'Mentee'}</span>
                </button>
                {t.dueDate && <Badge tone={late ? 'rose' : 'neutral'}>{late ? 'Late · ' : 'Due '}{fmtDay(t.dueDate, { day: 'numeric', month: 'short' })}</Badge>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {list.length === 0 && <Empty icon={FolderKanban} title={view === 'review' ? 'Nothing to review' : 'No reviewed work yet'} body="Students submit projects and assignments from their portal." />}
          {list.map((w) => {
            const task = w.taskId ? tasks.find((t) => t.id === w.taskId) : undefined;
            return (
              <div key={w.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={w.kind === 'Project' ? 'violet' : 'blue'}>{w.kind}</Badge>
                    <span className="text-[14.5px] font-semibold">{w.title}</span>
                  </div>
                  <div className="text-[12.5px] text-[#5B6885] mt-0.5">
                    <button type="button" className="font-semibold hover:underline" onClick={() => openMentee(w.studentId)}>
                      {w.studentName}
                    </button>
                    {task ? ` · for "${task.title}"` : ''} · submitted {timeAgo(w.submittedAt)}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3">
                    {w.fileId && <FileLink fileId={w.fileId} name={w.fileName} />}
                    {w.link && (
                      <a href={w.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563EB] hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" /> Link
                      </a>
                    )}
                  </div>
                  {w.feedback && <p className="mt-1.5 text-[12.5px] text-[#5B6885]">Your feedback: {w.feedback}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={WORK_STATUS[w.status].tone}>
                    {WORK_STATUS[w.status].label}
                    {w.grade ? ` · ${w.grade}` : ''}
                  </Badge>
                  <Button size="sm" variant={w.status === 'submitted' ? 'primary' : 'secondary'} onClick={() => setReviewing(w)}>
                    {w.status === 'submitted' ? 'Review' : 'Edit review'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ReviewModal item={reviewing} onClose={() => setReviewing(null)} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Follow-ups                                                          */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS: { value: 'pending' | 'in_progress' | 'completed'; label: string }[] = [
  { value: 'pending', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Done' },
];

export const FollowUpsPage: React.FC = () => {
  const { state, store, tasks, notes, newTask, openMentee, chatWith } = useProvider();
  const today = todayIso();
  const [view, setView] = useState<'open' | 'overdue' | 'done'>('open');
  const nameOf = (id: string) => state.students.find((s) => s.id === id)?.name || 'Mentee';
  const isLate = (t: FollowUpTask) => t.status !== 'completed' && isoOf(t.dueDate) !== '' && isoOf(t.dueDate) < today;
  const open = tasks.filter((t) => t.status !== 'completed');
  const overdue = tasks.filter(isLate);
  const done = tasks.filter((t) => t.status === 'completed');
  const shown = (view === 'open' ? open : view === 'overdue' ? overdue : done).sort((a, b) => (isoOf(a.dueDate) || '9999').localeCompare(isoOf(b.dueDate) || '9999'));
  const followUpDates = notes.filter((n) => n.followUpDate && isoOf(n.followUpDate) >= today).sort((a, b) => isoOf(a.followUpDate).localeCompare(isoOf(b.followUpDate)));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Follow-ups"
        description="Tasks you've given your students and the follow-up dates from your session notes."
        actions={
          <Button variant="primary" icon={ListPlus} onClick={() => newTask()}>
            Assign task
          </Button>
        }
      />
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5 items-start">
        <div className="space-y-4">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'open', label: 'Open', count: open.length },
              { value: 'overdue', label: 'Overdue', count: overdue.length },
              { value: 'done', label: 'Done', count: done.length },
            ]}
          />
          <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
            {shown.length === 0 && <Empty icon={ListChecks} title={view === 'overdue' ? 'Nothing overdue' : view === 'done' ? 'Nothing completed yet' : 'No open tasks'} />}
            {shown.map((t) => (
              <div key={t.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold">{t.title}</span>
                    <Badge tone={t.priority === 'high' ? 'rose' : t.priority === 'medium' ? 'marigold' : 'neutral'}>{t.priority}</Badge>
                  </div>
                  <div className="text-[12.5px] text-[#5B6885]">
                    <button type="button" className="font-semibold hover:underline" onClick={() => openMentee(t.studentId)}>
                      {nameOf(t.studentId)}
                    </button>
                    {t.dueDate && <span className={cx(isLate(t) && 'text-[#B42F3B] font-semibold')}> · due {fmtDay(t.dueDate)}</span>}
                    {t.completedAt && ` · done ${t.completedAt}`}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Select
                    value={t.status === 'overdue' ? 'pending' : t.status}
                    onChange={(e) => store.updateTaskStatus(t.id, e.target.value as 'pending' | 'in_progress' | 'completed')}
                    className="h-8 w-36 text-[12.5px]"
                    aria-label={`Status of ${t.title}`}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                  {t.status !== 'completed' && (
                    <Button size="sm" variant="ghost" icon={MessageSquare} onClick={() => chatWith(t.studentId)}>
                      Nudge
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Panel title="Follow-up dates" description="From your session notes." flush>
          {followUpDates.length === 0 ? (
            <p className="px-5 pb-5 text-[13px] text-[#5B6885]">Add a follow-up date when you write session notes.</p>
          ) : (
            <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
              {followUpDates.map((n) => (
                <li key={n.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-semibold truncate">{nameOf(n.studentId)}</span>
                    <span className="block text-[12.5px] text-[#5B6885] truncate">{n.counselingTopic}</span>
                  </span>
                  <Badge tone="mint">{relativeDay(n.followUpDate) || fmtDay(n.followUpDate)}</Badge>
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
/* Chat                                                                */
/* ------------------------------------------------------------------ */

export const ChatPage: React.FC = () => {
  const { me, state, store, mentees, chatPartnerId, setChatPartnerId, openMentee } = useProvider();
  const [q, setQ] = useState('');
  const convo = (studentId: string) => `${studentId}_${me.id}`;
  const lastAt = (studentId: string) => [...state.messages].reverse().find((m) => m.conversationId === convo(studentId))?.createdAt || '';
  const contacts = [...mentees].sort((a, b) => lastAt(b.id).localeCompare(lastAt(a.id)) || a.name.localeCompare(b.name)).filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()));
  const partner = mentees.find((s) => s.id === chatPartnerId) || contacts[0] || null;
  const conversationId = partner ? convo(partner.id) : '';
  const thread = state.messages.filter((m) => m.conversationId === conversationId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId && thread.some((m) => m.recipientId === me.id && !m.read)) store.markConversationRead(conversationId);
    endRef.current?.scrollIntoView({ block: 'end' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, thread.length]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content || !partner) return;
    setSending(true);
    setText('');
    const sent = await store.sendMessage({ recipientId: partner.id, content });
    if (!sent) setText(content);
    setSending(false);
  };

  const attach = async () => {
    if (!partner) return;
    const file = await pickFile('image/*,.pdf,.doc,.docx,.pptx,.xlsx,.txt,.csv');
    if (!file) return;
    setSending(true);
    try {
      const up = await uploadFile(file, 'attachment');
      const sent = await store.sendMessage({ recipientId: partner.id, content: text.trim() || `Shared a file: ${up.name}`, attachment: { fileId: up.id, name: up.name } });
      if (sent) setText('');
    } catch (err) {
      platformStore.reportError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Chat" description="Message your students between sessions. Files up to 10 MB." />
      <section className="bg-white border border-[#DDE4EF] rounded-[14px] overflow-hidden grid grid-cols-1 lg:grid-cols-[300px_1fr] min-h-[560px]">
        <aside className="border-b lg:border-b-0 lg:border-r border-[#EAEFF6]">
          <div className="p-3 border-b border-[#EAEFF6]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C97AE]" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a student" className="pl-9 h-9" aria-label="Find a student" />
            </div>
          </div>
          {mentees.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-6 h-6 mx-auto text-[#9AA5BB]" />
              <p className="mt-2 text-[13px] text-[#5B6885]">You can chat with students once they book you or are assigned to you.</p>
            </div>
          ) : (
            <ul className="max-h-[220px] lg:max-h-[520px] overflow-y-auto">
              {contacts.map((s) => {
                const active = partner?.id === s.id;
                const last = [...state.messages].reverse().find((m) => m.conversationId === convo(s.id));
                const unread = state.messages.filter((m) => m.senderId === s.id && m.recipientId === me.id && !m.read).length;
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => setChatPartnerId(s.id)} className={cx('w-full flex items-center gap-3 px-4 py-3 text-left border-l-[3px]', active ? 'bg-[#F3F7FF] border-[#2563EB]' : 'border-transparent hover:bg-[#F7F9FC]')}>
                      {s.avatarUrl ? <img src={s.avatarUrl} alt="" className="h-10 w-10 rounded-[10px] object-cover shrink-0" /> : <Avatar name={s.name} size={40} />}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[13.5px] font-semibold truncate">{s.name}</span>
                          {unread > 0 && <span className="mc-num rounded-full bg-[#F2A93B] text-[#0D1B3E] text-[11px] font-semibold px-1.5">{unread}</span>}
                        </span>
                        <span className="block text-[12px] text-[#7A869E] truncate">{last ? last.content : 'No messages yet'}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
        <div className="flex flex-col min-h-[460px]">
          {partner ? (
            <>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-[#EAEFF6]">
                {partner.avatarUrl ? <img src={partner.avatarUrl} alt="" className="h-9 w-9 rounded-[10px] object-cover" /> : <Avatar name={partner.name} size={36} tone="blue" />}
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold truncate">{partner.name}</div>
                  <div className="text-[12px] text-[#7A869E] truncate">{partner.planName}</div>
                </div>
                <Button size="sm" className="ml-auto" onClick={() => openMentee(partner.id)}>
                  Profile
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[440px] bg-[#FBFCFE]">
                {thread.length === 0 && <p className="text-center text-[13px] text-[#7A869E] py-10">No messages with {partner.name.split(' ')[0]} yet.</p>}
                {thread.map((m) => {
                  const mine = m.senderId === me.id;
                  return (
                    <div key={m.id} className={cx('flex flex-col', mine ? 'items-end' : 'items-start')}>
                      <div className={cx('max-w-[80%] rounded-[14px] px-4 py-2.5 text-[14px] leading-relaxed', mine ? 'bg-[#2563EB] text-white rounded-br-[4px]' : 'bg-white border border-[#EAEFF6] rounded-bl-[4px]')}>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        {m.attachment && (
                          <a href={`/api/files/${m.attachment.fileId}?download=1`} target="_blank" rel="noopener noreferrer" className={cx('mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold underline', mine ? 'text-white' : 'text-[#2563EB]')}>
                            <Paperclip className="w-3.5 h-3.5" /> {m.attachment.name}
                          </a>
                        )}
                      </div>
                      <span className="mt-1 text-[11px] text-[#9AA5BB] flex items-center gap-1">
                        {m.timestamp}
                        {mine && m.read && <CheckCheck className="w-3 h-3 text-[#2563EB]" />}
                      </span>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="px-5 pt-2 flex flex-wrap gap-1.5">
                {['How did the task go?', 'Please share your updated resume before our next session.', 'Reminder: our session is coming up.'].map((c) => (
                  <button key={c} type="button" onClick={() => setText(c)} className="rounded-full border border-[#DDE4EF] px-2.5 py-1 text-[12px] text-[#33415F] hover:border-[#2563EB] hover:text-[#2563EB]">
                    {c}
                  </button>
                ))}
              </div>
              <form onSubmit={send} className="flex items-center gap-2 p-4">
                <button type="button" onClick={attach} disabled={sending} className="h-10 w-10 shrink-0 rounded-[10px] border border-[#D3DBE8] flex items-center justify-center text-[#5B6885] hover:text-[#2563EB] hover:border-[#2563EB] disabled:opacity-50" aria-label="Attach a file">
                  <Paperclip className="w-4 h-4" />
                </button>
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${partner.name.split(' ')[0]}…`} aria-label="Message" />
                <Button type="submit" variant="primary" icon={Send} disabled={sending || !text.trim()}>
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Empty icon={Inbox} title="No conversations yet" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
