import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import type { Language } from '../i18n/translations';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: 'vi', label: 'VI', flag: '🇻🇳' },
    { id: 'en', label: 'EN', flag: '🇺🇸' },
  ];

  const currentLang = languages.find((l) => l.id === language) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-semibold font-mono-code transition-all cursor-pointer"
        title="Chuyển đổi ngôn ngữ / Switch Language"
      >
        <Globe className="w-3.5 h-3.5 text-sky-500" />
        <span>{currentLang.flag}</span>
        <span>{currentLang.label}</span>
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-36 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl py-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {languages.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setLanguage(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                language === item.id
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{item.flag}</span>
                <span>{item.id === 'vi' ? 'Tiếng Việt' : 'English'}</span>
              </div>
              {language === item.id && <span className="text-sky-500 font-bold">•</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
