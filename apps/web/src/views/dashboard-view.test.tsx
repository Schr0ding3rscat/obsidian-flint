import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import en from '../translations/en.json';

import DashboardView from './dashboard-view';

describe('DashboardView', () => {
  beforeAll(async () => {
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({
        resources: { en: { translation: en } },
        lng: 'en'
      });
    }
  });

  it('renders onboarding hero copy', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <DashboardView />
      </I18nextProvider>
    );

    expect(screen.getByText(en['app.onboarding'])).toBeInTheDocument();
    expect(screen.getByText(en['dashboard.recentNotes'])).toBeInTheDocument();
  });
});
