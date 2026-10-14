import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Appointment } from '../../types/counselor';
import type { ResourceItem } from '../../types/portal';
import type { UploadedFile } from '../../lib/api';
import { Button, Field, Input, Modal, Select, Textarea, IconButton } from '../admin/ui';
import { FilePicker, FormError, fmtDay, fmtTime, todayIso, useAsyncAction, isMeetingLink, MEETING_LINK_HELP } from '../workspace/kit';
import { useProvider } from './context';

/* ------------------------------------------------------------------ */
/* Paste the video link for one session                                */
/* ------------------------------------------------------------------ */

export const MeetingLinkModal: React.FC<{ appointment: Appointment | null; onClose: () => void }> = ({ appointment, onClose }) => {
  const { store, toast, me, go } = useProvider();
  const [link, setLink] = useState('');
  const { busy, error, setError, run } = useAsyncAction();

  useEffect(() => {
    if (appointment) {
      setLink(appointment.meetingLink || me.meetingLink || '');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id]);

  const save = async (value: string) => {
    if (!appointment) return;
    if (value && !isMeetingLink(value)) return setError(MEETING_LINK_HELP);
    if (await run(() => store.setAppointmentLink(appointment.id, value))) {
      toast(value ? `Link shared with ${appointment.studentName}.` : 'Meeting link removed.');
      onClose();
    }
  };

  return (
    <Modal
      open={!!appointment}
      onClose={onClose}
      title={appointment?.meetingLink ? 'Change meeting link' : 'Add meeting link'}
      description={appointment ? `${appointment.studentName} · ${fmtDay(appointment.date)} at ${fmtTime(appointment.time)}` : undefined}
      footer={
        <>
          {appointment?.meetingLink && (
            <Button variant="ghost" onClick={() => save('')} disabled={busy} className="mr-auto">
              Remove link
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => save(link.trim())} disabled={busy || !link.trim()}>
            {busy ? 'Saving…' : 'Save & notify student'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (link.trim()) save(link.trim());
        }}
      >
        <FormError message={error} />
        <Field label="Meeting link" hint="Google Meet, Zoom, Microsoft Teams or any other video-call link.">
          <Input type="url" inputMode="url" autoFocus value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" />
        </Field>
        {me.meetingLink && link.trim() !== me.meetingLink && (
          <button type="button" onClick={() => setLink(me.meetingLink || '')} className="text-[12.5px] font-semibold text-[#2563EB] hover:underline">
            Use my personal link
          </button>
        )}
        <p className="text-[13px] text-[#5B6885]">
          {appointment?.studentName || 'The student'} gets a notification and a Join button for this session.
          {!me.meetingLink && (
            <>
              {' '}
              To skip this step next time, save a personal link on{' '}
              <button
                type="button"
                className="font-semibold text-[#2563EB] hover:underline"
                onClick={() => {
                  onClose();
                  go('availability');
                }}
              >
                Availability
              </button>
              .
            </>
          )}
        </p>
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Complete a session and write notes                                  */
/* ------------------------------------------------------------------ */

export const SessionNotesModal: React.FC<{ appointment: Appointment | null; onClose: () => void }> = ({ appointment, onClose }) => {
  const { store, toast } = useProvider();
  const blank = { summary: '', points: '', concerns: '', nextSteps: '', followUpDate: '' };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appointment) {
      setForm(blank);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id]);

  const save = async () => {
    if (!appointment) return;
    if (!form.summary.trim()) return setError('Add a short summary of the session.');
    setBusy(true);
    const note = await store.completeSession(appointment.id, {
      summary: form.summary.trim(),
      keyDiscussionPoints: form.points.split('\n').map((p) => p.trim()).filter(Boolean),
      studentConcerns: form.concerns.trim(),
      recommendations: '',
      nextSteps: form.nextSteps.trim(),
      followUpDate: form.followUpDate || undefined,
    });
    setBusy(false);
    if (note) {
      toast(`Notes saved and shared with ${appointment.studentName}.`);
      onClose();
    }
  };

  return (
    <Modal
      open={!!appointment}
      onClose={onClose}
      title="Session notes"
      description={appointment ? `${appointment.studentName} · ${appointment.topic || appointment.counselingType} · ${fmtDay(appointment.date)}` : undefined}
      width="max-w-2xl"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : appointment?.status === 'completed' ? 'Save notes' : 'Complete session & save notes'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormError message={error} />
        <p className="text-[13px] text-[#5B6885]">The student sees the summary, discussion points and next steps on their dashboard.</p>
        <Field label="Summary">
          <Textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="What you covered and where the student stands now." />
        </Field>
        <Field label="Key discussion points" hint="One per line.">
          <Textarea rows={3} value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} placeholder={'Shortlisted 3 target roles\nReviewed resume draft'} />
        </Field>
        <Field label="Student concerns">
          <Textarea rows={2} value={form.concerns} onChange={(e) => setForm({ ...form, concerns: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4">
          <Field label="Next steps">
            <Textarea rows={2} value={form.nextSteps} onChange={(e) => setForm({ ...form, nextSteps: e.target.value })} placeholder="What the student should do before the next session." />
          </Field>
          <Field label="Follow-up date" hint="Optional">
            <Input type="date" min={todayIso()} value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
          </Field>
        </div>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Assign a task or assignment                                         */
/* ------------------------------------------------------------------ */

export const TaskModal: React.FC<{ open: boolean; studentId?: string; onClose: () => void }> = ({ open, studentId, onClose }) => {
  const { store, me, mentees, toast } = useProvider();
  const blank = { studentId: studentId || '', title: '', description: '', dueDate: '', priority: 'medium' as 'low' | 'medium' | 'high', upload: true };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...blank, studentId: studentId || mentees[0]?.id || '' });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId]);

  const save = async () => {
    if (!form.studentId) return setError('Choose a mentee.');
    if (!form.title.trim()) return setError('Give the task a title.');
    setBusy(true);
    const description = [form.description.trim(), form.upload ? 'Submit your work from Tasks & assignments in your portal.' : ''].filter(Boolean).join('\n\n');
    const task = await store.addFollowUpTask({
      studentId: form.studentId,
      counselorId: me.id,
      counselorName: me.name,
      title: form.title.trim(),
      description,
      dueDate: form.dueDate,
      priority: form.priority,
    });
    setBusy(false);
    if (task) {
      toast(`Task sent to ${mentees.find((m) => m.id === form.studentId)?.name || 'your mentee'}.`);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign a task"
      description="It appears in the student's Tasks & assignments and on their calendar."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy || mentees.length === 0}>
            {busy ? 'Sending…' : 'Assign task'}
          </Button>
        </>
      }
    >
      {mentees.length === 0 ? (
        <p className="text-[13.5px] text-[#5B6885]">You'll be able to assign tasks once a student books you or an admin assigns one to you.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormError message={error} />
          <Field label="Mentee" className="sm:col-span-2">
            <Select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              {mentees.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Build a one-page portfolio case study" />
          </Field>
          <Field label="Instructions" className="sm:col-span-2">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Due date">
            <Input type="date" min={todayIso()} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
          <label className="sm:col-span-2 flex items-center gap-2.5 text-[13.5px] text-[#26355A]">
            <input type="checkbox" checked={form.upload} onChange={(e) => setForm({ ...form, upload: e.target.checked })} className="h-4 w-4 accent-[#2563EB]" />
            Ask the student to upload their work (assignment)
          </label>
        </div>
      )}
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Add a curriculum module for one mentee                              */
/* ------------------------------------------------------------------ */

type LessonDraft = { key: number; title: string; duration: string; type: string; url: string };

export const ModuleModal: React.FC<{ studentId: string | null; onClose: () => void }> = ({ studentId, onClose }) => {
  const { store, mentees, toast } = useProvider();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weeks, setWeeks] = useState('');
  const [lessons, setLessons] = useState<LessonDraft[]>([]);
  const { busy, error, setError, run } = useAsyncAction();
  const student = mentees.find((m) => m.id === studentId);

  useEffect(() => {
    if (studentId) {
      setTitle('');
      setDescription('');
      setWeeks('');
      setLessons([{ key: Date.now(), title: '', duration: '', type: 'Lesson', url: '' }]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const save = async () => {
    if (!studentId) return;
    const ok = await run(() =>
      store.assignCurriculumModule({
        studentId,
        title: title.trim(),
        description: description.trim(),
        weeks: weeks.trim() || undefined,
        lessons: lessons.filter((l) => l.title.trim()).map(({ title, duration, type, url }) => ({ title: title.trim(), duration, type, url: url.trim() || undefined })),
      })
    );
    if (ok) {
      toast(`Module added to ${student?.name || 'the student'}'s syllabus.`);
      onClose();
    }
  };

  const patch = (key: number, p: Partial<LessonDraft>) => setLessons((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));

  return (
    <Modal
      open={!!studentId}
      onClose={onClose}
      title="Add a syllabus module"
      description={student ? `Only ${student.name} sees this module, under Curriculum & syllabus.` : undefined}
      width="max-w-2xl"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Add module'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormError message={error} />
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-4">
          <Field label="Module title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Product case interviews" />
          </Field>
          <Field label="When" hint="Optional">
            <Input value={weeks} onChange={(e) => setWeeks(e.target.value)} placeholder="Weeks 5–6" />
          </Field>
        </div>
        <Field label="Description">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-[#26355A]">Lessons</span>
            <Button size="sm" icon={Plus} onClick={() => setLessons((ls) => [...ls, { key: Date.now(), title: '', duration: '', type: 'Lesson', url: '' }])}>
              Add lesson
            </Button>
          </div>
          <div className="space-y-2">
            {lessons.map((l, i) => (
              <div key={l.key} className="rounded-[12px] border border-[#DDE4EF] p-3 grid grid-cols-1 sm:grid-cols-[1fr_110px_120px_32px] gap-2 items-start">
                <Input value={l.title} onChange={(e) => patch(l.key, { title: e.target.value })} placeholder={`Lesson ${i + 1} title`} aria-label={`Lesson ${i + 1} title`} />
                <Input value={l.duration} onChange={(e) => patch(l.key, { duration: e.target.value })} placeholder="45 mins" aria-label="Duration" />
                <Select value={l.type} onChange={(e) => patch(l.key, { type: e.target.value })} aria-label="Type">
                  {['Lesson', 'Video', 'Reading', 'Exercise', '1:1 Review', 'Assessment'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
                <IconButton icon={Trash2} tone="danger" label="Remove lesson" onClick={() => setLessons((ls) => ls.filter((x) => x.key !== l.key))} />
                <Input className="sm:col-span-3" value={l.url} onChange={(e) => patch(l.key, { url: e.target.value })} placeholder="Link to material (optional)" aria-label="Link" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Share a resource with one mentee                                    */
/* ------------------------------------------------------------------ */

export const ResourceModal: React.FC<{ studentId: string | null; onClose: () => void }> = ({ studentId, onClose }) => {
  const { store, mentees, toast } = useProvider();
  const [form, setForm] = useState({ title: '', description: '', kind: 'Guide' as ResourceItem['kind'], url: '' });
  const [file, setFile] = useState<UploadedFile | null>(null);
  const { busy, error, setError, run } = useAsyncAction();
  const student = mentees.find((m) => m.id === studentId);

  useEffect(() => {
    if (studentId) {
      setForm({ title: '', description: '', kind: 'Guide', url: '' });
      setFile(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const save = async () => {
    if (!studentId) return;
    const ok = await run(() =>
      store.shareResource({ studentId, title: form.title.trim(), description: form.description.trim(), kind: form.kind, url: form.url.trim() || undefined, fileId: file?.id, fileName: file?.name })
    );
    if (ok) {
      toast(`Shared with ${student?.name || 'the student'}.`);
      onClose();
    }
  };

  return (
    <Modal
      open={!!studentId}
      onClose={onClose}
      title="Share a resource"
      description={student ? `${student.name} will find it under Resources.` : undefined}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? 'Sharing…' : 'Share'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormError message={error} />
        <Field label="Title" className="sm:col-span-2">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ATS resume template" />
        </Field>
        <Field label="Type">
          <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ResourceItem['kind'] })}>
            {(['Guide', 'Template', 'Video', 'Link', 'Worksheet'] as const).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </Field>
        <Field label="Link">
          <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="Or upload a file" className="sm:col-span-2">
          <FilePicker value={file} onChange={setFile} onError={(m) => setError(m)} />
        </Field>
        <Field label="Note for the student" className="sm:col-span-2">
          <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
};
