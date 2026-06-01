/**
 * Lumina — 404 Not Found screen
 *
 * Shown when the router cannot match any route. Themed with a "Go home" button.
 */

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';

export default function NotFoundScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();

  const goHome = useCallback(() => {
    router.replace('/(protected)/(tabs)');
  }, [router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii['2xl'],
              padding: theme.spacing['2xl'],
              marginBottom: theme.spacing.xl,
              ...theme.shadows.sm,
            },
          ]}
        >
          <Ionicons
            name="compass-outline"
            size={48}
            color={theme.colors.textTertiary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>

        <Text
          variant="display"
          color="primary"
          align="center"
          style={{ marginBottom: theme.spacing.sm }}
        >
          404
        </Text>

        <Text
          variant="headline"
          color="primary"
          align="center"
          style={{ marginBottom: theme.spacing.sm }}
        >
          Page not found
        </Text>

        <Text
          variant="callout"
          color="secondary"
          align="center"
          style={{ marginBottom: theme.spacing['3xl'], maxWidth: 280 }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Text>

        <Button
          label="Go home"
          variant="primary"
          size="md"
          onPress={goHome}
          accessibilityLabel="Navigate to home screen"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
