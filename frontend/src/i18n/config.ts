import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

const STORAGE_KEY = 'fortiflow_language';

i18n
  .use(HttpBackend) // Load translations from /public/locales
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    fallbackLng: 'en', // Default language: English
    lng: localStorage.getItem(STORAGE_KEY) || undefined, // Use stored language if available
    debug: import.meta.env.DEV, // Enable debug in development

    // Namespaces for organizing translations
    ns: ['common', 'auth', 'settings', 'routines', 'billing', 'statistics', 'community', 'components'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Detection options
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser language
      caches: ['localStorage'], // Save user's choice
      lookupLocalStorage: STORAGE_KEY,
    },

    // Backend options for loading translation files
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // React options
    react: {
      useSuspense: true, // Use Suspense for loading
    },
  });

// Update localStorage when language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng; // Update HTML lang attribute
});

export default i18n;
