import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full ${
              icon ? 'pl-9' : 'px-3.5'
            } py-2 bg-[var(--bg-input)] border rounded-lg text-sm transition-all duration-180 ease-in-out focus:outline-none ${
              error
                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30 text-rose-900 dark:text-rose-200'
                : 'border-[var(--border-color)] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-[var(--text-primary)] placeholder-[var(--text-muted)]'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-muted)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
