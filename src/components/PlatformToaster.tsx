import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useCareerStore } from '../hooks/useCareerStore';
import { platformStore } from '../services/careerPlatformStore';

/** Shows the last failed platform action (e.g. a lost connection) for a few seconds. */
export const PlatformToaster: React.FC = () => {
  const { state } = useCareerStore();
  const err = state.lastError;

  useEffect(() => {
    if (!err) return;
    const t = setTimeout(() => platformStore.clearError(), 6000);
    return () => clearTimeout(t);
  }, [err]);

  if (!err) return null;
  return (
    <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[min(92vw,440px)] rounded-xl bg-red-700 text-white px-4 py-3 shadow-xl flex items-start gap-2.5 text-sm">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="flex-1">{err.message}</span>
      <button type="button" onClick={() => platformStore.clearError()} aria-label="Dismiss" className="opacity-80 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
