import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from '../locales/translations/en.json';
import es from '../locales/translations/es.json';
import it from '../locales/translations/it.json';
import fr from '../locales/translations/fr.json';
import de from '../locales/translations/de.json';
import ar from '../locales/translations/ar.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  it: { translation: it },
  fr: { translation: fr },
  de: { translation: de },
  ar: { translation: ar },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // Disable suspense for initial load
    },
  });

export default i18n;
