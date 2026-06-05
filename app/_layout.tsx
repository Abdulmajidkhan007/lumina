/**
 * Lumina — Root Layout
 *
 * Wraps everything in AppProviders, handles auth hydration, and shows
 * a branded splash while status is idle/loading. Redirects to the correct
 * route group once the auth status settles.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';

import { AppProviders } from '@/providers';
import { useAuthStore, useAuthStatus } from '@/stores/auth.store';
import { Spinner } from '@/design-system/primitives/Spinner';
import { Text } from '@/design-system/primitives/Text';
import { useTheme } from '@/design-system/theme';

// Keep the native splash screen visible until we are ready.
void SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// Branded splash shown while auth hydrates
// ---------------------------------------------------------------------------

function BrandedSplash(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[styles.splash, { backgroundColor: theme.colors.background }]}
      accessibilityRole="none"
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        colors={theme.colors.accentGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoGradient}
      >
        <Text variant="title" color="inverse" style={styles.logoText}>
          Lumina
        </Text>
      </LinearGradient>
      <Spinner
        size="md"
        colorVariant="accent"
        style={{ marginTop: theme.spacing['3xl'] }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Auth gate — lives inside AppProviders so stores/query are available
// ---------------------------------------------------------------------------

function AuthGate(): React.JSX.Element {
  const hydrate = useAuthStore((s) => s.hydrate);
  const status = useAuthStatus();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status !== 'idle' && status !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'idle' || status === 'loading') {
    return <BrandedSplash />;
  }

  if (status === 'authenticated') {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  // unauthenticated
  return <Redirect href="/(auth)/login" />;
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout(): React.JSX.Element {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

function RootNavigator(): React.JSX.Element {
  const status = useAuthStatus();
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.colorScheme === 'dark' ? 'light' : 'dark'} />
      {status === 'idle' || status === 'loading' ? (
        <AuthGate />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        </Stack>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    letterSpacing: 2,
  },
});
