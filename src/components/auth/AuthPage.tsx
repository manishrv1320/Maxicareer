import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { BrandLogo } from '../BrandLogo';
import { Button, Field, Input, Select, Segmented, cx } from '../admin/ui';
import { apiSend, auth, SampleLogin, SessionUser } from '../../lib/api';

/**
 * One sign-in and sign-up page for every dashboard. After signing in, the server says
 * where the account belongs (student portal, counsellor/mentor workspace or admin portal).
 */

type Mode = 'signin' | 'signup';
type SignupRole = 'student' | 'counselor' | 'mentor';

const ROLE_LABEL: Record<string, string> = {
  student: 'Student',
  counselor: 'Counsellor',
  mentor: 'Mentor',
  staff: 'Maxicareer staff',
};

const DESTINATION: Record<string, string> = {
  '/?portal=student': 'student portal',
  '/portal': 'workspace',
  '/admin': 'admin portal',
};

const COHORTS = [
  { value: 'school', label: 'School student (Class 9–12)' },
  { value: 'college', label: 'College student' },
  { value: 'fresher', label: 'Fresher / PSW graduate' },
  { value: 'working_professional', label: 'Working professional' },
];

const list = (v: string) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const go = (home?: string) => window.location.assign(home || '/');

const ErrorBox: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div className="flex items-start gap-2 rounded-[10px] bg-[#FCEBEC] px-3.5 py-3 text-[13.5px] text-[#B42F3B]" role="alert">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      {message}
    </div>
  ) : null;

const PasswordInput: React.FC<{ value: string; onChange: (v: string) => void; autoComplete: string; id?: string }> = ({ value, onChange, autoComplete, id }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 pr-10" />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A869E] hover:text-[#0D1B3E]" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Sign in                                                             */
/* ------------------------------------------------------------------ */

const SignInForm: React.FC<{ samples?: SampleLogin[] }> = ({ samples }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeStep, setCodeStep] = useState<'off' | 'email' | 'code' | 'forgot' | 'forgot-sent'>(() =>
    new URLSearchParams(window.location.search).has('forgot') ? 'forgot' : 'off'
  );
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<string | null>(null);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Enter your email.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    try {
      const res = await auth.login(email.trim().toLowerCase(), password, 'auto');
      go(res.home);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
      setBusy(false);
    }
  };

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Enter your email.');
    setBusy(true);
    try {
      const res = await auth.requestCode(email.trim().toLowerCase());
      setInfo(res.devCode ? `${res.message} (Development mode: your code is ${res.devCode}.)` : res.message);
      setCodeStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a code.');
    } finally {
      setBusy(false);
    }
  };

  const sendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Enter the email you sign in with.');
    setBusy(true);
    try {
      const res = await auth.forgotPassword(email.trim().toLowerCase());
      setInfo(res.message);
      setCodeStep('forgot-sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset link.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await auth.verifyCode(email.trim().toLowerCase(), code.trim());
      go(res.home);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code did not work.');
      setBusy(false);
    }
  };

  const groups = useMemo(() => {
    const out: Record<string, SampleLogin[]> = {};
    (samples || []).forEach((s) => (out[s.role] = [...(out[s.role] || []), s]));
    return Object.entries(out);
  }, [samples]);

  const backToSignIn = () => {
    setCodeStep('off');
    setError(null);
    setInfo(null);
    if (window.location.search.includes('forgot')) window.history.replaceState(null, '', '/login');
  };

  if (codeStep === 'forgot' || codeStep === 'forgot-sent') {
    return (
      <div className="space-y-4">
        <ErrorBox message={error} />
        {codeStep === 'forgot' ? (
          <form onSubmit={sendResetLink} className="space-y-4">
            <p className="text-[13.5px] text-[#5B6885]">Enter the email you sign in with and we'll send you a link to choose a new password.</p>
            <Field label="Email">
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" autoFocus />
            </Field>
            <Button type="submit" variant="primary" icon={Mail} className="w-full h-11" disabled={busy}>
              {busy ? 'Sending…' : 'Email me a reset link'}
            </Button>
          </form>
        ) : (
          <div className="rounded-[12px] bg-[#E3F6EE] px-4 py-4 text-[13.5px] text-[#0B7A55] space-y-1.5" role="status">
            <p className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Check your inbox
            </p>
            <p>{info}</p>
            <p className="text-[#33415F]">
              Not there after a few minutes? Check your spam folder, or{' '}
              <button type="button" onClick={() => setCodeStep('forgot')} className="font-semibold text-[#2563EB] hover:underline">
                send it again
              </button>
              .
            </p>
          </div>
        )}
        <button type="button" onClick={backToSignIn} className="text-[13px] font-semibold text-[#2563EB] hover:underline">
          ← Back to sign in
        </button>
      </div>
    );
  }

  if (codeStep !== 'off') {
    return (
      <div className="space-y-4">
        <ErrorBox message={error} />
        {codeStep === 'email' ? (
          <form onSubmit={requestCode} className="space-y-4">
            <p className="text-[13.5px] text-[#5B6885]">Students can sign in with a 6-digit code sent to their email, no password needed.</p>
            <Field label="Email">
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" autoFocus />
            </Field>
            <Button type="submit" variant="primary" icon={Mail} className="w-full h-11" disabled={busy}>
              {busy ? 'Sending…' : 'Email me a code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            {info && <div className="rounded-[10px] bg-[#E3F6EE] px-3.5 py-3 text-[13.5px] text-[#0B7A55]">{info}</div>}
            <Field label="6-digit code">
              <Input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="h-11 mc-num tracking-[0.3em] text-[18px]" autoFocus />
            </Field>
            <Button type="submit" variant="primary" className="w-full h-11" disabled={busy || code.length !== 6}>
              {busy ? 'Checking…' : 'Sign in'}
            </Button>
          </form>
        )}
        <button
          type="button"
          onClick={() => {
            setCodeStep('off');
            setError(null);
            setInfo(null);
          }}
          className="text-[13px] font-semibold text-[#2563EB] hover:underline"
        >
          ← Sign in with a password
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={signIn} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Email">
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11" autoFocus />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" id="login-password" />
        </Field>
        <div className="-mt-2 text-right">
          <button
            type="button"
            onClick={() => {
              setCodeStep('forgot');
              setError(null);
            }}
            className="text-[12.5px] font-semibold text-[#2563EB] hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" variant="primary" className="w-full h-11" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-[12.5px] text-[#7A869E]">
          Students, counsellors, mentors and the Maxicareer team all sign in here. You'll go straight to your own dashboard.
        </p>
      </form>
      <button
        type="button"
        onClick={() => {
          setCodeStep('email');
          setError(null);
        }}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563EB] hover:underline"
      >
        <KeyRound className="w-3.5 h-3.5" /> Student? Sign in with an email code instead
      </button>

      {groups.length > 0 && (
        <div className="pt-5 border-t border-[#DDE4EF]">
          <p className="text-[13px] font-semibold text-[#26355A]">Sample accounts</p>
          <p className="text-[12px] text-[#7A869E] mb-3">Sample data is loaded. Click an account to fill in its email and password.</p>
          <div className="space-y-3">
            {groups.map(([role, accounts]) => (
              <div key={role}>
                <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#7A869E] mb-1.5">{role}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {accounts.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => {
                        setEmail(a.email);
                        setPassword(a.password);
                        setError(null);
                        document.getElementById('login-password')?.focus();
                      }}
                      className={cx(
                        'text-left rounded-[11px] border bg-white px-3 py-2 hover:border-[#2563EB] group',
                        email === a.email ? 'border-[#2563EB] ring-2 ring-[#2563EB]/15' : 'border-[#D3DBE8]'
                      )}
                    >
                      <div className="text-[13px] font-semibold flex items-center justify-between gap-2">
                        <span className="truncate">{a.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8C97AE] group-hover:text-[#2563EB] shrink-0" />
                      </div>
                      <div className="text-[11.5px] text-[#7A869E] truncate">{a.email}</div>
                      <div className="text-[11.5px] text-[#5B6885] truncate">{a.note}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Choose a new password (link from the "Forgot password" email)       */
/* ------------------------------------------------------------------ */

const ResetPasswordForm: React.FC<{ token: string }> = ({ token }) => {
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    auth
      .checkResetLink(token)
      .then((res) => {
        setEmail(res.email);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'This reset link is not valid.');
        setStatus('invalid');
      });
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Use a password of at least 8 characters.');
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      const res = await auth.resetPassword(token, password);
      if (res.home) return go(res.home);
      setMessage(res.message);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password.');
    }
    setBusy(false);
  };

  return (
    <>
      <h2 className="mc-display text-[30px] font-semibold tracking-[-0.02em]">Choose a new password</h2>
      <p className="text-[14px] text-[#5B6885] mt-1.5 mb-5">{email ? `For ${email}. You'll be signed in afterwards.` : 'Checking your reset link…'}</p>
      {status === 'checking' && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
        </div>
      )}
      {status === 'invalid' && (
        <div className="space-y-4">
          <ErrorBox message={error} />
          <Button variant="primary" icon={Mail} className="w-full h-11" onClick={() => window.location.assign('/login?forgot=1')}>
            Send me a new link
          </Button>
        </div>
      )}
      {status === 'ready' && (
        <form onSubmit={submit} className="space-y-4">
          <ErrorBox message={error} />
          <input type="email" value={email} autoComplete="username" readOnly hidden />
          <Field label="New password" hint="At least 8 characters.">
            <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </Field>
          <Button type="submit" variant="primary" icon={KeyRound} className="w-full h-11" disabled={busy}>
            {busy ? 'Saving…' : 'Save password & sign in'}
          </Button>
          <p className="text-[12.5px] text-[#7A869E]">Saving signs you out on every other device.</p>
        </form>
      )}
      {status === 'done' && (
        <div className="space-y-4">
          <div className="rounded-[12px] bg-[#E3F6EE] px-4 py-3.5 text-[13.5px] text-[#0B7A55]" role="status">
            {message}
          </div>
          <Button className="w-full h-11" onClick={() => window.location.assign('/login')}>
            Back to sign in
          </Button>
        </div>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Sign up                                                             */
/* ------------------------------------------------------------------ */

const SIGNUP_ROLES: { id: SignupRole; title: string; body: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'student', title: 'Student', body: 'Get a mentor, sessions, a curriculum and your career plan.', icon: GraduationCap },
  { id: 'counselor', title: 'Counsellor', body: 'Guide students through sessions and roadmaps.', icon: UserRound },
  { id: 'mentor', title: 'Industry mentor', body: 'Mentor learners from your field and review their work.', icon: BriefcaseBusiness },
];

const SignUpForm: React.FC<{ initialRole: SignupRole; onSwitchToSignIn: () => void }> = ({ initialRole, onSwitchToSignIn }) => {
  const [role, setRole] = useState<SignupRole>(initialRole);
  const [f, setF] = useState({
    name: '',
    email: '',
    phone: '+91 ',
    city: '',
    profession: 'college',
    qualification: '',
    company: '',
    jobRole: '',
    domain: '',
    experienceYears: '',
    specializations: '',
    languages: 'English',
    password: '',
    confirm: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!f.name.trim()) return setError('Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setError('Enter a valid email address.');
    if (f.password.length < 8) return setError('Use a password of at least 8 characters.');
    if (f.password !== f.confirm) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      const email = f.email.trim().toLowerCase();
      const phone = f.phone.trim() === '+91' ? '' : f.phone.trim();
      if (role === 'student') {
        const res = await auth.register({ name: f.name.trim(), email, phone, city: f.city.trim(), profession: f.profession, password: f.password });
        go(res.home);
        return;
      }
      const common = { name: f.name.trim(), email, phone, password: f.password, experienceYears: Number(f.experienceYears) || 0 };
      if (role === 'counselor') {
        await apiSend('/api/platform', {
          action: 'registerCounselor',
          payload: { ...common, qualification: f.qualification.trim(), specializations: list(f.specializations), areasOfExpertise: list(f.specializations), languages: list(f.languages) },
        });
      } else {
        await apiSend('/api/platform', { action: 'registerMentor', payload: { ...common, company: f.company.trim(), role: f.jobRole.trim(), domain: f.domain.trim() } });
      }
      setPending(role === 'counselor' ? 'counsellor' : 'mentor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-12 h-12 text-[#0F9F6E] mx-auto" />
        <h3 className="mt-3 mc-display text-[22px] font-semibold">Thanks, your {pending} profile is in</h3>
        <p className="mt-2 text-[14px] text-[#5B6885] max-w-sm mx-auto">
          Our team reviews new {pending}s before they can sign in. You'll get access as soon as you're approved, usually within one working day.
        </p>
        <Button variant="primary" className="mt-5" onClick={onSwitchToSignIn}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="text-[13px] font-semibold text-[#26355A] mb-1.5">I am a…</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Account type">
          {SIGNUP_ROLES.map((r) => {
            const Icon = r.icon;
            const on = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setRole(r.id)}
                className={cx('text-left rounded-[12px] border px-3 py-2.5 transition-colors', on ? 'border-[#2563EB] bg-[#F3F7FF] ring-2 ring-[#2563EB]/15' : 'border-[#D3DBE8] bg-white hover:border-[#B7C3D7]')}
              >
                <Icon className={cx('w-5 h-5', on ? 'text-[#2563EB]' : 'text-[#5B6885]')} />
                <div className="mt-1 text-[13.5px] font-semibold">{r.title}</div>
                <div className="text-[11.5px] text-[#7A869E] leading-snug">{r.body}</div>
              </button>
            );
          })}
        </div>
      </div>

      <ErrorBox message={error} />
      <Field label="Full name">
        <Input autoComplete="name" value={f.name} onChange={set('name')} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Email">
          <Input type="email" autoComplete="email" value={f.email} onChange={set('email')} />
        </Field>
        <Field label="Phone / WhatsApp">
          <Input type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />
        </Field>
      </div>

      {role === 'student' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Where are you in your career?">
            <Select value={f.profession} onChange={set('profession')}>
              {COHORTS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="City">
            <Input autoComplete="address-level2" value={f.city} onChange={set('city')} />
          </Field>
        </div>
      )}

      {role === 'counselor' && (
        <>
          <Field label="Qualification">
            <Input value={f.qualification} onChange={set('qualification')} placeholder="M.A. Psychology, certified career counsellor" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Years of experience">
              <Input type="number" min={0} max={60} value={f.experienceYears} onChange={set('experienceYears')} />
            </Field>
            <Field label="Specialisations" className="sm:col-span-2" hint="Separate with commas.">
              <Input value={f.specializations} onChange={set('specializations')} placeholder="Career exploration, Higher education" />
            </Field>
          </div>
          <Field label="Languages" hint="Separate with commas.">
            <Input value={f.languages} onChange={set('languages')} />
          </Field>
        </>
      )}

      {role === 'mentor' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company">
              <Input autoComplete="organization" value={f.company} onChange={set('company')} />
            </Field>
            <Field label="Your role">
              <Input autoComplete="organization-title" value={f.jobRole} onChange={set('jobRole')} placeholder="Senior data analyst" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Field / domain" className="sm:col-span-2">
              <Input value={f.domain} onChange={set('domain')} placeholder="Data & analytics" />
            </Field>
            <Field label="Years of experience">
              <Input type="number" min={0} max={60} value={f.experienceYears} onChange={set('experienceYears')} />
            </Field>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Password" hint="At least 8 characters.">
          <PasswordInput value={f.password} onChange={(v) => setF({ ...f, password: v })} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password">
          <PasswordInput value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} autoComplete="new-password" />
        </Field>
      </div>

      <Button type="submit" variant="primary" className="w-full h-11" disabled={busy}>
        {busy ? 'Creating account…' : role === 'student' ? 'Create account' : 'Submit for approval'}
      </Button>
      <p className="text-[12.5px] text-[#7A869E]">
        {role === 'student'
          ? "You'll go straight to your student portal."
          : 'Counsellor and mentor profiles are approved by the Maxicareer team before you can sign in.'}{' '}
        Maxicareer staff accounts are created by an administrator.
      </p>
      <p className="text-[12.5px] text-[#7A869E]">
        By creating an account you agree to our{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#2563EB] hover:underline">
          Terms of service
        </a>{' '}
        and{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#2563EB] hover:underline">
          Privacy policy
        </a>
        .
      </p>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const AuthPage: React.FC<{ initialMode?: Mode }> = ({ initialMode = 'signin' }) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [signupRole, setSignupRole] = useState<SignupRole>('student');
  const [me, setMe] = useState<{ user: SessionUser | null; home?: string; samples?: SampleLogin[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') setMode('signup');
    const r = params.get('role');
    if (r === 'counselor' || r === 'mentor' || r === 'student') setSignupRole(r);
    auth
      .me()
      .then((res) => setMe({ user: res.user, home: res.home, samples: res.sampleLogins }))
      .catch(() => setMe({ user: null }));
  }, []);

  const setModeAndUrl = (m: Mode) => {
    setMode(m);
    window.history.replaceState(null, '', m === 'signup' ? '/login?mode=signup' : '/login');
  };

  const signedIn = me?.user;
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('reset'));

  return (
    <div className="mc-admin min-h-screen bg-[#0D1B3E] text-white grid lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div className="mc-grid-dark absolute inset-0 opacity-70" aria-hidden />
        <a href="/" className="relative self-start" aria-label="Maxicareer home">
          <BrandLogo variant="dark" className="h-9 w-auto" />
        </a>
        <div className="relative">
          <h1 className="mc-display text-[40px] leading-[1.05] font-semibold tracking-[-0.02em] max-w-md">One sign-in for every Maxicareer dashboard.</h1>
          <p className="mt-4 text-[15px] text-[#AFC0E3] max-w-md leading-relaxed">Sign in once and you land in the right place.</p>
          <ul className="mt-8 space-y-3 max-w-md">
            {[
              { icon: GraduationCap, title: 'Students', body: 'Student portal: mentor, sessions, curriculum and your plan' },
              { icon: UserRound, title: 'Counsellors & mentors', body: 'Workspace: mentees, availability, reviews and reports' },
              { icon: ShieldCheck, title: 'Maxicareer team', body: 'Admin portal: students, finance, assessments and the website' },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <li key={r.title} className="flex items-start gap-3 rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                  <Icon className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
                  <span>
                    <span className="block text-[14px] font-semibold">{r.title}</span>
                    <span className="block text-[13px] text-[#AFC0E3]">{r.body}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <a href="/" className="relative self-start text-[13.5px] text-[#AFC0E3] hover:text-white">
          ← Back to maxicareer.com
        </a>
      </aside>

      <main className="bg-[#F3F6FB] text-[#0D1B3E] flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="w-full max-w-[480px] mx-auto">
          <div className="lg:hidden mb-8 flex items-center justify-between">
            <a href="/" aria-label="Maxicareer home">
              <BrandLogo className="h-8 w-auto" />
            </a>
            <a href="/" className="text-[13px] text-[#5B6885]">
              ← Website
            </a>
          </div>

          {resetToken ? (
            <ResetPasswordForm token={resetToken} />
          ) : me === null ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
            </div>
          ) : signedIn ? (
            <div className="rounded-[16px] border border-[#DDE4EF] bg-white p-6">
              <h2 className="mc-display text-[26px] font-semibold tracking-[-0.02em]">You're signed in</h2>
              <p className="mt-1.5 text-[14px] text-[#5B6885]">
                {signedIn.name} · {signedIn.email} · {signedIn.staffRole || ROLE_LABEL[signedIn.role] || signedIn.role}
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <Button variant="primary" icon={LayoutDashboard} className="h-11 flex-1" onClick={() => go(me.home)}>
                  Open my {DESTINATION[me.home || ''] || 'dashboard'}
                </Button>
                <Button
                  icon={LogOut}
                  className="h-11"
                  onClick={async () => {
                    await auth.logout().catch(() => {});
                    const res = await auth.me().catch(() => null);
                    setMe({ user: null, samples: res?.sampleLogins });
                  }}
                >
                  Use another account
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mc-display text-[30px] font-semibold tracking-[-0.02em]">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
              <p className="text-[14px] text-[#5B6885] mt-1.5 mb-5">{mode === 'signin' ? 'Sign in to your Maxicareer dashboard.' : 'Join as a student, counsellor or mentor.'}</p>
              <Segmented
                className="mb-5"
                value={mode}
                onChange={setModeAndUrl}
                options={[
                  { value: 'signin', label: 'Sign in' },
                  { value: 'signup', label: 'Create account' },
                ]}
              />
              {mode === 'signin' ? <SignInForm samples={me.samples} /> : <SignUpForm key={signupRole} initialRole={signupRole} onSwitchToSignIn={() => setModeAndUrl('signin')} />}
              <p className="mt-6 text-[13px] text-[#5B6885]">
                {mode === 'signin' ? (
                  <>
                    New to Maxicareer?{' '}
                    <button type="button" onClick={() => setModeAndUrl('signup')} className="font-semibold text-[#2563EB] hover:underline">
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button type="button" onClick={() => setModeAndUrl('signin')} className="font-semibold text-[#2563EB] hover:underline">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
