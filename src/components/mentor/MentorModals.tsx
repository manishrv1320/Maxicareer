import React, { useState } from 'react';
import { CounselorStudentDetail, Mentor, Recommendation, FollowUpTask } from '../../types/counselor';

// ==========================================
// MODAL: ADD RECOMMENDATION
// ==========================================
interface AddMentorRecommendationModalProps {
  mentor: Mentor;
  mentees: CounselorStudentDetail[];
  preselectedMenteeId?: string;
  onClose: () => void;
  onAdd: (data: Omit<Recommendation, 'id' | 'createdAt' | 'status'>) => void;
}

export const AddMentorRecommendationModal: React.FC<AddMentorRecommendationModalProps> = ({
  mentor,
  mentees,
  preselectedMenteeId,
  onClose,
  onAdd,
}) => {
  const [studentId, setStudentId] = useState(preselectedMenteeId || mentees[0]?.id || '');
  const [category, setCategory] = useState<Recommendation['category']>('Skills to Learn');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !title.trim()) return;
    onAdd({
      studentId,
      counselorId: mentor.id,
      counselorName: mentor.name,
      category,
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-black text-lg text-slate-900">Assign Technical Recommendation</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Select Mentee
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              required
            >
              {mentees.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.careerGoal})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Recommendation Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="Skills to Learn">Skills to Learn</option>
              <option value="Projects to Complete">Projects to Complete</option>
              <option value="Interview Preparation">Interview Preparation</option>
              <option value="Resume & Portfolio">Resume & Portfolio</option>
              <option value="Certifications">Certifications</option>
              <option value="Courses to Explore">Courses to Explore</option>
              <option value="Career Areas to Research">Career Areas to Research</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Recommendation Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Redis Caching & Rate Limiting Algorithms"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Technical Context / Implementation Details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Explain why this step is critical for tier-1 tech interviews and how the mentee should implement it..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
            >
              Assign Recommendation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// MODAL: ADD FOLLOW-UP TASK
// ==========================================
interface AddMentorFollowUpTaskModalProps {
  mentor: Mentor;
  mentees: CounselorStudentDetail[];
  preselectedMenteeId?: string;
  onClose: () => void;
  onAdd: (data: Omit<FollowUpTask, 'id' | 'createdAt' | 'status'>) => void;
}

export const AddMentorFollowUpTaskModal: React.FC<AddMentorFollowUpTaskModalProps> = ({
  mentor,
  mentees,
  preselectedMenteeId,
  onClose,
  onAdd,
}) => {
  const [studentId, setStudentId] = useState(preselectedMenteeId || mentees[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<FollowUpTask['priority']>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !title.trim() || !dueDate) return;
    onAdd({
      studentId,
      counselorId: mentor.id,
      counselorName: mentor.name,
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-black text-lg text-slate-900">Assign Follow-up Task</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Select Mentee
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              required
            >
              {mentees.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.careerGoal})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solve 10 LeetCode Hard Dynamic Programming questions"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Task Deliverable Details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Specify requirements or PR checklist for the mentee..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
