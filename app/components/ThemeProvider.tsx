'use client';

import { useEffect } from 'react';
import { storage } from '../../lib/utils';

type ThemeProviderProps = {};

const applyTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle('dark', isDark);
};

export const setDarkTheme = (isDark: boolean) => {
  if (typeof window === 'undefined') return;
  const params = storage.get<Record<string, any>>('params', {});
  const nextParams = { ...params, darkMode: isDark };
  storage.set('params', nextParams);
  applyTheme(isDark);
};

export default function ThemeProvider({}: ThemeProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = storage.get<Record<string, any>>('params', {});
    const darkMode = Boolean(params?.darkMode);
    applyTheme(darkMode);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'params') return;
      try {
        const value = event.newValue ? JSON.parse(event.newValue) : null;
        applyTheme(Boolean(value?.darkMode));
      } catch {
        applyTheme(false);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return null;
}
