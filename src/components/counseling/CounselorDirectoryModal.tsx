import React, { useState } from 'react';
import {
  X,
  User,
  Clock,
  CheckCircle2,
  Languages,
  ArrowRight,
  Filter,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Counselor } from '../../types/counselor';
import { useCareerStore } from '../../hooks/useCareerStore';
import { StudentProfile } from '../../types';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** Why a day can't be booked with this person, or null when it can. */
function unavailableReason(c: Counselor, iso: string) {
  if (!iso) return 'Please choose a preferred date for the session.';
  if (iso < isoDay(new Date())) return 'Please choose a date from today onwards.';
  if (c.blockedDates?.includes(iso)) return `${c.name.split(' ')[0]} is away on that day. Please pick another date.`;
  const day = WEEKDAYS[localDate(iso).getDay()];
  if (c.availabilityDays.length && !c.availabilityDays.includes(day)) return `${c.name.split(' ')[0]} takes sessions on ${c.availabilityDays.join(', ')}.`;
  return null;
}

/** The next few days this person takes sessions. */
function nextOpenDays(c: Counselor, count = 6) {
  const out: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  for (let i = 0; i < 60 && out.length < count; i++, d.setDate(d.getDate() + 1)) {
    const iso = isoDay(d);
    if (!unavailableReason(c, iso)) out.push(iso);
  }
  return out;
}

interface CounselorDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: StudentProfile | null;
  studentProfile?: StudentProfile | null;
  initialCounselorId?: string;
  onBookSuccess?: (app: any) => void;
}

export const CounselorDirectoryModal: React.FC<CounselorDirectoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  studentProfile,
  initialCounselorId,
  onBookSuccess,
}) => {
  const activeUser = currentUser || studentProfile;
  const { state, createCounselingRequest } = useCareerStore();
  // Industry mentors are bookable too; present them with the same card fields.
  const approvedCounselors: Counselor[] = [
    ...state.counselors.filter((c) => c.approvalStatus === 'approved'),
    ...state.mentors
      .filter((m) => m.approvalStatus === 'approved')
      .map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        qualification: [m.role, m.company].filter(Boolean).join(', ') || 'Industry mentor',
        experienceYears: m.experienceYears,
        specializations: [m.domain || 'Industry Mentorship'],
        areasOfExpertise: [m.domain, m.role].filter(Boolean) as string[],
        languages: ['English'],
        bio: m.bio,
        avatarUrl: m.avatarUrl,
        approvalStatus: m.approvalStatus,
        registeredDate: m.registeredDate,
        sessionDuration: m.sessionDuration || '45 mins',
        availabilityDays: m.availabilityDays?.length ? m.availabilityDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        availableTimeSlots: m.availableTimeSlots,
        blockedDates: m.blockedDates,
      })),
  ];

  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [isBookingStep, setIsBookingStep] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');

  // Booking form state
  const [counselingType, setCounselingType] = useState('Career Exploration');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [topicNotes, setTopicNotes] = useState('');
  const [studentName, setStudentName] = useState(activeUser?.name || '');
  const [studentEmail, setStudentEmail] = useState(activeUser?.email || '');
  const [studentPhone, setStudentPhone] = useState(activeUser?.phone || '+91 ');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync initial counselor or current user
  React.useEffect(() => {
    if (isOpen) {
      if (initialCounselorId) {
        const found = approvedCounselors.find((c) => c.id === initialCounselorId);
        if (found) {
          setSelectedCounselor(found);
          setSelectedTime(found.availableTimeSlots[0] || '10:00 AM');
          setSelectedDate(nextOpenDays(found, 1)[0] || '');
          setIsBookingStep(true);
        }
      }
      if (activeUser) {
        setStudentName(activeUser.name);
        setStudentEmail(activeUser.email);
        setStudentPhone(activeUser.phone);
      }
      setBookingSuccess(false);
      setFormError('');
    }
  }, [isOpen, initialCounselorId, activeUser]);

  if (!isOpen) return null;

  // Filtered counselors
  const filteredCounselors = approvedCounselors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specializations.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.areasOfExpertise.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSpec =
      selectedSpecialization === 'all' ||
      c.specializations.includes(selectedSpecialization);
    return matchesSearch && matchesSpec;
  });

  const allSpecializations = Array.from(
    new Set(approvedCounselors.flatMap((c) => c.specializations))
  );

  const counselingTypeOptions = [
    'Career Exploration',
    'Career Planning',
    'Academic & Career Guidance',
    'Career Roadmap Review',
    'Higher Education Guidance',
    'Career Transition Guidance',
  ];

  const handleStartBooking = (counselor: Counselor) => {
    setSelectedCounselor(counselor);
    setSelectedTime(counselor.availableTimeSlots[0] || '10:00 AM');
    // Default to the next day they take sessions
    setSelectedDate(nextOpenDays(counselor, 1)[0] || '');
    setIsBookingStep(true);
    setFormError('');
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounselor) return;
    if (!studentName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!studentEmail.trim() || !studentEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!studentPhone.trim() || studentPhone.length < 8) {
      setFormError('Please enter your phone number.');
      return;
    }
    const dateProblem = unavailableReason(selectedCounselor, selectedDate);
    if (dateProblem) {
      setFormError(dateProblem);
      return;
    }
    if (!selectedTime) {
      setFormError('Please choose an available time slot.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const createdReq = await createCounselingRequest({
        studentId: activeUser?.id || '',
        studentName: studentName.trim(),
        studentEmail: studentEmail.trim(),
        studentPhone: studentPhone.trim(),
        counselorId: selectedCounselor.id,
        counselorName: selectedCounselor.name,
        topic: topicNotes.trim() || `${counselingType} Consultation`,
        counselingType,
        preferredDate: localDate(selectedDate).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        preferredTime: selectedTime,
        notes: topicNotes.trim(),
      });
      if (onBookSuccess) {
        onBookSuccess(createdReq);
      }
      setBookingSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not send your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAll = () => {
    setSelectedCounselor(null);
    setIsBookingStep(false);
    setBookingSuccess(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto"
      onClick={handleCloseAll}
    >
      <div
        className="bg-white text-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                {bookingSuccess
                  ? 'Counseling Request Submitted'
                  : isBookingStep
                  ? `Book Session with ${selectedCounselor?.name}`
                  : 'MaxiCareer Certified Career Counselors'}
              </h2>
              <p className="text-xs text-slate-400">
                {isBookingStep
                  ? 'Personalized 1-on-1 strategy & roadmap advisory'
                  : 'Accredited guidance specialists for school, college & professional tracks'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseAll}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {bookingSuccess ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="py-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Request Sent Successfully!
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your 1:1 counseling request has been assigned to{' '}
                <strong className="text-slate-900">{selectedCounselor?.name}</strong>. The counselor
                will review your request and confirm the appointment time.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Counselor:</span>
                  <span className="font-bold text-slate-900">{selectedCounselor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Topic:</span>
                  <span className="font-bold text-slate-900">{counselingType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Schedule:</span>
                  <span className="font-bold text-slate-900">
                    {selectedDate} at {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Contact:</span>
                  <span className="font-bold text-slate-900">{studentEmail}</span>
                </div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : isBookingStep && selectedCounselor ? (
            /* BOOKING FLOW FORM */
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookingStep(false)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer"
                >
                  &larr; Back to Counselor Directory
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Session Duration:</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedCounselor.sessionDuration}
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-5">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {formError}
                  </div>
                )}

                {/* Selected Counselor Preview */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <img
                    src={selectedCounselor.avatarUrl}
                    alt={selectedCounselor.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                  />
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{selectedCounselor.name}</h4>
                    <p className="text-xs text-slate-600">{selectedCounselor.qualification}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-blue-700">
                        {selectedCounselor.experienceYears}+ Years Exp
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-500">
                        {selectedCounselor.languages.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 1: Select Counseling Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    1. Select Counseling Focus
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {counselingTypeOptions.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCounselingType(type)}
                        className={`p-3 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                          counselingType === type
                            ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Date & Available Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      2. Preferred Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={isoDay(new Date())}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Available days: {selectedCounselor.availabilityDays.join(', ')}
                    </p>
                    {selectedDate && unavailableReason(selectedCounselor, selectedDate) && (
                      <p className="text-[11px] font-semibold text-amber-700 mt-1">{unavailableReason(selectedCounselor, selectedDate)}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {nextOpenDays(selectedCounselor).map((iso) => (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => setSelectedDate(iso)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            selectedDate === iso ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {localDate(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      3. Available Time Slot
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCounselor.availableTimeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            selectedTime === slot
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 3: Student Details */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    4. Your Contact Details
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Full Name *
                      </span>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Email Address *
                      </span>
                      <input
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Phone / WhatsApp *
                      </span>
                      <input
                        type="tel"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="+91 "
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Specific Topic / Goal */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    5. What specific guidance or career goal do you want to discuss?
                  </label>
                  <textarea
                    value={topicNotes}
                    onChange={(e) => setTopicNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Seeking advice on transitioning from college to tech product manager roles, resume review, or competitive exams..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBookingStep(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{submitting ? 'Sending…' : 'Confirm Booking Request'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* COUNSELOR DIRECTORY LIST */
            <div className="space-y-6">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-4 border-b border-slate-100">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, expertise, or track..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                {allSpecializations.length > 0 && (
                  <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <select
                      value={selectedSpecialization}
                      onChange={(e) => setSelectedSpecialization(e.target.value)}
                      className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Specializations</option>
                      {allSpecializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Counselor Cards or Empty State */}
              {filteredCounselors.length === 0 ? (
                <div className="py-14 text-center max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <User className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    No counselors are currently available.
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {approvedCounselors.length === 0
                      ? 'No accredited counselors have registered and been approved yet in this environment. Career guidance specialists can register via the MaxiCareer Internal Portal.'
                      : 'No counselors matched your search criteria. Try removing some filters.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredCounselors.map((counselor) => (
                    <div
                      key={counselor.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3.5">
                          <img
                            src={counselor.avatarUrl}
                            alt={counselor.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-2xs flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-base font-bold text-slate-900">{counselor.name}</h3>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3" />
                                Verified
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-1">{counselor.qualification}</p>
                            <p className="text-xs font-semibold text-blue-600 mt-0.5">
                              {counselor.experienceYears}+ Years Practical Experience
                            </p>
                          </div>
                        </div>

                        {/* Bio */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {counselor.bio}
                        </p>

                        {/* Specializations Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          {counselor.specializations.slice(0, 3).map((spec) => (
                            <span
                              key={spec}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700"
                            >
                              {spec}
                            </span>
                          ))}
                          {counselor.specializations.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-500">
                              +{counselor.specializations.length - 3} more
                            </span>
                          )}
                        </div>

                        {/* Languages & Slots summary */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Languages className="w-3.5 h-3.5 text-slate-400" />
                            <span>{counselor.languages.join(', ')}</span>
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{counselor.sessionDuration} session</span>
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => handleStartBooking(counselor)}
                        className="mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <span>Book 1:1 Counseling Session</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
