import React, { useMemo, useState } from 'react';
import { Bell, CalendarClock, Check, ChevronRight, FolderKanban, MessageSquare, Users, Video, FileText, Inbox, PartyPopper, Link2 } from 'lucide-react';
import { PageHeader, Panel, Stat, Badge, Button, Empty, Segmented, StepMeter, Avatar, cx, Tone } from '../admin/ui';
import { timeAgo } from '../admin/lib';
import { CalendarBoard, CalendarItem, notesToItems } from '../workspace/CalendarBoard';
import { fmtDay, fmtTime, inr, isoOf, relativeDay, todayIso } from '../workspace/kit';
import { useProvider, PAGE_ALIASES, ProviderPage, roleLabel, firstName, isUpcoming, needsNotes } from './context';

const STATUS_TONE: Record<string, Tone> = { pending: 'marigold', contacted: 'blue', enrolled: 'mint', completed: 'violet', cancelled: 'rose' };
const STATUS_LABEL: Record<string, string> = { pending: 'Awaiting enrolment', contacted: 'Contacted', enrolled: 'Enrolled', completed: 'Completed', cancelled: 'Cancelled' };
export { STATUS_TONE, STATUS_LABEL };

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export const DashboardPage: React.FC = () => {
  const { me, kind, state, go, mentees, requests, appointments, notes, tasks, sessionMinutes, openMentee, writeNotes, editLink, store, toast } = useProvider();
  const today = todayIso();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const pending = requests.filter((r) => r.status === 'pending');
  const scheduled = appointments
    .filter((a) => isUpcoming(a, today))
    .map((a) => ({ a, day: isoOf(a.date) }))
    .sort((x, y) => x.day.localeCompare(y.day));
  const weekEnd = isoOf(new Date(Date.now() + 7 * 86_400_000).toISOString());
  const nextWeek = scheduled.filter(({ day }) => day <= weekEnd);
  const toReview = state.assignments.filter((a) => a.status === 'submitted');
  const noted = new Set(notes.map((n) => n.appointmentId));
  const needNotes = appointments.filter((a) => needsNotes(a, noted, today));

  const monthKey = today.slice(0, 7);
  const sessionsThisMonth = appointments.filter((a) => a.status === 'completed' && isoOf(a.date).startsWith(monthKey)).length;
  const loggedThisMonth = state.workLogs.filter((w) => w.date.startsWith(monthKey)).reduce((s, w) => s + w.hours, 0);
  const hoursThisMonth = Math.round(((sessionsThisMonth * sessionMinutes) / 60 + loggedThisMonth) * 10) / 10;
  const avgRating = state.feedback.length ? state.feedback.reduce((s, f) => s + f.rating, 0) / state.feedback.length : null;
  const pendingPay = state.payouts.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const upcomingEvents = state.events.filter((e) => e.date >= today).slice(0, 3);

  const attention = [
    ...pending.map((r) => ({ id: `r-${r.id}`, icon: Inbox, text: `${r.studentName} requested a ${r.counselingType.toLowerCase()} session`, meta: `${fmtDay(r.preferredDate)} · ${r.preferredTime}`, page: 'sessions' as ProviderPage })),
    ...toReview.map((a) => ({ id: `a-${a.id}`, icon: FolderKanban, text: `Review "${a.title}" from ${a.studentName}`, meta: `Submitted ${timeAgo(a.submittedAt)}`, page: 'assignments' as ProviderPage })),
    ...needNotes.map((a) => ({ id: `n-${a.id}`, icon: FileText, text: `Write notes for ${a.studentName}'s session`, meta: fmtDay(a.date), page: 'pending' as ProviderPage })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        meta={
          <span className="inline-flex items-center gap-2">
            <Badge tone="blue">{roleLabel(kind)}</Badge>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        }
        title={`${greeting}, ${firstName(me.name)}`}
        description="Your mentees, sessions and the work waiting for you."
        actions={
          <>
            <Button icon={CalendarClock} onClick={() => go('availability')}>
              Set availability
            </Button>
            <Button variant="primary" icon={Video} onClick={() => go('sessions')}>
              1-on-1 sessions
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label={kind === 'mentor' ? 'Mentees' : 'Students'} value={mentees.length} hint={`${mentees.filter((m) => m.status === 'enrolled').length} enrolled`} onClick={() => go('mentees')} />
        <Stat
          label="Session requests"
          value={pending.length}
          hint={pending.length ? 'Waiting for your answer' : 'All answered'}
          accent={pending.length ? <span className="h-2.5 w-2.5 rounded-full bg-[#F2A93B]" /> : undefined}
          onClick={() => go('sessions')}
        />
        <Stat label="Upcoming sessions" value={scheduled.length} hint={scheduled[0] ? `Next: ${relativeDay(scheduled[0].day) || fmtDay(scheduled[0].a.date)}` : 'None booked'} onClick={() => go('sessions')} />
        <Stat label="Work to review" value={toReview.length} hint="Projects & assignments" onClick={() => go('assignments')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
        <Panel title="Next 7 days" description="Your confirmed 1-on-1 sessions." actions={<Button size="sm" variant="ghost" onClick={() => go('calendar')}>Calendar</Button>} flush>
          {nextWeek.length === 0 ? (
            <Empty icon={CalendarClock} title="Nothing booked this week" body="Students book you from their portal. Keep your availability up to date so they can find a slot." action={<Button size="sm" onClick={() => go('availability')}>Update availability</Button>} />
          ) : (
            <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
              {nextWeek.map(({ a, day }) => (
                <li key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5">
                  <div className="w-28 shrink-0">
                    <div className="text-[12.5px] font-semibold text-[#2563EB]">{relativeDay(day) || fmtDay(day)}</div>
                    <div className="mc-num text-[13px] text-[#5B6885]">{fmtTime(a.time)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate">{a.studentName}</div>
                    <div className="text-[13px] text-[#5B6885] truncate">{a.topic || a.counselingType}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {a.meetingLink ? (
                      <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[#2563EB] px-3 text-[12.5px] font-semibold text-white hover:bg-[#1D4FD7]">
                        <Video className="w-3.5 h-3.5" /> Join
                      </a>
                    ) : (
                      <Button size="sm" variant="primary" icon={Link2} onClick={() => editLink(a)}>
                        Add link
                      </Button>
                    )}
                    <Button size="sm" onClick={() => writeNotes(a)}>
                      Complete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Needs your attention" actions={attention.length > 0 && <Button size="sm" variant="ghost" onClick={() => go('pending')}>All pending</Button>} flush>
          {attention.length === 0 ? (
            <Empty icon={Check} title="You're all caught up" body="New requests, submissions and sessions that need notes show up here." />
          ) : (
            <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
              {attention.slice(0, 6).map((x) => {
                const Icon = x.icon;
                return (
                  <li key={x.id}>
                    <button type="button" onClick={() => go(x.page)} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#F7F9FC]">
                      <span className="h-8 w-8 shrink-0 rounded-[9px] bg-[#FDF1DC] text-[#94570A] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium truncate">{x.text}</span>
                        <span className="block text-[12px] text-[#7A869E]">{x.meta}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#9AA5BB]" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
        <Panel title={kind === 'mentor' ? 'My mentees' : 'My students'} actions={<Button size="sm" variant="ghost" onClick={() => go('mentees')}>View all</Button>} flush>
          {mentees.length === 0 ? (
            <Empty icon={Users} title="No students yet" body="Students appear here when they book you or when an admin assigns them to you." />
          ) : (
            <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
              {mentees.slice(0, 6).map((s) => {
                const open = tasks.filter((t) => t.studentId === s.id && t.status !== 'completed').length;
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => openMentee(s.id)} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#F7F9FC]">
                      {s.avatarUrl ? <img src={s.avatarUrl} alt="" className="h-9 w-9 rounded-[10px] object-cover" /> : <Avatar name={s.name} size={36} />}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold truncate">{s.name}</span>
                        <span className="block text-[12.5px] text-[#7A869E] truncate">{s.planName}</span>
                      </span>
                      <span className="hidden sm:flex items-center gap-2 w-28">
                        <StepMeter value={s.roadmapProgress || 0} steps={6} height={18} width={60} />
                        <span className="mc-num text-[12.5px] text-[#5B6885]">{s.roadmapProgress || 0}%</span>
                      </span>
                      {open > 0 && <Badge tone="marigold">{open} open</Badge>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="This month">
            <dl className="grid grid-cols-2 gap-4">
              {[
                ['Sessions done', String(sessionsThisMonth), 'reports'],
                ['Hours worked', `${hoursThisMonth} h`, 'hours'],
                ['Average rating', avgRating ? `${avgRating.toFixed(1)} / 5` : '—', 'reports'],
                ['Payout pending', inr(pendingPay), 'payments'],
              ].map(([label, value, target]) => (
                <button key={label} type="button" onClick={() => go(target as ProviderPage)} className="text-left rounded-[12px] border border-[#EAEFF6] p-3 hover:border-[#B7C3D7]">
                  <dt className="text-[12px] text-[#7A869E]">{label}</dt>
                  <dd className="mc-display mc-num text-[20px] font-semibold text-[#0D1B3E]">{value}</dd>
                </button>
              ))}
            </dl>
          </Panel>
          <Panel title="Upcoming events" flush>
            {upcomingEvents.length === 0 ? (
              <p className="px-5 pb-5 text-[13px] text-[#5B6885]">No team events scheduled.</p>
            ) : (
              <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
                {upcomingEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <PartyPopper className="w-4 h-4 text-[#0B6A93] shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-semibold truncate">{e.title}</span>
                      <span className="block text-[12px] text-[#7A869E]">
                        {fmtDay(e.date)} · {fmtTime(e.time)} · {e.mode}
                      </span>
                    </span>
                    {e.link && (
                      <a href={e.link} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold text-[#2563EB] hover:underline">
                        Open
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {state.messages.some((m) => m.recipientId === me.id && !m.read) && (
            <button type="button" onClick={() => go('chat')} className="w-full flex items-center gap-3 rounded-[14px] border border-[#DDE4EF] bg-white px-5 py-3.5 text-left hover:border-[#B7C3D7]">
              <MessageSquare className="w-4 h-4 text-[#2563EB]" />
              <span className="flex-1 text-[13.5px] font-medium">{state.messages.filter((m) => m.recipientId === me.id && !m.read).length} unread messages</span>
              <ChevronRight className="w-4 h-4 text-[#9AA5BB]" />
            </button>
          )}
        </div>
      </div>
      {pending.length > 0 && (
        <Panel title="Session requests" description="Accepting creates the session and shares your meeting link with the student." flush>
          <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
            {pending.slice(0, 4).map((r) => (
              <li key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">{r.studentName}</div>
                  <div className="text-[13px] text-[#5B6885]">
                    {r.counselingType} · {fmtDay(r.preferredDate)} at {r.preferredTime}
                  </div>
                </div>
                <div className="flex gap-1.5">
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
                      toast('Request declined. The student was notified.');
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

export const CalendarPage: React.FC = () => {
  const { me, state, appointments, requests, tasks, notes, toast } = useProvider();
  const items = useMemo<CalendarItem[]>(() => {
    const out: CalendarItem[] = [];
    appointments.forEach((a) => {
      const date = isoOf(a.date);
      if (!date || a.status === 'cancelled') return;
      out.push({ id: `apt-${a.id}`, date, time: a.time, title: `${a.studentName}: ${a.topic || a.counselingType}`, subtitle: a.status === 'completed' ? 'Completed' : '1-on-1 session', kind: 'session', link: a.status === 'scheduled' ? a.meetingLink : undefined });
    });
    requests
      .filter((r) => r.status === 'pending')
      .forEach((r) => {
        const date = isoOf(r.preferredDate);
        if (date) out.push({ id: `req-${r.id}`, date, time: r.preferredTime, title: `${r.studentName} (requested)`, subtitle: `${r.counselingType} · awaiting your answer`, kind: 'session' });
      });
    tasks
      .filter((t) => t.status !== 'completed')
      .forEach((t) => {
        const date = isoOf(t.dueDate);
        const student = state.students.find((s) => s.id === t.studentId);
        if (date) out.push({ id: `task-${t.id}`, date, time: 'Due', title: t.title, subtitle: `Task for ${student?.name || 'a mentee'}`, kind: 'deadline' });
      });
    notes
      .filter((n) => n.followUpDate)
      .forEach((n) => {
        const date = isoOf(n.followUpDate);
        const student = state.students.find((s) => s.id === n.studentId);
        if (date) out.push({ id: `fu-${n.id}`, date, title: `Follow up with ${student?.name || 'mentee'}`, subtitle: n.counselingTopic, kind: 'target' });
      });
    (me.blockedDates || []).forEach((d) => out.push({ id: `off-${d}`, date: d, title: 'Unavailable', subtitle: 'Students cannot book this day', kind: 'blocked' }));
    state.events.forEach((e) => out.push({ id: `ev-${e.id}`, date: e.date, time: e.time, title: e.title, subtitle: `${e.type} · ${e.mode}`, kind: 'event', link: e.mode === 'Online' ? e.link : undefined }));
    out.push(...notesToItems(state.calendarNotes));
    return out;
  }, [appointments, requests, tasks, notes, me.blockedDates, state.events, state.calendarNotes, state.students]);

  return (
    <div className="space-y-5">
      <PageHeader title="Calendar" description="Sessions, requests, mentee due dates, follow-ups, days off and team events, plus your own notes, reminders and to-dos." />
      <CalendarBoard
        items={items}
        noteKinds={['note', 'reminder', 'task']}
        legend={['session', 'deadline', 'target', 'event', 'blocked', 'reminder', 'task', 'note']}
        emptyHint="Nothing on this day. Add a note, reminder or to-do."
        onToast={toast}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

const CATEGORY_TONE: Record<string, Tone> = { Mentorship: 'violet', Sessions: 'blue', Courses: 'mint', System: 'neutral' };

export const NotificationsPage: React.FC = () => {
  const { state, store, go } = useProvider();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const list = [...state.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter((n) => filter === 'all' || !n.read);
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Booking requests, submissions, feedback and messages from the Maxicareer team."
        actions={
          unread > 0 && (
            <Button icon={Check} onClick={() => store.markNotificationsRead()}>
              Mark all read
            </Button>
          )
        }
      />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All', count: state.notifications.length },
          { value: 'unread', label: 'Unread', count: unread },
        ]}
      />
      <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
        {list.length === 0 && <Empty icon={Bell} title={filter === 'unread' ? 'Nothing unread' : 'No notifications yet'} />}
        {list.map((n) => {
          const target = n.actionTab ? PAGE_ALIASES[n.actionTab] || (n.actionTab as ProviderPage) : null;
          return (
            <div key={n.id} className={cx('flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4', !n.read && 'bg-[#FFFBF3]')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone={CATEGORY_TONE[n.category] || 'neutral'}>{n.category}</Badge>
                  <span className="text-[12px] text-[#7A869E]">{timeAgo(n.createdAt)}</span>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-[#F2A93B]" />}
                </div>
                <div className={cx('mt-1 text-[14px]', n.read ? 'font-medium' : 'font-semibold')}>{n.title}</div>
                <p className="text-[13px] text-[#5B6885]">{n.description}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {target && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!n.read) store.markNotificationsRead([n.id]);
                      go(target);
                    }}
                  >
                    {n.actionText || 'Open'}
                  </Button>
                )}
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => store.markNotificationsRead([n.id])}>
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MenteeStatus: React.FC<{ status?: string }> = ({ status }) => (status ? <Badge tone={STATUS_TONE[status] || 'neutral'} dot>{STATUS_LABEL[status] || status}</Badge> : null);
