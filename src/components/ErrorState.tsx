/**
 * Lumina — ErrorState component
 *
 * Centered, theme-aware error state with an icon, message, and a retry
 * button. Used when a screen or section fails to load.
 *
 * Usage:
 *   <ErrorState message="Couldn't load posts." onRetry={refetch} />
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  /** Custom Ionicons icon name. Defaults to alert-circle-outline */
  icon?: keyof typeof Ionicons.glyphMap;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
  icon = 'alert-circle-outline',
}: ErrorStateProps): React.JSX.Element {
  const theme = useTheme();

  return (
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
          name={icon}
          size={40}
          color={theme.colors.danger}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>

      <Text
        variant="headline"
        color="primary"
        align="center"
        style={{ marginBottom: theme.spacing.sm }}
      >
        Oops
      </Text>

      <Text
        variant="callout"
        color="secondary"
        align="center"
        style={{ marginBottom: theme.spacing.xl, maxWidth: 280 }}
      >
        {message}
      </Text>

      {onRetry !== undefined ? (
        <Button
          label="Try again"
          variant="secondary"
          size="md"
          onPress={onRetry}
          accessibilityLabel="Retry loading"
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
