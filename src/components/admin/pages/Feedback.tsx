import React, { useMemo, useState } from 'react';
import { Download, MessageSquareHeart, Star, Trash2 } from 'lucide-react';
import { useAdmin } from '../context';
import { PageHeader, Panel, Badge, Button, Empty, Segmented, Select, SearchInput, Stat, IconButton, Th, Td, Tone } from '../ui';
import { useSharedCollection, downloadCsv, timeAgo } from '../lib';
import type { FeedbackItem } from '../../../types/portal';
import { StarRating } from '../../workspace/kit';

const ABOUT: FeedbackItem['about'][] = ['Session', 'Mentor', 'Counsellor', 'Course', 'Platform'];
const ABOUT_TONE: Record<FeedbackItem['about'], Tone> = { Session: 'blue', Mentor: 'violet', Counsellor: 'violet', Course: 'mint', Platform: 'neutral' };

export const Feedback: React.FC = () => {
  const { addAudit } = useAdmin();
  const [items, setItems] = useSharedCollection<FeedbackItem>('feedback', [], { refreshMs: 60_000 });
  const [about, setAbout] = useState<'all' | FeedbackItem['about']>('all');
  const [rating, setRating] = useState<'all' | 'low' | 'high'>('all');
  const [q, setQ] = useState('');

  const sorted = useMemo(() => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [items]);
  const shown = sorted.filter(
    (f) =>
      (about === 'all' || f.about === about) &&
      (rating === 'all' || (rating === 'low' ? f.rating <= 2 : f.rating >= 4)) &&
      (!q || `${f.fromName} ${f.targetName || ''} ${f.comment}`.toLowerCase().includes(q.toLowerCase()))
  );
  const avg = items.length ? items.reduce((s, f) => s + f.rating, 0) / items.length : null;
  const month = new Date().toISOString().slice(0, 7);

  const byPerson = useMemo(() => {
    const m = new Map<string, { name: string; n: number; total: number; low: number }>();
    items
      .filter((f) => f.targetId)
      .forEach((f) => {
        const cur = m.get(f.targetId!) || { name: f.targetName || 'Unknown', n: 0, total: 0, low: 0 };
        m.set(f.targetId!, { ...cur, n: cur.n + 1, total: cur.total + f.rating, low: cur.low + (f.rating <= 2 ? 1 : 0) });
      });
    return Array.from(m.values()).sort((a, b) => b.total / b.n - a.total / a.n);
  }, [items]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Feedback"
        description="Ratings and comments from students about sessions, mentors, counsellors, courses and the platform."
        actions={
          <Button
            icon={Download}
            disabled={!shown.length}
            onClick={() =>
              downloadCsv(
                `maxicareer_feedback_${new Date().toISOString().slice(0, 10)}.csv`,
                ['Date', 'From', 'Role', 'About', 'Mentor / counsellor', 'Rating', 'Comment'],
                shown.map((f) => [f.createdAt, f.fromName, f.fromRole, f.about, f.targetName || '', f.rating, f.comment])
              )
            }
          >
            Export
          </Button>
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Average rating" value={avg ? avg.toFixed(1) : '—'} accent={avg ? <Star className="w-4 h-4 fill-[#F2A93B] text-[#F2A93B]" /> : undefined} hint={`${items.length} responses`} />
        <Stat label="This month" value={items.filter((f) => f.createdAt.startsWith(month)).length} />
        <Stat label="Happy (4–5 ★)" value={items.filter((f) => f.rating >= 4).length} onClick={() => setRating('high')} />
        <Stat label="Needs attention (1–2 ★)" value={items.filter((f) => f.rating <= 2).length} accent={items.some((f) => f.rating <= 2) ? <span className="h-2.5 w-2.5 rounded-full bg-[#D93F4C]" /> : undefined} onClick={() => setRating('low')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5 items-start">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <Segmented
              value={about}
              onChange={setAbout}
              options={[{ value: 'all' as const, label: 'All', count: items.length }, ...ABOUT.map((a) => ({ value: a, label: a, count: items.filter((f) => f.about === a).length }))]}
            />
            <Select value={rating} onChange={(e) => setRating(e.target.value as typeof rating)} className="lg:w-44" aria-label="Rating">
              <option value="all">Any rating</option>
              <option value="high">4–5 stars</option>
              <option value="low">1–2 stars</option>
            </Select>
          </div>
          <SearchInput value={q} onChange={setQ} placeholder="Search names and comments" />
          <div className="bg-white border border-[#DDE4EF] rounded-[14px] divide-y divide-[#EAEFF6]">
            {shown.length === 0 && <Empty icon={MessageSquareHeart} title={items.length ? 'No feedback matches' : 'No feedback yet'} body="Students rate sessions and send feedback from their portal." />}
            {shown.map((f) => (
              <div key={f.id} className="flex items-start gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRating value={f.rating} size={15} />
                    <Badge tone={ABOUT_TONE[f.about]}>{f.about}</Badge>
                    {f.targetName && <span className="text-[13px] font-semibold">{f.targetName}</span>}
                  </div>
                  {f.comment ? <p className="mt-1.5 text-[14px] text-[#26355A] whitespace-pre-wrap">{f.comment}</p> : <p className="mt-1.5 text-[13px] text-[#9AA5BB]">No comment.</p>}
                  <div className="mt-1 text-[12px] text-[#7A869E]">
                    {f.fromName} ({f.fromRole}) · {timeAgo(f.createdAt)}
                  </div>
                </div>
                <IconButton
                  icon={Trash2}
                  tone="danger"
                  label="Delete"
                  onClick={() => {
                    if (!window.confirm('Delete this feedback? Only do this for spam or test entries.')) return;
                    setItems((prev) => prev.filter((x) => x.id !== f.id));
                    addAudit('Feedback', 'Deleted feedback', `${f.fromName}: ${f.rating}/5`);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <Panel title="By mentor & counsellor" flush>
          {byPerson.length === 0 ? (
            <p className="px-5 pb-5 text-[13px] text-[#5B6885]">Ratings about a specific person appear here.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th className="text-right">Reviews</Th>
                  <Th className="text-right">Average</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF6]">
                {byPerson.map((p) => (
                  <tr key={p.name}>
                    <Td className="font-semibold">
                      {p.name}
                      {p.low > 0 && <span className="ml-2 text-[12px] font-normal text-[#B42F3B]">{p.low} low</span>}
                    </Td>
                    <Td className="mc-num text-right">{p.n}</Td>
                    <Td className="mc-num text-right font-semibold">{(p.total / p.n).toFixed(1)} ★</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
};
