'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const RegistryClientPage = dynamic(() => import('./RegistryClientPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0D1B3E] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function RegistryPage() {
  return <RegistryClientPage />;
}
