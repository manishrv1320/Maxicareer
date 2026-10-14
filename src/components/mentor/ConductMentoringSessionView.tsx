import React, { useState } from 'react';
import { Video, CheckCircle2 } from 'lucide-react';
import { Appointment, Mentor, CounselorStudentDetail } from '../../types/counselor';

interface ConductMentoringSessionViewProps {
  appointment: Appointment;
  mentee: CounselorStudentDetail | null;
  mentor: Mentor;
  onClose: () => void;
  onSaveSession: (data: {
    summary: string;
    keyDiscussionPoints: string[];
    studentConcerns: string;
    recommendations: string;
    nextSteps: string;
    followUpDate?: string;
  }) => void;
}

export const ConductMentoringSessionView: React.FC<ConductMentoringSessionViewProps> = ({
  appointment,
  mentee,
  mentor,
  onClose,
  onSaveSession,
}) => {
  const [summary, setSummary] = useState('');
  const [pointsText, setPointsText] = useState('');
  const [concerns, setConcerns] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError('Please provide a brief mentoring session summary.');
      return;
    }
    onSaveSession({
      summary: summary.trim(),
      keyDiscussionPoints: pointsText
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean),
      studentConcerns: concerns.trim(),
      recommendations: recommendations.trim(),
      nextSteps: nextSteps.trim(),
      followUpDate: followUpDate || undefined,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Live Mentoring Documentation
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">
              Conduct Session &bull; {appointment.studentName}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition-colors cursor-pointer"
        >
          Close Session
        </button>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Mentee context */}
        <div className="space-y-5 lg:border-r lg:border-slate-200 lg:pr-6">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
            Mentee Context &amp; Placement Target
          </h3>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Career Target</span>
              <span className="font-bold text-slate-900 text-sm">
                {mentee?.careerGoal || appointment.topic}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Track / Domain</span>
              <span className="font-semibold text-slate-700">
                {mentor.domain}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Education Level</span>
              <span className="font-semibold text-slate-700">
                {mentee?.professionLabel || mentee?.profession || 'Learner'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Roadmap Progress</span>
              <span className="font-bold text-emerald-600">{mentee?.roadmapProgress || 0}% Completed</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1">
            <span className="font-bold text-emerald-900 block">Session Scheduled For:</span>
            <p className="text-emerald-700 font-semibold">
              {appointment.date} at {appointment.time}
            </p>
            <p className="text-slate-500 text-[11px]">Type: {appointment.counselingType || 'Mock Technical & System Review'}</p>
          </div>
        </div>

        {/* Right column: Documentation Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mentoring Session Summary *
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Synthesize the key outcomes of today's technical mock or portfolio audit..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Key Technical Discussion Points (1 per line)
            </label>
            <textarea
              value={pointsText}
              onChange={(e) => setPointsText(e.target.value)}
              rows={3}
              placeholder="e.g.&#10;  Evaluated time & space complexity for Graph BFS/DFS questions&#10;  Discussed database indexing vs caching tradeoffs&#10;  Audited system architecture diagram for scalability"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mentee Roadblocks &amp; Questions
              </label>
              <textarea
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                rows={2}
                placeholder="What technical barriers, code gaps, or interview anxieties did the mentee encounter?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Engineering Recommendations
              </label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={2}
                placeholder="Specific architectural patterns, LeetCode modules, or design paradigms recommended..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Agreed Next Action Steps
              </label>
              <input
                type="text"
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="e.g. Implement Redis caching layer and submit PR before Tuesday"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Recommended Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save &amp; Complete Mentoring Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
