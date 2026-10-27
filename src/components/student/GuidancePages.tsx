import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BellPlus,
  CalendarClock,
  CalendarPlus,
  CheckCheck,
  Clock,
  MapPin,
  MessageCircle,
  MessageSquare,
  Paperclip,
  PartyPopper,
  Send,
  ShieldCheck,
  Star,
  Video,
} from 'lucide-react';
import { PageHeader, Panel, Button, Badge, Empty, Segmented, Stat, Field, Input, Select, Textarea, Modal, Avatar, cx, Tone } from '../admin/ui';
import { useStudent, Provider } from './context';
import { CalendarBoard, CalendarItem, notesToItems } from '../workspace/CalendarBoard';
import { RescheduleModal } from '../workspace/RescheduleModal';
import { FormError, StarRating, fmtDay, fmtTime, isoOf, relativeDay, todayIso, useAsyncAction, to24h } from '../workspace/kit';
import { uploadFile, pickFile } from '../../lib/api';
import { platformStore } from '../../services/careerPlatformStore';
import type { Appointment } from '../../types/counselor';
import type { AdminMeeting, PlatformEvent } from '../../types/portal';

/** Shown where the Join button will appear once the counsellor, mentor or admin pastes a link. */
const LinkPending: React.FC = () => (
  <span className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-[#F3F6FB] px-3 text-[12.5px] text-[#5B6885]" title="You'll get a notification when the link is added.">
    <Clock className="w-3.5 h-3.5" /> Link will be shared soon
  </span>
);

/* ------------------------------------------------------------------ */
/* Meeting with the admin team                                         */
/* ------------------------------------------------------------------ */

export const AdminMeetingModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { store, toast, go } = useStudent();
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: tomorrow, time: '11:00', mode: 'Video call' as AdminMeeting['mode'], topic: '', notes: '' });
  const { busy, error, setError, run } = useAsyncAction();
  useEffect(() => {
    if (open) {
      setForm({ date: tomorrow, time: '11:00', mode: 'Video call', topic: '', notes: '' });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Meet the admin team"
      description="For enrolment, payments, changing your mentor or anything else. We confirm by notification."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || !form.topic.trim()}
            onClick={async () => {
              if (await run(() => store.requestAdminMeeting(form))) {
                toast('Meeting requested. It is now in your sessions.');
                onClose();
                go('sessions');
              }
            }}
          >
            {busy ? 'Sending…' : 'Request meeting'}
          </Button>
        </>
      }
    >
      <div className="mc-admin space-y-4">
        <FormError message={error} />
        <Field label="What is it about?">
          <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Change my mentor / payment query / program extension" autoFocus />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Date">
            <Input type="date" min={todayIso()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Time">
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </Field>
          <Field label="How">
            <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as AdminMeeting['mode'] })}>
              <option>Video call</option>
              <option>Phone</option>
              <option>In person</option>
            </Select>
          </Field>
        </div>
        <Field label="Details (optional)">
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
        </Field>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Rate a session                                                      */
/* ------------------------------------------------------------------ */

const RateSessionModal: React.FC<{ appointment: Appointment | null; onClose: () => void }> = ({ appointment, onClose }) => {
  const { store, toast } = useStudent();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { busy, error, setError, run } = useAsyncAction();
  useEffect(() => {
    setRating(5);
    setComment('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id]);
  return (
    <Modal
      open={!!appointment}
      onClose={onClose}
      title="Rate this session"
      description={appointment ? `${appointment.topic || appointment.counselingType} with ${appointment.counselorName}, ${appointment.date}` : ''}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy}
            onClick={async () => {
              if (!appointment) return;
              if (await run(() => store.submitFeedback({ about: 'Session', rating, comment, targetId: appointment.counselorId, appointmentId: appointment.id }))) {
                toast('Thanks for the feedback!');
                onClose();
              }
            }}
          >
            {busy ? 'Sending…' : 'Send rating'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormError message={error} />
        <StarRating value={rating} onChange={setRating} size={30} />
        <Field label="Anything to add? (optional)">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="What helped most? What could be better?" />
        </Field>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Sessions & proctoring summary                                       */
/* ------------------------------------------------------------------ */

const DateBlock: React.FC<{ date: string; muted?: boolean }> = ({ date, muted }) => {
  const d = new Date(`${isoOf(date)}T00:00:00`);
  const ok = !Number.isNaN(d.getTime());
  return (
    <span className={cx('w-14 shrink-0 rounded-[11px] border text-center py-1.5', muted ? 'border-[#EAEFF6] bg-[#F7F9FC]' : 'border-[#C8D8F8] bg-[#F3F7FF]')}>
      <span className="block text-[11px] font-semibold uppercase text-[#5B6885]">{ok ? d.toLocaleDateString('en-IN', { month: 'short' }) : '—'}</span>
      <span className="mc-display mc-num block text-[20px] font-semibold leading-tight">{ok ? d.getDate() : '?'}</span>
    </span>
  );
};

type Row =
  | { type: 'apt'; id: string; date: string; sort: string; item: Appointment }
  | { type: 'admin'; id: string; date: string; sort: string; item: AdminMeeting };

export const SessionsPage: React.FC = () => {
  const { state, store, mentor, counselor, providers, canBookWith, openBooking, openAdminMeeting, chatWith, toast } = useStudent();
  const [view, setView] = useState<'upcoming' | 'history' | 'requests'>('upcoming');
  const [rating, setRating] = useState<Appointment | null>(null);
  const [moving, setMoving] = useState<Appointment | null>(null);
  const today = todayIso();

  const appointments = state.appointments;
  // A scheduled session whose day has passed is waiting for its notes; it belongs in history.
  const scheduled = appointments.filter((a) => a.status === 'scheduled' && isoOf(a.date) >= today);
  const overdue = appointments.filter((a) => a.status === 'scheduled' && isoOf(a.date) < today);
  const completed = appointments.filter((a) => a.status === 'completed');
  const requests = state.counselingRequests.filter((r) => r.status === 'pending' || r.status === 'rejected').sort((a, b) => b.requestDate.localeCompare(a.requestDate));
  const adminUpcoming = state.adminMeetings.filter((m) => m.status === 'Upcoming');
  const adminPast = state.adminMeetings.filter((m) => m.status !== 'Upcoming');
  const rated = new Set(state.feedback.map((f) => f.appointmentId).filter(Boolean));

  const upcomingRows: Row[] = [
    ...scheduled.map((a) => ({ type: 'apt' as const, id: a.id, date: a.date, sort: `${isoOf(a.date)} ${to24h(a.time)}`, item: a })),
    ...adminUpcoming.map((m) => ({ type: 'admin' as const, id: m.id, date: m.date, sort: `${m.date} ${m.time}`, item: m })),
  ].sort((a, b) => a.sort.localeCompare(b.sort));
  const historyRows: Row[] = [
    ...[...appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled'), ...overdue].map((a) => ({ type: 'apt' as const, id: a.id, date: a.date, sort: `${isoOf(a.date)} ${to24h(a.time)}`, item: a })),
    ...adminPast.map((m) => ({ type: 'admin' as const, id: m.id, date: m.date, sort: `${m.date} ${m.time}`, item: m })),
  ].sort((a, b) => b.sort.localeCompare(a.sort));

  // Proctors: assigned mentor and counsellor, anyone else met, and the admin team.
  const proctors: (Provider & { role: string })[] = [];
  if (mentor) proctors.push({ ...mentor, role: 'Mentor' });
  if (counselor) proctors.push({ ...counselor, role: 'Counsellor' });
  providers.filter((p) => p.id !== mentor?.id && p.id !== counselor?.id && appointments.some((a) => a.counselorId === p.id)).forEach((p) => proctors.push({ ...p, role: p.kind === 'mentor' ? 'Mentor' : 'Counsellor' }));
  const summaryFor = (id: string) => {
    const mine = appointments.filter((a) => a.counselorId === id);
    const done = mine.filter((a) => a.status === 'completed').map((a) => isoOf(a.date)).sort();
    const next = mine.filter((a) => a.status === 'scheduled' && isoOf(a.date) >= today).sort((a, b) => isoOf(a.date).localeCompare(isoOf(b.date)))[0];
    return { total: mine.length, done: done.length, last: done[done.length - 1], next };
  };

  const rowView = (r: Row, past: boolean) => {
    if (r.type === 'admin') {
      const m = r.item;
      return (
        <li key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <DateBlock date={m.date} muted={past} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14.5px] font-semibold">{m.topic}</span>
                <Badge tone="ink">Admin team</Badge>
                {past && <Badge tone={m.status === 'Completed' ? 'mint' : 'rose'}>{m.status}</Badge>}
              </div>
              <div className="text-[12.5px] text-[#5B6885]">
                {fmtTime(m.time)} · {m.mode}
                {!past && ` · ${relativeDay(m.date)}`}
              </div>
              {m.notes && <p className="text-[12.5px] text-[#7A869E] mt-0.5">{m.notes}</p>}
            </div>
          </div>
          {!past && (
            <div className="flex gap-2 shrink-0">
              {m.meetingLink ? (
                <a href={m.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-[#2563EB] px-3 text-[12.5px] font-semibold text-white hover:bg-[#1D4FD7]">
                  <Video className="w-3.5 h-3.5" /> Join
                </a>
              ) : (
                m.mode === 'Video call' && <LinkPending />
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!window.confirm('Cancel this meeting with the admin team?')) return;
                  try {
                    await store.cancelAdminMeeting(m.id);
                    toast('Meeting cancelled.');
                  } catch (err) {
                    toast(err instanceof Error ? err.message : 'Could not cancel.', 'error');
                  }
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </li>
      );
    }
    const a = r.item;
    const note = state.sessionNotes.find((n) => n.appointmentId === a.id);
    return (
      <li key={r.id} className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <DateBlock date={a.date} muted={past} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14.5px] font-semibold">{a.topic || a.counselingType}</span>
                {past && (
                  <Badge tone={a.status === 'completed' ? 'mint' : a.status === 'scheduled' ? 'marigold' : 'rose'}>
                    {a.status === 'completed' ? 'Completed' : a.status === 'scheduled' ? 'Awaiting notes' : 'Cancelled'}
                  </Badge>
                )}
              </div>
              <div className="text-[12.5px] text-[#5B6885]">
                {a.time} · {a.counselingType} with {a.counselorName}
                {!past && ` · ${relativeDay(a.date)}`}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {!past &&
              (a.meetingLink ? (
                <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-[#2563EB] px-3 text-[12.5px] font-semibold text-white hover:bg-[#1D4FD7]">
                  <Video className="w-3.5 h-3.5" /> Join call
                </a>
              ) : (
                <LinkPending />
              ))}
            {!past && (
              <Button size="sm" icon={CalendarClock} onClick={() => setMoving(a)}>
                Reschedule
              </Button>
            )}
            <Button size="sm" icon={MessageSquare} onClick={() => chatWith(a.counselorId)}>
              Message
            </Button>
            {past && a.status === 'completed' && !rated.has(a.id) && (
              <Button size="sm" icon={Star} onClick={() => setRating(a)}>
                Rate
              </Button>
            )}
          </div>
        </div>
        {past && note && (
          <div className="mt-3 ml-[68px] rounded-[12px] bg-[#F7F9FC] border border-[#EAEFF6] px-4 py-3 text-[13px] space-y-1.5">
            <p>
              <span className="font-semibold">Summary: </span>
              {note.summary}
            </p>
            {note.keyDiscussionPoints?.length > 0 && (
              <ul className="list-disc pl-5 text-[#33415F]">
                {note.keyDiscussionPoints.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            )}
            {note.nextSteps && (
              <p>
                <span className="font-semibold">Next steps: </span>
                {note.nextSteps}
              </p>
            )}
            {note.followUpDate && <p className="text-[#94570A] font-semibold">Follow-up: {note.followUpDate}</p>}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="1-on-1 sessions & consultations"
        description="Book your mentor, counsellor or the admin team, join calls, and read the notes from every meeting."
        actions={
          <>
            <Button icon={ShieldCheck} onClick={openAdminMeeting}>
              Meet admin team
            </Button>
            {(mentor || counselor) && (
              <Button variant="primary" icon={CalendarPlus} onClick={() => openBooking(mentor?.id || counselor?.id)}>
                Book a session
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Upcoming" value={upcomingRows.length} onClick={() => setView('upcoming')} />
        <Stat label="Completed" value={completed.length} onClick={() => setView('history')} />
        <Stat label="Awaiting confirmation" value={requests.filter((r) => r.status === 'pending').length} onClick={() => setView('requests')} />
        <Stat label="Session notes" value={state.sessionNotes.length} onClick={() => setView('history')} />
      </div>

      <Panel title="Proctoring summary" description="Your meeting history and what's next with each of your proctors.">
        {proctors.length === 0 && state.adminMeetings.length === 0 ? (
          <p className="text-[13px] text-[#5B6885]">Once a mentor or counsellor is assigned, or you book a session, a summary of your meetings appears here.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {proctors.map((p) => {
              const s = summaryFor(p.id);
              return (
                <div key={p.id} className="rounded-[12px] border border-[#EAEFF6] p-4">
                  <div className="flex items-center gap-3">
                    {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="h-10 w-10 rounded-[10px] object-cover" /> : <Avatar name={p.name} size={40} />}
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold truncate">{p.name}</div>
                      <div className="text-[12px] text-[#7A869E]">{p.role}</div>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-[9px] bg-[#F3F6FB] py-1.5">
                      <dd className="mc-num text-[15px] font-semibold">{s.done}</dd>
                      <dt className="text-[11px] text-[#5B6885]">Met</dt>
                    </div>
                    <div className="rounded-[9px] bg-[#F3F6FB] py-1.5 col-span-2">
                      <dd className="text-[13px] font-semibold truncate px-1">{s.last ? fmtDay(s.last) : 'Not yet'}</dd>
                      <dt className="text-[11px] text-[#5B6885]">Last meeting</dt>
                    </div>
                  </dl>
                  <div className="mt-3 text-[12.5px]">
                    {s.next ? (
                      <span className="text-[#1D4FD7] font-semibold">
                        Next: {fmtDay(s.next.date, { weekday: 'short', day: 'numeric', month: 'short' })}, {s.next.time}
                      </span>
                    ) : (
                      <span className="text-[#7A869E]">No meeting booked</span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => chatWith(p.id)}>
                      Message
                    </Button>
                    {canBookWith(p.id) && (
                      <Button size="sm" variant="primary" className="flex-1" onClick={() => openBooking(p.id)}>
                        Book
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {state.adminMeetings.length > 0 && (
              <div className="rounded-[12px] border border-[#EAEFF6] p-4">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-[10px] bg-[#0D1B3E] text-white flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold">Admin team</div>
                    <div className="text-[12px] text-[#7A869E]">Maxicareer</div>
                  </div>
                </div>
                <div className="mt-3 text-[12.5px] text-[#5B6885]">
                  {state.adminMeetings.filter((m) => m.status === 'Completed').length} met · {adminUpcoming.length} upcoming
                </div>
                <Button size="sm" variant="primary" className="mt-3 w-full" onClick={openAdminMeeting}>
                  Request a meeting
                </Button>
              </div>
            )}
          </div>
        )}
      </Panel>

      <div className="space-y-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'upcoming', label: 'Upcoming', count: upcomingRows.length },
            { value: 'history', label: 'Meeting history', count: historyRows.length },
            { value: 'requests', label: 'Requests', count: requests.length },
          ]}
        />
        <Panel flush>
          {view === 'requests' ? (
            requests.length === 0 ? (
              <Empty icon={Clock} title="No open requests" body="Requests you send appear here until the mentor or counsellor confirms them." />
            ) : (
              <ul className="divide-y divide-[#EAEFF6]">
                {requests.map((r) => (
                  <li key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[14.5px] font-semibold">
                        {r.counselingType} with {r.counselorName}
                      </div>
                      <div className="text-[12.5px] text-[#5B6885]">
                        Asked for {r.preferredDate}, {r.preferredTime} · sent {r.requestDate}
                      </div>
                    </div>
                    {r.status === 'pending' ? (
                      <Badge tone="marigold" dot>
                        Waiting for confirmation
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge tone="rose">Declined</Badge>
                        {canBookWith(r.counselorId) && (
                          <Button size="sm" onClick={() => openBooking(r.counselorId)}>
                            Pick another time
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )
          ) : (view === 'upcoming' ? upcomingRows : historyRows).length === 0 ? (
            <Empty
              icon={Video}
              title={view === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet'}
              body={
                view === 'history'
                  ? 'Notes and next steps from each meeting will be kept here.'
                  : mentor || counselor
                    ? 'Pick a time with your mentor or counsellor. Once they confirm and share the meeting link, a Join button appears here.'
                    : 'Once the Maxicareer team assigns your mentor and counsellor, you can book sessions with them here. Meanwhile you can request a meeting with the admin team.'
              }
              action={
                view === 'upcoming' &&
                (mentor || counselor) && (
                  <Button variant="primary" icon={CalendarPlus} onClick={() => openBooking(mentor?.id || counselor?.id)}>
                    Book a session
                  </Button>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-[#EAEFF6]">{(view === 'upcoming' ? upcomingRows : historyRows).map((r) => rowView(r, view === 'history'))}</ul>
          )}
        </Panel>
      </div>
      <RateSessionModal appointment={rating} onClose={() => setRating(null)} />
      <RescheduleModal
        appointment={moving}
        provider={(moving && [...state.counselors, ...state.mentors].find((p) => p.id === moving.counselorId)) || null}
        onClose={() => setMoving(null)}
        onDone={(message) => toast(message)}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

export const CalendarPage: React.FC = () => {
  const { state, me, toast } = useStudent();
  const items = useMemo<CalendarItem[]>(() => {
    const out: CalendarItem[] = [];
    state.appointments.forEach((a) => {
      const date = isoOf(a.date);
      if (!date || a.status === 'cancelled') return;
      out.push({ id: `apt-${a.id}`, date, time: a.time, title: a.topic || a.counselingType, subtitle: `with ${a.counselorName}${a.status === 'completed' ? ' · completed' : ''}`, kind: 'session', link: a.status === 'scheduled' && date >= todayIso() ? a.meetingLink : undefined });
    });
    state.counselingRequests
      .filter((r) => r.status === 'pending')
      .forEach((r) => {
        const date = isoOf(r.preferredDate);
        if (date) out.push({ id: `req-${r.id}`, date, time: r.preferredTime, title: `${r.counselingType} (requested)`, subtitle: `with ${r.counselorName} · awaiting confirmation`, kind: 'session' });
      });
    state.adminMeetings
      .filter((m) => m.status !== 'Cancelled')
      .forEach((m) => out.push({ id: `adm-${m.id}`, date: m.date, time: m.time, title: m.topic, subtitle: 'with the admin team', kind: 'session', link: m.status === 'Upcoming' ? m.meetingLink : undefined }));
    state.followUpTasks
      .filter((t) => t.status !== 'completed')
      .forEach((t) => {
        const date = isoOf(t.dueDate);
        if (date) out.push({ id: `task-${t.id}`, date, time: 'Due', title: t.title, subtitle: `Task from ${t.counselorName}`, kind: 'deadline' });
      });
    const taken = new Set(state.assessments.map((a) => a.testId).filter(Boolean));
    state.tests
      .filter((t) => t.dueDate && !taken.has(t.id))
      .forEach((t) => out.push({ id: `test-${t.id}`, date: t.dueDate!, time: 'Due', title: t.title, subtitle: `${t.kind} · ${t.durationMins} min`, kind: 'assessment' }));
    state.studentRoadmap?.milestones
      .filter((m) => m.status !== 'done')
      .forEach((m) => {
        const date = isoOf(m.due);
        if (date) out.push({ id: `ms-${m.id}`, date, time: 'Target', title: m.title, subtitle: 'Roadmap milestone', kind: 'target' });
      });
    state.sessionNotes
      .filter((n) => n.followUpDate)
      .forEach((n) => {
        const date = isoOf(n.followUpDate);
        if (date && date >= todayIso()) out.push({ id: `fu-${n.id}`, date, title: `Follow-up: ${n.counselingTopic}`, subtitle: 'From your session notes', kind: 'deadline' });
      });
    state.invoices
      .filter((i) => i.status === 'Due')
      .forEach((i) => out.push({ id: `inv-${i.id}`, date: i.dueDate, time: 'Due', title: `Invoice ${i.number}`, subtitle: `₹${i.total.toLocaleString('en-IN')}`, kind: 'deadline' }));
    if (me?.programEndsAt) out.push({ id: 'program-end', date: me.programEndsAt, title: 'Program access ends', subtitle: 'Renew to continue', kind: 'deadline' });
    state.events.forEach((e) => out.push({ id: `ev-${e.id}`, date: e.date, time: e.time, title: e.title, subtitle: `${e.type} · ${e.mode}`, kind: 'event', link: e.mode === 'Online' ? e.link : undefined }));
    out.push(...notesToItems(state.calendarNotes));
    return out;
  }, [state, me?.programEndsAt]);

  return (
    <div className="space-y-5">
      <PageHeader title="Calendar" description="Sessions, due dates, assessments, targets and events in one place, plus your own notes and reminders." />
      <CalendarBoard
        items={items}
        noteKinds={['note', 'reminder', 'target']}
        legend={['session', 'deadline', 'assessment', 'target', 'event', 'note', 'reminder']}
        emptyHint="Nothing on this day. Add a note or reminder."
        onToast={toast}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

export const ChatPage: React.FC = () => {
  const { state, store, profile, providers, mentor, counselor, chatPartnerId, setChatPartnerId, canBookWith, openBooking, whatsappUrl } = useStudent();
  const partner = providers.find((p) => p.id === chatPartnerId) || providers[0] || null;
  const conversationId = partner ? `${profile.id}_${partner.id}` : '';
  const thread = state.messages.filter((m) => m.conversationId === conversationId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId && thread.some((m) => m.recipientId === profile.id && !m.read)) store.markConversationRead(conversationId);
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
      <PageHeader
        title="Chat"
        description="Message your mentor and counsellor between sessions. Files up to 10 MB."
        actions={
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#BFE6D5] bg-[#E3F6EE] px-4 text-[13.5px] font-semibold text-[#0B7A55] hover:bg-[#D4F0E3]">
            <MessageCircle className="w-4 h-4" /> WhatsApp support
          </a>
        }
      />
      <section className="bg-white border border-[#DDE4EF] rounded-[14px] overflow-hidden grid grid-cols-1 lg:grid-cols-[300px_1fr] min-h-[560px]">
        <aside className="border-b lg:border-b-0 lg:border-r border-[#EAEFF6]">
          <div className="px-4 py-3 text-[13px] font-semibold text-[#5B6885] border-b border-[#EAEFF6]">Conversations</div>
          {providers.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-6 h-6 mx-auto text-[#9AA5BB]" />
              <p className="mt-2 text-[13px] text-[#5B6885]">Your mentor and counsellor appear here once the Maxicareer team assigns them.</p>
            </div>
          ) : (
            <ul className="max-h-[220px] lg:max-h-none overflow-y-auto">
              {providers.map((p) => {
                const active = partner?.id === p.id;
                const last = [...state.messages].reverse().find((m) => m.conversationId === `${profile.id}_${p.id}`);
                const unread = state.messages.filter((m) => m.senderId === p.id && m.recipientId === profile.id && !m.read).length;
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => setChatPartnerId(p.id)} className={cx('w-full flex items-center gap-3 px-4 py-3 text-left border-l-[3px]', active ? 'bg-[#F3F7FF] border-[#2563EB]' : 'border-transparent hover:bg-[#F7F9FC]')}>
                      {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="h-10 w-10 rounded-[10px] object-cover shrink-0" /> : <Avatar name={p.name} size={40} />}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[13.5px] font-semibold truncate">{p.name}</span>
                          {unread > 0 && <span className="mc-num rounded-full bg-[#F2A93B] text-[#0D1B3E] text-[11px] font-semibold px-1.5">{unread}</span>}
                        </span>
                        <span className="block text-[11.5px] text-[#2563EB] font-medium">{p.id === mentor?.id ? 'Your mentor' : p.id === counselor?.id ? 'Your counsellor' : p.title}</span>
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
                  <div className="text-[12px] text-[#7A869E] truncate">{partner.title}</div>
                </div>
                {canBookWith(partner.id) && (
                  <Button size="sm" className="ml-auto" icon={CalendarPlus} onClick={() => openBooking(partner.id)}>
                    Book
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[440px] bg-[#FBFCFE]">
                {thread.length === 0 && <p className="text-center text-[13px] text-[#7A869E] py-10">Say hello to {partner.name.split(' ')[0]} to start the conversation.</p>}
                {thread.map((m) => {
                  const mine = m.senderId === profile.id;
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
                {['Can we review my resume this week?', 'How should I prepare for our next session?', 'What is my next milestone?'].map((c) => (
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
              <Empty icon={MessageSquare} title="No conversations yet" body="Book a session with a mentor or counsellor and you can message them here between calls." />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Upcoming events                                                     */
/* ------------------------------------------------------------------ */

const EVENT_TONE: Record<PlatformEvent['type'], Tone> = { Webinar: 'blue', Workshop: 'violet', Masterclass: 'ink', 'Career fair': 'mint', Assessment: 'marigold', Other: 'neutral' };

export const EventsPage: React.FC = () => {
  const { state, store, toast } = useStudent();
  const today = todayIso();
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const upcoming = state.events.filter((e) => e.date >= today).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const past = state.events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const list = view === 'upcoming' ? upcoming : past;
  const reminded = new Set(state.calendarNotes.filter((n) => n.kind === 'reminder').map((n) => `${n.date}|${n.title}`));

  const remind = async (e: PlatformEvent) => {
    try {
      await store.saveCalendarNote({ date: e.date, time: e.time, title: `Event: ${e.title}`, note: [e.type, e.mode === 'Online' ? e.link : e.location].filter(Boolean).join(' · '), kind: 'reminder' });
      toast('Added to your calendar.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add the reminder.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Upcoming events" description="Webinars, workshops, masterclasses and career fairs from Maxicareer." />
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { value: 'past', label: 'Recent', count: past.length },
        ]}
      />
      {list.length === 0 ? (
        <Panel>
          <Empty icon={PartyPopper} title={view === 'upcoming' ? 'No events scheduled' : 'No recent events'} body="New webinars and workshops for your program will appear here." />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {list.map((e) => {
            const isReminded = reminded.has(`${e.date}|Event: ${e.title}`);
            return (
              <Panel key={e.id} className="flex flex-col" bodyClassName="flex-1 flex flex-col">
                <div className="flex items-start gap-4 pt-1">
                  <DateBlock date={e.date} muted={view === 'past'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={EVENT_TONE[e.type] || 'neutral'}>{e.type}</Badge>
                      <span className="text-[12px] text-[#7A869E]">{relativeDay(e.date)}</span>
                    </div>
                    <h3 className="mt-1 text-[16px] font-semibold leading-snug">{e.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[#5B6885]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {fmtTime(e.time)} · {e.durationMins} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {e.mode === 'Online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        {e.mode === 'Online' ? 'Online' : e.location || 'In person'}
                      </span>
                      {e.host && <span>Host: {e.host}</span>}
                    </div>
                  </div>
                </div>
                {e.description && <p className="mt-3 text-[13.5px] text-[#33415F] whitespace-pre-wrap">{e.description}</p>}
                {view === 'upcoming' && (
                  <div className="mt-auto pt-4 flex flex-wrap gap-2">
                    {e.mode === 'Online' && e.link && (
                      <a href={e.link} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-[#2563EB] px-3 text-[12.5px] font-semibold text-white hover:bg-[#1D4FD7]">
                        <Video className="w-3.5 h-3.5" /> Join link
                      </a>
                    )}
                    <Button size="sm" icon={isReminded ? CheckCheck : BellPlus} disabled={isReminded} onClick={() => remind(e)}>
                      {isReminded ? 'In your calendar' : 'Remind me'}
                    </Button>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
};

