import React, { useMemo, useState } from 'react';
import {
  Users,
  MessageSquare,
  ListPlus,
  BookPlus,
  Share2,
  Video,
  Check,
  X,
  CalendarClock,
  Plus,
  Trash2,
  ExternalLink,
  Linkedin,
  Github,
  Globe,
  CalendarX2,
  Save,
  Inbox,
  FileText,
  Link2,
} from 'lucide-react';
import { PageHeader, Panel, Stat, Badge, Button, Empty, Segmented, StepMeter, Avatar, Drawer, Field, Input, Select, SearchInput, IconButton, Th, Td, cx } from '../admin/ui';
import { timeAgo, plural } from '../admin/lib';
import type { Counselor, Mentor, Appointment } from '../../types/counselor';
import { COHORT_NAMES } from '../../types/portal';
import { Fact, FileLink, StarRating, fmtDay, fmtTime, isoOf, relativeDay, to24h, todayIso, daysFromToday, isMeetingLink, MEETING_LINK_HELP } from '../workspace/kit';
import { useProvider, isAssignedTo, isUpcoming, needsNotes } from './context';
import { MenteeStatus } from './OverviewPages';
import { ModuleModal, ResourceModal } from './modals';

/* ------------------------------------------------------------------ */
/* My mentees                                                          */
/* ------------------------------------------------------------------ */

export const MenteesPage: React.FC = () => {
  const { kind, me, mentees, appointments, tasks, openMentee, chatWith, newTask, state } = useProvider();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'assigned' | 'followup' | 'enrolled'>('all');
  const today = todayIso();

  const rows = mentees.map((s) => {
    const next = appointments
      .filter((a) => a.studentId === s.id && a.status === 'scheduled')
      .map((a) => isoOf(a.date))
      .filter((d) => d >= today)
      .sort()[0];
    const open = tasks.filter((t) => t.studentId === s.id && t.status !== 'completed');
    const overdue = open.filter((t) => isoOf(t.dueDate) !== '' && isoOf(t.dueDate) < today).length;
    const toReview = state.assignments.filter((a) => a.studentId === s.id && a.status === 'submitted').length;
    return { s, next, open: open.length, overdue, toReview, assigned: isAssignedTo(s, me.name) };
  });
  const shown = rows.filter(({ s, assigned, open, toReview }) => {
    const text = `${s.name} ${s.email} ${s.careerGoal || ''} ${s.planName}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (filter === 'assigned') return assigned;
    if (filter === 'followup') return open > 0 || toReview > 0;
    if (filter === 'enrolled') return s.status === 'enrolled';
    return true;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={kind === 'mentor' ? 'My mentees' : 'My students'}
        description="Students assigned to you by the Maxicareer team and everyone who has booked you."
        actions={
          <Button variant="primary" icon={ListPlus} onClick={() => newTask()}>
            Assign task
          </Button>
        }
      />
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: rows.length },
            { value: 'assigned', label: 'Assigned to me', count: rows.filter((r) => r.assigned).length },
            { value: 'followup', label: 'Needs follow-up', count: rows.filter((r) => r.open > 0 || r.toReview > 0).length },
            { value: 'enrolled', label: 'Enrolled', count: rows.filter((r) => r.s.status === 'enrolled').length },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search by name, email or goal" className="lg:ml-auto lg:w-72" />
      </div>
      {shown.length === 0 ? (
        <Panel>
          <Empty icon={Users} title={mentees.length ? 'No one matches' : 'No students yet'} body={mentees.length ? 'Try another filter or search.' : 'Students appear here when they book you or when an admin assigns them to you.'} />
        </Panel>
      ) : (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Program</Th>
                <Th>Progress</Th>
                <Th>Next session</Th>
                <Th>Open work</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF6]">
              {shown.map(({ s, next, open, overdue, toReview, assigned }) => (
                <tr key={s.id} className="hover:bg-[#F7F9FC] cursor-pointer" onClick={() => openMentee(s.id)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {s.avatarUrl ? <img src={s.avatarUrl} alt="" className="h-9 w-9 rounded-[10px] object-cover" /> : <Avatar name={s.name} size={36} />}
                      <div className="min-w-0">
                        <div className="font-semibold text-[#0D1B3E] truncate">{s.name}</div>
                        <div className="text-[12px] text-[#7A869E] truncate">{s.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="truncate max-w-[200px]">{s.planName}</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <MenteeStatus status={s.status} />
                      {assigned && <Badge tone="blue">Assigned</Badge>}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <StepMeter value={s.roadmapProgress || 0} steps={6} height={18} width={60} />
                      <span className="mc-num text-[12.5px]">{s.roadmapProgress || 0}%</span>
                    </div>
                  </Td>
                  <Td>{next ? <span className="text-[13px]">{relativeDay(next) || fmtDay(next)}</span> : <span className="text-[#9AA5BB]">—</span>}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {open > 0 && <Badge tone={overdue ? 'rose' : 'neutral'}>{overdue ? `${overdue} overdue` : `${open} task${open > 1 ? 's' : ''}`}</Badge>}
                      {toReview > 0 && <Badge tone="marigold">{toReview} to review</Badge>}
                      {!open && !toReview && <span className="text-[#9AA5BB]">—</span>}
                    </div>
                  </Td>
                  <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex gap-1">
                      <IconButton icon={MessageSquare} label={`Message ${s.name}`} onClick={() => chatWith(s.id)} />
                      <IconButton icon={ListPlus} label="Assign task" onClick={() => newTask(s.id)} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Mentee drawer                                                       */
/* ------------------------------------------------------------------ */

const TASK_TONE: Record<string, 'neutral' | 'blue' | 'mint' | 'rose'> = { pending: 'neutral', in_progress: 'blue', completed: 'mint', overdue: 'rose' };
const TASK_LABEL: Record<string, string> = { pending: 'To do', in_progress: 'In progress', completed: 'Done', overdue: 'Overdue' };

export const MenteeDrawer: React.FC<{ studentId: string | null; onClose: () => void }> = ({ studentId, onClose }) => {
  const { me, state, store, appointments, tasks, notes, chatWith, newTask, writeNotes, toast, go } = useProvider();
  const s = state.students.find((x) => x.id === studentId) || null;
  const [moduleFor, setModuleFor] = useState<string | null>(null);
  const [resourceFor, setResourceFor] = useState<string | null>(null);

  const myApts = s ? appointments.filter((a) => a.studentId === s.id).sort((a, b) => isoOf(b.date).localeCompare(isoOf(a.date))) : [];
  const myTasks = s ? tasks.filter((t) => t.studentId === s.id) : [];
  const work = s ? state.assignments.filter((a) => a.studentId === s.id) : [];
  const results = s ? state.assessments.filter((a) => a.studentId === s.id) : [];
  const modules = s ? state.curricula.filter((m) => m.studentId === s.id && m.createdBy === me.id) : [];
  const shared = s ? state.resources.filter((r) => r.studentId === s.id && r.sharedBy === me.id) : [];
  const myNotes = s ? notes.filter((n) => n.studentId === s.id).slice(-3).reverse() : [];

  return (
    <>
      <Drawer
        open={!!s}
        onClose={onClose}
        title={s?.name}
        subtitle={s && <span className="mc-num">{s.email}</span>}
        footer={
          s && (
            <>
              {s.phone && (
                <a href={`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0F9F6E] px-4 text-[13.5px] font-semibold text-white hover:bg-[#0B8A5F]">
                  WhatsApp
                </a>
              )}
              <Button icon={ListPlus} onClick={() => newTask(s.id)}>
                Assign task
              </Button>
              <Button variant="primary" icon={MessageSquare} onClick={() => chatWith(s.id)}>
                Message
              </Button>
            </>
          )
        }
      >
        {s && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <MenteeStatus status={s.status} />
              {s.mentorAssigned === me.name && <Badge tone="blue">You're their mentor</Badge>}
              {s.counselorAssigned === me.name && <Badge tone="violet">You're their counsellor</Badge>}
              {!isAssignedTo(s, me.name) && <Badge>Booked you</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Fact label="Program">{s.planName}</Fact>
              <Fact label="Cohort">{COHORT_NAMES[s.profession] || s.professionLabel}</Fact>
              <Fact label="School / company">{s.institutionOrCompany || '—'}</Fact>
              <Fact label="City">{s.city || '—'}</Fact>
              <Fact label="Phone">{s.phone || '—'}</Fact>
              <Fact label="Access until">{s.programEndsAt ? fmtDay(s.programEndsAt) : '—'}</Fact>
              <Fact label="Sessions so far">{s.counselingSessionsCount || 0}</Fact>
              <Fact label="Joined">{fmtDay(s.registeredDate)}</Fact>
            </div>

            <section>
              <div className="text-[12.5px] text-[#7A869E] mb-1">Career goal</div>
              <p className="text-[14px] text-[#26355A]">{s.careerGoal}</p>
              {s.careerInterests?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.careerInterests.map((i) => (
                    <Badge key={i}>{i}</Badge>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[14px] border border-[#DDE4EF] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="mc-display text-[15px] font-semibold">Progress</span>
                <span className="mc-num text-[13px] text-[#5B6885]">{s.roadmapProgress || 0}% of syllabus</span>
              </div>
              <StepMeter value={s.roadmapProgress || 0} steps={10} height={22} />
              {(s.headline || s.linkedinUrl || s.githubUrl || s.portfolioUrl || s.resumeFileId) && (
                <div className="pt-2 border-t border-[#EAEFF6] space-y-2">
                  {s.headline && <p className="text-[13.5px] font-medium">{s.headline}</p>}
                  <div className="flex flex-wrap gap-3 text-[13px]">
                    {s.linkedinUrl && (
                      <a href={s.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:underline">
                        <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                      </a>
                    )}
                    {s.githubUrl && (
                      <a href={s.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:underline">
                        <Github className="w-3.5 h-3.5" /> GitHub
                      </a>
                    )}
                    {s.portfolioUrl && (
                      <a href={s.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:underline">
                        <Globe className="w-3.5 h-3.5" /> Portfolio
                      </a>
                    )}
                    {s.resumeFileId && <FileLink fileId={s.resumeFileId} name={s.resumeFileName || 'Resume'} />}
                  </div>
                  {s.skills && s.skills.length > 0 && <p className="text-[12.5px] text-[#5B6885]">Skills: {s.skills.join(', ')}</p>}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <span className="mc-display text-[15px] font-semibold">Sessions with you</span>
                <span className="text-[12.5px] text-[#7A869E]">{myApts.length}</span>
              </div>
              {myApts.length === 0 ? (
                <p className="text-[13px] text-[#5B6885]">No sessions yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {myApts.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 rounded-[10px] bg-[#F7F9FC] px-3 py-2 text-[13px]">
                      <span className="min-w-0 truncate">
                        {fmtDay(a.date)} · {a.topic || a.counselingType}
                      </span>
                      {a.status === 'scheduled' ? (
                        <Button size="sm" onClick={() => writeNotes(a)}>
                          Complete
                        </Button>
                      ) : (
                        <Badge tone={a.status === 'completed' ? 'mint' : 'rose'}>{a.status === 'completed' ? 'Done' : 'Cancelled'}</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <span className="mc-display text-[15px] font-semibold">Tasks & submissions</span>
                <Button size="sm" variant="ghost" onClick={() => { onClose(); go('assignments'); }}>
                  Review work
                </Button>
              </div>
              {myTasks.length === 0 && work.length === 0 ? (
                <p className="text-[13px] text-[#5B6885]">No tasks yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {myTasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 rounded-[10px] bg-[#F7F9FC] px-3 py-2 text-[13px]">
                      <span className="min-w-0">
                        <span className="block font-medium truncate">{t.title}</span>
                        {t.dueDate && <span className="block text-[12px] text-[#7A869E]">Due {fmtDay(t.dueDate)}</span>}
                      </span>
                      <Badge tone={TASK_TONE[t.status] || 'neutral'}>{TASK_LABEL[t.status] || t.status}</Badge>
                    </li>
                  ))}
                  {work.map((w) => (
                    <li key={w.id} className="flex items-center justify-between gap-2 rounded-[10px] border border-[#EAEFF6] px-3 py-2 text-[13px]">
                      <span className="min-w-0">
                        <span className="block font-medium truncate">
                          {w.kind}: {w.title}
                        </span>
                        <span className="block text-[12px] text-[#7A869E]">Submitted {timeAgo(w.submittedAt)}</span>
                      </span>
                      <Badge tone={w.status === 'submitted' ? 'marigold' : w.status === 'reviewed' ? 'mint' : 'rose'}>{w.status === 'submitted' ? 'To review' : w.status === 'reviewed' ? `Reviewed${w.grade ? ` · ${w.grade}` : ''}` : 'Changes asked'}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {results.length > 0 && (
              <section>
                <div className="mc-display text-[15px] font-semibold mb-2">Tests & assessments</div>
                <ul className="space-y-1.5">
                  {results.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 rounded-[10px] bg-[#F7F9FC] px-3 py-2 text-[13px]">
                      <span className="min-w-0 truncate">
                        {r.assessmentName} <span className="text-[#7A869E]">· {r.completionDate}</span>
                      </span>
                      {typeof r.scorePercent === 'number' ? <Badge tone={r.passed === false ? 'rose' : 'mint'}>{r.scorePercent}%</Badge> : <Badge>{r.status.replace('_', ' ')}</Badge>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-[14px] border border-[#DDE4EF] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="mc-display text-[15px] font-semibold">Syllabus & resources you added</span>
                <div className="flex gap-1.5">
                  <Button size="sm" icon={BookPlus} onClick={() => setModuleFor(s.id)}>
                    Module
                  </Button>
                  <Button size="sm" icon={Share2} onClick={() => setResourceFor(s.id)}>
                    Resource
                  </Button>
                </div>
              </div>
              {modules.length === 0 && shared.length === 0 && <p className="text-[13px] text-[#5B6885]">Add a module to their syllabus or share a guide, template or video. Only this student sees it.</p>}
              {modules.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-2 text-[13px]">
                  <span>
                    <span className="font-semibold">{m.title}</span> <span className="text-[#7A869E]">· {plural(m.lessons.length, 'lesson')}</span>
                  </span>
                  <IconButton
                    icon={Trash2}
                    tone="danger"
                    label="Remove module"
                    onClick={async () => {
                      if (!window.confirm(`Remove "${m.title}" from ${s.name}'s syllabus?`)) return;
                      try {
                        await store.deleteCurriculumModule(m.id);
                        toast('Module removed.');
                      } catch (err) {
                        toast(err instanceof Error ? err.message : 'Could not remove it.', 'error');
                      }
                    }}
                  />
                </div>
              ))}
              {shared.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-2 text-[13px]">
                  <span className="min-w-0">
                    <Badge>{r.kind}</Badge> <span className="font-semibold">{r.title}</span>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="ml-1.5 text-[#2563EB] inline-flex items-center gap-0.5">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </span>
                  <IconButton
                    icon={Trash2}
                    tone="danger"
                    label="Remove resource"
                    onClick={async () => {
                      if (!window.confirm(`Stop sharing "${r.title}"?`)) return;
                      try {
                        await store.deleteResource(r.id);
                        toast('Resource removed.');
                      } catch (err) {
                        toast(err instanceof Error ? err.message : 'Could not remove it.', 'error');
                      }
                    }}
                  />
                </div>
              ))}
            </section>

            {myNotes.length > 0 && (
              <section>
                <div className="mc-display text-[15px] font-semibold mb-2">Recent session notes</div>
                <ul className="space-y-2">
                  {myNotes.map((n) => (
                    <li key={n.id} className="rounded-[12px] border border-[#EAEFF6] p-3 text-[13px]">
                      <div className="font-semibold">
                        {fmtDay(n.sessionDate)} · {n.counselingTopic}
                      </div>
                      <p className="text-[#5B6885] mt-1 line-clamp-3">{n.summary}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Drawer>
      <ModuleModal studentId={moduleFor} onClose={() => setModuleFor(null)} />
      <ResourceModal studentId={resourceFor} onClose={() => setResourceFor(null)} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 1-on-1 sessions                                                     */
/* ------------------------------------------------------------------ */

type SessionView = 'requests' | 'upcoming' | 'notes' | 'completed' | 'cancelled';

export const SessionsPage: React.FC = () => {
  const { state, store, toast, requests, appointments, notes, sessionMinutes, writeNotes, editLink, chatWith, openMentee, go } = useProvider();
  const today = todayIso();
  const pending = requests.filter((r) => r.status === 'pending');
  const [view, setView] = useState<SessionView>(pending.length ? 'requests' : 'upcoming');
  const noteFor = (id: string) => notes.find((n) => n.appointmentId === id);
  const ratingFor = (id: string) => state.feedback.find((f) => f.appointmentId === id);
  const noted = new Set(notes.map((n) => n.appointmentId));

  const upcoming = appointments.filter((a) => isUpcoming(a, today)).sort((a, b) => `${isoOf(a.date)}${to24h(a.time)}`.localeCompare(`${isoOf(b.date)}${to24h(b.time)}`));
  const awaitingNotes = appointments.filter((a) => needsNotes(a, noted, today)).sort((a, b) => isoOf(b.date).localeCompare(isoOf(a.date)));
  const completed = appointments.filter((a) => a.status === 'completed').sort((a, b) => isoOf(b.date).localeCompare(isoOf(a.date)));
  const cancelled = [
    ...appointments.filter((a) => a.status === 'cancelled').map((a) => ({ id: a.id, who: a.studentName, what: a.topic || a.counselingType, when: a.date, label: 'Cancelled' })),
    ...requests.filter((r) => r.status === 'rejected' || r.status === 'cancelled').map((r) => ({ id: r.id, who: r.studentName, what: r.counselingType, when: r.preferredDate, label: r.status === 'rejected' ? 'Declined' : 'Cancelled' })),
  ];
  const answered = requests.filter((r) => r.status !== 'pending');
  const acceptRate = answered.length ? Math.round((answered.filter((r) => r.status === 'accepted' || r.status === 'completed').length / answered.length) * 100) : null;

  const accept = async (id: string, name: string) => {
    const apt = await store.acceptCounselingRequest(id);
    if (!apt) return;
    if (apt.meetingLink) toast(`Confirmed. ${name} has your meeting link.`);
    else {
      toast(`Confirmed. Paste the meeting link so ${name} can join.`);
      editLink(apt);
    }
  };
  const decline = async (id: string, name: string) => {
    if (!window.confirm(`Decline ${name}'s request? They'll be asked to pick another time.`)) return;
    await store.rejectCounselingRequest(id);
    toast('Request declined.');
  };
  const cancel = async (a: Appointment) => {
    if (!window.confirm(`Cancel the session with ${a.studentName} on ${fmtDay(a.date)}? They'll be notified.`)) return;
    await store.updateAppointmentStatus(a.id, 'cancelled');
    toast('Session cancelled.');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="1-on-1 sessions"
        description="Booking requests, upcoming calls and your session history."
        actions={
          <Button icon={CalendarClock} onClick={() => go('availability')}>
            Availability
          </Button>
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Requests waiting" value={pending.length} />
        <Stat label="Upcoming" value={upcoming.length} hint={upcoming[0] ? `Next ${relativeDay(upcoming[0].date) || fmtDay(upcoming[0].date)}` : undefined} />
        <Stat label="Completed" value={completed.length} hint={`${Math.round(((completed.length * sessionMinutes) / 60) * 10) / 10} hours delivered`} />
        <Stat label="Acceptance rate" value={acceptRate === null ? '—' : `${acceptRate}%`} hint={`${answered.length} requests answered`} />
      </div>
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'requests', label: 'Requests', count: pending.length },
          { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { value: 'notes', label: 'Needs notes', count: awaitingNotes.length },
          { value: 'completed', label: 'Completed', count: completed.length },
          { value: 'cancelled', label: 'Cancelled', count: cancelled.length },
        ]}
      />

      {view === 'notes' && (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {awaitingNotes.length === 0 && <Empty icon={FileText} title="Every session has notes" body="Sessions that have happened but have no summary yet appear here." />}
          {awaitingNotes.map((a) => (
            <div key={a.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4">
              <div className="md:w-36 shrink-0">
                <div className="text-[13px] font-semibold">{fmtDay(a.date)}</div>
                <div className="text-[12.5px] text-[#5B6885]">{a.status === 'scheduled' ? 'Not marked complete' : 'Completed, no notes'}</div>
              </div>
              <button type="button" onClick={() => openMentee(a.studentId)} className="flex-1 min-w-0 text-left">
                <div className="text-[14px] font-semibold truncate">{a.studentName}</div>
                <div className="text-[13px] text-[#5B6885] truncate">{a.topic || a.counselingType}</div>
              </button>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="primary" icon={FileText} onClick={() => writeNotes(a)}>
                  Write notes
                </Button>
                {a.status === 'scheduled' && (
                  <Button size="sm" variant="ghost" onClick={() => cancel(a)}>
                    Didn't happen
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'requests' && (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {pending.length === 0 && <Empty icon={Inbox} title="No requests waiting" body="When a student asks for a session, it lands here first." />}
          {pending.map((r) => (
            <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4">
              <button type="button" onClick={() => openMentee(r.studentId)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <Avatar name={r.studentName} size={38} />
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold">{r.studentName}</span>
                  <span className="block text-[13px] text-[#5B6885]">
                    {r.counselingType}
                    {r.topic && r.topic !== r.counselingType ? ` · ${r.topic}` : ''}
                  </span>
                  {r.notes && <span className="block text-[12.5px] text-[#7A869E] mt-0.5 line-clamp-2">“{r.notes}”</span>}
                </span>
              </button>
              <div className="md:w-44 shrink-0">
                <div className="text-[13.5px] font-semibold">{fmtDay(r.preferredDate)}</div>
                <div className="text-[12.5px] text-[#5B6885]">
                  {r.preferredTime} · asked {r.requestDate}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="primary" icon={Check} onClick={() => accept(r.id, r.studentName)}>
                  Accept
                </Button>
                <Button size="sm" icon={X} onClick={() => decline(r.id, r.studentName)}>
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'upcoming' && (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {upcoming.length === 0 && <Empty icon={Video} title="No upcoming sessions" body="Accepted requests appear here. Add a meeting link to each one, or save a personal link on Availability." />}
          {upcoming.map((a) => {
            const soon = (daysFromToday(a.date) ?? 99) <= 1;
            return (
              <div key={a.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4">
                <div className="md:w-36 shrink-0">
                  <div className={cx('text-[13px] font-semibold', soon ? 'text-[#94570A]' : 'text-[#2563EB]')}>{relativeDay(a.date) || fmtDay(a.date)}</div>
                  <div className="text-[13px] text-[#5B6885]">
                    {fmtDay(a.date, { day: 'numeric', month: 'short' })} · {fmtTime(a.time)}
                  </div>
                </div>
                <button type="button" onClick={() => openMentee(a.studentId)} className="flex-1 min-w-0 text-left">
                  <div className="text-[14px] font-semibold truncate">{a.studentName}</div>
                  <div className="text-[13px] text-[#5B6885] truncate">{a.topic || a.counselingType}</div>
                </button>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {a.meetingLink ? (
                    <>
                      <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[#2563EB] px-3 text-[12.5px] font-semibold text-white hover:bg-[#1D4FD7]">
                        <Video className="w-3.5 h-3.5" /> Join
                      </a>
                      <IconButton icon={Link2} label="Change meeting link" onClick={() => editLink(a)} />
                    </>
                  ) : (
                    <Button size="sm" variant="primary" icon={Link2} onClick={() => editLink(a)}>
                      Add meeting link
                    </Button>
                  )}
                  <Button size="sm" icon={FileText} onClick={() => writeNotes(a)}>
                    Complete & notes
                  </Button>
                  <IconButton icon={MessageSquare} label="Message" onClick={() => chatWith(a.studentId)} />
                  <Button size="sm" variant="ghost" onClick={() => cancel(a)}>
                    Cancel
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'completed' && (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {completed.length === 0 && <Empty icon={Check} title="No completed sessions yet" />}
          {completed.map((a) => {
            const note = noteFor(a.id);
            const fb = ratingFor(a.id);
            return (
              <div key={a.id} className="px-5 py-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-semibold">{a.studentName}</span>
                    <span className="text-[13px] text-[#5B6885]"> · {a.topic || a.counselingType}</span>
                  </div>
                  <span className="text-[12.5px] text-[#7A869E]">{fmtDay(a.date)}</span>
                  {fb && <StarRating value={fb.rating} size={14} />}
                  {!note && (
                    <Button size="sm" variant="primary" icon={FileText} onClick={() => writeNotes(a)}>
                      Write notes
                    </Button>
                  )}
                </div>
                {note ? (
                  <div className="rounded-[10px] bg-[#F7F9FC] px-3.5 py-2.5 text-[13px] text-[#33415F] space-y-1">
                    <p>{note.summary}</p>
                    {note.nextSteps && <p className="text-[#5B6885]">Next: {note.nextSteps}</p>}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-[#94570A]">No notes yet. The student is waiting for a summary.</p>
                )}
                {fb?.comment && <p className="text-[12.5px] text-[#5B6885] italic">“{fb.comment}”</p>}
              </div>
            );
          })}
        </div>
      )}

      {view === 'cancelled' && (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {cancelled.length === 0 && <Empty icon={CalendarX2} title="Nothing cancelled" />}
          {cancelled.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 text-[13.5px]">
              <span className="flex-1 min-w-0 truncate">
                <span className="font-semibold">{c.who}</span> <span className="text-[#5B6885]">· {c.what}</span>
              </span>
              <span className="text-[12.5px] text-[#7A869E]">{fmtDay(c.when)}</span>
              <Badge tone="rose">{c.label}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Appointment availability                                            */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DURATIONS = ['30 mins', '45 mins', '60 mins', '90 mins'];
const PRESET_SLOTS = ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:30 PM'];

/** "17:00" -> "05:00 PM" (the format booking slots are stored in). */
function toSlot(hhmm: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return hhmm;
  const h = Number(m[1]);
  return `${String(h % 12 || 12).padStart(2, '0')}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

const bySlotTime = (a: string, b: string) => to24h(a).localeCompare(to24h(b));

export const AvailabilityPage: React.FC = () => {
  const { kind, me, store, toast } = useProvider();
  const savedDays = (me as Counselor).availabilityDays || (me as Mentor).availabilityDays || [];
  const saved = {
    days: savedDays.length ? savedDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    slots: [...(me.availableTimeSlots || [])].sort(bySlotTime),
    duration: me.sessionDuration || '45 mins',
    blocked: [...(me.blockedDates || [])].sort(),
    link: me.meetingLink || '',
  };
  const [days, setDays] = useState<string[]>(saved.days);
  const [slots, setSlots] = useState<string[]>(saved.slots);
  const [duration, setDuration] = useState(saved.duration);
  const [blocked, setBlocked] = useState<string[]>(saved.blocked);
  const [link, setLink] = useState(saved.link);
  const [newSlot, setNewSlot] = useState('');
  const [newBlocked, setNewBlocked] = useState('');
  const [saving, setSaving] = useState(false);
  const today = todayIso();
  const dirty =
    JSON.stringify([days, slots, duration, blocked, link.trim()]) !== JSON.stringify([saved.days, saved.slots, saved.duration, saved.blocked, saved.link]);
  const linkInvalid = !!link.trim() && !isMeetingLink(link);

  const addSlot = (slot: string) => {
    if (!slot || slots.includes(slot)) return;
    setSlots([...slots, slot].sort(bySlotTime));
  };

  const preview = useMemo(() => {
    const out: string[] = [];
    const d = new Date();
    // Booking starts tomorrow, so the preview does too.
    for (let i = 1; i <= 21 && out.length < 8; i++) {
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const name = day.toLocaleDateString('en-US', { weekday: 'long' });
      if (days.includes(name) && !blocked.includes(iso)) out.push(iso);
    }
    return out;
  }, [days, blocked]);

  const save = async () => {
    if (!days.length) return toast('Choose at least one day students can book.', 'error');
    if (!slots.length) return toast('Add at least one time slot.', 'error');
    if (linkInvalid) return toast(MEETING_LINK_HELP, 'error');
    setSaving(true);
    const updates = { availabilityDays: days, availableTimeSlots: slots, sessionDuration: duration, blockedDates: blocked.filter((d) => d >= today), meetingLink: link.trim() };
    const res = kind === 'counselor' ? await store.updateCounselorProfile(me.id, updates) : await store.updateMentorProfile(me.id, updates);
    setSaving(false);
    if (res !== undefined) toast('Availability saved. Students see the new times when booking.');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Appointment availability"
        description="Choose when students can book you. Days off block bookings for that date."
        actions={
          <Button variant="primary" icon={Save} onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving…' : dirty ? 'Save availability' : 'Saved'}
          </Button>
        }
      />
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
        <div className="space-y-5">
          <Panel title="Working days" description="Students can request these weekdays.">
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => {
                const on = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDays(on ? days.filter((x) => x !== d) : WEEKDAYS.filter((w) => w === d || days.includes(w)))}
                    className={cx('h-10 px-4 rounded-[10px] border text-[13.5px] font-semibold transition-colors', on ? 'bg-[#0D1B3E] border-[#0D1B3E] text-white' : 'bg-white border-[#D3DBE8] text-[#33415F] hover:border-[#B7C3D7]')}
                  >
                    {d.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Time slots" description="Start times students can pick on those days.">
            <div className="flex flex-wrap gap-2">
              {slots.length === 0 && <p className="text-[13px] text-[#5B6885]">No slots yet. Add one below.</p>}
              {slots.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 h-9 pl-3 pr-1.5 rounded-[10px] bg-[#E8F0FE] text-[#1D4FD7] text-[13.5px] font-semibold mc-num">
                  {s}
                  <button type="button" onClick={() => setSlots(slots.filter((x) => x !== s))} className="p-1 rounded hover:bg-white/60" aria-label={`Remove ${s}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <Field label="Add a time">
                <Input type="time" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} className="w-36" />
              </Field>
              <Button
                icon={Plus}
                disabled={!newSlot}
                onClick={() => {
                  addSlot(toSlot(newSlot));
                  setNewSlot('');
                }}
              >
                Add
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-[12px] text-[#7A869E] mr-1 self-center">Quick add:</span>
              {PRESET_SLOTS.filter((p) => !slots.includes(p)).map((p) => (
                <button key={p} type="button" onClick={() => addSlot(p)} className="rounded-full border border-[#DDE4EF] px-2.5 py-1 text-[12px] text-[#33415F] hover:border-[#2563EB] hover:text-[#2563EB] mc-num">
                  + {p}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Session length">
            <Select value={duration} onChange={(e) => setDuration(e.target.value)} className="max-w-[200px]">
              {[...new Set([...DURATIONS, duration])].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
            <p className="mt-2 text-[12.5px] text-[#7A869E]">Also used to count your session hours on the Work hours page.</p>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Personal meeting link" description="Your own Google Meet, Zoom or Teams room. Every session you accept uses it.">
            <Field label="Meeting link" hint={linkInvalid ? MEETING_LINK_HELP : 'Upcoming sessions without a link get this one when you save, and those students are notified.'}>
              <Input type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" aria-invalid={linkInvalid} />
            </Field>
            {!saved.link && <p className="mt-2 text-[12.5px] text-[#94570A]">Until you add one, paste a link on each session from 1-on-1 sessions.</p>}
            {saved.link && (
              <a href={saved.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2563EB] hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> Test your link
              </a>
            )}
          </Panel>

          <Panel title="Days off" description="Holidays, exams, travel. Students can't book these dates.">
            <div className="flex items-end gap-2">
              <Field label="Date" className="flex-1">
                <Input type="date" min={today} value={newBlocked} onChange={(e) => setNewBlocked(e.target.value)} />
              </Field>
              <Button
                icon={CalendarX2}
                disabled={!newBlocked}
                onClick={() => {
                  if (!blocked.includes(newBlocked)) setBlocked([...blocked, newBlocked].sort());
                  setNewBlocked('');
                }}
              >
                Block
              </Button>
            </div>
            <ul className="mt-3 space-y-1.5">
              {blocked.filter((d) => d >= today).length === 0 && <li className="text-[13px] text-[#5B6885]">No days off planned.</li>}
              {blocked
                .filter((d) => d >= today)
                .map((d) => (
                  <li key={d} className="flex items-center justify-between rounded-[10px] bg-[#F7F9FC] px-3 py-2 text-[13.5px]">
                    {fmtDay(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    <IconButton icon={Trash2} tone="danger" label="Remove day off" onClick={() => setBlocked(blocked.filter((x) => x !== d))} />
                  </li>
                ))}
            </ul>
          </Panel>

          <Panel title="What students see" description="Your next bookable days.">
            <div className="text-[13.5px] text-[#26355A] space-y-2">
              <p>
                <span className="text-[#7A869E]">Days:</span> {days.length ? days.map((d) => d.slice(0, 3)).join(', ') : 'none'}
              </p>
              <p>
                <span className="text-[#7A869E]">Times:</span> {slots.length ? slots.join(', ') : 'none'}
              </p>
              <p>
                <span className="text-[#7A869E]">Length:</span> {duration}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {preview.map((d) => (
                <Badge key={d} tone="mint">
                  {fmtDay(d, { weekday: 'short', day: 'numeric', month: 'short' })}
                </Badge>
              ))}
              {preview.length === 0 && <span className="text-[13px] text-[#B42F3B]">No bookable days in the next 3 weeks.</span>}
            </div>
            {dirty && <p className="mt-3 text-[12.5px] text-[#94570A]">You have unsaved changes.</p>}
          </Panel>
        </div>
      </div>
    </div>
  );
};
