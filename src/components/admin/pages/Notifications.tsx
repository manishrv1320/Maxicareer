import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck, Trash2, Users, FileStack, CalendarClock, CheckCircle2, Globe, Cpu, Send, Mail, MessageCircle, Smartphone, Clock, Eye, EyeOff, ArrowUpRight } from 'lucide-react';
import { useAdmin, AppNotification, NotificationCategory, COHORT_LABEL, tabLabel } from '../context';
import { PageHeader, Panel, Button, IconButton, Badge, Input, Textarea, Select, Field, Segmented, Toggle, Empty, SaveBar, Th, Td, cx } from '../ui';
import { timeAgo, uid, useSharedValue, useSharedCollection, useDraft, formatDate } from '../lib';

export const CATEGORY_META: Record<NotificationCategory, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  students: { label: 'Students', icon: Users, cls: 'bg-[#E8F0FE] text-[#1D4FD7]' },
  applications: { label: 'Applications', icon: FileStack, cls: 'bg-[#EFEBFD] text-[#5B3CC4]' },
  sessions: { label: 'Sessions', icon: CalendarClock, cls: 'bg-[#E3F6EE] text-[#0B7A55]' },
  approvals: { label: 'Approvals', icon: CheckCircle2, cls: 'bg-[#FDF1DC] text-[#94570A]' },
  website: { label: 'Website', icon: Globe, cls: 'bg-[#E6F6FD] text-[#0A6F99]' },
  system: { label: 'System', icon: Cpu, cls: 'bg-[#EEF2F7] text-[#4A5875]' },
};

export interface NotificationPrefs {
  categories: Record<NotificationCategory, { inApp: boolean; email: boolean }>;
  digest: 'off' | 'daily' | 'weekly';
  digestTime: string;
  quietHours: boolean;
  quietFrom: string;
  quietTo: string;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  categories: {
    students: { inApp: true, email: true },
    applications: { inApp: true, email: true },
    sessions: { inApp: true, email: false },
    approvals: { inApp: true, email: true },
    website: { inApp: true, email: false },
    system: { inApp: true, email: false },
  },
  digest: 'daily',
  digestTime: '09:00',
  quietHours: false,
  quietFrom: '21:00',
  quietTo: '08:00',
};

const PREF_DESCRIPTIONS: Record<NotificationCategory, string> = {
  students: 'New registrations, status changes, students without a mentor',
  applications: 'Interviews, offers and deadlines within a week',
  sessions: 'Bookings, cancellations and reminders 24 hours before',
  approvals: 'New requests and decisions made by other admins',
  website: 'Website sections published or changed',
  system: 'Imports, exports and retention clean-ups',
};

interface Broadcast {
  id: string;
  title: string;
  message: string;
  audience: string;
  audienceLabel: string;
  recipients: number;
  channels: string[];
  status: 'Sent' | 'Scheduled' | 'Cancelled';
  sendAt: string;
  createdAt: string;
  sentBy: string;
}

// Only in-app delivery is wired up; the others are shown so it's clear they aren't sent.
const CHANNELS = [
  { id: 'inapp', label: 'Portal inbox', icon: Bell, live: true },
  { id: 'email', label: 'Email', icon: Mail, live: false },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, live: false },
  { id: 'sms', label: 'SMS', icon: Smartphone, live: false },
];

export const Notifications: React.FC = () => {
  const { notifications, setNotifications, students, go, addAudit, notify, toast, session, mentorOptions } = useAdmin();
  const [view, setView] = useState<'inbox' | 'compose' | 'sent' | 'prefs'>('inbox');
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationCategory>('all');
  const [savedPrefs, savePrefs] = useSharedValue<NotificationPrefs>('notification_prefs', DEFAULT_PREFS);
  const [prefs, setPrefs, prefsDraft] = useDraft(savedPrefs);
  const [broadcasts, setBroadcasts] = useSharedCollection<Broadcast>('broadcasts', [], { refreshMs: 60_000 });
  const [draft, setDraft] = useState({ title: '', message: '', audience: 'all', studentEmail: '', channels: ['inapp'] as string[], when: 'now' as 'now' | 'later', sendAt: '' });

  const unread = notifications.filter((n) => !n.read).length;

  const shown = useMemo(
    () =>
      notifications
        .filter((n) => (filter === 'all' ? true : filter === 'unread' ? !n.read : n.category === filter))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications, filter]
  );

  const groups = useMemo(() => {
    const today: AppNotification[] = [];
    const week: AppNotification[] = [];
    const older: AppNotification[] = [];
    const now = Date.now();
    shown.forEach((n) => {
      const age = now - new Date(n.createdAt).getTime();
      if (age < 86400000) today.push(n);
      else if (age < 7 * 86400000) week.push(n);
      else older.push(n);
    });
    return [
      { label: 'Today', items: today },
      { label: 'This week', items: week },
      { label: 'Earlier', items: older },
    ].filter((g) => g.items.length);
  }, [shown]);

  const recipients = (() => {
    if (draft.audience === 'all') return students.length;
    if (draft.audience === 'staff') return mentorOptions.length;
    if (draft.audience === 'student') return draft.studentEmail ? 1 : 0;
    if (draft.audience.startsWith('status:')) return students.filter((s) => s.status === draft.audience.slice(7)).length;
    return students.filter((s) => s.profession === draft.audience).length;
  })();

  const audienceLabel = (() => {
    if (draft.audience === 'all') return 'All students';
    if (draft.audience === 'staff') return 'Counsellors and mentors';
    if (draft.audience === 'student') return draft.studentEmail || 'One student';
    if (draft.audience.startsWith('status:')) return `Students marked ${draft.audience.slice(7)}`;
    return COHORT_LABEL[draft.audience];
  })();

  const send = () => {
    const isLater = draft.when === 'later' && draft.sendAt;
    const b: Broadcast = {
      id: uid('bc'),
      title: draft.title.trim(),
      message: draft.message.trim(),
      audience: draft.audience,
      audienceLabel,
      recipients,
      channels: draft.channels,
      status: isLater ? 'Scheduled' : 'Sent',
      sendAt: isLater ? new Date(draft.sendAt).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      sentBy: session.email,
    };
    setBroadcasts((prev) => [b, ...prev]);
    addAudit('Notifications', isLater ? 'Scheduled notification' : 'Sent notification', `"${b.title}" to ${audienceLabel} (${recipients})`);
    notify({ title: isLater ? `Scheduled: ${b.title}` : `Sent: ${b.title}`, body: `${audienceLabel} · ${recipients} recipient${recipients === 1 ? '' : 's'}`, category: 'system', link: 'notifications' });
    toast(isLater ? `Scheduled for ${formatDate(b.sendAt, true)}.` : `Sent to ${recipients} recipient${recipients === 1 ? '' : 's'}.`);
    setDraft({ ...draft, title: '', message: '', studentEmail: '' });
    setView('sent');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Alerts about your students and team, plus announcements you send to learners."
        actions={
          view === 'inbox' ? (
            <>
              <Button
                icon={CheckCheck}
                disabled={!unread}
                onClick={() => {
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                  addAudit('Notifications', 'Marked all as read', `${unread} notifications`);
                }}
              >
                Mark all read
              </Button>
              <Button
                icon={Trash2}
                disabled={!notifications.some((n) => n.read)}
                onClick={() => {
                  if (!window.confirm('Delete every notification you have already read?')) return;
                  setNotifications((prev) => prev.filter((n) => !n.read));
                }}
              >
                Clear read
              </Button>
            </>
          ) : view !== 'compose' ? (
            <Button variant="primary" icon={Send} onClick={() => setView('compose')}>
              New announcement
            </Button>
          ) : undefined
        }
      />

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'inbox', label: 'Inbox', count: unread },
          { value: 'compose', label: 'Send announcement' },
          { value: 'sent', label: 'Sent & scheduled', count: broadcasts.length },
          { value: 'prefs', label: 'Preferences' },
        ]}
      />

      {view === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 items-start">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto" aria-label="Filter notifications">
            {[
              { id: 'all', label: 'Everything', count: notifications.length, icon: Bell },
              { id: 'unread', label: 'Unread', count: unread, icon: Eye },
              ...(Object.keys(CATEGORY_META) as NotificationCategory[]).map((c) => ({
                id: c,
                label: CATEGORY_META[c].label,
                count: notifications.filter((n) => n.category === c && !n.read).length,
                icon: CATEGORY_META[c].icon,
              })),
            ].map((f) => {
              const Icon = f.icon;
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id as typeof filter)}
                  className={cx('flex items-center gap-2.5 h-9 px-3 rounded-[10px] text-[13.5px] font-medium whitespace-nowrap', active ? 'bg-white border border-[#DDE4EF] text-[#0D1B3E]' : 'text-[#5B6885] hover:text-[#0D1B3E] border border-transparent')}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{f.label}</span>
                  {f.count > 0 && <span className={cx('mc-num text-[11.5px] rounded-full px-1.5', f.id === 'all' ? 'text-[#7A869E]' : 'bg-[#FDF1DC] text-[#94570A]')}>{f.count}</span>}
                </button>
              );
            })}
          </nav>

          <Panel flush>
            {groups.length === 0 ? (
              <Empty icon={Bell} title={filter === 'unread' ? "You're all caught up" : 'No notifications here'} body="New registrations, application updates and session reminders will show up here." />
            ) : (
              groups.map((g) => (
                <div key={g.label}>
                  <div className="px-5 pt-4 pb-2 text-[12.5px] font-semibold text-[#5B6885]">{g.label}</div>
                  <ul className="divide-y divide-[#EAEFF6] border-y border-[#EAEFF6]">
                    {g.items.map((n) => {
                      const meta = CATEGORY_META[n.category];
                      const Icon = meta.icon;
                      return (
                        <li key={n.id} className={cx('flex items-start gap-3 px-5 py-3.5 group', !n.read && 'bg-[#FFFBF3]')}>
                          <span className={cx('mt-0.5 h-9 w-9 shrink-0 rounded-[10px] flex items-center justify-center', meta.cls)}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!n.read && <span className="h-2 w-2 rounded-full bg-[#F2A93B]" aria-label="Unread" />}
                              <span className={cx('text-[14px] text-[#0D1B3E]', n.read ? 'font-medium' : 'font-semibold')}>{n.title}</span>
                              {n.priority === 'high' && <Badge tone="rose">Important</Badge>}
                            </div>
                            {n.body && <p className="text-[13px] text-[#5B6885] mt-0.5">{n.body}</p>}
                            <div className="mt-1 text-[12px] text-[#7A869E]" suppressHydrationWarning>
                              {meta.label} · {timeAgo(n.createdAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                            {n.link && (
                              <IconButton
                                icon={ArrowUpRight}
                                label={`Open ${tabLabel(n.link)}`}
                                onClick={() => {
                                  setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                                  go(n.link!);
                                }}
                              />
                            )}
                            <IconButton icon={n.read ? EyeOff : Eye} label={n.read ? 'Mark unread' : 'Mark read'} onClick={() => setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: !x.read } : x)))} />
                            <IconButton icon={Trash2} tone="danger" label="Delete" onClick={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </Panel>
        </div>
      )}

      {view === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
          <Panel title="Announcement" description="Goes to students through the channels you pick.">
            <div className="space-y-4">
              <Field label="Title">
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Mock interview week starts Monday" maxLength={80} />
              </Field>
              <Field label="Message" hint={`${draft.message.length}/320 characters. WhatsApp and SMS are cut at 320.`}>
                <Textarea rows={5} value={draft.message} maxLength={320} onChange={(e) => setDraft({ ...draft, message: e.target.value })} placeholder="Book your slot from the student portal. Each session is 45 minutes with your mentor." />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Send to">
                  <Select value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })}>
                    <option value="all">All students</option>
                    <optgroup label="Cohort">
                      {Object.entries(COHORT_LABEL).map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Status">
                      <option value="status:pending">Pending students</option>
                      <option value="status:enrolled">Enrolled students</option>
                      <option value="status:completed">Completed students</option>
                    </optgroup>
                    <option value="student">One student</option>
                    <option value="staff">Counsellors and mentors</option>
                  </Select>
                </Field>
                {draft.audience === 'student' ? (
                  <Field label="Student">
                    <Select value={draft.studentEmail} onChange={(e) => setDraft({ ...draft, studentEmail: e.target.value })}>
                      <option value="">Choose a student</option>
                      {students.map((s) => (
                        <option key={s._id} value={s.email}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <Field label="When">
                    <Segmented
                      value={draft.when}
                      onChange={(v) => setDraft({ ...draft, when: v })}
                      options={[
                        { value: 'now', label: 'Send now' },
                        { value: 'later', label: 'Schedule' },
                      ]}
                    />
                  </Field>
                )}
              </div>
              {draft.when === 'later' && draft.audience !== 'student' && (
                <Field label="Send at">
                  <Input type="datetime-local" value={draft.sendAt} onChange={(e) => setDraft({ ...draft, sendAt: e.target.value })} />
                </Field>
              )}
              <div>
                <span className="block text-[13px] font-semibold text-[#26355A] mb-2">Channels</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CHANNELS.map((c) => {
                    const on = draft.channels.includes(c.id);
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={on}
                        disabled={!c.live}
                        title={c.live ? undefined : 'Not connected yet'}
                        onClick={() => setDraft({ ...draft, channels: on ? draft.channels.filter((x) => x !== c.id) : [...draft.channels, c.id] })}
                        className={cx('h-11 rounded-[10px] border flex items-center justify-center gap-2 text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed', on ? 'border-[#2563EB] bg-[#E8F0FE] text-[#1D4FD7]' : 'border-[#D3DBE8] text-[#5B6885] hover:border-[#B7C3D7]')}
                      >
                        <Icon className="w-4 h-4" /> {c.label}
                        {!c.live && <span className="text-[11px] font-normal">(not connected)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Panel>

          <div className="space-y-4 lg:sticky lg:top-20">
            <Panel title="Preview">
              <div className="rounded-[14px] bg-[#0D1B3E] p-4 text-white">
                <div className="flex items-center gap-2 text-[12px] text-[#AFC0E3]">
                  <Bell className="w-3.5 h-3.5" /> Maxicareer · now
                </div>
                <div className="mt-2 text-[15px] font-semibold">{draft.title || 'Your title appears here'}</div>
                <div className="mt-1 text-[13px] text-[#D6E0F5] leading-relaxed whitespace-pre-wrap">{draft.message || 'And your message here.'}</div>
              </div>
              <dl className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-[#5B6885]">Audience</dt>
                  <dd className="font-medium text-[#0D1B3E] text-right">{audienceLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#5B6885]">Recipients</dt>
                  <dd className="mc-num font-semibold text-[#0D1B3E]">{recipients}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#5B6885]">Channels</dt>
                  <dd className="font-medium text-[#0D1B3E] text-right">{draft.channels.map((c) => CHANNELS.find((x) => x.id === c)?.label).join(', ') || 'None'}</dd>
                </div>
              </dl>
              <Button
                variant="primary"
                icon={draft.when === 'later' ? Clock : Send}
                className="w-full mt-4"
                disabled={!draft.title.trim() || !draft.message.trim() || !draft.channels.length || !recipients || (draft.when === 'later' && draft.audience !== 'student' && !draft.sendAt)}
                onClick={send}
              >
                {draft.when === 'later' && draft.audience !== 'student' ? 'Schedule announcement' : `Send to ${recipients}`}
              </Button>
            </Panel>
          </div>
        </div>
      )}

      {view === 'sent' && (
        <Panel flush>
          {broadcasts.length === 0 ? (
            <Empty icon={Send} title="Nothing sent yet" body="Announcements you send or schedule are listed here." action={<Button variant="primary" onClick={() => setView('compose')}>Send announcement</Button>} />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr>
                    <Th>Announcement</Th>
                    <Th>Audience</Th>
                    <Th>Channels</Th>
                    <Th>Status</Th>
                    <Th>When</Th>
                    <Th>
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFF6]">
                  {broadcasts.map((b) => (
                    <tr key={b.id}>
                      <Td>
                        <div className="font-semibold text-[#0D1B3E]">{b.title}</div>
                        <div className="text-[12.5px] text-[#5B6885] truncate max-w-[280px]">{b.message}</div>
                      </Td>
                      <Td>
                        {b.audienceLabel}
                        <div className="mc-num text-[12px] text-[#7A869E]">{b.recipients} recipients</div>
                      </Td>
                      <Td className="text-[13px]">{b.channels.map((c) => CHANNELS.find((x) => x.id === c)?.label).join(', ')}</Td>
                      <Td>
                        <Badge tone={b.status === 'Sent' ? 'mint' : b.status === 'Scheduled' ? 'marigold' : 'neutral'} dot>
                          {b.status}
                        </Badge>
                      </Td>
                      <Td className="text-[12.5px] text-[#5B6885] whitespace-nowrap">{formatDate(b.sendAt, true)}</Td>
                      <Td className="text-right">
                        {b.status === 'Scheduled' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setBroadcasts((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: 'Cancelled' } : x)));
                              addAudit('Notifications', 'Cancelled scheduled notification', b.title);
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {view === 'prefs' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">
          <Panel title="What you're alerted about" flush>
            <div className="grid grid-cols-[1fr_72px_72px] px-5 py-2 text-[12.5px] font-semibold text-[#5B6885] border-y border-[#EAEFF6] bg-[#F7F9FC]">
              <span>Topic</span>
              <span className="text-center">In admin</span>
              <span className="text-center">Email</span>
            </div>
            <ul className="divide-y divide-[#EAEFF6]">
              {(Object.keys(CATEGORY_META) as NotificationCategory[]).map((c) => {
                const meta = CATEGORY_META[c];
                const Icon = meta.icon;
                const v = prefs.categories[c] || { inApp: true, email: false };
                const setCat = (patch: Partial<typeof v>) => setPrefs({ ...prefs, categories: { ...prefs.categories, [c]: { ...v, ...patch } } });
                return (
                  <li key={c} className="grid grid-cols-[1fr_72px_72px] items-center px-5 py-3.5">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={cx('h-8 w-8 shrink-0 rounded-[9px] flex items-center justify-center', meta.cls)}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-[#0D1B3E]">{meta.label}</div>
                        <div className="text-[12.5px] text-[#5B6885]">{PREF_DESCRIPTIONS[c]}</div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Toggle checked={v.inApp} onChange={(x) => setCat({ inApp: x })} label={`${meta.label} in admin`} />
                    </div>
                    <div className="flex justify-center">
                      <Toggle checked={v.email} onChange={(x) => setCat({ email: x })} label={`${meta.label} by email`} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <div className="space-y-4">
            <Panel title="Email digest" description="One summary instead of separate emails.">
              <div className="space-y-3">
                <Segmented
                  value={prefs.digest}
                  onChange={(v) => setPrefs({ ...prefs, digest: v })}
                  options={[
                    { value: 'off', label: 'Off' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                  ]}
                />
                {prefs.digest !== 'off' && (
                  <Field label="Send at">
                    <Input type="time" value={prefs.digestTime} onChange={(e) => setPrefs({ ...prefs, digestTime: e.target.value })} />
                  </Field>
                )}
              </div>
            </Panel>
            <Panel title="Quiet hours" description="Hold emails overnight. Important alerts still come through." actions={<Toggle checked={prefs.quietHours} onChange={(v) => setPrefs({ ...prefs, quietHours: v })} label="Quiet hours" />}>
              <div className={cx('grid grid-cols-2 gap-3', !prefs.quietHours && 'opacity-50 pointer-events-none')}>
                <Field label="From">
                  <Input type="time" value={prefs.quietFrom} onChange={(e) => setPrefs({ ...prefs, quietFrom: e.target.value })} />
                </Field>
                <Field label="To">
                  <Input type="time" value={prefs.quietTo} onChange={(e) => setPrefs({ ...prefs, quietTo: e.target.value })} />
                </Field>
              </div>
            </Panel>
            <p className="text-[12.5px] text-[#7A869E]">Preferences are shared by every admin. Click Save preferences to apply your changes.</p>
          </div>
        </div>
      )}
      <SaveBar
        show={prefsDraft.dirty}
        message="Notification preferences aren't saved yet"
        saveLabel="Save preferences"
        onSave={() => {
          savePrefs(prefs);
          addAudit('Notifications', 'Updated preferences', '');
          toast('Notification preferences saved.');
        }}
        onDiscard={prefsDraft.reset}
      />
    </div>
  );
};
