import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  LogIn,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  Calendar,
  ArrowRight,
  Briefcase,
  GraduationCap,
  BookOpen,
  UserCheck,
  MessageCircle,
  X,
  Users,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentProfile, UserProfession } from '../types';
import { DEMO_STUDENT_PROFILES, OFFICIAL_PHONE, OFFICIAL_PHONE_DIGITS, OFFICIAL_EMAIL } from '../data/portalData';
import { useDemoAvailable } from '../lib/api';

interface CornerProfileMenuProps {
  userProfile: StudentProfile | null;
  onOpenSignIn: () => void;
  onOpenRegister?: () => void;
  onOpenDashboard: () => void;
  onLogout: () => void;
  onSwitchProfile: (profile: StudentProfile) => void;
  onBookConsultation: () => void;
}

export const CornerProfileMenu: React.FC<CornerProfileMenuProps> = ({
  userProfile,
  onOpenSignIn,
  onOpenRegister,
  onOpenDashboard,
  onLogout,
  onSwitchProfile,
  onBookConsultation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const demoAvailable = useDemoAvailable();
  const [activeTab, setActiveTab] = useState<'profile' | 'logout_page'>('profile');
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectDemoLogin = (profession: UserProfession) => {
    const demo = DEMO_STUDENT_PROFILES[profession];
    if (demo) {
      setLogoutNotice(null);
      onSwitchProfile(demo);
      setActiveTab('profile');
      setIsOpen(false);
    }
  };

  const handleExecuteLogout = () => {
    onLogout();
    setLogoutNotice('You have logged out successfully. Choose a user profile below to access the student portal.');
    setActiveTab('logout_page');
  };

  const getProfessionIcon = (prof?: UserProfession) => {
    switch (prof) {
      case 'school':
        return <BookOpen className="w-3.5 h-3.5 text-amber-600" />;
      case 'college':
        return <GraduationCap className="w-3.5 h-3.5 text-blue-600" />;
      case 'fresher':
        return <UserCheck className="w-3.5 h-3.5 text-purple-600" />;
      case 'working_professional':
        return <Briefcase className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <User className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const directWhatsAppUrl = userProfile
    ? `https://wa.me/${OFFICIAL_PHONE_DIGITS}?text=${encodeURIComponent(
        `Hello Maxicareer Mentor! I am ${userProfile.name} (Student ID: ${userProfile.id}), enrolled in ${userProfile.planName}. I have an account inquiry.`
      )}`
    : `https://wa.me/${OFFICIAL_PHONE_DIGITS}?text=${encodeURIComponent(
        'Hello Maxicareer! I am interested in your career mentorship programs.'
      )}`;

  // When there is no active user profile, hide login/registration trigger per mentor instruction
  if (!userProfile) {
    return null;
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Corner Trigger Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* If Not Logged In: Show both Login and Register buttons clearly */}
        {!userProfile ? (
          <>
            <button
              id="corner-login-btn"
              type="button"
              onClick={onOpenSignIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#2563EB] bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all duration-200 whitespace-nowrap active:scale-95 shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Login</span>
            </button>

            <button
              id="corner-register-btn"
              type="button"
              onClick={onOpenRegister || onOpenSignIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition-all duration-200 whitespace-nowrap active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>

            {/* Profile / Account Log Options Icon Button */}
            <button
              id="corner-profile-toggle-guest"
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                setLogoutNotice(null);
              }}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                isOpen
                  ? 'bg-blue-100 border-blue-400 text-[#2563EB]'
                  : 'bg-slate-100/90 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Profile & Quick Log Options"
              aria-label="Profile and Log Options menu"
              aria-expanded={isOpen}
            >
              <User className="w-4 h-4" />
              <ChevronDown
                className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
              />
            </button>
          </>
        ) : (
          /* If Logged In: Display rich profile avatar badge that acts like a profile trigger */
          <button
            id="corner-profile-toggle-active"
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              setLogoutNotice(null);
            }}
            className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border transition-all duration-200 ${
              isOpen
                ? 'bg-blue-50 border-blue-400 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:border-blue-300'
            }`}
            aria-label="User Profile & Account Options"
            aria-expanded={isOpen}
          >
            {/* Avatar with active online ring */}
            <div className="relative">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px] xl:max-w-[130px]">
                {userProfile.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                {userProfile.profession === 'working_professional'
                  ? 'Pro'
                  : userProfile.profession === 'fresher'
                  ? 'Fresher'
                  : userProfile.profession === 'college'
                  ? 'College'
                  : 'School'}
              </span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Floating Corner Profile Card / Page Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="corner-profile-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2.5 w-[340px] sm:w-[390px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 text-slate-800"
          >
            {/* Profile Page Style Header */}
            <div className="relative p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Profile Menu"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3.5">
                {/* Avatar with cohort icon badge */}
                <div className="relative flex-shrink-0">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 text-white font-extrabold text-xl flex items-center justify-center shadow-lg border-2 border-white/20">
                    {userProfile ? userProfile.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                  </div>
                  {userProfile && (
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs"
                      title={userProfile.professionLabel}
                    >
                      {getProfessionIcon(userProfile.profession)}
                    </div>
                  )}
                </div>

                {/* Identity Info */}
                <div className="flex-1 min-w-0 pr-6">
                  {userProfile ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-white truncate">{userProfile.name}</h3>
                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-slate-300 truncate">{userProfile.email}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                          {userProfile.profession === 'working_professional'
                            ? 'Working Professional'
                            : userProfile.profession === 'fresher'
                            ? 'Freshers / PSW'
                            : userProfile.profession === 'college'
                            ? 'College Student'
                            : 'School Student'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          ID: {userProfile.id}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-bold text-white">Maxicareer Portal</h3>
                      <p className="text-xs text-slate-300">Sign in or pick a user profile to access</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenSignIn();
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <LogIn className="w-3.5 h-3.5 text-blue-600" />
                          <span>Login</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            (onOpenRegister || onOpenSignIn)();
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Register</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Tabs: "My Profile" vs "Logout Page" */}
            <div className="flex border-b border-slate-200 bg-slate-50/90 px-3 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('profile');
                  setLogoutNotice(null);
                }}
                className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </button>

              <button
                id="tab-profile-logout-page"
                type="button"
                onClick={() => setActiveTab('logout_page')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'logout_page'
                    ? 'border-red-500 text-red-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Logout &amp; Switch User</span>
              </button>
            </div>

            {/* Tab 1: Profile & Program Overview */}
            {activeTab === 'profile' && (
              <div className="p-4 space-y-3.5 max-h-[370px] overflow-y-auto">
                {userProfile ? (
                  <>
                    {/* Active Program Card */}
                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                          Enrolled Program
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900 mt-1">{userProfile.planName}</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {userProfile.institutionOrCompany} &bull; {userProfile.detail}
                      </div>

                      {/* Roadmap Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-700">Career Roadmap Progress</span>
                          <span className="font-bold text-blue-600">{userProfile.roadmapProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-blue-200/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${userProfile.roadmapProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Primary Dashboard Link */}
                    <button
                      id="corner-launch-dashboard-btn"
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenDashboard();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-xs hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-600/20 transition-all duration-150 group"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
                        <span>Open Full Student Dashboard</span>
                      </div>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* Mentorship Session Quick Log */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Mentorship Session Log</span>
                        </span>
                        <span className="text-[10px] text-slate-500">1:1 Call</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Next session: <span className="font-semibold text-slate-800">Strategy &amp; Resume Review</span> with Senior Mentor.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <a
                          href={directWhatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 fill-emerald-600" />
                          <span>WhatsApp Mentor</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onBookConsultation();
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-200 text-slate-800 text-[11px] font-bold hover:bg-slate-300 transition-colors"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Schedule Call</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Guest Profile View */
                  <div className="space-y-3 py-1">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Welcome to Maxicareer Portal</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
                        Access milestone roadmaps, verified resume kits, and live 1:1 mentor schedules.
                      </p>
                      <ul className="space-y-1.5 text-slate-600 text-[11px]">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>Direct access for all student &amp; professional cohorts</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>Switch seamlessly between multiple user profiles</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>Offline &amp; WhatsApp direct mentor support</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenSignIn();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-colors active:scale-95"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Access Student Portal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('logout_page')}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Choose User Profile (Logout &amp; Switch)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Dedicated "Logout Page" with Multi-User Portal Access */}
            {activeTab === 'logout_page' && (
              <div className="p-4 space-y-3.5 max-h-[370px] overflow-y-auto">
                {/* Logout Notification Banner if triggered */}
                {logoutNotice && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{logoutNotice}</span>
                  </div>
                )}

                {/* Section 1: Current Session & Logout Control */}
                {userProfile ? (
                  <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
                          Active User Session
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Online
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-red-100">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                        {userProfile.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{userProfile.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{userProfile.email}</div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex-shrink-0">
                        {userProfile.profession === 'working_professional'
                          ? 'Professional'
                          : userProfile.profession === 'fresher'
                          ? 'Fresher'
                          : userProfile.profession === 'college'
                          ? 'College'
                          : 'School'}
                      </span>
                    </div>

                    {/* Dedicated Logout Button */}
                    <button
                      id="profile-page-logout-btn"
                      type="button"
                      onClick={handleExecuteLogout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-sm transition-all duration-150"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out of Current Session</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Currently logged out. Sign in to access the portal.</span>
                  </div>
                )}

                {/* Section 2: Multi-User Switcher & Portal Access */}
                <div>
                  {/* Sample student accounts: only while an admin has sample data loaded */}
                  {demoAvailable && (
                  <>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Access Portal as Different User</span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">1-Click Switch</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Click any student or professional profile to immediately access their personalized portal page:
                  </p>

                  <div className="space-y-2">
                    {/* 1. Fresher / PSW */}
                    <button
                      id="switch-user-fresher"
                      type="button"
                      onClick={() => handleSelectDemoLogin('fresher')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all ${
                        userProfile?.profession === 'fresher'
                          ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300 shadow-xs'
                          : 'bg-white hover:bg-purple-50/50 border-slate-200 hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          RS
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            Rohan Sharma (Fresher / PSW)
                          </div>
                          <div className="text-[10px] text-slate-500">Step-In Program &bull; B.Tech Graduate</div>
                        </div>
                      </div>
                      {userProfile?.profession === 'fresher' ? (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-200">
                          Access &rarr;
                        </span>
                      )}
                    </button>

                    {/* 2. Working Professional */}
                    <button
                      id="switch-user-professional"
                      type="button"
                      onClick={() => handleSelectDemoLogin('working_professional')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all ${
                        userProfile?.profession === 'working_professional'
                          ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300 shadow-xs'
                          : 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          AI
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            Ananya Iyer (Working Professional)
                          </div>
                          <div className="text-[10px] text-slate-500">Step-Up Program &bull; Senior Analyst</div>
                        </div>
                      </div>
                      {userProfile?.profession === 'working_professional' ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200">
                          Access &rarr;
                        </span>
                      )}
                    </button>

                    {/* 3. College Student */}
                    <button
                      id="switch-user-college"
                      type="button"
                      onClick={() => handleSelectDemoLogin('college')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all ${
                        userProfile?.profession === 'college'
                          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300 shadow-xs'
                          : 'bg-white hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          AM
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            Arjun Mehta (College Student)
                          </div>
                          <div className="text-[10px] text-slate-500">Step-Next Program &bull; Final Year</div>
                        </div>
                      </div>
                      {userProfile?.profession === 'college' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200">
                          Access &rarr;
                        </span>
                      )}
                    </button>

                    {/* 4. School Student */}
                    <button
                      id="switch-user-school"
                      type="button"
                      onClick={() => handleSelectDemoLogin('school')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all ${
                        userProfile?.profession === 'school'
                          ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300 shadow-xs'
                          : 'bg-white hover:bg-amber-50/50 border-slate-200 hover:border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          AS
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            Aarav Sharma (School Student)
                          </div>
                          <div className="text-[10px] text-slate-500">Step-Ready Program &bull; Class 11</div>
                        </div>
                      </div>
                      {userProfile?.profession === 'school' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200">
                          Access &rarr;
                        </span>
                      )}
                    </button>
                  </div>

                  </>
                  )}

                  {/* Manual Sign In with custom email */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenSignIn();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-blue-600" />
                      <span>Sign In with Custom Email / Password</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="p-3 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
              {userProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('logout_page')}
                    className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-semibold px-2 py-1 rounded-lg hover:bg-white transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Switch User</span>
                  </button>

                  <button
                    id="corner-footer-logout-btn"
                    type="button"
                    onClick={handleExecuteLogout}
                    className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between text-[11px] text-slate-500">
                  <span>Hotline: {OFFICIAL_PHONE}</span>
                  <a
                    href={`mailto:${OFFICIAL_EMAIL}`}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {OFFICIAL_EMAIL}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
