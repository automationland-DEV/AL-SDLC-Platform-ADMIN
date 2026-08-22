import { useSettingsStore } from '../hooks/useSettings';
import { translations } from './translations';
import type { Language } from './translations';

export function useTranslation() {
  const language = useSettingsStore((state) => state.language) as Language;
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const t = (key: keyof typeof translations['vi'], params?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations['vi'];
    let text = langDict[key] || translations['vi'][key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }

    return text;
  };

  return { t, language, setLanguage };
}
