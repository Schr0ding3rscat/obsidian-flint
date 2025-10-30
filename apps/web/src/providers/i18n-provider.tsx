import i18next from 'i18next';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import en from '../translations/en.json';

if (!i18next.isInitialized) {
  i18next
    .use(initReactI18next)
    .init({
      resources: { en: { translation: en } },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: { escapeValue: false }
    })
    .catch((error) => {
      console.error('Failed to initialise i18n', error);
    });
}

type Props = {
  readonly children: ReactNode;
};

export const I18nProvider = ({ children }: Props) => {
  useEffect(() => {
    const locale = navigator.language || 'en-US';
    void i18next.changeLanguage(locale);
  }, []);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
};
