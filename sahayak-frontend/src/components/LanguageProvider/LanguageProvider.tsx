"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, LANGUAGES, getTranslation } from '@/lib/i18n';
import { BCP47_LOCALES, speakText } from '@/lib/speech';
import { apiClient } from '@/lib/apiClient';

type LanguageContextProps = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  speak: (text: string) => void;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

function applyDir(lang: LanguageCode) {
  const isRTL = !!LANGUAGES[lang]?.rtl;
  if (typeof document !== 'undefined') {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = BCP47_LOCALES[lang] || lang;
  }
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // On mount: load from localStorage first, then profile API will override via setLanguage call
  useEffect(() => {
    const saved = localStorage.getItem('sahayak_lang') as LanguageCode;
    if (saved && LANGUAGES[saved]) {
      setLanguageState(saved);
      applyDir(saved);
      return;
    }
    // Try to read from the profile API in case the user is already logged in
    apiClient('/api/profile')
      .then(r => r.json())
      .then(data => {
        const langPref = data?.profile?.languagePreference as LanguageCode;
        if (langPref && LANGUAGES[langPref]) {
          setLanguageState(langPref);
          localStorage.setItem('sahayak_lang', langPref);
          applyDir(langPref);
        }
      })
      .catch(() => {/* not logged in, keep English */});
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    if (!LANGUAGES[lang]) return;
    setLanguageState(lang);
    localStorage.setItem('sahayak_lang', lang);
    applyDir(lang);
  };

  const t = (key: string, fallback: string = '') => getTranslation(language, key, fallback);

  const speak = (text: string) => {
    speakText(text, language);
  };

  const isRTL = !!LANGUAGES[language]?.rtl;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, speak, isRTL }}>
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100%' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
