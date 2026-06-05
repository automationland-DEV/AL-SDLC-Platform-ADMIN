import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Card({ title, subtitle, children, className = '', actions }: CardProps) {
  return (
    <div className={`bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--border-color)] ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>}
            {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
