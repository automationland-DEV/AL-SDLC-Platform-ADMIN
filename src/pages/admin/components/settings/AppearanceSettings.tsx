import { Sun, Moon, Monitor } from 'lucide-react';
import { useSettings } from '../../../../hooks/useSettings';
import type { ThemeMode, FontSize } from '../../../../hooks/useSettings';

export function AppearanceSettings() {
  const { theme, setTheme, fontSize, setFontSize } = useSettings();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      
      {/* Appearance Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Giao diện</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tùy chỉnh giao diện và trải nghiệm ứng dụng.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'light', label: 'Sáng', desc: 'Luôn sáng', icon: Sun },
            { id: 'dark', label: 'Tối', desc: 'Luôn tối', icon: Moon },
            { id: 'system', label: 'Theo hệ thống', desc: 'Đồng bộ với thiết bị', icon: Monitor }
          ].map(mode => {
            const Icon = mode.icon;
            const isSelected = theme === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setTheme(mode.id as ThemeMode)}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <Icon className={`w-6 h-6 mb-3 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'}`}>
                  {mode.label}
                </span>
                <span className={`text-xs mt-1 ${isSelected ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400'}`}>
                  {mode.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Size Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Kích thước chữ</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Điều chỉnh độ lớn của văn bản trên toàn hệ thống.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'small', label: 'Nhỏ', desc: 'Hiển thị gọn gàng', sizeClass: 'text-xs' },
            { id: 'medium', label: 'Mặc định', desc: 'Kích thước chuẩn', sizeClass: 'text-sm' },
            { id: 'large', label: 'Lớn', desc: 'Dễ đọc hơn', sizeClass: 'text-base' },
            { id: 'xlarge', label: 'Rất lớn', desc: 'Kích thước tối đa', sizeClass: 'text-lg' }
          ].map(size => {
            const isSelected = fontSize === size.id;
            return (
              <button
                key={size.id}
                onClick={() => setFontSize(size.id as FontSize)}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className={`font-bold mb-3 ${size.sizeClass} ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                  A
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'}`}>
                  {size.label}
                </span>
                <span className={`text-xs mt-1 ${isSelected ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400'}`}>
                  {size.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
