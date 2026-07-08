/**
 * Lumina — Branded splash
 *
 * Shown while auth status is `idle`/`loading` (i.e. while `hydrate()` is
 * reading the stored session). Renders the gradient Lumina wordmark plus a
 * spinner. Ported from the old expo-router root layout's `BrandedSplash`.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { Spinner, Text, useTheme } from '@/design-system';

export function BrandedSplash(): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[styles.splash, { backgroundColor: theme.colors.background }]}
      accessibilityRole="none"
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        colors={[...theme.colors.accentGradient]}
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
