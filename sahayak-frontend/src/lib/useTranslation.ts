import { useState, useEffect } from 'react';
import { en } from '@/locales/en';
import { as } from '@/locales/as';
import { hi } from '@/locales/hi';

// Dictionary mapping language names to translation objects
const dictionaries: Record<string, Record<string, string>> = {
  English: en,
  Assamese: as,
  Hindi: hi,
  Bengali: en // Fallback to EN for now
};

export function useTranslation(languagePreference?: string) {
  const [lang, setLang] = useState('English');
  const [dict, setDict] = useState<Record<string, string>>(en);

  useEffect(() => {
    if (languagePreference) {
      setLang(languagePreference);
      // Safely retrieve the dictionary; fallback to English if missing
      const selected = dictionaries[languagePreference as keyof typeof dictionaries] as Record<string, string>;
      setDict(selected || en);
    }
  }, [languagePreference]);

  const t = (key: string): string => {
    const dictRecord = dict as Record<string, string>;
    if (dictRecord && key in dictRecord) return dictRecord[key];
    const enRecord = en as Record<string, string>;
    if (key in enRecord) return enRecord[key];
    return key;
  };

  return { t, lang };
}
