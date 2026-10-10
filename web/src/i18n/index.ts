/* eslint-disable */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCallback } from 'react';
import { id } from './id';
import { en } from './en';

const translations = { id, en };
export type Language = 'id' | 'en';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nStore>()(
  persist(
    (set) => ({
      language: 'id',
      setLanguage: (lang) => {
        set({ language: lang });
        if (typeof document !== 'undefined') {
          document.documentElement.lang = lang;
        }
      },
    }),
    { name: 'lyra-language' }
  )
);

export function useTranslation() {
  const { language } = useI18nStore();
  
  return useCallback((key: string): string => {
    const dict = translations[language] as any;
    const val = key.split('.').reduce((obj, k) => (obj || {})[k], dict as any);
    return typeof val === 'string' ? val : (key.split('.').pop() || '');
  }, [language]);
}
