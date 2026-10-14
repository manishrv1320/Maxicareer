import React, { useMemo, useState } from 'react';
import { Bell, CalendarPlus, Check, ChevronRight, Compass, GraduationCap, MessageSquare, ShieldCheck, Users, Video } from 'lucide-react';
import { PageHeader, Panel, Button, Badge, Empty, Segmented, StepMeter, Avatar, cx, Tone } from '../admin/ui';
import { timeAgo } from '../admin/lib';
import { useStudent, Provider, StudentPage, PAGE_ALIASES, daysLeft, nextOpenDay } from './context';
import { fmtDay, fmtTime, isoOf, relativeDay, todayIso } from '../workspace/kit';

export const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Awaiting confirmation', tone: 'marigold' },
  contacted: { label: 'In review', tone: 'blue' },
  enrolled: { label: 'Enrolled', tone: 'mint' },
  completed: { label: 'Completed', tone: 'mint' },
  cancelled: { label: 'Cancelled', tone: 'rose' },
};

const MILESTONE_DOT: Record<string, string> = { done: 'bg-[#0F9F6E]', doing: 'bg-[#2563EB]', blocked: 'bg-[#D93F4C]', todo: 'bg-[#C4CEDD]' };
const MILESTONE_LABEL: Record<string, string> = { done: 'Done', doing: 'In progress', blocked: 'Blocked', todo: 'To do' };

const PersonCard: React.FC<{ role: string; person: Provider | null; empty: string }> = ({ role, person, empty }) => {
  const { chatWith, openBooking } = useStudent();
  return (
    <Panel className="flex flex-col" bodyClassName="flex-1 flex flex-col">
      <div className="text-[13px] font-medium text-[#5B6885]">Assigned {role}</div>
      {person ? (
        <>
          <div className="mt-3 flex items-center gap-3 min-w-0">
            {person.avatarUrl ? <img src={person.avatarUrl} alt="" className="h-12 w-12 rounded-[12px] object-cover shrink-0" /> : <Avatar name={person.name} size={48} tone="blue" />}
            <div className="min-w-0">
              <div className="mc-display text-[17px] font-semibold truncate">{person.name}</div>
              <div className="text-[12.5px] text-[#5B6885] truncate">{person.title}</div>
            </div>
          </div>
          <div className="mt-auto pt-4 flex gap-2">
            <Button size="sm" icon={MessageSquare} onClick={() => chatWith(person.id)} className="flex-1">
              Message
            </Button>
            <Button size="sm" variant="primary" icon={CalendarPlus} onClick={() => openBooking(person.id)} className="flex-1">
              Book
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="h-12 w-12 rounded-[12px] border border-dashed border-[#C4CEDD] flex items-center justify-center text-[#9AA5BB]">
              <Users className="w-5 h-5" />
            </span>
            <p className="text-[13px] text-[#5B6885] leading-snug">{empty}</p>
          </div>
          <div className="mt-auto pt-4">
            <Button size="sm" onClick={() => openBooking()} className="w-full">
              Browse experts
            </Button>
          </div>
        </>
      )}
    </Panel>
  );
};

export const DashboardPage: React.FC = () => {
  const { profile, me, state, go, mentor, counselor, curriculumProgress, openBooking, openAdminMeeting, modules } = useStudent();
  const first = (me?.name || profile.name).split(' ')[0];
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const status = STATUS_META[me?.status || 'pending'] || STATUS_META.pending;
  const left = daysLeft(me?.programEndsAt);
  const today = todayIso();

  const tasks = state.followUpTasks;
  const tasksDone = tasks.filter((t) => t.status === 'completed').length;
  const sessionsDone = state.appointments.filter((a) => a.status === 'completed').length;
  const roadmap = state.studentRoadmap;
  const roadmapPct = roadmap?.milestones.length
    ? Math.round(((roadmap.milestones.filter((m) => m.status === 'done').length + roadmap.milestones.filter((m) => m.status === 'doing').length * 0.5) / roadmap.milestones.length) * 100)
    : null;

  // What's next
  const nextSession = state.appointments
    .filter((a) => a.status === 'scheduled' && isoOf(a.date) >= today)
    .sort((a, b) => isoOf(a.date).localeCompare(isoOf(b.date)))[0];
  const nextAdmin = state.adminMeetings.filter((m) => m.status === 'Upcoming' && m.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextTask = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => (isoOf(a.dueDate) || '9999').localeCompare(isoOf(b.dueDate) || '9999'))[0];
  const takenTests = new Set(state.assessments.map((a) => a.testId).filter(Boolean));
  const nextTest = state.tests.filter((t) => !takenTests.has(t.id)).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))[0];
  const nextEvent = state.events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextLesson = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m.title }))).find((l) => !(me?.completedLessonIds || []).includes(l.id));
  const nextMilestoneDue = nextOpenDay(roadmap?.milestones.filter((m) => m.status !== 'done').map((m) => isoOf(m.due)) || []);

  const upNext: { key: string; icon: React.ComponentType<{ className?: string }>; title: string; detail: string; page: StudentPage }[] = [];
  if (nextSession) upNext.push({ key: 's', icon: Video, title: nextSession.topic || nextSession.counselingType, detail: `${relativeDay(nextSession.date)} · ${nextSession.time} with ${nextSession.counselorName}`, page: 'sessions' });
  if (nextAdmin) upNext.push({ key: 'a', icon: ShieldCheck, title: nextAdmin.topic, detail: `${relativeDay(nextAdmin.date)} · ${fmtTime(nextAdmin.time)} with the admin team`, page: 'sessions' });
  if (nextTask) upNext.push({ key: 't', icon: Check, title: nextTask.title, detail: nextTask.dueDate ? `Due ${fmtDay(nextTask.dueDate)} · from ${nextTask.counselorName}` : `From ${nextTask.counselorName}`, page: 'tasks' });
  if (nextTest) upNext.push({ key: 'x', icon: GraduationCap, title: nextTest.title, detail: nextTest.dueDate ? `${nextTest.kind} · due ${fmtDay(nextTest.dueDate)}` : `${nextTest.kind} · ${nextTest.questions.length} questions`, page: 'courses' });
  if (nextEvent) upNext.push({ key: 'e', icon: CalendarPlus, title: nextEvent.title, detail: `${nextEvent.type} · ${fmtDay(nextEvent.date, { weekday: 'short', day: 'numeric', month: 'short' })}, ${fmtTime(nextEvent.time)}`, page: 'events' });
  if (nextLesson) upNext.push({ key: 'l', icon: Compass, title: nextLesson.title, detail: `Next lesson · ${nextLesson.module}`, page: 'curriculum' });

  return (
    <div className="space-y-6">
      <PageHeader
        meta={greeting}
        title={`Hi, ${first}`}
        description={
          <>
            {me?.planName || profile.planName} · {me?.professionLabel || profile.professionLabel}
          </>
        }
        actions={
          <>
            <Button icon={CalendarPlus} variant="primary" onClick={() => openBooking(mentor?.id || counselor?.id)}>
              Book a session
            </Button>
            <Button icon={ChevronRight} onClick={() => go('tasks')}>
              My tasks
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <PersonCard role="mentor" person={mentor} empty="Your mentor is assigned once your enrolment is confirmed." />
        <PersonCard role="counsellor" person={counselor} empty="A counsellor is assigned to guide your plan and sessions." />

        <Panel className="flex flex-col" bodyClassName="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[13px] font-medium text-[#5B6885]">My program</div>
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
          </div>
          <div className="mt-3 mc-display text-[19px] font-semibold leading-snug">{me?.planName || profile.planName}</div>
          <div className="mt-1 text-[13px] text-[#5B6885]">{me?.institutionOrCompany || profile.institutionOrCompany}</div>
          <div className="mt-auto pt-4 grid grid-cols-2 gap-3 text-[12.5px]">
            <div>
              <div className="text-[#7A869E]">Access until</div>
              <div className={cx('font-semibold', left !== null && left <= 30 ? 'text-[#B42F3B]' : 'text-[#0D1B3E]')}>{me?.programEndsAt ? fmtDay(me.programEndsAt) : '—'}</div>
            </div>
            <div>
              <div className="text-[#7A869E]">Add-ons</div>
              <button type="button" onClick={() => go('services')} className="font-semibold text-[#2563EB] hover:underline">
                {(me?.selectedAddOns || profile.selectedAddOns || []).length || 'Add'} {(me?.selectedAddOns || []).length ? 'active' : ''}
              </button>
            </div>
          </div>
        </Panel>

        <Panel className="flex flex-col" bodyClassName="flex-1 flex flex-col">
          <div className="text-[13px] font-medium text-[#5B6885]">Progress</div>
          <div className="mt-3 flex items-end gap-3">
            <span className="mc-display mc-num text-[36px] leading-none font-semibold">{curriculumProgress}%</span>
            <StepMeter value={curriculumProgress} steps={8} height={30} width={110} tone="mint" label="Curriculum progress" />
          </div>
          <div className="text-[12.5px] text-[#5B6885] mt-1">of your curriculum</div>
          <dl className="mt-auto pt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ['Tasks', `${tasksDone}/${tasks.length}`],
              ['Sessions', sessionsDone],
              ['Roadmap', roadmapPct === null ? '—' : `${roadmapPct}%`],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-[10px] bg-[#F3F6FB] py-2">
                <dd className="mc-display mc-num text-[16px] font-semibold">{v}</dd>
                <dt className="text-[11.5px] text-[#5B6885]">{l}</dt>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <Panel
          className="xl:col-span-8"
          title="Your Personal Plan"
          description={roadmap?.goal ? `Goal: ${roadmap.goal}` : 'Milestones and tasks from your mentor, counsellor and the Maxicareer team.'}
          actions={
            roadmapPct !== null && (
              <span className="flex items-center gap-2">
                <StepMeter value={roadmapPct} steps={6} height={20} width={70} />
                <span className="mc-num text-[13px] font-semibold">{roadmapPct}%</span>
              </span>
            )
          }
        >
          {roadmap && roadmap.milestones.length > 0 ? (
            <ol className="relative space-y-1">
              {roadmap.milestones.map((m, i) => (
                <li key={m.id} className="flex items-start gap-3 rounded-[10px] px-3 py-2.5 hover:bg-[#F7F9FC]">
                  <span className="relative flex flex-col items-center pt-1">
                    <span className={cx('h-3 w-3 rounded-full ring-4 ring-white', MILESTONE_DOT[m.status])} />
                    {i < roadmap.milestones.length - 1 && <span className="w-px flex-1 min-h-[22px] bg-[#DDE4EF] mt-1" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={cx('text-[14px] font-semibold', m.status === 'done' && 'line-through text-[#7A869E]')}>{m.title}</div>
                    {m.note && <div className="text-[12.5px] text-[#5B6885]">{m.note}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-semibold text-[#33415F]">{MILESTONE_LABEL[m.status]}</div>
                    {m.due && <div className={cx('text-[12px]', isoOf(m.due) === nextMilestoneDue ? 'text-[#94570A] font-semibold' : 'text-[#7A869E]')}>Due {fmtDay(m.due)}</div>}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <Empty
              icon={Compass}
              title="Your plan is on its way"
              body="Your counsellor builds a personal roadmap after your first session. Until then, follow the curriculum and your tasks."
              action={
                <Button size="sm" onClick={() => go('curriculum')}>
                  Open curriculum
                </Button>
              }
            />
          )}

          {tasks.filter((t) => t.status !== 'completed').length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#EAEFF6]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#5B6885]">Open tasks</h3>
                <button type="button" onClick={() => go('tasks')} className="text-[12.5px] font-semibold text-[#2563EB] hover:underline">
                  View all
                </button>
              </div>
              <ul className="space-y-1.5">
                {tasks
                  .filter((t) => t.status !== 'completed')
                  .slice(0, 3)
                  .map((t) => (
                    <li key={t.id} className="flex items-center gap-3 rounded-[10px] bg-[#F7F9FC] px-3 py-2">
                      <span className={cx('h-2 w-2 rounded-full shrink-0', t.priority === 'high' ? 'bg-[#D93F4C]' : t.priority === 'medium' ? 'bg-[#F2A93B]' : 'bg-[#8C97AE]')} />
                      <span className="flex-1 min-w-0 text-[13.5px] font-medium truncate">{t.title}</span>
                      {t.dueDate && <span className="text-[12px] text-[#7A869E] shrink-0">Due {fmtDay(t.dueDate, { day: 'numeric', month: 'short' })}</span>}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </Panel>

        <div className="xl:col-span-4 space-y-5">
          <Panel title="Book a meeting" description="With your proctors or the Maxicareer team.">
            <div className="space-y-2">
              {[
                { who: 'Mentor', person: mentor },
                { who: 'Counsellor', person: counselor },
              ].map(({ who, person }) => (
                <button
                  key={who}
                  type="button"
                  onClick={() => openBooking(person?.id)}
                  className="w-full flex items-center gap-3 rounded-[12px] border border-[#DDE4EF] px-3 py-2.5 text-left hover:border-[#2563EB] hover:bg-[#F7F9FC]"
                >
                  {person?.avatarUrl ? <img src={person.avatarUrl} alt="" className="h-9 w-9 rounded-[10px] object-cover" /> : <Avatar name={person?.name || who} size={36} />}
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-semibold truncate">{person ? person.name : `Find a ${who.toLowerCase()}`}</span>
                    <span className="block text-[12px] text-[#7A869E]">{person ? `Your ${who.toLowerCase()}` : 'Browse the directory'}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#8C97AE]" />
                </button>
              ))}
              <button type="button" onClick={openAdminMeeting} className="w-full flex items-center gap-3 rounded-[12px] border border-[#DDE4EF] px-3 py-2.5 text-left hover:border-[#2563EB] hover:bg-[#F7F9FC]">
                <span className="h-9 w-9 rounded-[10px] bg-[#0D1B3E] text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-semibold">Admin team</span>
                  <span className="block text-[12px] text-[#7A869E]">Enrolment, payments, anything else</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#8C97AE]" />
              </button>
            </div>
          </Panel>

          <Panel title="Up next">
            {upNext.length === 0 ? (
              <p className="text-[13px] text-[#5B6885]">You're all caught up.</p>
            ) : (
              <ul className="-mx-5 divide-y divide-[#EAEFF6]">
                {upNext.slice(0, 5).map((u) => {
                  const Icon = u.icon;
                  return (
                    <li key={u.key}>
                      <button type="button" onClick={() => go(u.page)} className="w-full flex items-start gap-3 px-5 py-2.5 text-left hover:bg-[#F7F9FC]">
                        <span className="h-8 w-8 rounded-[9px] bg-[#E8F0FE] text-[#1D4FD7] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-semibold truncate">{u.title}</span>
                          <span className="block text-[12px] text-[#7A869E] truncate">{u.detail}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

const CATEGORY_TONE: Record<string, Tone> = { Mentorship: 'violet', Sessions: 'blue', Courses: 'mint', System: 'neutral' };

export const NotificationsPage: React.FC = () => {
  const { state, store, go } = useStudent();
  const [view, setView] = useState<'all' | 'unread'>('all');
  const [category, setCategory] = useState<string>('all');
  const list = useMemo(
    () =>
      [...state.notifications]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter((n) => (view === 'all' || !n.read) && (category === 'all' || n.category === category)),
    [state.notifications, view, category]
  );
  const unread = state.notifications.filter((n) => !n.read).length;
  const categories = Array.from(new Set(state.notifications.map((n) => n.category)));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Updates from your mentor, counsellor and the Maxicareer team."
        actions={
          unread > 0 && (
            <Button icon={Check} onClick={() => store.markNotificationsRead()}>
              Mark all read
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'all', label: 'All', count: state.notifications.length },
            { value: 'unread', label: 'Unread', count: unread },
          ]}
        />
        {categories.length > 1 && (
          <Segmented value={category} onChange={setCategory} options={[{ value: 'all', label: 'Every type' }, ...categories.map((c) => ({ value: c, label: c }))]} />
        )}
      </div>
      <Panel flush>
        {list.length === 0 ? (
          <Empty icon={Bell} title={view === 'unread' ? 'No unread notifications' : 'Nothing here yet'} body="Session confirmations, new tasks, reviews and invoices show up here." />
        ) : (
          <ul className="divide-y divide-[#EAEFF6]">
            {list.map((n) => {
              const target = n.actionTab ? PAGE_ALIASES[n.actionTab] || (n.actionTab as StudentPage) : null;
              return (
                <li key={n.id} className={cx('flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4', !n.read && 'bg-[#FFFBF3]')}>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={cx('mt-1.5 h-2 w-2 rounded-full shrink-0', n.read ? 'bg-transparent' : 'bg-[#F2A93B]')} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={CATEGORY_TONE[n.category] || 'neutral'}>{n.category}</Badge>
                        <span className="text-[12px] text-[#7A869E]">{timeAgo(n.createdAt)}</span>
                      </div>
                      <div className={cx('mt-1 text-[14px]', n.read ? 'font-medium' : 'font-semibold')}>{n.title}</div>
                      <p className="text-[13px] text-[#5B6885]">{n.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 sm:ml-auto">
                    {!n.read && (
                      <Button size="sm" variant="ghost" onClick={() => store.markNotificationsRead([n.id])}>
                        Mark read
                      </Button>
                    )}
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
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
};
