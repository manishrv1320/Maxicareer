import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Route, ArrowUp, ArrowDown, Trash2, Bell, RotateCcw, Pencil, Copy, Check, Circle, CircleDot, Ban } from 'lucide-react';
import { useAdmin, COHORT_LABEL, roadmapProgress, Milestone, MilestoneStatus, RoadmapTemplate, StudentRoadmap } from '../context';
import { PageHeader, Panel, Button, IconButton, Badge, Input, Textarea, Select, Field, Segmented, SearchInput, StepMeter, Avatar, Empty, Modal, cx } from '../ui';
import { uid, formatDate, daysUntil } from '../lib';

const STATUS_META: Record<MilestoneStatus, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  todo: { label: 'Not started', icon: Circle, cls: 'text-[#8C97AE] border-[#D3DBE8] bg-white' },
  doing: { label: 'In progress', icon: CircleDot, cls: 'text-[#2563EB] border-[#BFD3FB] bg-[#E8F0FE]' },
  done: { label: 'Done', icon: Check, cls: 'text-white border-[#0F9F6E] bg-[#0F9F6E]' },
  blocked: { label: 'Blocked', icon: Ban, cls: 'text-[#B42F3B] border-[#F1C9CD] bg-[#FCEBEC]' },
};
const NEXT_STATUS: Record<MilestoneStatus, MilestoneStatus> = { todo: 'doing', doing: 'done', done: 'todo', blocked: 'doing' };

const emptyTemplate: Omit<RoadmapTemplate, 'id'> = { title: '', audience: '', duration: '8 weeks', milestones: [], status: 'Draft', cohort: '' };

export const Roadmaps: React.FC = () => {
  const { students, templates, setTemplates, studentRoadmaps, setStudentRoadmaps, roadmapFocus, setRoadmapFocus, addAudit, notify, toast } = useAdmin();
  const [view, setView] = useState<'students' | 'templates'>('students');
  const [query, setQuery] = useState('');
  const [listFilter, setListFilter] = useState<'all' | 'with' | 'without'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState('');
  const [startTemplate, setStartTemplate] = useState('');
  const [editingTpl, setEditingTpl] = useState<(Omit<RoadmapTemplate, 'id'> & { id?: string; text: string }) | null>(null);
  const [openNote, setOpenNote] = useState<string | null>(null);

  useEffect(() => {
    if (roadmapFocus) {
      setView('students');
      setSelectedId(roadmapFocus);
      setRoadmapFocus(null);
    }
  }, [roadmapFocus, setRoadmapFocus]);

  useEffect(() => {
    if (!selectedId && students.length) setSelectedId(students[0]._id);
  }, [students, selectedId]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => (listFilter === 'all' ? true : listFilter === 'with' ? !!studentRoadmaps[s._id] : !studentRoadmaps[s._id]))
      .filter((s) => (!q ? true : s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)));
  }, [students, query, listFilter, studentRoadmaps]);

  const student = students.find((s) => s._id === selectedId) || null;
  const roadmap = student ? studentRoadmaps[student._id] : undefined;
  const progress = roadmapProgress(roadmap);
  const recommended = student ? templates.find((t) => t.cohort === student.profession) : undefined;

  useEffect(() => {
    setStartTemplate(recommended?.id || templates[0]?.id || '');
  }, [selectedId, recommended?.id, templates]);

  const saveRoadmap = (next: StudentRoadmap | null, auditAction?: string, auditTarget?: string) => {
    if (!student) return;
    setStudentRoadmaps((prev) => {
      const copy = { ...prev };
      if (next) copy[student._id] = { ...next, updatedAt: new Date().toISOString() };
      else delete copy[student._id];
      return copy;
    });
    if (auditAction) addAudit('Roadmaps', auditAction, auditTarget || student.name);
  };

  const updateMilestone = (id: string, patch: Partial<Milestone>, audit?: string) => {
    if (!roadmap) return;
    saveRoadmap({ ...roadmap, milestones: roadmap.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)) }, audit, audit ? `${student?.name}: ${roadmap.milestones.find((m) => m.id === id)?.title}` : undefined);
  };

  const move = (idx: number, dir: -1 | 1) => {
    if (!roadmap) return;
    const ms = [...roadmap.milestones];
    const j = idx + dir;
    if (j < 0 || j >= ms.length) return;
    [ms[idx], ms[j]] = [ms[j], ms[idx]];
    saveRoadmap({ ...roadmap, milestones: ms });
  };

  const fromTemplate = (tplId: string | null): StudentRoadmap | null => {
    if (!student) return null;
    const tpl = templates.find((t) => t.id === tplId);
    const weeks = parseInt(tpl?.duration || '8', 10) || 8;
    const per = Math.max(1, Math.floor((weeks * 7) / Math.max(1, tpl?.milestones.length || 1)));
    return {
      studentId: student._id,
      templateId: tpl?.id || null,
      goal: student.detail || '',
      milestones: (tpl?.milestones || []).map((title, i) => ({
        id: uid('ms'),
        title,
        status: 'todo' as MilestoneStatus,
        due: new Date(Date.now() + per * (i + 1) * 86400000).toISOString().slice(0, 10),
        note: '',
      })),
      updatedAt: new Date().toISOString(),
    };
  };

  const usedBy = (tplId: string) => Object.values(studentRoadmaps).filter((r) => r.templateId === tplId).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roadmaps"
        description="Templates give each cohort a starting path. Every student then gets their own copy that you can reshape around their goal."
        actions={
          view === 'templates' ? (
            <Button variant="primary" icon={Plus} onClick={() => setEditingTpl({ ...emptyTemplate, text: '' })}>
              New template
            </Button>
          ) : undefined
        }
      />

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'students', label: 'Student roadmaps', count: Object.keys(studentRoadmaps).length },
          { value: 'templates', label: 'Templates', count: templates.length },
        ]}
      />

      {view === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
          {/* Student list */}
          <Panel flush className="lg:sticky lg:top-20">
            <div className="p-3 space-y-2 border-b border-[#EAEFF6]">
              <SearchInput value={query} onChange={setQuery} placeholder="Find a student" />
              <Segmented
                value={listFilter}
                onChange={setListFilter}
                className="w-full"
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'with', label: 'Has roadmap' },
                  { value: 'without', label: 'None yet' },
                ]}
              />
            </div>
            <ul className="max-h-[560px] overflow-y-auto py-1">
              {list.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-[#5B6885]">No students here.</li>}
              {list.map((s) => {
                const r = studentRoadmaps[s._id];
                const p = roadmapProgress(r);
                const active = s._id === selectedId;
                return (
                  <li key={s._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(s._id);
                        if (window.innerWidth < 1024) setTimeout(() => document.getElementById('mc-roadmap-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                      }}
                      className={cx('w-full flex items-center gap-3 px-3 py-2.5 text-left border-l-[3px]', active ? 'bg-[#EEF4FF] border-[#2563EB]' : 'border-transparent hover:bg-[#F7F9FC]')}
                    >
                      <Avatar name={s.name} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-semibold text-[#0D1B3E] truncate">{s.name}</span>
                        <span className="block text-[12px] text-[#5B6885] truncate">{COHORT_LABEL[s.profession]}</span>
                      </span>
                      {r ? <StepMeter value={p} steps={4} height={14} width={30} /> : <span className="text-[11.5px] text-[#94570A]">No plan</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* Editor */}
          {!student ? (
            <Panel>
              <Empty icon={Route} title="Pick a student" body="Choose someone on the left to build or edit their roadmap." />
            </Panel>
          ) : (
            <div id="mc-roadmap-editor" className="space-y-4 min-w-0 scroll-mt-20">
              <Panel>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar name={student.name} size={48} tone="ink" />
                  <div className="min-w-0 flex-1">
                    <h2 className="mc-display text-[22px] font-semibold text-[#0D1B3E] truncate">{student.name}</h2>
                    <p className="text-[13px] text-[#5B6885]">
                      {COHORT_LABEL[student.profession]} · {student.planName.split('(')[0].trim()} · Mentor: {student.mentorAssigned || 'Unassigned'}
                    </p>
                  </div>
                  {roadmap && (
                    <div className="flex items-end gap-3">
                      <StepMeter value={progress} steps={8} height={34} width={110} label={`${student.name} roadmap progress`} />
                      <div className="mc-display mc-num text-[28px] font-semibold text-[#0D1B3E] leading-none">{progress}%</div>
                    </div>
                  )}
                </div>
              </Panel>

              {!roadmap ? (
                <Panel title="Start a roadmap" description="Copy a template, then edit any step for this student. Changes never affect the template.">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={startTemplate} onChange={(e) => setStartTemplate(e.target.value)} className="sm:flex-1" aria-label="Template">
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.milestones.length} steps){t.id === recommended?.id ? ' · recommended' : ''}
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="primary"
                      icon={Copy}
                      disabled={!startTemplate}
                      onClick={() => saveRoadmap(fromTemplate(startTemplate), 'Created student roadmap', `${student.name} from ${templates.find((t) => t.id === startTemplate)?.title}`)}
                    >
                      Use template
                    </Button>
                    <Button onClick={() => saveRoadmap(fromTemplate(null), 'Created blank student roadmap', student.name)}>Start blank</Button>
                  </div>
                </Panel>
              ) : (
                <>
                  <Panel title="Goal" description="What this student is working towards, in their words if possible.">
                    <Textarea
                      value={roadmap.goal}
                      rows={2}
                      onChange={(e) => saveRoadmap({ ...roadmap, goal: e.target.value })}
                      onBlur={() => addAudit('Roadmaps', 'Updated goal', student.name)}
                      placeholder="e.g. Land a data analyst role in Bengaluru by March"
                    />
                  </Panel>

                  <Panel
                    title="Steps"
                    description={`${roadmap.milestones.filter((m) => m.status === 'done').length} of ${roadmap.milestones.length} done. Click a step's marker to move it forward.`}
                    actions={
                      <>
                        <Button
                          size="sm"
                          icon={Bell}
                          onClick={() => {
                            notify({ title: `Roadmap updated for ${student.name}`, body: `Progress is now ${progress}%. Student notified by email.`, category: 'students', link: 'roadmaps' });
                            addAudit('Roadmaps', 'Sent roadmap update to student', student.email);
                            toast(`Roadmap update queued for ${student.email}.`);
                          }}
                        >
                          Notify student
                        </Button>
                      </>
                    }
                  >
                    {roadmap.milestones.length === 0 && <p className="text-[13.5px] text-[#5B6885] pb-3">No steps yet. Add the first one below.</p>}
                    <ol className="relative">
                      {roadmap.milestones.map((m, i) => {
                        const meta = STATUS_META[m.status];
                        const Icon = meta.icon;
                        const d = daysUntil(m.due);
                        const overdue = d !== null && d < 0 && m.status !== 'done';
                        return (
                          <li key={m.id} className="relative flex gap-3 pb-4 last:pb-0" style={{ paddingLeft: `${Math.min(i, 6) * 6}px` }}>
                            {i < roadmap.milestones.length - 1 && <span className="absolute top-8 bottom-0 w-px bg-[#DDE4EF]" style={{ left: `${Math.min(i, 6) * 6 + 14}px` }} aria-hidden />}
                            <button
                              type="button"
                              onClick={() => updateMilestone(m.id, { status: NEXT_STATUS[m.status] }, `Marked "${STATUS_META[NEXT_STATUS[m.status]].label}"`)}
                              className={cx('relative z-[1] mt-0.5 h-[29px] w-[29px] shrink-0 rounded-[8px] border flex items-center justify-center', meta.cls)}
                              title={`${meta.label}: click to change`}
                              aria-label={`${m.title}: ${meta.label}. Click to change.`}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                            <div className="flex-1 min-w-0 rounded-[12px] border border-[#EAEFF6] bg-[#FBFCFE] px-3 py-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                  value={m.title}
                                  onChange={(e) => updateMilestone(m.id, { title: e.target.value })}
                                  className={cx('flex-1 min-w-0 bg-transparent text-[14px] font-semibold focus:outline-none rounded px-1 -mx-1 focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20', m.status === 'done' ? 'text-[#5B6885] line-through decoration-[#0F9F6E]/60' : 'text-[#0D1B3E]')}
                                  aria-label="Step title"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <select
                                    value={m.status}
                                    onChange={(e) => updateMilestone(m.id, { status: e.target.value as MilestoneStatus }, `Marked "${STATUS_META[e.target.value as MilestoneStatus].label}"`)}
                                    className="h-8 rounded-[8px] border border-[#D3DBE8] bg-white px-2 text-[12.5px] font-medium"
                                    aria-label="Step status"
                                  >
                                    {Object.entries(STATUS_META).map(([k, v]) => (
                                      <option key={k} value={k}>
                                        {v.label}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="date"
                                    value={m.due}
                                    onChange={(e) => updateMilestone(m.id, { due: e.target.value })}
                                    className={cx('h-8 rounded-[8px] border bg-white px-2 text-[12.5px]', overdue ? 'border-[#F1C9CD] text-[#B42F3B]' : 'border-[#D3DBE8] text-[#26355A]')}
                                    aria-label="Due date"
                                  />
                                  <IconButton icon={Pencil} label="Note" onClick={() => setOpenNote(openNote === m.id ? null : m.id)} />
                                  <IconButton icon={ArrowUp} label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-30" />
                                  <IconButton icon={ArrowDown} label="Move down" onClick={() => move(i, 1)} disabled={i === roadmap.milestones.length - 1} className="disabled:opacity-30" />
                                  <IconButton
                                    icon={Trash2}
                                    tone="danger"
                                    label="Remove step"
                                    onClick={() => saveRoadmap({ ...roadmap, milestones: roadmap.milestones.filter((x) => x.id !== m.id) }, 'Removed step', `${student.name}: ${m.title}`)}
                                  />
                                </div>
                              </div>
                              {(overdue || m.note) && openNote !== m.id && (
                                <div className="mt-1.5 flex flex-wrap gap-2 items-center text-[12.5px]">
                                  {overdue && <Badge tone="rose">Overdue by {Math.abs(d!)} day{Math.abs(d!) === 1 ? '' : 's'}</Badge>}
                                  {m.note && <span className="text-[#5B6885]">{m.note}</span>}
                                </div>
                              )}
                              {openNote === m.id && (
                                <Textarea
                                  className="mt-2"
                                  rows={2}
                                  autoFocus
                                  value={m.note}
                                  placeholder="Mentor note for this step"
                                  onChange={(e) => updateMilestone(m.id, { note: e.target.value })}
                                  onBlur={() => setOpenNote(null)}
                                />
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                    <form
                      className="mt-4 flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newMilestone.trim()) return;
                        saveRoadmap(
                          { ...roadmap, milestones: [...roadmap.milestones, { id: uid('ms'), title: newMilestone.trim(), status: 'todo', due: '', note: '' }] },
                          'Added step',
                          `${student.name}: ${newMilestone.trim()}`
                        );
                        setNewMilestone('');
                      }}
                    >
                      <Input value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} placeholder="Add a step for this student, e.g. Mock interview with Infosys panel" />
                      <Button type="submit" variant="dark" icon={Plus}>
                        Add
                      </Button>
                    </form>
                  </Panel>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-[#7A869E]">
                    <span>
                      Based on {templates.find((t) => t.id === roadmap.templateId)?.title || 'a blank roadmap'} · last edited {formatDate(roadmap.updatedAt, true)}
                    </span>
                    <div className="flex gap-2">
                      {roadmap.templateId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={RotateCcw}
                          onClick={() => window.confirm('Replace all steps with the template again? Custom steps and notes will be lost.') && saveRoadmap(fromTemplate(roadmap.templateId), 'Reset roadmap to template', student.name)}
                        >
                          Reset to template
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        onClick={() => window.confirm(`Remove ${student.name}'s roadmap?`) && saveRoadmap(null, 'Removed student roadmap', student.name)}
                      >
                        Remove roadmap
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {view === 'templates' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {templates.length === 0 && (
            <Panel className="xl:col-span-2">
              <Empty icon={Route} title="No templates yet" body="Create one to give students in a cohort a ready-made starting path." />
            </Panel>
          )}
          {templates.map((t) => (
            <Panel
              key={t.id}
              title={t.title}
              description={`${t.audience || 'Any learner'} · ${t.duration}`}
              actions={<Badge tone={t.status === 'Published' ? 'mint' : 'marigold'} dot>{t.status}</Badge>}
            >
              <ol className="space-y-1.5">
                {t.milestones.map((m, i) => (
                  <li key={i} className="flex items-end gap-2.5 text-[13.5px] text-[#26355A]">
                    <span className="w-6 shrink-0 flex items-end" aria-hidden>
                      <span className="block w-full rounded-[2px] bg-[#BFD3FB]" style={{ height: 4 + i * 3 }} />
                    </span>
                    <span>{m}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 pt-3 border-t border-[#EAEFF6] flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] text-[#5B6885] mr-auto">
                  Used by <span className="mc-num font-semibold text-[#26355A]">{usedBy(t.id)}</span> student{usedBy(t.id) === 1 ? '' : 's'}
                </span>
                <Button size="sm" icon={Pencil} onClick={() => setEditingTpl({ ...t, text: t.milestones.join('\n') })}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setTemplates((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: x.status === 'Published' ? 'Draft' : 'Published' } : x)));
                    addAudit('Roadmaps', t.status === 'Published' ? 'Unpublished template' : 'Published template', t.title);
                  }}
                >
                  {t.status === 'Published' ? 'Unpublish' : 'Publish'}
                </Button>
                <IconButton
                  icon={Trash2}
                  tone="danger"
                  label="Delete template"
                  onClick={() => {
                    if (!window.confirm(`Delete "${t.title}"? Student roadmaps made from it are kept.`)) return;
                    setTemplates((prev) => prev.filter((x) => x.id !== t.id));
                    addAudit('Roadmaps', 'Deleted template', t.title);
                  }}
                />
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={!!editingTpl}
        onClose={() => setEditingTpl(null)}
        title={editingTpl?.id ? 'Edit template' : 'New template'}
        width="max-w-xl"
        footer={
          <>
            <Button onClick={() => setEditingTpl(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!editingTpl?.title.trim()}
              onClick={() => {
                if (!editingTpl) return;
                const milestones = editingTpl.text.split('\n').map((x) => x.trim()).filter(Boolean);
                const { text, ...rest } = editingTpl;
                if (editingTpl.id) {
                  setTemplates((prev) => prev.map((x) => (x.id === editingTpl.id ? { ...(rest as RoadmapTemplate), milestones } : x)));
                  addAudit('Roadmaps', 'Edited template', editingTpl.title);
                } else {
                  setTemplates((prev) => [{ ...(rest as RoadmapTemplate), id: uid('rm'), milestones }, ...prev]);
                  addAudit('Roadmaps', 'Created template', editingTpl.title);
                }
                setEditingTpl(null);
              }}
            >
              Save template
            </Button>
          </>
        }
      >
        {editingTpl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title" className="sm:col-span-2">
              <Input value={editingTpl.title} onChange={(e) => setEditingTpl({ ...editingTpl, title: e.target.value })} placeholder="College placement ready" />
            </Field>
            <Field label="Best for cohort">
              <Select value={editingTpl.cohort || ''} onChange={(e) => setEditingTpl({ ...editingTpl, cohort: e.target.value })}>
                <option value="">Any cohort</option>
                {Object.entries(COHORT_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duration">
              <Input value={editingTpl.duration} onChange={(e) => setEditingTpl({ ...editingTpl, duration: e.target.value })} placeholder="12 weeks" />
            </Field>
            <Field label="Audience" className="sm:col-span-2">
              <Input value={editingTpl.audience} onChange={(e) => setEditingTpl({ ...editingTpl, audience: e.target.value })} placeholder="Final-year engineering students" />
            </Field>
            <Field label="Steps" hint="One step per line, in order." className="sm:col-span-2">
              <Textarea rows={6} value={editingTpl.text} onChange={(e) => setEditingTpl({ ...editingTpl, text: e.target.value })} placeholder={'Skill gap audit\nPortfolio project\nMock interviews'} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
};
