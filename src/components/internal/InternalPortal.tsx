import React, { useEffect } from 'react';
import { useCareerStore } from '../../hooks/useCareerStore';
import { ProviderPortal } from '../provider/ProviderPortal';

/**
 * The counsellor and mentor workspace at /portal. Signing in and signing up happen on the
 * shared /login page, which sends counsellors and mentors back here.
 */
export const InternalPortal: React.FC = () => {
  const { state, logout } = useCareerStore();
  const counselor = state.counselors.find((c) => c.id === state.activeCounselorId) || null;
  const mentor = state.mentors.find((m) => m.id === state.activeMentorId) || null;

  // Not signed in as a counsellor or mentor: go to the shared sign-in (keeping ?role for sign-up).
  useEffect(() => {
    if (!state.loaded || counselor || mentor) return;
    const role = new URLSearchParams(window.location.search).get('role');
    window.location.replace(role === 'counselor' || role === 'mentor' ? `/login?role=${role}` : '/login');
  }, [state.loaded, counselor, mentor]);

  const signOut = async () => {
    await logout();
    window.location.assign('/login');
  };

  if (state.loaded && (counselor || mentor)) {
    return (
      <div className="mc-admin">
        <ProviderPortal kind={counselor ? 'counselor' : 'mentor'} me={(counselor || mentor)!} onSignOut={signOut} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
    </div>
  );
};
