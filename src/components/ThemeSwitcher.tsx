import { useTheme } from '../hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: "dropdown" | "compact";
  className?: string;
}

export default function ThemeSwitcher({ variant = "dropdown", className = "" }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  const options = [
    {
      id: "light",
      label: "Sáng",
      icon: Sun,
      description: "Luôn sáng",
    },
    {
      id: "dark",
      label: "Tối",
      icon: Moon,
      description: "Luôn tối",
    },
    {
      id: "system",
      label: "Hệ thống",
      icon: Monitor,
      description: "Theo thiết bị",
    },
  ];

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setTheme(option.id as "light" | "dark" | "system")}
              title={option.label}
              className={`p-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Giao diện</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Tùy chỉnh giao diện ứng dụng
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setTheme(option.id as "light" | "dark" | "system")}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                isActive
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
