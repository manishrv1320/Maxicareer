import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { CounselorStudentDetail, Mentor } from '../../types/counselor';
import { useCareerStore } from '../../hooks/useCareerStore';

interface MentorMessagesViewProps {
  mentor: Mentor;
  mentees: CounselorStudentDetail[];
}

export const MentorMessagesView: React.FC<MentorMessagesViewProps> = ({
  mentor,
  mentees,
}) => {
  const { state, sendMessage } = useCareerStore();
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(
    mentees[0]?.id || null
  );
  const [messageText, setMessageText] = useState('');

  const selectedMentee =
    mentees.find((m) => m.id === selectedMenteeId) ||
    state.students.find((s) => s.id === selectedMenteeId) ||
    null;

  // Messages in this conversation
  const conversationMessages = state.messages.filter((msg) => {
    if (!selectedMenteeId) return false;
    const isDirect =
      (msg.senderId === mentor.id && msg.recipientId === selectedMenteeId) ||
      (msg.senderId === selectedMenteeId && msg.recipientId === mentor.id);
    return isDirect;
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedMentee) return;
    sendMessage({
      conversationId: `${selectedMentee.id}_${mentor.id}`,
      senderId: mentor.id,
      senderName: mentor.name,
      senderRole: 'mentor',
      recipientId: selectedMentee.id,
      recipientName: selectedMentee.name,
      content: messageText.trim(),
    });
    setMessageText('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">Direct Mentee Messaging</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Communicate with your mentees, answer technical questions, and review placement deliverables.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Left Sidebar: Mentees List */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-white">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Active Mentees ({mentees.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {mentees.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p>No mentees registered yet.</p>
                <p className="text-[11px]">Conversations will appear here once mentees connect.</p>
              </div>
            ) : (
              mentees.map((mentee) => {
                const isSelected = mentee.id === selectedMenteeId;
                const hasUnread = state.messages.some(
                  (m) =>
                    m.senderId === mentee.id &&
                    m.recipientId === mentor.id &&
                    !m.read
                );
                return (
                  <button
                    key={mentee.id}
                    type="button"
                    onClick={() => setSelectedMenteeId(mentee.id)}
                    className={`w-full text-left p-4 transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white border-l-4 border-emerald-600 shadow-xs'
                        : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {mentee.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {mentee.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {mentee.careerGoal || 'Mentee'}
                        </p>
                      </div>
                    </div>
                    {hasUnread && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Panel */}
        <div className="flex-1 flex flex-col bg-slate-50/30">
          {selectedMentee ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedMentee.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    Goal: {selectedMentee.careerGoal || 'Technical Placement'} &bull; {selectedMentee.email}
                  </p>
                </div>
              </div>

              {/* Messages scroll area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[340px] max-h-[460px]">
                {conversationMessages.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-400 space-y-1">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">Start of conversation</p>
                    <p>Send a message to greet {selectedMentee.name} and discuss preparation targets.</p>
                  </div>
                ) : (
                  conversationMessages.map((msg) => {
                    const isMe = msg.senderId === mentor.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-2xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input form */}
              <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message ${selectedMentee.name}...`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-xs text-slate-400 py-20 text-center">
              Select a mentee on the left to start direct messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
