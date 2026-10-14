import React from 'react';
import {
  Award,
  Video,
  FileText,
  Sparkles,
  ListTodo,
  Compass,
} from 'lucide-react';
import { CounselorStudentDetail, Mentor } from '../../types/counselor';
import { useCareerStore } from '../../hooks/useCareerStore';

interface MenteeDetailForMentorProps {
  mentee: CounselorStudentDetail;
  mentor: Mentor;
  onBack: () => void;
  onOpenAddRec: () => void;
  onOpenAddTask: () => void;
  onStartSessionWithMentee: (mentee: CounselorStudentDetail) => void;
}

export const MenteeDetailForMentor: React.FC<MenteeDetailForMentorProps> = ({
  mentee,
  mentor,
  onBack,
  onOpenAddRec,
  onOpenAddTask,
  onStartSessionWithMentee,
}) => {
  const { state, updateTaskStatus } = useCareerStore();
  const menteeNotes = state.sessionNotes.filter(
    (n) => n.studentId === mentee.id && n.counselorId === mentor.id
  );
  const menteeRecs = state.recommendations.filter(
    (r) => r.studentId === mentee.id && r.counselorId === mentor.id
  );
  const menteeTasks = state.followUpTasks.filter(
    (t) => t.studentId === mentee.id && t.counselorId === mentor.id
  );
  const menteeAssessments = state.assessments.filter((a) => a.studentId === mentee.id);

  return (
    <div className="space-y-6">
      {/* Top back & actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          &larr; Back to Mentees Cohort
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenAddRec}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            + Assign Recommendation
          </button>
          <button
            type="button"
            onClick={onOpenAddTask}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            + Assign Follow-up Task
          </button>
          <button
            type="button"
            onClick={() => onStartSessionWithMentee(mentee)}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Launch Mentoring Session</span>
          </button>
        </div>
      </div>

      {/* Mentee Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Mentee ID: #{mentee.id.slice(-8).toUpperCase()}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">{mentee.name}</h2>
            <p className="text-xs text-slate-500">
              {mentee.email} &bull; {mentee.phone} &bull; Registered: {mentee.registeredDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Roadmap Progress
              </span>
              <span className="text-xl font-black text-emerald-600">
                {mentee.roadmapProgress || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Academic & Goal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Target Career &amp; Role
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {mentee.careerGoal || mentee.detail}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Education &amp; Background
            </span>
            <span className="font-bold text-slate-800 block">
              {mentee.academicInfo?.schoolOrCollege || mentee.institutionOrCompany || 'Independent'}
            </span>
            <span className="text-slate-500 text-[11px]">
              {mentee.academicInfo?.degreeOrGrade || mentee.professionLabel || mentee.profession}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Mentoring Stats
            </span>
            <div className="space-y-0.5 text-[11px] text-slate-600">
              <div>
                Completed Sessions: <strong>{menteeNotes.length}</strong>
              </div>
              <div>
                Pending Tasks: <strong>{menteeTasks.filter((t) => t.status === 'pending').length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Assessments & Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Technical Assessment Results ({menteeAssessments.length})</span>
          </h3>
          {menteeAssessments.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              Mentee has not completed their assessment battery yet.
            </p>
          ) : (
            menteeAssessments.map((asm) => (
              <div key={asm.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">{asm.assessmentName}</span>
                  <span className="font-black text-emerald-600">{asm.scorePercent}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Strengths:</span>
                  <span className="text-slate-700">{asm.strengths.join(', ')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Suggested Domains:</span>
                  <span className="text-slate-700">{asm.careerAreasSuggested.join(', ')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Roadmap Milestones */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Placement Roadmap Progress</span>
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Track: {mentor.domain}</span>
              <span className="font-black text-emerald-600">{mentee.roadmapProgress || 0}% Complete</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${mentee.roadmapProgress || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Active Plan: <strong>{mentee.planName || 'Tech Mentorship Track'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Session Notes, Recommendations & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Notes */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Documented Notes ({menteeNotes.length})</span>
          </h3>
          {menteeNotes.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No session notes yet.</p>
          ) : (
            <div className="space-y-3">
              {menteeNotes.map((note) => (
                <div key={note.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{note.sessionDate}</span>
                    {note.followUpDate && <span>Follow-up: {note.followUpDate}</span>}
                  </div>
                  <h4 className="font-bold text-slate-900">{note.counselingTopic}</h4>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{note.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Recommendations ({menteeRecs.length})</span>
          </h3>
          {menteeRecs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No recommendations yet.</p>
          ) : (
            <div className="space-y-3">
              {menteeRecs.map((rec) => (
                <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {rec.category}
                  </span>
                  <h4 className="font-bold text-slate-900">{rec.title}</h4>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{rec.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Follow-up Tasks */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-emerald-600" />
            <span>Follow-up Tasks ({menteeTasks.length})</span>
          </h3>
          {menteeTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No tasks assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {menteeTasks.map((task) => (
                <div key={task.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">{task.title}</h4>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Due: {task.dueDate}</span>
                    <select
                      value={task.status}
                      onChange={(e) =>
                        updateTaskStatus(
                          task.id,
                          e.target.value as 'pending' | 'in_progress' | 'completed'
                        )
                      }
                      className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-white cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
