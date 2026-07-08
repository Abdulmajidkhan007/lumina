/**
 * Lumina — EmptyState component
 *
 * Centered, theme-aware empty state with an Ionicons icon, title, subtitle,
 * and an optional action button. Used when a list or screen has no content.
 *
 * Usage:
 *   <EmptyState
 *     icon="image-outline"
 *     title="No posts yet"
 *     subtitle="When you share photos they'll appear here."
 *     action={{ label: 'Create post', onPress: () => {} }}
 *   />
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  /** Ionicons icon name */
  icon?: string;
  title: string;
  subtitle?: string;
  action?: EmptyStateAction;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmptyState({
  icon = 'albums-outline',
  title,
  subtitle,
  action,
}: EmptyStateProps): React.JSX.Element {
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
          color={theme.colors.textTertiary}
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
        {title}
      </Text>

      {subtitle !== undefined && subtitle !== '' ? (
        <Text
          variant="callout"
          color="secondary"
          align="center"
          style={{ marginBottom: theme.spacing.xl, maxWidth: 280 }}
        >
          {subtitle}
        </Text>
      ) : null}

      {action !== undefined ? (
        <Button
          label={action.label}
          variant="primary"
          size="md"
          onPress={action.onPress}
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
