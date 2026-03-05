import en from './en';
import hi from './hi';
import te from './te';

const translations = {
  en,
  hi,
  te,
};

export const getTranslation = (languageCode, key) => {
  const keys = key.split('.');
  let translation = translations[languageCode] || translations.en;
  
  for (const k of keys) {
    translation = translation[k];
    if (!translation) {
      // Fallback to English if translation not found
      translation = translations.en;
      for (const fallbackKey of keys) {
        translation = translation[fallbackKey];
        if (!translation) return key;
      }
      return translation;
    }
  }
  
  return translation;
};

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

export default translations;
