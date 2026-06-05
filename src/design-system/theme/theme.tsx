/**
 * Lumina Design System — Theme
 *
 * Combines semantic colors with shared tokens into a fully typed Theme object.
 * Provides ThemeContext, ThemeProvider, and useTheme hook.
 */

// Metro/Node require is available at runtime but not in the TS lib when
// expo/tsconfig.base is absent. Declare it narrowly to avoid @types/node.
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  darkColors,
  lightColors,
  radii,
  shadows,
  spacing,
  tokens,
  typography,
  type SemanticColors,
  type SpacingScale,
  type RadiiScale,
  type TypographyScale,
  type ShadowScale,
  type Tokens,
} from './tokens';

declare const require: ((id: string) => unknown) | undefined;

// ---------------------------------------------------------------------------
// Theme shape
// ---------------------------------------------------------------------------

export interface Theme {
  /** Current color scheme */
  colorScheme: 'light' | 'dark';
  /** Semantic color set for the active scheme */
  colors: SemanticColors;
  spacing: SpacingScale;
  radii: RadiiScale;
  typography: TypographyScale;
  shadows: ShadowScale;
  tokens: Tokens;
}

// ---------------------------------------------------------------------------
// Concrete theme objects
// ---------------------------------------------------------------------------

const sharedTokens: Omit<Theme, 'colorScheme' | 'colors'> = {
  spacing,
  radii,
  typography,
  shadows,
  tokens,
};

export const lightTheme: Theme = {
  colorScheme: 'light',
  colors: lightColors,
  ...sharedTokens,
} as const;

export const darkTheme: Theme = {
  colorScheme: 'dark',
  colors: darkColors,
  ...sharedTokens,
} as const;

// ---------------------------------------------------------------------------
// Color scheme override preference
// ---------------------------------------------------------------------------

export type ColorSchemePreference = 'light' | 'dark' | 'system';

// ---------------------------------------------------------------------------
// Defensive import of preferences store
// This resolves at runtime so the design system compiles even if the store
// hasn't been created yet.
// ---------------------------------------------------------------------------

type PreferencesStore = {
  colorSchemePreference: ColorSchemePreference;
};

type StoreSelector = (selector: (s: PreferencesStore) => ColorSchemePreference) => ColorSchemePreference;

/**
 * Stable fallback selector hook — always returns 'system'.
 * Used when the preferences store hasn't been created yet.
 */
const fallbackSelector: StoreSelector = () => 'system';

/**
 * Resolved at module load time. If the store exists it will be a real Zustand
 * hook; otherwise it is the stable fallback above. Either way the value is a
 * stable function reference so it will never change after initialisation,
 * which makes calling it unconditionally inside ThemeProvider safe.
 *
 * TODO: replace with a real import once src/stores/preferences.store exists:
 * import { usePreferencesStore } from '@/stores/preferences.store';
 */
const resolvedStoreSelector: StoreSelector = (() => {
  try {
    // Metro bundler resolves require() at build time. The try/catch ensures
    // this compiles even when the store module doesn't exist yet.
    if (typeof require === 'function') {
      const mod = (require as (id: string) => { usePreferencesStore?: StoreSelector })(
        '@/stores/preferences.store',
      );
      if (mod && typeof mod.usePreferencesStore === 'function') {
        return mod.usePreferencesStore;
      }
    }
  } catch {
    // Store not yet created — fall back to system colour scheme
  }
  return fallbackSelector;
})();

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  theme: Theme;
  /** Manually override the colour scheme */
  setPreference: (pref: ColorSchemePreference) => void;
  preference: ColorSchemePreference;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: ReactNode;
  /** Override colour scheme — useful for Storybook / testing */
  forcedScheme?: ColorSchemePreference;
}

export function ThemeProvider({ children, forcedScheme }: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme() ?? 'light';

  // Local state for preference — used when the preferences store is absent
  const [localPreference, setLocalPreference] = useState<ColorSchemePreference>('system');

  // Read from Zustand preferences store (or fallback that returns 'system')
  // resolvedStoreSelector is a stable reference set at module load time —
  // calling it unconditionally satisfies the Rules of Hooks.
  const storePreference = resolvedStoreSelector((s) => s.colorSchemePreference);

  const preference: ColorSchemePreference =
    forcedScheme ?? storePreference ?? localPreference;

  const resolvedScheme: 'light' | 'dark' =
    preference === 'system' ? systemScheme : preference;

  const theme = resolvedScheme === 'dark' ? darkTheme : lightTheme;

  const setPreference = useCallback((pref: ColorSchemePreference) => {
    setLocalPreference(pref);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setPreference, preference }),
    [theme, setPreference, preference],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx.theme;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return ctx;
}
