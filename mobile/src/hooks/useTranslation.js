import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../locales';

export const useTranslation = () => {
  const { currentLanguage } = useLanguage();

  const t = (key) => {
    return getTranslation(currentLanguage, key);
  };

  return { t, currentLanguage };
};
