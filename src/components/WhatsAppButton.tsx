import React, { useState } from 'react';
import { X } from 'lucide-react';
import { OFFICIAL_PHONE_DIGITS } from '../data/portalData';
import { WhatsAppIcon } from './WhatsAppIcon';

export const WhatsAppButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  const defaultMessage = encodeURIComponent(
    'Hello Maxicareer Team! I would like to inquire about career guidance and mentorship programs for students & professionals.'
  );
  const whatsappUrl = `https://wa.me/${OFFICIAL_PHONE_DIGITS}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Tooltip Popup */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-white text-slate-800 px-3.5 py-2 rounded-2xl shadow-xl border border-slate-200 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          <span>Chat with Maxicareer Mentor</span>
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-slate-600 ml-1 p-0.5 rounded-full hover:bg-slate-100"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        id="floating-whatsapp-btn"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE5A] text-white shadow-xl shadow-[#25D366]/30 hover:shadow-[#25D366]/50 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
        aria-label="Chat with Maxicareer on WhatsApp"
        title="Chat on WhatsApp"
      >
        <WhatsAppIcon className="w-8 h-8 transition-transform group-hover:scale-110" />
      </a>
    </div>
  );
};
