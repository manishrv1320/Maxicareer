import React, { useMemo } from 'react';
import { ArrowUpRight, Bell, CalendarClock, FileStack, Plus, AlertTriangle, CheckCircle2, Inbox } from 'lucide-react';
import { useAdmin, COHORT_LABEL, roadmapProgress } from '../context';
import { PageHeader, Panel, Button, Stat, StepMeter, Badge, Avatar, Empty, cx } from '../ui';
import { DAY_MS, daysUntil, formatDate, inr, timeAgo } from '../lib';
import { focusSubmission, SUBMISSION_STATUS_TONE } from './Submissions';

const PIPELINE = [
  { key: 'pending', label: 'Pending', note: 'New, not yet contacted' },
  { key: 'contacted', label: 'Contacted', note: 'First call done' },
  { key: 'enrolled', label: 'Enrolled', note: 'Program in progress' },
  { key: 'completed', label: 'Completed', note: 'Program finished' },
] as const;

const COHORT_COLORS: Record<string, string> = {
  school: '#F2A93B',
  college: '#2563EB',
  fresher: '#6D4AE0',
  working_professional: '#0F9F6E',
};

export const Dashboard: React.FC<{ greeting: string }> = ({ greeting }) => {
  const {
    session,
    students,
    stats,
    applications,
    sessions,
    approvals,
    notifications,
    submissions,
    studentRoadmaps,
    go,
    canSee,
    openStudent,
    setStudentPrefilter,
    openAddStudent,
  } = useAdmin();

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, contacted: 0, enrolled: 0, completed: 0, cancelled: 0 };
    students.forEach((s) => (c[s.status] = (c[s.status] || 0) + 1));
    return c;
  }, [students]);

  const cohort = useMemo(() => {
    const c: Record<string, number> = { school: 0, college: 0, fresher: 0, working_professional: 0 };
    students.forEach((s) => (c[s.profession] = (c[s.profession] || 0) + 1));
    return c;
  }, [students]);

  const newThisWeek = students.filter((s) => Date.now() - new Date(s.createdAt).getTime() < 7 * DAY_MS).length;
  const pipelineValue = stats?.totalPipelineRevenue || students.reduce((a, s) => a + (s.planPrice || 0), 0);
  const activeApps = applications.filter((a) => !['Rejected', 'Withdrawn', 'Offer'].includes(a.stage));
  const offers = applications.filter((a) => a.stage === 'Offer').length;
  const upcoming = sessions
    .filter((s) => s.status === 'Upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const next7 = sessions.filter((s) => {
    const d = daysUntil(s.date);
    return s.status === 'Upcoming' && d !== null && d >= 0 && d <= 7;
  }).length;
  const unread = notifications.filter((n) => !n.read).length;
  const showForms = canSee('submissions');

  const attention = useMemo(() => {
    const items: { id: string; text: string; detail: string; tone: 'marigold' | 'rose'; action: () => void }[] = [];
    const newForms = showForms ? submissions.filter((s) => s.status === 'New') : [];
    if (newForms.length)
      items.push({
        id: 'forms',
        text: `${newForms.length} new form submission${newForms.length > 1 ? 's' : ''} waiting for a reply`,
        detail: newForms
          .slice(0, 3)
          .map((s) => `${s.name} (${s.formLabel})`)
          .join(', ') + (newForms.length > 3 ? '…' : ''),
        tone: 'rose',
        action: () => go('submissions'),
      });
    const stale =students.filter((s) => s.status === 'pending' && Date.now() - new Date(s.createdAt).getTime() > 2 * DAY_MS);
    if (stale.length)
      items.push({
        id: 'stale',
        text: `${stale.length} pending student${stale.length > 1 ? 's' : ''} waiting more than 2 days`,
        detail: stale.slice(0, 3).map((s) => s.name).join(', ') + (stale.length > 3 ? '…' : ''),
        tone: 'rose',
        action: () => {
          setStudentPrefilter({ status: 'pending' });
          go('students');
        },
      });
    const unassigned = students.filter((s) => (!s.mentorAssigned || s.mentorAssigned === 'Unassigned') && s.status !== 'cancelled');
    if (unassigned.length)
      items.push({
        id: 'unassigned',
        text: `${unassigned.length} student${unassigned.length > 1 ? 's have' : ' has'} no mentor`,
        detail: 'Assign a mentor so their roadmap can start',
        tone: 'marigold',
        action: () => go('students'),
      });
    const dueApps = applications.filter((a) => {
      const d = daysUntil(a.deadline);
      return d !== null && d >= 0 && d <= 7 && ['Draft', 'Submitted', 'Shortlisted', 'Interview'].includes(a.stage);
    });
    if (dueApps.length)
      items.push({
        id: 'deadlines',
        text: `${dueApps.length} application deadline${dueApps.length > 1 ? 's' : ''} this week`,
        detail: dueApps.slice(0, 2).map((a) => `${a.studentName} → ${a.organisation}`).join(', '),
        tone: 'marigold',
        action: () => go('applications'),
      });
    const pendingApprovals = approvals.filter((a) => a.status === 'Pending');
    if (pendingApprovals.length)
      items.push({
        id: 'approvals',
        text: `${pendingApprovals.length} approval${pendingApprovals.length > 1 ? 's' : ''} waiting for a decision`,
        detail: pendingApprovals[0].title,
        tone: 'marigold',
        action: () => go('approvals'),
      });
    const noRoadmap = students.filter((s) => s.status === 'enrolled' && !studentRoadmaps[s._id]);
    if (noRoadmap.length)
      items.push({
        id: 'roadmaps',
        text: `${noRoadmap.length} enrolled student${noRoadmap.length > 1 ? 's' : ''} without a personal roadmap`,
        detail: 'Create one from a template in Roadmaps',
        tone: 'marigold',
        action: () => go('roadmaps'),
      });
    return items;
  }, [students, applications, approvals, studentRoadmaps, submissions, showForms, go, setStudentPrefilter]);

  const latestForms = useMemo(() => [...submissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6), [submissions]);

  const maxStep = Math.max(1, ...PIPELINE.map((p) => counts[p.key] || 0));
  const totalActive = PIPELINE.reduce((a, p) => a + (counts[p.key] || 0), 0);

  const cohortProgress = Object.keys(COHORT_LABEL).map((key) => {
    const list = students.filter((s) => s.profession === key);
    const avg = list.length
      ? Math.round(list.reduce((a, s) => a + (studentRoadmaps[s._id] ? roadmapProgress(studentRoadmaps[s._id]) : s.roadmapProgress || 0), 0) / list.length)
      : 0;
    return { key, label: COHORT_LABEL[key], avg, count: list.length };
  });

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <PageHeader
        meta={<span suppressHydrationWarning>{today}</span>}
        title={<span suppressHydrationWarning>{greeting}, {session.name || 'Admin'}</span>}
        description="Here's where every learner stands today and what needs a decision from you."
        actions={
          <>
            <Button icon={Bell} onClick={() => go('notifications')}>
              Notifications{unread > 0 && <span className="mc-num ml-1 rounded-full bg-[#F2A93B] text-[#0D1B3E] text-[11px] px-1.5">{unread}</span>}
            </Button>
            <Button variant="primary" icon={Plus} onClick={openAddStudent}>
              Add student
            </Button>
          </>
        }
      />

      {/* Pipeline staircase — the signature view */}
      <section className="bg-[#0D1B3E] text-white rounded-[18px] p-5 sm:p-7 relative overflow-hidden">
        <div className="mc-grid-dark absolute inset-0 opacity-60 pointer-events-none" aria-hidden />
        <div className="relative flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-10">
          <div className="lg:w-[260px] shrink-0">
            <h2 className="mc-display text-[22px] font-semibold tracking-[-0.01em]">Student pipeline</h2>
            <p className="text-[13.5px] text-[#AFC0E3] mt-1.5 leading-relaxed">
              {totalActive} learners moving from first enquiry to a finished program. Click a step to see who's on it.
            </p>
            <div className="mt-5 flex gap-6">
              <div>
                <div className="mc-display mc-num text-[26px] font-semibold">{totalActive ? Math.round(((counts.enrolled + counts.completed) / totalActive) * 100) : 0}%</div>
                <div className="text-[12.5px] text-[#AFC0E3]">enquiry → enrolled</div>
              </div>
              <div>
                <div className="mc-display mc-num text-[26px] font-semibold">{counts.cancelled || 0}</div>
                <div className="text-[12.5px] text-[#AFC0E3]">cancelled</div>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-3 items-end min-h-[200px]">
            {PIPELINE.map((p, i) => {
              const n = counts[p.key] || 0;
              const stair = 38 + i * 20; // the staircase rises regardless of count
              const fill = Math.max(8, (n / maxStep) * 100);
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setStudentPrefilter({ status: p.key });
                    go('students');
                  }}
                  className="group text-left flex flex-col justify-end h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-[10px]"
                >
                  <div className="mc-display mc-num text-[30px] sm:text-[38px] font-semibold leading-none mb-2">{n}</div>
                  <div
                    className="relative w-full rounded-t-[10px] bg-[#1A2C5C] group-hover:bg-[#213670] transition-colors overflow-hidden"
                    style={{ height: `${stair * 1.6}px` }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 bg-[#2563EB]" style={{ height: `${fill}%` }} />
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#38BDF8]" />
                  </div>
                  <div className="pt-2.5">
                    <div className="text-[13.5px] font-semibold">{p.label}</div>
                    <div className="text-[12px] text-[#AFC0E3] hidden sm:block">{p.note}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Students" value={students.length} hint={`${newThisWeek} joined in the last 7 days`} onClick={() => go('students')} />
        <Stat
          label="Open applications"
          value={activeApps.length}
          hint={`${offers} offer${offers === 1 ? '' : 's'} received so far`}
          accent={<FileStack className="w-4 h-4 text-[#8C97AE]" />}
          onClick={() => go('applications')}
        />
        <Stat label="Sessions this week" value={next7} hint="Booked in the next 7 days" accent={<CalendarClock className="w-4 h-4 text-[#8C97AE]" />} onClick={() => go('sessions')} />
        <Stat label="Program value" value={<span className="text-[26px] sm:text-[30px]">{inr(pipelineValue)}</span>} hint="Sum of fees across all registrations" onClick={() => go('reports')} />
      </div>

      {showForms && (
        <Panel
          title="Latest form submissions"
          description="Contact enquiries, service requests, registrations, sign-ups and support requests. Click one to see every detail."
          actions={
            <Button size="sm" variant="ghost" onClick={() => go('submissions')}>
              View all
            </Button>
          }
          flush
        >
          {latestForms.length === 0 ? (
            <Empty icon={Inbox} title="No form submissions yet" body="When someone fills a form on the website or portal, it shows up here." />
          ) : (
            <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
              {latestForms.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      focusSubmission(s.id);
                      go('submissions');
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#F7F9FC]"
                  >
                    <Avatar name={s.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[14px] font-semibold text-[#0D1B3E] truncate">{s.name}</span>
                        <Badge className="hidden sm:inline-flex">{s.formLabel}</Badge>
                      </div>
                      <div className="text-[12.5px] text-[#5B6885] truncate">
                        {s.subject || s.message || s.email} · {timeAgo(s.createdAt)}
                      </div>
                    </div>
                    <Badge tone={SUBMISSION_STATUS_TONE[s.status]} dot={s.status === 'New'}>
                      {s.status}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Panel
          className="xl:col-span-7"
          title="Needs your attention"
          description={attention.length ? 'Sorted by what affects learners first' : undefined}
        >
          {attention.length === 0 ? (
            <div className="flex items-center gap-3 rounded-[12px] bg-[#E3F6EE] px-4 py-4 text-[#0B7A55]">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-[14px] font-medium">Nothing is waiting on you right now.</span>
            </div>
          ) : (
            <ul className="divide-y divide-[#EAEFF6] -mx-1">
              {attention.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={a.action} className="w-full flex items-start gap-3 px-1 py-3 text-left group">
                    <span className={cx('mt-0.5 h-7 w-7 shrink-0 rounded-[8px] flex items-center justify-center', a.tone === 'rose' ? 'bg-[#FCEBEC] text-[#B42F3B]' : 'bg-[#FDF1DC] text-[#94570A]')}>
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-semibold text-[#0D1B3E] group-hover:text-[#2563EB]">{a.text}</span>
                      <span className="block text-[12.5px] text-[#5B6885] truncate">{a.detail}</span>
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#8C97AE] group-hover:text-[#2563EB] mt-1" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          className="xl:col-span-5"
          title="Upcoming sessions"
          actions={
            <Button size="sm" variant="ghost" onClick={() => go('sessions')}>
              Open calendar
            </Button>
          }
        >
          {upcoming.length === 0 ? (
            <Empty icon={CalendarClock} title="No sessions booked" body="Schedule a counselling session from the Sessions page." />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((s) => {
                const d = new Date(s.date);
                return (
                  <li key={s.id} className="flex items-center gap-3 rounded-[12px] border border-[#EAEFF6] px-3 py-2.5">
                    <div className="w-11 shrink-0 text-center">
                      <div className="mc-display mc-num text-[20px] font-semibold leading-none text-[#0D1B3E]">{d.getDate()}</div>
                      <div className="text-[11.5px] text-[#5B6885]">{d.toLocaleDateString('en-IN', { month: 'short' })}</div>
                    </div>
                    <div className="h-8 w-px bg-[#EAEFF6]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-[#0D1B3E] truncate">{s.studentName}</div>
                      <div className="text-[12.5px] text-[#5B6885] truncate">
                        {s.topic}, {s.time} with {s.mentor.split(' ').slice(-1)[0]}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Panel
          className="xl:col-span-7"
          title="Recently registered"
          actions={
            <Button size="sm" variant="ghost" onClick={() => go('students')}>
              All students
            </Button>
          }
          flush
        >
          {students.length === 0 ? (
            <Empty title="No registrations yet" body="New sign-ups from the website will appear here." />
          ) : (
            <ul className="divide-y divide-[#EAEFF6] border-t border-[#EAEFF6]">
              {[...students]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .slice(0, 5)
                .map((s) => {
                  const r = studentRoadmaps[s._id];
                  const p = r ? roadmapProgress(r) : s.roadmapProgress || 0;
                  return (
                    <li key={s._id}>
                      <button type="button" onClick={() => openStudent(s)} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#F7F9FC]">
                        <Avatar name={s.name} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-semibold text-[#0D1B3E] truncate">{s.name}</div>
                          <div className="text-[12.5px] text-[#5B6885] truncate">
                            {s.planName.split('(')[0].trim()} · {timeAgo(s.createdAt)}
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2.5">
                          <StepMeter value={p} steps={5} height={18} width={52} />
                          <span className="mc-num text-[12.5px] text-[#5B6885] w-9 text-right">{p}%</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </Panel>

        <Panel className="xl:col-span-5" title="Cohorts" description="Share of learners and average roadmap progress">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#EEF2F7]">
            {Object.keys(COHORT_LABEL).map((k) => (
              <span key={k} style={{ width: `${students.length ? (cohort[k] / students.length) * 100 : 25}%`, background: COHORT_COLORS[k] }} />
            ))}
          </div>
          <ul className="mt-4 space-y-3">
            {cohortProgress.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => {
                    setStudentPrefilter({ cohort: c.key });
                    go('students');
                  }}
                  className="w-full flex items-center gap-3 text-left group"
                >
                  <span className="h-2.5 w-2.5 rounded-[3px] shrink-0" style={{ background: COHORT_COLORS[c.key] }} />
                  <span className="flex-1 text-[14px] font-medium text-[#26355A] group-hover:text-[#2563EB]">{c.label}</span>
                  <span className="mc-num text-[13px] text-[#5B6885] w-8 text-right">{c.count}</span>
                  <StepMeter value={c.avg} steps={6} height={16} width={60} label={`${c.label} average progress`} />
                  <span className="mc-num text-[12.5px] text-[#5B6885] w-9 text-right">{c.avg}%</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] text-[#7A869E]" suppressHydrationWarning>
            Last updated {formatDate(new Date().toISOString(), true)}
          </p>
        </Panel>
      </div>
    </div>
  );
};
