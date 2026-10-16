import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Briefcase,
  BookOpen,
  UserCheck,
  CheckCircle2,
  Mail,
  MessageCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Phone,
  MapPin,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfession, StudentProfile } from '../types';
import {
  OFFICIAL_PHONE,
  OFFICIAL_PHONE_DIGITS,
  OFFICIAL_EMAIL,
  DEMO_STUDENT_PROFILES,
} from '../data/portalData';
import { apiSend } from '../lib/api';

export interface CourseProgramConfig {
  id: string;
  profession: UserProfession;
  cohortBadge: string;
  name: string;
  tagline: string;
  features: string[];
  support: string;
  duration: string;
}

export const COURSE_PROGRAMS_DATA: CourseProgramConfig[] = [
  {
    id: 'program-working-professionals',
    profession: 'working_professional',
    cohortBadge: 'Working Professionals',
    name: 'Step-Up career program',
    tagline: 'Career Transition, Go Next!',
    features: [
      'Find Your Career Path',
      'Resume',
      'LinkedIn Optimization',
      'Cover Letter',
      'Interview Preparation',
      'Networking with Industry Experts',
    ],
    support: 'Fast-Track Support',
    duration: '2 weeks to 3 months',
  },
  {
    id: 'program-freshers-psw',
    profession: 'fresher',
    cohortBadge: 'Freshers / PSW',
    name: 'Step-In career program',
    tagline: 'Understand Your Career, Get Your Job!',
    features: [
      'Find Your Career Path',
      'Resume',
      'LinkedIn Optimization',
      'Cover Letter',
      'Interview Preparation',
      'Networking with Industry Experts',
    ],
    support: 'Fast-Track Support',
    duration: '2 weeks to 3 months',
  },
  {
    id: 'program-college-students',
    profession: 'college',
    cohortBadge: 'College Students',
    name: 'Step-Next career program',
    tagline: 'Plan Ahead, Step into Success!',
    features: [
      'Internship Guidance',
      'How to approach universities?',
      'Networking',
      'Resume',
      'Cover Letter',
      'Interview Preparation',
      'Networking with Industry Experts',
    ],
    support: 'Long-Term Career Coaching',
    duration: '1 month to 1 year',
  },
  {
    id: 'program-school-students',
    profession: 'school',
    cohortBadge: 'School Students',
    name: 'Step-Ready career program',
    tagline: 'Discover Your Path, Be Future-Ready!',
    features: [
      'What to choose next?',
      'Study abroad guidance',
      'How to approach exams',
      'Time management',
    ],
    support: 'Long-Term Career Coaching',
    duration: '1 month to 1 year',
  },
];

interface CourseRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfession?: UserProfession;
  initialProgramName?: string;
  currentUserProfile?: StudentProfile | null;
  onRegistrationSuccess?: (profile: StudentProfile) => void;
  onOpenDashboard?: () => void;
}

export const CourseRegistrationModal: React.FC<CourseRegistrationModalProps> = ({
  isOpen,
  onClose,
  initialProfession = 'college',
  initialProgramName,
  currentUserProfile,
  onRegistrationSuccess,
  onOpenDashboard,
}) => {
  const [selectedProfession, setSelectedProfession] = useState<UserProfession>(initialProfession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [city, setCity] = useState('');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'email'>('whatsapp');
  const [notes, setNotes] = useState('');

  // Cohort-specific details
  const [institutionOrCompany, setInstitutionOrCompany] = useState('');
  const [currentRoleOrYear, setCurrentRoleOrYear] = useState('');
  const [targetGoal, setTargetGoal] = useState('');

  // Selected features of interest (multi-select)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Registered result for WhatsApp / Email direct action
  const [submittedStudent, setSubmittedStudent] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    programName: string;
    profession: UserProfession;
    institutionOrCompany: string;
    goal: string;
  } | null>(null);

  // Sync initial state
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setSubmitError(null);
      setSelectedProfession(initialProfession);

      if (currentUserProfile) {
        setName(currentUserProfile.name || '');
        setEmail(currentUserProfile.email || '');
        setPhone(currentUserProfile.phone || '+91 ');
        setCity(currentUserProfile.city || '');
        setInstitutionOrCompany(currentUserProfile.institutionOrCompany || '');
      } else {
        if (!phone || phone === '+91 ') setPhone('+91 ');
      }

      // Pre-select features for the active program
      const currentProg =
        COURSE_PROGRAMS_DATA.find(
          (p) =>
            p.profession === initialProfession ||
            (initialProgramName && p.name.toLowerCase().includes(initialProgramName.toLowerCase()))
        ) || COURSE_PROGRAMS_DATA[2];

      setSelectedFeatures(currentProg.features.slice(0, 4));
    }
  }, [isOpen, initialProfession, initialProgramName, currentUserProfile]);

  const activeProgram =
    COURSE_PROGRAMS_DATA.find((p) => p.profession === selectedProfession) ||
    COURSE_PROGRAMS_DATA[2];

  const handleProfessionChange = (prof: UserProfession) => {
    setSelectedProfession(prof);
    const prog = COURSE_PROGRAMS_DATA.find((p) => p.profession === prof);
    if (prog) {
      setSelectedFeatures(prog.features.slice(0, 4));
    }
  };

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.trim() === '+91') {
      setSubmitError('Please provide your WhatsApp phone number.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const fullDetail = [
      currentRoleOrYear ? `Current Level: ${currentRoleOrYear}` : '',
      targetGoal ? `Target Goal: ${targetGoal}` : '',
      selectedFeatures.length > 0 ? `Focus Areas: ${selectedFeatures.join(', ')}` : '',
      notes ? `Notes: ${notes}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      city: city.trim() || 'India',
      profession: selectedProfession,
      professionLabel: activeProgram.cohortBadge,
      institutionOrCompany: institutionOrCompany.trim() || 'Not specified',
      detail: fullDetail || `${activeProgram.name} Consultation & Mentorship`,
      planName: `${activeProgram.name} (${activeProgram.cohortBadge})`,
      planPrice: 0, // No prices per strict user instruction
      selectedAddOns: selectedFeatures,
      status: 'pending',
      mentorAssigned: 'Unassigned',
      notes: notes.trim() || 'Registered for mentorship via Maxicareer website.',
      academicDetails: {
        institutionOrCompany: institutionOrCompany.trim(),
        currentLevel: currentRoleOrYear.trim(),
        targetGoal: targetGoal.trim(),
        supportType: activeProgram.support,
        duration: activeProgram.duration,
        preferredContact,
      },
      source: 'portal_registration',
    };

    try {
      const data = await apiSend<{ data?: { id: string } }>('/api/students', payload);

      const profile: StudentProfile = {
        id: currentUserProfile?.id || data?.data?.id || `student-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        city: payload.city,
        profession: selectedProfession,
        professionLabel: activeProgram.cohortBadge,
        institutionOrCompany: payload.institutionOrCompany,
        detail: fullDetail,
        planName: activeProgram.name,
        planPrice: 0,
        registeredDate: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        roadmapProgress: 20,
        authProvider: currentUserProfile?.authProvider || 'email',
      };

      setSubmittedStudent({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        city: profile.city || 'India',
        programName: activeProgram.name,
        profession: selectedProfession,
        institutionOrCompany: payload.institutionOrCompany,
        goal: targetGoal || '1:1 Career Mentorship',
      });

      // A signed-in student stays signed in; guests are not logged in by enquiring.
      if (onRegistrationSuccess && currentUserProfile) {
        onRegistrationSuccess(currentUserProfile);
      }

      setIsSuccess(true);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate direct WhatsApp link for this student
  const getWhatsAppLink = () => {
    if (!submittedStudent) return `https://wa.me/${OFFICIAL_PHONE_DIGITS}`;
    const text = `*Maxicareer Mentorship Course Registration* 🎓\n--------------------------------\n*Student Name:* ${submittedStudent.name}\n*Program:* ${submittedStudent.programName}\n*Category:* ${activeProgram.cohortBadge}\n*Phone:* ${submittedStudent.phone}\n*Email:* ${submittedStudent.email}\n*City:* ${submittedStudent.city}\n*Institution/Company:* ${submittedStudent.institutionOrCompany || 'N/A'}\n*Target Goal:* ${submittedStudent.goal || 'Career Mentorship'}\n--------------------------------\nHello Maxicareer Mentorship Team, I have just registered for the *${submittedStudent.programName}*! Please confirm my course enrollment and schedule my initial consultation session.`;
    return `https://wa.me/${OFFICIAL_PHONE_DIGITS}?text=${encodeURIComponent(text)}`;
  };

  // Generate direct Email mailto link
  const getEmailLink = () => {
    if (!submittedStudent) return `mailto:${OFFICIAL_EMAIL}`;
    const subject = `Course Registration: ${submittedStudent.name} - ${submittedStudent.programName}`;
    const body = `Dear Maxicareer Mentorship Team,\n\nI have registered for the ${submittedStudent.programName} on your website.\n\nStudent Registration Details:\n- Name: ${submittedStudent.name}\n- Email: ${submittedStudent.email}\n- Phone: ${submittedStudent.phone}\n- Category: ${activeProgram.cohortBadge}\n- Institution / Company: ${submittedStudent.institutionOrCompany}\n- Career Goal: ${submittedStudent.goal}\n\nPlease verify my registration and schedule my 1:1 mentor onboarding session.\n\nThank you,\n${submittedStudent.name}`;
    return `mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSuccess ? (
            <div>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold mb-3 border border-white/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Course &amp; Mentorship Registration</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Enroll in {activeProgram.name}
                </h3>
                <p className="mt-1 text-sm text-blue-100 max-w-lg">
                  {activeProgram.tagline} • Register with your details below and direct it to WhatsApp or Email for instant mentor confirmation.
                </p>

                {/* Cohort Switcher Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
                  {COURSE_PROGRAMS_DATA.map((prog) => {
                    const isSelected = prog.profession === selectedProfession;
                    return (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => handleProfessionChange(prog.profession)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-white text-blue-800 shadow-md scale-[1.02]'
                            : 'bg-white/10 hover:bg-white/20 text-white/90'
                        }`}
                      >
                        <span className="truncate w-full">{prog.cohortBadge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[72vh] overflow-y-auto">
                {/* Program Summary Pill (NO PRICES) */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                      {activeProgram.cohortBadge}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {activeProgram.name}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {activeProgram.support} • {activeProgram.duration}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Free Direct Mentorship Consultation</span>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    {submitError}
                  </div>
                )}

                {/* Primary Student Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Darshani Prachi"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. darshaniprachi@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      WhatsApp Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9789730097"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      City &amp; State <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Bengaluru, Karnataka"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Cohort-Specific Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {selectedProfession === 'school'
                        ? 'School Name'
                        : selectedProfession === 'college'
                        ? 'College / University Name'
                        : selectedProfession === 'fresher'
                        ? 'Highest College / Degree'
                        : 'Current Company / Employer'}
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={institutionOrCompany}
                        onChange={(e) => setInstitutionOrCompany(e.target.value)}
                        placeholder={
                          selectedProfession === 'school'
                            ? 'e.g. DPS Bangalore'
                            : selectedProfession === 'college'
                            ? 'e.g. NIT Surathkal / Anna Univ'
                            : selectedProfession === 'fresher'
                            ? 'e.g. B.Tech CSE Grad 2025'
                            : 'e.g. TCS / Cognizant'
                        }
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {selectedProfession === 'school'
                        ? 'Class & Stream'
                        : selectedProfession === 'college'
                        ? 'Year of Study & Degree'
                        : selectedProfession === 'fresher'
                        ? 'Target Job Role'
                        : 'Current Designation & Years Exp'}
                    </label>
                    <input
                      type="text"
                      value={currentRoleOrYear}
                      onChange={(e) => setCurrentRoleOrYear(e.target.value)}
                      placeholder={
                        selectedProfession === 'school'
                          ? 'e.g. 12th Grade Science (PCM)'
                          : selectedProfession === 'college'
                          ? 'e.g. 3rd Year B.Tech CSE'
                          : selectedProfession === 'fresher'
                          ? 'e.g. SDE-1 / Data Analyst'
                          : 'e.g. Software Engineer (3 Yrs)'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Target Mentorship Goal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Target Goal / Dream Outcome
                  </label>
                  <input
                    type="text"
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value)}
                    placeholder="e.g. Tier-1 Product placement / Study abroad admission / Career pivot to Product Management"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {/* Focus Areas Included in this Course (From User Image) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    What would you like support with? (Check all that apply)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeProgram.features.map((feature) => {
                      const isChecked = selectedFeatures.includes(feature);
                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => toggleFeature(feature)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                            isChecked
                              ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              isChecked
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{feature}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Direct Communication */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Preferred Mode for Direct Mentor Connection
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPreferredContact('whatsapp')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        preferredContact === 'whatsapp'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp (+91 9789730097)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredContact('email')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        preferredContact === 'email'
                          ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Email (contact@maxicareer.com)</span>
                    </button>
                  </div>
                </div>

                {/* Optional Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Any specific question or doubt for your mentor? (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tell us about your timeline, current obstacles, or specific questions..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:flex-1 py-3 px-6 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Course Registration...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Registration &amp; Connect to Mentor</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl font-semibold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Registration Success View with Direct WhatsApp and Email Actions */
            <div className="p-6 sm:p-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Recorded in Maxicareer Student Database
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Registration Successful, {submittedStudent?.name}!
                </h3>
                <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                  You are registered for the{' '}
                  <span className="font-bold text-blue-700">
                    {submittedStudent?.programName}
                  </span>
                  . Your application is now visible in the Maxicareer Admin Portal for course confirmation and mentor assignment.
                </p>
              </div>

              {/* Direct WhatsApp and Email Action Boxes */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Direct Next Steps (Choose Your Preferred Channel):
                </div>

                {/* Direct WhatsApp Button */}
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/40 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div>Direct to WhatsApp (+91 9789730097)</div>
                      <div className="text-[11px] font-normal text-emerald-100">
                        Pre-composed text ready with your registration details
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
                </a>

                {/* Direct Email Button */}
                <a
                  href={getEmailLink()}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/40 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div>Direct to Email (contact@maxicareer.com)</div>
                      <div className="text-[11px] font-normal text-blue-100">
                        Send confirmation request directly to mentor desk
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>

              {/* Dashboard / Close actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {onOpenDashboard && currentUserProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDashboard();
                    }}
                    className="w-full sm:w-auto py-2.5 px-6 rounded-xl font-bold text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    Open Student Dashboard
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto py-2.5 px-6 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
