'use client';

import ThemeProvider from './components/ThemeProvider';
import { I18nProvider } from '../lib/i18n-provider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider />
      {children}
    </I18nProvider>
  );
}
