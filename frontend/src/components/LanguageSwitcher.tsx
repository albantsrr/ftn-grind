import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const isEnglish = currentLanguage === 'en';

  const toggleLanguage = () => {
    const newLanguage = isEnglish ? 'fr' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      title={`Switch to ${isEnglish ? 'Français' : 'English'}`}
      aria-label={`Switch to ${isEnglish ? 'French' : 'English'}`}
    >
      <span className="text-2xl" role="img" aria-label={isEnglish ? 'English' : 'French'}>
        {isEnglish ? '🇬🇧' : '🇫🇷'}
      </span>
    </button>
  );
}
