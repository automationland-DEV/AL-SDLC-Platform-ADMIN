import type { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  actions?: ReactNode;
  hoverable?: boolean;
}

export function Card({
  title,
  subtitle,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  actions,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={`bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] transition-all duration-200 ${
        hoverable ? 'hover:border-[var(--border-hover)] hover:-translate-y-0.5 hover:shadow-md' : 'shadow-xs'
      } ${className}`}
    >
      {(title || actions || subtitle) && (
        <div className={`px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between gap-4 ${headerClassName}`}>
          <div className="min-w-0">
            {title && (
              typeof title === 'string' ? (
                <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight truncate">{title}</h3>
              ) : (
                title
              )
            )}
            {subtitle && (
              typeof subtitle === 'string' ? (
                <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{subtitle}</p>
              ) : (
                subtitle
              )
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
