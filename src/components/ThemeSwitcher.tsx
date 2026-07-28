import { Sun, Moon, Monitor } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface ThemeSwitcherProps {
  variant?: 'dropdown' | 'compact';
  className?: string;
}

export default function ThemeSwitcher({ variant = 'dropdown', className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useSettings();

  const options = [
    {
      id: 'light',
      label: 'Sáng',
      icon: Sun,
      description: 'Luôn sáng',
    },
    {
      id: 'dark',
      label: 'Tối',
      icon: Moon,
      description: 'Luôn tối',
    },
    {
      id: 'system',
      label: 'Hệ thống',
      icon: Monitor,
      description: 'Theo thiết bị',
    },
  ];

  if (variant === 'compact') {
    const currentIndex = options.findIndex((o) => o.id === theme) >= 0 ? options.findIndex((o) => o.id === theme) : 0;
    const currentOption = options[currentIndex];
    const Icon = currentOption.icon;

    const cycleTheme = () => {
      const nextIndex = (currentIndex + 1) % options.length;
      setTheme(options[nextIndex].id as 'light' | 'dark' | 'system');
    };

    return (
      <button
        onClick={cycleTheme}
        title={`Giao diện: ${currentOption.label}`}
        className={`p-2 rounded-lg transition-all duration-180 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer active:scale-95 ${className}`}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Giao diện hệ thống</h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Tùy chỉnh chế độ hiển thị console</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setTheme(option.id as 'light' | 'dark' | 'system')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-180 cursor-pointer ${
                isActive
                  ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Icon className="w-4 h-4 mb-1.5" />
              <span className="text-xs font-semibold">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
