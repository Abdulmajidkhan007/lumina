/**
 * Lumina — NotificationSectionHeader
 *
 * Lightweight section label used to group notifications by time bucket:
 * "Today", "This Week", or "Earlier".
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeBucket = 'Today' | 'This Week' | 'Earlier';

export interface NotificationSectionHeaderProps {
  title: TimeBucket;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NotificationSectionHeader = React.memo(
  function NotificationSectionHeader({
    title,
  }: NotificationSectionHeaderProps): React.JSX.Element {
    const theme = useTheme();

    return (
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.xs,
            backgroundColor: theme.colors.background,
          },
        ]}
        accessibilityRole="header"
      >
        <Text variant="overline" color="tertiary">
          {title.toUpperCase()}
        </Text>
      </View>
    );
  },
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
});
