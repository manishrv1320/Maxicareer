'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const InternalPortal = dynamic(() => import('@/src/components/internal/InternalPortal').then((m) => m.InternalPortal), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function PortalPage() {
  return <InternalPortal />;
}
