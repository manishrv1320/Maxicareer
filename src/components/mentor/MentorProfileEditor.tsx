import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Mentor } from '../../types/counselor';
import { AvatarUploader } from '../AvatarUploader';

interface MentorProfileEditorProps {
  mentor: Mentor;
  onUpdate: (id: string, updates: Partial<Mentor>) => unknown;
}

export const MentorProfileEditor: React.FC<MentorProfileEditorProps> = ({
  mentor,
  onUpdate,
}) => {
  const [name, setName] = useState(mentor.name);
  const [role, setRole] = useState(mentor.role);
  const [company, setCompany] = useState(mentor.company);
  const [domain, setDomain] = useState(mentor.domain);
  const [experienceYears, setExperienceYears] = useState(mentor.experienceYears);
  const [bio, setBio] = useState(mentor.bio);
  const [slotsText, setSlotsText] = useState(
    mentor.availableTimeSlots ? mentor.availableTimeSlots.join(', ') : '05:00 PM, 07:00 PM, 08:30 PM'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(mentor.id, {
      name: name.trim(),
      role: role.trim(),
      company: company.trim(),
      domain: domain.trim(),
      experienceYears: Number(experienceYears) || 1,
      bio: bio.trim(),
      availableTimeSlots: slotsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-3xl shadow-2xs space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">Industry Mentor Profile Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          These credentials, company affiliation, and availability settings are displayed to mentees across the MaxiCareer portal.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Mentor profile updated successfully!</span>
        </div>
      )}

      <AvatarUploader src={mentor.avatarUrl} name={mentor.name} accent="emerald" onUploaded={(url) => onUpdate(mentor.id, { avatarUrl: url })} />

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Years in Industry
            </label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
              min={1}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Current Company / Organization
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Job Title / Designation
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Primary Mentorship Track &amp; Expertise
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Available Evening Slots (Comma-separated)
          </label>
          <input
            type="text"
            value={slotsText}
            onChange={(e) => setSlotsText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="05:00 PM, 07:00 PM, 08:30 PM"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Professional Biography &amp; Mentoring Focus
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            required
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
        >
          Save Profile Updates
        </button>
      </form>
    </div>
  );
};
