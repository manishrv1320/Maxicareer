import React, { useEffect, useRef, useState } from 'react';
import { Newspaper, Plus, Download, Send, Pencil, Copy, Trash2, UserPlus, UserMinus, FlaskConical, Play } from 'lucide-react';
import { useAdmin } from '../context';
import { PageHeader, Panel, Stat, Badge, Button, IconButton, Empty, Segmented, Modal, Field, Input, Textarea, SearchInput, Th, Td, cx, Tone } from '../ui';
import { useSharedCollection, refreshShared, uid, formatDate, downloadCsv, plural, DAY_MS } from '../lib';
import { apiSend } from '../../../lib/api';

interface Subscriber {
  id: string;
  email: string;
  name: string;
  /** 'website' (footer form) or 'admin'. */
  source: string;
  status: 'subscribed' | 'unsubscribed';
  createdAt: string;
  unsubscribedAt?: string;
}

interface Issue {
  id: string;
  subject: string;
  body: string;
  status: 'Draft' | 'Sending' | 'Sent';
  createdAt: string;
  updatedAt: string;
  recipients?: number;
  sentCount?: number;
  failedCount?: number;
  sentAt?: string;
  sentBy?: string;
}

interface Progress {
  status: Issue['status'];
  recipients: number;
  sentCount: number;
  failedCount: number;
}

const ISSUE_TONE: Record<Issue['status'], Tone> = { Draft: 'neutral', Sending: 'marigold', Sent: 'mint' };

const blankIssue = (): Issue => ({ id: '', subject: '', body: '', status: 'Draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

const todayIso = () => new Date().toISOString().slice(0, 10);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

const IssueEditor: React.FC<{ draft: Issue | null; audience: number; onClose: () => void; onSave: (i: Issue) => void }> = ({ draft, audience, onClose, onSave }) => {
  const { toast } = useAdmin();
  const [issue, setIssue] = useState<Issue | null>(draft);
  const [testing, setTesting] = useState(false);
  useEffect(() => setIssue(draft), [draft]);
  if (!issue) return null;
  const ready = Boolean(issue.subject.trim() && issue.body.trim());
  const changed = !draft || issue.subject !== draft.subject || issue.body !== draft.body;
  const close = () => {
    if (changed && !window.confirm('Close without saving this newsletter?')) return;
    onClose();
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const res = await apiSend<{ to: string }>('/api/admin/newsletter', { action: 'test', subject: issue.subject, body: issue.body });
      toast(`Test sent to ${res.to}.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not send the test.', 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal
      open
      onClose={close}
      width="max-w-2xl"
      title={issue.id ? 'Edit newsletter' : 'New newsletter'}
      description={`Saved as a draft. Send it from the list when it's ready (${plural(audience, 'subscriber')} right now).`}
      footer={
        <>
          <Button icon={FlaskConical} onClick={sendTest} disabled={!ready || testing} className="mr-auto">
            {testing ? 'Sending test…' : 'Send test to me'}
          </Button>
          <Button onClick={close}>Cancel</Button>
          {/* New drafts (including duplicates) can be saved as they are; existing ones once edited. */}
          <Button variant="primary" disabled={!ready || (!!issue.id && !changed)} onClick={() => onSave({ ...issue, subject: issue.subject.trim(), body: issue.body.trim() })}>
            Save draft
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Subject">
          <Input value={issue.subject} onChange={(e) => setIssue({ ...issue, subject: e.target.value })} maxLength={200} placeholder="5 things recruiters check on your LinkedIn" autoFocus />
        </Field>
        <Field label="Message" hint="Plain text. Paste full links (https://…) and email apps make them clickable. An unsubscribe link is added at the bottom.">
          <Textarea
            rows={14}
            value={issue.body}
            onChange={(e) => setIssue({ ...issue, body: e.target.value })}
            maxLength={20000}
            placeholder={'Hi there,\n\nThis month at Maxicareer…'}
          />
        </Field>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const Newsletter: React.FC = () => {
  const { addAudit, toast } = useAdmin();
  const [subscribers, setSubscribers] = useSharedCollection<Subscriber>('subscribers', [], { refreshMs: 60_000 });
  const [issues, setIssues] = useSharedCollection<Issue>('newsletters', []);
  const [tab, setTab] = useState<'issues' | 'subscribers'>('issues');
  const [filter, setFilter] = useState<'subscribed' | 'unsubscribed' | 'all'>('subscribed');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Issue | null>(null);
  const [adding, setAdding] = useState<{ email: string; name: string } | null>(null);
  const [sending, setSending] = useState<{ issue: Issue; progress: Progress | null; error: string | null; done: boolean } | null>(null);
  // Each send run has a number; pausing or leaving the page bumps it so the old run stops.
  const runRef = useRef(0);
  useEffect(
    () => () => {
      runRef.current++;
    },
    []
  );

  const active = subscribers.filter((s) => s.status === 'subscribed');
  const unsubscribed = subscribers.length - active.length;
  const joinedRecently = active.filter((s) => Date.now() - new Date(s.createdAt).getTime() < 30 * DAY_MS).length;
  const sentIssues = issues.filter((i) => i.status === 'Sent');
  const lastSent = [...sentIssues].sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''))[0];

  const shownSubscribers = subscribers
    .filter((s) => filter === 'all' || s.status === filter)
    .filter((s) => !q || `${s.email} ${s.name}`.toLowerCase().includes(q.toLowerCase()));
  const shownIssues = [...issues].sort((a, b) => (b.sentAt || b.updatedAt).localeCompare(a.sentAt || a.updatedAt));

  const saveIssue = (issue: Issue) => {
    const now = new Date().toISOString();
    if (issue.id) {
      setIssues((prev) => prev.map((x) => (x.id === issue.id ? { ...issue, updatedAt: now } : x)));
      addAudit('Newsletter', 'Edited draft', issue.subject);
    } else {
      setIssues((prev) => [{ ...issue, id: uid('nl'), createdAt: now, updatedAt: now }, ...prev]);
      addAudit('Newsletter', 'Created draft', issue.subject);
    }
    toast('Draft saved.');
    setEditing(null);
  };

  /** Sends batch after batch until done; closing the dialog pauses (Continue picks it up). */
  const runSend = async (issue: Issue) => {
    const run = ++runRef.current;
    setSending({ issue, progress: null, error: null, done: false });
    let last = -1;
    try {
      for (;;) {
        const p = await apiSend<Progress>('/api/admin/newsletter', { action: 'send', id: issue.id });
        setSending((s) => (s && s.issue.id === issue.id ? { ...s, progress: p } : s));
        if (p.status === 'Sent') {
          // The server writes the audit entry when the last batch goes out.
          setSending((s) => (s && s.issue.id === issue.id ? { ...s, done: true } : s));
          break;
        }
        if (runRef.current !== run) break;
        // Another tab is sending this batch: wait for it instead of asking again straight away.
        const handled = p.sentCount + p.failedCount;
        if (handled === last) await wait(3000);
        last = handled;
      }
    } catch (err) {
      setSending((s) => (s && s.issue.id === issue.id ? { ...s, error: err instanceof Error ? err.message : 'Sending stopped.' } : s));
    } finally {
      refreshShared('newsletters');
    }
  };

  const startSend = (issue: Issue) => {
    if (!active.length) {
      toast('Nobody is subscribed yet.', 'error');
      return;
    }
    if (!window.confirm(`Send "${issue.subject}" to ${plural(active.length, 'subscriber')} now? This can't be undone.`)) return;
    runSend(issue);
  };

  const unsubscribe = (s: Subscriber) => {
    if (!window.confirm(`Unsubscribe ${s.email}? Only they can sign up again, from the website.`)) return;
    setSubscribers((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: 'unsubscribed' } : x)));
    addAudit('Newsletter', 'Unsubscribed', s.email);
  };

  const remove = (s: Subscriber) => {
    if (!window.confirm(`Delete ${s.email} from the list completely? Use this when someone asks for their details to be removed.`)) return;
    setSubscribers((prev) => prev.filter((x) => x.id !== s.id));
    addAudit('Newsletter', 'Deleted subscriber', s.email);
  };

  const p = sending?.progress;
  const handled = p ? p.sentCount + p.failedCount : 0;
  const total = p ? Math.max(p.recipients, handled) : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Newsletter"
        description="People who subscribed at the bottom of the website, and the newsletters you email them. Every email has an unsubscribe link."
        actions={
          tab === 'issues' ? (
            <Button variant="primary" icon={Plus} onClick={() => setEditing(blankIssue())}>
              New newsletter
            </Button>
          ) : (
            <>
              <Button
                icon={Download}
                disabled={!shownSubscribers.length}
                onClick={() =>
                  downloadCsv(
                    `maxicareer_newsletter_${todayIso()}.csv`,
                    ['Email', 'Name', 'Status', 'Source', 'Joined', 'Unsubscribed'],
                    shownSubscribers.map((s) => [s.email, s.name, s.status, s.source === 'admin' ? 'Added by admin' : 'Website', s.createdAt.slice(0, 10), s.unsubscribedAt?.slice(0, 10) || ''])
                  )
                }
              >
                Export
              </Button>
              <Button variant="primary" icon={UserPlus} onClick={() => setAdding({ email: '', name: '' })}>
                Add subscriber
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat
          label="Subscribers"
          value={active.length}
          hint={unsubscribed ? `${unsubscribed} unsubscribed` : 'Nobody has unsubscribed'}
          onClick={() => {
            setTab('subscribers');
            setFilter('subscribed');
          }}
        />
        <Stat label="Joined in the last 30 days" value={joinedRecently} />
        <Stat label="Newsletters sent" value={sentIssues.length} onClick={() => setTab('issues')} />
        <Stat label="Last sent" value={<span className="text-[22px]">{lastSent?.sentAt ? formatDate(lastSent.sentAt) : '—'}</span>} hint={lastSent ? `${lastSent.sentCount || 0} delivered` : 'Nothing sent yet'} />
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'issues', label: 'Newsletters', count: issues.length },
          { value: 'subscribers', label: 'Subscribers', count: active.length },
        ]}
      />

      {tab === 'issues' && (
        <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
          {shownIssues.length === 0 && (
            <Empty
              icon={Newspaper}
              title="No newsletters yet"
              body="Write one, send yourself a test, then send it to everyone who subscribed on the website."
              action={<Button onClick={() => setEditing(blankIssue())}>New newsletter</Button>}
            />
          )}
          {shownIssues.map((i) => (
            <div key={i.id} className="flex flex-col lg:flex-row lg:items-center gap-3 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold truncate">{i.subject || 'Untitled'}</span>
                  <Badge tone={ISSUE_TONE[i.status]} dot>
                    {i.status === 'Sending' ? 'Paused while sending' : i.status}
                  </Badge>
                </div>
                <p className="text-[13px] text-[#5B6885] mt-0.5 line-clamp-1">{i.body}</p>
              </div>
              <div className="text-[12.5px] text-[#5B6885] lg:w-56 shrink-0">
                {i.status === 'Draft' ? (
                  `Edited ${formatDate(i.updatedAt, true)}`
                ) : (
                  <>
                    {i.status === 'Sent' ? `Sent ${formatDate(i.sentAt, true)}` : `${(i.sentCount || 0) + (i.failedCount || 0)} of ${i.recipients || 0} done`}
                    <div className="text-[#9AA5BB]">
                      {i.sentCount || 0} delivered{i.failedCount ? `, ${i.failedCount} failed` : ''}
                      {i.sentBy ? ` · by ${i.sentBy}` : ''}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {i.status === 'Draft' && (
                  <Button size="sm" variant="primary" icon={Send} onClick={() => startSend(i)}>
                    Send
                  </Button>
                )}
                {i.status === 'Sending' && (
                  <Button size="sm" variant="primary" icon={Play} onClick={() => runSend(i)}>
                    Continue sending
                  </Button>
                )}
                {i.status === 'Draft' && <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(i)} />}
                <IconButton icon={Copy} label="Duplicate as a new draft" onClick={() => setEditing({ ...blankIssue(), subject: `${i.subject} (copy)`, body: i.body })} />
                {i.status !== 'Sending' && (
                  <IconButton
                    icon={Trash2}
                    tone="danger"
                    label="Delete"
                    onClick={() => {
                      if (!window.confirm(i.status === 'Sent' ? `Delete the record of "${i.subject}"? It has already been emailed.` : `Delete the draft "${i.subject}"?`)) return;
                      setIssues((prev) => prev.filter((x) => x.id !== i.id));
                      addAudit('Newsletter', i.status === 'Sent' ? 'Deleted sent newsletter' : 'Deleted draft', i.subject);
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'subscribers' && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'subscribed', label: 'Subscribed', count: active.length },
                { value: 'unsubscribed', label: 'Unsubscribed', count: unsubscribed },
                { value: 'all', label: 'All', count: subscribers.length },
              ]}
            />
            <SearchInput value={q} onChange={setQ} placeholder="Search email or name" className="lg:ml-auto lg:w-72" />
          </div>
          <Panel flush>
            {shownSubscribers.length === 0 ? (
              <Empty
                icon={Newspaper}
                title={subscribers.length ? 'Nobody matches' : 'No subscribers yet'}
                body={subscribers.length ? 'Try another filter or search.' : 'Visitors subscribe with the "Get career tips in your inbox" form at the bottom of the website.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr>
                      <Th>Subscriber</Th>
                      <Th>Source</Th>
                      <Th>Joined</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEFF6]">
                    {shownSubscribers.slice(0, 500).map((s) => (
                      <tr key={s.id} className={cx(s.status === 'unsubscribed' && 'opacity-60')}>
                        <Td>
                          <div className="font-semibold break-all">{s.email}</div>
                          {s.name && <div className="text-[12px] text-[#7A869E]">{s.name}</div>}
                        </Td>
                        <Td className="text-[13px] text-[#5B6885]">{s.source === 'admin' ? 'Added by admin' : 'Website'}</Td>
                        <Td className="whitespace-nowrap text-[13px]">{formatDate(s.createdAt)}</Td>
                        <Td>
                          <Badge tone={s.status === 'subscribed' ? 'mint' : 'neutral'} dot>
                            {s.status === 'subscribed' ? 'Subscribed' : `Unsubscribed ${formatDate(s.unsubscribedAt)}`}
                          </Badge>
                        </Td>
                        <Td className="text-right whitespace-nowrap">
                          <div className="inline-flex gap-1">
                            {s.status === 'subscribed' && <IconButton icon={UserMinus} label="Unsubscribe" onClick={() => unsubscribe(s)} />}
                            <IconButton icon={Trash2} tone="danger" label="Delete from the list" onClick={() => remove(s)} />
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shownSubscribers.length > 500 && (
                  <p className="px-4 py-3 text-[12.5px] text-[#5B6885] border-t border-[#EAEFF6]">Showing 500 of {shownSubscribers.length}. Search to narrow it down, or export to see everyone.</p>
                )}
              </div>
            )}
          </Panel>
        </>
      )}

      {editing && <IssueEditor draft={editing} audience={active.length} onClose={() => setEditing(null)} onSave={saveIssue} />}

      <Modal
        open={!!adding}
        onClose={() => setAdding(null)}
        title="Add a subscriber"
        description="Only add people who asked to get the newsletter. They can unsubscribe from any email."
        footer={
          <>
            <Button onClick={() => setAdding(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!adding?.email.trim()}
              onClick={() => {
                if (!adding) return;
                const email = adding.email.trim().toLowerCase();
                if (subscribers.some((s) => s.email === email)) {
                  toast(`${email} is already on the list.`, 'error');
                  return;
                }
                setSubscribers((prev) => [{ id: uid('sub'), email, name: adding.name.trim(), source: 'admin', status: 'subscribed', createdAt: new Date().toISOString() }, ...prev]);
                addAudit('Newsletter', 'Added subscriber', email);
                toast(`${email} added.`);
                setAdding(null);
              }}
            >
              Add subscriber
            </Button>
          </>
        }
      >
        {adding && (
          <div className="space-y-4">
            <Field label="Email">
              <Input type="email" value={adding.email} onChange={(e) => setAdding({ ...adding, email: e.target.value })} placeholder="name@example.com" autoFocus />
            </Field>
            <Field label="Name (optional)">
              <Input value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        open={!!sending}
        onClose={() => {
          runRef.current++;
          setSending(null);
        }}
        title={sending?.done ? 'Newsletter sent' : sending?.error ? 'Sending stopped' : 'Sending newsletter'}
        description={sending?.issue.subject}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              runRef.current++;
              setSending(null);
            }}
          >
            {sending?.done || sending?.error ? 'Done' : 'Pause'}
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="h-2.5 rounded-full bg-[#EAEFF6] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total || 1} aria-valuenow={handled}>
            <div className="h-full bg-[#2563EB] transition-[width] duration-300" style={{ width: `${total ? Math.round((handled / total) * 100) : 0}%` }} />
          </div>
          <p className="mc-num text-[13.5px] text-[#26355A]">
            {p ? `${handled} of ${total} done · ${p.sentCount} delivered${p.failedCount ? ` · ${p.failedCount} failed` : ''}` : 'Starting…'}
          </p>
          {sending?.error && <p className="text-[13px] text-[#B42F3B]">{sending.error} Use "Continue sending" in the list to pick up where it stopped.</p>}
          {!sending?.done && !sending?.error && <p className="text-[12.5px] text-[#7A869E]">Keep this page open until it finishes. If you pause or close it, "Continue sending" picks up where it stopped.</p>}
          {sending?.done && !!p?.failedCount && <p className="text-[12.5px] text-[#94570A]">Some addresses were rejected by the mail server. They stay subscribed; check Settings &gt; Connections if many failed.</p>}
        </div>
      </Modal>
    </div>
  );
};
