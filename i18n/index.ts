import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en.json';
import es from '../locales/es.json';
import ur from '../locales/ur.json';

const LANGUAGE_KEY = '@kidnest/language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const resources = {
  en: { translation: en },
  es: { translation: es },
  ur: { translation: ur },
};

const deviceLanguage = RNLocalize.getLocales()[0]?.languageCode ?? 'en';
const fallbackLng = Object.keys(resources).includes(deviceLanguage) ? deviceLanguage : 'en';

void i18n.use(initReactI18next).init({
  resources,
  lng: fallbackLng,
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false },
});

export async function hydrateLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored && Object.keys(resources).includes(stored)) {
      await i18n.changeLanguage(stored);
    }
  } catch {
    /* ignore */
  }
}

export async function changeAppLanguage(code: LanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
  await AsyncStorage.setItem(LANGUAGE_KEY, code);
}

export default i18n;
