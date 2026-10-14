import React, { useMemo, useState } from 'react';
import { Download, Upload, History, CheckCircle2, XCircle, Plus, ShieldCheck, Trash2, FileDown, Lock } from 'lucide-react';
import { useAdmin, AuditEntry, NAV_GROUPS, SETTINGS_ITEM, AdminTab } from '../context';
import { PageHeader, Panel, Button, Badge, Input, Select, Field, Segmented, SearchInput, Empty, Th, Td, Modal, Toggle, cx } from '../ui';
import { DAY_MS, downloadCsv, formatDate, useCsvPicker, pick, uid, useSharedValue, timeAgo } from '../lib';

/* ------------------------------------------------------------------ */
/* Approvals                                                           */
/* ------------------------------------------------------------------ */

export const Approvals: React.FC = () => {
  const { approvals, setApprovals, addAudit, notify, session } = useAdmin();
  const [view, setView] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [form, setForm] = useState({ title: '', requester: '' });

  const shown = approvals.filter((a) => a.status === view);
  const decide = (id: string, status: 'Approved' | 'Rejected') => {
    const a = approvals.find((x) => x.id === id);
    setApprovals((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    if (a) {
      addAudit('Approvals', status === 'Approved' ? 'Approved request' : 'Rejected request', a.title);
      notify({ title: `${status}: ${a.title}`, body: `Decided by ${session.name}`, category: 'approvals', link: 'approvals' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Approvals" description="Requests that need a second pair of eyes: refunds, fee waivers, mentor changes, content changes." />
      <Panel title="Log a request">
        <form
          className="flex flex-col md:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim()) return;
            setApprovals((prev) => [{ id: uid('a'), title: form.title.trim(), requester: form.requester.trim() || 'Unknown', status: 'Pending', createdAt: new Date().toISOString() }, ...prev]);
            addAudit('Approvals', 'Logged request', form.title.trim());
            notify({ title: 'New approval request', body: form.title.trim(), category: 'approvals', link: 'approvals', priority: 'high' });
            setForm({ title: '', requester: '' });
            setView('Pending');
          }}
        >
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs approving? e.g. 50% fee waiver for Rohan Verma" className="flex-1" aria-label="Request" />
          <Input value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} placeholder="Requested by" className="md:w-52" aria-label="Requested by" />
          <Button type="submit" variant="primary" icon={Plus}>
            Add request
          </Button>
        </form>
      </Panel>
      <Segmented
        value={view}
        onChange={setView}
        options={(['Pending', 'Approved', 'Rejected'] as const).map((s) => ({ value: s, label: s, count: approvals.filter((a) => a.status === s).length }))}
      />
      <Panel flush>
        {shown.length === 0 ? (
          <Empty icon={CheckCircle2} title={view === 'Pending' ? 'No requests waiting' : `No ${view.toLowerCase()} requests`} />
        ) : (
          <ul className="divide-y divide-[#EAEFF6]">
            {shown.map((a) => (
              <li key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#0D1B3E]">{a.title}</div>
                  <div className="text-[12.5px] text-[#5B6885]">
                    Requested by {a.requester}
                    {a.createdAt && <> · {timeAgo(a.createdAt)}</>}
                  </div>
                </div>
                {a.status === 'Pending' ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" icon={XCircle} onClick={() => decide(a.id, 'Rejected')}>
                      Reject
                    </Button>
                    <Button size="sm" variant="primary" icon={CheckCircle2} onClick={() => decide(a.id, 'Approved')}>
                      Approve
                    </Button>
                  </div>
                ) : (
                  <Badge tone={a.status === 'Approved' ? 'mint' : 'rose'} dot>
                    {a.status}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

const RANGES = [
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
  { value: 'all', label: 'All time' },
] as const;
type RangeValue = (typeof RANGES)[number]['value'];

const AUDIT_HEADERS = ['ID', 'Timestamp', 'Actor', 'Module', 'Action', 'Target'];

export const AuditLog: React.FC = () => {
  const { auditEntries, setAuditEntries, addAudit, toast } = useAdmin();
  const [range, setRange] = useState<RangeValue>('30');
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actor, setActor] = useState('all');
  const [retention, setRetention] = useSharedValue<string>('audit_retention', '365');
  const [importing, setImporting] = useState<{ rows: AuditEntry[]; skipped: number; fileName: string } | null>(null);

  const modules = useMemo(() => Array.from(new Set(auditEntries.map((e) => e.module || 'General'))).sort(), [auditEntries]);
  const actors = useMemo(() => Array.from(new Set(auditEntries.map((e) => e.actor))).sort(), [auditEntries]);

  const filtered = useMemo(() => {
    const cutoff = range === 'all' ? 0 : Date.now() - Number(range) * DAY_MS;
    const q = query.trim().toLowerCase();
    return auditEntries
      .filter((e) => new Date(e.at).getTime() >= cutoff)
      .filter((e) => (moduleFilter === 'all' ? true : (e.module || 'General') === moduleFilter))
      .filter((e) => (actor === 'all' ? true : e.actor === actor))
      .filter((e) => (!q ? true : [e.action, e.target, e.actor, e.module].some((v) => v?.toLowerCase().includes(q))))
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [auditEntries, range, query, moduleFilter, actor]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        RANGES.map((r) => [r.value, r.value === 'all' ? auditEntries.length : auditEntries.filter((e) => new Date(e.at).getTime() >= Date.now() - Number(r.value) * DAY_MS).length])
      ) as Record<RangeValue, number>,
    [auditEntries]
  );

  // Daily activity for the selected window (max 90 bars so it stays legible)
  const histogram = useMemo(() => {
    const days = range === 'all' ? 90 : Math.min(90, Number(range));
    const buckets = Array.from({ length: days }, () => 0);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startMs = start.getTime() - (days - 1) * DAY_MS;
    filtered.forEach((e) => {
      const i = Math.floor((new Date(e.at).getTime() - startMs) / DAY_MS);
      if (i >= 0 && i < days) buckets[i]++;
    });
    return { buckets, max: Math.max(1, ...buckets), days };
  }, [filtered, range]);

  const exportCsv = () => {
    const label = RANGES.find((r) => r.value === range)?.label.replace(' ', '') || range;
    downloadCsv(
      `maxicareer_audit_${label}_${new Date().toISOString().slice(0, 10)}.csv`,
      AUDIT_HEADERS,
      filtered.map((e) => [e.id, e.at, e.actor, e.module || 'General', e.action, e.target])
    );
    addAudit('Audit log', 'Exported audit log to CSV', `${filtered.length} entries, ${RANGES.find((r) => r.value === range)?.label}`);
  };

  const pickCsv = useCsvPicker((rows, fileName) => {
    const existing = new Set(auditEntries.map((e) => e.id));
    let skipped = 0;
    const parsed: AuditEntry[] = [];
    rows.forEach((r) => {
      const at = pick(r, 'timestamp', 'at', 'date', 'time');
      const action = pick(r, 'action', 'event');
      const time = new Date(at).getTime();
      const id = pick(r, 'id') || uid('log');
      if (!action || !at || Number.isNaN(time) || existing.has(id)) {
        skipped++;
        return;
      }
      existing.add(id);
      parsed.push({ id, at: new Date(time).toISOString(), actor: pick(r, 'actor', 'user', 'email') || 'imported', module: pick(r, 'module', 'area') || 'General', action, target: pick(r, 'target', 'details', 'object') });
    });
    if (!parsed.length && !skipped) {
      toast('That file has no rows under the header line.', 'error');
      return;
    }
    setImporting({ rows: parsed, skipped, fileName });
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit log"
        description="Who changed what, and when. Use it to answer questions from students, staff or auditors."
        actions={
          <>
            <Button icon={Upload} onClick={pickCsv}>
              Import CSV
            </Button>
            <Button icon={Download} onClick={exportCsv} disabled={!filtered.length}>
              Export CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <Segmented value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r.value, label: r.label, count: counts[r.value] }))} />
        <div className="flex flex-col sm:flex-row gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search action, target or person" className="flex-1" />
          <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="sm:w-40" aria-label="Area">
            <option value="all">All areas</option>
            {modules.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
          <Select value={actor} onChange={(e) => setActor(e.target.value)} className="sm:w-48" aria-label="Person">
            <option value="all">Everyone</option>
            {actors.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </div>
      </div>

      <Panel
        title={`${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'} ${range === 'all' ? 'in total' : `in the last ${RANGES.find((r) => r.value === range)?.label.toLowerCase()}`}`}
        description={range === 'all' ? 'Chart shows the most recent 90 days' : 'Activity per day'}
      >
        <div className="flex items-end gap-[2px] h-16" aria-hidden>
          {histogram.buckets.map((n, i) => (
            <span key={i} className={cx('flex-1 rounded-t-[2px]', n ? 'bg-[#2563EB]' : 'bg-[#E2E8F1]')} style={{ height: n ? `${15 + (n / histogram.max) * 85}%` : '6%' }} title={`${n} entries`} />
          ))}
        </div>
        <div className="flex justify-between text-[11.5px] text-[#7A869E] mt-1.5">
          <span>{histogram.days} days ago</span>
          <span>Today</span>
        </div>
      </Panel>

      <div className="bg-white border border-[#DDE4EF] rounded-[14px] overflow-hidden">
        {filtered.length === 0 ? (
          <Empty
            icon={History}
            title={auditEntries.length ? 'Nothing recorded in this period' : 'No activity recorded yet'}
            body={auditEntries.length ? 'Pick a longer range or clear the filters.' : 'Changes made in the admin portal are recorded here automatically. You can also import an earlier export.'}
          />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Person</Th>
                  <Th>Area</Th>
                  <Th>Action</Th>
                  <Th>Details</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF6]">
                {filtered.slice(0, 500).map((e) => (
                  <tr key={e.id}>
                    <Td className="whitespace-nowrap text-[12.5px] text-[#5B6885]" suppressHydrationWarning>
                      {formatDate(e.at, true)}
                    </Td>
                    <Td className="text-[13px]">{e.actor}</Td>
                    <Td>
                      <Badge>{e.module || 'General'}</Badge>
                    </Td>
                    <Td className="font-semibold text-[#0D1B3E]">{e.action}</Td>
                    <Td className="text-[13px] text-[#5B6885] max-w-[340px]">{e.target}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 500 && <p className="px-4 py-3 text-[12.5px] text-[#5B6885] border-t border-[#EAEFF6]">Showing the latest 500. Export to CSV to see all {filtered.length}.</p>}
          </div>
        )}
      </div>

      <Panel title="Retention" description="Entries older than this are deleted when you apply it. Export first if you need a copy.">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Segmented
            value={retention}
            onChange={setRetention}
            options={[
              { value: '30', label: '30 days' },
              { value: '60', label: '60 days' },
              { value: '90', label: '90 days' },
              { value: '365', label: '1 year' },
            ]}
          />
          <Button
            variant="danger"
            icon={Trash2}
            className="sm:ml-auto"
            onClick={() => {
              const cutoff = Date.now() - Number(retention) * DAY_MS;
              const removed = auditEntries.filter((e) => new Date(e.at).getTime() < cutoff).length;
              if (!removed) {
                toast(`Nothing is older than ${RANGES.find((r) => r.value === retention)?.label}.`);
                return;
              }
              if (!window.confirm(`Delete ${removed} entr${removed === 1 ? 'y' : 'ies'} older than ${RANGES.find((r) => r.value === retention)?.label}?`)) return;
              setAuditEntries((prev) => prev.filter((e) => new Date(e.at).getTime() >= cutoff));
              addAudit('Audit log', 'Applied retention', `Removed ${removed} entries older than ${retention} days`);
            }}
          >
            Apply retention
          </Button>
        </div>
      </Panel>

      <Modal
        open={!!importing}
        onClose={() => setImporting(null)}
        title="Import audit entries"
        description={importing?.fileName}
        footer={
          <>
            <Button onClick={() => setImporting(null)}>Cancel</Button>
            <Button
              variant="primary"
              icon={Upload}
              disabled={!importing?.rows.length}
              onClick={() => {
                if (!importing) return;
                setAuditEntries((prev) => [...importing.rows, ...prev].sort((a, b) => b.at.localeCompare(a.at)));
                addAudit('Audit log', 'Imported audit entries from CSV', `${importing.rows.length} added, ${importing.skipped} skipped (${importing.fileName})`);
                toast(`Imported ${importing.rows.length} entries.`);
                setImporting(null);
                setRange('all');
              }}
            >
              Import {importing?.rows.length || 0} entries
            </Button>
          </>
        }
      >
        {importing && (
          <div className="space-y-3 text-[13.5px] text-[#26355A]">
            <p>
              <span className="mc-num font-semibold">{importing.rows.length}</span> new entries ready
              {importing.rows.length > 0 && (
                <>
                  , from {formatDate(importing.rows.reduce((m, r) => (r.at < m ? r.at : m), importing.rows[0].at))} to{' '}
                  {formatDate(importing.rows.reduce((m, r) => (r.at > m ? r.at : m), importing.rows[0].at))}
                </>
              )}
              .
            </p>
            {importing.skipped > 0 && <p className="text-[#94570A]">{importing.skipped} rows will be skipped: they're already in the log, or are missing a timestamp or action.</p>}
            <p className="text-[12.5px] text-[#5B6885]">Expected columns: {AUDIT_HEADERS.join(', ')}. This matches the Export CSV format.</p>
          </div>
        )}
      </Modal>

      <button type="button" className="inline-flex items-center gap-1.5 text-[12.5px] text-[#5B6885] hover:text-[#2563EB]" onClick={() => downloadCsv('maxicareer_audit_template.csv', AUDIT_HEADERS, [['', new Date().toISOString(), 'admin@maxicareer.com', 'Students', 'Changed status', 'Ananya Rao: Pending → Contacted']])}>
        <FileDown className="w-3.5 h-3.5" /> Download import template
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page access                                                         */
/* ------------------------------------------------------------------ */

export const ALL_PAGE_IDS: AdminTab[] = [...NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id)), SETTINGS_ITEM.id];

export const DEFAULT_ROLE_PAGES: Record<string, AdminTab[]> = {
  Counsellor: ['dashboard', 'notifications', 'students', 'sessions', 'applications', 'roadmaps', 'curriculum', 'events', 'feedback'],
  Mentor: ['dashboard', 'notifications', 'students', 'sessions', 'roadmaps', 'applications', 'curriculum', 'events', 'feedback'],
  'Content editor': ['dashboard', 'notifications', 'web-careers', 'web-home', 'web-nav', 'web-footer', 'web-contact', 'web-cta', 'web-articles', 'web-seo', 'web-social'],
  Admin: ALL_PAGE_IDS.filter((p) => p !== 'access'),
  'Global admin': ALL_PAGE_IDS,
};

/** Pages that existed before the learning, finance and career pages were added. */
const LEGACY_PAGE_IDS = ['dashboard', 'notifications', 'students', 'counsellors', 'users', 'programs', 'services', 'roadmaps', 'applications', 'sessions', 'reports', 'web-home', 'web-nav', 'web-footer', 'web-contact', 'web-cta', 'web-articles', 'web-seo', 'web-social', 'approvals', 'audit', 'access', 'settings'];

/** Stored alongside the roles: every page id the saved settings already knew about. */
const KNOWN_KEY = '__known';

/**
 * Page access as saved, plus any page added since it was saved (granted by the role's
 * defaults), so a role like Admin sees new pages without someone re-ticking them.
 */
export function effectiveRolePages(stored: Record<string, string[]>): Record<string, string[]> {
  const known = new Set(stored[KNOWN_KEY] || LEGACY_PAGE_IDS);
  const out: Record<string, string[]> = {};
  for (const [role, pages] of Object.entries(stored)) {
    if (role.startsWith('__')) continue;
    const added = (DEFAULT_ROLE_PAGES[role] || []).filter((p) => !known.has(p));
    out[role] = Array.from(new Set([...pages, ...added]));
  }
  for (const [role, pages] of Object.entries(DEFAULT_ROLE_PAGES)) if (!out[role]) out[role] = pages;
  return out;
}

export const PageAccess: React.FC = () => {
  const { addAudit } = useAdmin();
  const [stored, setStored] = useSharedValue<Record<string, string[]>>('role_pages', DEFAULT_ROLE_PAGES);
  const rolePages = effectiveRolePages(stored);
  const setRolePages = (next: Record<string, string[]>) => setStored({ ...next, [KNOWN_KEY]: ALL_PAGE_IDS });
  const roles = Object.keys(rolePages);
  const [role, setRole] = useState(roles[0] || 'Counsellor');
  const pages = rolePages[role] || [];
  const locked = role === 'Global admin';

  const setPage = (page: string, on: boolean) => {
    const next = on ? Array.from(new Set([...pages, page])) : pages.filter((p) => p !== page);
    setRolePages({ ...rolePages, [role]: next });
    addAudit('Page access', on ? 'Granted page' : 'Revoked page', `${role}: ${page}`);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Page access" description="Choose which parts of the admin portal each role can open." />
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 items-start">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto" aria-label="Roles">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cx('flex items-center justify-between gap-3 h-11 px-3.5 rounded-[11px] text-[14px] font-semibold whitespace-nowrap border', r === role ? 'bg-white border-[#DDE4EF] text-[#0D1B3E]' : 'border-transparent text-[#5B6885] hover:text-[#0D1B3E]')}
            >
              {r}
              <span className="mc-num text-[12px] font-medium text-[#7A869E]">
                {(rolePages[r] || []).length}/{ALL_PAGE_IDS.length}
              </span>
            </button>
          ))}
        </nav>
        <Panel
          title={role}
          description={locked ? 'Global admins always see everything.' : `${pages.length} of ${ALL_PAGE_IDS.length} pages`}
          actions={
            !locked && (
              <>
                <Button size="sm" onClick={() => setRolePages({ ...rolePages, [role]: [] })}>
                  None
                </Button>
                <Button size="sm" onClick={() => setRolePages({ ...rolePages, [role]: [...ALL_PAGE_IDS] })}>
                  All
                </Button>
              </>
            )
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {[...NAV_GROUPS, { label: 'Workspace', items: [SETTINGS_ITEM] }].map((g) => (
              <div key={g.label}>
                <div className="text-[12.5px] font-semibold text-[#5B6885] mb-2">{g.label}</div>
                <ul className="space-y-1">
                  {g.items.map((it) => {
                    const Icon = it.icon;
                    const on = locked || pages.includes(it.id);
                    return (
                      <li key={it.id} className="flex items-center gap-3 py-1.5">
                        <Icon className="w-4 h-4 text-[#7A869E]" />
                        <span className="flex-1 text-[13.5px] text-[#26355A]">{it.label}</span>
                        {locked ? <Lock className="w-3.5 h-3.5 text-[#8C97AE]" /> : <Toggle checked={on} onChange={(v) => setPage(it.id, v)} label={`${role}: ${it.label}`} />}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <p className="text-[12.5px] text-[#7A869E] flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" /> These settings control what the portal shows. Pair them with server-side checks before giving staff real accounts.
      </p>
    </div>
  );
};
