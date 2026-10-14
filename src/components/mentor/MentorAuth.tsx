import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Mentor } from '../../types/counselor';
import { useCareerStore } from '../../hooks/useCareerStore';
import { platformStore } from '../../services/careerPlatformStore';

interface MentorAuthProps {
  onLoginSuccess: (mentor: Mentor) => void;
  onBackToPortal: () => void;
}

export const MentorAuth: React.FC<MentorAuthProps> = ({
  onLoginSuccess,
  onBackToPortal,
}) => {
  const { state, registerMentor, login } = useCareerStore();
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
    company: '',
    role: '',
    domain: 'Software Engineering & Cloud Architecture',
    experienceYears: 6,
    bio: '',
    availableTimeSlots: ['05:00 PM', '07:00 PM', '08:30 PM'],
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  });
  const [regError, setRegError] = useState('');
  const [registrationSubmitted, setRegistrationSubmitted] = useState<Mentor | null>(null);

  const domainOptions = [
    'Software Engineering & Cloud Architecture',
    'Product Management & Tech Strategy',
    'Data Science & Machine Learning',
    'Cybersecurity & Network Defense',
    'DevOps, SRE & Infrastructure',
    'UI/UX Design & Frontend Engineering',
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginNotice(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword, 'mentor');
      const s = platformStore.getState();
      const me = s.mentors.find((m) => m.id === s.activeMentorId);
      if (me) onLoginSuccess(me);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      if (/pending/i.test(message)) setLoginNotice(message);
      else setLoginError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (
      !regData.name.trim() ||
      !regData.email.trim() ||
      !regData.company.trim() ||
      !regData.role.trim() ||
      !regData.bio.trim()
    ) {
      setRegError('Please complete all required fields.');
      return;
    }

    if (regData.password.length < 8) {
      setRegError('Password must be at least 8 characters.');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const newMentor = await registerMentor({
        name: regData.name.trim(),
        email: regData.email.trim(),
        phone: regData.phone.trim(),
        password: regData.password,
        company: regData.company.trim(),
        role: regData.role.trim(),
        domain: regData.domain,
        experienceYears: Number(regData.experienceYears) || 3,
        bio: regData.bio.trim(),
        avatarUrl: regData.avatarUrl,
        availableTimeSlots: regData.availableTimeSlots,
      });

      setRegistrationSubmitted(newMentor);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button
        type="button"
        onClick={onBackToPortal}
        className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mb-6 transition-colors cursor-pointer"
      >
        &larr; Back to Role Selection
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xl">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Industry Mentor Workspace</h2>
            <p className="text-xs text-slate-500">
              Deliver 1:1 technical interview coaching, architecture guidance, and placement roadmaps.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setRegistrationSubmitted(null);
            }}
            className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In to Workspace
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setRegistrationSubmitted(null);
            }}
            className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register as New Mentor
          </button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {loginError}
              </div>
            )}
            {loginNotice && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                {loginNotice}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Professional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. karthik.raman@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {submitting ? 'Signing in…' : 'Sign In to Mentor Workspace'}
            </button>

            {/* Quick Demo Credentials (only while sample data is loaded) */}
            {state.environment === 'demo' && (
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Fast Demo Login
              </span>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('karthik.raman@example.com');
                  setLoginPassword('password123');
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Karthik Raman</span>
                  <span className="text-[11px] text-slate-500">
                    karthik.raman@example.com (Staff SWE @ Google Cloud)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  Use Credentials
                </span>
              </button>
            </div>
            )}
          </form>
        )}

        {/* REGISTRATION FORM */}
        {mode === 'register' && (
          <div>
            {registrationSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Mentor Account Registered!
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Thanks, <strong>{registrationSubmitted.name}</strong>! Your profile is pending verification. An administrator will review it, and you can sign in as soon as it's approved.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationSubmitted(null);
                    setMode('login');
                    setLoginEmail(registrationSubmitted.email);
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer"
                >
                  Back to Sign In &rarr;
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {regError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {regError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={regData.name}
                      onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                      placeholder="e.g. Priya Sundaram"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      placeholder="priya@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Company / Organization *
                    </label>
                    <input
                      type="text"
                      value={regData.company}
                      onChange={(e) => setRegData({ ...regData, company: e.target.value })}
                      placeholder="e.g. Microsoft / Ex-Amazon"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Job Title / Role *
                    </label>
                    <input
                      type="text"
                      value={regData.role}
                      onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                      placeholder="e.g. Senior Principal Architect"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Primary Mentorship Track *
                    </label>
                    <select
                      value={regData.domain}
                      onChange={(e) => setRegData({ ...regData, domain: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {domainOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Years in Industry *
                    </label>
                    <input
                      type="number"
                      value={regData.experienceYears}
                      onChange={(e) =>
                        setRegData({ ...regData, experienceYears: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                      min={1}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Professional Biography &amp; Mentoring Focus *
                  </label>
                  <textarea
                    value={regData.bio}
                    onChange={(e) => setRegData({ ...regData, bio: e.target.value })}
                    rows={3}
                    placeholder="Briefly describe your engineering background and how you guide aspiring candidates through mock interviews and system design..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Set Password *
                    </label>
                    <input
                      type="password"
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      placeholder="Min 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                      onChange={(e) =>
                        setRegData({ ...regData, confirmPassword: e.target.value })
                      }
                      placeholder="Repeat password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {submitting ? 'Submitting…' : 'Complete Mentor Registration'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
