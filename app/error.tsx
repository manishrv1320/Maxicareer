'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Something went wrong!</h1>
      <p className="text-slate-600 mb-6 max-w-md text-sm">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm transition-colors shadow-sm"
      >
        Try Again
      </button>
    </div>
  );
}
