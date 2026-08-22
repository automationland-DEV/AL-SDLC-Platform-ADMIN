import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-180 ease-in-out cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const variants = {
    primary:
      'bg-sky-600 text-white hover:bg-sky-500 shadow-sm border border-sky-500/30 dark:bg-sky-600 dark:hover:bg-sky-500 dark:border-sky-400/30',
    secondary:
      'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)] shadow-xs',
    outline:
      'bg-transparent border border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 dark:hover:bg-sky-500/20',
    danger:
      'bg-rose-600 text-white hover:bg-rose-500 shadow-sm border border-rose-500/30 dark:bg-rose-600 dark:hover:bg-rose-500',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs font-medium gap-1.5',
    md: 'px-3.5 py-2 text-sm font-medium gap-2',
    lg: 'px-5 py-2.5 text-base font-semibold gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
