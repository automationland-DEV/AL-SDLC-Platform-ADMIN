import { Sun, Moon, Monitor, Globe } from 'lucide-react';
import { useSettings } from '../../../../hooks/useSettings';
import { useTranslation } from '../../../../i18n/useTranslation';
import type { ThemeMode, FontSize, LanguageMode } from '../../../../hooks/useSettings';

export function AppearanceSettings() {
  const { theme, setTheme, fontSize, setFontSize } = useSettings();
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">

      {/* Language Section */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <Globe className="w-4 h-4 text-sky-500 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">{t('settings.language')}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('settings.languageDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'vi' as LanguageMode, flag: '🇻🇳', label: 'Tiếng Việt', desc: 'Vietnamese' },
            { id: 'en' as LanguageMode, flag: '🇺🇸', label: 'English', desc: 'Tiếng Anh' },
          ].map((lang) => {
            const isSelected = language === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/5 dark:bg-sky-500/10'
                    : 'border-[var(--border-color)] hover:border-sky-300 hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span className="text-2xl shrink-0">{lang.flag}</span>
                <div>
                  <p className={`text-sm font-bold ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-[var(--text-primary)]'}`}>
                    {lang.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-sky-500' : 'text-[var(--text-muted)]'}`}>
                    {lang.desc}
                  </p>
                </div>
                {isSelected && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
        <div className="mb-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">{t('settings.appearance')}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('settings.appearanceDesc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: 'light', labelKey: 'settings.light' as const, desc: language === 'vi' ? 'Luôn sáng' : 'Always light', icon: Sun },
            { id: 'dark', labelKey: 'settings.dark' as const, desc: language === 'vi' ? 'Luôn tối' : 'Always dark', icon: Moon },
            { id: 'system', labelKey: 'settings.system' as const, desc: language === 'vi' ? 'Đồng bộ với thiết bị' : 'Sync with device', icon: Monitor },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = theme === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setTheme(mode.id as ThemeMode)}
                className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/5 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-sky-300 hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2.5 ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-[var(--text-muted)]'}`} />
                <span className={`text-xs font-bold ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-[var(--text-primary)]'}`}>
                  {t(mode.labelKey)}
                </span>
                <span className={`text-[11px] mt-0.5 ${isSelected ? 'text-sky-500' : 'text-[var(--text-muted)]'}`}>
                  {mode.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Size Section */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
        <div className="mb-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">{t('settings.textSize')}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('settings.textSizeDesc')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'small', label: language === 'vi' ? 'Nhỏ' : 'Small', desc: language === 'vi' ? 'Gọn gàng' : 'Compact', sizeClass: 'text-xs' },
            { id: 'medium', label: language === 'vi' ? 'Mặc định' : 'Default', desc: language === 'vi' ? 'Tiêu chuẩn' : 'Standard', sizeClass: 'text-sm' },
            { id: 'large', label: language === 'vi' ? 'Lớn' : 'Large', desc: language === 'vi' ? 'Dễ đọc' : 'Readable', sizeClass: 'text-base' },
            { id: 'xlarge', label: language === 'vi' ? 'Rất lớn' : 'Extra Large', desc: language === 'vi' ? 'Tối đa' : 'Maximum', sizeClass: 'text-lg' },
          ].map((size) => {
            const isSelected = fontSize === size.id;
            return (
              <button
                key={size.id}
                onClick={() => setFontSize(size.id as FontSize)}
                className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/5 dark:bg-sky-500/10'
                    : 'border-[var(--border-color)] hover:border-sky-300 hover:bg-[var(--bg-hover)]'
                }`}
              >
                <div className={`font-extrabold mb-2 ${size.sizeClass} ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-[var(--text-muted)]'}`}>
                  A
                </div>
                <span className={`text-xs font-bold ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-[var(--text-primary)]'}`}>
                  {size.label}
                </span>
                <span className={`text-[11px] mt-0.5 ${isSelected ? 'text-sky-500' : 'text-[var(--text-muted)]'}`}>
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
