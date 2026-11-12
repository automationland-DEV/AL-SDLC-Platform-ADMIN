import { X } from 'lucide-react';
import { QUICK_SHIFTS } from './schedule-utils';

export interface StaffOption {
  value: string;
  label: string;
  email?: string;
  avatar?: string;
  avatarFrame?: string | null;
}

export function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const cls =
    size === 'sm'
      ? 'h-7 w-7 text-[11px]'
      : size === 'lg'
        ? 'h-11 w-11 text-base'
        : 'h-9 w-9 text-sm';
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${cls} rounded-full border border-[var(--border-color)] object-cover`}
      />
    );
  }
  return (
    <div
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/25 to-violet-500/25 font-bold text-sky-600 dark:text-sky-300`}
    >
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );
}

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] px-5 py-4">
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex gap-2 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/40 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function FieldLabel({ step, children }: { step?: string; children: React.ReactNode }) {
  return (
    <label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
      {step && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
          {step}
        </span>
      )}
      {children}
    </label>
  );
}

export function Card({
  title,
  description,
  icon,
  children,
  actions,
  tone = 'sky',
  className = '',
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  tone?: 'sky' | 'emerald' | 'purple' | 'violet';
  className?: string;
}) {
  const toneClass = {
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  }[tone];

  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs ${className}`}>
      <div className="flex flex-col gap-3 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneClass}`}>{icon}</div>
          )}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
            {description && <p className="text-xs text-[var(--text-muted)]">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Bộ chọn ca nhanh dùng chung cho modal gán/sửa và form mẫu tuần. */
export function QuickShiftPicker({
  start,
  end,
  onPick,
  vi,
}: {
  start: string;
  end: string;
  onPick: (start: string, end: string, title: string) => void;
  vi: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {QUICK_SHIFTS.map((q) => (
        <button
          key={q.id}
          type="button"
          onClick={() => onPick(q.start, q.end, vi ? q.titleVi : q.titleEn)}
          className={`rounded-xl border-2 px-2 py-2 text-xs font-bold transition-all ${
            start === q.start && end === q.end
              ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
              : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-sky-500/50'
          }`}
        >
          {vi ? q.labelVi : q.labelEn}
        </button>
      ))}
    </div>
  );
}

/** Chọn thứ trong tuần (0 = Chủ nhật). */
export function WeekdayPicker({
  value,
  onChange,
  language,
}: {
  value: number;
  onChange: (weekday: number) => void;
  language: string;
}) {
  const labels = language === 'vi'
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {[1, 2, 3, 4, 5, 6, 0].map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => onChange(day)}
          className={`rounded-xl border-2 py-2 text-xs font-bold transition-all ${
            value === day
              ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
              : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
          }`}
        >
          {labels[day]}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-14 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-base font-bold text-[var(--text-primary)]">{title}</p>
      {hint && <p className="max-w-sm text-sm text-[var(--text-muted)]">{hint}</p>}
      {action}
    </div>
  );
}
