import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Copy, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
// ink      #0D1B3E  — sidebar, headings
// canvas   #F3F6FB  — page background (with planning grid)
// line     #DDE4EF  — hairlines
// muted    #5B6885  — secondary text
// blue     #2563EB  — actions
// marigold #F2A93B  — attention: unread, pending, due soon
// mint     #0F9F6E  — success     rose #D93F4C — destructive

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export const PageHeader: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}> = ({ title, description, actions, meta }) => (
  <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-6 border-b border-[#DDE4EF]">
    <div className="min-w-0 max-w-2xl">
      {meta && <div className="mb-2 text-[13px] text-[#5B6885]">{meta}</div>}
      <h1 className="mc-display text-[30px] sm:text-[34px] leading-[1.05] font-semibold text-[#0D1B3E] tracking-[-0.02em]">
        {title}
      </h1>
      {description && <p className="mt-2 text-[14px] leading-relaxed text-[#5B6885]">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </header>
);

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export const Panel: React.FC<{
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}> = ({ title, description, actions, children, className, bodyClassName, flush }) => (
  <section className={cx('bg-white border border-[#DDE4EF] rounded-[14px] min-w-0', className)}>
    {(title || actions) && (
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="min-w-0">
          {title && <h2 className="mc-display text-[17px] font-semibold text-[#0D1B3E] tracking-[-0.01em]">{title}</h2>}
          {description && <p className="text-[13px] text-[#5B6885] mt-0.5">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    )}
    <div className={cx(flush ? '' : 'px-5 pb-5', !title && !actions && !flush && 'pt-5', bodyClassName)}>{children}</div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: 'sm' | 'md';
    icon?: React.ComponentType<{ className?: string }>;
  }
> = ({ variant = 'secondary', size = 'md', icon: Icon, className, children, type = 'button', ...rest }) => {
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-[#2563EB] text-white hover:bg-[#1D4FD7] border border-[#2563EB]',
    secondary: 'bg-white text-[#0D1B3E] border border-[#D3DBE8] hover:border-[#B7C3D7] hover:bg-[#F8FAFD]',
    ghost: 'bg-transparent text-[#33415F] border border-transparent hover:bg-[#EDF1F8]',
    danger: 'bg-white text-[#C2333F] border border-[#F1C9CD] hover:bg-[#FCEBEC]',
    dark: 'bg-[#0D1B3E] text-white border border-[#0D1B3E] hover:bg-[#16264F]',
  };
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-[10px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 whitespace-nowrap',
        size === 'sm' ? 'h-8 px-3 text-[12.5px]' : 'h-10 px-4 text-[13.5px]',
        styles[variant],
        className
      )}
      {...rest}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
};

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: React.ComponentType<{ className?: string }>; label: string; tone?: 'default' | 'danger' }
> = ({ icon: Icon, label, tone = 'default', className, ...rest }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    className={cx(
      'inline-flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40',
      tone === 'danger' ? 'text-[#8C97AE] hover:text-[#C2333F] hover:bg-[#FCEBEC]' : 'text-[#5B6885] hover:text-[#0D1B3E] hover:bg-[#EDF1F8]',
      className
    )}
    {...rest}
  >
    <Icon className="w-4 h-4" />
  </button>
);

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'blue' | 'mint' | 'marigold' | 'rose' | 'violet' | 'ink';

const toneStyles: Record<Tone, string> = {
  neutral: 'bg-[#EEF2F7] text-[#4A5875]',
  blue: 'bg-[#E8F0FE] text-[#1D4FD7]',
  mint: 'bg-[#E3F6EE] text-[#0B7A55]',
  marigold: 'bg-[#FDF1DC] text-[#94570A]',
  rose: 'bg-[#FCEBEC] text-[#B42F3B]',
  violet: 'bg-[#EFEBFD] text-[#5B3CC4]',
  ink: 'bg-[#0D1B3E] text-white',
};

export const toneDot: Record<Tone, string> = {
  neutral: 'bg-[#8C97AE]',
  blue: 'bg-[#2563EB]',
  mint: 'bg-[#0F9F6E]',
  marigold: 'bg-[#F2A93B]',
  rose: 'bg-[#D93F4C]',
  violet: 'bg-[#6D4AE0]',
  ink: 'bg-[#0D1B3E]',
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; dot?: boolean; className?: string }> = ({
  tone = 'neutral',
  children,
  dot,
  className,
}) => (
  <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12px] font-semibold whitespace-nowrap', toneStyles[tone], className)}>
    {dot && <span className={cx('h-1.5 w-1.5 rounded-full', toneDot[tone])} />}
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

const controlBase =
  'w-full rounded-[10px] border border-[#D3DBE8] bg-white px-3 text-[13.5px] text-[#0D1B3E] placeholder:text-[#9AA5BB] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-colors';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...rest }, ref) => (
  <input ref={ref} className={cx(controlBase, 'h-10', className)} {...rest} />
));
Input.displayName = 'Input';

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, rows = 3, ...rest }) => (
  <textarea rows={rows} className={cx(controlBase, 'py-2.5 leading-relaxed resize-y', className)} {...rest} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...rest }) => (
  <select className={cx(controlBase, 'h-10 pr-8 font-medium cursor-pointer', className)} {...rest}>
    {children}
  </select>
);

export const Field: React.FC<{ label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  label,
  hint,
  children,
  className,
}) => (
  <label className={cx('block', className)}>
    <span className="block text-[13px] font-semibold text-[#26355A] mb-1.5">{label}</span>
    {children}
    {hint && <span className="block text-[12px] text-[#7A869E] mt-1.5">{hint}</span>}
  </label>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }> = ({
  checked,
  onChange,
  label,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cx(
      'relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 disabled:opacity-40',
      checked ? 'bg-[#2563EB]' : 'bg-[#CBD4E2]'
    )}
  >
    <span className={cx('inline-block h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[19px]' : 'translate-x-[3px]')} />
  </button>
);

/* ------------------------------------------------------------------ */
/* StepMeter — the signature staircase progress                        */
/* ------------------------------------------------------------------ */

export const StepMeter: React.FC<{
  value: number; // 0-100
  steps?: number;
  tone?: 'blue' | 'mint' | 'marigold' | 'violet' | 'sky';
  height?: number;
  width?: number;
  className?: string;
  label?: string;
}> = ({ value, steps = 6, tone = 'blue', height = 22, width, className, label }) => {
  const fills: Record<string, string> = {
    blue: '#2563EB',
    mint: '#0F9F6E',
    marigold: '#F2A93B',
    violet: '#6D4AE0',
    sky: '#38BDF8',
  };
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * steps);
  return (
    <div
      className={cx('flex items-end gap-[3px]', className)}
      style={{ height, width }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      aria-label={label || 'Progress'}
    >
      {Array.from({ length: steps }).map((_, i) => (
        <span
          key={i}
          className="flex-1 rounded-[2px] min-w-[4px]"
          style={{
            height: `${((i + 1) / steps) * 100}%`,
            background: i < filled ? fills[tone] : '#E2E8F1',
          }}
        />
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Stat                                                                */
/* ------------------------------------------------------------------ */

export const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: React.ReactNode;
  onClick?: () => void;
}> = ({ label, value, hint, accent, onClick }) => {
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx(
        'text-left bg-white border border-[#DDE4EF] rounded-[14px] p-5 flex flex-col gap-3 min-w-0',
        onClick && 'hover:border-[#B7C3D7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-[#5B6885]">{label}</span>
        {accent}
      </div>
      <div className="mc-display mc-num text-[32px] leading-none font-semibold text-[#0D1B3E] tracking-[-0.02em]">{value}</div>
      {hint && <div className="text-[12.5px] text-[#7A869E]">{hint}</div>}
    </Tag>
  );
};

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export const Empty: React.FC<{
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, body, action }) => (
  <div className="flex flex-col items-center text-center px-6 py-12">
    {Icon && (
      <div className="mb-4 h-12 w-12 rounded-[12px] border border-dashed border-[#C4CEDD] flex items-center justify-center text-[#7A869E]">
        <Icon className="w-5 h-5" />
      </div>
    )}
    <p className="mc-display text-[16px] font-semibold text-[#0D1B3E]">{title}</p>
    {body && <p className="mt-1 max-w-sm text-[13px] text-[#5B6885] leading-relaxed">{body}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: NoInfer<T>; label: React.ReactNode; count?: number }[];
  value: T;
  onChange: (v: NoInfer<T>) => void;
  className?: string;
}) {
  return (
    <div className={cx('inline-flex flex-wrap items-center gap-1 rounded-[11px] bg-[#E9EEF5] p-1', className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'h-8 px-3 rounded-[8px] text-[13px] font-semibold transition-colors inline-flex items-center gap-1.5',
              active ? 'bg-white text-[#0D1B3E] shadow-[0_1px_2px_rgba(13,27,62,0.08)]' : 'text-[#5B6885] hover:text-[#0D1B3E]'
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cx('mc-num text-[11.5px] rounded-full px-1.5', active ? 'bg-[#E8F0FE] text-[#1D4FD7]' : 'text-[#7A869E]')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal & drawer                                                      */
/* ------------------------------------------------------------------ */

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}> = ({ open, onClose, title, description, children, footer, width = 'max-w-lg' }) => {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            className="absolute inset-0 bg-[#0D1B3E]/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className={cx('relative w-full bg-white rounded-t-[18px] sm:rounded-[18px] border border-[#DDE4EF] max-h-[92vh] flex flex-col', width)}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#EAEFF6]">
              <div>
                <h3 className="mc-display text-[19px] font-semibold text-[#0D1B3E]">{title}</h3>
                {description && <p className="text-[13px] text-[#5B6885] mt-1">{description}</p>}
              </div>
              <IconButton icon={X} label="Close" onClick={onClose} />
            </div>
            <div className="px-6 py-5 overflow-y-auto">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-[#EAEFF6] flex justify-end gap-2 bg-[#FAFBFD] rounded-b-[18px]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * A one-time password that couldn't be emailed, shown once so the admin can share it another
 * way. The person chooses their own password when they sign in with it.
 */
export const OneTimePasswordModal: React.FC<{ issued: { email: string; password: string } | null; onClose: () => void }> = ({ issued, onClose }) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [issued?.password]);
  return (
    <Modal
      open={!!issued}
      onClose={onClose}
      title="One-time password"
      description={issued ? `We couldn't email it to ${issued.email}, so share it with them securely. It's shown only once; they choose their own password when they sign in.` : ''}
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex items-center gap-2">
        <div className="mc-num flex-1 rounded-[10px] bg-[#0D1B3E] text-white text-[18px] tracking-wider px-4 py-3 select-all">{issued?.password}</div>
        <Button
          icon={copied ? Check : Copy}
          onClick={() => {
            navigator.clipboard?.writeText(issued?.password || '');
            setCopied(true);
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </Modal>
  );
};

export const Drawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, onClose, title, subtitle, children, footer }) => {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.div className="absolute inset-0 bg-[#0D1B3E]/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="absolute right-0 top-0 h-full w-full max-w-[560px] bg-white border-l border-[#DDE4EF] flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#EAEFF6]">
              <div className="min-w-0">
                <h3 className="mc-display text-[20px] font-semibold text-[#0D1B3E] truncate">{title}</h3>
                {subtitle && <div className="text-[13px] text-[#5B6885] mt-1">{subtitle}</div>}
              </div>
              <IconButton icon={X} label="Close" onClick={onClose} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-[#EAEFF6] flex justify-end gap-2">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ------------------------------------------------------------------ */
/* Unsaved changes                                                     */
/* ------------------------------------------------------------------ */

/** Floating bar shown while a form has edits that haven't been saved. */
export const SaveBar: React.FC<{
  show: boolean;
  onSave: () => void;
  onDiscard: () => void;
  message?: string;
  saveLabel?: string;
}> = ({ show, onSave, onDiscard, message = 'You have unsaved changes', saveLabel = 'Save changes' }) => (
  <AnimatePresence>
    {show && (
      <div className="fixed inset-x-0 bottom-5 z-[65] flex justify-center px-4 pointer-events-none">
        <motion.div
          role="region"
          aria-label="Unsaved changes"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.18 }}
          className="mc-admin pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] bg-[#0D1B3E] text-white pl-4 pr-2 py-2 shadow-[0_16px_40px_-12px_rgba(13,27,62,0.45)]"
        >
          <span className="flex items-center gap-2 text-[13.5px] font-medium">
            <span className="h-2 w-2 rounded-full bg-[#F2A93B]" aria-hidden />
            {message}
          </span>
          <span className="flex gap-1.5 ml-auto">
            <button
              type="button"
              onClick={onDiscard}
              className="h-10 px-3 rounded-[10px] text-[13.5px] font-semibold text-[#C3D0EA] hover:text-white hover:bg-white/10"
            >
              Discard
            </button>
            <Button variant="primary" onClick={onSave}>
              {saveLabel}
            </Button>
          </span>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/* ------------------------------------------------------------------ */
/* Table helpers                                                       */
/* ------------------------------------------------------------------ */

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...rest }) => (
  <th className={cx('px-4 py-2.5 text-left text-[12px] font-semibold text-[#5B6885] whitespace-nowrap bg-[#F7F9FC] border-b border-[#DDE4EF]', className)} {...rest} />
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...rest }) => (
  <td className={cx('px-4 py-3 text-[13.5px] text-[#26355A] align-middle', className)} {...rest} />
);

export const Avatar: React.FC<{ name: string; size?: number; tone?: 'blue' | 'ink' | 'soft' }> = ({ name, size = 34, tone = 'soft' }) => {
  const palettes = {
    blue: 'bg-[#2563EB] text-white',
    ink: 'bg-[#0D1B3E] text-white',
    soft: 'bg-[#E8F0FE] text-[#1D4FD7]',
  };
  const letters =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || '·';
  return (
    <span
      className={cx('mc-display inline-flex shrink-0 items-center justify-center rounded-[10px] font-semibold', palettes[tone])}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {letters}
    </span>
  );
};

export const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; className?: string }> = ({
  value,
  onChange,
  placeholder,
  className,
}) => (
  <div className={cx('relative', className)}>
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C97AE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" aria-label={placeholder || 'Search'} />
  </div>
);
