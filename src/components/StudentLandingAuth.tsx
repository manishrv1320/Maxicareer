import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  UserCheck,
  Mail,
  Lock,
  ArrowRight,
  LogOut,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  User,
  ExternalLink,
} from 'lucide-react';
import { StudentProfile, UserProfession } from '../types';
import { DEMO_STUDENT_PROFILES, OFFICIAL_PHONE } from '../data/portalData';

interface StudentLandingAuthProps {
  userProfile: StudentProfile | null;
  onLoginSuccess: (profile: StudentProfile) => void;
  onLogout: () => void;
  onOpenDashboard: () => void;
  onScrollToCourses: () => void;
}

export const StudentLandingAuth: React.FC<StudentLandingAuthProps> = ({
  userProfile,
  onLoginSuccess,
  onLogout,
  onOpenDashboard,
  onScrollToCourses,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<UserProfession>('college');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('+91 ');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Google Sign-In Handler
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setAuthError(null);

    setTimeout(() => {
      const demoCollege = DEMO_STUDENT_PROFILES.college;
      const googleProfile: StudentProfile = {
        id: `google-user-${Date.now()}`,
        name: 'Darshani Prachi',
        email: 'darshaniprachi@gmail.com',
        phone: OFFICIAL_PHONE,
        profession: selectedCohort,
        professionLabel:
          selectedCohort === 'school'
            ? 'School Student (Senior High)'
            : selectedCohort === 'college'
            ? 'College Student (Undergraduate CSE)'
            : selectedCohort === 'fresher'
            ? 'Fresher / PSW (2025 Grad)'
            : 'Working Professional',
        institutionOrCompany:
          selectedCohort === 'school'
            ? 'Delhi Public School'
            : selectedCohort === 'college'
            ? 'NIT Surathkal / College of Engineering'
            : selectedCohort === 'fresher'
            ? 'Coventry University UK / Delhi University'
            : 'Tata Consultancy Services',
        detail: 'Logged in via Google Authentication',
        planName:
          selectedCohort === 'school'
            ? 'Step-Ready career program'
            : selectedCohort === 'college'
            ? 'Step-Next career program'
            : selectedCohort === 'fresher'
            ? 'Step-In career program'
            : 'Step-Up career program',
        planPrice: 0,
        registeredDate: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        roadmapProgress: 65,
        authProvider: 'google',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };

      setIsLoading(false);
      onLoginSuccess(googleProfile);
    }, 600);
  };

  // Regular Email Sign-In
  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    setTimeout(() => {
      const demo = DEMO_STUDENT_PROFILES[selectedCohort];
      const profile: StudentProfile = {
        ...demo,
        id: `email-user-${Date.now()}`,
        name: email.split('@')[0].replace(/[._]/g, ' ') || demo.name,
        email: email.trim().toLowerCase(),
        authProvider: 'email',
      };

      setIsLoading(false);
      onLoginSuccess(profile);
    }, 500);
  };

  // Quick Register
  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    const profLabelMap: Record<UserProfession, string> = {
      school: 'School Student',
      college: 'College Student',
      fresher: 'Fresher / PSW',
      working_professional: 'Working Professional',
    };

    const planNameMap: Record<UserProfession, string> = {
      school: 'Step-Ready career program (School Students)',
      college: 'Step-Next career program (College Students)',
      fresher: 'Step-In career program (Freshers / PSW)',
      working_professional: 'Step-Up career program (Working Professionals)',
    };

    // Auto-record to database
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName.trim(),
          email: email.trim().toLowerCase(),
          phone: registerPhone.trim(),
          profession: selectedCohort,
          professionLabel: profLabelMap[selectedCohort],
          planName: planNameMap[selectedCohort],
          status: 'pending',
          source: 'portal_registration',
        }),
      });
    } catch {
      // safe fallback
    }

    const newProfile: StudentProfile = {
      id: `reg-${Date.now()}`,
      name: registerName.trim(),
      email: email.trim().toLowerCase(),
      phone: registerPhone.trim(),
      profession: selectedCohort,
      professionLabel: profLabelMap[selectedCohort],
      institutionOrCompany: 'Maxicareer Student Portal',
      detail: `Registered for ${planNameMap[selectedCohort]}`,
      planName: planNameMap[selectedCohort],
      planPrice: 0,
      registeredDate: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      roadmapProgress: 15,
      authProvider: 'email',
    };

    setIsLoading(false);
    onLoginSuccess(newProfile);
  };

  // Quick Demo profile picker
  const handleDemoSelect = (prof: UserProfession) => {
    const demo = DEMO_STUDENT_PROFILES[prof];
    onLoginSuccess(demo);
  };

  return (
    <section id="student-login" className="py-12 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {userProfile ? (
          /* Logged In Student View */
          <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 shadow-xl border border-blue-900/50 relative overflow-hidden">
            {/* Background glowing orbs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/30">
                    {userProfile.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={userProfile.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      userProfile.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {userProfile.professionLabel || 'Student Member'}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                      {userProfile.authProvider === 'google' ? 'Google Account' : 'Email Account'}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Welcome back, {userProfile.name}!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    {userProfile.email} • {userProfile.planName}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="flex-1 sm:flex-initial py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Student Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={onScrollToCourses}
                  className="flex-1 sm:flex-initial py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-slate-100 bg-white/10 hover:bg-white/20 border border-white/15 transition-all flex items-center justify-center gap-2"
                >
                  <span>Register for Courses Below</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="py-3 px-3 rounded-xl font-medium text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Not Logged In: In-Page Login & Register Card */
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-10 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Context & Benefits */}
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Student &amp; Mentee Login Portal</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Sign in to Access Mentorship &amp; Register for Courses
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Join Maxicareer to discover your ideal career trajectory, access tailored learning roadmaps, and submit 1-click registrations for our mentorship programs with direct WhatsApp &amp; Email support.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Instant access to personalized career roadmaps and milestones</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Direct WhatsApp &amp; Email connection with experienced mentors</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>One-click registration for all 4 specialized programs below</span>
                  </div>
                </div>

                {/* Quick Demo Login Pills */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Quick Demo Profiles (Instant 1-Click Access):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoSelect('college')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors flex items-center gap-1.5"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>College: Darshani</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoSelect('school')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>School: Aarav</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoSelect('working_professional')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors flex items-center gap-1.5"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Working Pro: Vikram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoSelect('fresher')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Fresher: Meera</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Google & Email Authentication Card */}
              <div className="lg:col-span-7 bg-slate-50/80 rounded-2xl border border-slate-200 p-6 sm:p-8">
                {/* Mode Switcher Tabs */}
                <div className="flex items-center gap-2 mb-6 p-1 bg-slate-200/70 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'signin'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Student Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'register'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    New Student Register
                  </button>
                </div>

                {/* Cohort Category Selector */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    I am a:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'college', label: 'College Student' },
                        { id: 'school', label: 'School Student' },
                        { id: 'fresher', label: 'Freshers / PSW' },
                        { id: 'working_professional', label: 'Working Pro' },
                      ] as const
                    ).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCohort(c.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all truncate ${
                          selectedCohort === c.id
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Google Sign-In Button */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs hover:shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {/* Official Google SVG Icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-300 w-full" />
                    <span className="bg-slate-50 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                      or with email
                    </span>
                  </div>
                </div>

                {authError && (
                  <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    {authError}
                  </div>
                )}

                {/* Form based on active tab */}
                {activeTab === 'signin' ? (
                  <form onSubmit={handleEmailSignIn} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. student@example.com"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span>Signing In...</span>
                      ) : (
                        <>
                          <span>Sign In to Student Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleQuickRegister} className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          placeholder="e.g. Darshani Prachi"
                          className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. student@example.com"
                          className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        WhatsApp Contact Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="+91 9789730097"
                        className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span>Creating Account...</span>
                      ) : (
                        <>
                          <span>Create Student Account &amp; Proceed</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
