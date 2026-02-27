import { createContext, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹', dir: 'ltr' },
  { code: 'om', name: 'Afaan Oromoo', flag: '🇪🇹', dir: 'ltr' },
  { code: 'ti', name: 'ትግርኛ', flag: '🇪🇹', dir: 'ltr' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', dir: 'ltr' },
];

export function LanguageProvider({ children }) {
  const { i18n, t } = useTranslation();

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = useCallback(async (langCode) => {
    try {
      await i18n.changeLanguage(langCode);
      localStorage.setItem('i18nextLng', langCode);
      
      // Update document direction and language
      document.documentElement.lang = langCode;
      document.documentElement.dir = languages.find(l => l.code === langCode)?.dir || 'ltr';
      
      return true;
    } catch (error) {
      console.error('Failed to change language:', error);
      return false;
    }
  }, [i18n]);

  const value = {
    currentLanguage,
    languages,
    changeLanguage,
    t,
    i18n,
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
