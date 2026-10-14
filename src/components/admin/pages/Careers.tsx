import React, { useState } from 'react';
import { BriefcaseBusiness, Plus, Pencil, Trash2, Copy, ExternalLink, MapPin, Lock, Unlock } from 'lucide-react';
import { useAdmin } from '../context';
import { PageHeader, Panel, Stat, Badge, Button, IconButton, Empty, Segmented, Modal, Field, Input, Select, Textarea, SearchInput, Tone } from '../ui';
import { useSharedCollection, uid, formatDate } from '../lib';
import type { CareerOpening } from '../../../types/portal';

const todayIso = () => new Date().toISOString().slice(0, 10);
const STATUS_TONE: Record<CareerOpening['status'], Tone> = { Published: 'mint', Draft: 'marigold', Closed: 'neutral' };
const STATUS_LABEL: Record<CareerOpening['status'], string> = { Published: 'Live', Draft: 'Draft', Closed: 'Closed' };

const blankOpening = (): CareerOpening => ({
  id: '',
  title: '',
  company: '',
  location: '',
  workMode: 'On-site',
  type: 'Full-time',
  department: '',
  experience: '',
  salary: '',
  description: '',
  requirements: [],
  applyUrl: '',
  applyEmail: '',
  deadline: '',
  status: 'Published',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const isExpired = (o: CareerOpening) => !!o.deadline && o.deadline < todayIso();

const OpeningEditor: React.FC<{ draft: CareerOpening | null; onClose: () => void; onSave: (o: CareerOpening) => void }> = ({ draft, onClose, onSave }) => {
  const [o, setO] = useState<CareerOpening | null>(draft);
  const [reqText, setReqText] = useState('');
  React.useEffect(() => {
    setO(draft);
    setReqText((draft?.requirements || []).join('\n'));
  }, [draft]);
  if (!o) return <Modal open={false} onClose={onClose} title="" children={null} />;
  const url = o.applyUrl?.trim() || '';
  const email = o.applyEmail?.trim() || '';
  const problem = !o.title.trim()
    ? 'Add a job title.'
    : !o.company.trim()
      ? 'Add the company.'
      : !url && !email
        ? 'Add an application link or email.'
        : url && !/^https?:\/\/\S+\.\S+/.test(url)
          ? 'The application link must start with https://'
          : email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            ? 'The application email looks wrong.'
            : '';
  return (
    <Modal
      open={!!draft}
      onClose={onClose}
      title={o.id ? 'Edit opening' : 'New opening'}
      description="Live openings appear on the public Careers page at /careers."
      width="max-w-2xl"
      footer={
        <>
          <span className="mr-auto self-center text-[12.5px] text-[#B42F3B]">{problem}</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!!problem}
            onClick={() =>
              onSave({
                ...o,
                title: o.title.trim(),
                company: o.company.trim(),
                applyUrl: url || undefined,
                applyEmail: email || undefined,
                salary: o.salary?.trim() || undefined,
                deadline: o.deadline || undefined,
                requirements: reqText
                  .split('\n')
                  .map((r) => r.replace(/^[-•*]\s*/, '').trim())
                  .filter(Boolean),
                updatedAt: new Date().toISOString(),
              })
            }
          >
            Save opening
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Job title" className="sm:col-span-2">
          <Input value={o.title} onChange={(e) => setO({ ...o, title: e.target.value })} placeholder="Junior Data Analyst" />
        </Field>
        <Field label="Company">
          <Input value={o.company} onChange={(e) => setO({ ...o, company: e.target.value })} placeholder="Maxicareer or a partner company" />
        </Field>
        <Field label="Team / department">
          <Input value={o.department} onChange={(e) => setO({ ...o, department: e.target.value })} placeholder="Analytics" />
        </Field>
        <Field label="Location">
          <Input value={o.location} onChange={(e) => setO({ ...o, location: e.target.value })} placeholder="Chennai" />
        </Field>
        <Field label="Work mode">
          <Select value={o.workMode} onChange={(e) => setO({ ...o, workMode: e.target.value as CareerOpening['workMode'] })}>
            <option>On-site</option>
            <option>Hybrid</option>
            <option>Remote</option>
          </Select>
        </Field>
        <Field label="Type">
          <Select value={o.type} onChange={(e) => setO({ ...o, type: e.target.value as CareerOpening['type'] })}>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Internship</option>
            <option>Contract</option>
          </Select>
        </Field>
        <Field label="Experience">
          <Input value={o.experience} onChange={(e) => setO({ ...o, experience: e.target.value })} placeholder="0–2 years" />
        </Field>
        <Field label="Salary / stipend" hint="Optional">
          <Input value={o.salary || ''} onChange={(e) => setO({ ...o, salary: e.target.value })} placeholder="₹4–6 LPA" />
        </Field>
        <Field label="Apply by" hint="Optional. The opening hides itself after this date.">
          <Input type="date" value={o.deadline || ''} onChange={(e) => setO({ ...o, deadline: e.target.value })} />
        </Field>
        <Field label="About the role" className="sm:col-span-2">
          <Textarea rows={4} value={o.description} onChange={(e) => setO({ ...o, description: e.target.value })} />
        </Field>
        <Field label="Requirements" hint="One per line." className="sm:col-span-2">
          <Textarea rows={4} value={reqText} onChange={(e) => setReqText(e.target.value)} placeholder={'SQL and Excel\nGood written English'} />
        </Field>
        <Field label="Application link">
          <Input value={o.applyUrl || ''} onChange={(e) => setO({ ...o, applyUrl: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="Or application email">
          <Input type="email" value={o.applyEmail || ''} onChange={(e) => setO({ ...o, applyEmail: e.target.value })} placeholder="careers@company.com" />
        </Field>
        <Field label="Status" className="sm:col-span-2">
          <Select value={o.status} onChange={(e) => setO({ ...o, status: e.target.value as CareerOpening['status'] })}>
            <option value="Published">Live on the Careers page</option>
            <option value="Draft">Draft (hidden)</option>
            <option value="Closed">Closed (hidden)</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
};

export const CareerPage: React.FC = () => {
  const { addAudit, toast } = useAdmin();
  const [openings, setOpenings] = useSharedCollection<CareerOpening>('careers', []);
  const [view, setView] = useState<'live' | 'Draft' | 'Closed' | 'all'>('live');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<CareerOpening | null>(null);

  const live = openings.filter((o) => o.status === 'Published' && !isExpired(o));
  const expiringSoon = live.filter((o) => o.deadline && o.deadline <= new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10));
  const shown = [...openings]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((o) => (view === 'all' ? true : view === 'live' ? o.status === 'Published' && !isExpired(o) : view === 'Closed' ? o.status === 'Closed' || (o.status === 'Published' && isExpired(o)) : o.status === view))
    .filter((o) => !q || `${o.title} ${o.company} ${o.location} ${o.department}`.toLowerCase().includes(q.toLowerCase()));

  const save = (o: CareerOpening) => {
    if (o.id) {
      setOpenings((prev) => prev.map((x) => (x.id === o.id ? o : x)));
      addAudit('Career page', 'Edited opening', `${o.title} · ${o.company}`);
    } else {
      setOpenings((prev) => [{ ...o, id: uid('job'), createdAt: new Date().toISOString() }, ...prev]);
      addAudit('Career page', 'Posted opening', `${o.title} · ${o.company}`);
    }
    toast(o.status === 'Published' ? 'Opening is live on the Careers page.' : 'Opening saved.');
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Career page"
        description="Jobs and internships listed on the public Careers page, for students and visitors."
        actions={
          <>
            <a href="/careers" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#D3DBE8] bg-white px-4 text-[13.5px] font-semibold text-[#0D1B3E] hover:border-[#B7C3D7]">
              <ExternalLink className="w-4 h-4" /> View page
            </a>
            <Button variant="primary" icon={Plus} onClick={() => setEditing(blankOpening())}>
              New opening
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Live openings" value={live.length} onClick={() => setView('live')} />
        <Stat label="Closing within 7 days" value={expiringSoon.length} />
        <Stat label="Drafts" value={openings.filter((o) => o.status === 'Draft').length} onClick={() => setView('Draft')} />
        <Stat label="Closed or expired" value={openings.filter((o) => o.status === 'Closed' || (o.status === 'Published' && isExpired(o))).length} onClick={() => setView('Closed')} />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'live', label: 'Live' },
            { value: 'Draft', label: 'Drafts' },
            { value: 'Closed', label: 'Closed' },
            { value: 'all', label: 'All', count: openings.length },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search title, company or city" className="lg:ml-auto lg:w-72" />
      </div>
      <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
        {shown.length === 0 && (
          <Empty
            icon={BriefcaseBusiness}
            title={openings.length ? 'Nothing here' : 'No openings yet'}
            body="Post jobs and internships from partner companies, or roles at Maxicareer. They appear on /careers with an apply link."
            action={<Button onClick={() => setEditing(blankOpening())}>New opening</Button>}
          />
        )}
        {shown.map((o) => (
          <div key={o.id} className="flex flex-col lg:flex-row lg:items-center gap-3 px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] font-semibold">{o.title}</span>
                <Badge tone={isExpired(o) && o.status === 'Published' ? 'rose' : STATUS_TONE[o.status]} dot>
                  {isExpired(o) && o.status === 'Published' ? 'Expired' : STATUS_LABEL[o.status]}
                </Badge>
                <Badge tone="blue">{o.type}</Badge>
              </div>
              <div className="text-[13px] text-[#5B6885] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="font-semibold text-[#26355A]">{o.company}</span>
                {o.department && <span>{o.department}</span>}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {o.location || '—'} · {o.workMode}
                </span>
                {o.experience && <span>{o.experience}</span>}
                {o.salary && <span>{o.salary}</span>}
              </div>
            </div>
            <div className="text-[12.5px] text-[#5B6885] lg:w-40 shrink-0">
              {o.deadline ? `Apply by ${formatDate(o.deadline)}` : 'No deadline'}
              <div className="text-[#9AA5BB]">Updated {formatDate(o.updatedAt)}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <IconButton
                icon={o.status === 'Closed' ? Unlock : Lock}
                label={o.status === 'Closed' ? 'Reopen' : 'Close'}
                onClick={() => {
                  const status = o.status === 'Closed' ? 'Published' : 'Closed';
                  setOpenings((prev) => prev.map((x) => (x.id === o.id ? { ...x, status, updatedAt: new Date().toISOString() } : x)));
                  addAudit('Career page', status === 'Closed' ? 'Closed opening' : 'Reopened opening', o.title);
                }}
              />
              <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(o)} />
              <IconButton icon={Copy} label="Duplicate" onClick={() => setEditing({ ...o, id: '', status: 'Draft', title: `${o.title} (copy)` })} />
              <IconButton
                icon={Trash2}
                tone="danger"
                label="Delete"
                onClick={() => {
                  if (!window.confirm(`Delete "${o.title}"?`)) return;
                  setOpenings((prev) => prev.filter((x) => x.id !== o.id));
                  addAudit('Career page', 'Deleted opening', o.title);
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <Panel>
        <p className="text-[13px] text-[#5B6885]">
          Applications go straight to the link or email on each opening. Openings past their "apply by" date drop off the public page automatically.
        </p>
      </Panel>
      <OpeningEditor draft={editing} onClose={() => setEditing(null)} onSave={save} />
    </div>
  );
};
