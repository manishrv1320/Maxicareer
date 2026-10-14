import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  X,
  Send,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { OFFICIAL_EMAIL, OFFICIAL_PHONE, OFFICIAL_PHONE_DIGITS } from '../data/portalData';

export interface EmailModalData {
  recipient?: string;
  subject: string;
  body: string;
  title?: string;
  subtitle?: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  category?: string;
}

interface EmailModalProps {
  isOpen: boolean;
  data: EmailModalData | null;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ isOpen, data, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [serverSaved, setServerSaved] = useState(false);

  if (!isOpen || !data) return null;

  const recipient = data.recipient || OFFICIAL_EMAIL;
  const subject = data.subject || 'Maxicareer Career Guidance & Consultation Inquiry';
  const body = data.body || '';

  // 1. Direct Webmail URLs (work anywhere, even without desktop mail clients)
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    recipient
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(
    recipient
  )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  // 2. WhatsApp URL fallback
  const waText = `*Inquiry for Maxicareer* 🚀\n*Subject:* ${subject}\n\n${body}`;
  const waUrl = `https://wa.me/${OFFICIAL_PHONE_DIGITS}?text=${encodeURIComponent(waText)}`;

  // Copy full message
  const handleCopy = async () => {
    const fullText = `To: ${recipient}\nSubject: ${subject}\n\n${body}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullText);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = fullText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleOpenGmail = () => {
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenOutlook = () => {
    window.open(outlookUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenDefaultMail = () => {
    // Open in new target anchor to avoid sandbox/iframe navigation blocking
    const a = document.createElement('a');
    a.href = mailtoUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenWhatsApp = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden my-auto max-h-[92vh] flex flex-col relative"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 id="email-modal-title" className="text-base sm:text-lg font-extrabold text-white">
                  {data.title || 'Send Email to Maxicareer'}
                </h3>
                <p className="text-xs text-slate-300">
                  {data.subtitle || `Directly routed to ${OFFICIAL_EMAIL}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
              aria-label="Close email options"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Info notice */}
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3 text-xs sm:text-sm text-slate-700">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-900 block mb-0.5">
                  Pre-Formatted Message Ready
                </span>
                <span>
                  Select your preferred email service below. Your message and subject are already
                  prepared with your inquiry details.
                </span>
              </div>
            </div>

            {/* Email dispatch actions grid */}
            <div className="space-y-2.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Choose Email Provider
              </span>

              {/* 1. Gmail Web (Most reliable for web users) */}
              <button
                type="button"
                id="email-modal-gmail-btn"
                onClick={handleOpenGmail}
                className="w-full p-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-red-500/20 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-bold">Open in Gmail (Web)</span>
                    <span className="block text-xs text-red-100 font-normal">
                      Recommended for browser &amp; Google users
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-red-200 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Default System Mail Client (Apple Mail, Windows Mail, Thunderbird) */}
              <button
                type="button"
                id="email-modal-default-mail-btn"
                onClick={handleOpenDefaultMail}
                className="w-full p-3.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/20 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-blue-400">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-bold">Open Default Mail App</span>
                    <span className="block text-xs text-slate-300 font-normal">
                      Apple Mail, Outlook Desktop, Thunderbird
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 3. Outlook / Hotmail Web */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="email-modal-outlook-btn"
                  onClick={handleOpenOutlook}
                  className="p-3 rounded-xl font-bold text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Open in Outlook Web</span>
                </button>

                <button
                  type="button"
                  id="email-modal-whatsapp-btn"
                  onClick={handleOpenWhatsApp}
                  className="p-3 rounded-xl font-bold text-xs sm:text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>

              {/* 4. One-Click Copy to Clipboard */}
              <button
                type="button"
                id="email-modal-copy-btn"
                onClick={handleCopy}
                className={`w-full p-3 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied to Clipboard! (Paste into any email client)</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copy Full Message &amp; Recipient Address</span>
                  </>
                )}
              </button>
            </div>

            {/* Message Preview */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Message Details
                </span>
                <span className="text-xs text-blue-600 font-semibold">{recipient}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <div>
                  <span className="font-bold text-slate-800">Subject: </span>
                  <span>{subject}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block mb-0.5">Body Preview:</span>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono text-[11px]">
                    {body}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Official support: <strong className="text-slate-700">{OFFICIAL_EMAIL}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg font-bold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
