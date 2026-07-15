/**
 * Lumina — App root
 *
 * AppProviders already supplies GestureHandlerRootView, SafeAreaProvider,
 * the persisted QueryClient, and ThemeProvider. The NavigationContainer
 * theme is derived from the design-system theme inside that context.
 */

import React, { useMemo } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import { useTheme } from '@/design-system';
import { RootNavigator } from '@/navigation';
import { AppProviders } from '@/providers';
import { initSentry } from '@/lib/sentry';

// Must run before anything else so early startup errors are captured.
// No-ops until `Config.SENTRY_DSN` (src/constants/config.ts) is configured.
initSentry();

function ThemedNavigationContainer(): React.JSX.Element {
  const theme = useTheme();

  const navigationTheme = useMemo<NavigationTheme>(() => {
    const base = theme.colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.accent,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
        notification: theme.colors.accent,
      },
    };
  }, [theme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App(): React.JSX.Element {
  return (
    <AppProviders>
      <ThemedNavigationContainer />
    </AppProviders>
  );
}
