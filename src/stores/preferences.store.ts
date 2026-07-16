import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvZustandStorage } from '@/lib/mmkv';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The design system's ThemeProvider reads `colorSchemePreference` from this
 * store via a dynamic require. Keep the field name in sync with theme.ts.
 */
export type ColorSchemePreference = 'light' | 'dark' | 'system';

/**
 * App locale preference — read by src/i18n/index.ts to initialise and
 * update i18next's active language. 'system' defers to the device locale
 * where available and falls back to English otherwise.
 */
export type AppLocale = 'en' | 'uz' | 'ru' | 'system';

type PreferencesState = {
  /** Colour scheme preference — read by design-system/theme/theme.ts */
  colorSchemePreference: ColorSchemePreference;
  autoplayVideos: boolean;
  hapticsEnabled: boolean;
  /** App locale preference — read by src/i18n/index.ts */
  locale: AppLocale;
};

type PreferencesActions = {
  setColorSchemePreference(pref: ColorSchemePreference): void;
  setAutoplayVideos(enabled: boolean): void;
  setHapticsEnabled(enabled: boolean): void;
  setLocale(locale: AppLocale): void;
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
  persist(
    (set) => ({
      colorSchemePreference: 'system',
      autoplayVideos: true,
      hapticsEnabled: true,
      locale: 'system',

      setColorSchemePreference(pref) {
        set({ colorSchemePreference: pref });
      },

      setAutoplayVideos(enabled) {
        set({ autoplayVideos: enabled });
      },

      setHapticsEnabled(enabled) {
        set({ hapticsEnabled: enabled });
      },

      setLocale(locale) {
        set({ locale });
      },
    }),
    {
      name: 'lumina_preferences',
      storage: createJSONStorage(() => mmkvZustandStorage),
    },
  ),
);

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

/** Used by the design system's ThemeProvider to read colour scheme preference */
export const useThemeMode = () =>
  usePreferencesStore((s) => s.colorSchemePreference);

export const useAutoplayVideos = () =>
  usePreferencesStore((s) => s.autoplayVideos);

export const useHapticsEnabled = () =>
  usePreferencesStore((s) => s.hapticsEnabled);

/** Used by src/i18n to resolve and react to the active app locale */
export const useLocale = () => usePreferencesStore((s) => s.locale);
