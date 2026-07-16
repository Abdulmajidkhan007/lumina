/**
 * Lumina — i18n bootstrap
 *
 * Initialises i18next + react-i18next with the English, Uzbek, and Russian
 * resource bundles. The active language is driven by `usePreferencesStore`'s
 * `locale` field ('en' | 'uz' | 'ru' | 'system'):
 *   - 'en' / 'uz' / 'ru' map directly to a bundled language.
 *   - 'system' would ideally defer to the device locale, but Lumina is a
 *     bare React Native app that intentionally avoids extra native modules
 *     just for locale detection — so 'system' falls back to English for
 *     now. Swapping in a native locale lookup later only requires changing
 *     `resolveLanguage` below.
 *
 * Import this module once, as a side effect, from the app root (see
 * src/providers/index.tsx) before any screen renders.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { usePreferencesStore } from '@/stores/preferences.store';
import type { AppLocale } from '@/stores/preferences.store';

import en from './locales/en.json';
import uz from './locales/uz.json';
import ru from './locales/ru.json';

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export const defaultNS = 'translation' as const;

const resources = {
  en: { translation: en },
  uz: { translation: uz },
  ru: { translation: ru },
} as const;

export type SupportedLanguage = keyof typeof resources;

// ---------------------------------------------------------------------------
// Locale resolution
// ---------------------------------------------------------------------------

/** Maps the persisted app locale preference to a bundled i18next language. */
function resolveLanguage(locale: AppLocale): SupportedLanguage {
  if (locale === 'en' || locale === 'uz' || locale === 'ru') {
    return locale;
  }
  // 'system' — no device-locale lookup wired up yet; default to English.
  return 'en';
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

const initialLocale = usePreferencesStore.getState().locale;

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(initialLocale),
  fallbackLng: 'en',
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

// Keep i18next in sync whenever the persisted locale preference changes —
// covers both `setAppLocale` calls and store rehydration completing after
// this module has already initialised i18next with the default value.
usePreferencesStore.subscribe((state, prevState) => {
  if (state.locale !== prevState.locale) {
    void i18n.changeLanguage(resolveLanguage(state.locale));
  }
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Updates the persisted app locale preference and the active i18next language. */
export function setAppLocale(locale: AppLocale): void {
  usePreferencesStore.getState().setLocale(locale);
}

export default i18n;
