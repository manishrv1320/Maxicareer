import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, Video } from 'lucide-react';
import { Button, Field, Input, Modal, Panel, Segmented, Textarea, cx, IconButton } from '../admin/ui';
import { useCareerStore } from '../../hooks/useCareerStore';
import type { CalendarNote, CalendarNoteKind } from '../../types/portal';
import { FormError, fmtDay, fmtTime, parseDay, toIsoDay, todayIso, useAsyncAction } from './kit';

export type CalendarKind = 'session' | 'deadline' | 'assessment' | 'target' | 'event' | 'note' | 'reminder' | 'task' | 'milestone' | 'blocked';

export interface CalendarItem {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  title: string;
  subtitle?: string;
  kind: CalendarKind;
  link?: string;
  /** Set for the viewer's own notes, which can be edited here. */
  note?: CalendarNote;
}

export const KIND_META: Record<CalendarKind, { label: string; dot: string; chip: string }> = {
  session: { label: 'Session', dot: 'bg-[#2563EB]', chip: 'bg-[#E8F0FE] text-[#1D4FD7]' },
  deadline: { label: 'Due date', dot: 'bg-[#F2A93B]', chip: 'bg-[#FDF1DC] text-[#94570A]' },
  assessment: { label: 'Assessment', dot: 'bg-[#6D4AE0]', chip: 'bg-[#EFEBFD] text-[#5B3CC4]' },
  target: { label: 'Target', dot: 'bg-[#0F9F6E]', chip: 'bg-[#E3F6EE] text-[#0B7A55]' },
  milestone: { label: 'Milestone', dot: 'bg-[#0F9F6E]', chip: 'bg-[#E3F6EE] text-[#0B7A55]' },
  event: { label: 'Event', dot: 'bg-[#38BDF8]', chip: 'bg-[#E0F4FD] text-[#0B6A93]' },
  note: { label: 'Note', dot: 'bg-[#8C97AE]', chip: 'bg-[#EEF2F7] text-[#4A5875]' },
  reminder: { label: 'Reminder', dot: 'bg-[#D93F4C]', chip: 'bg-[#FCEBEC] text-[#B42F3B]' },
  task: { label: 'To-do', dot: 'bg-[#0D1B3E]', chip: 'bg-[#E4E8F0] text-[#0D1B3E]' },
  blocked: { label: 'Unavailable', dot: 'bg-[#B7C3D7]', chip: 'bg-[#EEF2F7] text-[#5B6885]' },
};

const NOTE_LABEL: Record<CalendarNoteKind, string> = { note: 'Note', reminder: 'Reminder', target: 'Target', task: 'To-do' };
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarBoardProps {
  items: CalendarItem[];
  /** Which note types this person can add. */
  noteKinds: CalendarNoteKind[];
  /** Kinds shown in the legend. */
  legend: CalendarKind[];
  emptyHint?: string;
  onToast?: (message: string) => void;
}

export const CalendarBoard: React.FC<CalendarBoardProps> = ({ items, noteKinds, legend, emptyHint, onToast }) => {
  const today = todayIso();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [hidden, setHidden] = useState<Set<CalendarKind>>(new Set());
  const [editing, setEditing] = useState<{ id?: string; date: string; time: string; title: string; note: string; kind: CalendarNoteKind; done: boolean } | null>(null);
  const { saveCalendarNote, deleteCalendarNote } = useCareerStore();
  const { busy, error, setError, run } = useAsyncAction();

  const shown = useMemo(() => items.filter((i) => !hidden.has(i.kind)), [items, hidden]);
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    shown.forEach((i) => m.set(i.date, [...(m.get(i.date) || []), i]));
    m.forEach((list) => list.sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    return m;
  }, [shown]);
  const dayItems = byDay.get(selected) || [];
  const upcoming = shown.filter((i) => i.date >= today && i.kind !== 'blocked').sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')).slice(0, 8);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = month.getDay();

  const openNew = (date = selected) => {
    setError(null);
    setEditing({ date, time: '', title: '', note: '', kind: noteKinds[0], done: false });
  };
  const openEdit = (n: CalendarNote) => {
    setError(null);
    setEditing({ id: n.id, date: n.date, time: n.time, title: n.title, note: n.note, kind: n.kind, done: n.done });
  };
  const jumpTo = (iso: string) => {
    const d = parseDay(iso);
    if (d) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(iso);
  };

  const save = async () => {
    if (!editing) return;
    if (await run(() => saveCalendarNote(editing))) {
      onToast?.(editing.id ? 'Note updated.' : `${NOTE_LABEL[editing.kind]} added to your calendar.`);
      jumpTo(editing.date);
      setEditing(null);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <Panel className="xl:col-span-8" bodyClassName="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1">
            <IconButton icon={ChevronLeft} label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
            <h2 className="mc-display text-[18px] font-semibold min-w-[160px] text-center">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
            <IconButton icon={ChevronRight} label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
            <Button size="sm" variant="ghost" onClick={() => jumpTo(today)}>
              Today
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {legend.map((k) => {
              const off = hidden.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    const next = new Set(hidden);
                    if (off) next.delete(k);
                    else next.add(k);
                    setHidden(next);
                  }}
                  aria-pressed={!off}
                  className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 h-7 text-[12px] font-semibold transition-colors', off ? 'border-[#DDE4EF] text-[#9AA5BB] bg-white' : 'border-transparent ' + KIND_META[k].chip)}
                >
                  <span className={cx('h-2 w-2 rounded-full', off ? 'bg-[#C4CEDD]' : KIND_META[k].dot)} />
                  {KIND_META[k].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-[12px] font-semibold text-[#7A869E] border-b border-[#EAEFF6] pb-2">
          {WEEK.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: lead }).map((_, i) => (
            <div key={`lead-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const iso = toIsoDay(new Date(month.getFullYear(), month.getMonth(), i + 1));
            const list = byDay.get(iso) || [];
            const isSel = iso === selected;
            const isToday = iso === today;
            const blocked = list.some((x) => x.kind === 'blocked');
            const visible = list.filter((x) => x.kind !== 'blocked');
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                onDoubleClick={() => noteKinds.length && openNew(iso)}
                className={cx(
                  'min-h-[64px] sm:min-h-[84px] rounded-[10px] border p-1.5 text-left flex flex-col gap-1 transition-colors',
                  isSel ? 'border-[#2563EB] bg-[#F3F7FF] ring-2 ring-[#2563EB]/15' : 'border-[#EAEFF6] hover:border-[#C4CEDD] bg-white',
                  blocked && !isSel && 'bg-[repeating-linear-gradient(135deg,#F7F9FC,#F7F9FC_6px,#EEF2F7_6px,#EEF2F7_12px)]'
                )}
                aria-label={`${fmtDay(iso, { day: 'numeric', month: 'long' })}${visible.length ? `, ${visible.length} item${visible.length > 1 ? 's' : ''}` : ''}`}
              >
                <span
                  className={cx(
                    'mc-num text-[12.5px] font-semibold h-6 w-6 flex items-center justify-center rounded-full',
                    isToday ? 'bg-[#0D1B3E] text-white' : isSel ? 'text-[#1D4FD7]' : 'text-[#26355A]'
                  )}
                >
                  {i + 1}
                </span>
                <span className="hidden sm:flex flex-col gap-0.5 min-w-0 w-full">
                  {visible.slice(0, 2).map((x) => (
                    <span key={x.id} className={cx('truncate rounded px-1 text-[10.5px] font-semibold leading-[16px]', KIND_META[x.kind].chip, x.note?.done && 'line-through opacity-60')}>
                      {x.title}
                    </span>
                  ))}
                  {visible.length > 2 && <span className="text-[10.5px] text-[#7A869E] px-1">+{visible.length - 2} more</span>}
                </span>
                <span className="flex sm:hidden flex-wrap gap-0.5">
                  {visible.slice(0, 4).map((x) => (
                    <span key={x.id} className={cx('h-1.5 w-1.5 rounded-full', KIND_META[x.kind].dot)} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        {noteKinds.length > 0 && <p className="text-[12px] text-[#7A869E]">Tip: double-click a day to add a {noteKinds.map((k) => NOTE_LABEL[k].toLowerCase()).join(', ')}.</p>}
      </Panel>

      <div className="xl:col-span-4 space-y-5">
        <Panel
          title={fmtDay(selected, { weekday: 'long', day: 'numeric', month: 'long' })}
          description={dayItems.length ? `${dayItems.length} item${dayItems.length > 1 ? 's' : ''}` : 'Nothing planned'}
          actions={
            noteKinds.length > 0 && (
              <Button size="sm" variant="primary" icon={Plus} onClick={() => openNew()}>
                Add
              </Button>
            )
          }
        >
          {dayItems.length === 0 ? (
            <div className="text-center py-6 text-[13px] text-[#5B6885]">
              <CalendarDays className="w-6 h-6 mx-auto mb-2 text-[#9AA5BB]" />
              {emptyHint || 'Nothing on this day.'}
            </div>
          ) : (
            <ul className="space-y-2">
              {dayItems.map((x) => (
                <li key={x.id} className="rounded-[12px] border border-[#EAEFF6] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className={cx('inline-flex items-center rounded-full px-2 py-[1px] text-[11px] font-semibold', KIND_META[x.kind].chip)}>{KIND_META[x.kind].label}</span>
                      <div className={cx('mt-1 text-[14px] font-semibold text-[#0D1B3E]', x.note?.done && 'line-through text-[#7A869E]')}>{x.title}</div>
                      {(x.time || x.subtitle) && (
                        <div className="text-[12.5px] text-[#5B6885]">
                          {[x.time && /^\d{1,2}:\d{2}$/.test(x.time) ? fmtTime(x.time) : x.time, x.subtitle].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {x.note?.note && <p className="mt-1 text-[12.5px] text-[#33415F] whitespace-pre-wrap">{x.note.note}</p>}
                    </div>
                    {x.note && (
                      <div className="flex shrink-0">
                        {x.note.kind === 'task' && (
                          <input
                            type="checkbox"
                            className="mt-2 mr-1 h-4 w-4 accent-[#2563EB]"
                            checked={x.note.done}
                            aria-label="Done"
                            onChange={(e) => saveCalendarNote({ ...x.note!, done: e.target.checked }).catch(() => {})}
                          />
                        )}
                        <IconButton icon={Pencil} label="Edit" onClick={() => openEdit(x.note!)} />
                      </div>
                    )}
                  </div>
                  {x.link && (
                    <a href={x.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] bg-[#2563EB] text-white text-[12.5px] font-semibold hover:bg-[#1D4FD7]">
                      <Video className="w-3.5 h-3.5" /> Join
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Coming up">
          {upcoming.length === 0 ? (
            <p className="text-[13px] text-[#5B6885]">Nothing coming up yet.</p>
          ) : (
            <ul className="divide-y divide-[#EAEFF6] -mx-5">
              {upcoming.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => jumpTo(x.date)} className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-[#F7F9FC]">
                    <span className={cx('h-2 w-2 rounded-full shrink-0', KIND_META[x.kind].dot)} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium truncate">{x.title}</span>
                      <span className="block text-[12px] text-[#7A869E]">
                        {fmtDay(x.date, { weekday: 'short', day: 'numeric', month: 'short', ...(x.date.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}) })}
                        {x.time ? ` · ${/^\d{1,2}:\d{2}$/.test(x.time) ? fmtTime(x.time) : x.time}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit note' : 'Add to your calendar'}
        description="Only you can see your notes, reminders, targets and to-dos."
        footer={
          <>
            {editing?.id && (
              <Button
                variant="danger"
                icon={Trash2}
                className="mr-auto"
                disabled={busy}
                onClick={async () => {
                  if (!editing?.id || !window.confirm('Delete this note?')) return;
                  if (await run(() => deleteCalendarNote(editing.id!))) {
                    onToast?.('Note deleted.');
                    setEditing(null);
                  }
                }}
              >
                Delete
              </Button>
            )}
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" disabled={busy || !editing?.title.trim() || !editing?.date} onClick={save}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <FormError message={error} />
            {noteKinds.length > 1 && (
              <Segmented value={editing.kind} onChange={(kind) => setEditing({ ...editing, kind })} options={noteKinds.map((k) => ({ value: k, label: NOTE_LABEL[k] }))} />
            )}
            <Field label="Title">
              <Input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder={editing.kind === 'target' ? 'Finish 2 mock interviews' : editing.kind === 'reminder' ? 'Send updated resume to mentor' : 'What do you want to remember?'}
                autoFocus
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
              </Field>
              <Field label="Time (optional)">
                <Input type="time" value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} />
              </Field>
            </div>
            <Field label="Details (optional)">
              <Textarea value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} rows={3} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
};

/** Calendar entries for a person's own notes. */
export const notesToItems = (notes: CalendarNote[]): CalendarItem[] =>
  notes.map((n) => ({ id: n.id, date: n.date, time: n.time, title: n.title, kind: n.kind, note: n }));
