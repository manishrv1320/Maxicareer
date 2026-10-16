import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Counselor } from '../../types/counselor';
import { useCareerStore } from '../../hooks/useCareerStore';
import { platformStore } from '../../services/careerPlatformStore';

interface CounselorAuthProps {
  onLoginSuccess: (counselor: Counselor) => void;
  onBackToPortal: () => void;
}

export const CounselorAuth: React.FC<CounselorAuthProps> = ({
  onLoginSuccess,
  onBackToPortal,
}) => {
  const { state, registerCounselor, login } = useCareerStore();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginNotice, setLoginNotice] = useState<string | null>(null);

  // Registration form state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '+91 ',
    password: '',
    confirmPassword: '',
    qualification: '',
    experienceYears: 5,
    specializations: ['Career Planning', 'Higher Education Guidance'],
    areasOfExpertiseText: 'Aptitude Mapping, Resume Advisory, B-School Strategy',
    languagesText: 'English, Hindi',
    bio: '',
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    sessionDuration: '45 mins',
  });
  const [regError, setRegError] = useState('');
  const [registrationSubmitted, setRegistrationSubmitted] = useState<Counselor | null>(null);

  const specializationOptions = [
    'Career Planning',
    'Career Exploration',
    'Higher Education Guidance',
    'Technology Careers',
    'Management Careers',
    'Aptitude and Interest Guidance',
    'Career Transition',
    'Study Abroad Guidance',
  ];

  const handleToggleSpec = (spec: string) => {
    setRegData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  // Counselor Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginNotice(null);

    if (!loginEmail.trim()) {
      setLoginError('Please enter your professional email.');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword, 'counselor');
      const me = platformStore.getActiveCounselor();
      if (me) onLoginSuccess(me);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      if (/pending/i.test(message)) setLoginNotice(message);
      else setLoginError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Demo Login Fill
  const handleQuickDemoCounselor = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('password123');
    setLoginError('');
    setLoginNotice(null);
  };

  // Counselor Registration Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regData.name.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regData.email.trim() || !regData.email.includes('@')) {
      setRegError('Please enter a valid professional email address.');
      return;
    }
    if (!regData.phone.trim() || regData.phone.length < 8) {
      setRegError('Please enter a valid phone number.');
      return;
    }
    if (!regData.password || regData.password.length < 8) {
      setRegError('Password must be at least 8 characters long.');
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (!regData.qualification.trim()) {
      setRegError('Please state your highest relevant academic or counseling qualification.');
      return;
    }
    if (regData.specializations.length === 0) {
      setRegError('Please select at least one counseling specialization.');
      return;
    }
    if (!regData.bio.trim()) {
      setRegError('Please provide a brief professional biography.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await registerCounselor({
        name: regData.name.trim(),
        email: regData.email.trim(),
        phone: regData.phone.trim(),
        password: regData.password,
        qualification: regData.qualification.trim(),
        experienceYears: Number(regData.experienceYears) || 1,
        specializations: regData.specializations,
        areasOfExpertise: regData.areasOfExpertiseText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        languages: regData.languagesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        bio: regData.bio.trim(),
        avatarUrl: regData.avatarUrl,
        sessionDuration: regData.sessionDuration,
        availabilityDays: ['Monday', 'Wednesday', 'Friday'],
        availableTimeSlots: ['10:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'],
      });

      setRegistrationSubmitted(created);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <button
        type="button"
        onClick={onBackToPortal}
        className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mb-6 transition-colors cursor-pointer"
      >
        &larr; Back to Role Selection
      </button>

      {registrationSubmitted ? (
        /* SUCCESSFUL REGISTRATION SCREEN (PENDING VERIFICATION) */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 mb-2">
              Status: Pending Verification
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Counselor Account Created Successfully
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Thank you for registering, <strong className="text-slate-900">{registrationSubmitted.name}</strong>.
              Your professional credentials and qualification details have been submitted for admin
              review.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-2.5 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-500">Registered Email:</span>
              <span className="font-bold text-slate-900">{registrationSubmitted.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Qualification:</span>
              <span className="font-bold text-slate-900">{registrationSubmitted.qualification}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Experience:</span>
              <span className="font-bold text-slate-900">
                {registrationSubmitted.experienceYears} Years
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Specializations:</span>
              <span className="font-bold text-slate-900 text-right">
                {registrationSubmitted.specializations.join(', ')}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Once approved by the Maxicareer administration, your profile will be published in the
            public counselor directory, and you will receive full access to the Counselor Workspace.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setRegistrationSubmitted(null);
                setMode('login');
              }}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all cursor-pointer"
            >
              Proceed to Sign In
            </button>
            <button
              type="button"
              onClick={onBackToPortal}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Return to Portal Home
            </button>
          </div>
        </div>
      ) : mode === 'login' ? (
        /* COUNSELOR SIGN IN */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Counselor Authentication</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Sign In to Counselor Workspace</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your verified counselor credentials to manage your assigned students and sessions.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {loginNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2 mb-4">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{loginNotice}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Professional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="counselor@maxicareer.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{submitting ? 'Signing in…' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Counselor Logins */}
          {state.environment === 'demo' && state.counselors.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Sample counselor accounts (password: password123):
              </span>
              <div className="flex flex-wrap gap-2">
                {state.counselors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleQuickDemoCounselor(c.email)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>{c.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        c.approvalStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {c.approvalStatus}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Switch to Register */}
          <div className="mt-6 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
            <span>Don't have a counselor account? </span>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLoginError('');
                setLoginNotice(null);
              }}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Create Counselor Account
            </button>
          </div>
        </div>
      ) : (
        /* COUNSELOR REGISTRATION (SIGN UP) */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Professional Registration</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Create Counselor Account</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Join the Maxicareer certified counseling network. All registrations undergo
              administrative verification.
            </p>
          </div>

          {regError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{regError}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            {/* Row 1: Name, Email, Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  placeholder="e.g. Dr. Ananya Sen"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Professional Email *
                </label>
                <input
                  type="email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="you@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  placeholder="+91 "
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Row 2: Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Create Password * (min 8 chars)
                </label>
                <input
                  type="password"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={regData.confirmPassword}
                  onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Row 3: Qualification & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Qualification &amp; Certifications *
                </label>
                <input
                  type="text"
                  value={regData.qualification}
                  onChange={(e) => setRegData({ ...regData, qualification: e.target.value })}
                  placeholder="e.g. M.A. Counseling Psychology, Certified Career Facilitator"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min={1}
                  max={45}
                  value={regData.experienceYears}
                  onChange={(e) =>
                    setRegData({ ...regData, experienceYears: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Specializations Checkboxes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Counseling Specializations (Select all that apply) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {specializationOptions.map((spec) => {
                  const isChecked = regData.specializations.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleToggleSpec(spec)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{spec}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Areas of Expertise & Languages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Areas of Expertise (Comma-separated)
                </label>
                <input
                  type="text"
                  value={regData.areasOfExpertiseText}
                  onChange={(e) => setRegData({ ...regData, areasOfExpertiseText: e.target.value })}
                  placeholder="e.g. SDE Placement, Aptitude Mapping, B-School SOPs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Languages Spoken (Comma-separated)
                </label>
                <input
                  type="text"
                  value={regData.languagesText}
                  onChange={(e) => setRegData({ ...regData, languagesText: e.target.value })}
                  placeholder="e.g. English, Hindi, Tamil"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Professional Bio *
              </label>
              <textarea
                value={regData.bio}
                onChange={(e) => setRegData({ ...regData, bio: e.target.value })}
                rows={3}
                placeholder="Briefly describe your counseling philosophy, mentoring approach, and student cohort experience..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Already have an account? Sign In
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{submitting ? 'Submitting…' : 'Submit Counselor Registration'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
