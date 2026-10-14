import React, { useState } from 'react';
import { Paperclip, Star, Upload, X } from 'lucide-react';
import { cx } from '../admin/ui';
import { uploadFile, pickFile, UploadedFile, UploadCategory } from '../../lib/api';

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD. */
export const toIsoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayIso = () => toIsoDay(new Date());

/** Parses "September 22, 2026", "2026-09-22" or an ISO timestamp as a local day. */
export function parseDay(value?: string): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value.replace(/ at .*$/, ''));
  return Number.isNaN(d.getTime()) ? null : d;
}

export const isoOf = (value?: string) => {
  const d = parseDay(value);
  return d ? toIsoDay(d) : '';
};

export function fmtDay(value?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = parseDay(value);
  return d ? d.toLocaleDateString('en-IN', opts) : value || '—';
}

/** "16:30" -> "4:30 PM"; anything else is returned as-is. */
export function fmtTime(value?: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value || '');
  if (!m) return value || '';
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "04:00 PM" -> "16:00". */
export function to24h(value: string) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  if (!m) return value;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${pad(h)}:${m[2]}`;
}

/** Whole days from today to the given day (negative = past). */
export function daysFromToday(value?: string) {
  const d = parseDay(value);
  if (!d) return null;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
}

export function relativeDay(value?: string) {
  const n = daysFromToday(value);
  if (n === null) return '';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  return n > 0 ? `In ${n} days` : `${-n} days ago`;
}

export const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

/** Minutes from "45 mins", "1h 15m", "60 minutes", "1 hour". */
export function minutesOf(duration?: string, fallback = 45) {
  if (!duration) return fallback;
  const h = /(\d+(?:\.\d+)?)\s*h/i.exec(duration);
  const m = /(\d+)\s*m/i.exec(duration);
  const total = (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  return total || fallback;
}

/* ------------------------------------------------------------------ */
/* Files                                                               */
/* ------------------------------------------------------------------ */

export const fileUrl = (fileId: string, download = false) => `/api/files/${fileId}${download ? '?download=1' : ''}`;

export const FileLink: React.FC<{ fileId: string; name?: string; className?: string }> = ({ fileId, name, className }) => (
  <a
    href={fileUrl(fileId)}
    target="_blank"
    rel="noopener noreferrer"
    className={cx('inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563EB] hover:underline max-w-full', className)}
  >
    <Paperclip className="w-3.5 h-3.5 shrink-0" />
    <span className="truncate">{name || 'Open file'}</span>
  </a>
);

const ACCEPT = 'image/*,.pdf,.doc,.docx,.pptx,.xlsx,.txt,.csv';

/** A "choose file" control that uploads straight away and reports the stored file. */
export const FilePicker: React.FC<{
  value: UploadedFile | null;
  onChange: (f: UploadedFile | null) => void;
  category?: UploadCategory;
  accept?: string;
  label?: string;
  onError?: (message: string) => void;
}> = ({ value, onChange, category = 'document', accept = ACCEPT, label = 'Upload a file', onError }) => {
  const [busy, setBusy] = useState(false);
  const choose = async () => {
    const file = await pickFile(accept);
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadFile(file, category));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };
  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-[10px] border border-[#D3DBE8] bg-[#F7F9FC] px-3 h-10">
        <Paperclip className="w-4 h-4 text-[#5B6885] shrink-0" />
        <span className="text-[13px] font-medium truncate flex-1">{value.name}</span>
        <button type="button" onClick={() => onChange(null)} className="p-1 rounded text-[#7A869E] hover:text-[#B42F3B]" aria-label="Remove file">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={choose}
      disabled={busy}
      className="w-full h-10 rounded-[10px] border border-dashed border-[#B7C3D7] bg-white text-[13px] font-semibold text-[#33415F] hover:border-[#2563EB] hover:text-[#2563EB] inline-flex items-center justify-center gap-2 disabled:opacity-60"
    >
      <Upload className="w-4 h-4" />
      {busy ? 'Uploading…' : label}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Rating                                                              */
/* ------------------------------------------------------------------ */

export const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; size?: number }> = ({ value, onChange, size = 22 }) => (
  <div className="inline-flex items-center gap-0.5" role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => {
      const icon = <Star style={{ width: size, height: size }} className={n <= value ? 'fill-[#F2A93B] text-[#F2A93B]' : 'text-[#C4CEDD]'} />;
      return onChange ? (
        <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} className="p-0.5 rounded hover:scale-110 transition-transform">
          {icon}
        </button>
      ) : (
        <span key={n}>{icon}</span>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */
/* Small layout pieces                                                 */
/* ------------------------------------------------------------------ */

/** Label + value pair used in summary cards. */
export const Fact: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={cx('min-w-0', className)}>
    <div className="text-[12px] font-medium text-[#7A869E]">{label}</div>
    <div className="text-[14px] font-semibold text-[#0D1B3E] truncate">{children}</div>
  </div>
);

/** Inline error box for forms. */
export const FormError: React.FC<{ message?: string | null }> = ({ message }) =>
  message ? (
    <div className="rounded-[10px] bg-[#FCEBEC] px-3.5 py-2.5 text-[13px] text-[#B42F3B]" role="alert">
      {message}
    </div>
  ) : null;

/** Runs an async action with a busy flag; resolves true on success and keeps the error message for the form. */
/** True for a pasted video-call address such as a Meet, Zoom or Teams link (the server checks again). */
export function isMeetingLink(value: string) {
  const s = value.trim();
  try {
    return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`).hostname.includes('.');
  } catch {
    return false;
  }
}

export const MEETING_LINK_HELP = 'Paste the full meeting link, for example https://meet.google.com/abc-defg-hij';

export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}
