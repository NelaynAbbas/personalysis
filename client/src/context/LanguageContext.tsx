import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

interface LanguageContextType {
  language: string;
  languages: Language[];
  changeLanguage: (code: string) => Promise<void>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [isRTL, setIsRTL] = useState(i18n.language === 'ar');

  // Update RTL attribute when language changes
  useEffect(() => {
    const isArabic = language === 'ar';
    setIsRTL(isArabic);
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = async (code: string) => {
    try {
      await i18n.changeLanguage(code);
      setLanguage(code);
      // Save to localStorage
      localStorage.setItem('preferredLanguage', code);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const value: LanguageContextType = {
    language,
    languages: SUPPORTED_LANGUAGES,
    changeLanguage,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
