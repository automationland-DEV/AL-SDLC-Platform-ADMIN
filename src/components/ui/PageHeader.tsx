import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ breadcrumbs, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="shrink-0 mb-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-2 flex-wrap">
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
            {crumb.href ? (
              <Link
                to={crumb.href}
                className="hover:text-sky-500 transition-colors font-medium truncate max-w-[160px]"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[var(--text-secondary)] font-semibold truncate max-w-[200px]">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] font-mono-code mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
