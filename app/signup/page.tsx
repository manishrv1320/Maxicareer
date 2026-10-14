'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const AuthPage = dynamic(() => import('@/src/components/auth/AuthPage').then((m) => m.AuthPage), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function SignupPage() {
  return <AuthPage initialMode="signup" />;
}
