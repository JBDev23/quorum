import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from '../locales/es.json';
import en from '../locales/en.json';

const resources = {
  es: { translation: es },
  en: { translation: en },
};

const LANGUAGE_KEY = 'app_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
    } catch (error) {
      console.error('Error reading language', error);
    }
    const languageTag = Localization.getLocales()[0]?.languageCode || 'es';
    callback(languageTag === 'en' ? 'en' : 'es');
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.error('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    compatibilityJSON: 'v4', // Required for React Native
  });

export default i18n;
